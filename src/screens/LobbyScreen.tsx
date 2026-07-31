import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Particles, StageBackdrop } from '../components/effects/Ambient'
import { IdentityForm } from '../components/IdentityForm'
import { Logo, SoundToggle, TopBar } from '../components/TopBar'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { FadeIn, Panel, SectionTitle, Stat } from '../components/ui/Panel'
import { MAX_PLAYERS, MIN_PLAYERS, villainCountFor } from '../data'
import { useGame } from '../store/gameStore'
import { subscribeRooms } from '../store/rooms'

export function LobbyScreen() {
  const roomCode = useGame((s) => s.roomCode)
  const seats = useGame((s) => s.seats)
  const botCount = useGame((s) => s.botCount)
  const ownerSeatId = useGame((s) => s.ownerSeatId)
  const setBotCount = useGame((s) => s.setBotCount)
  const addLocalSeat = useGame((s) => s.addLocalSeat)
  const removeSeat = useGame((s) => s.removeSeat)
  const beginGame = useGame((s) => s.beginGame)
  const syncSeats = useGame((s) => s.syncSeats)
  const resetToLanding = useGame((s) => s.resetToLanding)

  const [addOpen, setAddOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    syncSeats()
    const unsub = subscribeRooms(syncSeats)
    const id = window.setInterval(syncSeats, 2500)
    return () => {
      unsub()
      window.clearInterval(id)
    }
  }, [syncSeats])

  const humanSeats = seats.filter((s) => !s.isBot)
  const freeSlots = MAX_PLAYERS - humanSeats.length
  const effectiveBots = Math.min(botCount, freeSlots)
  const total = humanSeats.length + effectiveBots
  const canStart = total >= MIN_PLAYERS
  const isHost = humanSeats[0]?.id === ownerSeatId

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="relative min-h-full">
      <StageBackdrop mood="gold" />
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

      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 py-6 safe-bottom">
        <FadeIn>
          <Panel glow>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <div className="text-center sm:text-left">
                <p className="text-[10px] font-bold uppercase tracking-cine text-crimson-400">
                  Room code
                </p>
                <p className="font-display text-5xl leading-none tracking-[0.18em] text-gold">
                  {roomCode}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyCode}>
                  {copied ? '✓ Copied' : '📋 Copy'}
                </Button>
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] leading-snug text-gold-100/50 sm:text-left">
              Read the code out loud. Each player taps <b className="text-gold-300">Join Room</b> on
              this device, or use <b className="text-gold-300">Add player</b> below to seat them
              directly.
            </p>
          </Panel>
        </FadeIn>

        <FadeIn delay={0.08} className="mt-4">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Humans" value={humanSeats.length} />
            <Stat label="AI actors" value={effectiveBots} accent="#7dd3fc" />
            <Stat label="Villains" value={`😈 ${villainCountFor(total)}`} accent="#e50914" />
          </div>
        </FadeIn>

        <FadeIn delay={0.14} className="mt-4">
          <Panel>
            <SectionTitle
              kicker={`${total} on the call sheet`}
              title="The cast"
              right={
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={freeSlots <= 0}
                  onClick={() => setAddOpen(true)}
                >
                  + Add player
                </Button>
              }
            />

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              <AnimatePresence initial={false}>
                {humanSeats.map((seat, i) => (
                  <motion.div
                    key={seat.id}
                    layout
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    className="relative flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.05] px-2 py-3"
                  >
                    {i === 0 ? (
                      <span className="absolute left-1.5 top-1.5 rounded-md bg-gold-400 px-1.5 py-px text-[8px] font-black uppercase tracking-widest text-ink-950">
                        Host
                      </span>
                    ) : null}
                    {seat.id !== ownerSeatId && isHost ? (
                      <button
                        onClick={() => removeSeat(seat.id)}
                        className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full border border-white/15 bg-ink-900/90 text-[10px] text-gold-100/60 transition hover:border-crimson-400/60 hover:text-crimson-300"
                        aria-label={`Remove ${seat.name}`}
                      >
                        ✕
                      </button>
                    ) : null}
                    <span className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-ink-800 text-2xl">
                      {seat.avatar}
                    </span>
                    <p className="w-full truncate text-center text-xs font-bold text-gold-100/90">
                      {seat.name}
                    </p>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-gold-100/35">
                      {seat.id === ownerSeatId ? 'You' : 'Human'}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {Array.from({ length: effectiveBots }).map((_, i) => (
                <motion.div
                  key={`bot-${i}`}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-sky-400/25 bg-sky-500/[0.06] px-2 py-3"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-sky-400/25 bg-ink-800 text-2xl">
                    🤖
                  </span>
                  <p className="text-xs font-bold text-sky-200/70">AI actor</p>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-sky-200/40">
                    Cast on start
                  </span>
                </motion.div>
              ))}
            </div>
          </Panel>
        </FadeIn>

        <FadeIn delay={0.2} className="mt-4">
          <Panel>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-cine text-gold-100/50">
                Fill empty seats with AI
              </p>
              <p className="font-display text-2xl leading-none text-gold">{effectiveBots}</p>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, freeSlots)}
              step={1}
              value={effectiveBots}
              onChange={(e) => setBotCount(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10"
              style={{ accentColor: '#f5c518' }}
              aria-label="Number of AI players"
            />
            <p className="mt-2 text-[11px] leading-snug text-gold-100/45">
              A game needs at least {MIN_PLAYERS} on set. AI actors argue, lie and vote just like
              everyone else.
            </p>
          </Panel>
        </FadeIn>

        <FadeIn delay={0.26} className="mt-5">
          <Button variant="primary" size="lg" full disabled={!canStart} onClick={beginGame}>
            {canStart ? '🎬 Start the shoot' : `Need ${MIN_PLAYERS - total} more on set`}
          </Button>
          <p className="mt-3 text-center text-[10px] uppercase tracking-cine text-gold-100/25">
            Private phases will ask you to pass the device
          </p>
        </FadeIn>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Seat another player">
        <IdentityForm
          key={`add-${humanSeats.length}`}
          initialName=""
          initialAvatar="💃"
          taken={humanSeats.map((s) => s.name)}
          takenAvatars={humanSeats.map((s) => s.avatar)}
          submitLabel="Add to the cast"
          onSubmit={(name, avatar) => {
            addLocalSeat(name, avatar)
            setAddOpen(false)
          }}
        />
      </Modal>
    </div>
  )
}
