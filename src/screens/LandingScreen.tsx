import { motion } from 'framer-motion'
import { useState } from 'react'
import { sound } from '../audio/sound'
import { Particles, Spotlights, StageBackdrop } from '../components/effects/Ambient'
import { RoleChip } from '../components/RoleCard'
import { Logo, SoundToggle } from '../components/TopBar'
import { Button } from '../components/ui/Button'
import { Marquee } from '../components/ui/Panel'
import { Modal } from '../components/ui/Modal'
import { ROLE_LIST } from '../data'
import { useGame } from '../store/gameStore'
import { useLeaderboard } from '../store/leaderboardStore'

export function LandingScreen() {
  const openCreateRoom = useGame((s) => s.openCreateRoom)
  const openJoinRoom = useGame((s) => s.openJoinRoom)
  const openSoloSetup = useGame((s) => s.openSoloSetup)
  const goto = useGame((s) => s.goto)
  const entries = useLeaderboard((s) => s.entries)
  const [howTo, setHowTo] = useState(false)

  const start = (fn: () => void) => () => {
    sound.unlock()
    fn()
  }

  return (
    <div className="relative min-h-full overflow-hidden">
      <StageBackdrop mood="red" />
      <Spotlights />
      <Particles density={1.2} />

      <div className="absolute right-3 top-3 z-30 flex gap-2 sm:right-5 sm:top-5">
        <SoundToggle />
      </div>

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center px-5 py-12 text-center safe-bottom">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <Marquee count={11} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7"
        >
          <motion.div
            className="mb-1 text-6xl sm:text-7xl"
            animate={{ rotate: [-4, 4, -4] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            🎬
          </motion.div>
          <h1 className="font-display text-[15vw] leading-[0.82] tracking-tight text-gold-anim sm:text-7xl">
            BOLLYWOOD
          </h1>
          <h1
            className="font-display text-[15vw] leading-[0.82] tracking-tight text-crimson-500 sm:text-7xl"
            style={{ textShadow: '0 0 34px rgba(229,9,20,0.65)' }}
          >
            MAFIA
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-5 max-w-[30ch] text-sm font-semibold leading-snug tracking-wide text-gold-100/65 sm:text-base"
        >
          Find the villain before the movie ends.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62, duration: 0.6 }}
          className="mt-9 w-full space-y-3"
        >
          <Button variant="primary" size="lg" full icon="🎥" onClick={start(openCreateRoom)}>
            Create Room
          </Button>
          <Button variant="ghost" size="lg" full icon="🔑" onClick={start(openJoinRoom)}>
            Join Room
          </Button>
          <Button variant="gold" size="lg" full icon="🤖" onClick={start(openSoloSetup)}>
            Solo Mode
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-7 flex w-full items-center justify-center gap-2"
        >
          <Button variant="outline" size="sm" onClick={() => setHowTo(true)}>
            How to play
          </Button>
          <Button variant="outline" size="sm" onClick={() => goto('leaderboard')}>
            🏆 Leaderboard{entries.length > 0 ? ` · ${entries.length}` : ''}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-9"
        >
          <Logo small />
          <p className="mt-2 text-[9px] uppercase tracking-cine text-gold-100/25">
            5–12 players · No sign-in · Nothing to install
          </p>
        </motion.div>
      </div>

      <Modal open={howTo} onClose={() => setHowTo(false)} title="How to play" maxWidth="max-w-xl">
        <div className="space-y-5 text-sm leading-relaxed text-gold-100/80">
          <p>
            A villain has infiltrated the movie set. Everyone gets a secret role. Each{' '}
            <b className="text-gold-300">night</b> the villain writes someone out of the picture
            while the studio's power roles quietly work against them. Each{' '}
            <b className="text-gold-300">day</b> the surviving crew read the clue log, argue, and
            vote one person off the set.
          </p>

          <div className="rounded-2xl border border-gold-400/25 bg-gold-400/[0.07] p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-cine text-gold-300">
              How to win
            </p>
            <p>
              <b>Studio</b> wins by voting out every villain.{' '}
              <b className="text-crimson-400">Villains</b> win when they equal the number of
              survivors — or when the shoot runs out of days.
            </p>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-cine text-gold-300">
              The cast
            </p>
            <div className="space-y-2">
              {ROLE_LIST.map((role) => (
                <div
                  key={role.id}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2.5"
                >
                  <span className="text-2xl leading-none">{role.emoji}</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <RoleChip roleId={role.id} size="sm" />
                      <span className="text-[10px] uppercase tracking-widest text-gold-100/35">
                        {role.team === 'villain' ? 'Sabotage' : 'Studio'}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] leading-snug text-gold-100/75">{role.ability}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-cine text-gold-300">
              Clues are honest
            </p>
            <p>
              Every public clue on the log is a <b>true statement</b> about the real state of the
              game. "At least one of these three sabotaged a take" always contains a villain, and a
              cleared pair is always innocent. Cross-reference them and you can name the villain by
              day three.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-cine text-gold-300">
              Party mode
            </p>
            <p>
              Party mode is pass-and-play: create a room, read the six-digit code to the people
              around you, and everyone joins on this device. During private phases the screen asks
              you to hand the phone to the next player. Empty seats are filled with AI actors.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
