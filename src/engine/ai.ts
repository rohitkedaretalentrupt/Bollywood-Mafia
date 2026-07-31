import { PERSONALITIES, ROLES, pickFrom, pickLine } from '../data'
import { DEATH_REACT, QUIET_NIGHT_REACT, SAVED_REACT, VOTE_LINES } from '../data/dialogue'
import type {
  BotMemory,
  ChatMessage,
  ChatTone,
  Clue,
  NightResult,
  Player,
  RoleId,
} from '../types/game'
import { chance, clamp, pick, sortByDesc, uid, weightedPick } from './util'

/* ================================================================== *
 * Bot brain
 *
 * Every bot keeps a suspicion map, a fact log and two deduction sets
 * (cleared / convicted). Facts arrive from public clues, private role
 * results, deaths, votes and accusations — then a deduction pass tries
 * to collapse "one of these three" clues into a name.
 * ================================================================== */

const SUSPICION_MIN = -160
const SUSPICION_MAX = 400

function cloneMemory(mem: BotMemory): BotMemory {
  return {
    suspicion: { ...mem.suspicion },
    facts: mem.facts.slice(),
    visited: mem.visited.slice(),
    lastTargetId: mem.lastTargetId,
    hasClaimedRole: mem.hasClaimedRole,
    cleared: mem.cleared.slice(),
    convicted: mem.convicted.slice(),
  }
}

function bump(mem: BotMemory, id: string, delta: number) {
  const current = mem.suspicion[id] ?? 0
  mem.suspicion[id] = clamp(current + delta, SUSPICION_MIN, SUSPICION_MAX)
}

function addUnique(list: string[], id: string) {
  if (!list.includes(id)) list.push(id)
}

/** Applies `fn` to every bot's private memory, returning a new player array. */
function mapBotMemories(
  players: Player[],
  fn: (bot: Player, mem: BotMemory) => void,
): Player[] {
  return players.map((p) => {
    if (!p.isBot) return p
    const mem = cloneMemory(p.memory)
    fn(p, mem)
    return { ...p, memory: mem }
  })
}

/**
 * Collapses "at least one of A, B, C" facts against the cleared set.
 * If everyone in a trio except one player is cleared, the survivor is the
 * villain. This is what makes late-game bots feel genuinely dangerous.
 */
function deduce(bot: Player, mem: BotMemory, alive: Set<string>) {
  const clearedSet = new Set(mem.cleared)
  for (const fact of mem.facts) {
    if (fact.kind !== 'clue') continue
    if (fact.detail !== 'trio') continue
    const remaining = fact.subjects.filter((id) => !clearedSet.has(id))
    if (remaining.length === 1) {
      const suspectId = remaining[0]
      // A bot never deduces itself, and villains never convict allies.
      if (suspectId === bot.id) continue
      if (bot.role === 'villain' && clearedSet.has(suspectId)) continue
      addUnique(mem.convicted, suspectId)
    } else if (remaining.length === 2) {
      for (const id of remaining) if (id !== bot.id) bump(mem, id, 8)
    }
  }
  for (const id of mem.convicted) {
    if (alive.has(id)) mem.suspicion[id] = SUSPICION_MAX
  }
  for (const id of mem.cleared) {
    if (!mem.convicted.includes(id)) mem.suspicion[id] = Math.min(mem.suspicion[id] ?? 0, -70)
  }
}

/* ------------------------- fact ingestion ------------------------- */

export function ingestPublicClues(players: Player[], clues: Clue[], round: number): Player[] {
  const alive = new Set(players.filter((p) => p.alive).map((p) => p.id))
  return mapBotMemories(players, (bot, mem) => {
    const aggression = PERSONALITIES[bot.personality].aggression
    for (const clue of clues) {
      if (clue.visibility !== 'public') continue
      switch (clue.kind) {
        case 'trio': {
          mem.facts.push({
            kind: 'clue',
            round,
            subjects: clue.subjects.slice(),
            detail: 'trio',
            weight: 1,
          })
          // A villain bot already knows which of the three is the real one.
          for (const id of clue.subjects) {
            if (id === bot.id) continue
            if (mem.cleared.includes(id)) continue
            bump(mem, id, 11 * aggression)
          }
          break
        }
        case 'clear-pair': {
          for (const id of clue.subjects) {
            addUnique(mem.cleared, id)
            bump(mem, id, -45)
          }
          mem.facts.push({
            kind: 'clue',
            round,
            subjects: clue.subjects.slice(),
            detail: 'clear-pair',
            weight: 1,
          })
          break
        }
        case 'visited': {
          // The villain never knocks on their own door.
          for (const id of clue.subjects) {
            addUnique(mem.cleared, id)
            bump(mem, id, -35)
          }
          break
        }
        case 'acted': {
          for (const id of clue.subjects) {
            if (id === bot.id) continue
            bump(mem, id, 5 * aggression)
          }
          break
        }
        case 'no-action': {
          for (const id of clue.subjects) bump(mem, id, -14)
          break
        }
        case 'count': {
          mem.facts.push({
            kind: 'clue',
            round,
            subjects: [],
            detail: `count:${clue.count ?? 0}`,
            weight: 0.4,
          })
          break
        }
        default:
          break
      }
    }
    deduce(bot, mem, alive)
  })
}

