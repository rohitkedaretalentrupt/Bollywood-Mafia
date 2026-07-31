import type { SeatDraft } from '../engine/setup'

/**
 * Room registry.
 *
 * The game has no backend, so a "room" lives in localStorage. That gives two
 * real behaviours:
 *   • pass-and-play — everyone in the physical room joins with the code on the
 *     host's device, and the phone is handed around during private phases;
 *   • multi-tab — a second browser tab/window on the same machine can join the
 *     same code live, which is handy for testing and for a laptop + phone-mirror
 *     setup.
 */

const KEY = 'bollywood-mafia:rooms'
const CHANNEL = 'bollywood-mafia:rooms:sync'
const MAX_AGE_MS = 6 * 60 * 60 * 1000

export interface StoredRoom {
  code: string
  hostName: string
  createdAt: number
  updatedAt: number
  seats: SeatDraft[]
  botCount: number
  status: 'open' | 'started'
}

function readAll(): StoredRoom[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return (parsed as StoredRoom[]).filter(
      (r) => r && typeof r.code === 'string' && Array.isArray(r.seats),
    )
  } catch {
    return []
  }
}

function writeAll(rooms: StoredRoom[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rooms))
  } catch {
    /* storage full or blocked — the game still works, rooms just aren't shared */
  }
  broadcast()
}

let channel: BroadcastChannel | null = null

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!channel) {
    try {
      channel = new BroadcastChannel(CHANNEL)
    } catch {
      channel = null
    }
  }
  return channel
}

function broadcast() {
  try {
    getChannel()?.postMessage({ t: Date.now() })
  } catch {
    /* ignore */
  }
}

export function pruneRooms(): StoredRoom[] {
  const now = Date.now()
  const kept = readAll().filter((r) => now - (r.updatedAt ?? r.createdAt) < MAX_AGE_MS)
  if (kept.length !== readAll().length) writeAll(kept)
  return kept
}

export function listOpenRooms(): StoredRoom[] {
  return pruneRooms()
    .filter((r) => r.status === 'open')
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getRoom(code: string): StoredRoom | null {
  return readAll().find((r) => r.code === code.trim()) ?? null
}

export function upsertRoom(room: StoredRoom) {
  const rooms = readAll()
  const idx = rooms.findIndex((r) => r.code === room.code)
  const next = { ...room, updatedAt: Date.now() }
  if (idx >= 0) rooms[idx] = next
  else rooms.push(next)
  writeAll(rooms.slice(-24))
}

export function addSeatToRoom(code: string, seat: SeatDraft): StoredRoom | null {
  const room = getRoom(code)
  if (!room) return null
  if (room.status !== 'open') return null
  if (room.seats.some((s) => s.name.trim().toLowerCase() === seat.name.trim().toLowerCase())) {
    return room
  }
  const next: StoredRoom = { ...room, seats: [...room.seats, seat], updatedAt: Date.now() }
  upsertRoom(next)
  return next
}

export function removeSeatFromRoom(code: string, seatId: string): StoredRoom | null {
  const room = getRoom(code)
  if (!room) return null
  const next: StoredRoom = {
    ...room,
    seats: room.seats.filter((s) => s.id !== seatId),
    updatedAt: Date.now(),
  }
  upsertRoom(next)
  return next
}

export function setRoomStatus(code: string, status: StoredRoom['status']) {
  const room = getRoom(code)
  if (!room) return
  upsertRoom({ ...room, status })
}

export function deleteRoom(code: string) {
  writeAll(readAll().filter((r) => r.code !== code))
}

/** Fires whenever any tab changes the registry. Returns an unsubscribe fn. */
export function subscribeRooms(cb: () => void): () => void {
  const ch = getChannel()
  const onMessage = () => cb()
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb()
  }
  ch?.addEventListener('message', onMessage)
  window.addEventListener('storage', onStorage)
  return () => {
    ch?.removeEventListener('message', onMessage)
    window.removeEventListener('storage', onStorage)
  }
}
