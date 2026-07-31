import { motion } from 'framer-motion'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { playSfx } from '../../audio/sound'

type Variant = 'primary' | 'gold' | 'ghost' | 'outline' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-crimson-500 to-crimson-700 text-white shadow-crimson border border-crimson-400/40',
  gold: 'bg-gradient-to-b from-gold-300 to-gold-500 text-ink-950 shadow-gold border border-gold-200/60 font-extrabold',
  ghost: 'bg-white/[0.06] text-gold-100 border border-white/10 hover:bg-white/[0.12]',
  outline: 'bg-transparent text-gold-300 border border-gold-400/45 hover:bg-gold-400/10',
  danger: 'bg-gradient-to-b from-crimson-600 to-crimson-900 text-white border border-crimson-400/30',
}

const SIZES: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-xs',
  md: 'px-5 py-3 text-sm',
  lg: 'px-7 py-4 text-base',
}

/**
 * `motion.button` redeclares a handful of DOM props (drag/animation handlers
 * and `style`), so those are omitted here to keep the intersection clean.
 */
type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'style' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'
>

export interface ButtonProps extends NativeButtonProps {
  variant?: Variant
  size?: Size
  full?: boolean
  icon?: ReactNode
  children?: ReactNode
  silent?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  full,
  icon,
  children,
  className = '',
  onClick,
  silent,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.96 }}
      whileHover={disabled ? undefined : { y: -1 }}
      transition={{ type: 'spring', stiffness: 480, damping: 26 }}
      disabled={disabled}
      onClick={(e) => {
        if (!silent) playSfx('click')
        onClick?.(e)
      }}
      className={[
        'btn-sheen relative inline-flex items-center justify-center gap-2 rounded-2xl',
        'font-bold uppercase tracking-[0.14em] transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none',
        'select-none touch-manipulation',
        VARIANTS[variant],
        SIZES[size],
        full ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {icon ? <span className="text-base leading-none">{icon}</span> : null}
      <span className="leading-none">{children}</span>
    </motion.button>
  )
}
