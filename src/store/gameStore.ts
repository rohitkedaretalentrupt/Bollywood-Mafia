import { create } from 'zustand'
import { playSfx, startAmbience, stopAmbience } from '../audio/sound'
import { MAX_PLAYERS, MIN_PLAYERS, ROLES } from '../data'
import {
  botVote,
  botVoteLine,
  decaySilence,
  generateDayDialogue,
  ingestAccusation,
  ingestClaim,
  ingestNight,
  ingestPrivateClue,
  ingestPublicClues,
  ingestVerdict,
  markClaimed,
  systemMessage,
} from '../engine/ai'
import { collectBotActions, resolveNight } from '../engine/resolve'
import { applyScores } from '../engine/scoring'
import { dealPlayers, makeBotSeats, makeSeat, type SeatDraft } from '../engine/setup'
import { generateRoomCode, uid } from '../engine/util'
import { checkWinner, finalScoreEvents, resolveVotes } from '../engine/winner'
import type {
  ChatMessage,
  Clue,
  GameMode,
  NightAction,
  NightResult,
  Phase,
  Player,
  RoleId,
  ScoreEvent,
  Team,
  VerdictResult,
} from '../types/game'
import { useLeaderboard } from './leaderboardStore'
import { addSeatToRoom, getRoom, setRoomStatus, upsertRoom } from './rooms'

export const DAY_SECONDS = 75

export type HumanSayKind = 'accuse' | 'defend' | 'claim' | 'observe'

interface GameState {
  phase: Phase
  mode: GameMode
  roomCode: string
  joinError: string | null

  /** Lobby drafts, before roles are dealt. */
  seats: SeatDraft[]
  botCount: number
  soloPlayerCount: number
  /** Seat id belonging to the person holding this device (host / joiner). */
  ownerSeatId: string | null

  round: number
  maxRounds: number
  players: Player[]
  nightActions: NightAction[]
  clues: Clue[]
  chat: ChatMessage[]
  votes: Record<string, string>

  lastNight: NightResult | null
  lastVerdict: VerdictResult | null
  winner: Team | null
  endReason: string | null
  scoreLog: ScoreEvent[]

  /** Sequential private-screen queue for pass-and-play. */
  localQueue: string[]
  queueIndex: number
  handoffPending: boolean

  pendingDialogue: ChatMessage[]
  dayDeadline: number
  voteStage: 'casting' | 'tally'

  /* ------------------------------- actions ------------------------------- */
  goto: (phase: Phase) => void
  resetToLanding: () => void

  openCreateRoom: () => void
  openJoinRoom: () => void
  openSoloSetup: () => void
  clearJoinError: () => void

  createRoom: (name: string, avatar: string) => void
  joinRoom: (code: string, name: string, avatar: string) => boolean
  syncSeats: () => void
  addLocalSeat: (name: string, avatar: string) => void
  removeSeat: (seatId: string) => void
  setBotCount: (n: number) => void
  setSoloPlayerCount: (n: number) => void

  startSolo: (name: string, avatar: string) => void
  beginGame: () => void

  advanceReveal: () => void
  clearHandoff: () => void

  beginNight: () => void
  submitNightAction: (actorId: string, targetId: string | null) => void
  finishNight: () => void

  startDayClock: () => void
  revealNextDialogue: () => void
  humanSay: (playerId: string, kind: HumanSayKind, targetId?: string) => void

  beginVote: () => void
  castVote: (voterId: string, targetId: string) => void
  lockInBotVotes: () => void
  finishVote: () => void
  continueAfterVerdict: () => void

  playAgain: () => void
}

function localPlayerIds(players: Player[], filter?: (p: Player) => boolean): string[] {
  return players.filter((p) => !p.isBot && (filter ? filter(p) : true)).map((p) => p.id)
}

function maxRoundsFor(count: number): number {
  return Math.min(10, Math.max(5, count + 2))
}

