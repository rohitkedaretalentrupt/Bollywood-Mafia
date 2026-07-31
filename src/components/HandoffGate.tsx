import { motion } from 'framer-motion'
import { Button } from './ui/Button'

/**
 * Privacy screen for pass-and-play. Nothing secret renders until the named
 * player confirms they are the one holding the phone.
 *
 * Rendered with a plain conditional rather than inside an AnimatePresence: this
 * overlay blocks the whole game, so it must unmount the instant it is dismissed.
 * Gating that on an exit animation means a tab whose rAF loop is paused (a
 * backgrounded phone, mid-transition) leaves the player stuck behind it. It gets
 * an entrance animation and no exit — nobody misses a fade-out on a screen they
 * are trying to get rid of.
 */
export function HandoffGate({
  name,
  avatar,
  subtitle = 'Everyone else — eyes off the screen.',
  onReady,
}: {
  name: string
  avatar: string
  subtitle?: string
  onReady: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[75] grid place-items-center bg-ink-950/96 px-5 backdrop-blur-xl"
    >
      <div className="w-full max-w-sm text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          className="mx-auto mb-5 grid h-24 w-24 place-items-center rounded-full border-2 border-gold-400/50 bg-ink-900 text-5xl shadow-gold"
        >
          {avatar}
        </motion.div>

        <p className="text-[10px] font-bold uppercase tracking-cine text-crimson-400">
          Pass the device
        </p>
        <h2 className="mt-2 font-display text-4xl leading-none tracking-wide text-gold">
          {name}
        </h2>
        <p className="mx-auto mt-3 max-w-[28ch] text-sm leading-snug text-gold-100/60">
          {subtitle}
        </p>

        <div className="my-6 flex items-center justify-center gap-2 text-2xl">
          <motion.span
            animate={{ x: [-6, 6, -6] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            📱
          </motion.span>
          <span className="text-gold-100/30">→</span>
          <span>{avatar}</span>
        </div>

        <Button variant="gold" size="lg" full onClick={onReady}>
          I am {name}
        </Button>
        <p className="mt-3 text-[10px] uppercase tracking-cine text-gold-100/25">
          No peeking. The movie depends on it.
        </p>
      </div>
    </motion.div>
  )
}
