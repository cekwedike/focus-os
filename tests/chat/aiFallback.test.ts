import { describe, expect, it } from 'vitest'
import { shouldTriggerAiFallback } from '../../src/shared/chat/aiFallback'
import { buildUnrecognizedMatch } from '../../src/shared/chat/intents/unrecognizedIntent'
import { createTestContext } from './testContext'

describe('shouldTriggerAiFallback', () => {
  it('triggers on unrecognized intent', () => {
    expect(shouldTriggerAiFallback(buildUnrecognizedMatch())).toBe(true)
  })

  it('does not trigger on menu intent', () => {
    expect(
      shouldTriggerAiFallback({
        intent: 'menu',
        requiresIpc: false,
      })
    ).toBe(false)
  })

  it('does not trigger on definite match', () => {
    expect(
      shouldTriggerAiFallback({
        intent: 'query_schedule',
        requiresIpc: true,
      })
    ).toBe(false)
  })

  it('does not trigger on ambiguous disambiguation message', () => {
    expect(
      shouldTriggerAiFallback({
        intent: 'unrecognized',
        requiresIpc: false,
        ambiguousMessage: 'Which client did you mean?',
      })
    ).toBe(false)
  })

  it('triggers when confidence is below threshold', () => {
    expect(
      shouldTriggerAiFallback({
        intent: 'add_task',
        requiresIpc: true,
        confidence: 0.5,
      })
    ).toBe(true)
  })

  it('does not trigger when confidence is at threshold', () => {
    expect(
      shouldTriggerAiFallback({
        intent: 'add_task',
        requiresIpc: true,
        confidence: 0.7,
      })
    ).toBe(false)
  })
})

describe('router context summary', () => {
  it('includes open tasks in context for matchers', () => {
    const context = createTestContext({
      openTasks: [{ id: 1, title: 'Write proposal' }],
    })
    expect(context.openTasks).toHaveLength(1)
  })
})
