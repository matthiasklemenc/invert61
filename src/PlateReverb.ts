import * as Tone from "tone";

/**
 * BIG PLATE REVERB (Parallel + Phase-Safe)
 * - Dry stays at unity; wet is added in parallel.
 * - Dry is time-aligned to wet to avoid phase thinning (comb filtering).
 * - Custom plate IR (convolver) for dense EMT-like tail.
 * - Presence bump on wet so vocals don't sink.
 * - Smart make-up gain so turning up the mix makes it sound *bigger*, not quieter.
 * - Output limiter for safety.
 */
export type PlateReverbOptions = {
  /** Max wet gain added in parallel (0..1). 0.6–0.8 is strong. */
  maxWet?: number;           // default 0.70
  /** seconds — overall decay length of the plate tail */
  decay?: number;            // default 2.0
  /** seconds — pre-delay to keep source intelligible (0.03–0.05 good for vocals) */
  preDelay?: number;         // default 0.040
  /** seconds — time-align the DRY path to the wet path to avoid comb-filtering */
  alignDryMs?: number;       // default 6 ms
  /** Hz — high-pass on the send to keep mud out but retain body */
  loCut?: number;            // default 160
  /** Hz — low-pass on wet return to keep plate character (6–9 kHz) */
  hiCut?: number;            // default 7600
  /** dB — presence bump near ~2.4 kHz on wet so voices stay forward */
  wetPresenceDb?: number;    // default +2.5
  /** dB — low-shelf warmth on wet */
  wetWarmthDb?: number;      // default +2.0
  /** Target make-up at full mix (linear). 1.0 = 0 dB, 1.5 ≈ +3.5 dB. */
  maxMakeup?: number;        // default 1.5
};

