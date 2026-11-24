// ================= AUDIO (Web Audio, everything generated – no files needed) =================
const Audio = (() => {
  let ac = null, master, musicGain, sfxGain, musicFilter, delay, delayFb, noiseBuf;
  let musicOn = true, sfxOn = true;
  try { musicOn = localStorage.getItem('invert-l2-music') !== 'off'; sfxOn = localStorage.getItem('invert-l2-sfx') !== 'off'; } catch (e) {}

  // music sequencer state
  let fast = false, boss = false, theme = 'sea', bgPaused = false, step = 0, nextTime = 0, timer = null;
  const BPM_NORMAL = 92, BPM_FAST = 150;
  // D minor – Bb – F – C (calm, a bit mysterious)
  const CHORDS = [
    [50, 53, 57], // Dm
    [46, 50, 53], // Bb
    [53, 57, 60], // F
    [48, 52, 55], // C
  ];
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0.8; master.connect(ac.destination);
    musicFilter = ac.createBiquadFilter(); musicFilter.type = 'lowpass'; musicFilter.frequency.value = theme === 'city' ? 5200 : 2200; musicFilter.Q.value = 0.6;
    musicGain = ac.createGain(); musicGain.gain.value = musicOn ? 0.55 : 0;
    musicFilter.connect(musicGain); musicGain.connect(master);
    sfxGain = ac.createGain(); sfxGain.gain.value = sfxOn ? 0.9 : 0; sfxGain.connect(master);
    delay = ac.createDelay(1); delayFb = ac.createGain(); delayFb.gain.value = 0.32;
    delay.connect(delayFb); delayFb.connect(delay); delay.connect(musicFilter);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    nextTime = ac.currentTime + 0.1;
    timer = setInterval(schedule, 25);
    setTimeout(() => loadMp3(), 0);
  }

  // ---------- music ----------
  const CHORDS_BOSS = [[50, 53, 57], [51, 55, 58], [50, 53, 57], [49, 52, 56]];
  function intense() { return fast || boss; }
  const CHORDS_CITY = [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]]; // C – Am – F – G (sunny)
  const CHORDS_SKY = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]; // Fmaj7 – Em7 – Dm7 – Cmaj7 (dreamy)
  const CHORDS_DINO = [[45, 48, 52], [43, 47, 50], [41, 45, 48], [40, 44, 47]];                 // Am – G – F – E (jungle adventure)
  const CHORDS_HOEHE = [[50, 54, 57], [48, 52, 55], [43, 47, 50], [45, 49, 52]];                // D – C – G – A (high up, heroic)
  const CHORDS_LAVA = [[40, 43, 47], [36, 40, 43], [38, 42, 45], [35, 39, 42]];                 // Em – C – D – B (deep down, a bit dangerous)
  function stepDur() { return 60 / (boss ? 132 : fast ? BPM_FAST : theme === 'city' ? 116 : theme === 'dino' ? 108 : theme === 'hoehe' ? 112 : theme === 'lava' ? 100 : theme === 'sky' ? 100 : BPM_NORMAL) / 4; }
  function schedule() {
    if (!ac) return;
    delay.delayTime.setTargetAtTime(stepDur() * 3, ac.currentTime, 0.05);
    while (nextTime < ac.currentTime + 0.15) { playStep(step, nextTime); nextTime += stepDur(); step = (step + 1) % 64; }
  }
  function tone(freq, t, dur, type, vol, dest, attack = 0.01) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(t, dur, vol, freq, type, dest, q = 1) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + 0.05);
    return { f, g };
  }
  function playStep(s, t) {
    if (bgPaused) return;
    const bar = Math.floor(s / 16) % 4, st = s % 16, ch = (boss ? CHORDS_BOSS : theme === 'city' ? CHORDS_CITY : theme === 'dino' ? CHORDS_DINO : theme === 'hoehe' ? CHORDS_HOEHE : theme === 'lava' ? CHORDS_LAVA : theme === 'sky' ? CHORDS_SKY : CHORDS)[bar], sd = stepDur();
    const fast = intense() || theme === 'city';
    // jungle drums (toms) for the dino world
    if (theme === 'dino' && !boss && [0, 3, 6, 10, 12].includes(st)) {
      const o = ac.createOscillator(), g = ac.createGain(), f0 = st === 12 ? 150 : st === 6 ? 110 : 90;
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.55, t + 0.18);
      g.gain.setValueAtTime(0.26, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g); g.connect(musicFilter); o.start(t); o.stop(t + 0.25);
    }
    // Felsenhöhe: big open drums and a high flute-like line
    if (theme === 'hoehe' && !boss && [0, 7, 8, 12].includes(st)) {
      const o = ac.createOscillator(), g = ac.createGain(), f0 = st === 12 ? 130 : 85;
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.5, t + 0.25);
      g.gain.setValueAtTime(0.24, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g); g.connect(musicFilter); o.start(t); o.stop(t + 0.32);
    }
    // Lavahöhlen: deep rumbling drums
    if (theme === 'lava' && !boss && [0, 6, 8, 14].includes(st)) {
      const o = ac.createOscillator(), g = ac.createGain(), f0 = st === 8 ? 70 : 55;
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.5, t + 0.3);
      g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g); g.connect(musicFilter); o.start(t); o.stop(t + 0.38);
    }
    if (theme === 'hoehe' && !boss && st % 8 === 4) tone(mtof(ch[(bar + st / 4) % ch.length] + 24), t, sd * 6, 'sine', 0.03, musicFilter, 0.03);
    if (theme === 'sky' && st % 4 === 0 && !boss) tone(mtof(ch[(st / 4) % ch.length] + 24), t, sd * 5, 'sine', 0.035, musicFilter, 0.02);   // sparkling bells
    // soft pad at bar start
    if (st === 0) for (const n of ch) { tone(mtof(n), t, sd * 16, 'sine', 0.07, musicFilter, 0.4); tone(mtof(n + 12) * 1.003, t, sd * 16, 'triangle', 0.025, musicFilter, 0.6); }
    // bass
    const bassSteps = fast ? [0, 3, 6, 8, 11, 14] : [0, 6, 8, 14];
    if (bassSteps.includes(st)) tone(mtof(ch[0] - 12), t, sd * (fast ? 2 : 3), 'triangle', 0.22, musicFilter);
    // arpeggio (8ths normally, 16ths in turbo)
    if (fast || st % 2 === 0) {
      const seq = [0, 1, 2, 1, 2, 0, 1, 2];
      const n = ch[seq[(fast ? st : st / 2) % 8]] + 12 + (st >= 8 && bar % 2 ? 12 : 0);
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = fast ? 'square' : 'triangle'; o.frequency.value = mtof(n);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(fast ? 0.035 : 0.06, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + sd * 1.8);
      o.connect(g); g.connect(musicFilter); g.connect(delay); o.start(t); o.stop(t + sd * 2);
    }
    // percussion (muffled, underwater)
    if (st % 8 === 0 || (fast && st % 4 === 0)) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
      g.gain.setValueAtTime(fast ? 0.35 : 0.22, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(g); g.connect(musicFilter); o.start(t); o.stop(t + 0.25);
    }
    if (st % 4 === 2 || (fast && st % 2 === 1)) noise(t, 0.04, fast ? 0.06 : 0.035, 7000, 'highpass', musicFilter);
    if (fast && (st === 4 || st === 12)) noise(t, 0.12, 0.12, 1800, 'bandpass', musicFilter, 0.8);
  }
  function setTheme(t) {
    theme = t;
    if (ac) musicFilter.frequency.setTargetAtTime(t === 'city' ? 5200 : t === 'dino' ? 3800 : t === 'hoehe' ? 4200 : t === 'lava' ? 3000 : t === 'sky' ? 4200 : 2200, ac.currentTime, 0.2);
  }
  function setBoss(on) {
    boss = on;
    if (ac) musicFilter.frequency.setTargetAtTime(on ? 4200 : (fast ? 6500 : theme === 'city' ? 5200 : theme === 'dino' ? 3800 : theme === 'hoehe' ? 4200 : theme === 'lava' ? 3000 : 2200), ac.currentTime, 0.3);
  }
  function setFast(on) {
    if (on === fast) return;
    fast = on;
    if (ac) musicFilter.frequency.setTargetAtTime(on ? 6500 : 2200, ac.currentTime, 0.2);
  }

  // ---------- sound effects ----------
  const sfx = {
    explosion() {
      const t = ac.currentTime;
      const n = noise(t, 1.2, 0.9, 1800, 'lowpass', sfxGain);
      n.f.frequency.setValueAtTime(2500, t); n.f.frequency.exponentialRampToValueAtTime(120, t + 1.1);
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(25, t + 0.6);
      g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.8);
      for (let i = 0; i < 6; i++) bubble(t + 0.25 + i * 0.07, 200 + Math.random() * 300, 0.08);
    },
    lavahit() {   // a fireball lands: like the explosion, but much softer and shorter
      const t = ac.currentTime;
      const n = noise(t, 0.6, 0.32, 1400, 'lowpass', sfxGain);
      n.f.frequency.setValueAtTime(1800, t); n.f.frequency.exponentialRampToValueAtTime(140, t + 0.55);
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.setValueAtTime(80, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.4);
      g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.5);
    },
    air() { const t = ac.currentTime; bubble(t, 260, 0.25); bubble(t + 0.08, 380, 0.2); bubble(t + 0.16, 520, 0.18); },
    star() { const t = ac.currentTime; tone(1046, t, 0.25, 'triangle', 0.25, sfxGain); tone(1568, t + 0.07, 0.35, 'triangle', 0.22, sfxGain); },
    pearl() { const t = ac.currentTime; [1568, 2093, 2637, 3136].forEach((f, i) => tone(f, t + i * 0.045, 0.3, 'sine', 0.16, sfxGain)); },
    jelly() {
      const t = ac.currentTime, o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(), g = ac.createGain();
      o.type = 'sawtooth'; o.frequency.value = 220; lfo.frequency.value = 38; lg.gain.value = 160;
      lfo.connect(lg); lg.connect(o.frequency);
      g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      o.connect(g); g.connect(sfxGain); o.start(t); lfo.start(t); o.stop(t + 0.5); lfo.stop(t + 0.5);
      noise(t, 0.3, 0.15, 4000, 'bandpass', sfxGain, 2);
    },
    urchin() { const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; o.frequency.setValueAtTime(700, t); o.frequency.exponentialRampToValueAtTime(180, t + 0.25); g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.35); },
    shoot() {
      const t = ac.currentTime, n = noise(t, 0.22, 0.35, 900, 'bandpass', sfxGain, 1.5);
      n.f.frequency.setValueAtTime(600, t); n.f.frequency.exponentialRampToValueAtTime(3000, t + 0.2);
      tone(140, t, 0.08, 'square', 0.12, sfxGain);
    },
    pop() { const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(200, t + 0.12); g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15); o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.2); },
    turbo() { const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(1200, t + 0.6); g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7); o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.75); [523, 659, 784, 1046].forEach((f, i) => tone(f, t + 0.1 + i * 0.07, 0.25, 'square', 0.08, sfxGain)); },
    flip() { const t = ac.currentTime; noise(t, 0.05, 0.25, 2500, 'bandpass', sfxGain, 3); },
    match() { const t = ac.currentTime; tone(784, t, 0.2, 'triangle', 0.2, sfxGain); tone(1175, t + 0.09, 0.3, 'triangle', 0.2, sfxGain); },
    nomatch() { const t = ac.currentTime; tone(330, t, 0.15, 'triangle', 0.15, sfxGain); tone(262, t + 0.12, 0.2, 'triangle', 0.15, sfxGain); },
    win() { const t = ac.currentTime; [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, t + i * 0.1, 0.3, 'square', 0.1, sfxGain)); },
    chomp() { const t = ac.currentTime; noise(t, 0.12, 0.5, 900, 'lowpass', sfxGain); noise(t + 0.13, 0.12, 0.5, 700, 'lowpass', sfxGain); tone(110, t, 0.2, 'square', 0.15, sfxGain); },
    slap() { const t = ac.currentTime; const n = noise(t, 0.35, 0.7, 500, 'lowpass', sfxGain); n.f.frequency.exponentialRampToValueAtTime(120, t + 0.3); tone(70, t, 0.3, 'sine', 0.5, sfxGain); },
    ink() { const t = ac.currentTime; const n = noise(t, 0.6, 0.4, 300, 'lowpass', sfxGain); n.f.frequency.exponentialRampToValueAtTime(1500, t + 0.5); bubble(t + 0.1, 200, 0.15); bubble(t + 0.2, 160, 0.15); },
    puff() { const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(700, t + 0.25); g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.35); },
    grind() { clank(); },
    clank() { clank(); },
    roar() { const t = ac.currentTime; for (const f of [55, 58, 82]) { const o = ac.createOscillator(), g = ac.createGain(), fl = ac.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 0.7, t + 1.8); fl.type = 'lowpass'; fl.frequency.value = 600; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 2); o.connect(fl); fl.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 2.1); } },
    bossHit() { const t = ac.currentTime; noise(t, 0.3, 0.6, 1200, 'lowpass', sfxGain); const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.6); g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7); o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.75); },
    bossDie() { const t = ac.currentTime; sfx.explosion(); for (let i = 0; i < 5; i++) tone(220 - i * 30, t + 0.3 + i * 0.18, 0.4, 'square', 0.12, sfxGain); },
    tink() { const t = ac.currentTime; tone(2600, t, 0.08, 'square', 0.08, sfxGain); tone(3400, t + 0.02, 0.1, 'sine', 0.08, sfxGain); },
    spawn() { const t = ac.currentTime; bubble(t, 300, 0.12); bubble(t + 0.06, 260, 0.12); },
    warn() { const t = ac.currentTime; tone(880, t, 0.12, 'square', 0.1, sfxGain); tone(880, t + 0.18, 0.12, 'square', 0.1, sfxGain); },
    gameover() { const t = ac.currentTime; [392, 349, 311, 262].forEach((f, i) => tone(f, t + i * 0.22, 0.35, 'triangle', 0.18, sfxGain)); },
    chest() { const t = ac.currentTime; noise(t, 0.15, 0.3, 600, 'lowpass', sfxGain); [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => tone(f, t + 0.12 + i * 0.06, 0.4, 'triangle', 0.14, sfxGain)); [2093, 2637, 3136].forEach((f, i) => tone(f, t + 0.5 + i * 0.05, 0.3, 'sine', 0.08, sfxGain)); },
    alarm() { const t = ac.currentTime; tone(660, t, 0.15, 'square', 0.14, sfxGain); tone(440, t + 0.16, 0.2, 'square', 0.14, sfxGain); },
    jump() { const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; o.frequency.setValueAtTime(320, t); o.frequency.exponentialRampToValueAtTime(760, t + 0.12); g.gain.setValueAtTime(0.09, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14); o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.16); noise(t, 0.06, 0.15, 2500, 'highpass', sfxGain); },
    land() { const t = ac.currentTime; noise(t, 0.08, 0.35, 700, 'lowpass', sfxGain); tone(90, t, 0.08, 'sine', 0.25, sfxGain); },
    coin() { const t = ac.currentTime; tone(1318, t, 0.08, 'square', 0.07, sfxGain); tone(1976, t + 0.06, 0.18, 'square', 0.07, sfxGain); },
    trick() { const t = ac.currentTime; noise(t, 0.18, 0.18, 3000, 'bandpass', sfxGain, 2); [784, 988, 1175].forEach((f, i) => tone(f, t + i * 0.05, 0.15, 'triangle', 0.1, sfxGain)); },
    crash() { const t = ac.currentTime; noise(t, 0.35, 0.6, 1400, 'lowpass', sfxGain); tone(120, t, 0.25, 'square', 0.15, sfxGain); tone(80, t + 0.1, 0.25, 'square', 0.12, sfxGain); },
    bark() { const t = ac.currentTime; for (const d of [0, 0.22]) { const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(520, t + d); o.frequency.exponentialRampToValueAtTime(260, t + d + 0.12); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 2; g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.35, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.14); o.connect(f); f.connect(g); g.connect(sfxGain); o.start(t + d); o.stop(t + d + 0.16); } },
    horn() { const t = ac.currentTime; for (const f of [233, 294]) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.03); g.gain.setValueAtTime(0.12, t + 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.65); } },
    throwit() { const t = ac.currentTime; const n = noise(t, 0.2, 0.25, 500, 'bandpass', sfxGain, 1.5); n.f.frequency.exponentialRampToValueAtTime(1800, t + 0.18); },
    stomp() { const t = ac.currentTime; noise(t, 0.3, 0.7, 900, 'lowpass', sfxGain); tone(70, t, 0.3, 'sine', 0.6, sfxGain); [523, 784].forEach((f, i) => tone(f, t + 0.1 + i * 0.08, 0.2, 'square', 0.08, sfxGain)); },
    pipe() {
      const t = ac.currentTime;
      // hollow metal clonk when Kai lands on the rim
      tone(196, t, 0.25, 'triangle', 0.35, sfxGain); tone(392, t, 0.12, 'square', 0.08, sfxGain);
      // the slide: a wobbling tone falling down the tube + a hollow rumble
      const o = ac.createOscillator(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(880, t + 0.08); o.frequency.exponentialRampToValueAtTime(110, t + 1.25);
      lfo.frequency.value = 11; lg.gain.value = 40; lfo.connect(lg); lg.connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t + 0.08); g.gain.exponentialRampToValueAtTime(0.22, t + 0.16); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.35);
      o.connect(g); g.connect(sfxGain); o.start(t + 0.08); lfo.start(t + 0.08); o.stop(t + 1.4); lfo.stop(t + 1.4);
      const n = noise(t + 0.1, 1.3, 0.18, 260, 'lowpass', sfxGain, 3); n.f.frequency.exponentialRampToValueAtTime(90, t + 1.3);
    },
    ramp() { const t = ac.currentTime; const n = noise(t, 0.5, 0.25, 400, 'bandpass', sfxGain, 1.2); n.f.frequency.exponentialRampToValueAtTime(3500, t + 0.45); },
    taco() { const t = ac.currentTime; noise(t, 0.06, 0.3, 1500, 'bandpass', sfxGain, 2); noise(t + 0.12, 0.06, 0.3, 1500, 'bandpass', sfxGain, 2); [659, 784, 1046].forEach((f, i) => tone(f, t + 0.25 + i * 0.07, 0.25, 'triangle', 0.14, sfxGain)); },
    swish() { const t = ac.currentTime; const n = noise(t, 0.18, 0.3, 800, 'bandpass', sfxGain, 1.2); n.f.frequency.exponentialRampToValueAtTime(2500, t + 0.15); },
    whack() { const t = ac.currentTime; noise(t, 0.12, 0.7, 700, 'lowpass', sfxGain); tone(180, t, 0.12, 'square', 0.18, sfxGain); [1046, 1318].forEach((f, i) => tone(f, t + 0.05 + i * 0.05, 0.12, 'triangle', 0.08, sfxGain)); },
    pinataPop() { sfx.explosion(); const t = ac.currentTime; [523, 659, 784, 1046, 1318, 1568, 2093].forEach((f, i) => tone(f, t + 0.2 + i * 0.06, 0.3, 'triangle', 0.12, sfxGain)); },
    cheer() { const t = ac.currentTime; for (let i = 0; i < 6; i++) { const n = noise(t + i * 0.05, 0.6, 0.08, 1200 + i * 300, 'bandpass', sfxGain, 3); } },
    siren() { const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; for (let i = 0; i < 4; i++) { o.frequency.setValueAtTime(i % 2 ? 660 : 880, t + i * 0.25); } g.gain.setValueAtTime(0.06, t); g.gain.setValueAtTime(0.06, t + 0.95); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.05); o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 1.1); },
    busted() { const t = ac.currentTime; [392, 370, 349, 330].forEach((f, i) => tone(f, t + i * 0.15, 0.25, 'square', 0.12, sfxGain)); sfx.siren(); },
    flap() { const t = ac.currentTime; const n = noise(t, 0.12, 0.12, 600, 'bandpass', sfxGain, 0.8); n.f.frequency.exponentialRampToValueAtTime(250, t + 0.1); },
    arrow() { const t = ac.currentTime; tone(1568, t, 0.12, 'sine', 0.12, sfxGain); tone(2349, t + 0.03, 0.15, 'sine', 0.08, sfxGain); const n = noise(t, 0.15, 0.12, 4000, 'bandpass', sfxGain, 2); },
    devilHit() { const t = ac.currentTime; tone(523, t, 0.08, 'square', 0.1, sfxGain); tone(392, t + 0.07, 0.08, 'square', 0.1, sfxGain); tone(262, t + 0.14, 0.15, 'square', 0.1, sfxGain); noise(t, 0.2, 0.2, 2000, 'bandpass', sfxGain, 1); },
    thunder() { const t = ac.currentTime; const n = noise(t, 1.3, 0.8, 900, 'lowpass', sfxGain); n.f.frequency.exponentialRampToValueAtTime(80, t + 1.2); noise(t, 0.08, 0.5, 5000, 'highpass', sfxGain); },
    kick() { const t = ac.currentTime; tone(110, t, 0.12, 'sine', 0.5, sfxGain, 0.002); noise(t, 0.06, 0.4, 1200, 'bandpass', sfxGain, 1); },
    goal() { const t = ac.currentTime; [523, 659, 784, 1046].forEach((f, i) => tone(f, t + i * 0.08, 0.3, 'square', 0.1, sfxGain)); for (let i = 0; i < 5; i++) noise(t + i * 0.06, 0.7, 0.07, 1500 + i * 250, 'bandpass', sfxGain, 3); },
    boing() { const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(660, t + 0.1); o.frequency.exponentialRampToValueAtTime(180, t + 0.35); g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.45); },
    buy() { const t = ac.currentTime; noise(t, 0.05, 0.3, 3000, 'bandpass', sfxGain, 2); [1046, 1318, 1568, 2093].forEach((f, i) => tone(f, t + 0.06 + i * 0.05, 0.25, 'triangle', 0.1, sfxGain)); },
    denied() { const t = ac.currentTime; tone(220, t, 0.18, 'square', 0.1, sfxGain); tone(185, t + 0.15, 0.25, 'square', 0.1, sfxGain); },
    chime() { const t = ac.currentTime; [1046, 1318, 1568, 2093, 2637].forEach((f, i) => tone(f, t + i * 0.12, 1.2, 'sine', 0.08, sfxGain)); },
    whale() { const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(180, t); o.frequency.linearRampToValueAtTime(320, t + 0.6); o.frequency.linearRampToValueAtTime(140, t + 1.4); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5); o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 1.6); },
  };
  function bubble(t, f, vol) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 2.6, t + 0.09);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.13);
  }

  // ---- skateboard grind: metal trucks scraping a rail ----
  // 1) lock-in "clank" (inharmonic metal partials)  2) gritty scrape: crackly noise through
  // ringing metal resonances + a lower body  3) short release when Kai leaves the rail
  let grindSrc = null, grindGain = null, gritBuf = null;
  function makeGritBuffer() {
    const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    let env = 0, next = 0, lp = 0;
    for (let i = 0; i < len; i++) {
      if (i >= next) { env = 0.45 + Math.random() * 0.55; next = i + Math.floor(ac.sampleRate * (0.004 + Math.random() * 0.02)); }
      env *= 0.9965;                                   // each grain of grit decays quickly
      const n = Math.random() * 2 - 1;
      lp += (n - lp) * 0.35;                           // slightly darker noise
      d[i] = (n * 0.55 + lp * 0.45) * (0.18 + env);
    }
    return buf;
  }
  function clank() {
    const t = ac.currentTime;
    for (const [f, v, dcy] of [[620, 0.16, 0.18], [1130, 0.12, 0.22], [1870, 0.09, 0.3], [2760, 0.06, 0.25], [3990, 0.04, 0.2]]) tone(f, t, dcy, 'sine', v, sfxGain, 0.002);
    noise(t, 0.05, 0.5, 2200, 'bandpass', sfxGain, 0.8);
    tone(140, t, 0.08, 'triangle', 0.25, sfxGain, 0.002);
  }
  function grindLoop(on) {
    if (!ac || !sfxOn) { if (!on && grindSrc) stopGrind(); return; }
    if (on && !grindSrc) {
      if (!gritBuf) gritBuf = makeGritBuffer();
      clank();
      const t = ac.currentTime;
      grindSrc = ac.createBufferSource(); grindSrc.buffer = gritBuf; grindSrc.loop = true;
      grindSrc.playbackRate.value = 0.95 + Math.random() * 0.1;
      grindGain = ac.createGain();
      grindGain.gain.setValueAtTime(0.0001, t); grindGain.gain.exponentialRampToValueAtTime(0.55, t + 0.05);
      // ringing metal resonances
      for (const [f, q, v] of [[980, 9, 0.9], [1650, 11, 0.7], [2480, 12, 0.55], [3600, 10, 0.35]]) {
        const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * (0.97 + Math.random() * 0.06); bp.Q.value = q;
        const g = ac.createGain(); g.gain.value = v;
        grindSrc.connect(bp); bp.connect(g); g.connect(grindGain);
      }
      // rough lower body of the scrape
      const body = ac.createBiquadFilter(); body.type = 'bandpass'; body.frequency.value = 520; body.Q.value = 0.8;
      const bg = ac.createGain(); bg.gain.value = 0.5;
      grindSrc.connect(body); body.connect(bg); bg.connect(grindGain);
      grindGain.connect(sfxGain);
      grindSrc.start();
    } else if (!on && grindSrc) stopGrind();
  }
  function stopGrind() {
    const src = grindSrc, g = grindGain; grindSrc = null; grindGain = null;
    g.gain.setTargetAtTime(0.0001, ac.currentTime, 0.025);
    setTimeout(() => { try { src.stop(); } catch (e) {} }, 200);
  }

  // ---- "Dale, dale, dale" – traditional piñata song (melody written in its style) ----
  // each line: [syllables (shown as karaoke), midi notes, note lengths in beats, chord root]
  // Melody reconstructed from the published analysis of the traditional song (C major,
  // rising C-E-G-C' arpeggio, C'-A, G-E-C falling, D-G-D, D-F#, E-A, B-G, G-C', 4/4 → 2/4 → 4/4).
  const SONG = [
    ['Dale, dale, dale,',            [60, 64, 67, 72, 69, 69],         [1, 1, 1.5, .5, 1, 1],              48],
    ['no pierdas el tino,',          [67, 67, 67, 64, 64, 60],         [.75, .25, 1, 1, 1, 2],             48],
    ['porque si lo pierdes,',        [62, 67, 62, 66, 67, 67],         [1, 1, 1.5, .5, 1, 1],              43],
    ['pierdes el camino.',           [64, 69, 69, 71, 67, 72],         [.75, .25, 1, 1, 1, 2],             48],
    ['Ya le diste una,',             [67, 67, 67, 67, 69, 67],         [.5, .5, .5, .5, 1, 1],             48],
    ['ya le diste dos,',             [69, 69, 69, 69, 71],             [.5, .5, .5, .5, 2],                41],
    ['ya le diste tres',             [71, 71, 71, 71, 72],             [.5, .5, .5, .5, 2],                43],
    ['y tu tiempo se acabó.',        [72, 72, 71, 69, 67, 64, 62, 60], [.5, .5, .5, .5, .5, .5, 1, 3],     48],
  ];
  const SONG_BPM = 160;
  let songNodes = [], songGain = null;
  function songPlan(repeats) {
    const beat = 60 / SONG_BPM, lines = [];
    let t = 0;
    for (let r = 0; r < repeats; r++) for (let li = 0; li < SONG.length; li++) {
      const [text, notes, lens, root] = SONG[li];
      const dur = lens.reduce((a, b) => a + b, 0) * beat;
      lines.push({ text, start: t, dur, rep: r, notes, lens, root });
      t += dur;
    }
    return { lines, total: t };
  }
  // The piñata song comes from Matt's own MP3 (2 passes, ~34 s). Line timings were measured
  // from the recording (melody onsets); each musical phrase carries two lines of the lyrics.
  const MP3_LINES = (() => {
    const L = SONG.map(r => r[0]);
    const starts = [[2.20, 6.05, 9.85, 13.69], [18.24, 22.29, 26.09, 29.94]];
    const ends = [[6.05, 9.85, 13.69, 18.14], [22.29, 26.09, 29.94, 34.3]];
    const out = [];
    starts.forEach((row, rep) => row.forEach((st, i) => {
      const split = st + 1.72;
      out.push({ text: L[i * 2], start: st, dur: split - st, rep });
      out.push({ text: L[i * 2 + 1], start: split, dur: ends[rep][i] - split, rep });
    }));
    return out;
  })();
  let mp3Buf = null, mp3Src = null;
  function loadMp3() {
    if (mp3Buf || !ac || typeof DALE_MP3 === 'undefined') return;
    fetch(DALE_MP3).then(r => r.arrayBuffer()).then(b => ac.decodeAudioData(b)).then(buf => { mp3Buf = buf; }).catch(() => {});
  }
  function playSong(repeats) {
    if (ac && !mp3Buf) loadMp3();
    if (ac && mp3Buf) {
      stopSong();
      bgPaused = true;
      songGain = ac.createGain(); songGain.gain.value = 1.4; songGain.connect(musicGain);
      mp3Src = ac.createBufferSource(); mp3Src.buffer = mp3Buf; mp3Src.connect(songGain);
      const t0 = ac.currentTime + 0.1;
      mp3Src.start(t0);
      return { lines: MP3_LINES, total: 34.3, t0 };
    }
    return synthSong(repeats);
  }
  function synthSong(repeats) {
    const plan = songPlan(repeats);
    if (!ac) return plan;
    stopSong();
    bgPaused = true;
    songGain = ac.createGain(); songGain.gain.value = 1; songGain.connect(musicGain);
    const t0 = ac.currentTime + 0.25, beat = 60 / SONG_BPM;
    plan.t0 = t0;
    const note = (f, t, d, type, v) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(songGain); o.start(t); o.stop(t + d + 0.05); songNodes.push(o);
    };
    for (const L of plan.lines) {
      let t = t0 + L.start;
      L.notes.forEach((m, i) => {
        const d = L.lens[i] * beat;
        note(mtof(m), t, d * 0.95, 'triangle', 0.22);                // melody (marimba-like)
        note(mtof(m + 12), t, Math.min(d, 0.18), 'sine', 0.06);      // bright attack
        t += d;
      });
      // oom-pah accompaniment
      const beats = Math.round(L.dur / beat);
      for (let b = 0; b < beats; b++) {
        const tb = t0 + L.start + b * beat;
        if (b % 2 === 0) note(mtof(L.root - 12), tb, beat * 0.8, 'triangle', 0.2);
        else for (const iv of [4, 7]) note(mtof(L.root + iv), tb, beat * 0.4, 'square', 0.03);
      }
    }
    return plan;
  }
  function stopSong() {
    if (mp3Src) { try { mp3Src.stop(); } catch (e) {} mp3Src = null; }
    for (const o of songNodes) try { o.stop(); } catch (e) {}
    songNodes = [];
    if (songGain) { try { songGain.disconnect(); } catch (e) {} songGain = null; }
    bgPaused = false;
  }

  // plucked harp note for the melody game
  function harp(m, vol = 0.3) {
    if (!ac) return;
    const t = ac.currentTime, f = mtof(m);
    const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
    o.type = 'triangle'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 2.005;
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(5000, t); lp.frequency.exponentialRampToValueAtTime(900, t + 1.2);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    const g2 = ac.createGain(); g2.gain.value = 0.35;
    o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(sfxOn ? sfxGain : musicGain);
    o.start(t); o2.start(t); o.stop(t + 1.7); o2.stop(t + 1.7);
  }
  return {
    harp, pauseBg(on) { bgPaused = on; },
    playSong, stopSong, songPlan, now: () => (ac ? ac.currentTime : performance.now() / 1000),
    init, grindLoop,
    play(name) { if (ac && sfxOn && sfx[name]) try { sfx[name](); } catch (e) {} },
    setFast, setBoss, setTheme,
    get musicOn() { return musicOn; }, get sfxOn() { return sfxOn; },
    toggleMusic() { musicOn = !musicOn; try { localStorage.setItem('invert-l2-music', musicOn ? 'on' : 'off'); } catch (e) {} if (ac) musicGain.gain.setTargetAtTime(musicOn ? 0.55 : 0, ac.currentTime, 0.05); },
    toggleSfx() { sfxOn = !sfxOn; try { localStorage.setItem('invert-l2-sfx', sfxOn ? 'on' : 'off'); } catch (e) {} if (ac) sfxGain.gain.setTargetAtTime(sfxOn ? 0.9 : 0, ac.currentTime, 0.05); },
  };
})();
