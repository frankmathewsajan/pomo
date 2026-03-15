/**
 * Sound alerts using Web Audio API — no external files needed.
 * Each function creates a short synthesised chime that auto-cleans-up.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
    try {
        if (!ctx || ctx.state === "closed") ctx = new AudioContext();
        return ctx;
    } catch { return null; }
}

/** Helper: play a single tone with attack / decay envelope */
function tone(
    ac: AudioContext,
    freq: number,
    startAt: number,
    duration: number,
    gain: number,
    type: OscillatorType = "sine"
) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;

    // smooth envelope: quick attack → sustain → fade out
    g.gain.setValueAtTime(0, startAt);
    g.gain.linearRampToValueAtTime(gain, startAt + 0.02);
    g.gain.setValueAtTime(gain, startAt + duration * 0.6);
    g.gain.exponentialRampToValueAtTime(0.001, startAt + duration);

    osc.connect(g).connect(ac.destination);
    osc.start(startAt);
    osc.stop(startAt + duration);
}

/**
 * 90 % alert — gentle ascending two-tone chime.
 * Think "heads-up" notification: soft and non-intrusive.
 */
export function play90Sound() {
    const ac = getCtx();
    if (!ac) return;
    const t = ac.currentTime;

    // Two ascending notes (C5 → E5) with a warm triangle wave
    tone(ac, 523.25, t, 0.25, 0.18, "triangle");       // C5
    tone(ac, 659.25, t + 0.2, 0.35, 0.22, "triangle");  // E5

    // Subtle high shimmer
    tone(ac, 1046.5, t + 0.15, 0.4, 0.06, "sine");      // C6 soft
}

/**
 * Task start sound — bright, energising rising arpeggio.
 * Plays when a queued task auto-starts after break.
 */
export function playStartSound() {
    const ac = getCtx();
    if (!ac) return;
    const t = ac.currentTime;

    // Quick rising arpeggio: G4 → B4 → D5 → G5
    tone(ac, 392.00, t, 0.15, 0.20, "triangle");        // G4
    tone(ac, 493.88, t + 0.12, 0.15, 0.22, "triangle");  // B4
    tone(ac, 587.33, t + 0.24, 0.15, 0.24, "triangle");  // D5
    tone(ac, 783.99, t + 0.36, 0.40, 0.26, "sine");      // G5 (sustained)

    // Warm shimmer
    tone(ac, 1567.98, t + 0.36, 0.35, 0.06, "sine");     // G6 soft
}

/**
 * 100 % alert — triumphant three-tone celebratory fanfare.
 * Think "achievement unlocked" — bright and satisfying.
 */
export function play100Sound() {
    const ac = getCtx();
    if (!ac) return;
    const t = ac.currentTime;

    // Three-note rising fanfare (C5 → E5 → G5) with brighter sine wave
    tone(ac, 523.25, t, 0.22, 0.22, "sine");             // C5
    tone(ac, 659.25, t + 0.18, 0.22, 0.25, "sine");      // E5
    tone(ac, 783.99, t + 0.36, 0.5, 0.28, "sine");       // G5 (longer)

    // Harmonic sparkle on top
    tone(ac, 1046.5, t + 0.36, 0.5, 0.08, "sine");       // C6 shimmer
    tone(ac, 1318.51, t + 0.42, 0.45, 0.05, "sine");     // E6 sparkle
}
