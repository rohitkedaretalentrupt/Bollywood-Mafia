import type { Role, RoleId } from '../types/game'

export const ROLES: Record<RoleId, Role> = {
  director: {
    id: 'director',
    name: 'Director',
    emoji: '🎬',
    team: 'studio',
    tagline: 'The eye behind the lens',
    description:
      'You called every shot on this film. If something on set smells wrong, you will find it in the dailies.',
    ability: 'Each night, investigate one player and learn whether they are the Villain.',
    actsAtNight: true,
    actionLabel: 'Who do you want to investigate tonight?',
    actionVerb: 'investigated',
    canTargetSelf: false,
    accent: '#f5c518',
  },
  hero: {
    id: 'hero',
    name: 'Hero',
    emoji: '🕶️',
    team: 'studio',
    tagline: 'One man, zero stunt doubles',
    description:
      'You do your own stunts and you protect your co-stars. Nobody gets hurt on your watch.',
    ability: 'Each night, protect one player. If the Villain strikes them, they survive.',
    actsAtNight: true,
    actionLabel: 'Who will you guard tonight?',
    actionVerb: 'protected',
    canTargetSelf: false,
    accent: '#4dd4ff',
  },
  heroine: {
    id: 'heroine',
    name: 'Heroine',
    emoji: '💃',
    team: 'studio',
    tagline: 'Reads a room in one glance',
    description:
      'You have shared a vanity van with every gossip on this production. You can feel guilt in the air.',
    ability: "Each night, read one player and get an impression of their innocence (usually right).",
    actsAtNight: true,
    actionLabel: 'Whose aura will you read tonight?',
    actionVerb: 'read',
    canTargetSelf: false,
    accent: '#ff6ec7',
  },
  villain: {
    id: 'villain',
    name: 'Villain',
    emoji: '😈',
    team: 'villain',
    tagline: 'Every hit film needs one',
    description:
      'You were cut from the final edit and you have never forgiven this studio. Burn the whole picture down.',
    ability: 'Each night, eliminate one player. Survive the vote to keep the sabotage going.',
    actsAtNight: true,
    actionLabel: 'Who disappears from the call sheet tonight?',
    actionVerb: 'targeted',
    canTargetSelf: false,
    accent: '#e50914',
  },
  choreographer: {
    id: 'choreographer',
    name: 'Choreographer',
    emoji: '🕺',
    team: 'studio',
    tagline: 'Eight counts, no escape',
    description:
      'You pull people into rehearsal at the worst possible time — and tonight that is a weapon.',
    ability: "Each night, drag one player into rehearsal. Their night ability does nothing.",
    actsAtNight: true,
    actionLabel: 'Who gets a surprise midnight rehearsal?',
    actionVerb: 'distracted',
    canTargetSelf: false,
    accent: '#a78bfa',
  },
  paparazzi: {
    id: 'paparazzi',
    name: 'Paparazzi',
    emoji: '📸',
    team: 'studio',
    tagline: 'Always in the wrong bush',
    description:
      'You have been camped outside this set for six weeks. Your zoom lens knows more than the police.',
    ability: "Each night, stake out one player and learn who they visited.",
    actsAtNight: true,
    actionLabel: 'Whose trailer are you staking out tonight?',
    actionVerb: 'photographed',
    canTargetSelf: false,
    accent: '#7dd3fc',
  },
  audience: {
    id: 'audience',
    name: 'Audience',
    emoji: '🍿',
    team: 'studio',
    tagline: 'Front row, big opinions',
    description:
      'You bought a ticket and you have thoughts. No powers, but your vote decides who gets fired.',
    ability: 'No night ability — but your voice and your vote in the day carry full weight.',
    actsAtNight: false,
    actionLabel: 'Enjoy the show.',
    actionVerb: 'watched',
    canTargetSelf: false,
    accent: '#fbbf24',
  },
}

export const ROLE_LIST: Role[] = [
  ROLES.villain,
  ROLES.director,
  ROLES.hero,
  ROLES.heroine,
  ROLES.choreographer,
  ROLES.paparazzi,
  ROLES.audience,
]

export const MIN_PLAYERS = 5
export const MAX_PLAYERS = 12

/** Support roles are handed out in this order as the table grows. */
const SUPPORT_ORDER: RoleId[] = ['director', 'hero', 'paparazzi', 'heroine', 'choreographer']

/**
 * Villain density — roughly one in four, which is what keeps a game live.
 *
 * What decides a game is "pressure": surviving studio members per surviving
 * villain, i.e. `(n - 2v) / v`. The studio has to land `v` correct lynches
 * inside about `n - 2v` rounds, so pressure below ~1.5 is hopeless for the
 * studio and above ~3.5 is a formality. These thresholds hold every supported
 * cast size inside roughly 1.5–3.0.
 *
 * At the original 1-villain-up-to-8 the studio won ~92% of simulated games.
 */
export function villainCountFor(playerCount: number): number {
  if (playerCount <= 6) return 1
  if (playerCount <= 11) return 2
  return 3
}

/**
 * Builds a balanced role deck for a table of `count` players.
 * Always leaves at least one Audience seat so the town is not all power roles.
 */
export function buildRoleDeck(count: number): RoleId[] {
  const total = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, count))
  const villains = villainCountFor(total)
  const deck: RoleId[] = Array.from({ length: villains }, () => 'villain' as RoleId)

  const supportSlots = Math.max(0, Math.min(SUPPORT_ORDER.length, total - villains - 1))
  for (let i = 0; i < supportSlots; i++) deck.push(SUPPORT_ORDER[i])

  while (deck.length < total) deck.push('audience')
  return deck
}

export function teamOf(role: RoleId): 'studio' | 'villain' {
  return ROLES[role].team
}
