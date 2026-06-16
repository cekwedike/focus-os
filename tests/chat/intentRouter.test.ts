import { describe, expect, it } from 'vitest'
import { classifyIntent, shouldInvokeIpc } from '../../src/shared/chat/intentRouter'
import { createTestContext } from './testContext'

describe('intentRouter wake time', () => {
  it('matches wake time when pending prompt is active', () => {
    const context = createTestContext({
      conversation: {
        pendingPrompt: 'wake_time',
        pendingTaskDraft: null,
        longBreakActive: false,
        activeFaithBlockId: null,
      },
    })

    expect(classifyIntent('9am', context).intent).toBe('wake_time')
    expect(classifyIntent('9:30', context).intent).toBe('wake_time')
    expect(classifyIntent('just woke up', context).intent).toBe('wake_time')
    expect(classifyIntent('9', context).intent).toBe('wake_time')
  })

  it('does not match wake time when pending prompt is inactive', () => {
    const context = createTestContext()
    expect(classifyIntent('9am', context).intent).toBe('unrecognized')
  })
})

describe('intentRouter add task', () => {
  it('matches add task prefixes and client names', () => {
    const context = createTestContext()
    const result = classifyIntent('add Write proposal for Acme Corp 2h', context)
    expect(result.intent).toBe('add_task')
    expect(shouldInvokeIpc(result)).toBe(true)
  })

  it('returns ambiguous client clarification without ipc', () => {
    const context = createTestContext({
      clients: [
        { id: 1, name: 'Acme Corp' },
        { id: 2, name: 'Acme Design' },
        { id: 3, name: 'CX University' },
      ],
    })
    const result = classifyIntent('add inbox sweep for ac 30 min', context)
    expect(result.intent).toBe('unrecognized')
    expect(shouldInvokeIpc(result)).toBe(false)
    expect(result.ambiguousMessage).toContain('Which client')
  })
})

describe('intentRouter block actions', () => {
  it('starts a planned block by fuzzy title', () => {
    const context = createTestContext()
    const result = classifyIntent('starting morning focus block', context)
    expect(result.intent).toBe('start_block')
  })

  it('completes active block without title', () => {
    const context = createTestContext()
    const result = classifyIntent('done', context)
    expect(result.intent).toBe('complete_block')
  })
})

describe('intentRouter breaks', () => {
  it('matches long break phrases with duration', () => {
    const context = createTestContext()
    const result = classifyIntent('taking a break for lunch, back in 30 min', context)
    expect(result.intent).toBe('long_break')
  })

  it('matches end break only when long break active', () => {
    const inactive = createTestContext()
    expect(classifyIntent("I'm back", inactive).intent).toBe('unrecognized')

    const active = createTestContext({
      conversation: {
        pendingPrompt: null,
        pendingTaskDraft: null,
        longBreakActive: true,
        activeFaithBlockId: null,
      },
    })
    expect(classifyIntent("I'm back", active).intent).toBe('end_break')
  })
})

describe('intentRouter faith log', () => {
  it('matches reading when faith context exists', () => {
    const context = createTestContext()
    const result = classifyIntent('reading Psalm 23', context)
    expect(result.intent).toBe('faith_log')
  })

  it('does not match faith log without faith context', () => {
    const context = createTestContext({
      todayBlocks: [
        {
          id: 1,
          title: 'Work Block',
          status: 'planned',
          block_type: 'weighted_client',
          protected_subtype: null,
        },
      ],
    })
    expect(classifyIntent('reading Psalm 23', context).intent).toBe('unrecognized')
  })
})

describe('intentRouter queries', () => {
  it('matches schedule queries', () => {
    const context = createTestContext()
    expect(classifyIntent("what's next", context).intent).toBe('query_schedule')
    expect(classifyIntent('show my schedule', context).intent).toBe('query_schedule')
  })

  it('matches streak queries', () => {
    const context = createTestContext()
    expect(classifyIntent("what's my streak", context).intent).toBe('query_streak')
  })
})

describe('intentRouter check-in disambiguation', () => {
  it('routes done with client check to acknowledge_check_in', () => {
    const context = createTestContext({
      dueCheckInClients: [{ id: 1, name: 'PLNITUDE' }],
      todayBlocks: [
        {
          id: 10,
          title: 'PLNITUDE',
          status: 'active',
          block_type: 'fixed_client',
          protected_subtype: null,
        },
      ],
      activeBlockId: 10,
    })

    expect(classifyIntent('done with PLNITUDE check', context).intent).toBe('acknowledge_check_in')
  })

  it('routes bare done to complete_block when a block is active', () => {
    const context = createTestContext({
      dueCheckInClients: [{ id: 1, name: 'PLNITUDE' }],
      todayBlocks: [
        {
          id: 10,
          title: 'Client work',
          status: 'active',
          block_type: 'weighted_client',
          protected_subtype: null,
        },
      ],
      activeBlockId: 10,
    })

    expect(classifyIntent("I'm done", context).intent).toBe('complete_block')
  })
})

describe('intentRouter unrecognized', () => {
  it('falls through to unrecognized for gibberish', () => {
    const context = createTestContext()
    const result = classifyIntent('definitely not a command xyz', context)
    expect(result.intent).toBe('unrecognized')
    expect(shouldInvokeIpc(result)).toBe(false)
  })

  it('never invokes ipc for menu intent', () => {
    const result = classifyIntent('/menu', createTestContext())
    expect(result.intent).toBe('menu')
    expect(shouldInvokeIpc(result)).toBe(false)
  })
})
