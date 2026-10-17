# How the reading voice was chosen

Lumina's reading voice is eSpeak NG (from Vox Machina), and eSpeak has many voices and
settings. To choose the clearest, I measured instead of guessing.

**Method.** Fourteen varied Douay-Rheims verses (`tools/voice/corpus.json`: Genesis,
Exodus, Psalms, Proverbs, Isaias, the Gospels, Romans, 1 Corinthians) were spoken by each
setting with the same WebAssembly eSpeak NG that Lumina uses (`tools/voice/say.mjs`,
`grid.mjs`). An offline speech recognizer (Vosk, small US English model) transcribed each
clip, and the word error rate was counted against the text (`pscore.py`). Lower is clearer.

The recognizer is a stand-in for a listener, not a listener: it was trained on American
speech (so it favours American accents), and it stumbles on Douay English ("ruleth",
"thou mayst"), which is why every rate is high. The comparisons between settings are what
count; differences under about 2 points are within the noise of 270 words.

## 1. Voice and accent (160 words per minute, no word gap)

| Word errors | Voice |
|---|---|
| 36.9% | American, Male 6 |
| 37.3% | American, Male 7 |
| 38.0% | American, Male 5 |
| 38.7% | American, Male 3 |
| 40.8% | American, Default · American, Female 2 |
| 41.8% | American, Edward · American, Female 5 |
| 43–49% | other American and British variants |
| 52–66% | Robosoft, Croak, Announcer |
| 72–95% | Norbert, Whisper |

## 2. Speed and word spacing (American)

| Word errors | Setting |
|---|---|
| **33.8%** | **Male 3, 160 wpm, 40 ms between words** |
| 34.1% | Male 3, 180 wpm, 40 ms |
| 35.9% | Male 6, 160 wpm, no gap |
| 36.2% | Male 7, 160 wpm, no gap |
| 38–40% | the same voices at 140 wpm |
| 44–50% | every voice at 120 wpm |

Intonation (pitch range) at 20, 50, 80 and 99 made no consistent difference, except that
a nearly flat voice (20) was slightly worse. It stays at eSpeak's 50.

## 3. Vowel length (Male 3, 160 wpm, 40 ms)

| Word errors | Vowels |
|---|---|
| **33.1%** | **100% (unchanged)** |
| 39.7% | 115% |
| 43.9% | 130% |

Stretching the vowels afterwards (WSOLA) adds small artefacts, so it stays at 100%.

## 4. The clarity filter

| Word errors | Filter |
|---|---|
| **33.8%** | **high-pass 90 Hz + 2 dB lift at 2.5 kHz** |
| 34.1% | none · high-pass only |
| 38.7% | high-pass + compressor |
| 41.8% | high-pass + 4 dB lift + compressor |

eSpeak's level is already even, and compression smears it. The filter that is on by
default is the high-pass and the small lift, which also takes the boom out of small
phone speakers.

## What this means for listeners

Published work on synthetic speech agrees in outline: formant synthesis like eSpeak's
stays intelligible even at high rates for experienced listeners, slowing down helps those
unused to it, and pauses between phrases help comprehension more than drawn-out words.
The recognizer liked 160 wpm better than 120, but a person new to the voice may prefer
140–150: that is what the Speed slider is for. The pause between verses (0.6 s) follows
the finding that pauses, not slow words, carry understanding.
