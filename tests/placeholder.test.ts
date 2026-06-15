import { describe, expect, it } from 'vitest'
import { MIN_WINDOW_HEIGHT, MIN_WINDOW_WIDTH } from '../src/shared/constants/app'

describe('Focus OS scaffold', () => {
  it('defines minimum window dimensions for the desktop shell', () => {
    expect(MIN_WINDOW_WIDTH).toBe(960)
    expect(MIN_WINDOW_HEIGHT).toBe(720)
  })
})
