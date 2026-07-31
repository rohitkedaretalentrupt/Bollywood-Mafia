import { ROLES } from '../data'
import type {
  Clue,
  NightAction,
  NightResult,
  Player,
  PrivateResult,
  ScoreEvent,
} from '../types/game'
import { botNightTarget } from './ai'
import { generatePublicClues, heroineReadClue, investigationClue, stakeoutClue } from './clues'
import { POINTS, scoreEvent } from './scoring'
import { chance } from './util'

export interface NightResolution {
  players: Player[]
  result: NightResult
  clues: Clue[]
  scoreEvents: ScoreEvent[]
}

/** Fills in night actions for every living bot that has a night ability. */
export function collectBotActions(players: Player[], existing: NightAction[]): NightAction[] {
  const done = new Set(existing.map((a) => a.actorId))
  const extra: NightAction[] = []
  for (const bot of players) {
    if (!bot.isBot || !bot.alive) continue
    if (done.has(bot.id)) continue
    if (!ROLES[bot.role].actsAtNight) continue
    extra.push({ actorId: bot.id, roleId: bot.role, targetId: botNightTarget(bot, players) })
  }
  return [...existing, ...extra]
}

/**
 * Night resolution order:
 *   1. Choreographers block  →  2. Heroes protect  →  3. Villains strike
 *   →  4. Information roles read the aftermath
 * A blocked actor's ability does nothing at all.
 */
