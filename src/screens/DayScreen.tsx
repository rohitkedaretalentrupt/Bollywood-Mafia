import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { playSfx } from '../audio/sound'
import { ChatFeed, TypingIndicator } from '../components/ChatFeed'
import { ClueLog } from '../components/ClueLog'
import { CountdownRing, MovieProgress } from '../components/CountdownRing'
import { HandoffGate } from '../components/HandoffGate'
import { PlayerGrid } from '../components/PlayerGrid'
import { RoleChip } from '../components/RoleCard'
import { StageBackdrop } from '../components/effects/Ambient'
import { BackHomeButton, PhaseBadge, SoundToggle, TopBar } from '../components/TopBar'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Panel } from '../components/ui/Panel'
import { ROLES } from '../data'
import { useCountdown, useInterval } from '../hooks/useCountdown'
import { DAY_SECONDS, useGame } from '../store/gameStore'
import type { Player, PrivateResult } from '../types/game'

type Tab = 'talk' | 'clues' | 'cast'

export function DayScreen() {
  const players = useGame((s) => s.players)
  const round = useGame((s) => s.round)
  const maxRounds = useGame((s) => s.maxRounds)
  const chat = useGame((s) => s.chat)
  const clues = useGame((s) => s.clues)
  const lastNight = useGame((s) => s.lastNight)
  const pendingDialogue = useGame((s) => s.pendingDialogue)
  const dayDeadline = useGame((s) => s.dayDeadline)
  const mode = useGame((s) => s.mode)
  const ownerSeatId = useGame((s) => s.ownerSeatId)
  const revealNextDialogue = useGame((s) => s.revealNextDialogue)
  const humanSay = useGame((s) => s.humanSay)
  const beginVote = useGame((s) => s.beginVote)
  const startDayClock = useGame((s) => s.startDayClock)

  const alive = useMemo(() => players.filter((p) => p.alive), [players])
  const localAlive = useMemo(() => alive.filter((p) => !p.isBot), [alive])

  /* ---------------------- private dawn briefings ---------------------- */
  const briefingPlayers = useMemo(() => {
    if (!lastNight) return []
    return localAlive.filter((p) => lastNight.privateResults.some((r) => r.playerId === p.id))
  }, [lastNight, localAlive])

  const needsGate = mode === 'party' && localAlive.length > 1
  const [briefIdx, setBriefIdx] = useState(0)
  const [gateOpen, setGateOpen] = useState(false)
  const [briefRound, setBriefRound] = useState(-1)

  useEffect(() => {
    if (briefRound === round) return
    setBriefRound(round)
    setBriefIdx(0)
    setGateOpen(needsGate && briefingPlayers.length > 0)
  }, [round, briefRound, needsGate, briefingPlayers.length])

  const briefing = briefIdx < briefingPlayers.length ? briefingPlayers[briefIdx] : null

  /* --------------------------- day machinery --------------------------- */
  // The discussion clock only starts once every private briefing is closed,
  // so pass-and-play handoffs never eat into the day.
  useEffect(() => {
    if (!briefing) startDayClock()
  }, [briefing, startDayClock])

  const { secondsLeft } = useCountdown(dayDeadline, beginVote)

  useInterval(
    () => {
      if (pendingDialogue.length > 0) revealNextDialogue()
    },
    pendingDialogue.length > 0 && !briefing ? 1900 : null,
  )

  const [tab, setTab] = useState<Tab>('talk')
  const [accuseOpen, setAccuseOpen] = useState(false)
  const [speakerId, setSpeakerId] = useState<string | null>(null)
  const [spoken, setSpoken] = useState<Record<string, number>>({})

  const speaker =
    localAlive.find((p) => p.id === speakerId) ??
    localAlive.find((p) => p.id === ownerSeatId) ??
    localAlive[0] ??
    null

  const roundChat = chat.filter((m) => m.round === round)

  const say = (kind: 'accuse' | 'defend' | 'claim' | 'observe', targetId?: string) => {
    if (!speaker) return
    const used = spoken[speaker.id] ?? 0
    if (used >= 3) {
      playSfx('wrong')
      return
    }
    humanSay(speaker.id, kind, targetId)
    setSpoken((s) => ({ ...s, [speaker.id]: used + 1 }))
  }

  if (briefing && lastNight) {
    const results = lastNight.privateResults.filter((r) => r.playerId === briefing.id)
    return (
      <>
        <DawnBriefing
          player={briefing}
          results={results}
          index={briefIdx}
          total={briefingPlayers.length}
          headlines={lastNight.headlines}
          onDone={() => {
            setBriefIdx((i) => i + 1)
            setGateOpen(needsGate && briefIdx + 1 < briefingPlayers.length)
          }}
        />
        {gateOpen ? (
          <HandoffGate
            key={briefing.id}
            name={briefing.name}
            avatar={briefing.avatar}
            subtitle="You have a private report from last night."
            onReady={() => setGateOpen(false)}
          />
        ) : null}
      </>
    )
  }

  const talkPanel = (
    <Panel className="flex min-h-0 flex-col">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-cine text-gold-100/45">
          Set discussion
        </p>
        <span className="text-[10px] font-bold uppercase tracking-cine text-gold-100/30">
          {alive.length} alive
        </span>
      </div>
      <ChatFeed
        messages={roundChat}
        className="min-h-[220px] flex-1 pr-1"
        emptyLabel="Nobody has spoken yet…"
      />
      <TypingIndicator show={pendingDialogue.length > 0} />
    </Panel>
  )

  const cluesPanel = (
    <Panel className="flex min-h-0 flex-col">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-cine text-gold-100/45">
        Continuity log
      </p>
      <ClueLog
        clues={clues.filter((c) => c.visibility === 'public' || c.ownerId === speaker?.id)}
        className="min-h-[220px] flex-1 pr-1"
      />
    </Panel>
  )

  const castPanel = (
    <Panel className="flex min-h-0 flex-col">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-cine text-gold-100/45">
        The cast
      </p>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
        <PlayerGrid
          players={players}
          youId={speaker?.id ?? null}
          compact
          columnsClass="grid-cols-3 sm:grid-cols-4"
          captions={Object.fromEntries(
            players
              .filter((p) => !p.alive)
              .map((p) => [
                p.id,
                p.eliminatedBy === 'villain' ? `night ${p.eliminatedRound}` : `voted out`,
              ]),
          )}
        />
      </div>
    </Panel>
  )

  return (
    <div className="relative min-h-full">
      <StageBackdrop mood="day" />

      <TopBar
        left={<BackHomeButton />}
        center={<PhaseBadge phase="day" round={round} />}
        right={
          <>
            <CountdownRing secondsLeft={secondsLeft} total={DAY_SECONDS} size={52} label="sec" />
            <SoundToggle />
          </>
        }
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-4 safe-bottom">
        <MovieProgress round={round} maxRounds={maxRounds} />

        {lastNight ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 overflow-hidden rounded-2xl border border-gold-400/30 bg-gradient-to-r from-crimson-900/40 via-ink-900/70 to-ink-900/40 px-4 py-3"
          >
            <p className="text-[9px] font-bold uppercase tracking-cine text-crimson-400">
              Dawn report
            </p>
            <p className="mt-1 font-display text-lg leading-tight tracking-wide text-gold-100">
              {lastNight.headlines[0]}
            </p>
            {lastNight.headlines[1] ? (
              <p className="mt-0.5 text-[12px] text-gold-100/60">{lastNight.headlines[1]}</p>
            ) : null}
          </motion.div>
        ) : null}

        {/* Desktop: everything at once */}
        <div className="mt-4 hidden gap-4 lg:grid lg:grid-cols-3">
          {talkPanel}
          {cluesPanel}
          {castPanel}
        </div>

        {/* Mobile: tabs */}
        <div className="lg:hidden">
          <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5">
            {(
              [
                ['talk', '💬 Talk'],
                ['clues', '🔍 Clues'],
                ['cast', '🎭 Cast'],
              ] as [Tab, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setTab(key)
                  playSfx('click')
                }}
                className={[
                  'rounded-xl py-2.5 text-[11px] font-bold uppercase tracking-widest transition',
                  tab === key
                    ? 'bg-gradient-to-b from-gold-300 to-gold-500 text-ink-950 shadow-gold'
                    : 'text-gold-100/50 hover:bg-white/[0.06]',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-3">
            {tab === 'talk' ? talkPanel : tab === 'clues' ? cluesPanel : castPanel}
          </div>
        </div>

        {/* Speak bar */}
        {speaker ? (
          <div className="sticky bottom-0 mt-4 -mx-4 bg-gradient-to-t from-ink-950 via-ink-950/95 to-transparent px-4 pb-3 pt-4">
            {localAlive.length > 1 ? (
              <div className="no-scrollbar mb-2 flex gap-1.5 overflow-x-auto">
                {localAlive.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSpeakerId(p.id)}
                    className={[
                      'flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition',
                      p.id === speaker.id
                        ? 'border-gold-400/70 bg-gold-400/15 text-gold-200'
                        : 'border-white/12 bg-white/[0.05] text-gold-100/50',
                    ].join(' ')}
                  >
                    <span>{p.avatar}</span>
                    {p.name}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <RoleChip roleId={speaker.role} size="sm" />
                <span className="text-[10px] uppercase tracking-cine text-gold-100/35">
                  {3 - (spoken[speaker.id] ?? 0)} lines left
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              <SpeakButton label="Accuse" icon="🎯" onClick={() => setAccuseOpen(true)} />
              <SpeakButton label="Defend" icon="🛡️" onClick={() => say('defend')} />
              <SpeakButton
                label="Claim"
                icon="🎬"
                onClick={() => say('claim')}
                disabled={!!speaker.claimedRole}
              />
              <SpeakButton label="Urge" icon="🗒️" onClick={() => say('observe')} />
            </div>

            <Button variant="primary" size="lg" full className="mt-2.5" onClick={beginVote}>
              🗳️ Call the vote now
            </Button>
          </div>
        ) : (
          <div className="sticky bottom-0 mt-4 -mx-4 bg-gradient-to-t from-ink-950 to-transparent px-4 pb-3 pt-4">
            <p className="mb-2 text-center text-[11px] uppercase tracking-cine text-gold-100/35">
              You have been written out — watch the rest unfold
            </p>
            <Button variant="ghost" size="lg" full onClick={beginVote}>
              Skip to the vote
            </Button>
          </div>
        )}
      </div>

      <Modal open={accuseOpen} onClose={() => setAccuseOpen(false)} title="Point the finger">
        <p className="mb-4 text-[13px] leading-snug text-gold-100/60">
          Accusing someone publicly pushes the AI cast toward them — and makes them push back at
          you.
        </p>
        <PlayerGrid
          players={alive.filter((p) => p.id !== speaker?.id)}
          onSelect={(id) => {
            say('accuse', id)
            setAccuseOpen(false)
          }}
          columnsClass="grid-cols-3 sm:grid-cols-4"
        />
      </Modal>
    </div>
  )
}

function SpeakButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string
  icon: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.94 }}
      onClick={() => {
        if (disabled) return
        onClick()
      }}
      disabled={disabled}
      className="flex flex-col items-center gap-0.5 rounded-2xl border border-white/12 bg-white/[0.055] py-2.5 transition hover:bg-white/[0.1] disabled:opacity-35"
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-gold-100/70">
        {label}
      </span>
    </motion.button>
  )
}

