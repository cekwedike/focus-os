import type { NotificationAction } from '@shared/types/notifications'
import type { QuickReplyChip } from '@shared/types/chat'

export const MICRO_BREAK_NOTIFICATION_ACTIONS: NotificationAction[] = [
  { id: 'micro_break.read', label: 'Read' },
  { id: 'micro_break.walk', label: 'Walk' },
  { id: 'micro_break.call', label: 'Call/Text Someone' },
  { id: 'micro_break.messages', label: 'Check Messages' },
  { id: 'micro_break.doomscroll', label: 'Short Doomscroll' },
  { id: 'micro_break.skip', label: 'Skip' },
]

export const CHECK_IN_DONE_ACTION: NotificationAction = {
  id: 'check_in.done',
  label: 'Done',
}

export const BLOCK_WARNING_ACTIONS: NotificationAction[] = [
  { id: 'block.extend_5', label: 'Extend +5', sendText: 'Extend by 5' },
  { id: 'block.done_early', label: "I'm Done Early", sendText: "I'm done early" },
  { id: 'block.got_it', label: 'Got It', sendText: 'Got it' },
]

export const FAITH_REMINDER_ACTIONS: NotificationAction[] = [
  { id: 'faith.log', label: 'Log Faith' },
  { id: 'faith.got_it', label: 'Got It' },
]

export const STALENESS_GOT_IT_ACTION: NotificationAction = {
  id: 'staleness.got_it',
  label: 'Got It',
}

export function mapChipsToProgressionActions(
  chips: QuickReplyChip[],
  chipContext: string
): { actions: NotificationAction[]; sendTextByActionId: Record<string, string> } {
  const sendTextByActionId: Record<string, string> = {}
  const actions = chips.map((chip, index) => {
    const id = `intent.${chipContext}.${index}`
    if (chip.sendText) {
      sendTextByActionId[id] = chip.sendText
    }
    return {
      id,
      label: chip.label,
      sendText: chip.sendText,
    }
  })

  return { actions, sendTextByActionId }
}
