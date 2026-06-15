import { describe, expect, it } from 'vitest'
import {
  resolveAcknowledgedState,
  resolveCheckInTick,
  type CheckInClientConfig,
} from '../../src/shared/reminders/checkInCountdownLogic'

const baseConfig: CheckInClientConfig = {
  clientId: 1,
  clientName: 'PLNITUDE',
  reminderLabel: 'Check inbox',
  reminderIntervalMinutes: 30,
  windowStartMs: new Date('2026-06-14T12:00:00').getTime(),
  windowEndMs: new Date('2026-06-15T00:00:00').getTime(),
  checkInDate: '2026-06-14',
}

describe('resolveCheckInTick', () => {
  it('becomes due after the interval elapses', () => {
    const result = resolveCheckInTick({
      config: baseConfig,
      state: {
        clientId: 1,
        phase: 'counting',
        countdownAnchorMs: baseConfig.windowStartMs,
        dueAtMs: null,
        notifiedDue: false,
        checkInDate: '2026-06-14',
      },
      nowMs: baseConfig.windowStartMs + 30 * 60_000,
      lastAcknowledgedAtMs: null,
      inWindow: true,
    })

    expect(result.becameDue).toBe(true)
    expect(result.nextState.phase).toBe('due')
    expect(result.dueEntry?.overdueMinutes).toBe(0)
  })

  it('stays due until acknowledged', () => {
    const dueAtMs = baseConfig.windowStartMs + 30 * 60_000
    const result = resolveCheckInTick({
      config: baseConfig,
      state: {
        clientId: 1,
        phase: 'due',
        countdownAnchorMs: baseConfig.windowStartMs,
        dueAtMs,
        notifiedDue: true,
        checkInDate: '2026-06-14',
      },
      nowMs: dueAtMs + 47 * 60_000,
      lastAcknowledgedAtMs: null,
      inWindow: true,
    })

    expect(result.becameDue).toBe(false)
    expect(result.nextState.phase).toBe('due')
    expect(result.dueEntry?.overdueMinutes).toBe(47)
  })

  it('restarts counting after acknowledgment', () => {
    const nowMs = baseConfig.windowStartMs + 90 * 60_000
    const next = resolveAcknowledgedState({ config: baseConfig, nowMs })
    expect(next.phase).toBe('counting')
    expect(next.dueAtMs).toBeNull()
    expect(next.countdownAnchorMs).toBe(nowMs)
  })

  it('clears state outside the fixed-block window', () => {
    const result = resolveCheckInTick({
      config: baseConfig,
      state: {
        clientId: 1,
        phase: 'due',
        countdownAnchorMs: baseConfig.windowStartMs,
        dueAtMs: baseConfig.windowStartMs + 30 * 60_000,
        notifiedDue: true,
        checkInDate: '2026-06-14',
      },
      nowMs: baseConfig.windowEndMs + 60_000,
      lastAcknowledgedAtMs: null,
      inWindow: false,
    })

    expect(result.nextState.phase).toBe('idle')
    expect(result.dueEntry).toBeNull()
  })

  it('uses the last acknowledgment as the countdown anchor', () => {
    const lastAck = baseConfig.windowStartMs + 15 * 60_000
    const result = resolveCheckInTick({
      config: baseConfig,
      state: null,
      nowMs: lastAck + 20 * 60_000,
      lastAcknowledgedAtMs: lastAck,
      inWindow: true,
    })

    expect(result.becameDue).toBe(false)
    expect(result.nextState.phase).toBe('counting')
    expect(result.nextState.countdownAnchorMs).toBe(lastAck)
  })
})
