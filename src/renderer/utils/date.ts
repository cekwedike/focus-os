export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getCurrentTimeHHMM(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}
