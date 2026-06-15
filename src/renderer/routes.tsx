export interface ScreenDefinition {
  path: string
  label: string
  title: string
  description: string
}

export const screenDefinitions: ScreenDefinition[] = [
  {
    path: '/task-matrix',
    label: 'Task Matrix',
    title: 'Task Matrix',
    description:
      'Central task list across all clients and projects, filterable by client and priority, with natural language quick-add.',
  },
  {
    path: '/daily-insight',
    label: 'Daily Insight',
    title: 'Daily Insight',
    description:
      'AI-generated daily briefing from your schedule, tasks, Faith Streak, and yesterday\'s planned vs actual. Advisory only; never auto-modifies your schedule.',
  },
  {
    path: '/journal',
    label: 'Journal',
    title: 'Journal',
    description:
      'Daily Bible reading reference and prayer notes, streak counter, searchable history, and stats (entries this month, longest streak, word count).',
  },
  {
    path: '/review',
    label: 'Review',
    title: 'Review',
    description:
      'Weekly and historical planned vs actual hours per client, plus break log analysis (frequency, duration, reasons).',
  },
  {
    path: '/settings',
    label: 'Settings',
    title: 'Settings',
    description:
      'Set up who you work for, your daily routines, scheduling preferences, optional AI insights, and reminders.',
  },
]

/** Deep-link routes kept out of the icon rail but still registered in App.tsx. */
export const legacyScreenDefinitions: ScreenDefinition[] = [
  {
    path: '/daily-workspace',
    label: 'Daily Workspace',
    title: 'Daily Workspace',
    description:
      'Wake time, capacity, and fixed blocks for today. Most day setup now lives in chat; this screen remains for direct editing.',
  },
  {
    path: '/schedule',
    label: 'Schedule',
    title: 'Schedule',
    description:
      'Full timeline view of today\'s blocks with start, complete, extend, and skip controls.',
  },
]

export const allScreenDefinitions: ScreenDefinition[] = [
  ...screenDefinitions,
  ...legacyScreenDefinitions,
]

export const homeScreenDefinition: ScreenDefinition = {
  path: '/',
  label: 'Dashboard',
  title: 'Dashboard',
  description:
    'Home view with the Focus Assistant chat and day-at-a-glance panel: current block, up next, focus score, and status widgets.',
}
