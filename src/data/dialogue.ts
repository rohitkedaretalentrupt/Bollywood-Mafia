import type { ChatTone, PersonalityId } from '../types/game'

/**
 * Dialogue banks. Bots stitch these together with live game facts so the day
 * phase reads like an actual argument on a film set instead of noise.
 *
 * Placeholders: {target} {me} {dead} {n} {role} {ally}
 */

type Bank = { base: string[] } & Partial<Record<PersonalityId, string[]>>

export const ACCUSE: Bank = {
  base: [
    'I think {target} is suspicious.',
    '{target} has been way too quiet for someone with nothing to hide.',
    'Every time something breaks on this set, {target} is standing right there.',
    "I'm not saying it's {target}. I'm saying it's completely {target}.",
    "{target}, explain last night. Slowly.",
    "Watch {target}'s hands when they talk. That's guilt.",
  ],
  aggressive: [
    'It is {target}. Vote {target}. Move on.',
    "{target}, I've had enough of your acting. Bad acting, by the way.",
    "I will burn my own contract if {target} isn't the villain.",
  ],
  analytical: [
    'Timeline check: {target} was unaccounted for the entire night.',
    "Three clues point in the same direction and that direction is {target}.",
    "{target}'s story changed twice. People telling the truth only need one version.",
  ],
  quiet: [
    "...it's {target}. I've been watching.",
    'I noticed {target}. That is all I will say.',
  ],
  dramatic: [
    'The spotlight falls, and it falls on {target}! 🎭',
    'Fifteen years in this industry and I have never seen a performance as fake as {target}.',
    "Interval is over, {target}. The audience wants your confession.",
  ],
  comic: [
    '{target} is guiltier than my last three film choices.',
    "If {target} is innocent then I'm the next big superstar. And look at me.",
    '{target} sweating more than me at a dance rehearsal.',
  ],
}

export const DEFEND: Bank = {
  base: [
    "I'm on your side, seriously. Waste a vote on me and the villain wins.",
    'Wrong target. Point that camera somewhere else.',
    "You're eliminating a friendly. Again.",
    'I have been trying to protect this picture all night.',
    'Vote me out and you will find out the hard way.',
  ],
  aggressive: [
    "Say my name one more time and we'll see what happens.",
    'Absolutely not. Try again with a real suspect.',
  ],
  analytical: [
    'If I were the villain, last night would have played out differently. Think it through.',
    'The clue pattern does not fit me. Check the sequence.',
  ],
  quiet: ['It is not me.', 'You are wrong. Please move on.'],
  dramatic: [
    'ME? After everything I have given to this film?! 😤',
    'You wound me. You genuinely wound me.',
  ],
  comic: [
    "Me, a villain? I can't even lie about my age convincingly.",
    "I'm the comic relief. Villains get better lighting than this.",
  ],
}

export const CLAIM: Bank = {
  base: [
    "Fine — I'm the {role}. Now listen to me.",
    "Cards on the table: {role}. That's why I know what I know.",
    "I didn't want to say it this early. {role}. Protect me.",
  ],
  dramatic: ['I AM THE {role}! And I will not be silenced! 🎬'],
  analytical: ['Claiming {role} for the record. My information is below.'],
  quiet: ['{role}. That is my claim.'],
  comic: ['{role}, at your service. Autographs later.'],
}

export const OBSERVE: Bank = {
  base: [
    'Nobody panic. Read the clues before voting.',
    'Two of us are lying right now. Maybe three.',
    'We wasted a whole day yesterday. We cannot afford another.',
    'Whoever is protecting people — thank you, keep going.',
    'The villain is in this conversation, being reasonable.',
    'I trust almost nobody in this crew, and that is the correct amount.',
  ],
  analytical: [
    'Count the alive players. The math is turning against us.',
    "Let's not lynch on vibes today.",
  ],
  quiet: ['I am listening.', 'Hmm.'],
  dramatic: ['This set is cursed. I said it on day one. 🪔'],
  comic: ['My horoscope said avoid group decisions. Anyway.'],
}

export const JOKE: Bank = {
  base: [
    'Can we shoot the song sequence first and do the murder investigation after? 🪩',
    'My agent is going to hear about this production.',
    'Somebody get me chai. I cannot accuse people sober-tired.',
  ],
  comic: [
    'This is the most drama I have had since my divorce subplot.',
    'Plot twist: it was catering all along. 🍛',
  ],
  dramatic: ['I demand a rewrite of this entire third act!'],
}

export const DEATH_REACT: string[] = [
  'Not {dead}. They were carrying this whole film.',
  'They got {dead}? Then the villain is scared of information.',
  "{dead} is gone. Somebody explain how that helps anyone but the villain.",
  'Rest easy, {dead}. We will finish your scene.',
  '{dead} was next to me the whole shoot. This one hurts.',
]

export const SAVED_REACT: string[] = [
  'Someone got saved last night. Whoever is guarding — keep doing exactly that.',
  'A knife came out and hit a bodyguard. Good. We are still in this.',
  'The villain reached for someone and missed. They will be furious.',
]

export const QUIET_NIGHT_REACT: string[] = [
  'Nobody died? Either someone was protected or somebody got dragged into rehearsal.',
  'A quiet night. That is information too.',
  'No casualties. Somebody out there is doing their job.',
]

export const VOTE_LINES: string[] = [
  'Locking my vote on {target}.',
  '{target}. Final answer.',
  'Sorry {target}, the schedule says today.',
  'I vote {target} and I will sleep fine.',
]

const BANKS: Record<Exclude<ChatTone, 'system'>, Bank> = {
  accuse: ACCUSE,
  defend: DEFEND,
  claim: CLAIM,
  observe: OBSERVE,
  joke: JOKE,
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_m, key: string) => vars[key] ?? '')
}

/** Picks a line for the tone, biased toward the personality's own flavour. */
export function pickLine(
  tone: Exclude<ChatTone, 'system'>,
  personality: PersonalityId,
  vars: Record<string, string>,
  rng: () => number = Math.random,
): string {
  const bank = BANKS[tone]
  const flavour = bank[personality] ?? []
  const useFlavour = flavour.length > 0 && rng() < 0.55
  const pool = useFlavour ? flavour : bank.base
  const line = pool[Math.floor(rng() * pool.length)] ?? bank.base[0]
  return fillTemplate(line, vars)
}

export function pickFrom(pool: string[], vars: Record<string, string>, rng: () => number = Math.random): string {
  const line = pool[Math.floor(rng() * pool.length)] ?? pool[0]
  return fillTemplate(line, vars)
}
