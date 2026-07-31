import { useEffect, useRef, useState } from 'react'

/**
 * Deadline-based countdown. Because it derives from a timestamp in the store,
 * remounting the screen (or the tab going to sleep) never resets the clock.
 */
export function useCountdown(deadline: number, onExpire?: () => void) {
  const [now, setNow] = useState(() => Date.now())
  const fired = useRef(false)
  const expireRef = useRef(onExpire)
  expireRef.current = onExpire

  useEffect(() => {
    fired.current = false
  }, [deadline])

  useEffect(() => {
    if (!deadline) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [deadline])

  const msLeft = Math.max(0, deadline - now)
  const secondsLeft = Math.ceil(msLeft / 1000)

  useEffect(() => {
    if (!deadline || fired.current) return
    if (msLeft <= 0) {
      fired.current = true
      expireRef.current?.()
    }
  }, [msLeft, deadline])

  return { secondsLeft, msLeft }
}

/** Fires `cb` once after `delay` ms; resets when `key` changes. */
export function useTimeout(cb: () => void, delay: number | null, key?: unknown) {
  const ref = useRef(cb)
  ref.current = cb
  useEffect(() => {
    if (delay === null) return
    const id = window.setTimeout(() => ref.current(), delay)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, key])
}

/** Repeats `cb` every `delay` ms while `delay` is not null. */
export function useInterval(cb: () => void, delay: number | null) {
  const ref = useRef(cb)
  ref.current = cb
  useEffect(() => {
    if (delay === null) return
    const id = window.setInterval(() => ref.current(), delay)
    return () => window.clearInterval(id)
  }, [delay])
}
