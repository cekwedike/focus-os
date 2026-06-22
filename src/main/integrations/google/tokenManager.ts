import {
  getGoogleOAuthClientId,
  getGoogleOAuthClientSecret,
  getGoogleTokens,
  setGoogleTokens,
  type GoogleTokenBundle,
} from '../../services/secretsService'

interface RefreshResponse {
  access_token: string
  expires_in: number
  scope?: string
}

export async function getValidAccessToken(tokenKeyRef: string): Promise<string> {
  const tokens = getGoogleTokens(tokenKeyRef)
  if (!tokens) {
    throw new Error('Google account is not connected')
  }

  if (Date.now() < tokens.expiresAt) {
    return tokens.accessToken
  }

  const clientId = getGoogleOAuthClientId()
  const clientSecret = getGoogleOAuthClientSecret()
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials are not configured')
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: tokens.refreshToken,
    grant_type: 'refresh_token',
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Google token refresh failed: ${text}`)
  }

  const data = (await response.json()) as RefreshResponse
  const updated: GoogleTokenBundle = {
    ...tokens,
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60_000,
    scopes: data.scope ?? tokens.scopes,
  }
  setGoogleTokens(tokenKeyRef, updated)
  return updated.accessToken
}
