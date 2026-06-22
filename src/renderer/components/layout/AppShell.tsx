import { useCallback, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { TopStatusBar } from './TopStatusBar'
import { LongBreakModal } from '@renderer/components/modals/LongBreakModal'
import { ReplanSummaryModal } from '@renderer/components/modals/ReplanSummaryModal'
import { ScreenIconRail } from '@renderer/chat/ScreenIconRail'
import { PersistentNotificationBanner } from '@renderer/components/layout/PersistentNotificationBanner'
import { AssistantNavProvider } from '@renderer/screens/Home/components/AssistantNavContext'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps): React.JSX.Element {
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/' || location.pathname === '/dashboard'

  const closeNav = useCallback(() => setNavOpen(false), [])
  const openNav = useCallback(() => setNavOpen(true), [])
  const openSettings = useCallback(() => {
    navigate('/settings')
    setNavOpen(false)
  }, [navigate])

  return (
    <div className="focus-app-bg flex h-screen min-h-screen flex-col overflow-hidden">
      {!isHome ? <TopStatusBar /> : null}
      <PersistentNotificationBanner />
      <AssistantNavProvider openNav={openNav} openSettings={openSettings}>
        <div className="relative z-10 flex min-h-0 min-w-0 flex-1">
          {navOpen ? <ScreenIconRail mobileOpen={navOpen} onMobileClose={closeNav} /> : null}
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
        </div>
      </AssistantNavProvider>
      <LongBreakModal />
      <ReplanSummaryModal />
    </div>
  )
}
