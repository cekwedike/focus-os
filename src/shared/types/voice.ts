export interface VoiceTranscribePayload {
  audioBase64: string
  format: string
}

export interface VoiceTranscribeResponse {
  text: string
  model: string
}