/** A bot's own private role result (Director / Heroine / Paparazzi). */
export function ingestPrivateClue(players: Player[], ownerId: string, clue: Clue): Player[] {
  const alive = new Set(players.filter((p) => p.alive).map((p) => p.id))
  return mapBotMemories(players, (bot, mem) => {
    if (bot.id !== ownerId) return
    if (clue.kind === 'investigation') {
      const subject = clue.subjects[0]
      if (!subject) return
      if (clue.verdict === 'villain') {
        addUnique(mem.convicted, subject)
        mem.suspicion[subject] = SUSPICION_MAX
      } else {
        addUnique(mem.cleared, subject)
        bump(mem, subject, -140)
      }
      mem.facts.push({
        kind: 'investigation',
        round: clue.round,
        subjects: [subject],
        detail: clue.verdict ?? 'innocent',
        weight: 3,
      })
    } else if (clue.kind === 'read') {
      const subject = clue.subjects[0]
      if (!subject) return
      if (clue.verdict === 'villain') bump(mem, subject, 55)
      else bump(mem, subject, -40)
    } else if (clue.kind === 'stakeout') {
      // "A visited B" only proves A moved. B is *probably* innocent (villains
      // rarely get visited) but not provably so — never add B to `cleared`,
      // because the deduction pass treats that set as ground truth.
      const [watched, visited] = clue.subjects
      if (watched) bump(mem, watched, 16)
      if (visited) bump(mem, visited, -20)
    }
    deduce(bot, mem, alive)
  })
}

/** The villain's victim is (almost) never a villain — that is free information. */
export function ingestNight(players: Player[], night: NightResult): Player[] {
  const alive = new Set(players.filter((p) => p.alive).map((p) => p.id))
  return mapBotMemories(players, (bot, mem) => {
    if (night.killedId) {
      addUnique(mem.cleared, night.killedId)
      mem.facts.push({
        kind: 'death',
        round: night.round,
        subjects: [night.killedId],
        detail: 'villain-kill',
        weight: 2,
      })
    }
    if (night.savedId) addUnique(mem.cleared, night.savedId)
    deduce(bot, mem, alive)
  })
}

export function ingestVerdict(
  players: Player[],
  votes: Record<string, string>,
  eliminatedId: string | null,
  wasVillain: boolean,
  round: number,
): Player[] {
  const alive = new Set(players.filter((p) => p.alive).map((p) => p.id))
  return mapBotMemories(players, (bot, mem) => {
    if (!eliminatedId) return
    if (!wasVillain) addUnique(mem.cleared, eliminatedId)

    for (const [voterId, targetId] of Object.entries(votes)) {
      if (voterId === bot.id) continue
      const votedTheVillain = targetId === eliminatedId && wasVillain
      const votedInnocent = targetId === eliminatedId && !wasVillain
      if (votedTheVillain) bump(mem, voterId, -18)
      else if (votedInnocent) bump(mem, voterId, 11)
      mem.facts.push({
        kind: 'vote',
        round,
        subjects: [targetId],
        source: voterId,
        detail: wasVillain ? 'hit' : 'miss',
        weight: 0.5,
      })
    }
    deduce(bot, mem, alive)
  })
}

