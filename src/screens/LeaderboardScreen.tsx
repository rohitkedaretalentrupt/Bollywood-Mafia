import { motion } from 'framer-motion'
import { Particles, StageBackdrop } from '../components/effects/Ambient'
import { Logo, SoundToggle, TopBar } from '../components/TopBar'
import { Button } from '../components/ui/Button'
import { FadeIn, Panel, SectionTitle } from '../components/ui/Panel'
import { useGame } from '../store/gameStore'
import { useLeaderboard } from '../store/leaderboardStore'

const MEDALS = ['🥇', '🥈', '🥉']

export function LeaderboardScreen() {
  const entries = useLeaderboard((s) => s.entries)
  const clear = useLeaderboard((s) => s.clear)
  const goto = useGame((s) => s.goto)
  const winner = useGame((s) => s.winner)

  const back = () => goto(winner ? 'gameover' : 'landing')

  return (
    <div className="relative min-h-full">
      <StageBackdrop mood="gold" />
      <Particles density={0.7} />

      <TopBar
        left={
          <button onClick={back}>
            <span className="grid h-9 w-9 place-items-center rounded-full border border-white/12 bg-white/[0.06] text-sm">
              ←
            </span>
          </button>
        }
        center={<Logo small />}
        right={<SoundToggle />}
      />

      <div className="relative z-10 mx-auto w-full max-w-xl px-4 py-6 safe-bottom">
        <FadeIn>
          <div className="mb-5 text-center">
            <motion.div
              className="text-6xl"
              animate={{ rotate: [-6, 6, -6] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              🏆
            </motion.div>
            <h1 className="mt-3 font-display text-4xl leading-none tracking-wide text-gold-anim sm:text-5xl">
              HALL OF FAME
            </h1>
            <p className="mt-2 text-[11px] uppercase tracking-cine text-gold-100/35">
              Saved on this device
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Panel>
            <SectionTitle
              kicker={`${entries.length} ${entries.length === 1 ? 'player' : 'players'}`}
              title="Standings"
              right={
                entries.length > 0 ? (
                  <button
                    onClick={() => {
                      if (window.confirm('Erase every score on this device?')) clear()
                    }}
                    className="text-[10px] font-bold uppercase tracking-cine text-crimson-400/70 transition hover:text-crimson-300"
                  >
                    Reset
                  </button>
                ) : null
              }
            />

            {entries.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-4xl">🎞️</p>
                <p className="mt-3 text-sm leading-snug text-gold-100/50">
                  No films in the can yet. Finish a game and your record shows up here.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="grid grid-cols-[2rem_1fr_2.4rem_2.4rem_3.2rem] gap-2 px-3 pb-1 text-[9px] font-bold uppercase tracking-cine text-gold-100/30">
                  <span>#</span>
                  <span>Player</span>
                  <span className="text-center">W</span>
                  <span className="text-center">L</span>
                  <span className="text-right">Best</span>
                </div>
                {entries.map((e, i) => (
                  <motion.div
                    key={e.name + i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.5) }}
                    className={[
                      'grid grid-cols-[2rem_1fr_2.4rem_2.4rem_3.2rem] items-center gap-2 rounded-2xl border px-3 py-2.5',
                      i === 0
                        ? 'border-gold-400/50 bg-gold-400/[0.1]'
                        : 'border-white/10 bg-white/[0.04]',
                    ].join(' ')}
                  >
                    <span className="font-display text-lg leading-none text-gold-100/60">
                      {MEDALS[i] ?? i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-gold-100/95">{e.name}</p>
                      <p className="text-[9px] uppercase tracking-wider text-gold-100/35">
                        {e.games} {e.games === 1 ? 'game' : 'games'}
                        {e.villainWins > 0 ? ` · 😈 ${e.villainWins}` : ''}
                      </p>
                    </div>
                    <span className="text-center font-display text-lg leading-none text-gold-300">
                      {e.wins}
                    </span>
                    <span className="text-center font-display text-lg leading-none text-crimson-400/80">
                      {e.losses}
                    </span>
                    <span className="text-right font-display text-lg leading-none text-gold">
                      {e.highScore}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </Panel>
        </FadeIn>

        <FadeIn delay={0.2} className="mt-5">
          <Button variant="gold" size="lg" full onClick={back}>
            {winner ? 'Back to the wrap party' : 'Back to the marquee'}
          </Button>
          <p className="mt-3 text-center text-[9px] uppercase tracking-cine text-gold-100/20">
            Scores live in this browser only — nothing leaves your device
          </p>
        </FadeIn>
      </div>
    </div>
  )
}
