import { motion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { Confetti, FlashBurst } from '../components/effects/Confetti'
import { StageBackdrop } from '../components/effects/Ambient'
import { RoleChip } from '../components/RoleCard'
import { SoundToggle, TopBar } from '../components/TopBar'
import { Button } from '../components/ui/Button'
import { Panel } from '../components/ui/Panel'
import { ROLES } from '../data'
import { useGame } from '../store/gameStore'

export function VerdictScreen() {
  const players = useGame((s) => s.players)
  const verdict = useGame((s) => s.lastVerdict)
  const round = useGame((s) => s.round)
  const maxRounds = useGame((s) => s.maxRounds)
  const continueAfterVerdict = useGame((s) => s.continueAfterVerdict)

  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setRevealed(true), 1300)
    return () => window.clearTimeout(id)
  }, [])

  const eliminated = players.find((p) => p.id === verdict?.eliminatedId) ?? null
  const caughtVillain = !!verdict?.wasVillain
  const aliveVillains = players.filter((p) => p.alive && p.role === 'villain').length
  const aliveTotal = players.filter((p) => p.alive).length

  return (
    <div className="relative min-h-full overflow-hidden">
      <StageBackdrop mood={caughtVillain ? 'gold' : 'red'} />
      <Confetti active={revealed && caughtVillain} pieces={60} />
      {revealed ? <FlashBurst trigger={round} color={caughtVillain ? '#f5c518' : '#e50914'} /> : null}

      <TopBar center={null} right={<SoundToggle />} />

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-5 py-8 safe-bottom">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-cine text-crimson-400">
            Day {round} verdict
          </p>
          <h1 className="mt-1 font-display text-4xl leading-none tracking-wide text-gold sm:text-5xl">
            {verdict?.tie ? 'DEADLOCKED' : 'YOU ARE FIRED'}
          </h1>
        </motion.div>

        {verdict?.tie || !eliminated ? (
          <Panel className="mt-6 text-center">
            <div className="text-6xl">🤷</div>
            <p className="mt-4 text-sm leading-snug text-gold-100/70">
              The producers split down the middle. Nobody leaves the set today — and the villain
              gets another night.
            </p>
          </Panel>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 180, damping: 18 }}
            className="mt-6"
          >
            <Panel glow={caughtVillain}>
              <div className="flex flex-col items-center text-center">
                <motion.div
                  className="grid h-24 w-24 place-items-center rounded-full border-2 text-5xl"
                  style={{
                    borderColor: caughtVillain ? '#e50914' : 'rgba(255,255,255,0.15)',
                    background: caughtVillain ? 'rgba(229,9,20,0.14)' : 'rgba(255,255,255,0.04)',
                  }}
                  animate={{ rotate: [0, -6, 6, 0] }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                >
                  {eliminated.avatar}
                </motion.div>

                <h2 className="mt-4 font-display text-3xl leading-none tracking-wide text-gold-100">
                  {eliminated.name}
                </h2>

                <motion.div
                  initial={{ opacity: 0, rotateX: -90 }}
                  animate={revealed ? { opacity: 1, rotateX: 0 } : {}}
                  transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                  className="mt-4"
                >
                  {revealed ? (
                    <div className="space-y-3">
                      <RoleChip roleId={eliminated.role} />
                      <p
                        className="font-display text-2xl leading-none tracking-wide"
                        style={{ color: caughtVillain ? '#ff4d5e' : '#f5c518' }}
                      >
                        {caughtVillain ? 'THE VILLAIN IS OUT! 🎉' : 'AN INNOCENT IS GONE 💔'}
                      </p>
                      <p className="text-[13px] leading-snug text-gold-100/65">
                        {caughtVillain
                          ? `${eliminated.name} was sabotaging the picture all along. ${
                              aliveVillains > 0
                                ? `But ${aliveVillains} more ${aliveVillains === 1 ? 'villain is' : 'villains are'} still on set.`
                                : ''
                            }`
                          : `${eliminated.name} was the ${ROLES[eliminated.role].name}. The villain is still out there, and the crew just got smaller.`}
                      </p>
                    </div>
                  ) : (
                    <p className="animate-pulse text-[11px] font-bold uppercase tracking-cine text-gold-100/40">
                      Unsealing the contract…
                    </p>
                  )}
                </motion.div>
              </div>
            </Panel>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: revealed ? 1 : 0.3 }}
          className="mt-5"
        >
          <div className="mb-4 grid grid-cols-3 gap-2">
            <MiniStat label="Still on set" value={aliveTotal} />
            <MiniStat label="Days left" value={Math.max(0, maxRounds - round)} />
            <MiniStat
              label="Villains left"
              value={aliveVillains > 0 ? '😈'.repeat(aliveVillains) : '—'}
            />
          </div>

          <Button
            variant="gold"
            size="lg"
            full
            disabled={!revealed}
            onClick={continueAfterVerdict}
          >
            🌙 Night falls again
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="glass rounded-2xl px-2 py-2 text-center">
      <p className="text-[8px] font-bold uppercase tracking-cine text-gold-100/40">{label}</p>
      <p className="font-display text-lg leading-tight text-gold">{value}</p>
    </div>
  )
}
