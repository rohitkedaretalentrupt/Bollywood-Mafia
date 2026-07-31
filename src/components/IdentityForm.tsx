import { motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { playSfx } from '../audio/sound'
import { AVATARS } from '../data'
import { Button } from './ui/Button'

/** Name + emoji avatar picker, shared by create / join / solo setup. */
export function IdentityForm({
  initialName = '',
  initialAvatar = '🕺',
  taken = [],
  takenAvatars = [],
  submitLabel = 'Continue',
  disabled = false,
  onSubmit,
  children,
}: {
  initialName?: string
  initialAvatar?: string
  taken?: string[]
  /** Avatars already claimed by other seats — locked out so nobody doubles up. */
  takenAvatars?: string[]
  submitLabel?: string
  disabled?: boolean
  onSubmit: (name: string, avatar: string) => void
  children?: ReactNode
}) {
  const [name, setName] = useState(initialName)
  // In pass-and-play the emoji *is* how people find themselves on a card, so a
  // remembered favourite gives way to a free one rather than colliding.
  const [avatar, setAvatar] = useState(
    () =>
      takenAvatars.includes(initialAvatar)
        ? (AVATARS.find((a) => !takenAvatars.includes(a)) ?? initialAvatar)
        : initialAvatar,
  )
  const trimmed = name.trim()
  const nameTaken = taken.some((t) => t.trim().toLowerCase() === trimmed.toLowerCase())
  const valid = trimmed.length >= 2 && !nameTaken && !disabled && !takenAvatars.includes(avatar)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        onSubmit(trimmed, avatar)
      }}
      className="space-y-5"
    >
      <div>
        <label
          htmlFor="player-name"
          className="mb-2 block text-[10px] font-bold uppercase tracking-cine text-gold-100/50"
        >
          Screen name
        </label>
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-gold-400/40 bg-ink-800 text-2xl">
            {avatar}
          </span>
          <input
            id="player-name"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 14))}
            placeholder="e.g. Rohit"
            autoComplete="off"
            autoCapitalize="words"
            spellCheck={false}
            className="h-14 w-full rounded-2xl border border-white/12 bg-white/[0.05] px-4 text-base font-bold text-gold-100 outline-none transition placeholder:font-normal placeholder:text-gold-100/25 focus:border-gold-400/60 focus:bg-white/[0.08]"
          />
        </div>
        {nameTaken ? (
          <p className="mt-2 text-[11px] font-semibold text-crimson-400">
            Somebody on set already answers to that. Pick another.
          </p>
        ) : null}
      </div>

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-cine text-gold-100/50">
          Pick your look
        </p>
        <div className="no-scrollbar grid max-h-[168px] grid-cols-8 gap-1.5 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-2">
          {AVATARS.map((a) => {
            const claimed = takenAvatars.includes(a)
            return (
              <motion.button
                key={a}
                type="button"
                disabled={claimed}
                title={claimed ? 'Already taken' : undefined}
                whileTap={claimed ? undefined : { scale: 0.86 }}
                onClick={() => {
                  if (claimed) return
                  setAvatar(a)
                  playSfx('select')
                }}
                className={[
                  'grid aspect-square place-items-center rounded-xl border text-xl transition',
                  claimed
                    ? 'cursor-not-allowed border-transparent bg-white/[0.02] opacity-25 grayscale'
                    : a === avatar
                      ? 'border-gold-400 bg-gold-400/20 shadow-gold'
                      : 'border-transparent bg-white/[0.04] hover:bg-white/[0.1]',
                ].join(' ')}
              >
                {a}
              </motion.button>
            )
          })}
        </div>
      </div>

      {children}

      <Button type="submit" variant="gold" size="lg" full disabled={!valid}>
        {submitLabel}
      </Button>
      {trimmed.length > 0 && trimmed.length < 2 ? (
        <p className="text-center text-[11px] text-gold-100/40">Two letters minimum, star.</p>
      ) : null}
    </form>
  )
}
