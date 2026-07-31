import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function Panel({
  children,
  className = '',
  glow = false,
}: {
  children: ReactNode
  className?: string
  glow?: boolean
}) {
  return (
    <div
      className={[
        'panel relative overflow-hidden p-5 sm:p-6',
        glow ? 'shadow-gold' : '',
        className,
      ].join(' ')}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />
      {children}
    </div>
  )
}

export function SectionTitle({
  kicker,
  title,
  right,
}: {
  kicker?: string
  title: string
  right?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {kicker ? (
          <p className="mb-1 text-[10px] font-bold uppercase tracking-cine text-crimson-400">
            {kicker}
          </p>
        ) : null}
        <h2 className="font-display text-2xl leading-none tracking-wide text-gold sm:text-3xl">
          {title}
        </h2>
      </div>
      {right}
    </div>
  )
}

export function Marquee({ count = 9 }: { count?: number }) {
  return (
    <div className="marquee">
      {Array.from({ length: count }).map((_, i) => (
        <i key={i} style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
    </div>
  )
}

export function Stat({ label, value, accent }: { label: string; value: ReactNode; accent?: string }) {
  return (
    <div className="glass rounded-2xl px-3 py-2.5 text-center">
      <p className="text-[9px] font-bold uppercase tracking-cine text-gold-100/45">{label}</p>
      <p className="font-display text-xl leading-tight" style={{ color: accent ?? '#f5c518' }}>
        {value}
      </p>
    </div>
  )
}

export function FadeIn({
  children,
  delay = 0,
  y = 14,
  className = '',
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
