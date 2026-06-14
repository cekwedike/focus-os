import { useCallback, useEffect, useState } from 'react'
import type { ClientProjectRow, ProtectedBlockRow } from '@shared/types/db'
import type { AppSettings } from '@shared/types/settings'

interface SettingsScreenState {
  clients: ClientProjectRow[]
  protectedBlocks: ProtectedBlockRow[]
  settings: AppSettings | null
  openrouterKeyConfigured: boolean
  loading: boolean
  error: string | null
}

export function useSettingsScreen() {
  const [state, setState] = useState<SettingsScreenState>({
    clients: [],
    protectedBlocks: [],
    settings: null,
    openrouterKeyConfigured: false,
    loading: true,
    error: null,
  })

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }))
    try {
      const [clients, protectedBlocks, settingsResponse] = await Promise.all([
        window.focusOS.clients.list(),
        window.focusOS.protectedBlocks.list(),
        window.focusOS.settings.get(),
      ])

      setState({
        clients,
        protectedBlocks,
        settings: settingsResponse.settings,
        openrouterKeyConfigured: settingsResponse.openrouterKeyConfigured,
        loading: false,
        error: null,
      })
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: String(error),
      }))
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    const response = await window.focusOS.settings.update(partial)
    setState((current) => ({
      ...current,
      settings: response.settings,
      openrouterKeyConfigured: response.openrouterKeyConfigured,
    }))
  }, [])

  const setClients = useCallback((clients: ClientProjectRow[]) => {
    setState((current) => ({ ...current, clients }))
  }, [])

  const setProtectedBlocks = useCallback((protectedBlocks: ProtectedBlockRow[]) => {
    setState((current) => ({ ...current, protectedBlocks }))
  }, [])

  const setOpenrouterKeyConfigured = useCallback((configured: boolean) => {
    setState((current) => ({ ...current, openrouterKeyConfigured: configured }))
  }, [])

  const setSettings = useCallback((settings: AppSettings) => {
    setState((current) => ({ ...current, settings }))
  }, [])

  return {
    ...state,
    refresh,
    updateSettings,
    setClients,
    setProtectedBlocks,
    setOpenrouterKeyConfigured,
    setSettings,
  }
}
