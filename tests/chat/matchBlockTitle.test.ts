import { describe, expect, it } from 'vitest'
import { matchBlockByTitle } from '../../src/shared/chat/parsers/matchBlockTitle'

const blocks = [
  { id: 1, title: 'Morning Focus Block', status: 'planned' },
  { id: 2, title: 'Morning Email Sweep', status: 'planned' },
  { id: 3, title: 'Client Work Acme', status: 'active' },
]

describe('matchBlockByTitle', () => {
  it('matches exact title', () => {
    const result = matchBlockByTitle('Morning Focus Block', blocks, ['planned'])
    expect(result.status).toBe('matched')
    if (result.status === 'matched') {
      expect(result.block.id).toBe(1)
    }
  })

  it('matches partial title', () => {
    const result = matchBlockByTitle('focus block', blocks, ['planned'])
    expect(result.status).toBe('matched')
  })

  it('returns ambiguous on tie scores', () => {
    const result = matchBlockByTitle('morning', blocks, ['planned'])
    expect(result.status).toBe('ambiguous')
  })

  it('returns none when status not allowed', () => {
    const result = matchBlockByTitle('Client Work Acme', blocks, ['planned'])
    expect(result.status).toBe('none')
  })
})
