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
  return 'What time did you wake up?'
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
    parts.push('Welcome back. You are on a long break right now.')
    return parts.join(' ')
  }

  if (!input.wakeTimeLogged) {
    return buildTimeOfDayGreeting(now)
  }

  if (!input.hasSchedule) {
    return (
      "Welcome back. Your wake time is logged, but today's schedule isn't built yet. " +
      'Open Daily Workspace to generate it, or tell me your wake time again to rebuild.'
    )
  }

  if (input.activeBlock) {
    const minutesLeft = minutesUntil(input.activeBlock.planned_end, now)
    parts.push(
      `Welcome back. You're in your ${input.activeBlock.title} block, ${formatDurationProse(minutesLeft)} left.`
    )
    return parts.join(' ')
  }

  if (input.nextBlock) {
    parts.push(`Welcome back. ${input.nextBlock.title} is up next.`)
    return parts.join(' ')
  }

  return "Welcome back. You're between blocks right now."
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
    return [buildTimeOfDayGreeting(now, input.userDisplayName), buildWakeTimeFollowUp()]
  }

  return [buildWelcomeBackMessage(input.welcomeBack)]
}
