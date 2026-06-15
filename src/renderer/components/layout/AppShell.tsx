import { useCallback, useState, type ReactNode } from 'react'
import { TopStatusBar } from './TopStatusBar'
import { LongBreakModal } from '@renderer/components/modals/LongBreakModal'
import { ReplanSummaryModal } from '@renderer/components/modals/ReplanSummaryModal'
import { ScreenIconRail } from '@renderer/chat/ScreenIconRail'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps): React.JSX.Element {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])
  const toggleMobileNav = useCallback(() => setMobileNavOpen((open) => !open), [])

  return (
    <div className="focus-app-bg flex h-screen min-h-screen flex-col overflow-hidden">
      <TopStatusBar onToggleNav={toggleMobileNav} navOpen={mobileNavOpen} />
      <div className="relative z-10 flex min-h-0 min-w-0 flex-1">
        <ScreenIconRail mobileOpen={mobileNavOpen} onMobileClose={closeMobileNav} />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>
      <LongBreakModal />
      <ReplanSummaryModal />
    </div>
  )
}
