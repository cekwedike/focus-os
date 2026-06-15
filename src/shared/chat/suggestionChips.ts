export type SuggestionChipState =
  | 'none'
  | 'awaiting_wake'
  | 'wake_no_schedule'
  | 'day_ready'
  | 'long_break'

export interface SuggestionChip {
  label: string
  sendText: string
}

export interface SuggestionChipContext {
  state: SuggestionChipState
  isTyping: boolean
  greetingComplete: boolean
}

export function resolveSuggestionChipState(input: {
  wakeTimeLogged: boolean
  hasSchedule: boolean
  longBreakActive: boolean
  isTyping: boolean
  greetingComplete: boolean
}): SuggestionChipState {
  if (!input.greetingComplete || input.isTyping) {
    return 'none'
  }

  if (input.longBreakActive) {
    return 'long_break'
  }

  if (!input.wakeTimeLogged) {
    return 'awaiting_wake'
  }

  if (!input.hasSchedule) {
    return 'wake_no_schedule'
  }

  return 'day_ready'
}

export function getSuggestionChips(context: SuggestionChipContext): SuggestionChip[] {
  switch (context.state) {
    case 'awaiting_wake':
      return [
        { label: 'Just woke up', sendText: 'Just woke up' },
        { label: '9am', sendText: '9am' },
        { label: '9:30', sendText: '9:30' },
      ]
    case 'wake_no_schedule':
      return [
        { label: "What's my day look like?", sendText: "What's my day look like?" },
        { label: 'Add a task', sendText: 'Add a task' },
        { label: 'Open settings', sendText: '/menu' },
      ]
    case 'day_ready':
      return [
        { label: "What's next?", sendText: "What's next?" },
        { label: 'Check my streak', sendText: "What's my streak?" },
        { label: 'Add a task', sendText: 'Add a task' },
      ]
    case 'long_break':
      return [
        { label: "I'm back", sendText: "I'm back" },
        { label: "What's next?", sendText: "What's next?" },
      ]
    case 'none':
    default:
      return []
  }
}
