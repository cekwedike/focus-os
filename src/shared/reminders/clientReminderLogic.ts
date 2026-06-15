export interface ClientReminderConfig {
  reminderEnabled: boolean
  reminderIntervalMinutes: number
  reminderLabel: string | null
  clientName: string
}

export interface ClientReminderState {
  activeBlockId: number | null
  elapsedSeconds: number
}

export interface ClientReminderTickInput {
  state: ClientReminderState
  activeBlockId: number | null
  client: ClientReminderConfig | null
  workPaused: boolean
  longBreakActive: boolean
}

export interface ClientReminderTickResult {
  nextState: ClientReminderState
  shouldFire: boolean
  message: string | null
}

export function formatClientReminderMessage(
  label: string | null | undefined,
  clientName: string
): string {
  const trimmedLabel = label?.trim()
  const displayLabel = trimmedLabel && trimmedLabel.length > 0 ? trimmedLabel : 'Check in'
  return `${displayLabel} - ${clientName}`
}

export function resolveClientReminderTick(input: ClientReminderTickInput): ClientReminderTickResult {
  const { activeBlockId, client, workPaused, longBreakActive } = input

  if (
    workPaused ||
    longBreakActive ||
    activeBlockId === null ||
    !client ||
    !client.reminderEnabled ||
    client.reminderIntervalMinutes <= 0
  ) {
    return {
      nextState: { activeBlockId: null, elapsedSeconds: 0 },
      shouldFire: false,
      message: null,
    }
  }

  if (input.state.activeBlockId !== activeBlockId) {
    return {
      nextState: { activeBlockId, elapsedSeconds: 1 },
      shouldFire: false,
      message: null,
    }
  }

  const nextElapsed = input.state.elapsedSeconds + 1
  const thresholdSeconds = client.reminderIntervalMinutes * 60

  if (nextElapsed >= thresholdSeconds) {
    return {
      nextState: { activeBlockId, elapsedSeconds: 0 },
      shouldFire: true,
      message: formatClientReminderMessage(client.reminderLabel, client.clientName),
    }
  }

  return {
    nextState: { activeBlockId, elapsedSeconds: nextElapsed },
    shouldFire: false,
    message: null,
  }
}
