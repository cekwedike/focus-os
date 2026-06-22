import type { IntentMatch } from '../routerContext'

const DURATION_PATTERN =
  /(?:find|when|fit|schedule).{0,30}?(\d+)\s*(?:-|–)?\s*(?:min|minute|minutes|hour|hours|hr|hrs)/i

function parseDurationMinutes(input: string): number {
  const match = input.match(DURATION_PATTERN)
  if (!match) {
    return 30
  }
  const value = Number(match[1])
  const isHours = /hour|hr/i.test(match[0])
  return isHours ? value * 60 : value
}

function parseTargetDate(input: string, today: string): string {
  if (/tomorrow/i.test(input)) {
    const date = new Date(`${today}T12:00:00`)
    date.setDate(date.getDate() + 1)
    return date.toISOString().slice(0, 10)
  }
  return today
}

export function matchFindMeetingSlotIntent(input: string, context: { today: string }): IntentMatch | null {
  const normalized = input.trim().toLowerCase()
  if (
    !/(find|when|fit|slot|meeting|call)/i.test(normalized) ||
    !/(meeting|call|slot|time)/i.test(normalized)
  ) {
    return null
  }

  return {
    intent: 'find_meeting_slot',
    requiresIpc: true,
    extracted: {
      durationMinutes: parseDurationMinutes(input),
      scheduleDate: parseTargetDate(input, context.today),
    },
  }
}
