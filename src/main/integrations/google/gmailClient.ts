import { getValidAccessToken } from './tokenManager'

interface GmailMessageListResponse {
  messages?: Array<{ id: string; threadId?: string }>
}

interface GmailMessageResponse {
  id: string
  threadId?: string
  snippet?: string
  internalDate?: string
  labelIds?: string[]
  payload?: {
    headers?: Array<{ name: string; value: string }>
  }
}

export interface FetchedEmailMessage {
  externalId: string
  threadId: string | null
  subject: string
  fromAddress: string
  receivedAt: string
  snippet: string | null
  isRead: boolean
}

function headerValue(
  headers: Array<{ name: string; value: string }> | undefined,
  name: string
): string | null {
  const match = headers?.find((header) => header.name.toLowerCase() === name.toLowerCase())
  return match?.value ?? null
}

function parseFromAddress(raw: string | null): string {
  if (!raw) {
    return 'unknown'
  }
  const emailMatch = raw.match(/<([^>]+)>/)
  return emailMatch?.[1] ?? raw.trim()
}

export async function fetchRecentInboxMessages(
  tokenKeyRef: string,
  sinceIso: string,
  maxResults = 30
): Promise<FetchedEmailMessage[]> {
  const accessToken = await getValidAccessToken(tokenKeyRef)
  const sinceSeconds = Math.floor(new Date(sinceIso).getTime() / 1000)
  const query = `in:inbox after:${sinceSeconds}`

  const listParams = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
  })

  const listResponse = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${listParams}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!listResponse.ok) {
    const text = await listResponse.text()
    throw new Error(`Gmail list failed: ${text}`)
  }

  const listData = (await listResponse.json()) as GmailMessageListResponse
  const results: FetchedEmailMessage[] = []

  for (const message of listData.messages ?? []) {
    const detailResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!detailResponse.ok) {
      continue
    }

    const detail = (await detailResponse.json()) as GmailMessageResponse
    const headers = detail.payload?.headers
    const subject = headerValue(headers, 'Subject') ?? '(No subject)'
    const fromRaw = headerValue(headers, 'From')
    const receivedAt = detail.internalDate
      ? new Date(Number(detail.internalDate)).toISOString()
      : new Date().toISOString()

    results.push({
      externalId: detail.id,
      threadId: detail.threadId ?? null,
      subject,
      fromAddress: parseFromAddress(fromRaw),
      receivedAt,
      snippet: detail.snippet ?? null,
      isRead: !detail.labelIds?.includes('UNREAD'),
    })
  }

  return results.sort((left, right) => right.receivedAt.localeCompare(left.receivedAt))
}
