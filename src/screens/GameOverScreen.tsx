import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { Confetti } from '../components/effects/Confetti'
import { Particles, Spotlights, StageBackdrop } from '../components/effects/Ambient'
import { RoleChip } from '../components/RoleCard'
import { SoundToggle } from '../components/TopBar'
import { Button } from '../components/ui/Button'
import { Marquee, Panel } from '../components/ui/Panel'
import { ROLES } from '../data'
import { useGame, ownerPlayer } from '../store/gameStore'
import { winnerLabel } from '../engine/winner'

export function GameOverScreen() {
  const players = useGame((s) => s.players)
  const winner = useGame((s) => s.winner)
  const endReason = useGame((s) => s.endReason)
  const round = useGame((s) => s.round)
  const playAgain = useGame((s) => s.playAgain)
  const resetToLanding = useGame((s) => s.resetToLanding)
  const goto = useGame((s) => s.goto)
  const you = useGame(ownerPlayer)

  const label = winner ? winnerLabel(winner) : null
  const youWon = !!you && winner === (you.role === 'villain' ? 'villain' : 'studio')

  const scoreboard = useMemo(
    () => players.slice().sort((a, b) => b.score - a.score),
    [players],
  )
  const villains = players.filter((p) => p.role === 'villain')

  return (
    <div className="relative min-h-full overflow-hidden">
      <StageBackdrop mood={winner === 'studio' ? 'gold' : 'red'} />
      <Spotlights intensity={winner === 'studio' ? 1.2 : 0.7} />
      <Particles density={1} />
      <Confetti active={youWon} />

      <div className="absolute right-3 top-3 z-30">
        <SoundToggle />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 py-8 safe-bottom">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <Marquee count={9} />
          <motion.div
            className="mt-5 text-7xl"
            animate={{ scale: [1, 1.12, 1], rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          >
            {label?.emoji ?? '🎬'}
          </motion.div>
          <h1
            className="mt-3 font-display text-[11vw] leading-[0.88] tracking-tight sm:text-6xl"
            style={{
              color: winner === 'studio' ? '#f5c518' : '#e50914',
              textShadow: `0 0 40px ${winner === 'studio' ? 'rgba(245,197,24,0.5)' : 'rgba(229,9,20,0.6)'}`,
            }}
          >
            {label?.title ?? 'THAT IS A WRAP'}
          </h1>
          <p className="mx-auto mt-3 max-w-[36ch] text-sm leading-snug text-gold-100/65">
            {endReason ?? label?.subtitle}
          </p>

          {you ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className={[
                'mx-auto mt-5 inline-flex items-center gap-3 rounded-2xl border px-4 py-2.5',
                youWon
                  ? 'border-gold-400/50 bg-gold-400/[0.12]'
                  : 'border-crimson-400/40 bg-crimson-900/30',
              ].join(' ')}
            >
              <span className="text-2xl">{you.avatar}</span>
              <div className="text-left">
                <p className="font-display text-lg leading-none text-gold-100">
                  {youWon ? 'You win' : 'You lose'}
                </p>
                <p className="text-[10px] uppercase tracking-cine text-gold-100/45">
                  {ROLES[you.role].name} · {you.score} pts
                </p>
              </div>
            </motion.div>
          ) : null}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-7"
        >
          <Panel>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-cine text-crimson-400">
              The villains were
            </p>
            <div className="flex flex-wrap gap-2">
              {villains.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-2 rounded-2xl border border-crimson-400/40 bg-crimson-900/30 px-3 py-2"
                >
                  <span className="text-xl">{v.avatar}</span>
                  <div>
                    <p className="text-sm font-extrabold leading-none text-white">{v.name}</p>
                    <p className="text-[9px] uppercase tracking-wider text-crimson-300/70">
                      {v.alive ? 'survived' : `out on ${v.eliminatedBy === 'vote' ? 'a vote' : `night ${v.eliminatedRound}`}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-4"
        >
          <Panel>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-cine text-gold-100/45">
                Final scoreboard
              </p>
              <p className="text-[10px] font-bold uppercase tracking-cine text-gold-100/30">
                {round} {round === 1 ? 'day' : 'days'} of shooting
              </p>
            </div>

            <div className="space-y-1.5">
              {scoreboard.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className={[
                    'flex items-center gap-2.5 rounded-2xl border px-3 py-2',
                    p.id === you?.id
                      ? 'border-gold-400/50 bg-gold-400/[0.1]'
                      : 'border-white/10 bg-white/[0.04]',
                  ].join(' ')}
                >
                  <span className="w-5 shrink-0 font-display text-lg leading-none text-gold-100/40">
                    {i + 1}
                  </span>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/12 bg-ink-800 text-lg">
                    {p.avatar}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-bold text-gold-100/95">
                      {p.name}
                      {p.isBot ? (
                        <span className="rounded bg-white/10 px-1 text-[8px] font-bold uppercase text-gold-100/50">
                          AI
                        </span>
                      ) : null}
                    </p>
                    <div className="mt-0.5">
                      <RoleChip roleId={p.role} size="sm" />
                    </div>
                  </div>
                  <span className="font-display text-xl leading-none text-gold">{p.score}</span>
                </motion.div>
              ))}
            </div>
          </Panel>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 space-y-2.5"
        >
          <Button variant="primary" size="lg" full icon="🎬" onClick={playAgain}>
            Shoot another film
          </Button>
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="ghost" onClick={() => goto('leaderboard')}>
              🏆 Leaderboard
            </Button>
            <Button variant="outline" onClick={resetToLanding}>
              🏠 Main menu
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
