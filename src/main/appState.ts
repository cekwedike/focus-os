let appQuitting = false

export function isAppQuitting(): boolean {
  return appQuitting
}

export function setAppQuitting(value: boolean): void {
  appQuitting = value
}
