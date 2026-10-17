// Lumina's voice: reading aloud with Vox Machina's eSpeak NG engine.
//
// Two uses:
//   read()  - the clear reading voice: a chapter, a paragraph or a verse, read
//             piece by piece. Each piece is made while the one before it plays,
//             so reading starts almost at once and runs on without gaps.
//   play()  - the playful voices: one highlighted passage through a Vox Machina
//             preset (choir, ring modulator, singing on a psalm tone...).
//
// Everything is made on the device by eSpeak NG's rule-based formant synthesis.
// Playback goes through one <audio> element, which iPhone Safari keeps working
// when a Web Audio context would be suspended (see Vox Machina's app.js).

import { preload, speak, render, toWav, stretchVowels } from './engine.js';
import { sing } from './sing.js';

export { preload };

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
// The clear reading voice. These defaults were chosen by measurement: a speech
// recognizer transcribed Scripture read by each voice, and the voice, accent,
// speed and spacing with the fewest mistakes won (see tools/voice-clarity.md).
export const READ_DEFAULTS = {
  voice: 'en-us', variant: 'm3', speed: 160, pitch: 50, range: 50, gap: 4, vowel: 1,
  pause: 0.6, clarity: true, follow: true,
};
// Voices offered for reading: the plain human-like eSpeak variants.
// (The robot, whisper and croak variants live with the playful presets.)
export const READ_VOICES = [
  ['', 'Default'], ['m1', 'Male 1'], ['m2', 'Male 2'], ['m3', 'Male 3 (clearest)'], ['m4', 'Male 4'], ['m5', 'Male 5'],
  ['m6', 'Male 6'], ['m7', 'Male 7'], ['f1', 'Female 1'], ['f2', 'Female 2'], ['f3', 'Female 3'],
  ['f4', 'Female 4'], ['f5', 'Female 5'], ['edward', 'Edward'], ['norbert', 'Norbert'], ['announcer', 'Announcer'],
];
export const ACCENTS = [
  ['en-us', 'American'], ['en', 'British'], ['en-gb-x-rp', 'British (RP)'], ['en-gb-scotland', 'Scottish'],
  ['en-029', 'Caribbean'],
];

