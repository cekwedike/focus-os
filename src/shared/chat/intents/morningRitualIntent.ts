import type { IntentMatch } from '../routerContext'

export function matchConfirmMorningPlanIntent(input: string): IntentMatch | null {
  const normalized = input.trim().toLowerCase()
  if (
    /^(looks good|start my day|confirm plan|yes,? start|let's go|lets go)/i.test(normalized) ||
    normalized.includes('start my day')
  ) {
    return {
      intent: 'confirm_morning_plan',
      requiresIpc: true,
      extracted: {},
    }
  }
  return null
}

export function matchSnoozeIntent(input: string, context: { activeBlockId: number | null }): IntentMatch | null {
  const snoozeMatch = input.trim().match(/snooze(?:\s+(\d+))?/i)
  if (snoozeMatch) {
    const minutes = snoozeMatch[1] ? Number(snoozeMatch[1]) : 5
    return {
      intent: 'snooze_block',
      requiresIpc: true,
      extracted: { minutes, blockId: context.activeBlockId },
    }
  }

  if (/not ready/i.test(input.trim())) {
    return {
      intent: 'pause_auto_start',
      requiresIpc: true,
      extracted: { minutes: 30 },
    }
  }

  return null
}