/** Called whenever anyone (human or bot) publicly accuses someone. */
export function ingestAccusation(
  players: Player[],
  accuserId: string,
  targetId: string,
  round: number,
): Player[] {
  return mapBotMemories(players, (bot, mem) => {
    if (bot.id === targetId) {
      // Grudge: bots push back on whoever came for them.
      bump(mem, accuserId, 14)
      return
    }
    if (bot.id === accuserId) return
    const gullibility = PERSONALITIES[bot.personality].gullibility
    if (!mem.cleared.includes(targetId)) bump(mem, targetId, 9 * gullibility)
    mem.facts.push({
      kind: 'accusation',
      round,
      subjects: [targetId],
      source: accuserId,
      detail: 'public',
      weight: 0.6,
    })
  })
}

/** Public role claims move the needle a lot, weighted by how trusting a bot is. */
export function ingestClaim(
  players: Player[],
  claimerId: string,
  role: RoleId,
  round: number,
): Player[] {
  return mapBotMemories(players, (bot, mem) => {
    if (bot.id === claimerId) return
    const gullibility = PERSONALITIES[bot.personality].gullibility
    if (role === 'director' || role === 'hero') {
      // Believable power claim: either they are useful, or they are a bold liar.
      bump(mem, claimerId, -22 * gullibility + 6)
    } else {
      bump(mem, claimerId, -8 * gullibility)
    }
    mem.facts.push({
      kind: 'claim',
      round,
      subjects: [claimerId],
      detail: role,
      weight: 1,
    })
  })
}

/** Quiet players slowly become suspicious. Classic social deduction pressure. */
export function decaySilence(players: Player[], spokeIds: string[], round: number): Player[] {
  const spoke = new Set(spokeIds)
  return mapBotMemories(players, (bot, mem) => {
    for (const other of players) {
      if (other.id === bot.id || !other.alive) continue
      if (!spoke.has(other.id) && !mem.cleared.includes(other.id)) bump(mem, other.id, 4)
    }
    void round
  })
}

/* --------------------------- night choices --------------------------- */

function suspicionOf(mem: BotMemory, id: string): number {
  return mem.suspicion[id] ?? 0
}

/** How much the rest of the table appears to trust each player. */
function tableTrust(players: Player[]): Record<string, number> {
  const out: Record<string, number> = {}
  const bots = players.filter((p) => p.isBot && p.alive)
  for (const target of players) {
    if (!target.alive) continue
    let sum = 0
    for (const bot of bots) {
      if (bot.id === target.id) continue
      sum += suspicionOf(bot.memory, target.id)
    }
    out[target.id] = -sum
  }
  return out
}

export function botNightTarget(bot: Player, players: Player[]): string | null {
  const role = ROLES[bot.role]
  if (!role.actsAtNight) return null
  const alive = players.filter((p) => p.alive)
  const mem = bot.memory

  if (bot.role === 'villain') {
    const prey = alive.filter((p) => p.id !== bot.id && p.role !== 'villain')
    if (prey.length === 0) return null
    const trust = tableTrust(players)
    const claimedPower = prey.filter(
      (p) => p.claimedRole === 'director' || p.claimedRole === 'hero',
    )
    // Silence the confirmed threat first.
    if (claimedPower.length > 0) {
      const target = sortByDesc(claimedPower, (p) => (p.claimedRole === 'director' ? 2 : 1))[0]
      if (target && chance(0.85)) return target.id
    }
    // Otherwise kill the most trusted player and keep the town's favourite
    // scapegoat alive to absorb tomorrow's vote.
    const weights = prey.map((p) => {
      const trustScore = clamp((trust[p.id] ?? 0) / 40, -3, 6)
      const scapegoatPenalty = suspicionOf(mem, p.id) > 60 ? -2.5 : 0
      return Math.max(0.3, 2.4 + trustScore + scapegoatPenalty)
    })
    return weightedPick(prey, weights)?.id ?? prey[0].id
  }

  if (bot.role === 'director') {
    const pool = alive.filter(
      (p) => p.id !== bot.id && !mem.visited.includes(p.id) && !mem.cleared.includes(p.id),
    )
    const fallback = alive.filter((p) => p.id !== bot.id)
    const candidates = pool.length > 0 ? pool : fallback
    if (candidates.length === 0) return null
    const ranked = sortByDesc(candidates, (p) => suspicionOf(mem, p.id))
    return chance(0.78) ? ranked[0].id : (pick(candidates)?.id ?? ranked[0].id)
  }

  if (bot.role === 'hero') {
    const pool = alive.filter((p) => p.id !== bot.id && p.id !== mem.lastTargetId)
    const candidates = pool.length > 0 ? pool : alive.filter((p) => p.id !== bot.id)
    if (candidates.length === 0) return null
    const claimedPower = candidates.filter(
      (p) => p.claimedRole === 'director' || p.claimedRole === 'paparazzi',
    )
    if (claimedPower.length > 0 && chance(0.8)) return claimedPower[0].id
    // Guard whoever looks most trusted — the villain's likeliest target.
    const trust = tableTrust(players)
    const ranked = sortByDesc(candidates, (p) => trust[p.id] ?? 0)
    return chance(0.7) ? ranked[0].id : (pick(candidates)?.id ?? ranked[0].id)
  }

  if (bot.role === 'choreographer') {
    const pool = alive.filter(
      (p) => p.id !== bot.id && !mem.cleared.includes(p.id) && p.id !== mem.lastTargetId,
    )
    const candidates = pool.length > 0 ? pool : alive.filter((p) => p.id !== bot.id)
    if (candidates.length === 0) return null
    const ranked = sortByDesc(candidates, (p) => suspicionOf(mem, p.id))
    return chance(0.75) ? ranked[0].id : (pick(candidates)?.id ?? ranked[0].id)
  }

  if (bot.role === 'heroine' || bot.role === 'paparazzi') {
    const pool = alive.filter(
      (p) => p.id !== bot.id && !mem.visited.includes(p.id) && !mem.cleared.includes(p.id),
    )
    const candidates = pool.length > 0 ? pool : alive.filter((p) => p.id !== bot.id)
    if (candidates.length === 0) return null
    const ranked = sortByDesc(candidates, (p) => suspicionOf(mem, p.id))
    return chance(0.65) ? ranked[0].id : (pick(candidates)?.id ?? ranked[0].id)
  }

  return null
}

