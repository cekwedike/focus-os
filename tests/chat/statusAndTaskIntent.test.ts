import { describe, expect, it } from 'vitest'
import {
  matchCompleteTaskIntent,
  matchQueryStatusIntent,
  matchQueryTasksIntent,
  matchReplanDayIntent,
} from '../../src/shared/chat/intents/statusAndTaskIntent'
import { createTestContext } from './testContext'
import { classifyIntent } from '../../src/shared/chat/intentRouter'

describe('status and task intents', () => {
  it('matches query status', () => {
    expect(matchQueryStatusIntent('how am I doing')?.intent).toBe('query_status')
  })

  it('matches query tasks', () => {
    expect(matchQueryTasksIntent('list my tasks')?.intent).toBe('query_tasks')
  })

  it('matches complete task by title', () => {
    const match = matchCompleteTaskIntent('complete invoice', {
      tasks: [{ id: 4, title: 'Send invoice' }],
    })
    expect(match?.intent).toBe('complete_task')
    if (match?.extracted && 'taskId' in match.extracted) {
      expect(match.extracted.taskId).toBe(4)
    }
  })

  it('matches replan day prompt', () => {
    expect(matchReplanDayIntent('replan my day')?.intent).toBe('replan_day')
  })

  it('classifies how am I doing via router', () => {
    const match = classifyIntent('how am I doing', createTestContext())
    expect(match.intent).toBe('query_status')
  })
})