// The playful presets: Vox Machina's own, unchanged. Robot amount is set
// separately (50% to start), so each is heard half way to its full effect.
const FX_DEFAULTS = {
  voice: 'en-us', variant: '', pitch: 50, pitchRange: 50, speed: 160, wordGap: 0, speakVowel: 1,
  robot: 0.5, bits: 10, crushRate: 2, ringFreq: 60, ringMix: 0.3,
  choirMix: 0, choirVoices: 3, delayTime: 0.25, delayFeedback: 0.3, delayMix: 0.1,
  reverbSize: 1.5, reverbMix: 0.2,
  mode: 'speak', key: 'Bm', octave: 0, style: 'psalmTone', harmony: 'none', seed: 1,
  carrierChoir: false, bpm: 100, sustain: 0.8, glide: 0.03, melisma: 0,
  wobbleRate: 3, wobbleDepth: 0, gateRate: 3, gateDepth: 0,
};
export const PRESETS = {
  'Kraftwerk': { variant: 'robosoft', pitch: 40, pitchRange: 0, speed: 140, wordGap: 4,
    bits: 12, crushRate: 1.5, ringFreq: 30, ringMix: 0.45, choirMix: 0.4, choirVoices: 2,
    delayTime: 0.375, delayFeedback: 0.35, delayMix: 0.25, reverbSize: 0.8, reverbMix: 0.1 },
  'Cold Cathedral': { variant: 'm3', pitch: 30, pitchRange: 10, speed: 120, wordGap: 8,
    bits: 16, crushRate: 1, ringFreq: 110, ringMix: 0.15, choirMix: 1.1, choirVoices: 5,
    delayTime: 0.6, delayFeedback: 0.2, delayMix: 0.15, reverbSize: 5, reverbMix: 1.1 },
  '8-bit Monk': { variant: 'm1', pitch: 35, pitchRange: 0, speed: 150, wordGap: 2,
    bits: 4, crushRate: 8, ringFreq: 220, ringMix: 0.1, choirMix: 0, choirVoices: 1,
    delayTime: 0.18, delayFeedback: 0.25, delayMix: 0.2, reverbSize: 0.5, reverbMix: 0.05 },
  'Dalek Lector': { variant: 'croak', pitch: 45, pitchRange: 20, speed: 150, wordGap: 0,
    bits: 16, crushRate: 1, ringFreq: 30, ringMix: 1, choirMix: 0, choirVoices: 1,
    delayTime: 0.1, delayFeedback: 0, delayMix: 0, reverbSize: 0.6, reverbMix: 0.1 },
  'Gregorian Machine': { mode: 'sing', style: 'psalmTone', harmony: 'organum', variant: 'm3', bpm: 92,
    sustain: 0.85, glide: 0.04, carrierChoir: true,
    bits: 16, crushRate: 1, ringFreq: 110, ringMix: 0, choirMix: 0.5, choirVoices: 3,
    delayTime: 0.5, delayFeedback: 0.2, delayMix: 0.1, reverbSize: 4.5, reverbMix: 0.9 },
  'Vocoder Hymn': { mode: 'sing', style: 'hymn', harmony: 'choir', variant: '', bpm: 96,
    sustain: 0.8, glide: 0.02, carrierChoir: true,
    bits: 16, crushRate: 1, ringFreq: 60, ringMix: 0, choirMix: 0.3, choirVoices: 2,
    delayTime: 0.31, delayFeedback: 0.3, delayMix: 0.15, reverbSize: 2.5, reverbMix: 0.5 },
  'Robot Arpeggio': { mode: 'sing', style: 'arpeggio', harmony: 'octave', variant: 'robosoft', bpm: 124,
    sustain: 0.5, glide: 0.005, carrierChoir: false,
    bits: 10, crushRate: 2, ringFreq: 30, ringMix: 0.15, choirMix: 0, choirVoices: 1,
    delayTime: 0.242, delayFeedback: 0.4, delayMix: 0.25, reverbSize: 1.2, reverbMix: 0.2 },
  'Night Office': { mode: 'sing', style: 'psalmTone', harmony: 'organum', variant: 'm7', octave: -1, bpm: 72,
    sustain: 0.9, glide: 0.06, carrierChoir: true,
    bits: 16, crushRate: 1, ringFreq: 55, ringMix: 0.05, choirMix: 1.3, choirVoices: 6,
    delayTime: 0.83, delayFeedback: 0.35, delayMix: 0.2, reverbSize: 6, reverbMix: 1.4 },
  'Seraphim': { mode: 'sing', style: 'hymn', harmony: 'choir', variant: 'f2', octave: 1, bpm: 80,
    sustain: 0.9, glide: 0.05, carrierChoir: true,
    bits: 16, crushRate: 1, ringFreq: 1200, ringMix: 0.08, choirMix: 1.2, choirVoices: 5,
    delayTime: 0.375, delayFeedback: 0.45, delayMix: 0.25, reverbSize: 5.5, reverbMix: 1.2 },
  'Crypt': { variant: 'm7', pitch: 8, pitchRange: 15, speed: 115, wordGap: 6,
    bits: 11, crushRate: 2.5, ringFreq: 38, ringMix: 0.35, choirMix: 0.8, choirVoices: 3,
    delayTime: 0.7, delayFeedback: 0.3, delayMix: 0.15, reverbSize: 4.5, reverbMix: 0.9 },
  'Abbey Ruins': { variant: 'whisper', pitch: 40, pitchRange: 30, speed: 125, wordGap: 10,
    bits: 9, crushRate: 4, ringFreq: 300, ringMix: 0.1, choirMix: 0.6, choirVoices: 3,
    delayTime: 0.9, delayFeedback: 0.6, delayMix: 0.35, reverbSize: 6, reverbMix: 1.3 },
  'Satellite Psalm': { variant: 'Tweaky', pitch: 60, pitchRange: 0, speed: 150, wordGap: 3,
    bits: 12, crushRate: 1.5, ringFreq: 880, ringMix: 0.5, choirMix: 0.3, choirVoices: 2,
    delayTime: 0.45, delayFeedback: 0.55, delayMix: 0.35, reverbSize: 2.5, reverbMix: 0.4 },
  'Jubilus': { mode: 'sing', style: 'psalmTone', harmony: 'organum', variant: 'm3', octave: 0, bpm: 84,
    sustain: 1.25, melisma: 0.75, glide: 0.035, carrierChoir: true,
    bits: 16, crushRate: 1, ringFreq: 55, ringMix: 0, choirMix: 1.1, choirVoices: 5,
    delayTime: 0.71, delayFeedback: 0.25, delayMix: 0.12, reverbSize: 6, reverbMix: 1.3 },
  'West Coast Talkbox': { mode: 'sing', style: 'gfunk', harmony: 'none', variant: '', octave: 1, bpm: 92,
    sustain: 1, melisma: 0.15, glide: 0.08, carrierChoir: false,
    bits: 16, crushRate: 1, ringFreq: 60, ringMix: 0, choirMix: 0.15, choirVoices: 2,
    delayTime: 0.163, delayFeedback: 0.15, delayMix: 0.12, reverbSize: 0.8, reverbMix: 0.15 },
  'Boom-bap Lector': { mode: 'sing', style: 'hiphop', harmony: 'none', variant: 'm1', octave: 0, bpm: 90,
    sustain: 0.4, melisma: 0, glide: 0.01, carrierChoir: false,
    bits: 12, crushRate: 2, ringFreq: 60, ringMix: 0.1, choirMix: 0, choirVoices: 1,
    delayTime: 0.333, delayFeedback: 0.2, delayMix: 0.12, reverbSize: 0.6, reverbMix: 0.1 },
  'Trap Psalm': { mode: 'sing', style: 'trap', harmony: 'octave', variant: 'm7', octave: -1, bpm: 140,
    sustain: 0.6, melisma: 0, glide: 0.04, carrierChoir: false, gateRate: 3, gateDepth: 0.2,
    bits: 14, crushRate: 1, ringFreq: 60, ringMix: 0, choirMix: 0.2, choirVoices: 2,
    delayTime: 0.214, delayFeedback: 0.3, delayMix: 0.15, reverbSize: 1.5, reverbMix: 0.25 },
  'Basilica Dub': { mode: 'sing', style: 'dubstep', harmony: 'organum', variant: 'm3', octave: -1, bpm: 140,
    sustain: 0.85, glide: 0.03, carrierChoir: true, wobbleRate: 4, wobbleDepth: 0.75, gateDepth: 0,
    bits: 16, crushRate: 1, ringFreq: 60, ringMix: 0, choirMix: 0.5, choirVoices: 3,
    delayTime: 0.32, delayFeedback: 0.3, delayMix: 0.15, reverbSize: 4, reverbMix: 0.7 },
  'Dubstep Doom': { mode: 'sing', style: 'dubstep', harmony: 'octave', variant: 'Demonic', octave: -1, bpm: 140,
    sustain: 0.9, glide: 0.02, carrierChoir: false, wobbleRate: 3, wobbleDepth: 1, gateDepth: 0,
    bits: 8, crushRate: 2, ringFreq: 45, ringMix: 0.2, choirMix: 0, choirVoices: 1,
    delayTime: 0.214, delayFeedback: 0.2, delayMix: 0.1, reverbSize: 1, reverbMix: 0.15 },
  'Warehouse Vespers': { mode: 'sing', style: 'techno', harmony: 'drone', variant: 'robosoft', bpm: 128,
    sustain: 0.6, glide: 0.005, carrierChoir: false, wobbleDepth: 0, gateRate: 3, gateDepth: 0.85,
    bits: 12, crushRate: 1, ringFreq: 30, ringMix: 0.1, choirMix: 0.2, choirVoices: 2,
    delayTime: 0.352, delayFeedback: 0.45, delayMix: 0.3, reverbSize: 2, reverbMix: 0.35 },
  'Electro Lector': { mode: 'sing', style: 'electro', harmony: 'octave', variant: 'robosoft3', bpm: 118,
    sustain: 0.5, glide: 0.01, carrierChoir: false, wobbleDepth: 0, gateRate: 2, gateDepth: 0.3,
    bits: 10, crushRate: 1.5, ringFreq: 30, ringMix: 0.3, choirMix: 0, choirVoices: 1,
    delayTime: 0.381, delayFeedback: 0.35, delayMix: 0.25, reverbSize: 1, reverbMix: 0.15 },
  'Acid Compline': { mode: 'sing', style: 'acid', harmony: 'none', variant: 'm1', bpm: 130,
    sustain: 0.6, glide: 0.09, carrierChoir: false, wobbleRate: 5, wobbleDepth: 0.55, gateDepth: 0,
    bits: 12, crushRate: 1, ringFreq: 220, ringMix: 0.15, choirMix: 0, choirVoices: 1,
    delayTime: 0.346, delayFeedback: 0.5, delayMix: 0.3, reverbSize: 1.5, reverbMix: 0.25 },
  'Whispered Vigil': { variant: 'whisper', pitch: 50, pitchRange: 50, speed: 130, wordGap: 5,
    bits: 14, crushRate: 1, ringFreq: 800, ringMix: 0.1, choirMix: 0.7, choirVoices: 4,
    delayTime: 0.45, delayFeedback: 0.45, delayMix: 0.3, reverbSize: 3.5, reverbMix: 0.7 },
};
export function presetSings(name) { return (PRESETS[name] || {}).mode === 'sing'; }

