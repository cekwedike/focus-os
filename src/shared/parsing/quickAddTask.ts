import { matchClientFromForClause } from '@shared/chat/parsers/matchClientName'
import { parseEstimateMinutes } from '@shared/chat/parsers/parseDuration'
import {
  hasResolvedEisenhower,
  isPrioritySkipped,
  parseEisenhowerFromText,
  stripEisenhowerTokens,
  type EisenhowerFlags,
} from '@shared/tasks/eisenhower'

export interface QuickAddClient {
  id: number
  name: string
}

export interface QuickAddParseOptions {
  /** Job selected in the UI when the text omits a client (Task Matrix). */
  defaultClientId?: number | null
  /** Fallback when no client is detected (chat flows). */
  fallbackClientId?: number
  /** Eisenhower flags selected in the UI when text omits priority. */
  defaultEisenhower?: EisenhowerFlags
}

export interface QuickAddParseResult {
  title: string
  clientId: number | null
  estimatedMinutes: number
  deadlineDate: string | null
  isUrgent: boolean | null
  isImportant: boolean | null
  skipPriority: boolean
  ambiguousClients?: string[]
}

const DEFAULT_ESTIMATE_MINUTES = 30

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

function resolveQuickAddOptions(
  options: QuickAddParseOptions | number | undefined
): QuickAddParseOptions {
  if (typeof options === 'number') {
    return { fallbackClientId: options }
  }
  return options ?? {}
}

function resolveClientId(
  matchedClientId: number | null,
  options: QuickAddParseOptions
): number | null {
  if (matchedClientId !== null) {
    return matchedClientId
  }
  if (options.defaultClientId != null) {
    return options.defaultClientId
  }
  if (options.fallbackClientId != null) {
    return options.fallbackClientId
  }
  return null
}

function resolveEisenhower(
  parsed: EisenhowerFlags | 'skip' | null,
  options: QuickAddParseOptions
): Pick<QuickAddParseResult, 'isUrgent' | 'isImportant' | 'skipPriority'> {
  if (parsed === 'skip') {
    return { isUrgent: null, isImportant: null, skipPriority: true }
  }

  if (parsed && parsed.isUrgent != null && parsed.isImportant != null) {
    return {
      isUrgent: parsed.isUrgent,
      isImportant: parsed.isImportant,
      skipPriority: false,
    }
  }

  const defaults = options.defaultEisenhower
  if (defaults && defaults.isUrgent != null && defaults.isImportant != null) {
    return {
      isUrgent: defaults.isUrgent,
      isImportant: defaults.isImportant,
      skipPriority: false,
    }
  }

  return { isUrgent: null, isImportant: null, skipPriority: false }
}

export function parseQuickAddTask(
  input: string,
  clients: QuickAddClient[],
  options?: QuickAddParseOptions | number
): QuickAddParseResult {
  const resolvedOptions = resolveQuickAddOptions(options)
  const raw = stripAddTaskPrefix(input.trim())
  const skipPriority = isPrioritySkipped(raw)
  const eisenhowerParsed = parseEisenhowerFromText(raw)

  let working = stripEisenhowerTokens(raw)

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

  const matchedClientId =
    clientOutcome.status === 'matched' ? clientOutcome.client.id : null

  const eisenhower = resolveEisenhower(skipPriority ? 'skip' : eisenhowerParsed, resolvedOptions)

  return {
    title: working || raw,
    clientId: resolveClientId(matchedClientId, resolvedOptions),
    estimatedMinutes: estimate,
    deadlineDate,
    ...eisenhower,
    ambiguousClients,
  }
}

export function quickAddHasResolvedPriority(result: QuickAddParseResult): boolean {
  return result.skipPriority || hasResolvedEisenhower({
    isUrgent: result.isUrgent,
    isImportant: result.isImportant,
  })
}

export { parseEstimateMinutes } from '@shared/chat/parsers/parseDuration'
export { matchClientByName, matchClientFromForClause } from '@shared/chat/parsers/matchClientName'
