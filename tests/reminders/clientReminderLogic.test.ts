import { describe, expect, it } from 'vitest'
import {
  formatClientReminderMessage,
  resolveClientReminderTick,
} from '../../src/shared/reminders/clientReminderLogic'

const enabledClient = {
  reminderEnabled: true,
  reminderIntervalMinutes: 30,
  reminderLabel: 'Check inbox',
  clientName: 'Acme Corp',
}

describe('formatClientReminderMessage', () => {
  it('uses custom label when provided', () => {
    expect(formatClientReminderMessage('Check inbox', 'Acme Corp')).toBe('Check inbox - Acme Corp')
  })

  it('falls back when label is empty', () => {
    expect(formatClientReminderMessage('', 'Acme Corp')).toBe('Check in - Acme Corp')
  })
})

describe('resolveClientReminderTick', () => {
  it('starts counting when an enabled client block becomes active', () => {
    const result = resolveClientReminderTick({
      state: { activeBlockId: null, elapsedSeconds: 0 },
      activeBlockId: 42,
      client: enabledClient,
      workPaused: false,
      longBreakActive: false,
    })

    expect(result.shouldFire).toBe(false)
    expect(result.nextState).toEqual({ activeBlockId: 42, elapsedSeconds: 1 })
  })

  it('fires after the configured interval', () => {
    const result = resolveClientReminderTick({
      state: { activeBlockId: 42, elapsedSeconds: 1799 },
      activeBlockId: 42,
      client: enabledClient,
      workPaused: false,
      longBreakActive: false,
    })

    expect(result.shouldFire).toBe(true)
    expect(result.message).toBe('Check inbox - Acme Corp')
    expect(result.nextState.elapsedSeconds).toBe(0)
  })

  it('resets when the active block changes', () => {
    const result = resolveClientReminderTick({
      state: { activeBlockId: 42, elapsedSeconds: 100 },
      activeBlockId: 99,
      client: enabledClient,
      workPaused: false,
      longBreakActive: false,
    })

    expect(result.shouldFire).toBe(false)
    expect(result.nextState).toEqual({ activeBlockId: 99, elapsedSeconds: 1 })
  })

  it('does not fire when reminders are disabled', () => {
    const result = resolveClientReminderTick({
      state: { activeBlockId: 42, elapsedSeconds: 5000 },
      activeBlockId: 42,
      client: { ...enabledClient, reminderEnabled: false },
      workPaused: false,
      longBreakActive: false,
    })

    expect(result.shouldFire).toBe(false)
    expect(result.nextState.elapsedSeconds).toBe(0)
  })

  it('pauses while work is paused', () => {
    const result = resolveClientReminderTick({
      state: { activeBlockId: 42, elapsedSeconds: 500 },
      activeBlockId: 42,
      client: enabledClient,
      workPaused: true,
      longBreakActive: false,
    })

    expect(result.shouldFire).toBe(false)
    expect(result.nextState).toEqual({ activeBlockId: null, elapsedSeconds: 0 })
  })

  it('pauses during a long break', () => {
    const result = resolveClientReminderTick({
      state: { activeBlockId: 42, elapsedSeconds: 500 },
      activeBlockId: 42,
      client: enabledClient,
      workPaused: false,
      longBreakActive: true,
    })

    expect(result.shouldFire).toBe(false)
    expect(result.nextState).toEqual({ activeBlockId: null, elapsedSeconds: 0 })
  })

  it('clears when no active block remains', () => {
    const result = resolveClientReminderTick({
      state: { activeBlockId: 42, elapsedSeconds: 120 },
      activeBlockId: null,
      client: null,
      workPaused: false,
      longBreakActive: false,
    })

    expect(result.shouldFire).toBe(false)
    expect(result.nextState).toEqual({ activeBlockId: null, elapsedSeconds: 0 })
  })
})
