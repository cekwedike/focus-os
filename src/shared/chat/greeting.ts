export type TimeOfDayPeriod = 'morning' | 'afternoon' | 'evening'

export function getTimeOfDayPeriod(hour: number): TimeOfDayPeriod {
  if (hour >= 17 || hour < 5) {
    return 'evening'
  }
  if (hour < 12) {
    return 'morning'
  }
  return 'afternoon'
}

function periodLabel(period: TimeOfDayPeriod): string {
  switch (period) {
    case 'morning':
      return 'Good morning'
    case 'afternoon':
      return 'Good afternoon'
    case 'evening':
      return 'Good evening'
  }
}

export function buildTimeOfDayGreeting(date: Date, userDisplayName?: string): string {
  const period = getTimeOfDayPeriod(date.getHours())
  const label = periodLabel(period)
  const trimmedName = userDisplayName?.trim()

  if (trimmedName) {
    return `${label}, ${trimmedName}.`
  }

  return `${label}.`
}

export function buildWakeTimeFollowUp(): string {
  return 'What time did you wake up? Just tell me — like 9 or 9:30.'
}

export function buildMorningOpening(userDisplayName: string | undefined, now: Date): string {
  const period = getTimeOfDayPeriod(now.getHours())
  const greeting = buildTimeOfDayGreeting(now, userDisplayName)
  if (period === 'morning') {
    return `${greeting} What time did you wake up?`
  }
  return `${greeting} When did you get up today?`
}

export interface WelcomeBackBlockInfo {
  title: string
  planned_end: string
}

export interface WelcomeBackInput {
  wakeTimeLogged: boolean
  hasSchedule: boolean
  activeBlock: WelcomeBackBlockInfo | null
  nextBlock: WelcomeBackBlockInfo | null
  longBreakActive?: boolean
  now?: Date
}

import { formatDurationProse } from '@shared/utils/remainingTime'

export function minutesUntil(isoEnd: string, now: Date): number {
  const endMs = new Date(isoEnd).getTime()
  const diffMs = endMs - now.getTime()
  return Math.max(0, Math.ceil(diffMs / 60_000))
}

export function buildWelcomeBackMessage(input: WelcomeBackInput): string {
  const now = input.now ?? new Date()
  const parts: string[] = []

  if (input.longBreakActive) {
    parts.push('You are on a long break right now.')
    return parts.join(' ')
  }

  if (!input.wakeTimeLogged) {
    return buildTimeOfDayGreeting(now)
  }

  if (!input.hasSchedule) {
    return (
      "I have your wake time, but I haven't built today's plan yet. " +
      'Tell me your wake time again and I\'ll lay out the day for you.'
    )
  }

  if (input.activeBlock) {
    const minutesLeft = minutesUntil(input.activeBlock.planned_end, now)
    parts.push(
      `You're on ${input.activeBlock.title} — ${formatDurationProse(minutesLeft)} left.`
    )
    return parts.join(' ')
  }

  if (input.nextBlock) {
    parts.push(`${input.nextBlock.title} is up next. I'll let you know when it's time.`)
    return parts.join(' ')
  }

  return "You're between blocks. I'll nudge you when the next one starts."
}

export interface ProactiveGreetingInput {
  wakeTimeLogged: boolean
  userDisplayName?: string
  welcomeBack: WelcomeBackInput
  now?: Date
}

export function buildProactiveGreetingMessages(input: ProactiveGreetingInput): string[] {
  const now = input.now ?? new Date()

  if (!input.wakeTimeLogged) {
    return [buildMorningOpening(input.userDisplayName, now)]
  }

  return [buildWelcomeBackMessage(input.welcomeBack)]
}
