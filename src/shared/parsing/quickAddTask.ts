export interface QuickAddClient {
  id: number
  name: string
}

export interface QuickAddParseResult {
  title: string
  clientId: number | null
  estimatedMinutes: number
  deadlineDate: string | null
  priority: number
}

const DEFAULT_ESTIMATE_MINUTES = 30
const DEFAULT_PRIORITY = 3

function stripMatched(text: string, pattern: RegExp): string {
  return text.replace(pattern, '').replace(/\s+/g, ' ').trim()
}

function parseEstimateMinutes(input: string): number | null {
  const hourMatch = input.match(/(\d+(?:\.\d+)?)\s*h(?:ours?)?/i)
  if (hourMatch) {
    return Math.round(Number(hourMatch[1]) * 60)
  }

  const minuteMatch = input.match(/(\d+)\s*m(?:in(?:utes?)?)?/i)
  if (minuteMatch) {
    return Number(minuteMatch[1])
  }

  return null
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function parseDeadline(input: string, referenceDate = new Date()): string | null {
  const lower = input.toLowerCase()

  if (/\btoday\b/.test(lower)) {
    return formatDate(referenceDate)
  }

  if (/\btomorrow\b/.test(lower)) {
    const tomorrow = new Date(referenceDate)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return formatDate(tomorrow)
  }

  const weekdayMatch = lower.match(/\bby\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/)
  if (weekdayMatch) {
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const target = weekdays.indexOf(weekdayMatch[1])
    const current = referenceDate.getDay()
    let delta = target - current
    if (delta <= 0) {
      delta += 7
    }
    const deadline = new Date(referenceDate)
    deadline.setDate(deadline.getDate() + delta)
    return formatDate(deadline)
  }

  return null
}

function matchClient(input: string, clients: QuickAddClient[]): QuickAddClient | null {
  const forMatch = input.match(/\bfor\s+(.+?)(?:\s*$)/i)
  if (!forMatch) {
    return null
  }

  const query = forMatch[1].trim().toLowerCase()
  const exact = clients.find((client) => client.name.toLowerCase() === query)
  if (exact) {
    return exact
  }

  return (
    clients.find((client) => client.name.toLowerCase().includes(query)) ??
    clients.find((client) => query.includes(client.name.toLowerCase())) ??
    null
  )
}

export function parseQuickAddTask(
  input: string,
  clients: QuickAddClient[],
  unassignedClientId: number
): QuickAddParseResult {
  let working = input.trim()

  const estimate = parseEstimateMinutes(working) ?? DEFAULT_ESTIMATE_MINUTES
  working = stripMatched(working, /\d+(?:\.\d+)?\s*h(?:ours?)?/i)
  working = stripMatched(working, /\d+\s*m(?:in(?:utes?)?)?/i)

  const deadlineDate = parseDeadline(working)
  working = stripMatched(working, /\bby\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i)
  working = stripMatched(working, /\btoday\b/i)
  working = stripMatched(working, /\btomorrow\b/i)

  const client = matchClient(working, clients)
  if (client) {
    working = stripMatched(working, /\bfor\s+.+$/i)
  }

  return {
    title: working || input.trim(),
    clientId: client?.id ?? unassignedClientId,
    estimatedMinutes: estimate,
    deadlineDate,
    priority: DEFAULT_PRIORITY,
  }
}
