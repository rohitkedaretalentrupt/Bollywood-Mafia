import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { ClueLog } from '../components/ClueLog'
import { HandoffGate } from '../components/HandoffGate'
import { PlayerGrid } from '../components/PlayerGrid'
import { RoleChip } from '../components/RoleCard'
import { StageBackdrop } from '../components/effects/Ambient'
import { PhaseBadge, SoundToggle, TopBar } from '../components/TopBar'
import { Button } from '../components/ui/Button'
import { Panel } from '../components/ui/Panel'
import { useTimeout } from '../hooks/useCountdown'
import { useGame } from '../store/gameStore'
import { tallyVotes } from '../engine/winner'

export function VotingScreen() {
  const players = useGame((s) => s.players)
  const round = useGame((s) => s.round)
  const clues = useGame((s) => s.clues)
  const voteStage = useGame((s) => s.voteStage)
  const localQueue = useGame((s) => s.localQueue)
  const queueIndex = useGame((s) => s.queueIndex)
  const handoffPending = useGame((s) => s.handoffPending)
  const clearHandoff = useGame((s) => s.clearHandoff)
  const castVote = useGame((s) => s.castVote)
  const lockInBotVotes = useGame((s) => s.lockInBotVotes)
  const finishVote = useGame((s) => s.finishVote)

  const [selected, setSelected] = useState<string | null>(null)
  const alive = useMemo(() => players.filter((p) => p.alive), [players])

  const currentId = localQueue[queueIndex]
  const voter = players.find((p) => p.id === currentId) ?? null
  const castingDone = !voter

  useEffect(() => {
    setSelected(null)
  }, [currentId])

  // Bots vote as soon as the humans are finished.
  useTimeout(
    () => {
      if (castingDone && voteStage === 'casting') lockInBotVotes()
    },
    castingDone && voteStage === 'casting' ? 900 : null,
    `${round}-${castingDone}-${voteStage}`,
  )

  if (voteStage === 'tally') {
    return <VoteTally onContinue={finishVote} />
  }

  if (!voter) {
    return (
      <div className="relative grid min-h-full place-items-center px-6">
        <StageBackdrop mood="red" />
        <div className="relative z-10 text-center">
          <motion.div
            animate={{ rotate: [-12, 12, -12] }}
            transition={{ duration: 1.1, repeat: Infinity }}
            className="text-6xl"
          >
            ⚖️
          </motion.div>
          <p className="mt-4 font-display text-2xl tracking-wide text-gold">
            The cast is deliberating…
          </p>
        </div>
      </div>
    )
  }

  const candidates = alive.filter((p) => p.id !== voter.id)
  const myClues = clues.filter((c) => c.visibility === 'public' || c.ownerId === voter.id)

  return (
    <div className="relative min-h-full">
      <StageBackdrop mood="red" />

      <TopBar
        left={
          <span className="text-[10px] font-bold uppercase tracking-cine text-gold-100/40">
            {queueIndex + 1}/{localQueue.length}
          </span>
        }
        center={<PhaseBadge phase="vote" round={round} />}
        right={<SoundToggle />}
      />

      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 py-5 safe-bottom">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Panel>
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-gold-400/40 bg-ink-800 text-2xl">
                {voter.avatar}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-xl leading-none tracking-wide text-gold">
                    {voter.name}
                  </span>
                  <RoleChip roleId={voter.role} size="sm" />
                </div>
                <p className="mt-1 text-[12px] leading-snug text-gold-100/60">
                  Who gets thrown off the set today?
                </p>
              </div>
            </div>
          </Panel>
        </motion.div>

        <div className="mt-4">
          <PlayerGrid
            players={candidates}
            selectedId={selected}
            onSelect={setSelected}
            columnsClass="grid-cols-3 sm:grid-cols-4"
          />
        </div>

        <div className="mt-5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-cine text-gold-100/45">
            One last look at the log
          </p>
          <ClueLog clues={myClues} className="max-h-48" limit={5} />
        </div>

        <div className="sticky bottom-0 mt-5 -mx-4 bg-gradient-to-t from-ink-950 via-ink-950/95 to-transparent px-4 pb-4 pt-5">
          <Button
            variant="danger"
            size="lg"
            full
            disabled={!selected}
            onClick={() => selected && castVote(voter.id, selected)}
          >
            {selected
              ? `🗳️ Vote out ${players.find((p) => p.id === selected)?.name ?? ''}`
              : 'Select someone to fire'}
          </Button>
        </div>
      </div>

      {handoffPending ? (
        <HandoffGate
          key={voter.id}
          name={voter.name}
          avatar={voter.avatar}
          subtitle="Your vote is secret. Hand the device over before you look."
          onReady={clearHandoff}
        />
      ) : null}
    </div>
  )
}

