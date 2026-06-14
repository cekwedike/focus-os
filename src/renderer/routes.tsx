export interface ScreenDefinition {
  path: string
  label: string
  title: string
  description: string
}

export const screenDefinitions: ScreenDefinition[] = [
  {
    path: '/',
    label: 'Dashboard',
    title: 'Dashboard',
    description:
      'Day-at-a-glance view with current and next block, progress through your schedule, and quick status indicators.',
  },
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
      'Visual timeline of today\'s blocks: protected routines, client windows, buffer time, and assigned tasks.',
  },
  {
    path: '/daily-insight',
    label: 'Daily Insight',
    title: 'Daily Insight',
    description:
      'AI-generated daily briefing from your schedule, tasks, faith streak, and yesterday\'s planned vs actual. Advisory only; never auto-modifies your schedule.',
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
      'Client and project CRUD, protected block preferences, buffer percentage, OpenRouter and Ollama configuration, and notification preferences.',
  },
]