/* ----------------------------- voting ----------------------------- */

export function botVote(bot: Player, players: Player[]): string | null {
  const alive = players.filter((p) => p.alive && p.id !== bot.id)
  if (alive.length === 0) return null
  const mem = bot.memory
  const { chaos, aggression } = PERSONALITIES[bot.personality]

  const weights = alive.map((p) => {
    let s = suspicionOf(mem, p.id)
    if (mem.convicted.includes(p.id)) s += 260
    if (mem.cleared.includes(p.id)) s -= 90

    // Villains protect their own — unless the table has already decided, in
    // which case blending in beats dying on a hill.
    if (bot.role === 'villain' && p.role === 'villain') s -= 900

    const base = clamp(s, -60, SUSPICION_MAX) + 70
    const shaped = Math.pow(Math.max(1, base), 1.35 + aggression * 0.25)
    const jitter = 1 + chaos * (Math.random() - 0.5) * 1.6
    return Math.max(0.05, shaped * jitter)
  })

  // Bandwagon check: if a villain bot sees its ally about to be lynched by a
  // landslide, it sometimes joins the mob to survive the round.
  if (bot.role === 'villain' && chance(0.28)) {
    const ally = alive.find((p) => p.role === 'villain')
    if (ally) {
      const allyHeat = players
        .filter((p) => p.isBot && p.alive && p.role !== 'villain')
        .reduce((acc, other) => acc + suspicionOf(other.memory, ally.id), 0)
      if (allyHeat > 220) return ally.id
    }
  }

  return weightedPick(alive, weights)?.id ?? alive[0].id
}

/* ---------------------------- dialogue ---------------------------- */

function msg(
  player: Player,
  text: string,
  tone: ChatTone,
  round: number,
  targetId?: string,
): ChatMessage {
  return {
    id: uid('msg'),
    round,
    playerId: player.id,
    playerName: player.name,
    avatar: player.avatar,
    text,
    tone,
    targetId,
  }
}

export function systemMessage(text: string, round: number): ChatMessage {
  return {
    id: uid('sys'),
    round,
    playerId: 'system',
    playerName: 'Set Announcement',
    avatar: '📣',
    text,
    tone: 'system',
  }
}

export interface DayDialogueResult {
  messages: ChatMessage[]
  /** Accusations to feed back into memories: [accuserId, targetId] */
  accusations: [string, string][]
  /** Claims to feed back into memories: [claimerId, roleId] */
  claims: [string, RoleId][]
}

/**
 * Builds the whole day's bot conversation up front. The Day screen then
 * streams it out on a timer so it feels like a live argument.
 */
