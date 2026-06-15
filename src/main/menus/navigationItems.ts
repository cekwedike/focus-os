export const APP_NAV_ITEMS = [
  { label: 'Dashboard', path: '/', accelerator: 'CmdOrCtrl+0' },
  { label: 'Daily Workspace', path: '/daily-workspace', accelerator: 'CmdOrCtrl+1' },
  { label: 'Task Matrix', path: '/task-matrix', accelerator: 'CmdOrCtrl+2' },
  { label: 'Schedule', path: '/schedule', accelerator: 'CmdOrCtrl+3' },
  { label: 'Daily Insight', path: '/daily-insight', accelerator: 'CmdOrCtrl+4' },
  { label: 'Journal', path: '/journal', accelerator: 'CmdOrCtrl+5' },
  { label: 'Review', path: '/review', accelerator: 'CmdOrCtrl+6' },
  { label: 'Settings', path: '/settings', accelerator: 'CmdOrCtrl+,' },
] as const

export type AppNavItem = (typeof APP_NAV_ITEMS)[number]