// ---------------------------------------------------------------------------
// Text: make written Scripture and Church documents easy to say
// ---------------------------------------------------------------------------
export function speakable(t) {
  return t
    .replace(/·/g, ',')                                                 // Grail line breaks
    .replace(/\s*\((?:see |cf\. ?|Vulgate)?[^()]*\d+:\d+[^()]*\)/g, '')   // (Romans 3:24) and the like
    .replace(/\[(\d+)\]|\(\d+\)/g, '')                                  // stray note numbers
    .replace(/\b[A-Z]{2,}\b/g, w => /^[IVXLC]+$/.test(w) ? w : w.toLowerCase())  // LORD, CHILD IS BORN
    .replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
    .replace(/—|–/g, ', ')
    .replace(/\s+/g, ' ').trim();
}
// Split a long passage into pieces at sentence ends, so each piece is quick to make.
function pieces(t, max = 320) {
  const out = []; let cur = '';
  for (const s of t.split(/(?<=[.!?;:])\s+/)) {
    if (cur && (cur + ' ' + s).length > max) { out.push(cur); cur = s; } else cur = cur ? cur + ' ' + s : s;
  }
  if (cur) out.push(cur);
  return out;
}

// ---------------------------------------------------------------------------
// Clear reading: a high-pass removes rumble (and the boom of small phone
// speakers), and a small presence lift at 2.5 kHz brings the consonants
// forward. Measured, this is as clear as the plain voice or a little clearer;
// a compressor and a bigger lift both made it less clear, so neither is used.
// ---------------------------------------------------------------------------
async function clear({ samples, rate }, s, tail) {
  const len = samples.length + Math.round(tail * rate) + 64;
  const ctx = new OfflineAudioContext(1, len, rate);
  const b = ctx.createBuffer(1, samples.length, rate); b.copyToChannel(samples, 0);
  const src = ctx.createBufferSource(); src.buffer = b;
  let node = src;
  if (s.clarity) {
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 90;
    const pres = ctx.createBiquadFilter(); pres.type = 'peaking'; pres.frequency.value = 2500; pres.Q.value = 0.9; pres.gain.value = 2;
    node.connect(hp); hp.connect(pres); node = pres;
  }
  node.connect(ctx.destination); src.start();
  const out = await ctx.startRendering();
  const x = out.getChannelData(0); let peak = 0;
  for (let i = 0; i < x.length; i++) peak = Math.max(peak, Math.abs(x[i]));
  if (peak > 0) { const k = 0.89 / peak; for (let i = 0; i < x.length; i++) x[i] *= k; }
  return out;
}
async function makePiece(text, s, tail) {
  const v = await speak(text, { voice: s.voice, variant: s.variant, pitch: s.pitch, pitchRange: s.range,
    speed: s.speed, wordGap: s.gap });
  return clear(stretchVowels(v, s.vowel || 1), s, tail);
}

