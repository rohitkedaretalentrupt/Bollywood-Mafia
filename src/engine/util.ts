let idCounter = 0

export function uid(prefix = 'id'): string {
  idCounter += 1
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}${Math.floor(
    Math.random() * 1e4,
  ).toString(36)}`
}

export function shuffle<T>(input: readonly T[]): T[] {
  const arr = input.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

export function pick<T>(arr: readonly T[]): T | undefined {
  if (arr.length === 0) return undefined
  return arr[Math.floor(Math.random() * arr.length)]
}

export function pickN<T>(arr: readonly T[], n: number): T[] {
  return shuffle(arr).slice(0, Math.max(0, n))
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function chance(p: number): boolean {
  return Math.random() < p
}

/** Weighted pick. Weights are clamped to >= 0; falls back to uniform. */
export function weightedPick<T>(items: readonly T[], weights: readonly number[]): T | undefined {
  if (items.length === 0) return undefined
  const safe = weights.map((w) => (Number.isFinite(w) && w > 0 ? w : 0))
  const total = safe.reduce((a, b) => a + b, 0)
  if (total <= 0) return pick(items)
  let roll = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    roll -= safe[i]
    if (roll <= 0) return items[i]
  }
  return items[items.length - 1]
}

export function generateRoomCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) code += Math.floor(Math.random() * 10).toString()
  // Avoid a leading zero so the code always reads as six digits.
  if (code[0] === '0') code = '4' + code.slice(1)
  return code
}

export function sortByDesc<T>(arr: readonly T[], key: (item: T) => number): T[] {
  return arr.slice().sort((a, b) => key(b) - key(a))
}
