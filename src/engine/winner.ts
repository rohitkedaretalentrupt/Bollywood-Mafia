import type { Player, ScoreEvent, Team, VerdictResult } from '../types/game'
import { POINTS, scoreEvent } from './scoring'

export interface VoteResolution {
  players: Player[]
  verdict: VerdictResult
  scoreEvents: ScoreEvent[]
}

export function tallyVotes(
  players: Player[],
  votes: Record<string, string>,
): { playerId: string; votes: number; voters: string[] }[] {
  const alive = players.filter((p) => p.alive)
  const counts = new Map<string, string[]>()
  for (const p of alive) counts.set(p.id, [])
  for (const [voterId, targetId] of Object.entries(votes)) {
    if (!counts.has(targetId)) continue
    const list = counts.get(targetId)
    if (list) list.push(voterId)
  }
  return Array.from(counts.entries())
    .map(([playerId, voters]) => ({ playerId, votes: voters.length, voters }))
    .sort((a, b) => b.votes - a.votes)
}

export function resolveVotes(
  round: number,
  playersIn: Player[],
  votes: Record<string, string>,
): VoteResolution {
  const players = playersIn.map((p) => ({ ...p }))
  const tally = tallyVotes(players, votes)
  const top = tally[0]
  const runnerUp = tally[1]

  const noVotes = !top || top.votes === 0
  const tie = !noVotes && !!runnerUp && runnerUp.votes === top.votes

  const scoreEvents: ScoreEvent[] = []

  if (noVotes || tie) {
    return {
      players,
      verdict: { round, eliminatedId: null, tie: true, tally, wasVillain: false },
      scoreEvents,
    }
  }

  const target = players.find((p) => p.id === top.playerId)
  if (!target) {
    return {
      players,
      verdict: { round, eliminatedId: null, tie: true, tally, wasVillain: false },
      scoreEvents,
    }
  }

  target.alive = false
  target.eliminatedRound = round
  target.eliminatedBy = 'vote'
  const wasVillain = target.role === 'villain'

  for (const [voterId, targetId] of Object.entries(votes)) {
    if (targetId !== target.id) continue
    scoreEvents.push(
      wasVillain
        ? scoreEvent(voterId, POINTS.correctVote, 'Voted out a villain')
        : scoreEvent(voterId, POINTS.wrongVote, 'Fired an innocent'),
    )
  }

  return {
    players,
    verdict: { round, eliminatedId: target.id, tie: false, tally, wasVillain },
    scoreEvents,
  }
}

export function checkWinner(players: Player[]): Team | null {
  const alive = players.filter((p) => p.alive)
  const villains = alive.filter((p) => p.role === 'villain')
  const studio = alive.filter((p) => p.role !== 'villain')
  if (villains.length === 0) return 'studio'
  if (villains.length >= studio.length) return 'villain'
  return null
}

/** Final payout once the credits roll. */
export function finalScoreEvents(players: Player[], winner: Team): ScoreEvent[] {
  const events: ScoreEvent[] = []
  for (const p of players) {
    const team = p.role === 'villain' ? 'villain' : 'studio'
    if (team === winner) {
      events.push(
        scoreEvent(
          p.id,
          winner === 'villain' ? POINTS.villainWin : POINTS.studioWin,
          winner === 'villain' ? 'Ruined the movie' : 'Saved the movie',
        ),
      )
    }
    if (p.alive) events.push(scoreEvent(p.id, POINTS.survivedToEnd, 'Still standing at the wrap'))
  }
  return events
}

export function winnerLabel(winner: Team): { title: string; subtitle: string; emoji: string } {
  return winner === 'studio'
    ? {
        title: 'THE MOVIE IS SAVED',
        subtitle: 'Every villain has been thrown off the set. Roll the credits.',
        emoji: '🏆',
      }
    : {
        title: 'THE MOVIE IS RUINED',
        subtitle: 'The villain walked off set with the negatives. Production is shut down.',
        emoji: '😈',
      }
}
