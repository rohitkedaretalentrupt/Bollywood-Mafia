/**
 * Zero-asset sound design.
 *
 * Everything you hear is synthesised live with the Web Audio API — no mp3s to
 * download, no licensing, nothing to cache. There is a procedural suspense loop
 * for the night phase plus a small bank of one-shot effects.
 */

export type SfxName =
  | 'click'
  | 'select'
  | 'whoosh'
  | 'flip'
  | 'reveal'
  | 'eliminate'
  | 'save'
  | 'correct'
  | 'wrong'
  | 'vote'
  | 'gavel'
  | 'victory'
  | 'defeat'
  | 'tick'
  | 'alarm'

export type Ambience = 'night' | 'day' | 'tense' | 'none'

type Ctor = typeof AudioContext

function getCtor(): Ctor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { AudioContext?: Ctor; webkitAudioContext?: Ctor }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

class SoundEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musicGain: GainNode | null = null
  private droneNodes: OscillatorNode[] = []
  private schedulerId: number | null = null
  private step = 0
  private mood: Ambience = 'none'
  private noiseBuffer: AudioBuffer | null = null

  enabled = true
  unlocked = false

  /** Must be called from a real user gesture on iOS / Safari. */
  unlock() {
    const Ctor = getCtor()
    if (!Ctor) return
    try {
      if (!this.ctx) {
        this.ctx = new Ctor()
        this.master = this.ctx.createGain()
        this.master.gain.value = this.enabled ? 0.9 : 0
        this.master.connect(this.ctx.destination)
        this.musicGain = this.ctx.createGain()
        this.musicGain.gain.value = 0
        this.musicGain.connect(this.master)
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      this.unlocked = true
    } catch {
      this.ctx = null
    }
  }

  setEnabled(on: boolean) {
    this.enabled = on
    if (!this.ctx || !this.master) return
    const now = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setTargetAtTime(on ? 0.9 : 0, now, 0.05)
    if (!on) this.stopAmbience()
  }

  private ready(): AudioContext | null {
    if (!this.enabled) return null
    if (!this.ctx) this.unlock()
    if (!this.ctx) return null
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  private noise(): AudioBuffer | null {
    const ctx = this.ctx
    if (!ctx) return null
    if (this.noiseBuffer) return this.noiseBuffer
    const len = Math.floor(ctx.sampleRate * 1.2)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    this.noiseBuffer = buf
    return buf
  }

  private tone(opts: {
    freq: number
    at: number
    dur: number
    type?: OscillatorType
    gain?: number
    to?: number
    dest?: AudioNode
    detune?: number
  }) {
    const ctx = this.ctx
    const dest = opts.dest ?? this.master
    if (!ctx || !dest) return
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = opts.type ?? 'sine'
    osc.frequency.setValueAtTime(Math.max(20, opts.freq), opts.at)
    if (opts.to && opts.to !== opts.freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), opts.at + opts.dur)
    }
    if (opts.detune) osc.detune.value = opts.detune
    const peak = opts.gain ?? 0.2
    g.gain.setValueAtTime(0.0001, opts.at)
    g.gain.exponentialRampToValueAtTime(peak, opts.at + Math.min(0.02, opts.dur * 0.3))
    g.gain.exponentialRampToValueAtTime(0.0001, opts.at + opts.dur)
    osc.connect(g)
    g.connect(dest)
    osc.start(opts.at)
    osc.stop(opts.at + opts.dur + 0.05)
  }

  private hit(opts: { at: number; dur: number; gain?: number; freq?: number; q?: number }) {
    const ctx = this.ctx
    if (!ctx || !this.master) return
    const buf = this.noise()
    if (!buf) return
    const src = ctx.createBufferSource()
    src.buffer = buf
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = opts.freq ?? 1200
    filter.Q.value = opts.q ?? 0.8
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, opts.at)
    g.gain.exponentialRampToValueAtTime(opts.gain ?? 0.18, opts.at + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, opts.at + opts.dur)
    src.connect(filter)
    filter.connect(g)
    g.connect(this.master)
    src.start(opts.at)
    src.stop(opts.at + opts.dur + 0.05)
  }

  play(name: SfxName) {
    const ctx = this.ready()
    if (!ctx) return
    const t = ctx.currentTime + 0.01
    try {
      switch (name) {
        case 'click':
          this.tone({ freq: 520, to: 700, at: t, dur: 0.07, type: 'triangle', gain: 0.12 })
          break
        case 'select':
          this.tone({ freq: 880, to: 1180, at: t, dur: 0.1, type: 'triangle', gain: 0.13 })
          break
        case 'tick':
          this.tone({ freq: 1500, at: t, dur: 0.035, type: 'square', gain: 0.05 })
          break
        case 'whoosh':
          this.hit({ at: t, dur: 0.5, freq: 700, q: 0.5, gain: 0.14 })
          this.tone({ freq: 200, to: 900, at: t, dur: 0.45, type: 'sawtooth', gain: 0.05 })
          break
        case 'flip':
          this.hit({ at: t, dur: 0.18, freq: 2400, q: 1.4, gain: 0.11 })
          this.tone({ freq: 320, to: 620, at: t, dur: 0.16, type: 'triangle', gain: 0.08 })
          break
        case 'reveal':
          ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
            this.tone({ freq: f, at: t + i * 0.09, dur: 0.5, type: 'triangle', gain: 0.15 }),
          )
          this.tone({ freq: 130.81, at: t, dur: 1.1, type: 'sine', gain: 0.12 })
          break
        case 'eliminate':
          this.hit({ at: t, dur: 0.6, freq: 180, q: 0.4, gain: 0.3 })
          this.tone({ freq: 300, to: 60, at: t, dur: 0.9, type: 'sawtooth', gain: 0.2 })
          this.tone({ freq: 155, to: 40, at: t + 0.05, dur: 1, type: 'square', gain: 0.09 })
          break
        case 'save':
          ;[392, 523.25, 659.25].forEach((f, i) =>
            this.tone({ freq: f, at: t + i * 0.07, dur: 0.55, type: 'sine', gain: 0.16 }),
          )
          break
        case 'correct':
          ;[880, 1174.66, 1567.98].forEach((f, i) =>
            this.tone({ freq: f, at: t + i * 0.06, dur: 0.6, type: 'sine', gain: 0.17 }),
          )
          this.hit({ at: t, dur: 0.25, freq: 5200, q: 2, gain: 0.06 })
          break
        case 'wrong':
          this.tone({ freq: 220, to: 110, at: t, dur: 0.55, type: 'square', gain: 0.14 })
          this.tone({ freq: 233, to: 116, at: t + 0.03, dur: 0.5, type: 'sawtooth', gain: 0.08 })
          break
        case 'vote':
          this.tone({ freq: 660, to: 880, at: t, dur: 0.12, type: 'square', gain: 0.1 })
          break
        case 'gavel':
          this.hit({ at: t, dur: 0.22, freq: 420, q: 0.6, gain: 0.32 })
          this.tone({ freq: 120, to: 55, at: t, dur: 0.35, type: 'sine', gain: 0.22 })
          break
        case 'alarm':
          for (let i = 0; i < 3; i++) {
            this.tone({
              freq: 740,
              to: 520,
              at: t + i * 0.22,
              dur: 0.2,
              type: 'sawtooth',
              gain: 0.12,
            })
          }
          break
        case 'victory': {
          const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]
          notes.forEach((f, i) => {
            this.tone({ freq: f, at: t + i * 0.13, dur: 0.75, type: 'triangle', gain: 0.18 })
            this.tone({ freq: f / 2, at: t + i * 0.13, dur: 0.75, type: 'sine', gain: 0.1 })
          })
          this.hit({ at: t + 0.65, dur: 0.9, freq: 3800, q: 1.2, gain: 0.08 })
          break
        }
        case 'defeat': {
          const notes = [523.25, 466.16, 415.3, 311.13]
          notes.forEach((f, i) =>
            this.tone({ freq: f, at: t + i * 0.22, dur: 0.9, type: 'sawtooth', gain: 0.13 }),
          )
          this.tone({ freq: 65.41, at: t, dur: 2.2, type: 'sine', gain: 0.18 })
          break
        }
      }
    } catch {
      /* audio is a nice-to-have; never break the game over it */
    }
  }

  /* ------------------------- procedural score ------------------------- */

  startAmbience(mood: Ambience) {
    if (mood === 'none') {
      this.stopAmbience()
      return
    }
    const ctx = this.ready()
    if (!ctx || !this.musicGain) return
    if (this.mood === mood && this.schedulerId !== null) return
    this.stopAmbience()
    this.mood = mood

    const root = mood === 'tense' ? 55 : mood === 'night' ? 49 : 65.41
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = mood === 'day' ? 900 : 520
    filter.Q.value = 0.7
    filter.connect(this.musicGain)

    for (const detune of [-7, 5, 12]) {
      const osc = ctx.createOscillator()
      osc.type = mood === 'day' ? 'triangle' : 'sawtooth'
      osc.frequency.value = root
      osc.detune.value = detune
      const g = ctx.createGain()
      g.gain.value = 0.11
      osc.connect(g)
      g.connect(filter)
      osc.start()
      this.droneNodes.push(osc)
    }

    // Slow breathing LFO on the filter so the drone never sits still.
    const lfo = ctx.createOscillator()
    lfo.frequency.value = mood === 'tense' ? 0.28 : 0.13
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = mood === 'day' ? 260 : 170
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    lfo.start()
    this.droneNodes.push(lfo)

    this.musicGain.gain.cancelScheduledValues(ctx.currentTime)
    this.musicGain.gain.setTargetAtTime(mood === 'day' ? 0.16 : 0.26, ctx.currentTime, 1.4)

    // Tabla-ish pulse + sparse plucked motif.
    const pattern = mood === 'tense' ? [1, 0, 1, 1, 0, 1, 0, 1] : [1, 0, 0, 1, 0, 0, 1, 0]
    const scale =
      mood === 'day' ? [261.63, 293.66, 329.63, 392, 440] : [220, 233.08, 293.66, 311.13, 349.23]
    const stepDur = mood === 'tense' ? 0.28 : 0.42

    this.step = 0
    const tickFn = () => {
      const c = this.ctx
      if (!c || !this.enabled || !this.musicGain) return
      const at = c.currentTime + 0.06
      const idx = this.step % pattern.length
      if (pattern[idx]) {
        this.hit({ at, dur: 0.12, freq: 190, q: 0.7, gain: 0.09 })
        this.tone({
          freq: 96,
          to: 62,
          at,
          dur: 0.16,
          type: 'sine',
          gain: 0.13,
          dest: this.musicGain,
        })
      }
      if (idx % 4 === 2 && Math.random() < 0.65) {
        const f = scale[Math.floor(Math.random() * scale.length)]
        this.tone({
          freq: f * 2,
          at: at + 0.04,
          dur: 0.7,
          type: 'triangle',
          gain: 0.055,
          dest: this.musicGain,
        })
      }
      this.step += 1
    }
    tickFn()
    this.schedulerId = window.setInterval(tickFn, stepDur * 1000)
  }

  stopAmbience() {
    if (this.schedulerId !== null) {
      window.clearInterval(this.schedulerId)
      this.schedulerId = null
    }
    const ctx = this.ctx
    if (ctx && this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(ctx.currentTime)
      this.musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.35)
    }
    const stopping = this.droneNodes
    this.droneNodes = []
    for (const node of stopping) {
      try {
        node.stop(ctx ? ctx.currentTime + 1.2 : 0)
      } catch {
        /* already stopped */
      }
    }
    this.mood = 'none'
  }
}

export const sound = new SoundEngine()

export function playSfx(name: SfxName) {
  sound.play(name)
}

export function startAmbience(mood: Ambience) {
  sound.startAmbience(mood)
}

export function stopAmbience() {
  sound.stopAmbience()
}
