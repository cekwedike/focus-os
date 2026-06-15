export interface ScreenDefinition {
  path: string
  label: string
  title: string
  description: string
}

export const screenDefinitions: ScreenDefinition[] = [
  {
    path: '/daily-workspace',
    label: 'Daily Workspace',
    title: 'Daily Workspace',
    description:
      'Morning wake-time capture, remaining day capacity, schedule preview before lock-in, and quick actions for your active work session.',
  },
  {
    path: '/task-matrix',
    label: 'Task Matrix',
    title: 'Task Matrix',
    description:
      'Central task list across all clients and projects, filterable by client and priority, with natural language quick-add.',
  },
  {
    path: '/schedule',
    label: 'Schedule',
    title: 'Schedule',
    description:
      "Visual timeline of today's blocks: protected routines, client windows, buffer time, and assigned tasks.",
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

export const homeScreenDefinition: ScreenDefinition = {
  path: '/',
  label: 'Dashboard',
  title: 'Dashboard',
  description:
    'Home view with the Focus Assistant chat and day-at-a-glance panel: current block, up next, focus score, and status widgets.',
}