export const useGame = create<GameState>((set, get) => {
  /* ---------------------------------------------------------------- *
   * End of game — final scoring, leaderboard write, full role reveal.
   * ---------------------------------------------------------------- */
  const endGame = (winner: Team, reason: string | null) => {
    const players = get().players
    const events = finalScoreEvents(players, winner)
    const scored = applyScores(players, events)

    const humanResults = scored
      .filter((p) => !p.isBot)
      .map((p) => ({
        name: p.name,
        won: (p.role === 'villain' ? 'villain' : 'studio') === winner,
        score: p.score,
        wasVillain: p.role === 'villain',
      }))
    if (humanResults.length > 0) useLeaderboard.getState().recordGames(humanResults)

    stopAmbience()
    set({
      players: scored,
      winner,
      endReason: reason,
      scoreLog: [...get().scoreLog, ...events],
      phase: 'gameover',
      pendingDialogue: [],
      handoffPending: false,
    })
    playSfx(winner === 'studio' ? 'victory' : 'defeat')
  }

  return {
  phase: 'landing',
  mode: 'solo',
  roomCode: '',
  joinError: null,

  seats: [],
  botCount: 5,
  soloPlayerCount: 8,
  ownerSeatId: null,

  round: 0,
  maxRounds: 8,
  players: [],
  nightActions: [],
  clues: [],
  chat: [],
  votes: {},

  lastNight: null,
  lastVerdict: null,
  winner: null,
  endReason: null,
  scoreLog: [],

  localQueue: [],
  queueIndex: 0,
  handoffPending: false,

  pendingDialogue: [],
  dayDeadline: 0,
  voteStage: 'casting',

  /* --------------------------------------------------------------- */

  goto: (phase) => set({ phase }),

  resetToLanding: () => {
    stopAmbience()
    set({
      phase: 'landing',
      round: 0,
      players: [],
      seats: [],
      nightActions: [],
      clues: [],
      chat: [],
      votes: {},
      lastNight: null,
      lastVerdict: null,
      winner: null,
      endReason: null,
      scoreLog: [],
      localQueue: [],
      queueIndex: 0,
      handoffPending: false,
      pendingDialogue: [],
      voteStage: 'casting',
      roomCode: '',
      ownerSeatId: null,
      joinError: null,
    })
  },

  openCreateRoom: () => set({ phase: 'create', mode: 'party', roomCode: generateRoomCode(), joinError: null }),
  openJoinRoom: () => set({ phase: 'join', mode: 'party', joinError: null }),
  openSoloSetup: () => set({ phase: 'solo-setup', mode: 'solo', joinError: null }),
  clearJoinError: () => set({ joinError: null }),

  createRoom: (name, avatar) => {
    const code = get().roomCode || generateRoomCode()
    const host = makeSeat(name, avatar, { isLocal: true })
    upsertRoom({
      code,
      hostName: host.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      seats: [host],
      botCount: get().botCount,
      status: 'open',
    })
    set({
      mode: 'party',
      roomCode: code,
      seats: [host],
      ownerSeatId: host.id,
      phase: 'lobby',
    })
    playSfx('reveal')
  },

  joinRoom: (code, name, avatar) => {
    const trimmed = code.trim()
    const room = getRoom(trimmed)
    if (!room) {
      set({ joinError: `No room with code ${trimmed || '——————'}. Ask the host to read it out again.` })
      playSfx('wrong')
      return false
    }
    if (room.status !== 'open') {
      set({ joinError: 'That shoot has already started. Ask the host for a new room.' })
      playSfx('wrong')
      return false
    }
    if (room.seats.length >= MAX_PLAYERS) {
      set({ joinError: 'That set is full — twelve is the fire-safety limit.' })
      playSfx('wrong')
      return false
    }
    const seat = makeSeat(name, avatar, { isLocal: true })
    const updated = addSeatToRoom(trimmed, seat)
    set({
      mode: 'party',
      roomCode: trimmed,
      seats: updated?.seats ?? [seat],
      ownerSeatId: seat.id,
      botCount: updated?.botCount ?? get().botCount,
      phase: 'lobby',
      joinError: null,
    })
    playSfx('select')
    return true
  },

  syncSeats: () => {
    const { roomCode, mode, seats, botCount } = get()
    if (mode !== 'party' || !roomCode) return
    const room = getRoom(roomCode)
    if (!room) return
    // Only write when something actually changed — this runs on a poll, and a
    // fresh array reference every tick would re-render the whole lobby.
    const same =
      room.botCount === botCount &&
      room.seats.length === seats.length &&
      room.seats.every((s, i) => s.id === seats[i]?.id && s.avatar === seats[i]?.avatar)
    if (same) return
    set({ seats: room.seats, botCount: room.botCount })
  },

  addLocalSeat: (name, avatar) => {
    const { seats, roomCode } = get()
    if (seats.length >= MAX_PLAYERS) return
    const seat = makeSeat(name, avatar, { isLocal: true })
    const next = [...seats, seat]
    set({ seats: next })
    if (roomCode) {
      const room = getRoom(roomCode)
      if (room) upsertRoom({ ...room, seats: next })
    }
    playSfx('select')
  },

  removeSeat: (seatId) => {
    const { seats, roomCode, ownerSeatId } = get()
    if (seatId === ownerSeatId) return
    const next = seats.filter((s) => s.id !== seatId)
    set({ seats: next })
    if (roomCode) {
      const room = getRoom(roomCode)
      if (room) upsertRoom({ ...room, seats: next })
    }
    playSfx('click')
  },

  setBotCount: (n) => {
    const { seats, roomCode } = get()
    const clamped = Math.max(0, Math.min(MAX_PLAYERS - seats.length, n))
    set({ botCount: clamped })
    if (roomCode) {
      const room = getRoom(roomCode)
      if (room) upsertRoom({ ...room, botCount: clamped })
    }
  },

  setSoloPlayerCount: (n) =>
    set({ soloPlayerCount: Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, n)) }),

  startSolo: (name, avatar) => {
    const human = makeSeat(name, avatar, { isLocal: true })
    const total = get().soloPlayerCount
    const bots = makeBotSeats(Math.max(MIN_PLAYERS - 1, total - 1), [human])
    set({
      mode: 'solo',
      roomCode: '',
      seats: [human, ...bots],
      ownerSeatId: human.id,
      botCount: bots.length,
    })
    get().beginGame()
  },

  beginGame: () => {
    const { seats, botCount, mode, roomCode } = get()
    const humans = seats.slice(0, MAX_PLAYERS)
    const existingBots = humans.filter((s) => s.isBot)
    const humanSeats = humans.filter((s) => !s.isBot)
    const neededBots =
      mode === 'solo'
        ? existingBots.length
        : Math.max(botCount, Math.max(0, MIN_PLAYERS - humanSeats.length))
    const bots =
      mode === 'solo'
        ? existingBots
        : makeBotSeats(Math.min(neededBots, MAX_PLAYERS - humanSeats.length), humanSeats)

    const roster = [...humanSeats, ...bots].slice(0, MAX_PLAYERS)
    if (roster.length < MIN_PLAYERS) return

    const players = dealPlayers(roster)
    if (mode === 'party' && roomCode) setRoomStatus(roomCode, 'started')

    const queue = localPlayerIds(players)
    set({
      players,
      round: 0,
      maxRounds: maxRoundsFor(players.length),
      clues: [],
      chat: [systemMessage('Roles have been dealt. Guard yours with your life.', 0)],
      votes: {},
      nightActions: [],
      lastNight: null,
      lastVerdict: null,
      winner: null,
      endReason: null,
      scoreLog: [],
      localQueue: queue,
      queueIndex: 0,
      handoffPending: queue.length > 1,
      pendingDialogue: [],
      voteStage: 'casting',
      phase: 'reveal',
    })
    startAmbience('night')
    playSfx('whoosh')
  },

  clearHandoff: () => {
    set({ handoffPending: false })
    playSfx('click')
  },

  advanceReveal: () => {
    const { queueIndex, localQueue, phase } = get()
    if (phase !== 'reveal') return
    const next = queueIndex + 1
    if (next >= localQueue.length) {
      get().beginNight()
      return
    }
    set({ queueIndex: next, handoffPending: localQueue.length > 1 })
    playSfx('flip')
  },

  beginNight: () => {
    const { players, round } = get()
    const nextRound = round + 1
    const queue = localPlayerIds(players, (p) => p.alive && ROLES[p.role].actsAtNight)
    set({
      round: nextRound,
      phase: 'night',
      nightActions: [],
      votes: {},
      voteStage: 'casting',
      localQueue: queue,
      queueIndex: 0,
      handoffPending: queue.length > 1,
    })
    startAmbience('night')
    playSfx('whoosh')
  },

  submitNightAction: (actorId, targetId) => {
    const { players, nightActions, localQueue, queueIndex, phase } = get()
    if (phase !== 'night') return
    const actor = players.find((p) => p.id === actorId)
    if (!actor) return
    // A seat only gets one move per night.
    if (localQueue[queueIndex] !== actorId) return
    const action: NightAction = { actorId, roleId: actor.role, targetId }
    const nextActions = [...nightActions.filter((a) => a.actorId !== actorId), action]
    const nextIndex = queueIndex + 1
    set({
      nightActions: nextActions,
      queueIndex: nextIndex,
      handoffPending: nextIndex < localQueue.length && localQueue.length > 1,
    })
    playSfx('select')
  },

  finishNight: () => {
    // Guard: timers, StrictMode double-effects and fast taps must never be
    // able to resolve the same night twice.
    const { players, nightActions, round, clues, phase } = get()
    if (phase !== 'night') return
    const allActions = collectBotActions(players, nightActions)
    const resolution = resolveNight(round, players, allActions)

    let next = applyScores(resolution.players, resolution.scoreEvents)
    next = ingestNight(next, resolution.result)
    const publicClues = resolution.clues.filter((c) => c.visibility === 'public')
    next = ingestPublicClues(next, publicClues, round)
    for (const clue of resolution.clues) {
      if (clue.visibility === 'private' && clue.ownerId) {
        next = ingestPrivateClue(next, clue.ownerId, clue)
      }
    }

    const winner = checkWinner(next)
    const headlines = resolution.result.headlines.map((h) => systemMessage(h, round))

    if (winner) {
      set({
        players: next,
        clues: [...clues, ...resolution.clues],
        lastNight: resolution.result,
        chat: [...get().chat, ...headlines],
        scoreLog: [...get().scoreLog, ...resolution.scoreEvents],
      })
      endGame(winner, null)
      return
    }

    const dialogue = generateDayDialogue(next, round, resolution.result)

    set({
      players: next,
      clues: [...clues, ...resolution.clues],
      lastNight: resolution.result,
      chat: [...get().chat, ...headlines],
      scoreLog: [...get().scoreLog, ...resolution.scoreEvents],
      pendingDialogue: dialogue.messages,
      // The clock starts once private dawn briefings are done, not before.
      dayDeadline: 0,
      phase: 'day',
      handoffPending: false,
      localQueue: [],
      queueIndex: 0,
    })
    startAmbience(round >= 3 ? 'tense' : 'day')
    playSfx(resolution.result.killedId ? 'eliminate' : resolution.result.savedId ? 'save' : 'reveal')
  },

  startDayClock: () => {
    if (get().dayDeadline > 0) return
    set({ dayDeadline: Date.now() + DAY_SECONDS * 1000 })
  },

  revealNextDialogue: () => {
    const { pendingDialogue, chat, players, round } = get()
    if (pendingDialogue.length === 0) return
    const [message, ...rest] = pendingDialogue
    let next = players
    if (message.tone === 'accuse' && message.targetId) {
      next = ingestAccusation(next, message.playerId, message.targetId, round)
    }
    if (message.tone === 'claim') {
      const speaker = next.find((p) => p.id === message.playerId)
      if (speaker) {
        next = ingestClaim(next, speaker.id, speaker.role, round)
        next = markClaimed(next, speaker.id, speaker.role)
      }
    }
    set({ pendingDialogue: rest, chat: [...chat, message], players: next })
  },

  humanSay: (playerId, kind, targetId) => {
    const { players, round, chat } = get()
    const speaker = players.find((p) => p.id === playerId)
    if (!speaker) return
    const target = targetId ? players.find((p) => p.id === targetId) : undefined

    let text = ''
    let tone: ChatMessage['tone'] = 'observe'
    switch (kind) {
      case 'accuse':
        text = `I think ${target?.name ?? 'someone here'} is the villain. Look at them.`
        tone = 'accuse'
        break
      case 'defend':
        text = 'You are wasting a vote on me. I am on the studio’s side.'
        tone = 'defend'
        break
      case 'claim':
        text = `Cards on the table — I am the ${ROLES[speaker.role].name.toUpperCase()}.`
        tone = 'claim'
        break
      case 'observe':
        text = 'Read the clues before anyone votes. We cannot waste another day.'
        tone = 'observe'
        break
    }

    const message: ChatMessage = {
      id: uid('msg'),
      round,
      playerId: speaker.id,
      playerName: speaker.name,
      avatar: speaker.avatar,
      text,
      tone,
      targetId: target?.id,
    }

    let next = players
    if (kind === 'accuse' && target) next = ingestAccusation(next, speaker.id, target.id, round)
    if (kind === 'claim') {
      next = ingestClaim(next, speaker.id, speaker.role, round)
      next = markClaimed(next, speaker.id, speaker.role)
    }
    set({ chat: [...chat, message], players: next })
    playSfx('click')
  },

  beginVote: () => {
    const { players, chat, round, phase } = get()
    if (phase !== 'day') return
    const spoke = chat.filter((m) => m.round === round).map((m) => m.playerId)
    const next = decaySilence(players, spoke, round)
    const queue = localPlayerIds(next, (p) => p.alive)
    set({
      players: next,
      phase: 'vote',
      votes: {},
      voteStage: 'casting',
      localQueue: queue,
      queueIndex: 0,
      handoffPending: queue.length > 1,
      pendingDialogue: [],
    })
    startAmbience('tense')
    playSfx('gavel')
  },

  castVote: (voterId, targetId) => {
    const { votes, localQueue, queueIndex, phase, voteStage } = get()
    if (phase !== 'vote' || voteStage !== 'casting') return
    if (localQueue[queueIndex] !== voterId) return
    const nextIndex = queueIndex + 1
    set({
      votes: { ...votes, [voterId]: targetId },
      queueIndex: nextIndex,
      handoffPending: nextIndex < localQueue.length && localQueue.length > 1,
    })
    playSfx('vote')
  },

  lockInBotVotes: () => {
    const { players, votes, round, chat, phase, voteStage } = get()
    if (phase !== 'vote' || voteStage !== 'casting') return
    const nextVotes = { ...votes }
    const lines: ChatMessage[] = []
    for (const bot of players) {
      if (!bot.isBot || !bot.alive) continue
      if (nextVotes[bot.id]) continue
      const targetId = botVote(bot, players)
      if (!targetId) continue
      nextVotes[bot.id] = targetId
      const target = players.find((p) => p.id === targetId)
      if (target && Math.random() < 0.5) lines.push(botVoteLine(bot, target.name, round))
    }
    set({ votes: nextVotes, voteStage: 'tally', chat: [...chat, ...lines] })
    playSfx('gavel')
  },

  finishVote: () => {
    const { players, votes, round, clues, phase } = get()
    if (phase !== 'vote') return
    const resolution = resolveVotes(round, players, votes)
    let next = applyScores(resolution.players, resolution.scoreEvents)
    next = ingestVerdict(next, votes, resolution.verdict.eliminatedId, resolution.verdict.wasVillain, round)

    const eliminated = next.find((p) => p.id === resolution.verdict.eliminatedId)
    const announcement = resolution.verdict.tie
      ? 'The producers deadlocked. Nobody is fired today.'
      : `${eliminated?.name ?? 'Someone'} has been thrown off the set — they were the ${
          eliminated ? ROLES[eliminated.role].name : 'Audience'
        }.`

    set({
      players: next,
      votes,
      clues,
      lastVerdict: resolution.verdict,
      scoreLog: [...get().scoreLog, ...resolution.scoreEvents],
      chat: [...get().chat, systemMessage(announcement, round)],
      phase: 'verdict',
    })
    playSfx(resolution.verdict.wasVillain ? 'correct' : resolution.verdict.tie ? 'wrong' : 'eliminate')
  },

  continueAfterVerdict: () => {
    const { players, round, maxRounds, phase } = get()
    if (phase !== 'verdict') return
    const winner = checkWinner(players)
    if (winner) {
      endGame(winner, null)
      return
    }
    if (round >= maxRounds) {
      endGame('villain', 'The shoot ran out of days. The villain walked away with the film.')
      return
    }
    get().beginNight()
  },

  playAgain: () => {
    const { mode, seats } = get()
    stopAmbience()
    if (mode === 'solo') {
      const human = seats.find((s) => !s.isBot)
      if (human) {
        const bots = makeBotSeats(Math.max(MIN_PLAYERS - 1, get().soloPlayerCount - 1), [human])
        set({ seats: [human, ...bots], botCount: bots.length })
        get().beginGame()
        return
      }
    }
    if (mode === 'party') {
      const code = generateRoomCode()
      const humanSeats = seats.filter((s) => !s.isBot)
      upsertRoom({
        code,
        hostName: humanSeats[0]?.name ?? 'Host',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        seats: humanSeats,
        botCount: get().botCount,
        status: 'open',
      })
      set({ roomCode: code, seats: humanSeats, phase: 'lobby' })
      return
    }
    get().resetToLanding()
  },
  }
})

/* ----------------------------- selectors ----------------------------- *
 * Kept as plain functions over state rather than hooks that build new
 * arrays — zustand v5 re-renders on reference changes, so derived arrays
 * belong in the component body, not in a selector.
 * --------------------------------------------------------------------- */

export function currentQueuePlayer(state: GameState): Player | null {
  const id = state.localQueue[state.queueIndex]
  if (!id) return null
  return state.players.find((p) => p.id === id) ?? null
}

export function ownerPlayer(state: GameState): Player | null {
  if (state.ownerSeatId) {
    const found = state.players.find((p) => p.id === state.ownerSeatId)
    if (found) return found
  }
  return state.players.find((p) => !p.isBot) ?? null
}

export function cluesFor(state: GameState, playerId: string | null): Clue[] {
  return state.clues.filter(
    (c) => c.visibility === 'public' || (playerId ? c.ownerId === playerId : false),
  )
}