export function resolveNight(
  round: number,
  playersIn: Player[],
  actions: NightAction[],
): NightResolution {
  const players = playersIn.map((p) => ({ ...p }))
  const byId = new Map(players.map((p) => [p.id, p]))
  const live = (id: string | null | undefined) => (id ? byId.get(id) : undefined)

  const act = (roleId: string) =>
    actions.filter((a) => a.roleId === roleId && a.targetId && live(a.actorId)?.alive)

  // 1. Blocks
  const blockedIds: string[] = []
  for (const a of act('choreographer')) {
    if (a.targetId) blockedIds.push(a.targetId)
  }
  const isBlocked = (id: string) => blockedIds.includes(id)

  // 2. Protection
  const protectedIds: string[] = []
  const protectors = new Map<string, string>()
  for (const a of act('hero')) {
    if (isBlocked(a.actorId) || !a.targetId) continue
    protectedIds.push(a.targetId)
    protectors.set(a.targetId, a.actorId)
  }

  // 3. The strike
  let villainTargetId: string | null = null
  let killedId: string | null = null
  let savedId: string | null = null
  const villainActions = act('villain')
  if (villainActions.length > 0) {
    // With multiple villains, the first submitted target wins the night.
    const chosen = villainActions.find((a) => !isBlocked(a.actorId)) ?? null
    if (chosen?.targetId) {
      villainTargetId = chosen.targetId
      const victim = live(chosen.targetId)
      if (victim && victim.alive) {
        if (protectedIds.includes(victim.id)) {
          savedId = victim.id
        } else {
          victim.alive = false
          victim.eliminatedRound = round
          victim.eliminatedBy = 'villain'
          killedId = victim.id
        }
      }
    } else if (villainActions[0]?.targetId) {
      // Every villain was dragged into rehearsal — the target survives silently.
      villainTargetId = villainActions[0].targetId
    }
  }

  const scoreEvents: ScoreEvent[] = []
  const clues: Clue[] = []
  const privateResults: PrivateResult[] = []

  if (savedId) {
    const heroId = protectors.get(savedId)
    if (heroId) scoreEvents.push(scoreEvent(heroId, POINTS.successfulProtect, 'Saved a life'))
  }
  if (killedId) {
    for (const a of villainActions) {
      if (!isBlocked(a.actorId)) {
        scoreEvents.push(scoreEvent(a.actorId, POINTS.villainKill, 'Ruined a take'))
        break
      }
    }
  }

  // 4. Information roles
  for (const a of act('director')) {
    const actor = live(a.actorId)
    const target = live(a.targetId)
    if (!actor || !target) continue
    if (isBlocked(a.actorId)) {
      privateResults.push({
        playerId: actor.id,
        icon: '🕺',
        tone: 'bad',
        text: 'You were dragged into a midnight rehearsal. No footage was screened.',
      })
      continue
    }
    const isVillain = target.role === 'villain'
    const clue = investigationClue(round, target.name, target.id, isVillain)
    clue.ownerId = actor.id
    clues.push(clue)
    privateResults.push({
      playerId: actor.id,
      icon: clue.icon,
      tone: isVillain ? 'good' : 'neutral',
      text: clue.text,
    })
    if (isVillain) scoreEvents.push(scoreEvent(actor.id, POINTS.investigationHit, 'Found a villain'))
    if (!actor.memory.visited.includes(target.id)) {
      actor.memory = { ...actor.memory, visited: [...actor.memory.visited, target.id] }
    }
  }

  for (const a of act('heroine')) {
    const actor = live(a.actorId)
    const target = live(a.targetId)
    if (!actor || !target) continue
    if (isBlocked(a.actorId)) {
      privateResults.push({
        playerId: actor.id,
        icon: '🕺',
        tone: 'bad',
        text: 'Rehearsal ran till sunrise. You read nobody tonight.',
      })
      continue
    }
    const truth: 'villain' | 'innocent' = target.role === 'villain' ? 'villain' : 'innocent'
    // 80% accurate — a gut feeling, not a lab result.
    const impression: 'villain' | 'innocent' = chance(0.8)
      ? truth
      : truth === 'villain'
        ? 'innocent'
        : 'villain'
    const clue = heroineReadClue(round, target.name, target.id, impression)
    clue.ownerId = actor.id
    clues.push(clue)
    privateResults.push({
      playerId: actor.id,
      icon: clue.icon,
      tone: impression === 'villain' ? 'good' : 'neutral',
      text: clue.text,
    })
    actor.memory = { ...actor.memory, visited: [...actor.memory.visited, target.id] }
  }

  for (const a of act('paparazzi')) {
    const actor = live(a.actorId)
    const target = live(a.targetId)
    if (!actor || !target) continue
    if (isBlocked(a.actorId)) {
      privateResults.push({
        playerId: actor.id,
        icon: '🕺',
        tone: 'bad',
        text: 'Somebody kept you on the dance floor. Your lens cap never came off.',
      })
      continue
    }
    const targetAction = actions.find((x) => x.actorId === target.id && x.targetId)
    const visited = targetAction?.targetId ? live(targetAction.targetId) : undefined
    const clue = stakeoutClue(
      round,
      target.name,
      target.id,
      visited?.name ?? null,
      visited?.id ?? null,
    )
    clue.ownerId = actor.id
    clues.push(clue)
    privateResults.push({
      playerId: actor.id,
      icon: clue.icon,
      tone: visited ? 'good' : 'neutral',
      text: clue.text,
    })
    actor.memory = { ...actor.memory, visited: [...actor.memory.visited, target.id] }
  }

  // Remember last targets so heroes/choreographers rotate their picks.
  for (const a of actions) {
    const actor = live(a.actorId)
    if (actor) actor.memory = { ...actor.memory, lastTargetId: a.targetId }
  }

  // Survival bonus for everyone still on the call sheet.
  for (const p of players) {
    if (p.alive) scoreEvents.push(scoreEvent(p.id, POINTS.surviveNight, 'Survived the night'))
  }

  const publicClues = generatePublicClues({
    round,
    players,
    actions,
    killedId,
    savedId,
    villainTargetId,
  })
  clues.push(...publicClues)

  const headlines: string[] = []
  if (killedId) {
    const victim = byId.get(killedId)
    headlines.push(`CUT! ${victim?.name ?? 'Someone'} has been written out of the picture.`)
    if (victim) headlines.push(`${victim.name} was the ${ROLES[victim.role].name}.`)
  } else if (savedId) {
    const saved = byId.get(savedId)
    headlines.push(`A blade came for ${saved?.name ?? 'someone'} — and hit a bodyguard instead.`)
    headlines.push('Nobody was lost. The shoot continues.')
  } else {
    headlines.push('Dawn breaks and the entire crew is accounted for.')
    headlines.push('Somebody out there is doing their job.')
  }

  const result: NightResult = {
    round,
    villainTargetId,
    killedId,
    savedId,
    blockedIds,
    privateResults,
    headlines,
  }

  return { players, result, clues, scoreEvents }
}
