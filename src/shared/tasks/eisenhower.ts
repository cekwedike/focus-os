export type EisenhowerQuadrant = 'do_first' | 'schedule' | 'delegate' | 'eliminate' | 'unset'

export interface EisenhowerFlags {
  isUrgent: boolean | null
  isImportant: boolean | null
}

export interface EisenhowerQuadrantMeta {
  id: Exclude<EisenhowerQuadrant, 'unset'>
  label: string
  shortLabel: string
  subtitle: string
  color: string
  priority: number
}

export const EISENHOWER_QUADRANTS: Record<Exclude<EisenhowerQuadrant, 'unset'>, EisenhowerQuadrantMeta> =
  {
    do_first: {
      id: 'do_first',
      label: 'Do First',
      shortLabel: 'Q1',
      subtitle: 'Urgent & Important',
      color: '#f87171',
      priority: 1,
    },
    schedule: {
      id: 'schedule',
      label: 'Schedule',
      shortLabel: 'Q2',
      subtitle: 'Important, Not Urgent',
      color: '#00e5a8',
      priority: 2,
    },
    delegate: {
      id: 'delegate',
      label: 'Delegate',
      shortLabel: 'Q3',
      subtitle: 'Urgent, Not Important',
      color: '#fbbf24',
      priority: 3,
    },
    eliminate: {
      id: 'eliminate',
      label: 'Later',
      shortLabel: 'Q4',
      subtitle: 'Not Urgent, Not Important',
      color: '#64748b',
      priority: 4,
    },
  }

export const UNSET_EISENHOWER_PRIORITY = 5

const QUADRANT_PATTERNS: Array<{
  quadrant: Exclude<EisenhowerQuadrant, 'unset'>
  patterns: RegExp[]
}> = [
  {
    quadrant: 'do_first',
    patterns: [
      /\bq\s*1\b/i,
      /\bquadrant\s*1\b/i,
      /\bdo\s+first\b/i,
      /\burgent\s+and\s+important\b/i,
      /\burgent\s*\+\s*important\b/i,
      /\burgent\s*,\s*important\b/i,
    ],
  },
  {
    quadrant: 'schedule',
    patterns: [
      /\bq\s*2\b/i,
      /\bquadrant\s*2\b/i,
      /\bschedule\b/i,
      /\bimportant\s+but\s+not\s+urgent\b/i,
      /\bimportant\s*,\s*not\s+urgent\b/i,
      /\bnot\s+urgent\s+but\s+important\b/i,
    ],
  },
  {
    quadrant: 'delegate',
    patterns: [
      /\bq\s*3\b/i,
      /\bquadrant\s*3\b/i,
      /\bdelegate\b/i,
      /\burgent\s+but\s+not\s+important\b/i,
      /\burgent\s*,\s*not\s+important\b/i,
      /\bnot\s+important\s+but\s+urgent\b/i,
    ],
  },
  {
    quadrant: 'eliminate',
    patterns: [
      /\bq\s*4\b/i,
      /\bquadrant\s*4\b/i,
      /\b(eliminate|later|low\s+priority)\b/i,
      /\bnot\s+urgent\s+and\s+not\s+important\b/i,
      /\bnot\s+urgent\s*,\s*not\s+important\b/i,
    ],
  },
]

const SKIP_PRIORITY_PATTERNS = [
  /\b(no|skip|without)\s+priority\b/i,
  /\b(inbox|unprioritized|no\s+quadrant)\b/i,
  /\bjust\s+add\b/i,
]

const STRIP_PRIORITY_PATTERNS = [
  ...QUADRANT_PATTERNS.flatMap((entry) => entry.patterns),
  ...SKIP_PRIORITY_PATTERNS,
  /\burgent\b/i,
  /\bimportant\b/i,
  /\basap\b/i,
  /\bcritical\b/i,
  /\bhigh\s+priority\b/i,
]

export function isPrioritySkipped(input: string): boolean {
  return SKIP_PRIORITY_PATTERNS.some((pattern) => pattern.test(input))
}

