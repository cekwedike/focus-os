import { useCallback, useEffect, useRef } from 'react'

export function useVoiceOutput(enabled: boolean, text: string, role: string): void {
  const lastSpokenRef = useRef<string | null>(null)

  const cancelSpeech = useCallback((): void => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }, [])

  useEffect(() => {
    if (!enabled || role !== 'assistant' || !text.trim()) {
      return
    }

    if (lastSpokenRef.current === text) {
      return
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return
    }

    cancelSpeech()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
    lastSpokenRef.current = text

    return () => {
      cancelSpeech()
    }
  }, [enabled, text, role, cancelSpeech])
}