// ---------------------------------------------------------------------------
// Playback
// ---------------------------------------------------------------------------
const player = new Audio();
player.preload = 'auto';
const SILENT = URL.createObjectURL(toWav({ sampleRate: 22050, getChannelData: () => new Float32Array(1100) }));
let url = null, session = 0;
// Call first thing in a tap: iPhone lets an <audio> element play later only
// if it was started during a tap.
export function unlock() { player.pause(); player.src = SILENT; player.play().catch(() => {}); }
function playBuffer(buf) {
  return new Promise((resolve, reject) => {
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(toWav(buf));
    player.onended = () => resolve(true);
    player.onerror = () => reject(new Error('playback failed'));
    player.src = url; player.currentTime = 0;
    player.play().catch(reject);
  });
}
export function stop() { session++; player.pause(); player.onended = null; }
export function playing() { return !player.paused && !player.ended; }

// Read items [{ text, onStart }] in order. Each item may be several pieces;
// a pause follows the last piece of each item. Pieces are made ahead of time
// (up to three) while earlier ones play. Resolves when finished or stopped.
export async function read(items, settings, { onStart = () => {}, onDone = () => {} } = {}) {
  const me = ++session, s = { ...READ_DEFAULTS, ...settings };
  const queue = [];
  items.forEach((it, k) => {
    const ps = pieces(speakable(it.text));
    ps.forEach((p, j) => queue.push({ text: p, item: k, first: j === 0, tail: j === ps.length - 1 ? s.pause : 0.05 }));
  });
  const made = [];
  let next = 0;
  try {
    for (let k = 0; k < queue.length; k++) {
      while (next <= k + 2 && next < queue.length) {   // keep up to three pieces in the making
        const q = queue[next]; made[next] = makePiece(q.text, s, q.tail); next++;
      }
      const buf = await made[k];
      if (me !== session) return false;
      if (queue[k].first) onStart(queue[k].item);
      await playBuffer(buf);
      made[k] = null;
      if (me !== session) return false;
    }
  } catch (e) { if (me === session) throw e; return false; }
  if (me === session) onDone();
  return true;
}

// The playful voices: one passage through a Vox Machina preset.
export async function play(text, presetName, robot, seed = 1) {
  const me = ++session;
  const s = { ...FX_DEFAULTS, ...(PRESETS[presetName] || {}), robot, seed };
  const t = speakable(text);
  const voice = s.mode === 'sing' ? await sing(t, s) : stretchVowels(await speak(t, s), s.speakVowel || 1);
  const buf = await render(voice, s);
  if (me !== session) return false;
  await playBuffer(buf);
  return true;
}
