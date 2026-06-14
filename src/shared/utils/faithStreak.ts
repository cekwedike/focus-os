export interface FaithStreakEntry {
  entry_date: string
  bible_reference: string | null
}

export interface FaithStreakResult {
  currentStreak: number
  longestStreak: number
}

export function isQualifyingFaithEntry(entry: FaithStreakEntry): boolean {
  return Boolean(entry.bible_reference?.trim())
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T12:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function qualifyingDates(entries: FaithStreakEntry[]): Set<string> {
  const dates = new Set<string>()
  for (const entry of entries) {
    if (isQualifyingFaithEntry(entry)) {
      dates.add(entry.entry_date)
    }
  }
  return dates
}

function streakEndingAt(qualifying: Set<string>, endDate: string): number {
  let streak = 0
  let cursor = endDate
  while (qualifying.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

function longestStreakFromDates(qualifying: Set<string>): number {
  if (qualifying.size === 0) {
    return 0
  }

  const sorted = [...qualifying].sort()
  let longest = 1
  let current = 1

  for (let index = 1; index < sorted.length; index += 1) {
    const prev = sorted[index - 1]
    const next = sorted[index]
    const expectedNext = addDays(prev, 1)
    if (next === expectedNext) {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }

  return longest
}

export function calculateFaithStreaks(
  entries: FaithStreakEntry[],
  todayDate: string
): FaithStreakResult {
  const qualifying = qualifyingDates(entries)

  if (qualifying.size === 0) {
    return { currentStreak: 0, longestStreak: 0 }
  }

  const longestStreak = longestStreakFromDates(qualifying)

  let currentStreak = 0
  if (qualifying.has(todayDate)) {
    currentStreak = streakEndingAt(qualifying, todayDate)
  } else {
    const yesterday = addDays(todayDate, -1)
    if (qualifying.has(yesterday)) {
      currentStreak = streakEndingAt(qualifying, yesterday)
    }
  }

  return { currentStreak, longestStreak }
}
