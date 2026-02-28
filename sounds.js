// Sound profiles for scratch effects
const soundProfiles = {
        gritty: {
                    bandpassFreq: 3000,
                    bandpassQ: 0.8,
                    highpassFreq: 800,
                    baseFreq: 1500,
                    freqRange: 100,
                    baseVol: 0.04,
                    volRange: 0.15,
                    extraFilters: null,
        },
        coin: {
                    bandpassFreq: 5500,
                    bandpassQ: 3.0,
                    highpassFreq: 2000,
                    baseFreq: 4000,
                    freqRange: 150,
                    baseVol: 0.03,
                    volRange: 0.10,
                    extraFilters(ctx) {
                                    const peak = ctx.createBiquadFilter();
                                    peak.type = 'peaking';
                                    peak.frequency.value = 7500;
                                    peak.Q.value = 5;
                                    peak.gain.value = 8;
                                    return [peak];
                    },
        },
        soft: {
                    bandpassFreq: 1200,
                    bandpassQ: 0.4,
                    highpassFreq: 300,
                    baseFreq: 800,
                    freqRange: 60,
                    baseVol: 0.03,
                    volRange: 0.08,
                    extraFilters(ctx) {
                                    const lp = ctx.createBiquadFilter();
                                    lp.type = 'lowpass';
                                    lp.frequency.value = 2500;
                                    lp.Q.value = 0.5;
                                    return [lp];
                    },
        },
        crackle: {
                    bandpassFreq: 4000,
                    bandpassQ: 0.3,
                    highpassFreq: 600,
                    baseFreq: 2000,
                    freqRange: 200,
                    baseVol: 0.02,
                    volRange: 0.12,
                    extraFilters(ctx) {
                                    const shaper = ctx.createWaveShaper();
                                    const samples = 256;
                                    const curve = new Float32Array(samples);
                                    for (let i = 0; i < samples; i++) {
                                                        const x = (i * 2) / samples - 1;
                                                        curve[i] = Math.sign(x) * Math.pow(Math.abs(x), 0.3);
                                    }
                                    shaper.curve = curve;
                                    shaper.oversample = '2x';
                                    return [shaper];
                    },
        },
        sandpaper: {
                    bandpassFreq: 2200,
                    bandpassQ: 0.5,
                    highpassFreq: 400,
                    baseFreq: 1200,
                    freqRange: 80,
                    baseVol: 0.02,
                    volRange: 0.08,
                    extraFilters(ctx) {
                                    const notch = ctx.createBiquadFilter();
                                    notch.type = 'notch';
                                    notch.frequency.value = 3000;
                                    notch.Q.value = 2;
                                    const shaper = ctx.createWaveShaper();
                                    const samples = 256;
                                    const curve = new Float32Array(samples);
                                    for (let i = 0; i < samples; i++) {
                                                        const x = (i * 2) / samples - 1;
                                                        curve[i] = Math.tanh(x * 2.5);
                                    }
                                    shaper.curve = curve;
                                    return [notch, shaper];
                    },
        },
        fizz: {
                    bandpassFreq: 8000,
                    bandpassQ: 1.5,
                    highpassFreq: 4000,
                    baseFreq: 6000,
                    freqRange: 200,
                    baseVol: 0.02,
                    volRange: 0.08,
                    extraFilters(ctx) {
                                    const peak = ctx.createBiquadFilter();
                                    peak.type = 'peaking';
                                    peak.frequency.value = 10000;
                                    peak.Q.value = 3;
                                    peak.gain.value = 6;
                                    const lp = ctx.createBiquadFilter();
                                    lp.type = 'lowpass';
                                    lp.frequency.value = 12000;
                                    lp.Q.value = 0.7;
                                    return [peak, lp];
                    },
        },
        rumble: {
                    bandpassFreq: 600,
                    bandpassQ: 0.6,
                    highpassFreq: 80,
                    baseFreq: 300,
                    freqRange: 50,
                    baseVol: 0.06,
                    volRange: 0.18,
                    extraFilters(ctx) {
                                    const shelf = ctx.createBiquadFilter();
                                    shelf.type = 'lowshelf';
                                    shelf.frequency.value = 400;
                                    shelf.gain.value = 6;
                                    const lp = ctx.createBiquadFilter();
                                    lp.type = 'lowpass';
                                    lp.frequency.value = 1800;
                                    lp.Q.value = 0.4;
                                    return [shelf, lp];
                    },
        },
        zap: {
                    bandpassFreq: 3500,
                    bandpassQ: 2.0,
                    highpassFreq: 1000,
                    baseFreq: 2500,
                    freqRange: 180,
                    baseVol: 0.02,
                    volRange: 0.10,
                    extraFilters(ctx) {
                                    const peak1 = ctx.createBiquadFilter();
                                    peak1.type = 'peaking';
                                    peak1.frequency.value = 4500;
                                    peak1.Q.value = 8;
                                    peak1.gain.value = 10;
                                    const peak2 = ctx.createBiquadFilter();
                                    peak2.type = 'peaking';
                                    peak2.frequency.value = 6000;
                                    peak2.Q.value = 10;
                                    peak2.gain.value = 8;
                                    const shaper = ctx.createWaveShaper();
                                    const samples = 256;
                                    const curve = new Float32Array(samples);
                                    for (let i = 0; i < samples; i++) {
                                                        const x = (i * 2) / samples - 1;
                                                        curve[i] = Math.max(-0.6, Math.min(0.6, x * 3));
                                    }
                                    shaper.curve = curve;
                                    return [peak1, peak2, shaper];
                    },
        },
};

