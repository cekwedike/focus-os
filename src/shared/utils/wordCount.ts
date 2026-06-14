export function countWords(text: string | null | undefined): number {
  if (!text?.trim()) {
    return 0
  }
  return text.trim().split(/\s+/).filter(Boolean).length
}