export function generateDayDialogue(
  players: Player[],
  round: number,
  night: NightResult | null,
): DayDialogueResult {
  const messages: ChatMessage[] = []
  const accusations: [string, string][] = []
  const claims: [string, RoleId][] = []
  const aliveBots = players.filter((p) => p.alive && p.isBot)
  const alive = players.filter((p) => p.alive)

  // 1. Somebody reacts to the night.
  const reactor = pick(aliveBots)
  if (reactor) {
    if (night?.killedId) {
      const dead = players.find((p) => p.id === night.killedId)
      messages.push(
        msg(reactor, pickFrom(DEATH_REACT, { dead: dead?.name ?? 'they' }), 'observe', round),
      )
    } else if (night?.savedId) {
      messages.push(msg(reactor, pickFrom(SAVED_REACT, {}), 'observe', round))
    } else if (round > 1) {
      messages.push(msg(reactor, pickFrom(QUIET_NIGHT_REACT, {}), 'observe', round))
    }
  }

  // 2. Power-role bots with hard information go loud.
  for (const bot of aliveBots) {
    if (bot.memory.hasClaimedRole) continue
    const convictedAlive = bot.memory.convicted.filter((id) =>
      alive.some((p) => p.id === id && p.id !== bot.id),
    )
    const shouldClaim =
      bot.role === 'director' && convictedAlive.length > 0 && round >= 1 && chance(0.85)
    if (shouldClaim) {
      claims.push([bot.id, bot.role])
      messages.push(
        msg(bot, pickLine('claim', bot.personality, { role: ROLES[bot.role].name.toUpperCase() }), 'claim', round),
      )
      const target = players.find((p) => p.id === convictedAlive[0])
      if (target) {
        accusations.push([bot.id, target.id])
        messages.push(
          msg(
            bot,
            `I screened the footage. ${target.name} is the villain. Vote ${target.name}.`,
            'accuse',
            round,
            target.id,
          ),
        )
      }
    }
  }

  // 3. Everyone else talks, weighted by personality.
  const heatOnMe = (id: string) =>
    accusations.filter(([, t]) => t === id).length +
    players.filter((p) => p.isBot && p.alive && (p.memory.suspicion[id] ?? 0) > 80).length

  for (const bot of aliveBots) {
    if (bot.memory.hasClaimedRole) continue
    if (messages.some((m) => m.playerId === bot.id)) continue
    const { chattiness } = PERSONALITIES[bot.personality]
    if (!chance(clamp(chattiness, 0.15, 1)) && round > 1) continue

    const others = alive.filter((p) => p.id !== bot.id)
    if (others.length === 0) continue

    if (heatOnMe(bot.id) >= 2 && chance(0.75)) {
      messages.push(msg(bot, pickLine('defend', bot.personality, {}), 'defend', round))
      continue
    }

    const ranked = sortByDesc(others, (p) => bot.memory.suspicion[p.id] ?? 0)
    const top = ranked[0]
    const topScore = bot.memory.suspicion[top.id] ?? 0

    // A villain bot never accuses an ally — it redirects at the most trusted
    // townsperson instead.
    let target = top
    if (bot.role === 'villain') {
      const nonAllies = ranked.filter((p) => p.role !== 'villain')
      const trust = tableTrust(players)
      target =
        nonAllies.find((p) => (bot.memory.suspicion[p.id] ?? 0) > 40) ??
        sortByDesc(nonAllies, (p) => trust[p.id] ?? 0)[0] ??
        top
    }

    const wantsAccusation = bot.role === 'villain' ? chance(0.7) : topScore > 25 || chance(0.5)

    if (wantsAccusation && target.id !== bot.id) {
      accusations.push([bot.id, target.id])
      messages.push(
        msg(bot, pickLine('accuse', bot.personality, { target: target.name }), 'accuse', round, target.id),
      )
    } else if (chance(0.3)) {
      messages.push(msg(bot, pickLine('joke', bot.personality, {}), 'joke', round))
    } else {
      messages.push(msg(bot, pickLine('observe', bot.personality, {}), 'observe', round))
    }
  }

  return { messages, accusations, claims }
}

export function botVoteLine(bot: Player, targetName: string, round: number): ChatMessage {
  return msg(bot, pickFrom(VOTE_LINES, { target: targetName }), 'accuse', round)
}

/** Marks a bot as having claimed so it does not claim twice. */
export function markClaimed(players: Player[], claimerId: string, role: RoleId): Player[] {
  return players.map((p) =>
    p.id === claimerId
      ? { ...p, claimedRole: role, memory: { ...cloneMemory(p.memory), hasClaimedRole: true } }
      : p,
  )
}
