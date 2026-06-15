import { describe, expect, it } from 'vitest'
import { parseQuickAddTask } from '../../src/shared/parsing/quickAddTask'

const clients = [
  { id: 1, name: 'Acme Corp' },
  { id: 2, name: 'Beta Design' },
  { id: 3, name: 'CX University' },
]

describe('parseQuickAddTask', () => {
  it('detects client, estimate, and deadline from natural language', () => {
    const result = parseQuickAddTask('Write proposal for Acme Corp 2h by Friday', clients, 99)
    expect(result.clientId).toBe(1)
    expect(result.estimatedMinutes).toBe(120)
    expect(result.deadlineDate).not.toBeNull()
    expect(result.title.toLowerCase()).toContain('write proposal')
  })

  it('defaults to unassigned client and 30 minutes when parsing fails', () => {
    const result = parseQuickAddTask('Inbox sweep', clients, 99)
    expect(result.clientId).toBe(99)
    expect(result.estimatedMinutes).toBe(30)
    expect(result.deadlineDate).toBeNull()
  })

  it('parses tomorrow deadline', () => {
    const result = parseQuickAddTask('Follow up tomorrow 45 min', clients, 99)
    expect(result.estimatedMinutes).toBe(45)
    expect(result.deadlineDate).not.toBeNull()
  })

  it('matches client by initialism', () => {
    const result = parseQuickAddTask('Orientation deck for CXU 1h', clients, 99)
    expect(result.clientId).toBe(3)
    expect(result.estimatedMinutes).toBe(60)
  })

  it('flags ambiguous client matches', () => {
    const ambiguousClients = [
      { id: 1, name: 'Acme Corp' },
      { id: 2, name: 'Acme Design' },
    ]
    const result = parseQuickAddTask('Inbox sweep for acme 30 min', ambiguousClients, 99)
    expect(result.ambiguousClients?.length).toBeGreaterThan(1)
  })
})
