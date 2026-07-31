import { motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { playSfx } from '../audio/sound'
import { ROLES } from '../data'
import type { Player, Role } from '../types/game'

/**
 * The signature card-flip reveal. Back of the card is a gold clapperboard;
 * the face carries the role, its ability and (for villains) the other villains.
 */
export function RoleCard({
  role,
  allies = [],
  autoFlipDelay = 900,
  onFlipped,
}: {
  role: Role
  allies?: Player[]
  autoFlipDelay?: number
  onFlipped?: () => void
}) {
  const [flipped, setFlipped] = useState(false)
  const flippedRef = useRef(false)
  const onFlippedRef = useRef(onFlipped)
  onFlippedRef.current = onFlipped

  const flip = useCallback(() => {
    if (flippedRef.current) return
    flippedRef.current = true
    setFlipped(true)
    playSfx('reveal')
    onFlippedRef.current?.()
  }, [])

  useEffect(() => {
    if (autoFlipDelay < 0) return
    const id = window.setTimeout(flip, autoFlipDelay + 500)
    return () => window.clearTimeout(id)
  }, [autoFlipDelay, flip])

  return (
    <div className="mx-auto w-full max-w-sm" style={{ perspective: 1400 }}>
      <motion.div
        className="preserve-3d relative aspect-[3/4.15] w-full cursor-pointer"
        initial={{ rotateY: 180, scale: 0.9, opacity: 0 }}
        animate={{
          rotateY: flipped ? 0 : 180,
          scale: 1,
          opacity: 1,
        }}
        transition={{
          rotateY: { type: 'spring', stiffness: 90, damping: 15 },
          default: { duration: 0.5 },
        }}
        onClick={flip}
      >
        {/* Face */}
        <div
          className="backface-hidden absolute inset-0 overflow-hidden rounded-[28px] border-2 p-5"
          style={{
            borderColor: `${role.accent}66`,
            background: `radial-gradient(120% 80% at 50% 0%, ${role.accent}26 0%, rgba(10,7,16,0.98) 58%)`,
            boxShadow: `0 0 60px -18px ${role.accent}88, inset 0 1px 0 rgba(255,255,255,0.08)`,
          }}
        >
          <div className="flex h-full flex-col items-center justify-between text-center">
            <div className="w-full">
              <p className="text-[10px] font-bold uppercase tracking-cine text-gold-100/45">
                Your secret role
              </p>
              <div className="hairline my-2.5" />
            </div>

            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={flipped ? { scale: 1, opacity: 1 } : {}}
              transition={{ delay: 0.28, type: 'spring', stiffness: 260, damping: 16 }}
              className="text-[68px] leading-none drop-shadow-[0_6px_24px_rgba(0,0,0,0.7)] sm:text-[80px]"
            >
              {role.emoji}
            </motion.div>

            <div>
              <h2
                className="font-display text-4xl leading-none tracking-wide sm:text-5xl"
                style={{ color: role.accent }}
              >
                {role.name}
              </h2>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-gold-100/50">
                {role.tagline}
              </p>
            </div>

            <div className="w-full space-y-2.5">
              <p className="text-[12px] leading-snug text-gold-100/70">{role.description}</p>
              <div
                className="rounded-2xl border px-3 py-2.5 text-[12px] font-semibold leading-snug"
                style={{
                  borderColor: `${role.accent}44`,
                  background: `${role.accent}12`,
                  color: '#fff8e1',
                }}
              >
                <span className="mr-1">⚡</span>
                {role.ability}
              </div>

              {allies.length > 0 ? (
                <div className="rounded-2xl border border-crimson-400/40 bg-crimson-900/40 px-3 py-2">
                  <p className="text-[9px] font-bold uppercase tracking-cine text-crimson-300">
                    Your accomplices
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">
                    {allies.map((a) => `${a.avatar} ${a.name}`).join('  ·  ')}
                  </p>
                </div>
              ) : (
                <p className="text-[10px] font-bold uppercase tracking-cine text-gold-100/30">
                  Team {role.team === 'villain' ? 'Sabotage' : 'Studio'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Back */}
        <div
          className="backface-hidden absolute inset-0 grid place-items-center overflow-hidden rounded-[28px] border-2 border-gold-400/50"
          style={{
            transform: 'rotateY(180deg)',
            background:
              'repeating-linear-gradient(135deg, #0a0710 0px, #0a0710 12px, #140f20 12px, #140f20 24px)',
            boxShadow: '0 0 60px -18px rgba(245,197,24,0.6)',
          }}
        >
          <div className="text-center">
            <div className="animate-float text-6xl">🎬</div>
            <p className="mt-3 font-display text-2xl tracking-cine text-gold">BOLLYWOOD</p>
            <p className="font-display text-3xl tracking-cine text-crimson-400">MAFIA</p>
            <p className="mt-4 animate-pulse text-[10px] font-bold uppercase tracking-cine text-gold-100/50">
              Tap to reveal
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export function RoleChip({ roleId, size = 'md' }: { roleId: keyof typeof ROLES; size?: 'sm' | 'md' }) {
  const role = ROLES[roleId]
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full border font-bold uppercase tracking-wider',
        size === 'sm' ? 'px-1.5 py-px text-[9px]' : 'px-2.5 py-1 text-[10px]',
      ].join(' ')}
      style={{
        borderColor: `${role.accent}55`,
        color: role.accent,
        background: `${role.accent}14`,
      }}
    >
      {role.emoji} {role.name}
    </span>
  )
}
