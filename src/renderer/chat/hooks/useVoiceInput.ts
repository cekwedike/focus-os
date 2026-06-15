import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<{
    isFinal: boolean
    0: { transcript: string }
  }>
}

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: SpeechRecognitionCtor
  webkitSpeechRecognition?: SpeechRecognitionCtor
}

const SILENCE_STOP_MS = 3000

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const win = window as SpeechRecognitionWindow
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null
}

export type VoiceInputStatus = 'idle' | 'listening' | 'unsupported' | 'denied'

export interface UseVoiceInputOptions {
  enabled: boolean
  onTranscript: (text: string, isFinal: boolean) => void
}

export function useVoiceInput({ enabled, onTranscript }: UseVoiceInputOptions) {
  const [status, setStatus] = useState<VoiceInputStatus>('idle')
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearSilenceTimer = useCallback((): void => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const stopListening = useCallback((): void => {
    clearSilenceTimer()
    recognitionRef.current?.stop()
    setStatus((current) => (current === 'denied' || current === 'unsupported' ? current : 'idle'))
  }, [clearSilenceTimer])

  const scheduleSilenceStop = useCallback((): void => {
    clearSilenceTimer()
    silenceTimerRef.current = setTimeout(() => {
      stopListening()
    }, SILENCE_STOP_MS)
  }, [clearSilenceTimer, stopListening])

  useEffect(() => {
    if (!enabled) {
      stopListening()
      return
    }

    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      setStatus('unsupported')
      return
    }

    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      scheduleSilenceStop()
      let interim = ''
      let finalText = ''

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const transcript = result[0]?.transcript ?? ''
        if (result.isFinal) {
          finalText += transcript
        } else {
          interim += transcript
        }
      }

      if (finalText) {
        onTranscript(finalText.trim(), true)
      } else if (interim) {
        onTranscript(interim.trim(), false)
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setStatus('denied')
      }
      stopListening()
    }

    recognition.onend = () => {
      clearSilenceTimer()
      setStatus((current) =>
        current === 'denied' || current === 'unsupported' ? current : 'idle'
      )
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
      recognitionRef.current = null
      clearSilenceTimer()
    }
  }, [enabled, onTranscript, scheduleSilenceStop, stopListening, clearSilenceTimer])

  const startListening = useCallback((): void => {
    if (!enabled || status === 'unsupported' || status === 'denied') {
      return
    }

    const recognition = recognitionRef.current
    if (!recognition) {
      setStatus('unsupported')
      return
    }

    try {
      recognition.start()
      setStatus('listening')
      scheduleSilenceStop()
    } catch {
      setStatus('idle')
    }
  }, [enabled, scheduleSilenceStop, status])

  const toggleListening = useCallback((): void => {
    if (status === 'listening') {
      stopListening()
      return
    }
    startListening()
  }, [startListening, status, stopListening])

  return {
    status,
    isListening: status === 'listening',
    toggleListening,
    stopListening,
  }
}
