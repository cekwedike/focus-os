import { describe, expect, it } from 'vitest'
import { weightsFromPriorityRank } from '../../src/shared/clients/priorityWeights'

describe('weightsFromPriorityRank', () => {
  it('assigns higher weight to higher priority (lower sort order)', () => {
    const weights = weightsFromPriorityRank([
      { id: 1, sortOrder: 0, fixedBlockEnabled: false },
      { id: 2, sortOrder: 1, fixedBlockEnabled: false },
      { id: 3, sortOrder: 2, fixedBlockEnabled: false },
    ])

    expect(weights.get(1)).toBeGreaterThan(weights.get(2)!)
    expect(weights.get(2)).toBeGreaterThan(weights.get(3)!)
  })

  it('normalizes flexible client weights to 100%', () => {
    const weights = weightsFromPriorityRank([
      { id: 1, sortOrder: 0, fixedBlockEnabled: false },
      { id: 2, sortOrder: 1, fixedBlockEnabled: false },
    ])

    const total = [...weights.values()].reduce((sum, value) => sum + value, 0)
    expect(total).toBe(100)
  })
})
