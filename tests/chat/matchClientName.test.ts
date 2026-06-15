import { describe, expect, it } from 'vitest'
import { matchClientByName } from '../../src/shared/chat/parsers/matchClientName'

const clients = [
  { id: 1, name: 'Acme Corp' },
  { id: 2, name: 'Acme Design' },
  { id: 3, name: 'CX University' },
]

describe('matchClientByName', () => {
  it('matches exact names case-insensitively', () => {
    const result = matchClientByName('acme corp', clients)
    expect(result.status).toBe('matched')
    if (result.status === 'matched') {
      expect(result.client.id).toBe(1)
    }
  })

  it('matches word prefix', () => {
    const result = matchClientByName('acme', clients)
    expect(result.status).toBe('ambiguous')
  })

  it('matches initialism uniquely', () => {
    const result = matchClientByName('CXU', clients)
    expect(result.status).toBe('matched')
    if (result.status === 'matched') {
      expect(result.client.name).toBe('CX University')
    }
  })

  it('returns ambiguous when prefix matches multiple clients', () => {
    const result = matchClientByName('ac', clients)
    expect(result.status).toBe('ambiguous')
    if (result.status === 'ambiguous') {
      expect(result.candidates.length).toBeGreaterThan(1)
    }
  })
})