function DawnBriefing({
  player,
  results,
  index,
  total,
  headlines,
  onDone,
}: {
  player: Player
  results: PrivateResult[]
  index: number
  total: number
  headlines: string[]
  onDone: () => void
}) {
  const role = ROLES[player.role]
  return (
    <div className="relative min-h-full">
      <StageBackdrop mood="gold" />
      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-5 py-8 safe-bottom">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-center text-[10px] font-bold uppercase tracking-cine text-crimson-400">
            Private report
          </p>
          <h1 className="mt-1 text-center font-display text-3xl leading-none tracking-wide text-gold">
            {player.avatar} {player.name}
          </h1>
          {total > 1 ? (
            <p className="mt-2 text-center text-[10px] uppercase tracking-cine text-gold-100/35">
              Report {index + 1} of {total}
            </p>
          ) : null}
        </motion.div>

        <Panel glow className="mt-5">
          <div className="mb-3 flex items-center gap-2">
            <RoleChip roleId={player.role} size="sm" />
            <span className="text-[10px] uppercase tracking-cine text-gold-100/35">
              {role.actionVerb} last night
            </span>
          </div>

          <div className="space-y-2.5">
            {results.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.15 }}
                className={[
                  'flex gap-3 rounded-2xl border px-3 py-3',
                  r.tone === 'good'
                    ? 'border-gold-400/45 bg-gold-400/[0.1]'
                    : r.tone === 'bad'
                      ? 'border-crimson-400/40 bg-crimson-900/25'
                      : 'border-white/12 bg-white/[0.05]',
                ].join(' ')}
              >
                <span className="text-2xl leading-none">{r.icon}</span>
                <p className="text-[13px] font-semibold leading-snug text-gold-100/90">{r.text}</p>
              </motion.div>
            ))}
          </div>
        </Panel>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3"
        >
          <p className="text-[9px] font-bold uppercase tracking-cine text-gold-100/40">
            Public dawn report
          </p>
          {headlines.map((h, i) => (
            <p key={i} className="mt-1 text-[12px] leading-snug text-gold-100/70">
              {h}
            </p>
          ))}
        </motion.div>

        <Button variant="gold" size="lg" full className="mt-5" onClick={onDone}>
          Got it — join the discussion
        </Button>
      </div>
    </div>
  )
}
