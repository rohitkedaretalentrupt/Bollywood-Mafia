import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LeaderboardEntry } from '../types/game'

export interface RecordGameInput {
  name: string
  won: boolean
  score: number
  wasVillain: boolean
}

interface LeaderboardState {
  entries: LeaderboardEntry[]
  recordGames: (results: RecordGameInput[]) => void
  clear: () => void
}

function mergeEntry(entry: LeaderboardEntry, input: RecordGameInput): LeaderboardEntry {
  return {
    ...entry,
    wins: entry.wins + (input.won ? 1 : 0),
    losses: entry.losses + (input.won ? 0 : 1),
    villainWins: entry.villainWins + (input.won && input.wasVillain ? 1 : 0),
    games: entry.games + 1,
    highScore: Math.max(entry.highScore, Math.round(input.score)),
    lastPlayed: Date.now(),
  }
}

export const useLeaderboard = create<LeaderboardState>()(
  persist(
    (set) => ({
      entries: [],
      recordGames: (results) =>
        set((state) => {
          const next = state.entries.map((e) => ({ ...e }))
          for (const r of results) {
            const key = r.name.trim().toLowerCase()
            if (!key) continue
            const idx = next.findIndex((e) => e.name.trim().toLowerCase() === key)
            if (idx >= 0) {
              next[idx] = mergeEntry(next[idx], r)
            } else {
              next.push({
                name: r.name.trim(),
                wins: r.won ? 1 : 0,
                losses: r.won ? 0 : 1,
                villainWins: r.won && r.wasVillain ? 1 : 0,
                games: 1,
                highScore: Math.round(r.score),
                lastPlayed: Date.now(),
              })
            }
          }
          next.sort(
            (a, b) => b.wins - a.wins || b.highScore - a.highScore || a.name.localeCompare(b.name),
          )
          return { entries: next.slice(0, 100) }
        }),
      clear: () => set({ entries: [] }),
    }),
    { name: 'bollywood-mafia:leaderboard' },
  ),
)
