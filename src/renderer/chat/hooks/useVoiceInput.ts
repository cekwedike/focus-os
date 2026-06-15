import { useCallback, useEffect, useRef, useState } from 'react'

const MAX_RECORDING_MS = 30_000

function pickRecorderMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
  for (const candidate of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidate)) {
      return candidate
    }
  }

  return 'audio/webm'
}

function mimeTypeToFormat(mimeType: string): string {
  if (mimeType.includes('ogg')) {
    return 'ogg'
  }
  if (mimeType.includes('mp4')) {
    return 'mp4'
  }
  return 'webm'
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Failed to read audio data'))
        return
      }

      const commaIndex = result.indexOf(',')
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read audio data'))
    reader.readAsDataURL(blob)
  })
}

export type VoiceInputStatus =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'unsupported'
  | 'denied'
  | 'unavailable'

export interface UseVoiceInputOptions {
  enabled: boolean
  onTranscript: (text: string, isFinal: boolean) => void
}

export function useVoiceInput({ enabled, onTranscript }: UseVoiceInputOptions) {
  const [status, setStatus] = useState<VoiceInputStatus>('idle')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const mimeTypeRef = useRef('audio/webm')
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stopRecordingRef = useRef<() => void>(() => {})

  const clearMaxDurationTimer = useCallback((): void => {
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current)
      maxDurationTimerRef.current = null
    }
  }, [])

  const releaseStream = useCallback((): void => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
  }, [])

  const transcribeRecording = useCallback(
    async (blob: Blob): Promise<void> => {
      if (blob.size === 0) {
        setStatusMessage('No speech detected. Try again.')
        setStatus('idle')
        return
      }

      setStatus('transcribing')
      setStatusMessage('Transcribing...')

      try {
        const audioBase64 = await blobToBase64(blob)
        const result = await window.focusOS.voice.transcribe({
          audioBase64,
          format: mimeTypeToFormat(mimeTypeRef.current),
        })

        if (result.text.trim()) {
          onTranscript(result.text.trim(), true)
          setStatusMessage(null)
        } else {
          setStatusMessage('No speech detected. Try again.')
        }
      } catch (error) {
        setStatusMessage(String(error))
      } finally {
        setStatus('idle')
      }
    },
    [onTranscript]
  )

  const stopRecording = useCallback((): void => {
    clearMaxDurationTimer()
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
      return
    }

    releaseStream()
    setStatus((current) =>
      current === 'denied' || current === 'unsupported' || current === 'unavailable'
        ? current
        : 'idle'
    )
  }, [clearMaxDurationTimer, releaseStream])

  stopRecordingRef.current = stopRecording

  useEffect(() => {
    if (!enabled) {
      stopRecording()
      return
    }

    if (typeof window.focusOS?.voice?.transcribe !== 'function') {
      setStatus('unsupported')
      setStatusMessage('Voice input is unavailable in this build.')
      return
    }

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setStatus('unsupported')
      setStatusMessage('Microphone recording is not supported here.')
      return
    }

    void window.focusOS.settings.openRouterKeyStatus().then((response) => {
      if (!response.configured) {
        setStatus('unavailable')
        setStatusMessage('Add an OpenRouter API key in Settings to use voice input.')
      }
    })

    return () => {
      stopRecording()
    }
  }, [enabled, stopRecording])

  const startListening = useCallback(async (): Promise<void> => {
    if (!enabled || status === 'unsupported' || status === 'denied' || status === 'unavailable') {
      return
    }

    const keyStatus = await window.focusOS.settings.openRouterKeyStatus()
    if (!keyStatus.configured) {
      setStatus('unavailable')
      setStatusMessage('Add an OpenRouter API key in Settings to use voice input.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      chunksRef.current = []

      const mimeType = pickRecorderMimeType()
      mimeTypeRef.current = mimeType
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onerror = () => {
        setStatusMessage('Recording failed. Try again.')
        releaseStream()
        setStatus('idle')
      }

      recorder.onstop = () => {
        clearMaxDurationTimer()
        releaseStream()
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current })
        chunksRef.current = []
        mediaRecorderRef.current = null
        void transcribeRecording(blob)
      }

      recorder.start()
      setStatus('listening')
      setStatusMessage('Listening... click mic again to stop.')

      clearMaxDurationTimer()
      maxDurationTimerRef.current = setTimeout(() => {
        stopRecordingRef.current()
      }, MAX_RECORDING_MS)
    } catch (error) {
      releaseStream()
      const message = String(error)
      if (message.toLowerCase().includes('denied') || message.toLowerCase().includes('not allowed')) {
        setStatus('denied')
        setStatusMessage('Microphone access denied.')
        return
      }

      setStatusMessage(message)
      setStatus('idle')
    }
  }, [clearMaxDurationTimer, enabled, releaseStream, status, transcribeRecording])

  const toggleListening = useCallback((): void => {
    if (status === 'listening') {
      stopRecording()
      return
    }

    if (status === 'transcribing') {
      return
    }

    void startListening()
  }, [startListening, status, stopRecording])

  return {
    status,
    statusMessage,
    isListening: status === 'listening',
    isTranscribing: status === 'transcribing',
    toggleListening,
    stopListening: stopRecording,
  }
}
