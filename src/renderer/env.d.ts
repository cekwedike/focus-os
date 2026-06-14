import type { FocusOSApi } from '@shared/types/focusOSApi'

declare global {
  interface Window {
    focusOS: FocusOSApi
  }
}

export {}
