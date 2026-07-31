import type { Player, ScoreEvent } from '../types/game'

export const POINTS = {
  surviveNight: 10,
  correctVote: 50,
  wrongVote: -10,
  investigationHit: 25,
  successfulProtect: 40,
  villainKill: 20,
  studioWin: 150,
  villainWin: 220,
  survivedToEnd: 30,
} as const

export function applyScores(players: Player[], events: ScoreEvent[]): Player[] {
  if (events.length === 0) return players
  const totals = new Map<string, number>()
  for (const e of events) {
    totals.set(e.playerId, (totals.get(e.playerId) ?? 0) + e.points)
  }
  return players.map((p) => {
    const delta = totals.get(p.id)
    if (!delta) return p
    return { ...p, score: Math.max(0, p.score + delta) }
  })
}

export function scoreEvent(playerId: string, points: number, reason: string): ScoreEvent {
  return { playerId, points, reason }
}
