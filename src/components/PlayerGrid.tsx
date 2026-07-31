import type { ReactNode } from 'react'
import type { Player } from '../types/game'
import { PlayerCard } from './PlayerCard'

export function PlayerGrid({
  players,
  selectedId,
  onSelect,
  disabledIds = [],
  revealRoleFor = [],
  youId,
  badges = {},
  captions = {},
  compact,
  columnsClass = 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5',
}: {
  players: Player[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  disabledIds?: string[]
  /** Player ids whose role chip should be visible. */
  revealRoleFor?: string[]
  youId?: string | null
  badges?: Record<string, ReactNode>
  captions?: Record<string, string>
  compact?: boolean
  columnsClass?: string
}) {
  return (
    <div className={`grid gap-2 sm:gap-3 ${columnsClass}`}>
      {players.map((p) => (
        <PlayerCard
          key={p.id}
          player={p}
          compact={compact}
          selected={selectedId === p.id}
          disabled={disabledIds.includes(p.id) || !p.alive}
          onClick={onSelect ? () => onSelect(p.id) : undefined}
          showRole={revealRoleFor.includes(p.id) || !p.alive}
          isYou={youId === p.id}
          badge={badges[p.id]}
          caption={captions[p.id]}
        />
      ))}
    </div>
  )
}
