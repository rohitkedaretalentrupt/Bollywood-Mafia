import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import type { ChatMessage, ChatTone } from '../types/game'

const TONE_STYLE: Record<ChatTone, { border: string; bg: string; tag: string; label: string }> = {
  accuse: {
    border: 'border-crimson-400/35',
    bg: 'bg-crimson-900/20',
    tag: 'text-crimson-300',
    label: 'accuses',
  },
  defend: {
    border: 'border-sky-400/30',
    bg: 'bg-sky-500/10',
    tag: 'text-sky-300',
    label: 'defends',
  },
  claim: {
    border: 'border-gold-400/40',
    bg: 'bg-gold-400/10',
    tag: 'text-gold-300',
    label: 'claims',
  },
  observe: {
    border: 'border-white/10',
    bg: 'bg-white/[0.04]',
    tag: 'text-gold-100/45',
    label: 'says',
  },
  joke: {
    border: 'border-fuchsia-400/25',
    bg: 'bg-fuchsia-500/[0.08]',
    tag: 'text-fuchsia-300',
    label: 'jokes',
  },
  system: {
    border: 'border-gold-400/30',
    bg: 'bg-ink-800/70',
    tag: 'text-gold-300',
    label: '',
  },
}

export function ChatFeed({
  messages,
  className = '',
  emptyLabel = 'The set is silent…',
}: {
  messages: ChatMessage[]
  className?: string
  emptyLabel?: string
}) {
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  return (
    <div
      className={`no-scrollbar flex flex-col gap-2 overflow-y-auto overscroll-contain ${className}`}
    >
      {messages.length === 0 ? (
        <p className="py-8 text-center text-xs uppercase tracking-cine text-gold-100/30">
          {emptyLabel}
        </p>
      ) : null}

      <AnimatePresence initial={false}>
        {messages.map((m) => {
          const style = TONE_STYLE[m.tone]
          if (m.tone === 'system') {
            return (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-auto max-w-[92%] rounded-2xl border border-gold-400/30 bg-ink-800/80 px-3 py-2 text-center"
              >
                <p className="text-[11px] font-bold uppercase tracking-widest text-gold-300">
                  📣 {m.text}
                </p>
              </motion.div>
            )
          }
          return (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className={`flex items-start gap-2.5 rounded-2xl border px-3 py-2.5 ${style.border} ${style.bg}`}
            >
              <span className="mt-px grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-ink-800 text-base">
                {m.avatar}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline gap-1.5 leading-none">
                  <span className="truncate text-xs font-extrabold text-gold-100/95">
                    {m.playerName}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-widest ${style.tag}`}
                  >
                    {style.label}
                  </span>
                </p>
                <p className="mt-1 break-words text-[13px] leading-snug text-gold-100/80">
                  {m.text}
                </p>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
      <div ref={endRef} />
    </div>
  )
}

export function TypingIndicator({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-gold-300/70"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.16 }}
        />
      ))}
      <span className="ml-1 text-[10px] uppercase tracking-cine text-gold-100/35">
        the crew is arguing
      </span>
    </div>
  )
}
