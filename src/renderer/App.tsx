import { Navigate, Route, Routes } from 'react-router-dom'
import { DisplayPreferencesProvider } from './context/DisplayPreferencesContext'
import { ScheduleProvider } from './context/ScheduleContext'
import { BreakProvider } from './context/BreakContext'
import { AppShell } from './components/layout/AppShell'
import { useAppNavigationEvents } from './hooks/useAppNavigationEvents'
import { DashboardScreen } from './screens/Dashboard/DashboardScreen'
import { DailyWorkspaceScreen } from './screens/DailyWorkspace/DailyWorkspaceScreen'
import { TaskMatrixScreen } from './screens/TaskMatrix/TaskMatrixScreen'
import { ScheduleScreen } from './screens/Schedule/ScheduleScreen'
import { DailyInsightScreen } from './screens/DailyInsight/DailyInsightScreen'
import { JournalScreen } from './screens/Journal/JournalScreen'
import { ReviewScreen } from './screens/Review/ReviewScreen'
import { SettingsScreen } from './screens/Settings/SettingsScreen'

function AppRoutes(): React.JSX.Element {
  useAppNavigationEvents()

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardScreen />} />
        <Route path="/daily-workspace" element={<DailyWorkspaceScreen />} />
        <Route path="/task-matrix" element={<TaskMatrixScreen />} />
        <Route path="/schedule" element={<ScheduleScreen />} />
        <Route path="/daily-insight" element={<DailyInsightScreen />} />
        <Route path="/journal" element={<JournalScreen />} />
        <Route path="/review" element={<ReviewScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export default function App(): React.JSX.Element {
  return (
    <DisplayPreferencesProvider>
      <ScheduleProvider>
        <BreakProvider>
          <AppRoutes />
        </BreakProvider>
      </ScheduleProvider>
    </DisplayPreferencesProvider>
  )
}
