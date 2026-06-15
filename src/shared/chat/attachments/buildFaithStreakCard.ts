import type { FaithStreakCardAttachment } from '@shared/types/chat'

export interface FaithStatsForCard {
  currentStreak: number
  longestStreak: number
  todayLogged: boolean
  entriesThisMonth?: number
}

export function buildFaithStreakCard(stats: FaithStatsForCard): FaithStreakCardAttachment {
  return {
    type: 'faith_streak_card',
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    todayLogged: stats.todayLogged,
    entriesThisMonth: stats.entriesThisMonth,
  }
}
