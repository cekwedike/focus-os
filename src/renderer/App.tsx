import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { DisplayPreferencesProvider } from './context/DisplayPreferencesContext'
import { ScheduleProvider } from './context/ScheduleContext'
import { FaithEntryProvider } from './context/FaithEntryContext'
import { BreakProvider } from './context/BreakContext'
import { ChatProvider } from './context/ChatContext'
import { ChatNotificationBridge } from './components/ChatNotificationBridge'
import { AppShell } from './components/layout/AppShell'
import { useAppNavigationEvents } from './hooks/useAppNavigationEvents'
import { HomeDashboardScreen } from './screens/Home/HomeDashboardScreen'
import { DailyWorkspaceScreen } from './screens/DailyWorkspace/DailyWorkspaceScreen'
import { TaskMatrixScreen } from './screens/TaskMatrix/TaskMatrixScreen'
import { ScheduleScreen } from './screens/Schedule/ScheduleScreen'
import { DailyInsightScreen } from './screens/DailyInsight/DailyInsightScreen'
import { JournalScreen } from './screens/Journal/JournalScreen'
import { ReviewScreen } from './screens/Review/ReviewScreen'
import { SettingsScreen } from './screens/Settings/SettingsScreen'

function LegacyScreenLayout({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-4 sm:py-shell md:px-shell">
      {children}
    </div>
  )
}

function AppRoutes(): React.JSX.Element {
  useAppNavigationEvents()

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomeDashboardScreen />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route
          path="/daily-workspace"
          element={
            <LegacyScreenLayout>
              <DailyWorkspaceScreen />
            </LegacyScreenLayout>
          }
        />
        <Route
          path="/task-matrix"
          element={
            <LegacyScreenLayout>
              <TaskMatrixScreen />
            </LegacyScreenLayout>
          }
        />
        <Route
          path="/schedule"
          element={
            <LegacyScreenLayout>
              <ScheduleScreen />
            </LegacyScreenLayout>
          }
        />
        <Route
          path="/daily-insight"
          element={
            <LegacyScreenLayout>
              <DailyInsightScreen />
            </LegacyScreenLayout>
          }
        />
        <Route
          path="/journal"
          element={
            <LegacyScreenLayout>
              <JournalScreen />
            </LegacyScreenLayout>
          }
        />
        <Route
          path="/review"
          element={
            <LegacyScreenLayout>
              <ReviewScreen />
            </LegacyScreenLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <LegacyScreenLayout>
              <SettingsScreen />
            </LegacyScreenLayout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export default function App(): React.JSX.Element {
  return (
    <DisplayPreferencesProvider>
      <ScheduleProvider>
        <ChatProvider>
          <ChatNotificationBridge>
            <FaithEntryProvider>
              <BreakProvider>
                <AppRoutes />
              </BreakProvider>
            </FaithEntryProvider>
          </ChatNotificationBridge>
        </ChatProvider>
      </ScheduleProvider>
    </DisplayPreferencesProvider>
  )
}