export function eisenhowerFromQuadrant(
  quadrant: Exclude<EisenhowerQuadrant, 'unset'>
): EisenhowerFlags {
  switch (quadrant) {
    case 'do_first':
      return { isUrgent: true, isImportant: true }
    case 'schedule':
      return { isUrgent: false, isImportant: true }
    case 'delegate':
      return { isUrgent: true, isImportant: false }
    case 'eliminate':
      return { isUrgent: false, isImportant: false }
  }
}

export function resolveQuadrant(flags: EisenhowerFlags): EisenhowerQuadrant {
  if (flags.isUrgent == null || flags.isImportant == null) {
    return 'unset'
  }
  if (flags.isUrgent && flags.isImportant) {
    return 'do_first'
  }
  if (!flags.isUrgent && flags.isImportant) {
    return 'schedule'
  }
  if (flags.isUrgent && !flags.isImportant) {
    return 'delegate'
  }
  return 'eliminate'
}

export function priorityFromEisenhower(flags: EisenhowerFlags): number {
  const quadrant = resolveQuadrant(flags)
  if (quadrant === 'unset') {
    return UNSET_EISENHOWER_PRIORITY
  }
  return EISENHOWER_QUADRANTS[quadrant].priority
}

export function eisenhowerFromPriority(priority: number): EisenhowerFlags {
  if (priority <= 1) {
    return { isUrgent: true, isImportant: true }
  }
  if (priority === 2) {
    return { isUrgent: false, isImportant: true }
  }
  if (priority === 3) {
    return { isUrgent: true, isImportant: false }
  }
  if (priority === 4) {
    return { isUrgent: false, isImportant: false }
  }
  return { isUrgent: null, isImportant: null }
}

export function parseEisenhowerFromText(input: string): EisenhowerFlags | 'skip' | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  if (isPrioritySkipped(trimmed)) {
    return 'skip'
  }

  for (const entry of QUADRANT_PATTERNS) {
    if (entry.patterns.some((pattern) => pattern.test(trimmed))) {
      return eisenhowerFromQuadrant(entry.quadrant)
    }
  }

  const lower = trimmed.toLowerCase()
  const hasUrgent = /\b(urgent|asap|critical|emergency)\b/.test(lower)
  const hasImportant = /\b(important|key|strategic|high\s+impact)\b/.test(lower)

  if (hasUrgent && hasImportant) {
    return { isUrgent: true, isImportant: true }
  }
  if (hasImportant) {
    return { isUrgent: false, isImportant: true }
  }
  if (hasUrgent) {
    return { isUrgent: true, isImportant: false }
  }

  return null
}

export function stripEisenhowerTokens(input: string): string {
  let working = input.trim()
  for (const pattern of STRIP_PRIORITY_PATTERNS) {
    working = working.replace(pattern, ' ')
  }
  return working.replace(/\s+/g, ' ').trim()
}

export function hasResolvedEisenhower(
  flags: EisenhowerFlags,
  skipPriority = false
): boolean {
  if (skipPriority) {
    return true
  }
  return flags.isUrgent != null && flags.isImportant != null
}

export function formatQuadrantLabel(flags: EisenhowerFlags): string {
  const quadrant = resolveQuadrant(flags)
  if (quadrant === 'unset') {
    return 'Inbox'
  }
  return EISENHOWER_QUADRANTS[quadrant].label
}

export function formatQuadrantDetail(flags: EisenhowerFlags): string {
  const quadrant = resolveQuadrant(flags)
  if (quadrant === 'unset') {
    return 'No Eisenhower priority yet'
  }
  const meta = EISENHOWER_QUADRANTS[quadrant]
  return `${meta.label} · ${meta.subtitle}`
}

export function taskRowToEisenhower(task: {
  is_urgent: number | null
  is_important: number | null
}): EisenhowerFlags {
  return {
    isUrgent: task.is_urgent == null ? null : task.is_urgent === 1,
    isImportant: task.is_important == null ? null : task.is_important === 1,
  }
}
