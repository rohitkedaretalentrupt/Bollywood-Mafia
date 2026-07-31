import type { Clue, ClueKind, NightAction, Player } from '../types/game'
import { clamp, pick, pickN, shuffle, uid, weightedPick } from './util'

/**
 * Every public clue produced here is *logically true* about the real game
 * state. That is the whole point: a careful player can actually deduce the
 * villain from the continuity log instead of guessing vibes.
 */

interface ClueContext {
  round: number
  /** Players AFTER the night has been applied (the victim is already dead). */
  players: Player[]
  actions: NightAction[]
  killedId: string | null
  savedId: string | null
  villainTargetId: string | null
}

function nameOf(players: Player[], id: string): string {
  return players.find((p) => p.id === id)?.name ?? 'someone'
}

function actorsWhoMoved(ctx: ClueContext): string[] {
  return ctx.actions.filter((a) => a.targetId !== null).map((a) => a.actorId)
}

function makeClue(partial: Omit<Clue, 'id'>): Clue {
  return { id: uid('clue'), ...partial }
}

/* ------------------------------------------------------------------ *
 * Individual generators. Each returns null when it cannot make a
 * truthful clue from the current state.
 * ------------------------------------------------------------------ */

function listNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? 'someone'
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/** "At least one of these three sabotaged a take." Always exactly three names. */
function trioClue(ctx: ClueContext): Clue | null {
  const alive = ctx.players.filter((p) => p.alive)
  const villains = alive.filter((p) => p.role === 'villain')
  const innocents = alive.filter((p) => p.role !== 'villain')
  if (villains.length === 0 || innocents.length < 2) return null

  const decoyCount = Math.min(2, innocents.length)
  if (decoyCount < 2) return null

  const villain = pick(villains)
  if (!villain) return null
  const decoys = pickN(innocents, decoyCount)

  const group = shuffle([villain, ...decoys])
  return makeClue({
    round: ctx.round,
    kind: 'trio',
    icon: '🗒️',
    visibility: 'public',
    strength: 'strong',
    subjects: group.map((p) => p.id),
    text: `Continuity log: at least one of ${listNames(group.map((p) => p.name))} sabotaged a take.`,
  })
}

function clearPairClue(ctx: ClueContext): Clue | null {
  const innocents = ctx.players.filter((p) => p.alive && p.role !== 'villain')
  if (innocents.length < 2) return null
  const pair = pickN(innocents, 2)
  if (pair.length < 2) return null
  return makeClue({
    round: ctx.round,
    kind: 'clear-pair',
    icon: '✅',
    visibility: 'public',
    strength: 'strong',
    subjects: pair.map((p) => p.id),
    text: `Security footage clears both ${pair[0].name} and ${pair[1].name} of last night's sabotage.`,
  })
}

function actedClue(ctx: ClueContext): Clue | null {
  const moved = actorsWhoMoved(ctx).filter((id) => ctx.players.some((p) => p.id === id && p.alive))
  const who = pick(moved)
  if (!who) return null
  return makeClue({
    round: ctx.round,
    kind: 'acted',
    icon: '👤',
    visibility: 'public',
    strength: 'weak',
    subjects: [who],
    text: `A spot boy swears he saw ${nameOf(ctx.players, who)} crossing the backlot after midnight.`,
  })
}

function noActionClue(ctx: ClueContext): Clue | null {
  const moved = new Set(actorsWhoMoved(ctx))
  const idle = ctx.players.filter((p) => p.alive && !moved.has(p.id))
  const who = pick(idle)
  if (!who) return null
  return makeClue({
    round: ctx.round,
    kind: 'no-action',
    icon: '🛋️',
    visibility: 'public',
    strength: 'medium',
    subjects: [who.id],
    text: `The unit driver confirms ${who.name} never left their vanity van all night.`,
  })
}

function countClue(ctx: ClueContext): Clue | null {
  const n = actorsWhoMoved(ctx).length
  return makeClue({
    round: ctx.round,
    kind: 'count',
    icon: '🔢',
    visibility: 'public',
    strength: 'medium',
    subjects: [],
    count: n,
    text:
      n === 0
        ? 'The night watchman counted nobody moving on set. Eerie.'
        : `The night watchman counted exactly ${n} ${n === 1 ? 'person' : 'people'} moving on set.`,
  })
}

function visitedClue(ctx: ClueContext): Clue | null {
  const targetId = ctx.villainTargetId
  if (!targetId) return null
  const target = ctx.players.find((p) => p.id === targetId)
  if (!target || !target.alive) return null
  return makeClue({
    round: ctx.round,
    kind: 'visited',
    icon: '🚪',
    visibility: 'public',
    strength: 'strong',
    subjects: [targetId],
    text: `Someone rattled ${target.name}'s trailer door at 3 AM and walked away empty-handed.`,
  })
}

const FLAVOUR = [
  'A reel of exposed negative was found in the bin behind Studio 4.',
  'Half the costume trunk was slashed. The tailor is refusing to speak.',
  "The clapperboard has last night's scene number scratched out.",
  'A single gold jhumka was found near the generator. Nobody claims it.',
  'The playback speaker was rewired to play a funeral tune. Charming.',
]

