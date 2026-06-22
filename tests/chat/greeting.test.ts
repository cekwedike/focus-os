import { describe, expect, it } from 'vitest'
import {
  buildProactiveGreetingMessages,
  buildTimeOfDayGreeting,
  buildWelcomeBackMessage,
  getTimeOfDayPeriod,
} from '../../src/shared/chat/greeting'

describe('getTimeOfDayPeriod', () => {
  it('uses morning before noon', () => {
    expect(getTimeOfDayPeriod(11)).toBe('morning')
  })

  it('uses afternoon from noon until 17:00', () => {
    expect(getTimeOfDayPeriod(12)).toBe('afternoon')
    expect(getTimeOfDayPeriod(16)).toBe('afternoon')
  })

  it('uses evening from 17:00 onward including late night', () => {
    expect(getTimeOfDayPeriod(17)).toBe('evening')
    expect(getTimeOfDayPeriod(2)).toBe('evening')
  })
})

describe('buildTimeOfDayGreeting', () => {
  it('greets with name when provided', () => {
    const date = new Date('2026-06-15T11:59:00')
    expect(buildTimeOfDayGreeting(date, 'Cheedii')).toBe('Good morning, Cheedii.')
  })

  it('greets without name when empty', () => {
    const noon = new Date('2026-06-15T12:00:00')
    const lateAfternoon = new Date('2026-06-15T16:59:00')
    const evening = new Date('2026-06-15T17:00:00')
    const lateNight = new Date('2026-06-15T02:00:00')

    expect(buildTimeOfDayGreeting(noon, '')).toBe('Good afternoon.')
    expect(buildTimeOfDayGreeting(lateAfternoon, '')).toBe('Good afternoon.')
    expect(buildTimeOfDayGreeting(evening, '')).toBe('Good evening.')
    expect(buildTimeOfDayGreeting(lateNight, '')).toBe('Good evening.')
  })
})

describe('buildWelcomeBackMessage', () => {
  const now = new Date('2026-06-15T10:30:00')

  it('describes active block with minutes left', () => {
    const message = buildWelcomeBackMessage({
      wakeTimeLogged: true,
      hasSchedule: true,
      activeBlock: {
        title: 'Deep Work',
        planned_end: '2026-06-15T11:00:00.000Z',
      },
      nextBlock: null,
      now,
    })
    expect(message).toContain('Deep Work')
    expect(message).toContain('minutes left')
  })

  it('mentions next block when between blocks', () => {
    const message = buildWelcomeBackMessage({
      wakeTimeLogged: true,
      hasSchedule: true,
      activeBlock: null,
      nextBlock: {
        title: 'Client Call',
        planned_end: '2026-06-15T14:00:00.000Z',
      },
      now,
    })
    expect(message).toContain('Client Call is up next')
  })

  it('handles wake logged without schedule', () => {
    const message = buildWelcomeBackMessage({
      wakeTimeLogged: true,
      hasSchedule: false,
      activeBlock: null,
      nextBlock: null,
      now,
    })
    expect(message).toContain("haven't built today's plan")
  })
})

describe('buildProactiveGreetingMessages', () => {
  it('returns a single morning opening when wake not logged', () => {
    const messages = buildProactiveGreetingMessages({
      wakeTimeLogged: false,
      userDisplayName: 'Alex',
      welcomeBack: {
        wakeTimeLogged: false,
        hasSchedule: false,
        activeBlock: null,
        nextBlock: null,
      },
      now: new Date('2026-06-15T08:00:00'),
    })
    expect(messages).toHaveLength(1)
    expect(messages[0]).toContain('Good morning, Alex')
    expect(messages[0]).toContain('wake up')
  })

  it('returns welcome back when wake is logged', () => {
    const messages = buildProactiveGreetingMessages({
      wakeTimeLogged: true,
      welcomeBack: {
        wakeTimeLogged: true,
        hasSchedule: true,
        activeBlock: null,
        nextBlock: null,
      },
      now: new Date('2026-06-15T10:00:00'),
    })
    expect(messages).toHaveLength(1)
    expect(messages[0]).toContain("between blocks")
  })
})