// Audio engine state
let currentSound = 'gritty';
let currentComplete = 'sparkle';
let audioCtx = null;
let noiseBuffer = null;
let activeNodes = null;
let activeScratchCount = 0;

function initAudio() {
        if (!audioCtx) {
                    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const bufferSize = audioCtx.sampleRate * 2;
                    noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                    const data = noiseBuffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                                    data[i] = Math.random() * 2 - 1;
                    }
        }
        // Mobile browsers suspend AudioContext until resumed inside a user gesture
    if (audioCtx.state === 'suspended') {
                audioCtx.resume();
    }
}

function startScratchSound() {
        initAudio();
        activeScratchCount++;
        if (activeScratchCount > 1) return;
        const p = soundProfiles[currentSound];
        const source = audioCtx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;
        const bandpass = audioCtx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = p.bandpassFreq;
        bandpass.Q.value = p.bandpassQ;
        const highpass = audioCtx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = p.highpassFreq;
        const gain = audioCtx.createGain();
        gain.gain.value = p.baseVol;
        let chain = [bandpass, highpass];
        if (p.extraFilters) {
                    chain = chain.concat(p.extraFilters(audioCtx));
        }
        chain.push(gain);
        source.connect(chain[0]);
        for (let i = 0; i < chain.length - 1; i++) {
                    chain[i].connect(chain[i + 1]);
        }
        gain.connect(audioCtx.destination);
        source.start();
        activeNodes = { source, gain, filter: bandpass, profile: p };
}

function updateScratchSound(speed) {
        if (!activeNodes) return;
        const { filter, gain, profile: p } = activeNodes;
        const clampedSpeed = Math.min(speed, 40);
        const freq = p.baseFreq + clampedSpeed * p.freqRange;
        const vol = p.baseVol + (clampedSpeed / 40) * p.volRange;
        filter.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.03);
        gain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.03);
}

function stopScratchSound() {
        activeScratchCount = Math.max(0, activeScratchCount - 1);
        if (activeScratchCount > 0) return;
        if (activeNodes) {
                    activeNodes.gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
                    const src = activeNodes.source;
                    setTimeout(() => {
                                    try { src.stop(); } catch(e) {}
                    }, 100);
                    activeNodes = null;
        }
}

// Completion sound helpers
function playNote(freq, start, duration, type, vol) {
        const osc = audioCtx.createOscillator();
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(vol || 0.12, start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(g);
        g.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + duration);
}

function playShimmer(start, duration, vol) {
        const shimmer = audioCtx.createBufferSource();
        shimmer.buffer = noiseBuffer;
        const f = audioCtx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 6000;
        f.Q.value = 2;
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(vol || 0.04, start + 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, start + duration);
        shimmer.connect(f);
        f.connect(g);
        g.connect(audioCtx.destination);
        shimmer.start(start);
        shimmer.stop(start + duration);
}

// Completion sound profiles
const completeSounds = {
        chime() {
                    const now = audioCtx.currentTime;
                    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                                    playNote(freq, now + i * 0.08, 0.8, 'sine', 0.12);
                    });
                    playShimmer(now + 0.1, 0.9);
        },
        sparkle() {
                    const now = audioCtx.currentTime;
                    const notes = [1318, 1175, 1047, 988, 1047, 1175, 1318, 1568, 2093];
                    notes.forEach((freq, i) => {
                                    playNote(freq, now + i * 0.05, 0.35, 'sine', 0.08);
                    });
                    playShimmer(now, 0.6, 0.05);
        },
        winner() {
                    const now = audioCtx.currentTime;
                    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.50];
                    scale.forEach((freq, i) => {
                                    playNote(freq, now + i * 0.07, 0.2, 'triangle', 0.08);
                    });
                    const chordStart = now + scale.length * 0.07;
                    [1046.50, 1318.51, 1567.98, 2093.00].forEach(freq => {
                                    playNote(freq, chordStart, 1.2, 'sine', 0.10);
                    });
                    playShimmer(chordStart, 1.0, 0.04);
        },
        unlock() {
                    const now = audioCtx.currentTime;
                    const click = audioCtx.createBufferSource();
                    click.buffer = noiseBuffer;
                    const clickFilter = audioCtx.createBiquadFilter();
                    clickFilter.type = 'bandpass';
                    clickFilter.frequency.value = 3000;
                    clickFilter.Q.value = 5;
                    const clickGain = audioCtx.createGain();
                    clickGain.gain.setValueAtTime(0.15, now);
                    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                    click.connect(clickFilter);
                    clickFilter.connect(clickGain);
                    clickGain.connect(audioCtx.destination);
                    click.start(now);
                    click.stop(now + 0.06);
                    const open = now + 0.12;
                    [880, 1108.73, 1318.51, 1760].forEach(freq => {
                                    playNote(freq, open, 0.9, 'sine', 0.10);
                    });
                    playShimmer(open + 0.05, 0.7, 0.04);
        },
        tada() {
                    const now = audioCtx.currentTime;
                    playNote(261.63, now, 0.15, 'triangle', 0.10);
                    setTimeout(() => {
                                    const t = audioCtx.currentTime;
                                    [523.25, 659.25, 783.99, 1046.50].forEach(freq => {
                                                        playNote(freq, t, 1.0, 'sine', 0.09);
                                    });
                                    playShimmer(t, 0.8, 0.04);
                    }, 180);
        },
};

function playCompleteSound() {
        initAudio();
        completeSounds[currentComplete]();
}
