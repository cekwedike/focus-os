export function mergeVoiceTranscript(current: string, transcript: string, isFinal: boolean): string {
  const base = current.trimEnd()
  if (!transcript) {
    return current
  }

  if (!base) {
    return transcript
  }

  if (isFinal) {
    return `${base} ${transcript}`.trim()
  }

  return `${base} ${transcript}`.trim()
}
