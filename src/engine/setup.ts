import { BOT_AVATARS, BOT_NAMES, PERSONALITY_IDS } from '../data'
import { buildRoleDeck } from '../data/roles'
import type { BotMemory, Player, PersonalityId, RoleId } from '../types/game'
import { pick, shuffle, uid } from './util'

export function emptyMemory(): BotMemory {
  return {
    suspicion: {},
    facts: [],
    visited: [],
    lastTargetId: null,
    hasClaimedRole: false,
    cleared: [],
    convicted: [],
  }
}

export interface SeatDraft {
  id: string
  name: string
  avatar: string
  isBot: boolean
  isLocal: boolean
}

export function makeSeat(name: string, avatar: string, opts?: { isBot?: boolean; isLocal?: boolean }): SeatDraft {
  return {
    id: uid('p'),
    name: name.trim().slice(0, 14) || 'Newcomer',
    avatar,
    isBot: opts?.isBot ?? false,
    isLocal: opts?.isLocal ?? true,
  }
}

/** Creates `count` bot seats that don't collide with existing names or avatars. */
export function makeBotSeats(count: number, taken: SeatDraft[]): SeatDraft[] {
  const usedNames = new Set(taken.map((s) => s.name.toLowerCase()))
  const usedAvatars = new Set(taken.map((s) => s.avatar))
  const names = shuffle(BOT_NAMES).filter((n) => !usedNames.has(n.toLowerCase()))
  const avatars = shuffle(BOT_AVATARS).filter((a) => !usedAvatars.has(a))
  const seats: SeatDraft[] = []
  for (let i = 0; i < count; i++) {
    const name = names[i] ?? `Extra ${i + 1}`
    const avatar = avatars[i % Math.max(1, avatars.length)] ?? '🎭'
    seats.push({ id: uid('bot'), name, avatar, isBot: true, isLocal: false })
  }
  return seats
}

function seatToPlayer(seat: SeatDraft, role: RoleId, personality: PersonalityId): Player {
  return {
    id: seat.id,
    name: seat.name,
    avatar: seat.avatar,
    isBot: seat.isBot,
    isLocal: seat.isLocal,
    role,
    alive: true,
    score: 0,
    personality,
    eliminatedRound: null,
    eliminatedBy: null,
    claimedRole: null,
    memory: emptyMemory(),
  }
}

/**
 * Deals roles to seats. Bots get a personality; humans get one too so the
 * scoring/UI code never has to special-case them.
 *
 * Guarantee: in solo mode the single human is *not* always town — the deck is
 * shuffled honestly, so you can absolutely draw the Villain.
 */
export function dealPlayers(seats: SeatDraft[]): Player[] {
  const deck = shuffle(buildRoleDeck(seats.length))
  const personalities = shuffle(PERSONALITY_IDS)
  const players = seats.map((seat, i) =>
    seatToPlayer(seat, deck[i] ?? 'audience', personalities[i % personalities.length]),
  )

  // Seed every bot's suspicion map with mild noise so opening days differ.
  for (const p of players) {
    for (const other of players) {
      if (other.id === p.id) continue
      p.memory.suspicion[other.id] = Math.random() * 6 - 3
    }
  }

  // Villains know each other from the start.
  const villains = players.filter((p) => p.role === 'villain')
  for (const v of villains) {
    for (const ally of villains) {
      if (ally.id === v.id) continue
      v.memory.suspicion[ally.id] = -120
      v.memory.cleared.push(ally.id)
    }
  }

  return players
}

export function randomPersonality(): PersonalityId {
  return pick(PERSONALITY_IDS) ?? 'analytical'
}
