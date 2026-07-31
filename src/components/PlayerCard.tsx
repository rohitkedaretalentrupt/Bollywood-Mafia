import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { ROLES } from '../data'
import type { Player } from '../types/game'

export interface PlayerCardProps {
  player: Player
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  badge?: ReactNode
  /** Reveal the role chip (dead players, your own card, game over). */
  showRole?: boolean
  isYou?: boolean
  /** Small caption under the name — used for vote counts, claims, notes. */
  caption?: string
  compact?: boolean
}

export function PlayerCard({
  player,
  selected,
  disabled,
  onClick,
  badge,
  showRole,
  isYou,
  caption,
  compact,
}: PlayerCardProps) {
  const role = ROLES[player.role]
  const dead = !player.alive
  const interactive = !!onClick && !disabled

  return (
    <motion.button
      type="button"
      onClick={interactive ? onClick : undefined}
      disabled={!interactive}
      whileTap={interactive ? { scale: 0.95 } : undefined}
      layout
      className={[
        'group relative flex w-full flex-col items-center rounded-2xl border px-2 pb-2.5 pt-3 text-center transition-all',
        compact ? 'gap-1' : 'gap-1.5',
        dead
          ? 'border-white/5 bg-white/[0.02] opacity-60'
          : selected
            ? 'border-gold-400/80 bg-gold-400/[0.14] shadow-gold'
            : 'border-white/10 bg-white/[0.05]',
        interactive ? 'cursor-pointer hover:border-gold-400/50 hover:bg-white/[0.09]' : '',
        !interactive && !dead ? 'cursor-default' : '',
      ].join(' ')}
    >
      {badge ? (
        <span className="absolute -right-1.5 -top-1.5 z-10 flex min-w-6 items-center justify-center rounded-full border border-gold-200/60 bg-gradient-to-b from-gold-300 to-gold-500 px-1.5 py-0.5 font-display text-xs text-ink-950 shadow-gold">
          {badge}
        </span>
      ) : null}

      {isYou ? (
        <span className="absolute left-1.5 top-1.5 rounded-md bg-crimson-500/90 px-1.5 py-px text-[8px] font-black uppercase tracking-widest text-white">
          You
        </span>
      ) : null}

      <div className="relative">
        <div
          className={[
            'grid place-items-center rounded-full border-2 transition-all',
            compact ? 'h-11 w-11 text-xl' : 'h-14 w-14 text-2xl sm:h-16 sm:w-16 sm:text-3xl',
            dead
              ? 'border-white/10 bg-ink-800 grayscale'
              : selected
                ? 'border-gold-300 bg-ink-800'
                : 'border-white/15 bg-ink-800 group-hover:border-gold-400/60',
          ].join(' ')}
          style={
            !dead && selected
              ? { boxShadow: '0 0 0 4px rgba(245,197,24,0.18), 0 0 26px rgba(245,197,24,0.35)' }
              : undefined
          }
        >
          <span className="drag-none leading-none">{player.avatar}</span>
        </div>

        {dead ? (
          <span className="pointer-events-none absolute inset-0 grid place-items-center text-2xl">
            <span className="drop-shadow-[0_0_6px_rgba(0,0,0,0.9)]">❌</span>
          </span>
        ) : null}

        {player.isBot ? (
          <span className="absolute -bottom-1 -right-1 rounded-full border border-white/15 bg-ink-900 px-1 text-[8px] font-bold text-gold-200/70">
            AI
          </span>
        ) : null}
      </div>

      <p
        className={[
          'w-full truncate font-bold leading-tight',
          compact ? 'text-[11px]' : 'text-xs sm:text-sm',
          dead ? 'text-gold-100/40 line-through' : 'text-gold-100/95',
        ].join(' ')}
      >
        {player.name}
      </p>

      {showRole ? (
        <span
          className="rounded-full border px-1.5 py-px text-[9px] font-bold uppercase tracking-wider"
          style={{
            borderColor: `${role.accent}55`,
            color: role.accent,
            background: `${role.accent}14`,
          }}
        >
          {role.emoji} {role.name}
        </span>
      ) : player.claimedRole ? (
        <span className="rounded-full border border-white/15 bg-white/5 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-gold-100/55">
          claims {ROLES[player.claimedRole].name}
        </span>
      ) : caption ? (
        <span className="text-[9px] font-semibold uppercase tracking-wider text-gold-100/40">
          {caption}
        </span>
      ) : (
        <span className="text-[9px] text-transparent">·</span>
      )}
    </motion.button>
  )
}
