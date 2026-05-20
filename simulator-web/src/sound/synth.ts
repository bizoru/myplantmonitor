/**
 * Procedural SoundManager. Uses the Web Audio API to synthesize
 * tiny UI sounds — no external assets, no licensing, ~3KB gzip.
 *
 * Mute toggle is persisted in localStorage under `miplanta:muted`.
 */

const MUTE_KEY = "miplanta:muted";

export type SoundName = "blip" | "thunk" | "click" | "chirp" | "boot";

type Ctx = AudioContext;

let ctx: Ctx | null = null;
let muted: boolean = readMuted();

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeMuted(v: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, v ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function getCtx(): Ctx | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const AC: typeof AudioContext | undefined =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

interface ToneOptions {
  freq: number;
  durationMs: number;
  type?: OscillatorType;
  gainDb?: number;
  attackMs?: number;
  releaseMs?: number;
  freqEnd?: number;
}

function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

function tone(opts: ToneOptions) {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, now);
  if (opts.freqEnd) {
    osc.frequency.linearRampToValueAtTime(
      opts.freqEnd,
      now + opts.durationMs / 1000,
    );
  }
  const peak = dbToGain(opts.gainDb ?? -22);
  const attack = (opts.attackMs ?? 4) / 1000;
  const release = (opts.releaseMs ?? 30) / 1000;
  const dur = opts.durationMs / 1000;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(peak, now + attack);
  g.gain.setValueAtTime(peak, now + Math.max(attack, dur - release));
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(g).connect(c.destination);
  osc.start(now);
  osc.stop(now + dur + 0.05);
}

function noiseBurst(durationMs: number, gainDb: number) {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const samples = Math.floor((durationMs / 1000) * c.sampleRate);
  const buf = c.createBuffer(1, samples, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < samples; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / samples);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.value = dbToGain(gainDb);
  // Lowpass it so it sounds like a thunk, not white noise.
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 380;
  src.connect(lp).connect(g).connect(c.destination);
  src.start(now);
  src.stop(now + durationMs / 1000 + 0.02);
}

export const SoundManager = {
  isMuted(): boolean {
    return muted;
  },
  setMuted(v: boolean) {
    muted = v;
    writeMuted(v);
    // Resume on unmute (browsers suspend audio without user gesture).
    if (!v) getCtx()?.resume?.().catch(() => {});
  },
  toggleMuted(): boolean {
    SoundManager.setMuted(!muted);
    return muted;
  },
  /** Should be called from a user gesture to unlock audio. */
  unlock() {
    getCtx()?.resume?.().catch(() => {});
  },
  play(name: SoundName) {
    if (muted) return;
    const c = getCtx();
    if (!c) return;
    if (c.state === "suspended") c.resume?.().catch(() => {});
    switch (name) {
      case "blip":
        tone({
          freq: 2000,
          durationMs: 30,
          type: "sine",
          gainDb: -22,
          attackMs: 2,
          releaseMs: 20,
        });
        break;
      case "click":
        tone({
          freq: 1200,
          durationMs: 10,
          type: "square",
          gainDb: -28,
          attackMs: 1,
          releaseMs: 6,
        });
        break;
      case "thunk":
        noiseBurst(80, -16);
        tone({
          freq: 200,
          durationMs: 80,
          type: "sine",
          gainDb: -18,
          attackMs: 2,
          releaseMs: 60,
          freqEnd: 120,
        });
        break;
      case "chirp":
        tone({
          freq: 880,
          durationMs: 90,
          type: "square",
          gainDb: -16,
          freqEnd: 1320,
          attackMs: 2,
          releaseMs: 40,
        });
        setTimeout(
          () =>
            tone({
              freq: 1320,
              durationMs: 100,
              type: "square",
              gainDb: -16,
              freqEnd: 1760,
              attackMs: 2,
              releaseMs: 60,
            }),
          110,
        );
        break;
      case "boot":
        // Low rumble swept up.
        tone({
          freq: 60,
          durationMs: 1500,
          type: "sawtooth",
          gainDb: -22,
          freqEnd: 220,
          attackMs: 200,
          releaseMs: 500,
        });
        break;
    }
  },
};
