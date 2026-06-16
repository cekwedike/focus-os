import { describe, expect, it } from 'vitest'
import { parseQuickAddTask, quickAddHasResolvedPriority } from '../../src/shared/parsing/quickAddTask'

const clients = [
  { id: 1, name: 'Acme Corp' },
  { id: 2, name: 'Beta Design' },
  { id: 3, name: 'CX University' },
]

describe('parseQuickAddTask', () => {
  it('detects client, estimate, deadline, and quadrant from natural language', () => {
    const result = parseQuickAddTask('Write proposal for Acme Corp 2h by Friday Q1', clients, {
      fallbackClientId: 99,
    })
    expect(result.clientId).toBe(1)
    expect(result.estimatedMinutes).toBe(120)
    expect(result.deadlineDate).not.toBeNull()
    expect(result.isUrgent).toBe(true)
    expect(result.isImportant).toBe(true)
    expect(result.title.toLowerCase()).toContain('write proposal')
  })

  it('defaults to personal/unassigned client when parsing fails', () => {
    const result = parseQuickAddTask('Inbox sweep', clients, { fallbackClientId: 99 })
    expect(result.clientId).toBe(99)
    expect(result.estimatedMinutes).toBe(30)
    expect(result.deadlineDate).toBeNull()
    expect(result.isUrgent).toBeNull()
    expect(result.isImportant).toBeNull()
  })

  it('uses inbox when no priority is provided', () => {
    const result = parseQuickAddTask('Inbox sweep no priority', clients, { fallbackClientId: 99 })
    expect(result.skipPriority).toBe(true)
    expect(quickAddHasResolvedPriority(result)).toBe(true)
  })

  it('uses the selected job when text omits a client', () => {
    const result = parseQuickAddTask('Inbox sweep', clients, { defaultClientId: 2 })
    expect(result.clientId).toBe(2)
  })

  it('uses the selected quadrant when text omits priority keywords', () => {
    const result = parseQuickAddTask('Weekly review', clients, {
      fallbackClientId: 99,
      defaultEisenhower: { isUrgent: false, isImportant: true },
    })
    expect(result.isUrgent).toBe(false)
    expect(result.isImportant).toBe(true)
  })

  it('parses tomorrow deadline', () => {
    const result = parseQuickAddTask('Follow up tomorrow 45 min', clients, { fallbackClientId: 99 })
    expect(result.estimatedMinutes).toBe(45)
    expect(result.deadlineDate).not.toBeNull()
  })

  it('matches client by initialism', () => {
    const result = parseQuickAddTask('Orientation deck for CXU 1h', clients, { fallbackClientId: 99 })
    expect(result.clientId).toBe(3)
    expect(result.estimatedMinutes).toBe(60)
  })

  it('flags ambiguous client matches', () => {
    const ambiguousClients = [
      { id: 1, name: 'Acme Corp' },
      { id: 2, name: 'Acme Design' },
    ]
    const result = parseQuickAddTask('Inbox sweep for acme 30 min', ambiguousClients, {
      fallbackClientId: 99,
    })
    expect(result.ambiguousClients?.length).toBeGreaterThan(1)
  })
})
