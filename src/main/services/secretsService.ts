import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const SECRETS_FILE_NAME = 'secrets.json'

interface SecretsFile {
  openrouter_api_key?: string
}

function getUserDataPath(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const electron = require('electron') as typeof import('electron')
  return electron.app.getPath('userData')
}

function getSecretsFilePath(): string {
  return join(getUserDataPath(), SECRETS_FILE_NAME)
}

function readSecretsFile(): SecretsFile {
  const filePath = getSecretsFilePath()
  if (!existsSync(filePath)) {
    return {}
  }

  try {
    const raw = readFileSync(filePath, 'utf8')
    return JSON.parse(raw) as SecretsFile
  } catch {
    return {}
  }
}

function writeSecretsFile(secrets: SecretsFile): void {
  const filePath = getSecretsFilePath()
  mkdirSync(getUserDataPath(), { recursive: true })
  writeFileSync(filePath, JSON.stringify(secrets, null, 2), { encoding: 'utf8', mode: 0o600 })
}

export function isOpenRouterKeyConfigured(): boolean {
  const envKey = process.env.OPENROUTER_API_KEY?.trim()
  if (envKey) {
    return true
  }

  const secrets = readSecretsFile()
  return Boolean(secrets.openrouter_api_key?.trim())
}

export function setOpenRouterApiKey(apiKey: string): void {
  const trimmed = apiKey.trim()
  if (!trimmed) {
    throw new Error('API key cannot be empty')
  }

  const secrets = readSecretsFile()
  secrets.openrouter_api_key = trimmed
  writeSecretsFile(secrets)
}

export function clearOpenRouterApiKey(): void {
  const secrets = readSecretsFile()
  delete secrets.openrouter_api_key
  writeSecretsFile(secrets)
}

export function getOpenRouterApiKeyForMainProcess(): string | null {
  const envKey = process.env.OPENROUTER_API_KEY?.trim()
  if (envKey) {
    return envKey
  }

  const secrets = readSecretsFile()
  const fileKey = secrets.openrouter_api_key?.trim()
  return fileKey || null
}
