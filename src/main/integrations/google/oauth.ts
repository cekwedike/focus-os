import { createServer, type Server } from 'http'
import { shell } from 'electron'
import {
  getGoogleOAuthClientId,
  getGoogleOAuthClientSecret,
  setGoogleTokens,
  type GoogleTokenBundle,
} from '../../services/secretsService'
import { GOOGLE_SCOPE_STRING } from './scopes'

const REDIRECT_PATH = '/oauth2callback'

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope: string
  token_type: string
}

interface UserInfoResponse {
  email: string
}

function buildAuthUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPE_STRING,
    access_type: 'offline',
    prompt: 'consent',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

async function exchangeCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<GoogleTokenBundle> {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Google token exchange failed: ${text}`)
  }

  const data = (await response.json()) as TokenResponse
  if (!data.refresh_token) {
    throw new Error('Google did not return a refresh token. Revoke app access and try again.')
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60_000,
    scopes: data.scope,
  }
}

async function fetchUserEmail(accessToken: string): Promise<string> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Google user info')
  }

  const data = (await response.json()) as UserInfoResponse
  return data.email
}

export interface GoogleConnectResult {
  accountEmail: string
  tokenKeyRef: string
  scopes: string
}

export async function startGoogleOAuthFlow(): Promise<GoogleConnectResult> {
  const clientId = getGoogleOAuthClientId()
  const clientSecret = getGoogleOAuthClientSecret()

  if (!clientId || !clientSecret) {
    throw new Error(
      'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env'
    )
  }

  return new Promise((resolve, reject) => {
    let server: Server | null = null
    let settled = false

    const cleanup = (): void => {
      if (server) {
        server.close()
        server = null
      }
    }

    const fail = (error: Error): void => {
      if (settled) {
        return
      }
      settled = true
      cleanup()
      reject(error)
    }

    server = createServer((req, res) => {
      if (!req.url?.startsWith(REDIRECT_PATH)) {
        res.writeHead(404)
        res.end()
        return
      }

      const url = new URL(req.url, 'http://127.0.0.1')
      const code = url.searchParams.get('code')
      const error = url.searchParams.get('error')

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html' })
        res.end('<html><body><h1>Authorization failed</h1><p>You can close this window.</p></body></html>')
        fail(new Error(`Google OAuth error: ${error}`))
        return
      }

      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html' })
        res.end('<html><body><h1>Missing authorization code</h1></body></html>')
        fail(new Error('Missing authorization code'))
        return
      }

      const address = server?.address()
      const port = typeof address === 'object' && address ? address.port : 0
      const redirectUri = `http://127.0.0.1:${port}${REDIRECT_PATH}`

      void exchangeCode(code, clientId, clientSecret, redirectUri)
        .then(async (tokens) => {
          const email = await fetchUserEmail(tokens.accessToken)
          const tokenKeyRef = `google:${email}`
          setGoogleTokens(tokenKeyRef, tokens)

          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(
            '<html><body><h1>Focus OS connected</h1><p>You can close this window and return to the app.</p></body></html>'
          )

          if (settled) {
            return
          }
          settled = true
          cleanup()
          resolve({
            accountEmail: email,
            tokenKeyRef,
            scopes: tokens.scopes,
          })
        })
        .catch((exchangeError: unknown) => {
          res.writeHead(500, { 'Content-Type': 'text/html' })
          res.end('<html><body><h1>Connection failed</h1></body></html>')
          fail(exchangeError instanceof Error ? exchangeError : new Error(String(exchangeError)))
        })
    })

    server.listen(0, '127.0.0.1', () => {
      const address = server?.address()
      const port = typeof address === 'object' && address ? address.port : 0
      const redirectUri = `http://127.0.0.1:${port}${REDIRECT_PATH}`
      const authUrl = buildAuthUrl(clientId, redirectUri)
      void shell.openExternal(authUrl)
    })

    server.on('error', (serverError) => {
      fail(serverError)
    })

    setTimeout(() => {
      fail(new Error('Google OAuth timed out after 5 minutes'))
    }, 5 * 60_000)
  })
}
