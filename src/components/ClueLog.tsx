import { motion } from 'framer-motion'
import type { Clue } from '../types/game'

const STRENGTH: Record<Clue['strength'], { ring: string; label: string; dot: string }> = {
  strong: { ring: 'border-gold-400/45 bg-gold-400/[0.09]', label: 'Hard evidence', dot: '#f5c518' },
  medium: { ring: 'border-sky-400/30 bg-sky-500/[0.07]', label: 'Worth noting', dot: '#7dd3fc' },
  weak: { ring: 'border-white/10 bg-white/[0.035]', label: 'Hearsay', dot: '#a1a1aa' },
}

export function ClueLog({
  clues,
  className = '',
  limit,
}: {
  clues: Clue[]
  className?: string
  limit?: number
}) {
  const shown = limit ? clues.slice(-limit) : clues
  const ordered = shown.slice().reverse()

  return (
    <div className={`no-scrollbar flex flex-col gap-2 overflow-y-auto overscroll-contain ${className}`}>
      {ordered.length === 0 ? (
        <p className="py-6 text-center text-xs uppercase tracking-cine text-gold-100/30">
          No clues on the log yet
        </p>
      ) : null}
      {ordered.map((clue, i) => {
        const s = STRENGTH[clue.strength]
        const isPrivate = clue.visibility === 'private'
        return (
          <motion.div
            key={clue.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.4) }}
            className={`rounded-2xl border px-3 py-2.5 ${isPrivate ? 'border-crimson-400/40 bg-crimson-900/25' : s.ring}`}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-cine text-gold-100/45">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: isPrivate ? '#e50914' : s.dot }}
                />
                {isPrivate ? 'Only you know this' : s.label}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-cine text-gold-100/30">
                Night {clue.round}
              </span>
            </div>
            <p className="flex gap-2 text-[13px] leading-snug text-gold-100/85">
              <span className="shrink-0 text-base leading-tight">{clue.icon}</span>
              <span>{clue.text}</span>
            </p>
          </motion.div>
        )
      })}
    </div>
  )
}
