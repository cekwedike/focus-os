export const assistantLexicon = {
  appName: 'Focus',
  tagline: 'Your day, one conversation at a time.',
  awaitingSchedule: "Let's plan your day",
  nowPlaying: (title: string, minutesLeft: number | null): string => {
    if (minutesLeft === null) {
      return title
    }
    if (minutesLeft <= 0) {
      return `${title} — wrapping up`
    }
    return `${title} — ${minutesLeft}m left`
  },
  openMenu: 'Menu',
  openSettings: 'Settings',
  dayDetails: "Today's plan",
  clearChat: 'Clear chat',
  morningAskWake: (name: string): string =>
    name
      ? `Good morning, ${name}. What time did you wake up?`
      : 'Good morning. What time did you wake up?',
  morningConfirmPlan: 'Looks good',
  morningChangePlan: 'Change something',
  blockStartingSoon: (title: string, seconds: number): string => {
    const label = seconds <= 60 ? `${seconds} seconds` : 'about a minute'
    return `Starting ${title} in ${label}.`
  },
  blockStarted: (title: string, minutes: number): string =>
    `You're on ${title} for about ${minutes} minutes.`,
  snooze5: 'Snooze 5m',
  snooze15: 'Snooze 15m',
  skipBlock: 'Skip',
  notReady: 'Not ready',
  ready: "I'm ready",
  extend5: '+5 min',
} as const
