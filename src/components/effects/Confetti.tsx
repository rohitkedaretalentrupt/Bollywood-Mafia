import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { useIsCompact, usePrefersReducedMotion } from '../../hooks/useMediaQuery'

const PALETTE = ['#f5c518', '#e50914', '#fff8e1', '#d4af37', '#ff4d5e', '#ffeaa7']

/**
 * DOM confetti — 60-90 lightweight strips. Cheaper than a canvas for a
 * one-shot celebration and it composites on the GPU.
 */
export function Confetti({ active, pieces }: { active: boolean; pieces?: number }) {
  const compact = useIsCompact()
  const reduced = usePrefersReducedMotion()
  const count = reduced ? 0 : (pieces ?? (compact ? 55 : 95))

  const bits = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 1.1,
        duration: 2.6 + Math.random() * 2.4,
        rotate: Math.random() * 720 - 360,
        drift: Math.random() * 140 - 70,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        w: 5 + Math.random() * 6,
        h: 10 + Math.random() * 14,
        round: Math.random() > 0.7,
      })),
    [count],
  )

  if (!active || count === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {bits.map((b) => (
        <motion.span
          key={b.id}
          className="absolute top-[-8%] block"
          style={{
            left: `${b.x}%`,
            width: b.w,
            height: b.h,
            background: b.color,
            borderRadius: b.round ? '99px' : '2px',
            boxShadow: `0 0 8px ${b.color}55`,
          }}
          initial={{ y: '-10vh', opacity: 0, rotate: 0 }}
          animate={{ y: '112vh', opacity: [0, 1, 1, 0.9, 0], rotate: b.rotate, x: b.drift }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            ease: 'easeIn',
            repeat: Infinity,
            repeatDelay: Math.random() * 1.5,
          }}
        />
      ))}
    </div>
  )
}

/** A single flash of light — used on eliminations and role reveals. */
export function FlashBurst({ color = '#e50914', trigger }: { color?: string; trigger: number }) {
  return (
    <motion.div
      key={trigger}
      className="pointer-events-none fixed inset-0 z-[65]"
      style={{ background: color }}
      initial={{ opacity: 0.55 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    />
  )
}
