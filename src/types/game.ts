/**
 * Bollywood Mafia — shared domain types.
 * Everything in the engine and the store speaks these shapes.
 */

export type RoleId =
  | 'director'
  | 'hero'
  | 'heroine'
  | 'villain'
  | 'choreographer'
  | 'paparazzi'
  | 'audience'

export type Team = 'studio' | 'villain'

export type Phase =
  | 'landing'
  | 'create'
  | 'join'
  | 'solo-setup'
  | 'lobby'
  | 'reveal'
  | 'night'
  | 'day'
  | 'vote'
  | 'verdict'
  | 'gameover'
  | 'leaderboard'

export type GameMode = 'solo' | 'party'

export type PersonalityId = 'aggressive' | 'analytical' | 'quiet' | 'dramatic' | 'comic'

export interface Role {
  id: RoleId
  name: string
  emoji: string
  team: Team
  tagline: string
  /** What the player is, in-fiction. */
  description: string
  /** The mechanical ability, phrased for the role card. */
  ability: string
  actsAtNight: boolean
  /** Imperative label shown above the night target picker. */
  actionLabel: string
  /** Short verb used in logs, e.g. "investigated". */
  actionVerb: string
  canTargetSelf: boolean
  /** Hex accent used for glows and borders. */
  accent: string
}

export type FactKind =
  | 'investigation'
  | 'clue'
  | 'vote'
  | 'death'
  | 'accusation'
  | 'claim'
  | 'protect'

export interface BotFact {
  kind: FactKind
  round: number
  /** Players the fact is about. */
  subjects: string[]
  /** Player who generated the fact (voter / accuser / claimer). */
  source?: string
  /** Human-readable payload, also used to seed dialogue. */
  detail: string
  /** How strongly this should move suspicion. */
  weight: number
}

export interface BotMemory {
  /** playerId -> suspicion score. Higher = more likely villain. */
  suspicion: Record<string, number>
  facts: BotFact[]
  /** Players this bot has already used its night ability on. */
  visited: string[]
  lastTargetId: string | null
  hasClaimedRole: boolean
  /** Players the bot privately believes are cleared. */
  cleared: string[]
  /** Players the bot privately believes are villains. */
  convicted: string[]
}

export interface Player {
  id: string
  name: string
  avatar: string
  isBot: boolean
  /** True when a human on this device controls the seat. */
  isLocal: boolean
  role: RoleId
  alive: boolean
  score: number
  personality: PersonalityId
  eliminatedRound: number | null
  eliminatedBy: 'villain' | 'vote' | null
  /** Round in which this player publicly claimed a role (bots + humans). */
  claimedRole: RoleId | null
  memory: BotMemory
}

export interface NightAction {
  actorId: string
  roleId: RoleId
  targetId: string | null
}

export type ClueKind =
  /** At least one of `subjects` is a villain. */
  | 'trio'
  /** Every player in `subjects` is innocent. */
  | 'clear-pair'
  /** `subjects[0]` used a night ability. */
  | 'acted'
  /** `subjects[0]` used no night ability. */
  | 'no-action'
  /** How many players moved at night (`count`). */
  | 'count'
  /** `subjects[0]` was visited by the villain. */
  | 'visited'
  /** Director result: `subjects[0]` is / is not the villain (`verdict`). */
  | 'investigation'
  /** Heroine impression of `subjects[0]` (`verdict`, may be wrong). */
  | 'read'
  /** Paparazzi: `subjects[0]` visited `subjects[1]`. */
  | 'stakeout'
  /** Flavour only, carries no deduction value. */
  | 'flavour'

export interface Clue {
  id: string
  round: number
  kind: ClueKind
  text: string
  icon: string
  /** Public clues hit the day feed; private ones go to one player. */
  visibility: 'public' | 'private'
  ownerId?: string
  /** Player ids the clue talks about — this is what bots reason over. */
  subjects: string[]
  /** For 'count' clues. */
  count?: number
  /** For 'investigation' / 'read' clues. */
  verdict?: 'villain' | 'innocent'
  /** Used for styling + bot weighting. */
  strength: 'weak' | 'medium' | 'strong'
}

export type ChatTone = 'accuse' | 'defend' | 'claim' | 'observe' | 'joke' | 'system'

export interface ChatMessage {
  id: string
  round: number
  playerId: string
  playerName: string
  avatar: string
  text: string
  tone: ChatTone
  targetId?: string
}

export interface PrivateResult {
  playerId: string
  text: string
  icon: string
  tone: 'good' | 'bad' | 'neutral'
}

export interface NightResult {
  round: number
  villainTargetId: string | null
  killedId: string | null
  savedId: string | null
  blockedIds: string[]
  privateResults: PrivateResult[]
  /** Narration lines for the dawn recap. */
  headlines: string[]
}

export interface VerdictResult {
  round: number
  eliminatedId: string | null
  tie: boolean
  tally: { playerId: string; votes: number; voters: string[] }[]
  wasVillain: boolean
}

export interface ScoreEvent {
  playerId: string
  points: number
  reason: string
}

export interface LeaderboardEntry {
  name: string
  wins: number
  losses: number
  highScore: number
  games: number
  villainWins: number
  lastPlayed: number
}

export interface RoomRecord {
  code: string
  hostName: string
  createdAt: number
  playerCount: number
}
