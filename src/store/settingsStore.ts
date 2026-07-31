import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { sound } from '../audio/sound'

interface SettingsState {
  soundEnabled: boolean
  lastName: string
  lastAvatar: string
  seenHowToPlay: boolean
  toggleSound: () => void
  setSoundEnabled: (on: boolean) => void
  rememberIdentity: (name: string, avatar: string) => void
  markHowToPlaySeen: () => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      soundEnabled: true,
      lastName: '',
      lastAvatar: '🕺',
      seenHowToPlay: false,
      toggleSound: () => {
        const next = !get().soundEnabled
        sound.setEnabled(next)
        set({ soundEnabled: next })
      },
      setSoundEnabled: (on) => {
        sound.setEnabled(on)
        set({ soundEnabled: on })
      },
      rememberIdentity: (name, avatar) => set({ lastName: name, lastAvatar: avatar }),
      markHowToPlaySeen: () => set({ seenHowToPlay: true }),
    }),
    { name: 'bollywood-mafia:settings' },
  ),
)
