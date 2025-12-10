
import * as Tone from 'tone';

class SoundManager {
    // Music Instruments
    kick: Tone.MembraneSynth;
    snare: Tone.NoiseSynth;
    hihat: Tone.MetalSynth;
    bass: Tone.MonoSynth;
    lead: Tone.PolySynth; // Added lead for melody
    
    // FX Instruments
    jumpSynth: Tone.Synth;
    doubleJumpSynth: Tone.PolySynth;
    trickSynth: Tone.PolySynth;
    grindSynth: Tone.MetalSynth;
    crashSynth: Tone.NoiseSynth;
    launchSynth: Tone.Synth;
    sirenSynth: Tone.Synth; 
    sirenLFO: Tone.LFO;     
    metalImpactSynth: Tone.MetalSynth; 
    firecrackerSynth: Tone.NoiseSynth; 
    
    loop: Tone.Sequence | null = null;
    bassLoop: Tone.Sequence | null = null;
    leadLoop: Tone.Sequence | null = null; // Added lead loop
    
    isMuted: boolean = false;
    currentMusicType: 'MAIN' | 'UNDERWORLD' | 'SPACE' | 'NONE' = 'NONE';

    constructor() {
        // --- Music Kit ---
        this.kick = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 6, 
            oscillator: { type: "sine" },
            envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
            volume: -8
        }).toDestination();

        this.snare = new Tone.NoiseSynth({
            noise: { type: "pink" },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0 },
            volume: -12
        }).toDestination();

        this.hihat = new Tone.MetalSynth({
            frequency: 200,
            envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5,
            volume: -14
        }).toDestination();

        this.bass = new Tone.MonoSynth({
            oscillator: { type: "square" }, 
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.2 },
            filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.2, baseFrequency: 300, octaves: 2 },
            volume: -10
        }).toDestination();

        // Happy Lead Synth
        this.lead = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 },
            volume: -14
        }).toDestination();

        // --- FX Kit ---
        this.jumpSynth = new Tone.Synth({
            oscillator: { type: "square" },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
            volume: -10
        }).toDestination();

        this.doubleJumpSynth = new Tone.PolySynth(Tone.Synth, {
            volume: -10,
            envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
        }).toDestination();

        this.trickSynth = new Tone.PolySynth(Tone.Synth, {
            volume: -10,
            oscillator: { type: "sawtooth" }
        }).toDestination();

        this.grindSynth = new Tone.MetalSynth({
            harmonicity: 12,
            resonance: 800,
            modulationIndex: 20,
            envelope: { decay: 0.1, release: 0.1 },
            volume: -15
        }).toDestination();

        this.crashSynth = new Tone.NoiseSynth({
            volume: -5
        }).toDestination();

        this.launchSynth = new Tone.Synth({
             oscillator: { type: "triangle" },
             envelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.1 },
             volume: -8
        }).toDestination();

        this.sirenSynth = new Tone.Synth({
            oscillator: { type: "sawtooth" },
            envelope: { attack: 0.1, decay: 0, sustain: 1, release: 0.5 },
            volume: -10
        }).toDestination();
        
        this.sirenLFO = new Tone.LFO(2, 600, 900).start(); 
        this.sirenLFO.connect(this.sirenSynth.frequency);

        this.metalImpactSynth = new Tone.MetalSynth({
            frequency: 200,
            envelope: { attack: 0.001, decay: 0.2, release: 0.1 },
            harmonicity: 3.1,
            modulationIndex: 16,
            resonance: 2000,
            octaves: 1.5,
            volume: -5
        }).toDestination();

        this.firecrackerSynth = new Tone.NoiseSynth({
            noise: { type: "white" },
            envelope: { attack: 0.001, decay: 0.01, sustain: 0 },
            volume: -5
        }).toDestination();
    }

    async startMusic() {
        this.playMainMusic();
    }

    async playMainMusic() {
        if (this.currentMusicType === 'MAIN') {
            if (Tone.Transport.state !== "started") Tone.Transport.start();
            return;
        }
        this.stopCurrentMusic();
        this.currentMusicType = 'MAIN';
        
        try {
            await Tone.start();
            if (Tone.Transport.state !== "started") Tone.Transport.start();
            Tone.Transport.bpm.value = 165; // Upbeat skate punk tempo

            // --- SECTION A: C - G - Am - F (Original 8 bars) ---
            const bassA = [
                // C Major
                "C2", "C2", "C2", "C2", "C2", "C2", "C2", "C2", "C2", "C2", "E2", "E2", "F2", "F2", "G2", "G2",
                // G Major
                "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "B1", "B1", "C2", "C2", "D2", "D2",
                // A Minor
                "A1", "A1", "A1", "A1", "A1", "A1", "A1", "A1", "A1", "A1", "C2", "C2", "D2", "D2", "E2", "E2",
                // F Major
                "F1", "F1", "F1", "F1", "F1", "F1", "F1", "F1", "F1", "F1", "A1", "A1", "C2", "C2", "G2", "G2"
            ];

            const leadA = [
                // Bar 1-2 (C)
                "E4", null, "E4", "D4", "C4", null, "G3", null, "C4", "D4", "E4", "F4", "E4", "D4", "C4", "G3",
                // Bar 3-4 (G)
                "D4", null, "D4", "C4", "B3", null, "G3", null, "B3", "C4", "D4", "E4", "D4", "C4", "B3", "A3",
                // Bar 5-6 (Am)
                "C4", null, "C4", "B3", "A3", null, "E3", null, "A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4",
                // Bar 7-8 (F)
                "F4", null, "A4", null, "C5", null, "A4", null, "G4", "F4", "E4", "D4", "C4", "B3", "C4", null
            ];

            // --- SECTION B: Am - F - C - G (New Bridge 8 bars) ---
            const bassB = [
                // Am
                "A1", "A1", "A1", "A1", "A1", "A1", "A1", "A1", "A1", "A1", "C2", "C2", "E2", "E2", "G2", "G2",
                // F
                "F1", "F1", "F1", "F1", "F1", "F1", "F1", "F1", "F1", "F1", "A1", "A1", "C2", "C2", "E2", "E2",
                // C
                "C2", "C2", "C2", "C2", "C2", "C2", "C2", "C2", "C2", "C2", "G2", "G2", "E2", "E2", "D2", "D2",
                // G
                "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "B1", "B1", "D2", "D2", "G2", "G2"
            ];

            const leadB = [
                // Am - Melancholic/High
                "A4", null, "C5", "B4", "A4", "G4", "A4", "E4", "A4", "B4", "C5", "D5", "E5", "C5", "A4", "G4",
                // F - Lift
                "F4", null, "A4", "G4", "F4", "E4", "F4", "C4", "F4", "G4", "A4", "B4", "C5", "A4", "F4", "E4",
                // C - Resolve high
                "E5", null, "G5", "F5", "E5", "D5", "C5", "B4", "C5", "D5", "E5", "G5", "E5", "D5", "C5", "B4",
                // G - Turnaround
                "D5", null, "B4", "A4", "G4", "F#4", "G4", "D4", "G4", "A4", "B4", "C5", "D5", "C5", "B4", "A4"
            ];

            // Structure: A -> A -> B -> Repeat
            const fullBass = [...bassA, ...bassA, ...bassB];
            const fullLead = [...leadA, ...leadA, ...leadB];
            
            this.bassLoop = new Tone.Sequence((time, note) => {
                if (this.isMuted || !note) return;
                this.bass.triggerAttackRelease(note, "8n", time);
            }, fullBass, "8n").start(0);

            this.leadLoop = new Tone.Sequence((time, note) => {
                if (this.isMuted || !note) return;
                this.lead.triggerAttackRelease(note, "8n", time);
            }, fullLead, "8n").start(0);

            // Driving Drum Beat (Punk Rock) - Keeps repeating over the full structure
            const drumPattern = [
                { k: true, s: false, h: true }, { k: false, s: false, h: true }, 
                { k: false, s: true, h: true }, { k: false, s: false, h: true },
                { k: false, s: false, h: true }, { k: true, s: false, h: true }, 
                { k: false, s: true, h: true }, { k: false, s: false, h: true },
                
                { k: true, s: false, h: true }, { k: true, s: false, h: true },
                { k: false, s: true, h: true }, { k: false, s: false, h: true },
                { k: false, s: false, h: true }, { k: false, s: false, h: true },
                { k: true, s: true, h: true }, { k: false, s: true, h: true } // Snare roll finish
            ];

            this.loop = new Tone.Sequence((time, step) => {
                if (this.isMuted) return;
                const s = drumPattern[step % drumPattern.length];
                if (s.k) this.kick.triggerAttackRelease("C1", "8n", time);
                if (s.s) this.snare.triggerAttackRelease("8n", time);
                if (s.h) this.hihat.triggerAttackRelease("32n", time, 0.3);
            }, Array.from({length: 16}, (_, i) => i), "8n").start(0);

        } catch (e) {
            console.error("Main music start failed", e);
        }
    }

    async playSpaceMusic() {
        if (this.currentMusicType === 'SPACE') {
            if (Tone.Transport.state !== "started") Tone.Transport.start();
            return;
        }
        this.stopCurrentMusic();
        this.currentMusicType = 'SPACE';

        try {
            await Tone.start();
            if (Tone.Transport.state !== "started") Tone.Transport.start();
            
            // Increased from 92 to 108 for a slightly faster, driving feel
            Tone.Transport.bpm.value = 108; 

            // --- PROGRESSION: D - A - Bm - G (I - V - vi - IV in D Major) ---
            // Deep Sustained Bass
            const bassNotes = [
                // Bar 1: D Major
                "D1", null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null,
                // Bar 2: A Major
                "A1", null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null,
                // Bar 3: B Minor
                "B1", null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null,
                // Bar 4: G Major
                "G1", null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null
            ];
            
            this.bassLoop = new Tone.Sequence((time, note) => {
                if (this.isMuted || !note) return;
                // Deep sub-bass feel
                this.bass.triggerAttackRelease(note, "1n", time, 0.8);
            }, bassNotes, "16n").start(0);

            // --- Sparse, Plucky "Cloud" Lead (Minimalist) ---
            // Notes strictly from D Major scale
            const leadNotes = [
                // Phrase 1 (Over D)
                null, "F#5", null, "A5", null, "D6", null, null,
                null, null, "A5", "F#5", "E5", null, null, null,
                // Phrase 2 (Over A)
                null, "E5", null, "C#6", null, "E6", null, "A5",
                null, "C#6", "A5", "E5", null, null, null, null,
                // Phrase 3 (Over Bm)
                "D5", null, "F#5", null, "B5", null, null, null,
                null, "D6", "B5", "F#5", null, null, null, null,
                // Phrase 4 (Over G)
                null, "G5", null, "B5", null, "D6", null, "G5",
                "F#5", "E5", null, null, null, null, null, null
            ];

            this.leadLoop = new Tone.Sequence((time, note) => {
                if (this.isMuted || !note) return;
                // Short attack, delay-friendly pluck
                this.lead.triggerAttackRelease(note, "32n", time, 0.4);
            }, leadNotes, "16n").start(0);

            // --- Modern Trap/Chill Drum Pattern ---
            const drumPatternLength = 64;
            const drumPattern: {k: boolean, s: boolean, h: boolean}[] = [];
            
            for(let i=0; i<drumPatternLength; i++) {
                let k = false, s = false, h = false;
                const stepInBar = i % 16;

                // Kick: Modern syncopated pattern
                // 1 .... .... ....
                if (stepInBar === 0) k = true;
                // Extra kicks for bounce
                if (i === 10 || i === 26 || i === 36 || i === 58) k = true;

                // Snare: Half-time feel (on count 3 of a 4/4 bar, step 8)
                if (stepInBar === 8) s = true;

                // Hi-hat: Rolling 16ths with gaps and trap rolls
                if (stepInBar % 2 === 0) h = true; // 8th notes
                
                // Add 32nd note rolls occasionally
                if (i % 16 === 14 || i % 16 === 15) h = Math.random() > 0.5; 
                if (i === 33 || i === 34 || i === 35) h = true; // Quick triplet roll

                drumPattern.push({k, s, h});
            }

            this.loop = new Tone.Sequence((time, step) => {
                if (this.isMuted) return;
                const s = drumPattern[step % drumPattern.length];
                if (s.k) this.kick.triggerAttackRelease("C1", "8n", time);
                if (s.s) this.snare.triggerAttackRelease("16n", time, 0.5);
                if (s.h) {
                    // Crisp, tight hi-hats
                    this.hihat.triggerAttackRelease("64n", time, 0.15 + Math.random() * 0.1);
                }
            }, Array.from({length: drumPatternLength}, (_, i) => i), "16n").start(0);

        } catch (e) {
            console.error("Space music start failed", e);
        }
    }

    async playUnderworldMusic() {
        if (this.currentMusicType === 'UNDERWORLD') {
            if (Tone.Transport.state !== "started") Tone.Transport.start();
            return;
        }
        this.stopCurrentMusic();
        this.currentMusicType = 'UNDERWORLD';

        try {
            await Tone.start();
            if (Tone.Transport.state !== "started") Tone.Transport.start();
            Tone.Transport.bpm.value = 110; // Slower, menacing

            // Drone Bass
            const bassNotes = ["C1", null, null, null, "G1", null, "F1", null];
            this.bassLoop = new Tone.Sequence((time, note) => {
                if (this.isMuted || !note) return;
                this.bass.triggerAttackRelease(note, "1n", time, 0.9); 
            }, bassNotes, "2n").start(0);

            // Sparse Industrial Drums
            this.loop = new Tone.Sequence((time, col) => {
                if (this.isMuted) return;
                if (col === 0) this.kick.triggerAttackRelease("C1", "8n", time);
                if (col === 4) this.metalImpactSynth.triggerAttackRelease(100, "16n", time, 0.6);
                if (col === 8) this.kick.triggerAttackRelease("C1", "8n", time);
                if (col === 12) this.snare.triggerAttackRelease("8n", time, 0.5);
            }, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], "16n").start(0);

        } catch (e) {
            console.error("Underworld music start failed", e);
        }
    }

    stopCurrentMusic() {
        if (this.loop) {
            this.loop.dispose();
            this.loop = null;
        }
        if (this.bassLoop) {
            this.bassLoop.dispose();
            this.bassLoop = null;
        }
        if (this.leadLoop) {
            this.leadLoop.dispose();
            this.leadLoop = null;
        }
    }

    pauseMusic() {
        if (this.currentMusicType !== 'NONE') {
             Tone.Transport.pause();
        }
    }

    resumeMusic() {
        if (this.currentMusicType !== 'NONE') {
             Tone.Transport.start();
        }
    }

    stopMusic() {
        this.currentMusicType = 'NONE';
        try {
            Tone.Transport.stop();
            Tone.Transport.cancel(0); 
            this.stopCurrentMusic();
        } catch (e) {
            console.error("Audio stop failed", e);
        }
    }

    private getSafeTime() {
        return Tone.now() + 0.05;
    }

    playJump() {
        if (this.isMuted) return;
        try { this.jumpSynth.triggerAttackRelease("A4", "16n", this.getSafeTime()); } catch(e){}
    }

    playDoubleJump() {
        if (this.isMuted) return;
        try { this.doubleJumpSynth.triggerAttackRelease(["E4", "G4"], "16n", this.getSafeTime()); } catch(e){}
    }

    playTrick() {
        if (this.isMuted) return;
        try { this.trickSynth.triggerAttackRelease(["C5", "E5"], "16n", this.getSafeTime()); } catch(e){}
    }

    playGrind() {
        if (this.isMuted) return;
        try { 
            this.grindSynth.triggerAttackRelease(200, "32n", this.getSafeTime()); 
        } catch(e){}
    }

    playLaunch() {
        if (this.isMuted) return;
        try {
            const now = this.getSafeTime();
            this.launchSynth.triggerAttackRelease("C5", "8n", now);
            this.launchSynth.frequency.rampTo("C6", 0.3, now);
        } catch(e){}
    }

    playCrash() {
        if (this.isMuted) return;
        try { this.crashSynth.triggerAttackRelease("8n", this.getSafeTime()); } catch(e){}
    }

    playMetalHit() {
        if (this.isMuted) return;
        try { this.metalImpactSynth.triggerAttackRelease(300, "16n", this.getSafeTime()); } catch(e){}
    }

    playSiren() {
        if (this.isMuted) return;
        try {
             this.sirenSynth.triggerAttackRelease("C4", 1.5, this.getSafeTime()); 
        } catch(e){}
    }

    playFirecracker() {
        if (this.isMuted) return;
        try {
             const now = this.getSafeTime();
             this.firecrackerSynth.triggerAttackRelease("32n", now);
             this.firecrackerSynth.triggerAttackRelease("32n", now + 0.05);
             this.firecrackerSynth.triggerAttackRelease("32n", now + 0.1);
        } catch(e){}
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        Tone.Destination.mute = this.isMuted;
    }
}

let instance: SoundManager | null = null;

export const getSoundManager = () => {
    if (!instance) {
        try {
             instance = new SoundManager();
        } catch (e) {
            console.error("Tone.js init failed", e);
            return {
                startMusic: async () => {},
                playMainMusic: async () => {},
                playUnderworldMusic: async () => {},
                playSpaceMusic: async () => {},
                pauseMusic: () => {},
                resumeMusic: () => {},
                stopMusic: () => {},
                playJump: () => {},
                playDoubleJump: () => {},
                playTrick: () => {},
                playGrind: () => {},
                playLaunch: () => {},
                playCrash: () => {},
                playSiren: () => {},
                playMetalHit: () => {},
                playFirecracker: () => {},
                toggleMute: () => {},
                isMuted: true
            } as any as SoundManager;
        }
    }
    return instance;
};