function VoteTally({ onContinue }: { onContinue: () => void }) {
  const players = useGame((s) => s.players)
  const votes = useGame((s) => s.votes)
  const round = useGame((s) => s.round)
  const [revealed, setRevealed] = useState(0)

  const tally = useMemo(
    () => tallyVotes(players, votes).filter((t) => t.votes > 0),
    [players, votes],
  )
  const totalVotes = Object.keys(votes).length
  const leader = tally[0]

  useEffect(() => {
    if (revealed >= tally.length) return
    const id = window.setTimeout(() => setRevealed((r) => r + 1), 520)
    return () => window.clearTimeout(id)
  }, [revealed, tally.length])

  const allShown = revealed >= tally.length

  return (
    <div className="relative min-h-full">
      <StageBackdrop mood="red" />

      <TopBar center={<PhaseBadge phase="vote" round={round} />} right={<SoundToggle />} />

      <div className="relative z-10 mx-auto w-full max-w-xl px-4 py-6 safe-bottom">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-cine text-crimson-400">
            The votes are in
          </p>
          <h1 className="mt-1 font-display text-4xl leading-none tracking-wide text-gold">
            {totalVotes} BALLOT{totalVotes === 1 ? '' : 'S'}
          </h1>
        </motion.div>

        <div className="mt-6 space-y-2.5">
          {tally.map((row, i) => {
            const player = players.find((p) => p.id === row.playerId)
            if (!player) return null
            const pct = totalVotes > 0 ? (row.votes / totalVotes) * 100 : 0
            const shown = i < revealed
            const isLeader = allShown && leader?.playerId === row.playerId && !hasTie(tally)
            return (
              <motion.div
                key={row.playerId}
                initial={{ opacity: 0, x: -20 }}
                animate={shown ? { opacity: 1, x: 0 } : { opacity: 0.25, x: -20 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                className={[
                  'relative overflow-hidden rounded-2xl border px-3 py-3',
                  isLeader
                    ? 'border-crimson-400/70 bg-crimson-900/40 shadow-crimson'
                    : 'border-white/12 bg-white/[0.05]',
                ].join(' ')}
              >
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-crimson-600/45 to-crimson-500/10"
                  initial={{ width: 0 }}
                  animate={{ width: shown ? `${pct}%` : 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
                <div className="relative flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/15 bg-ink-800 text-xl">
                    {player.avatar}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-gold-100">{player.name}</p>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {row.voters.map((vid) => {
                        const v = players.find((p) => p.id === vid)
                        return (
                          <motion.span
                            key={vid}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={shown ? { scale: 1, opacity: 1 } : {}}
                            transition={{ delay: 0.2 + Math.random() * 0.35 }}
                            className="text-xs"
                            title={v?.name}
                          >
                            {v?.avatar}
                          </motion.span>
                        )
                      })}
                    </div>
                  </div>
                  <span className="font-display text-3xl leading-none text-gold">{row.votes}</span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {tally.length === 0 ? (
          <p className="py-10 text-center text-sm uppercase tracking-cine text-gold-100/40">
            Nobody cast a ballot
          </p>
        ) : null}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: allShown ? 1 : 0.25 }}
          className="sticky bottom-0 mt-6 -mx-4 bg-gradient-to-t from-ink-950 via-ink-950/95 to-transparent px-4 pb-4 pt-5"
        >
          <Button variant="gold" size="lg" full disabled={!allShown} onClick={onContinue}>
            ⚖️ Read the verdict
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

function hasTie(tally: { votes: number }[]): boolean {
  return tally.length > 1 && tally[0].votes === tally[1].votes
}
