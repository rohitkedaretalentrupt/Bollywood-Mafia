import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { useIsCompact, usePrefersReducedMotion } from '../../hooks/useMediaQuery'

const GLYPHS = ['🎞️', '⭐', '✨', '🪩', '🎬', '💫', '🌟']

/** Slow-drifting film glyphs. Count scales down on phones. */
export function Particles({ density = 1 }: { density?: number }) {
  const compact = useIsCompact()
  const reduced = usePrefersReducedMotion()
  const count = reduced ? 0 : Math.round((compact ? 10 : 20) * density)

  const bits = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 9 + Math.random() * 16,
        duration: 16 + Math.random() * 20,
        delay: -Math.random() * 30,
        glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        opacity: 0.18 + Math.random() * 0.32,
      })),
    [count],
  )

  if (count === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {bits.map((b) => (
        <span
          key={b.id}
          className="absolute animate-drift will-change-transform"
          style={{
            left: `${b.left}%`,
            fontSize: `${b.size}px`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            opacity: b.opacity,
            filter: 'drop-shadow(0 0 8px rgba(245,197,24,0.35))',
          }}
        >
          {b.glyph}
        </span>
      ))}
    </div>
  )
}

/** Two sweeping award-show spotlights behind the content. */
export function Spotlights({ intensity = 1 }: { intensity?: number }) {
  const reduced = usePrefersReducedMotion()
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute -top-1/3 left-[8%] h-[150vh] w-[42vw] origin-top"
        style={{
          background:
            'linear-gradient(to bottom, rgba(245,197,24,0.16), rgba(245,197,24,0) 70%)',
          clipPath: 'polygon(46% 0, 54% 0, 100% 100%, 0% 100%)',
          opacity: 0.9 * intensity,
        }}
        animate={reduced ? undefined : { rotate: [-11, 9, -11] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -top-1/3 right-[8%] h-[150vh] w-[42vw] origin-top"
        style={{
          background: 'linear-gradient(to bottom, rgba(229,9,20,0.18), rgba(229,9,20,0) 70%)',
          clipPath: 'polygon(46% 0, 54% 0, 100% 100%, 0% 100%)',
          opacity: 0.9 * intensity,
        }}
        animate={reduced ? undefined : { rotate: [12, -8, 12] }}
        transition={{ duration: 21, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

/** Base gradient + grain + vignette wrapper used by every screen. */
export function StageBackdrop({ mood = 'night' }: { mood?: 'night' | 'day' | 'red' | 'gold' }) {
  const tint =
    mood === 'day'
      ? 'radial-gradient(85% 60% at 50% -6%, rgba(245,197,24,0.20) 0%, rgba(4,3,8,0) 62%)'
      : mood === 'red'
        ? 'radial-gradient(85% 60% at 50% -6%, rgba(229,9,20,0.34) 0%, rgba(4,3,8,0) 64%)'
        : mood === 'gold'
          ? 'radial-gradient(85% 60% at 50% -6%, rgba(245,197,24,0.30) 0%, rgba(4,3,8,0) 66%)'
          : 'radial-gradient(85% 60% at 50% -6%, rgba(80,40,160,0.24) 0%, rgba(4,3,8,0) 62%)'

  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-0" style={{ background: tint }} />
      <div
        className="absolute inset-0 opacity-[0.55]"
        style={{
          background:
            'radial-gradient(60% 45% at 50% 108%, rgba(245,197,24,0.10) 0%, rgba(4,3,8,0) 60%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.014) 0px, rgba(255,255,255,0.014) 1px, transparent 1px, transparent 3px)',
        }}
      />
    </div>
  )
}

/** Thin decorative film-perforation rail. */
export function FilmRail({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-between gap-1 overflow-hidden opacity-40 ${className}`}
      aria-hidden
    >
      {Array.from({ length: 26 }).map((_, i) => (
        <span key={i} className="h-2 w-3 shrink-0 rounded-[2px] bg-gold-400/40" />
      ))}
    </div>
  )
}