function flavourClue(ctx: ClueContext): Clue | null {
  const text = pick(FLAVOUR)
  if (!text) return null
  return makeClue({
    round: ctx.round,
    kind: 'flavour',
    icon: '🎞️',
    visibility: 'public',
    strength: 'weak',
    subjects: [],
    text,
  })
}

/* ------------------------------------------------------------------ */

/**
 * How much hard evidence the continuity log gives up tonight.
 *
 * Driven by "pressure" — surviving studio members per surviving villain. That
 * ratio is what actually decides a game: the studio must land `villains`
 * correct lynches inside roughly `town - villains` rounds. A crowded set with
 * one saboteur is a comfortable game for the studio; a thinned-out set with two
 * is desperate.
 *
 * Measured over 4,000 simulated games per configuration, studio win rate is a
 * clean increasing function of pressure at a fixed budget (22% at pressure 1.5
 * → 81% at 4.0), so the budget decreases as pressure rises: a studio nearly out
 * of road hears from every witness on the lot, a cruising studio has to earn it
 * with role powers alone.
 *
 * The budget stays small — one or two. The third clue is worth far more than
 * the second, because at three the `clear-pair` always lands and that is what
 * collapses a trio into a name; allowing three swung the studio to ~75-90%
 * across the board. The dial also adapts inside a single game as the board
 * shifts, so a studio that loses its Director starts getting more help.
 */
function hardClueBudget(ctx: ClueContext): number {
  const alive = ctx.players.filter((p) => p.alive)
  const villains = alive.filter((p) => p.role === 'villain').length
  if (villains === 0) return 0
  const town = alive.length - villains
  const pressure = (town - villains) / villains

  if (pressure <= 1.75) return 2 // desperate — the whole crew is talking
  if (pressure <= 2.75) return 1 // even fight
  return Math.random() < 0.5 ? 1 : 0 // cruising — earn it with role powers
}

/** One or two deduction-grade clues per dawn, plus a softer colour clue. */
export function generatePublicClues(ctx: ClueContext): Clue[] {
  const hardPool: { kind: ClueKind; gen: (c: ClueContext) => Clue | null; weight: number }[] = [
    { kind: 'trio', gen: trioClue, weight: 5 },
    { kind: 'visited', gen: visitedClue, weight: 3 },
    // The rarest, because it is the strongest: a cleared pair collapses a trio
    // straight into a name.
    { kind: 'clear-pair', gen: clearPairClue, weight: 2 },
  ]

  const out: Clue[] = []

  const drawHard = () => {
    const remaining = hardPool.filter((h) => !out.some((c) => c.kind === h.kind))
    if (remaining.length === 0) return
    const picked = weightedPick(
      remaining,
      remaining.map((p) => p.weight),
    )
    if (!picked) return
    const clue = picked.gen(ctx)
    if (clue) out.push(clue)
  }

  let budget = hardClueBudget(ctx)
  // Stall valve: a long game always gets something to chew on.
  if (ctx.round >= 4 && budget === 0) budget = 1
  for (let i = 0; i < budget; i++) drawHard()

  for (const gen of shuffle([noActionClue, actedClue, countClue])) {
    const clue = gen(ctx)
    if (clue) {
      out.push(clue)
      break
    }
  }

  if (out.length === 0) {
    const f = flavourClue(ctx)
    if (f) out.push(f)
  }

  return out
}

/* ---------------------- private clue builders ---------------------- */

export function investigationClue(round: number, targetName: string, targetId: string, isVillain: boolean): Clue {
  return makeClue({
    round,
    kind: 'investigation',
    icon: isVillain ? '🚨' : '🎬',
    visibility: 'private',
    strength: 'strong',
    subjects: [targetId],
    verdict: isVillain ? 'villain' : 'innocent',
    text: isVillain
      ? `Your dailies are conclusive: ${targetName} is the VILLAIN.`
      : `You screened ${targetName}'s footage all night. They are clean.`,
  })
}

export function heroineReadClue(
  round: number,
  targetName: string,
  targetId: string,
  impression: 'villain' | 'innocent',
): Clue {
  return makeClue({
    round,
    kind: 'read',
    icon: impression === 'villain' ? '💔' : '💗',
    visibility: 'private',
    strength: 'medium',
    subjects: [targetId],
    verdict: impression,
    text:
      impression === 'villain'
        ? `Something about ${targetName} makes your skin crawl. You feel guilt on them.`
        : `You shared a quiet chai with ${targetName}. Your gut says they are harmless.`,
  })
}

export function stakeoutClue(
  round: number,
  watcherTargetName: string,
  watchedId: string,
  visitedName: string | null,
  visitedId: string | null,
): Clue {
  return makeClue({
    round,
    kind: 'stakeout',
    icon: '📸',
    visibility: 'private',
    strength: visitedId ? 'strong' : 'medium',
    subjects: visitedId ? [watchedId, visitedId] : [watchedId],
    text: visitedId
      ? `Your lens caught ${watcherTargetName} slipping into ${visitedName}'s trailer.`
      : `You watched ${watcherTargetName} all night. They never moved.`,
  })
}
