import { motion } from 'framer-motion'
import { Particles, StageBackdrop } from '../components/effects/Ambient'
import { IdentityForm } from '../components/IdentityForm'
import { Logo, SoundToggle, TopBar } from '../components/TopBar'
import { FadeIn, Panel, SectionTitle } from '../components/ui/Panel'
import { useGame } from '../store/gameStore'
import { useSettings } from '../store/settingsStore'

export function CreateRoomScreen() {
  const roomCode = useGame((s) => s.roomCode)
  const createRoom = useGame((s) => s.createRoom)
  const resetToLanding = useGame((s) => s.resetToLanding)
  const lastName = useSettings((s) => s.lastName)
  const lastAvatar = useSettings((s) => s.lastAvatar)
  const rememberIdentity = useSettings((s) => s.rememberIdentity)

  return (
    <div className="relative min-h-full">
      <StageBackdrop mood="gold" />
      <Particles density={0.6} />

      <TopBar
        left={
          <button onClick={resetToLanding} className="flex items-center gap-2">
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
          <Panel glow className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-cine text-crimson-400">
              Your room code
            </p>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 16 }}
              className="mt-3 flex justify-center gap-1.5"
            >
              {roomCode.split('').map((digit, i) => (
                <motion.span
                  key={i}
                  initial={{ y: -18, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.07, type: 'spring', stiffness: 300 }}
                  className="grid h-14 w-10 place-items-center rounded-xl border border-gold-400/45 bg-ink-900/80 font-display text-3xl text-gold shadow-gold sm:h-16 sm:w-12 sm:text-4xl"
                >
                  {digit}
                </motion.span>
              ))}
            </motion.div>
            <p className="mx-auto mt-4 max-w-[32ch] text-xs leading-snug text-gold-100/55">
              Read this out to everyone in the room. They each tap{' '}
              <b className="text-gold-300">Join Room</b> on this device and enter the code.
            </p>
          </Panel>
        </FadeIn>

        <FadeIn delay={0.12} className="mt-5">
          <Panel>
            <SectionTitle kicker="Step 1" title="Who are you?" />
            <IdentityForm
              initialName={lastName}
              initialAvatar={lastAvatar}
              submitLabel="Open the lobby"
              onSubmit={(name, avatar) => {
                rememberIdentity(name, avatar)
                createRoom(name, avatar)
              }}
            />
          </Panel>
        </FadeIn>

        <FadeIn delay={0.2} className="mt-4">
          <p className="text-center text-[10px] leading-relaxed uppercase tracking-cine text-gold-100/25">
            As host you can add AI actors to fill the set
          </p>
        </FadeIn>
      </div>
    </div>
  )
}
