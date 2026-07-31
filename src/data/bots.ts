import type { PersonalityId } from '../types/game'

/**
 * Fictional cast names — deliberately generic film-crew names rather than
 * real public figures.
 */
export const BOT_NAMES: string[] = [
  'Rahul',
  'Priya',
  'Vikram',
  'Anjali',
  'Arjun',
  'Meera',
  'Kabir',
  'Simran',
  'Rohan',
  'Naina',
  'Aditya',
  'Pooja',
  'Dev',
  'Kiran',
  'Zoya',
  'Nisha',
  'Sameer',
  'Tara',
  'Yash',
  'Ishaan',
  'Bela',
  'Manav',
]

export interface Personality {
  id: PersonalityId
  label: string
  /** Multiplier on how fast suspicion climbs. */
  aggression: number
  /** How often the bot speaks in a day phase (0..1). */
  chattiness: number
  /** How readily the bot believes public claims (0..1). */
  gullibility: number
  /** Randomness injected into voting (higher = more chaotic). */
  chaos: number
}

export const PERSONALITIES: Record<PersonalityId, Personality> = {
  aggressive: {
    id: 'aggressive',
    label: 'Hot-headed',
    aggression: 1.45,
    chattiness: 0.95,
    gullibility: 0.35,
    chaos: 0.35,
  },
  analytical: {
    id: 'analytical',
    label: 'Method actor',
    aggression: 0.95,
    chattiness: 0.75,
    gullibility: 0.7,
    chaos: 0.12,
  },
  quiet: {
    id: 'quiet',
    label: 'Reserved',
    aggression: 0.7,
    chattiness: 0.32,
    gullibility: 0.5,
    chaos: 0.22,
  },
  dramatic: {
    id: 'dramatic',
    label: 'Theatrical',
    aggression: 1.2,
    chattiness: 1,
    gullibility: 0.55,
    chaos: 0.3,
  },
  comic: {
    id: 'comic',
    label: 'Comic relief',
    aggression: 0.85,
    chattiness: 0.85,
    gullibility: 0.45,
    chaos: 0.45,
  },
}

export const PERSONALITY_IDS: PersonalityId[] = [
  'aggressive',
  'analytical',
  'quiet',
  'dramatic',
  'comic',
]
