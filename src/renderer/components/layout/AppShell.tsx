import type { ReactNode } from 'react'
import { SidebarNav } from './SidebarNav'
import { TopStatusBar } from './TopStatusBar'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps): React.JSX.Element {
  return (
    <div className="flex h-screen min-h-screen flex-col bg-surface">
      <TopStatusBar />
      <div className="flex min-h-0 flex-1">
        <SidebarNav />
        <main className="min-w-0 flex-1 overflow-y-auto p-shell">{children}</main>
      </div>
    </div>
  )
}
