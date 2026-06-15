import { matchClientFromForClause } from '@shared/chat/parsers/matchClientName'
import { parseEstimateMinutes } from '@shared/chat/parsers/parseDuration'

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
  ambiguousClients?: string[]
}

const DEFAULT_ESTIMATE_MINUTES = 30
const DEFAULT_PRIORITY = 3

const ADD_TASK_PREFIX_PATTERNS = [
  /^add\s+/i,
  /^remind me to\s+/i,
  /^i need to\s+/i,
]

function stripMatched(text: string, pattern: RegExp): string {
  return text.replace(pattern, '').replace(/\s+/g, ' ').trim()
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

export function stripAddTaskPrefix(input: string): string {
  let working = input.trim()
  for (const pattern of ADD_TASK_PREFIX_PATTERNS) {
    working = working.replace(pattern, '').trim()
  }
  return working
}

export function parseQuickAddTask(
  input: string,
  clients: QuickAddClient[],
  unassignedClientId: number
): QuickAddParseResult {
  let working = stripAddTaskPrefix(input.trim())

  const estimate = parseEstimateMinutes(working) ?? DEFAULT_ESTIMATE_MINUTES
  working = stripMatched(working, /\d+(?:\.\d+)?\s*h(?:ours?)?/i)
  working = stripMatched(working, /\d+\s*m(?:in(?:utes?)?)?/i)
  working = stripMatched(working, /\bhalf\s+(?:an?\s+)?hour\b/i)

  const deadlineDate = parseDeadline(working)
  working = stripMatched(working, /\bby\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i)
  working = stripMatched(working, /\btoday\b/i)
  working = stripMatched(working, /\btomorrow\b/i)

  const clientOutcome = matchClientFromForClause(working, clients)
  let ambiguousClients: string[] | undefined

  if (clientOutcome.status === 'ambiguous') {
    ambiguousClients = clientOutcome.candidates.map((client) => client.name)
  }

  if (clientOutcome.status === 'matched') {
    working = stripMatched(working, /\bfor\s+.+$/i)
  }

  return {
    title: working || input.trim(),
    clientId:
      clientOutcome.status === 'matched' ? clientOutcome.client.id : unassignedClientId,
    estimatedMinutes: estimate,
    deadlineDate,
    priority: DEFAULT_PRIORITY,
    ambiguousClients,
  }
}

export { parseEstimateMinutes } from '@shared/chat/parsers/parseDuration'
export { matchClientByName, matchClientFromForClause } from '@shared/chat/parsers/matchClientName'
