export type CheckInPhase = 'idle' | 'counting' | 'due'

export interface CheckInClientConfig {
  clientId: number
  clientName: string
  reminderLabel: string | null
  reminderIntervalMinutes: number
  windowStartMs: number
  windowEndMs: number
  checkInDate: string
}

export interface CheckInRuntimeState {
  clientId: number
  phase: CheckInPhase
  countdownAnchorMs: number
  dueAtMs: number | null
  notifiedDue: boolean
  checkInDate: string
}

export interface DueCheckInEntry {
  clientId: number
  clientName: string
  label: string
  dueAt: string
  overdueMinutes: number
}

export interface CheckInTickResult {
  nextState: CheckInRuntimeState
  becameDue: boolean
  dueEntry: DueCheckInEntry | null
}

export function displayReminderLabel(label: string | null | undefined): string {
  const trimmed = label?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : 'Check in'
}

export function formatCheckInDueChatMessage(label: string, clientName: string): string {
  return `${label} for ${clientName} - whenever you're ready. Tap Done in the banner above, or reply: done with ${clientName} check.`
}

export function formatCheckInNotificationBody(label: string, clientName: string): string {
  return `${label} - ${clientName}`
}

export function formatDueBannerText(
  label: string,
  clientName: string,
  overdueMinutes: number
): { title: string; subtitle: string } {
  const title = `${label} for ${clientName}`
  if (overdueMinutes <= 0) {
    return { title, subtitle: 'Due just now' }
  }
  return { title, subtitle: `Overdue by ${overdueMinutes} min` }
}

function computeOverdueMinutes(nowMs: number, dueAtMs: number): number {
  return Math.max(0, Math.floor((nowMs - dueAtMs) / 60_000))
}

function buildDueEntry(
  config: CheckInClientConfig,
  dueAtMs: number,
  nowMs: number
): DueCheckInEntry {
  const label = displayReminderLabel(config.reminderLabel)
  return {
    clientId: config.clientId,
    clientName: config.clientName,
    label,
    dueAt: new Date(dueAtMs).toISOString(),
    overdueMinutes: computeOverdueMinutes(nowMs, dueAtMs),
  }
}

export function resolveInitialAnchorMs(
  windowStartMs: number,
  lastAcknowledgedAtMs: number | null
): number {
  if (lastAcknowledgedAtMs === null) {
    return windowStartMs
  }
  return Math.max(windowStartMs, lastAcknowledgedAtMs)
}

export function resolveCheckInTick(input: {
  config: CheckInClientConfig
  state: CheckInRuntimeState | null
  nowMs: number
  lastAcknowledgedAtMs: number | null
  inWindow: boolean
}): CheckInTickResult {
  const { config, nowMs, lastAcknowledgedAtMs, inWindow } = input

  if (!inWindow || config.reminderIntervalMinutes <= 0) {
    return {
      nextState: {
        clientId: config.clientId,
        phase: 'idle',
        countdownAnchorMs: config.windowStartMs,
        dueAtMs: null,
        notifiedDue: false,
        checkInDate: config.checkInDate,
      },
      becameDue: false,
      dueEntry: null,
    }
  }

  const intervalMs = config.reminderIntervalMinutes * 60_000
  const anchorMs = resolveInitialAnchorMs(config.windowStartMs, lastAcknowledgedAtMs)
  const dueThresholdMs = anchorMs + intervalMs

  const state = input.state
  const windowChanged =
    !state ||
    state.checkInDate !== config.checkInDate ||
    state.clientId !== config.clientId

  if (windowChanged || state.phase === 'idle') {
    if (nowMs >= dueThresholdMs) {
      const dueAtMs = dueThresholdMs
      return {
        nextState: {
          clientId: config.clientId,
          phase: 'due',
          countdownAnchorMs: anchorMs,
          dueAtMs,
          notifiedDue: false,
          checkInDate: config.checkInDate,
        },
        becameDue: true,
        dueEntry: buildDueEntry(config, dueAtMs, nowMs),
      }
    }

    return {
      nextState: {
        clientId: config.clientId,
        phase: 'counting',
        countdownAnchorMs: anchorMs,
        dueAtMs: null,
        notifiedDue: false,
        checkInDate: config.checkInDate,
      },
      becameDue: false,
      dueEntry: null,
    }
  }

  if (state.phase === 'due' && state.dueAtMs !== null) {
    return {
      nextState: state,
      becameDue: false,
      dueEntry: buildDueEntry(config, state.dueAtMs, nowMs),
    }
  }

  if (state.phase === 'counting') {
    const countingAnchor = state.countdownAnchorMs
    const countingDueAt = countingAnchor + intervalMs
    if (nowMs >= countingDueAt) {
      return {
        nextState: {
          ...state,
          phase: 'due',
          dueAtMs: countingDueAt,
          notifiedDue: false,
        },
        becameDue: true,
        dueEntry: buildDueEntry(config, countingDueAt, nowMs),
      }
    }
  }

  return {
    nextState: state,
    becameDue: false,
    dueEntry: null,
  }
}

export function resolveAcknowledgedState(input: {
  config: CheckInClientConfig
  nowMs: number
}): CheckInRuntimeState {
  return {
    clientId: input.config.clientId,
    phase: 'counting',
    countdownAnchorMs: input.nowMs,
    dueAtMs: null,
    notifiedDue: false,
    checkInDate: input.config.checkInDate,
  }
}

export function listDueEntries(
  states: Map<number, CheckInRuntimeState>,
  configs: Map<number, CheckInClientConfig>,
  nowMs: number
): DueCheckInEntry[] {
  const entries: DueCheckInEntry[] = []

  for (const [clientId, state] of states) {
    if (state.phase !== 'due' || state.dueAtMs === null) {
      continue
    }
    const config = configs.get(clientId)
    if (!config) {
      continue
    }
    entries.push(buildDueEntry(config, state.dueAtMs, nowMs))
  }

  return entries.sort((left, right) => left.clientName.localeCompare(right.clientName))
}
