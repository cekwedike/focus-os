import { parseDurationMinutes } from '../parsers/parseDuration'
import type { IntentMatch, LongBreakExtracted, RouterContext } from '../routerContext'

export function matchLongBreakIntent(input: string): IntentMatch | null {
  const trimmed = input.trim()

  let reason = 'Long break'
  let plannedMinutes: number | null = null

  const backInMatch = trimmed.match(/\bback in\s+(.+)$/i)
  if (backInMatch) {
    plannedMinutes = parseDurationMinutes(backInMatch[1])
  }

  const takingBreakMatch = trimmed.match(/\btaking a break(?:\s+for\s+(.+))?/i)
  if (takingBreakMatch) {
    reason = takingBreakMatch[1]?.trim() || reason
    const extracted: LongBreakExtracted = { reason, plannedMinutes }
    return { intent: 'long_break', extracted, requiresIpc: true }
  }

  const steppingOutMatch = trimmed.match(/\bstepping out(?:[,\s]+(.+))?/i)
  if (steppingOutMatch) {
    reason = steppingOutMatch[1]?.trim() || reason
    const extracted: LongBreakExtracted = { reason, plannedMinutes }
    return { intent: 'long_break', extracted, requiresIpc: true }
  }

  const longBreakMatch = trimmed.match(/\blong break(?:[,\s]+(.+))?/i)
  if (longBreakMatch) {
    reason = longBreakMatch[1]?.trim() || reason
    const extracted: LongBreakExtracted = { reason, plannedMinutes }
    return { intent: 'long_break', extracted, requiresIpc: true }
  }

  return null
}

export function matchEndBreakIntent(input: string, context: RouterContext): IntentMatch | null {
  if (!context.conversation.longBreakActive) {
    return null
  }

  if (/\b(i'?m back|im back|back now|ending break|end break)\b/i.test(input.trim())) {
    return { intent: 'end_break', requiresIpc: true }
  }

  return null
}
