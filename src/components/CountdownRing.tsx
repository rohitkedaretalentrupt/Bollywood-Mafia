import { motion } from 'framer-motion'

/** Circular countdown. Turns crimson and pulses under ten seconds. */
export function CountdownRing({
  secondsLeft,
  total,
  size = 74,
  label = 'left',
}: {
  secondsLeft: number
  total: number
  size?: number
  label?: string
}) {
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  // The deadline is set a few milliseconds before the first tick, so ceil() can
  // briefly read one over the total. Clamp so a 75-second day never shows 76.
  const shown = Math.max(0, Math.min(secondsLeft, total))
  const progress = total > 0 ? shown / total : 0
  const urgent = shown <= 10
  const color = urgent ? '#e50914' : shown <= 25 ? '#f5c518' : '#d4af37'

  return (
    <motion.div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      animate={urgent ? { scale: [1, 1.07, 1] } : { scale: 1 }}
      transition={urgent ? { duration: 1, repeat: Infinity } : { duration: 0.2 }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          style={{
            transition: 'stroke-dashoffset 0.25s linear, stroke 0.4s ease',
            filter: `drop-shadow(0 0 6px ${color}88)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display text-xl leading-none" style={{ color }}>
          {shown}
        </span>
        <span className="absolute bottom-2.5 text-[7px] font-bold uppercase tracking-cine text-gold-100/40">
          {label}
        </span>
      </div>
    </motion.div>
  )
}

/** Horizontal "movie progress" meter — how close the shoot is to wrapping. */
export function MovieProgress({ round, maxRounds }: { round: number; maxRounds: number }) {
  const pct = Math.min(100, Math.round(((round - 1) / Math.max(1, maxRounds)) * 100))
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-cine text-gold-100/45">
        <span>Shoot progress</span>
        <span>
          Day {Math.max(1, round)} / {maxRounds}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-gold-500 via-gold-300 to-crimson-500"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
