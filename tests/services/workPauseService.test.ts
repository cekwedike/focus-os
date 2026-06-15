import { describe, expect, it } from 'vitest'
import {
  getEffectiveNowMs,
  resetPauseTracking,
  setWorkPaused,
} from '../../src/main/services/workPauseService'

describe('workPauseService', () => {
  it('subtracts elapsed pause time from effective now', () => {
    resetPauseTracking()
    const beforePause = Date.now()
    setWorkPaused(true)

    const effective = getEffectiveNowMs()
    expect(effective).toBeLessThanOrEqual(beforePause + 5)
  })
})
