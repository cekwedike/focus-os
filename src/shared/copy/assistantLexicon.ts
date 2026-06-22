export const assistantLexicon = {
  appName: 'Focus Assistant',
  tagline: 'Your day, one conversation at a time.',
  awaitingSchedule: 'Waiting for your day plan',
  nowPlaying: (title: string, minutesLeft: number | null): string => {
    if (minutesLeft === null) {
      return title
    }
    if (minutesLeft <= 0) {
      return `${title} · wrapping up`
    }
    return `${title} · ${minutesLeft}m left`
  },
  openMenu: 'Menu',
  openSettings: 'Settings',
  dayDetails: 'Today',
  clearChat: 'Clear',
  morningAskWake: (name: string): string =>
    `Good morning${name ? `, ${name}` : ''}. What time did you wake up?`,
  morningConfirmPlan: 'Looks good — start my day',
  morningChangePlan: 'Change something',
  blockStartingSoon: (title: string, seconds: number): string =>
    `Starting **${title}** in ${seconds} seconds.`,
  blockStarted: (title: string, minutes: number): string =>
    `You're on **${title}** for about ${minutes} minutes.`,
  snooze5: 'Snooze 5m',
  snooze15: 'Snooze 15m',
  skipBlock: 'Skip',
  notReady: 'Not ready yet',
  ready: 'Ready',
  extend5: 'Extend +5m',
} as const
