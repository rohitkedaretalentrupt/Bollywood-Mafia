import { motion } from 'framer-motion'
import { useEffect, type ComponentType } from 'react'
import { sound } from './audio/sound'
import { CreateRoomScreen } from './screens/CreateRoomScreen'
import { DayScreen } from './screens/DayScreen'
import { GameOverScreen } from './screens/GameOverScreen'
import { JoinRoomScreen } from './screens/JoinRoomScreen'
import { LandingScreen } from './screens/LandingScreen'
import { LeaderboardScreen } from './screens/LeaderboardScreen'
import { LobbyScreen } from './screens/LobbyScreen'
import { NightScreen } from './screens/NightScreen'
import { RoleRevealScreen } from './screens/RoleRevealScreen'
import { SoloSetupScreen } from './screens/SoloSetupScreen'
import { VerdictScreen } from './screens/VerdictScreen'
import { VotingScreen } from './screens/VotingScreen'
import { useGame } from './store/gameStore'
import { useSettings } from './store/settingsStore'
import type { Phase } from './types/game'

const SCREENS: Record<Phase, ComponentType> = {
  landing: LandingScreen,
  create: CreateRoomScreen,
  join: JoinRoomScreen,
  'solo-setup': SoloSetupScreen,
  lobby: LobbyScreen,
  reveal: RoleRevealScreen,
  night: NightScreen,
  day: DayScreen,
  vote: VotingScreen,
  verdict: VerdictScreen,
  gameover: GameOverScreen,
  leaderboard: LeaderboardScreen,
}

export default function App() {
  const phase = useGame((s) => s.phase)
  const soundEnabled = useSettings((s) => s.soundEnabled)

  // Browsers only allow audio after a real gesture — arm it on the first touch.
  useEffect(() => {
    const unlock = () => sound.unlock()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    sound.setEnabled(soundEnabled)
  }, [soundEnabled])

  // Stop the procedural score if the tab is hidden; resume state on return.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) sound.stopAmbience()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const Screen = SCREENS[phase] ?? LandingScreen

  return (
    <div className="film-grain vignette relative min-h-full w-full overflow-x-hidden bg-ink-950">
      {/*
        Deliberately not an AnimatePresence with mode="wait": that would hold the
        incoming screen back until the outgoing one finishes its exit animation,
        so a backgrounded tab (where rAF is paused mid-transition) could strand
        the player on a stale screen. Keying the incoming screen gives the same
        cross-fade feel while letting React swap immediately.
      */}
      <motion.div
        key={phase}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
        className="relative min-h-full w-full"
      >
        <Screen />
      </motion.div>
    </div>
  )
}
