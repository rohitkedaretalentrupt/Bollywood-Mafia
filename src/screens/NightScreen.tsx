import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { StageBackdrop } from '../components/effects/Ambient'
import { ClueLog } from '../components/ClueLog'
import { HandoffGate } from '../components/HandoffGate'
import { PlayerGrid } from '../components/PlayerGrid'
import { MovieProgress } from '../components/CountdownRing'
import { RoleChip } from '../components/RoleCard'
import { BackHomeButton, PhaseBadge, SoundToggle, TopBar } from '../components/TopBar'
import { Button } from '../components/ui/Button'
import { Panel } from '../components/ui/Panel'
import { ROLES } from '../data'
import { useTimeout } from '../hooks/useCountdown'
import { useGame } from '../store/gameStore'

export function NightScreen() {
  const players = useGame((s) => s.players)
  const round = useGame((s) => s.round)
  const maxRounds = useGame((s) => s.maxRounds)
  const localQueue = useGame((s) => s.localQueue)
  const queueIndex = useGame((s) => s.queueIndex)
  const handoffPending = useGame((s) => s.handoffPending)
  const clearHandoff = useGame((s) => s.clearHandoff)
  const submitNightAction = useGame((s) => s.submitNightAction)
  const finishNight = useGame((s) => s.finishNight)
  const clues = useGame((s) => s.clues)

  const [selected, setSelected] = useState<string | null>(null)

  const currentId = localQueue[queueIndex]
  const actor = players.find((p) => p.id === currentId) ?? null
  const done = !actor

  useEffect(() => {
    setSelected(null)
  }, [currentId])

  // Once every human has acted, resolve the night after a short beat.
  useTimeout(() => {
    if (done) finishNight()
  }, done ? 2600 : null, `${round}-${done}`)

  if (done) return <NightFalls round={round} maxRounds={maxRounds} />

  const role = ROLES[actor.role]
  const alive = players.filter((p) => p.alive)
  const targets = alive.filter((p) => {
    if (!role.canTargetSelf && p.id === actor.id) return false
    // Villains cannot strike their own accomplices.
    if (actor.role === 'villain' && p.role === 'villain') return false
    return true
  })
  const myClues = clues.filter(
    (c) => c.ownerId === actor.id || (c.visibility === 'public' && c.round >= round - 2),
  )

  return (
    <div className="relative min-h-full">
      <StageBackdrop mood={actor.role === 'villain' ? 'red' : 'night'} />

      <TopBar
        left={<BackHomeButton />}
        center={<PhaseBadge phase="night" round={round} />}
        right={<SoundToggle />}
      />

      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 py-5 safe-bottom">
        <MovieProgress round={round} maxRounds={maxRounds} />

        <motion.div
          key={actor.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <Panel glow={actor.role === 'villain'}>
            <div className="flex items-center gap-3">
              <motion.span
                className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border text-3xl"
                style={{
                  borderColor: `${role.accent}55`,
                  background: `${role.accent}14`,
                }}
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2.6, repeat: Infinity }}
              >
                {role.emoji}
              </motion.span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <RoleChip roleId={actor.role} size="sm" />
                  <span className="text-[10px] font-bold uppercase tracking-cine text-gold-100/40">
                    {actor.avatar} {actor.name}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] font-semibold leading-snug text-gold-100/85">
                  {role.actionLabel}
                </p>
              </div>
            </div>
          </Panel>
        </motion.div>

        <div className="mt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-cine text-gold-100/45">
            Still on the call sheet
          </p>
          <PlayerGrid
            players={targets}
            selectedId={selected}
            onSelect={(id) => setSelected(id)}
            youId={actor.id}
            columnsClass="grid-cols-3 sm:grid-cols-4"
          />
        </div>

        {myClues.length > 0 ? (
          <div className="mt-5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-cine text-gold-100/45">
              Your notebook
            </p>
            <ClueLog clues={myClues} className="max-h-52" limit={6} />
          </div>
        ) : null}

        <div className="sticky bottom-0 mt-5 -mx-4 bg-gradient-to-t from-ink-950 via-ink-950/95 to-transparent px-4 pb-4 pt-5">
          <Button
            variant={actor.role === 'villain' ? 'danger' : 'gold'}
            size="lg"
            full
            disabled={!selected}
            onClick={() => selected && submitNightAction(actor.id, selected)}
          >
            {selected
              ? `${role.actionVerb === 'targeted' ? 'Strike' : 'Confirm'} · ${
                  players.find((p) => p.id === selected)?.name ?? ''
                }`
              : 'Choose a target'}
          </Button>
          <button
            onClick={() => submitNightAction(actor.id, null)}
            className="mt-2 w-full py-2 text-[10px] font-bold uppercase tracking-cine text-gold-100/30 transition hover:text-gold-100/60"
          >
            Sit this one out
          </button>
        </div>
      </div>

      {handoffPending ? (
        <HandoffGate
          key={actor.id}
          name={actor.name}
          avatar={actor.avatar}
          subtitle="Your night move is secret. Nobody else should see this screen."
          onReady={clearHandoff}
        />
      ) : null}
    </div>
  )
}

function NightFalls({ round, maxRounds }: { round: number; maxRounds: number }) {
  return (
    <div className="relative grid min-h-full place-items-center overflow-hidden px-6">
      <StageBackdrop mood="night" />
      <div className="relative z-10 w-full max-w-sm text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 140, damping: 14 }}
          className="mx-auto text-7xl"
        >
          🌙
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-5 font-display text-4xl leading-none tracking-wide text-gold"
        >
          NIGHT {round}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-3 text-sm leading-snug text-gold-100/55"
        >
          The floodlights die. Somewhere on this set, someone is moving.
        </motion.p>

        <div className="mt-8 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2 w-2 rounded-full bg-gold-400"
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.85, 1.2, 0.85] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.22 }}
            />
          ))}
        </div>

        <div className="mt-8">
          <MovieProgress round={round} maxRounds={maxRounds} />
        </div>
      </div>
    </div>
  )
}
