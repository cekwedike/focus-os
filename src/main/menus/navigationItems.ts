export interface AppNavItem {
  label: string
  path: string
  accelerator?: string
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  { label: 'Chat', path: '/', accelerator: 'CmdOrCtrl+0' },
  { label: 'Dashboard', path: '/dashboard', accelerator: 'CmdOrCtrl+1' },
  { label: 'Daily Workspace', path: '/daily-workspace', accelerator: 'CmdOrCtrl+2' },
  { label: 'Task Matrix', path: '/task-matrix', accelerator: 'CmdOrCtrl+3' },
  { label: 'Schedule', path: '/schedule', accelerator: 'CmdOrCtrl+4' },
  { label: 'Daily Insight', path: '/daily-insight', accelerator: 'CmdOrCtrl+5' },
  { label: 'Journal', path: '/journal', accelerator: 'CmdOrCtrl+6' },
  { label: 'Review', path: '/review', accelerator: 'CmdOrCtrl+7' },
  { label: 'Settings', path: '/settings', accelerator: 'CmdOrCtrl+,' },
]
