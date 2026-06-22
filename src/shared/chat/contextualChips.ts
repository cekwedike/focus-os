import type { QuickReplyChip } from '@shared/types/chat'
import { buildTaskPriorityQuickReplies } from './intents/taskPriorityIntent'

export type ChipContextKey =
  | 'welcome_active_skippable'
  | 'welcome_active_work'
  | 'welcome_active_faith'
  | 'welcome_standby'
  | 'pre_completion_warning'
  | 'auto_progression'
  | 'manual_complete'
  | 'extend_confirmed'
  | 'skip_confirmed'
  | 'end_of_day'
  | 'awaiting_wake'
  | 'awaiting_task_priority'
  | 'wake_no_schedule'
  | 'long_break'

export interface WelcomeChipInput {
  activeBlock: {
    block_type: string
    protected_subtype: string | null
    skippable: boolean
  } | null
}

export function resolveWelcomeChipContext(input: WelcomeChipInput): ChipContextKey {
  if (!input.activeBlock) {
    return 'welcome_standby'
  }

  if (input.activeBlock.block_type === 'protected' && input.activeBlock.protected_subtype === 'faith') {
    return 'welcome_active_faith'
  }

  if (input.activeBlock.skippable) {
    return 'welcome_active_skippable'
  }

  return 'welcome_active_work'
}

export function resolveContextualChips(chipContext: ChipContextKey): QuickReplyChip[] {
  switch (chipContext) {
    case 'welcome_active_skippable':
      return [
        { label: 'Extend +5', sendText: 'Extend by 5' },
        { label: "I'm Done", sendText: "I'm done" },
        { label: 'Skip', sendText: 'Skip this' },
      ]
    case 'welcome_active_work':
      return [
        { label: 'Extend +5', sendText: 'Extend by 5' },
        { label: 'Mark Done', sendText: "I'm done" },
        { label: "What's Next After This?", sendText: "What's next after this?" },
      ]
    case 'welcome_active_faith':
      return [
        { label: 'Log Faith', sendText: 'Log faith' },
        { label: 'Extend +5', sendText: 'Extend by 5' },
        { label: 'Mark Done', sendText: "I'm done" },
      ]
    case 'welcome_standby':
      return [
        { label: "What's next?", sendText: "What's next?" },
        { label: "Today's plan", sendText: "Show today's schedule" },
      ]
    case 'pre_completion_warning':
      return [
        { label: 'Extend +5', sendText: 'Extend by 5' },
        { label: "I'm Done Early", sendText: "I'm done early" },
        { label: 'Got It', sendText: 'Got it' },
      ]
    case 'auto_progression':
    case 'manual_complete':
      return [
        { label: "What's Next?", sendText: "What's next?" },
        { label: 'How Am I Doing Today?', sendText: 'How am I doing today?' },
        { label: 'Take a Break', sendText: 'Taking a break for 15 minutes' },
      ]
    case 'extend_confirmed':
      return [
        { label: "I'm Done Early", sendText: "I'm done early" },
        { label: 'Got It', sendText: 'Got it' },
      ]
    case 'skip_confirmed':
      return [
        { label: 'Why Was That Skippable?', sendText: 'Why was that skippable?' },
        { label: "Show Today's Schedule", sendText: "Show today's schedule" },
        { label: 'Continue', sendText: 'Continue' },
      ]
    case 'end_of_day':
      return [
        { label: 'How Am I Doing Today?', sendText: 'How am I doing today?' },
        { label: "Show Today's Schedule", sendText: "Show today's schedule" },
      ]
    case 'awaiting_wake':
      return [
        { label: '7:00', sendText: '7' },
        { label: '8:00', sendText: '8' },
        { label: '9:00', sendText: '9' },
        { label: '9:30', sendText: '9:30' },
      ]
    case 'awaiting_task_priority':
      return buildTaskPriorityQuickReplies()
    case 'wake_no_schedule':
      return [
        { label: "What's My Day Look Like?", sendText: "What's my day look like?" },
        { label: 'Add a Task', sendText: 'Add a task' },
        { label: 'Open Settings', sendText: '/menu' },
      ]
    case 'long_break':
      return [
        { label: "I'm Back", sendText: "I'm back" },
        { label: "What's Next?", sendText: "What's next?" },
      ]
    default:
      return []
  }
}
