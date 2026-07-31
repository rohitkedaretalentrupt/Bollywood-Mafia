import { motion } from 'framer-motion'
import { useState } from 'react'
import { StageBackdrop } from '../components/effects/Ambient'
import { HandoffGate } from '../components/HandoffGate'
import { RoleCard } from '../components/RoleCard'
import { Button } from '../components/ui/Button'
import { ROLES } from '../data'
import { useGame } from '../store/gameStore'

export function RoleRevealScreen() {
  const players = useGame((s) => s.players)
  const localQueue = useGame((s) => s.localQueue)
  const queueIndex = useGame((s) => s.queueIndex)
  const handoffPending = useGame((s) => s.handoffPending)
  const clearHandoff = useGame((s) => s.clearHandoff)
  const advanceReveal = useGame((s) => s.advanceReveal)

  const [flipped, setFlipped] = useState(false)
  const currentId = localQueue[queueIndex]
  const player = players.find((p) => p.id === currentId)

  if (!player) {
    return (
      <div className="grid min-h-full place-items-center px-6">
        <StageBackdrop mood="night" />
        <p className="relative z-10 text-center text-sm uppercase tracking-cine text-gold-100/50">
          Dealing the roles…
        </p>
      </div>
    )
  }

  const role = ROLES[player.role]
  const allies =
    player.role === 'villain' ? players.filter((p) => p.role === 'villain' && p.id !== player.id) : []
  const isLast = queueIndex >= localQueue.length - 1

  return (
    <div className="relative min-h-full overflow-hidden">
      <StageBackdrop mood={player.role === 'villain' ? 'red' : 'gold'} />

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center px-5 py-8 safe-bottom">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 text-center"
        >
          <p className="text-[10px] font-bold uppercase tracking-cine text-crimson-400">
            Casting call
          </p>
          <h1 className="mt-1 font-display text-3xl leading-none tracking-wide text-gold">
            {player.avatar} {player.name}
          </h1>
          {localQueue.length > 1 ? (
            <p className="mt-2 text-[10px] uppercase tracking-cine text-gold-100/35">
              Player {queueIndex + 1} of {localQueue.length}
            </p>
          ) : null}
        </motion.div>

        {/* The card mounts only once the right person is holding the device, so
            its auto-flip can never fire behind the privacy screen. Swapped with a
            plain conditional — an AnimatePresence exit would hold the card back
            until the placeholder finished animating out. */}
        {handoffPending ? (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid aspect-[3/4.15] w-full max-w-sm place-items-center rounded-[28px] border-2 border-gold-400/30"
          >
            <span className="text-5xl opacity-40">🎬</span>
          </motion.div>
        ) : (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
          >
            <RoleCard role={role} allies={allies} onFlipped={() => setFlipped(true)} />
          </motion.div>
        )}

        <motion.div
          className="mt-6 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: flipped ? 1 : 0.25 }}
        >
          <Button
            variant="gold"
            size="lg"
            full
            disabled={!flipped}
            onClick={() => {
              setFlipped(false)
              advanceReveal()
            }}
          >
            {isLast ? 'Night falls 🌙' : 'Memorised it — next player'}
          </Button>
          <p className="mt-3 text-center text-[10px] uppercase tracking-cine text-gold-100/25">
            {flipped ? 'Do not tell anyone what you just saw' : 'Tap the card to reveal'}
          </p>
        </motion.div>
      </div>

      {handoffPending ? (
        <HandoffGate
          key={player.id}
          name={player.name}
          avatar={player.avatar}
          subtitle="You are about to see your secret role. Make sure nobody else is looking."
          onReady={clearHandoff}
        />
      ) : null}
    </div>
  )
}
