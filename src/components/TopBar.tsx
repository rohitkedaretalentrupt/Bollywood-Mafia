import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { sound } from '../audio/sound'
import { useGame } from '../store/gameStore'
import { useSettings } from '../store/settingsStore'

export function SoundToggle({ className = '' }: { className?: string }) {
  const soundEnabled = useSettings((s) => s.soundEnabled)
  const toggleSound = useSettings((s) => s.toggleSound)
  return (
    <button
      onClick={() => {
        sound.unlock()
        toggleSound()
      }}
      className={`grid h-9 w-9 place-items-center rounded-full border border-white/12 bg-white/[0.06] text-sm transition hover:bg-white/[0.12] ${className}`}
      aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
      title={soundEnabled ? 'Sound on' : 'Sound off'}
    >
      {soundEnabled ? '🔊' : '🔇'}
    </button>
  )
}

export function TopBar({
  left,
  center,
  right,
}: {
  left?: ReactNode
  center?: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="safe-top sticky top-0 z-40 w-full border-b border-white/[0.07] bg-ink-950/80 px-3 pb-3 backdrop-blur-xl sm:px-5">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">{left}</div>
        <div className="flex min-w-0 flex-1 items-center justify-center">{center}</div>
        <div className="flex items-center gap-2">{right}</div>
      </div>
    </div>
  )
}

export function PhaseBadge({ phase, round }: { phase: string; round: number }) {
  const map: Record<string, { label: string; icon: string; color: string }> = {
    night: { label: 'Night', icon: '🌙', color: '#a78bfa' },
    day: { label: 'Day', icon: '☀️', color: '#f5c518' },
    vote: { label: 'Voting', icon: '🗳️', color: '#e50914' },
    verdict: { label: 'Verdict', icon: '⚖️', color: '#ff8792' },
    reveal: { label: 'Casting', icon: '🎭', color: '#7dd3fc' },
    gameover: { label: 'Wrap', icon: '🎉', color: '#f5c518' },
  }
  const meta = map[phase] ?? { label: phase, icon: '🎬', color: '#f5c518' }
  return (
    <motion.div
      key={phase + round}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 rounded-full border px-3 py-1.5"
      style={{ borderColor: `${meta.color}44`, background: `${meta.color}12` }}
    >
      <span className="text-sm leading-none">{meta.icon}</span>
      <span
        className="font-display text-sm leading-none tracking-widest"
        style={{ color: meta.color }}
      >
        {meta.label} {round > 0 ? round : ''}
      </span>
    </motion.div>
  )
}

export function BackHomeButton() {
  const resetToLanding = useGame((s) => s.resetToLanding)
  return (
    <button
      onClick={() => {
        if (window.confirm('Leave the shoot? Progress in this game will be lost.')) resetToLanding()
      }}
      className="grid h-9 w-9 place-items-center rounded-full border border-white/12 bg-white/[0.06] text-sm transition hover:bg-white/[0.12]"
      aria-label="Back to menu"
      title="Back to menu"
    >
      🏠
    </button>
  )
}

export function Logo({ small }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={small ? 'text-lg' : 'text-2xl'}>🎬</span>
      <div className="leading-none">
        <p
          className={`font-display tracking-cine text-gold ${small ? 'text-sm' : 'text-lg'}`}
        >
          BOLLYWOOD
        </p>
        <p
          className={`font-display tracking-cine text-crimson-400 ${small ? 'text-[11px]' : 'text-sm'}`}
        >
          MAFIA
        </p>
      </div>
    </div>
  )
}
