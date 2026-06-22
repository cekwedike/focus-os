import { getValidAccessToken } from './tokenManager'

interface GoogleCalendarEvent {
  id: string
  summary?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  location?: string
  attendees?: Array<{ email?: string; displayName?: string }>
}

interface EventsListResponse {
  items?: GoogleCalendarEvent[]
}

export interface FetchedCalendarEvent {
  externalId: string
  calendarId: string
  title: string
  startAt: string
  endAt: string
  isAllDay: boolean
  location: string | null
  attendeesJson: string | null
}

function toLocalIso(iso: string): string {
  const date = new Date(iso)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

export async function fetchCalendarEvents(
  tokenKeyRef: string,
  calendarIds: string[],
  timeMin: string,
  timeMax: string
): Promise<FetchedCalendarEvent[]> {
  const accessToken = await getValidAccessToken(tokenKeyRef)
  const results: FetchedCalendarEvent[] = []

  for (const calendarId of calendarIds) {
    const params = new URLSearchParams({
      timeMin: new Date(timeMin).toISOString(),
      timeMax: new Date(timeMax).toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '100',
    })

    const encodedCalendarId = encodeURIComponent(calendarId)
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Calendar fetch failed for ${calendarId}: ${text}`)
    }

    const data = (await response.json()) as EventsListResponse
    for (const item of data.items ?? []) {
      const isAllDay = Boolean(item.start?.date && !item.start?.dateTime)
      const startRaw = item.start?.dateTime ?? item.start?.date
      const endRaw = item.end?.dateTime ?? item.end?.date
      if (!startRaw || !endRaw || !item.id) {
        continue
      }

      const startAt = isAllDay ? `${startRaw}T00:00:00` : toLocalIso(startRaw)
      const endAt = isAllDay ? `${endRaw}T23:59:59` : toLocalIso(endRaw)

      results.push({
        externalId: item.id,
        calendarId,
        title: item.summary?.trim() || '(No title)',
        startAt,
        endAt,
        isAllDay,
        location: item.location ?? null,
        attendeesJson: item.attendees ? JSON.stringify(item.attendees) : null,
      })
    }
  }

  return results.sort((left, right) => left.startAt.localeCompare(right.startAt))
}

export async function listGoogleCalendars(
  tokenKeyRef: string
): Promise<Array<{ id: string; summary: string; primary?: boolean }>> {
  const accessToken = await getValidAccessToken(tokenKeyRef)
  const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Calendar list failed: ${text}`)
  }

  const data = (await response.json()) as {
    items?: Array<{ id: string; summary: string; primary?: boolean }>
  }

  return (data.items ?? []).map((item) => ({
    id: item.id,
    summary: item.summary,
    primary: item.primary,
  }))
}
