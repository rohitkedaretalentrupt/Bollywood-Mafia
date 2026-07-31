import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { playSfx } from '../audio/sound'
import { Particles, StageBackdrop } from '../components/effects/Ambient'
import { IdentityForm } from '../components/IdentityForm'
import { Logo, SoundToggle, TopBar } from '../components/TopBar'
import { Button } from '../components/ui/Button'
import { FadeIn, Panel, SectionTitle } from '../components/ui/Panel'
import { useGame } from '../store/gameStore'
import { listOpenRooms, subscribeRooms, type StoredRoom } from '../store/rooms'
import { useSettings } from '../store/settingsStore'

export function JoinRoomScreen() {
  const joinRoom = useGame((s) => s.joinRoom)
  const joinError = useGame((s) => s.joinError)
  const clearJoinError = useGame((s) => s.clearJoinError)
  const resetToLanding = useGame((s) => s.resetToLanding)
  const openCreateRoom = useGame((s) => s.openCreateRoom)
  const lastName = useSettings((s) => s.lastName)
  const lastAvatar = useSettings((s) => s.lastAvatar)
  const rememberIdentity = useSettings((s) => s.rememberIdentity)

  const [code, setCode] = useState('')
  const [rooms, setRooms] = useState<StoredRoom[]>([])

  useEffect(() => {
    const refresh = () => setRooms(listOpenRooms())
    refresh()
    return subscribeRooms(refresh)
  }, [])

  const activeRoom = rooms.find((r) => r.code === code)
  const takenNames = activeRoom?.seats.map((s) => s.name) ?? []
  const takenAvatars = activeRoom?.seats.map((s) => s.avatar) ?? []
  const codeReady = code.length === 6

  return (
    <div className="relative min-h-full">
      <StageBackdrop mood="night" />
      <Particles density={0.6} />

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
            <SectionTitle kicker="Step 1" title="Enter the room code" />

            <div className="relative">
              <input
                value={code}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setCode(digits)
                  if (joinError) clearJoinError()
                  if (digits.length > 0) playSfx('tick')
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                placeholder="000000"
                aria-label="Room code"
                className="w-full rounded-2xl border border-white/12 bg-white/[0.05] py-5 text-center font-display text-4xl tracking-[0.42em] text-gold outline-none transition placeholder:text-gold-100/15 focus:border-gold-400/60 focus:bg-white/[0.08] sm:text-5xl"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 w-6 rounded-full transition-colors ${
                      i < code.length ? 'bg-gold-400' : 'bg-white/12'
                    }`}
                  />
                ))}
              </div>
            </div>

            {joinError ? (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-xl border border-crimson-400/40 bg-crimson-900/30 px-3 py-2 text-[12px] font-semibold leading-snug text-crimson-300"
              >
                {joinError}
              </motion.p>
            ) : null}

            {rooms.length > 0 ? (
              <div className="mt-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-cine text-gold-100/45">
                  Open rooms on this device
                </p>
                <div className="flex flex-wrap gap-2">
                  {rooms.map((r) => (
                    <button
                      key={r.code}
                      onClick={() => {
                        setCode(r.code)
                        clearJoinError()
                        playSfx('select')
                      }}
                      className={[
                        'rounded-xl border px-3 py-2 text-left transition',
                        r.code === code
                          ? 'border-gold-400/70 bg-gold-400/15'
                          : 'border-white/12 bg-white/[0.05] hover:bg-white/[0.1]',
                      ].join(' ')}
                    >
                      <p className="font-display text-lg leading-none tracking-widest text-gold">
                        {r.code}
                      </p>
                      <p className="mt-0.5 text-[9px] uppercase tracking-wider text-gold-100/45">
                        {r.hostName}'s set · {r.seats.length} seated
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5 text-[11px] leading-snug text-gold-100/45">
                No open rooms found in this browser yet. Party mode is pass-and-play — the host
                creates the room on <b>this</b> device, then each player joins with the code.
              </p>
            )}
          </Panel>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-5">
          <Panel className={codeReady ? '' : 'opacity-45'}>
            <SectionTitle kicker="Step 2" title="Claim your seat" />
            {/* Remount when the room changes so the avatar picker re-picks a free emoji. */}
            <IdentityForm
              key={activeRoom?.code ?? 'none'}
              initialName={lastName}
              initialAvatar={lastAvatar}
              taken={takenNames}
              takenAvatars={takenAvatars}
              disabled={!codeReady}
              submitLabel={codeReady ? 'Join the set' : 'Enter a 6-digit code first'}
              onSubmit={(name, avatar) => {
                if (!codeReady) return
                rememberIdentity(name, avatar)
                joinRoom(code, name, avatar)
              }}
            />
          </Panel>
        </FadeIn>

        <FadeIn delay={0.18} className="mt-5 text-center">
          <p className="mb-2 text-[11px] text-gold-100/40">No code? Start your own shoot.</p>
          <Button variant="outline" size="sm" onClick={openCreateRoom}>
            🎥 Create a room instead
          </Button>
        </FadeIn>
      </div>
    </div>
  )
}