export function createPlateReverb(opts: PlateReverbOptions = {}) {
  const {
    maxWet = 0.70,
    decay = 2.0,
    preDelay = 0.040,      // 40ms separation: clarity + size
    alignDryMs = 6,        // ALIGN DRY to wet ~6ms to kill comb-thinning
    loCut = 160,
    hiCut = 7600,
    wetPresenceDb = 2.5,
    wetWarmthDb = 2.0,
    maxMakeup = 1.5,
  } = opts;

  // I/O
  const input = new Tone.Gain();
  const output = new Tone.Gain();

  // --- Parallel split
  const dryDelayAlign = new Tone.Delay(alignDryMs / 1000); // align DRY so dry+wet don't comb
  const dryGain = new Tone.Gain(1);                        // dry stays strong
  const wetGain = new Tone.Gain(0);                        // added on top by setMix()

  // --- Build a plate IR (dense, immediate)
  const ctx = Tone.getContext().rawContext as AudioContext;

  function makePlateIR(seconds: number): AudioBuffer {
    const rate = ctx.sampleRate;
    const len = Math.max(1, Math.floor(seconds * rate));
    const buf = ctx.createBuffer(2, len, rate);

    // low/high envelopes (lows ring longer, highs shorter)
    const tLow = seconds * 1.25;
    const tHigh = Math.max(0.8, seconds * 0.70);
    const diffAmt = 0.25; // diffusion smear
    const tilt = 0.10;    // slight HF sheen

    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);

      // Dense early energy: “velvet-ish” noise
      for (let i = 0; i < len; i++) {
        const t = i / rate;
        const envLow  = Math.pow(Math.max(1 - t / tLow,  0), 2.2);
        const envHigh = Math.pow(Math.max(1 - t / tHigh, 0), 3.0);
        const env = Math.min(1, envLow * 0.85 + envHigh * 0.55);

        // slightly gaussian
        const n = (Math.random() + Math.random() - 1);
        data[i] = n * env * 0.6;
      }
      // diffusion for plate-like density
      for (let i = 3; i < len; i++) {
        data[i] += diffAmt * data[i - 1] + (diffAmt * 0.5) * data[i - 3];
      }
      // tiny HF tilt (sheen)
      let acc = 0;
      const tiltCoef = 0.00075 + tilt * 0.00035;
      for (let i = 0; i < len; i++) {
        acc += (data[i] - acc) * tiltCoef;
        data[i] += acc * tilt;
      }
      // normalize
      let peak = 0;
      for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(data[i]));
      const g = peak > 0 ? 0.9 / peak : 1;
      for (let i = 0; i < len; i++) data[i] *= g;
    }
    return buf;
  }

  const convolver = new Tone.Convolver(undefined);
  convolver.buffer = new Tone.ToneAudioBuffer(makePlateIR(decay));

  // --- Wet chain: preDelay → HP → Convolver → Warmth shelf → Presence peak → LP → gentle comp → wetGain
  const preDelayNode = new Tone.Delay(preDelay);

  const hp = new Tone.Filter({ type: "highpass", frequency: loCut, Q: 0.707 });

  const wetLowShelf = new Tone.Filter({
    type: "lowshelf",
    frequency: 200,
    gain: wetWarmthDb, // +dB for body
  });

  // Presence around ~2.4 kHz — we’ll approximate with a peaking filter
  const wetPresence = new Tone.Filter({
    type: "peaking",
    frequency: 2400,
    Q: 0.9,
    gain: wetPresenceDb,
  });

  const lp = new Tone.Filter({ type: "lowpass", frequency: hiCut, Q: 0.7 });

  const wetComp = new Tone.Compressor({
    threshold: -28,
    ratio: 2.2,
    attack: 0.008,
    release: 0.16,
    knee: 24,
  });

  // --- Summing + Make-up + Limiter
  const sum = new Tone.Gain(1);
  const makeup = new Tone.Gain(1);       // dynamic gain increases with mix
  const limiter = new Tone.Limiter(-1.0);

  // Wire it up
  input.fan(dryDelayAlign, preDelayNode);

  dryDelayAlign.connect(dryGain);
  dryGain.connect(sum);

  preDelayNode.chain(hp, convolver, wetLowShelf, wetPresence, lp, wetComp, wetGain);
  wetGain.connect(sum);

  sum.chain(makeup, limiter, output);

  // Helpers
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  // --- Controls
  function setMix(mix01: number) {
    const t = clamp01(mix01);

    // Parallel add: dry stays at unity; wet increases to maxWet.
    // We also scale make-up so overall level grows a bit with mix.
    wetGain.gain.value = t * maxWet;

    // Make-up curve: more than linear early to feel "bigger" as you turn it.
    // 1.0 → 1.5 gives ~+3.5 dB at full mix.
    const g = 1 + (maxMakeup - 1) * Math.pow(t, 0.8);
    makeup.gain.value = g;
  }

  function setDecay(seconds: number) {
    const s = clamp(seconds, 0.5, 8);
    convolver.buffer = new Tone.ToneAudioBuffer(makePlateIR(s)); // update IR when decay changes
  }

  function setPreDelay(seconds: number) {
    preDelayNode.delayTime.value = clamp(seconds, 0, 0.08);
  }

  function setAlignMs(ms: number) {
    // 0..20 ms sensible; 4–10 ms typical to kill combing.
    dryDelayAlign.delayTime.value = clamp(ms / 1000, 0, 0.02);
  }

  function setHiCut(hz: number) {
    lp.frequency.value = clamp(hz, 4000, 20000);
  }

  function setLoCut(hz: number) {
    hp.frequency.value = clamp(hz, 60, 600);
  }

  function setPresenceDb(db: number) {
    wetPresence.gain.value = clamp(db, -6, 6);
  }

  function setWarmthDb(db: number) {
    wetLowShelf.gain.value = clamp(db, -6, 6);
  }

  function dispose() {
    [
      input, output, dryDelayAlign, dryGain, wetGain,
      preDelayNode, hp, convolver, wetLowShelf, wetPresence, lp, wetComp,
      sum, makeup, limiter
    ].forEach(n => n.dispose());
  }

  // Sensible defaults
  setMix(0.0);
  setPresenceDb(wetPresenceDb);
  setAlignMs(alignDryMs);

  return {
    input,
    output,
    // main knobs
    setMix,          // 0..1  (try 0.25–0.45 vocals; 0.5–0.65 big)
    setDecay,        // seconds (1.6–2.4 = classic vocal plate)
    setPreDelay,     // seconds (0.03–0.05 for presence)
    // shaping
    setHiCut,        // Hz
    setLoCut,        // Hz
    setPresenceDb,   // dB at ~2.4 kHz on wet
    setWarmthDb,     // dB low-shelf on wet
    // phase safety
    setAlignMs,      // ms delay on DRY to kill comb thinning
    dispose,
    // debug
    nodes: { dryDelayAlign, dryGain, wetGain, preDelayNode, hp, convolver, wetLowShelf, wetPresence, lp, wetComp, sum, makeup, limiter }
  };
}