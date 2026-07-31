import { motion } from 'framer-motion'
import { Particles, StageBackdrop } from '../components/effects/Ambient'
import { IdentityForm } from '../components/IdentityForm'
import { RoleChip } from '../components/RoleCard'
import { Logo, SoundToggle, TopBar } from '../components/TopBar'
import { FadeIn, Panel, SectionTitle } from '../components/ui/Panel'
import { MAX_PLAYERS, MIN_PLAYERS, buildRoleDeck, villainCountFor } from '../data'
import { useGame } from '../store/gameStore'
import { useSettings } from '../store/settingsStore'
import type { RoleId } from '../types/game'

export function SoloSetupScreen() {
  const soloPlayerCount = useGame((s) => s.soloPlayerCount)
  const setSoloPlayerCount = useGame((s) => s.setSoloPlayerCount)
  const startSolo = useGame((s) => s.startSolo)
  const resetToLanding = useGame((s) => s.resetToLanding)
  const lastName = useSettings((s) => s.lastName)
  const lastAvatar = useSettings((s) => s.lastAvatar)
  const rememberIdentity = useSettings((s) => s.rememberIdentity)

  const deck = buildRoleDeck(soloPlayerCount)
  const counts = deck.reduce<Record<string, number>>((acc, role) => {
    acc[role] = (acc[role] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="relative min-h-full">
      <StageBackdrop mood="night" />
      <Particles density={0.7} />

      <TopBar
        left={
          <button onClick={resetToLanding}>
            <span className="grid h-9 w-9 place-items-center rounded-full border border-white/12 bg-white/[0.06] text-sm">
              ←
            </span>
          </button>
        }
        center={<Logo small />}
        right={<SoundToggle />}
      />

      <div className="relative z-10 mx-auto w-full max-w-md px-4 py-6 safe-bottom">
        <FadeIn>
          <Panel>
            <SectionTitle kicker="Solo mode" title="You vs the cast" />
            <p className="mb-5 text-[13px] leading-snug text-gold-100/60">
              Every other seat is an AI actor with its own personality, memory and agenda. They
              read the clue log, hold grudges, bandwagon, lie for their team and vote for real.
            </p>

            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-cine text-gold-100/50">
                  Cast size
                </p>
                <p className="font-display text-2xl leading-none text-gold">{soloPlayerCount}</p>
              </div>
              <input
                type="range"
                min={MIN_PLAYERS}
                max={MAX_PLAYERS}
                step={1}
                value={soloPlayerCount}
                onChange={(e) => setSoloPlayerCount(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-gold-400"
                style={{ accentColor: '#f5c518' }}
                aria-label="Number of players"
              />
              <div className="mt-1.5 flex justify-between text-[9px] uppercase tracking-cine text-gold-100/30">
                <span>{MIN_PLAYERS} tight</span>
                <span>{MAX_PLAYERS} chaos</span>
              </div>
              <p className="mt-3 rounded-xl border border-crimson-400/30 bg-crimson-900/25 px-3 py-2 text-[12px] font-semibold text-crimson-200">
                😈 {villainCountFor(soloPlayerCount)}{' '}
                {villainCountFor(soloPlayerCount) === 1 ? 'villain' : 'villains'} hiding in a cast of{' '}
                {soloPlayerCount}
              </p>
            </div>

            <div className="mb-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-cine text-gold-100/50">
                Roles in play
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(counts).map(([role, n]) => (
                  <motion.span key={role} layout className="inline-flex items-center gap-1">
                    <RoleChip roleId={role as RoleId} size="sm" />
                    {n > 1 ? (
                      <span className="text-[10px] font-bold text-gold-100/45">×{n}</span>
                    ) : null}
                  </motion.span>
                ))}
              </div>
            </div>

            <IdentityForm
              initialName={lastName}
              initialAvatar={lastAvatar}
              submitLabel="Roll camera 🎬"
              onSubmit={(name, avatar) => {
                rememberIdentity(name, avatar)
                startSolo(name, avatar)
              }}
            />
          </Panel>
        </FadeIn>

        <FadeIn delay={0.14} className="mt-4">
          <p className="text-center text-[10px] leading-relaxed uppercase tracking-cine text-gold-100/25">
            Your role is dealt honestly — you might be the villain
          </p>
        </FadeIn>
      </div>
    </div>
  )
}
