import { ChatPanel } from './components/ChatPanel'
import { DayPanel } from './components/DayPanel'
import { FreelancerOnboardingWizard } from '@renderer/components/onboarding/FreelancerOnboardingWizard'
import { useEffect, useState } from 'react'
import type { AppSettings } from '@shared/types/settings'
import type { ClientProjectRow } from '@shared/types/db'

export function HomeDashboardScreen(): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [clients, setClients] = useState<ClientProjectRow[]>([])

  useEffect(() => {
    void (async () => {
      const [settingsResponse, clientRows] = await Promise.all([
        window.focusOS.settings.get(),
        window.focusOS.clients.list(),
      ])
      setSettings(settingsResponse.settings)
      setClients(clientRows)
    })()
  }, [])

  return (
    <>
      <div className="hud-command-deck flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <ChatPanel />
        </div>
        <div className="day-panel-shell hidden min-h-0 min-w-0 shrink-0 lg:flex lg:w-[min(44vw,480px)] xl:w-[min(40vw,520px)] 2xl:w-[min(36vw,560px)]">
          <DayPanel />
        </div>
      </div>
      {settings ? (
        <FreelancerOnboardingWizard
          open={!settings.freelancerWizardComplete}
          settings={settings}
          clients={clients}
          onClientsChange={setClients}
          onUpdateSettings={async (partial) => {
            const response = await window.focusOS.settings.update(partial)
            setSettings(response.settings)
          }}
          onComplete={async () => {
            const response = await window.focusOS.settings.get()
            setSettings(response.settings)
          }}
        />
      ) : null}
    </>
  )
}
