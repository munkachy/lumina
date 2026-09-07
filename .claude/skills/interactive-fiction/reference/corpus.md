# Measured corpus

Five Choice of Games titles whose ChoiceScript scene files are publicly
readable at `choiceofgames.com/<game>/scenes/`. Measured 2026-09; 414,401
words of prose across 79 scenes. Prose counts exclude command and option lines.

No game text is stored in this repository — these are measurements only.
To re-derive: `curl https://www.choiceofgames.com/<game>/scenes/startup.txt`,
read `*scene_list`, fetch each scene.

Games with public scenes: `dragon`, `broadsides`, `vampire`, `romance`,
`zombies`. (`intrigue`, `kungfu`, `heroes`, `rockstar` return 404.)

## Overall

| Game | Words | Scenes | Choices | Options | Opts/ch | Words/ch | Screens | Words/screen | Mean scene |
|---|---|---|---|---|---|---|---|---|---|
| Dragon | 23,658 | 12 | 142 | 399 | 2.8 | 167 | 59 | 401 | 1,971 |
| Broadsides | 45,573 | 13 | 195 | 601 | 3.1 | 234 | 131 | 348 | 3,505 |
| Romance | 40,616 | 13 | 109 | 358 | 3.3 | 373 | 79 | 514 | 3,124 |
| Zombies | 106,344 | 16 | 434 | 1,154 | 2.7 | 245 | 328 | 324 | 6,646 |
| Vampire | 198,210 | 21 | 439 | 1,440 | 3.3 | 452 | 610 | 325 | 9,438 |

## Stats

| Game | Numeric stats declared | Writes | Tests | Writes per test | Stats ever tested |
|---|---|---|---|---|---|
| Dragon | 8 | 305 | 54 | 5.6 | 6 |
| Broadsides | 19 | 227 | 76 | 3.0 | 14 |
| Zombies | 17 | 537 | 295 | 1.8 | 11 |
| Vampire | 218 | 3,145 | 978 | 3.2 | 54 |

Tests on the busiest core stats: Dragon brutality 19, cunning 13, disdain 10 ·
Zombies athletics 25, handtohand 24, engineering 21, medical 18, firearms 16 ·
Vampire compassion 73, charm 68, discretion 67, perception 58, lore 40.

Spread within the core stats of each game: 1.8×–3×.

## Option length

| Game | Median words | 90th pct | Max |
|---|---|---|---|
| Dragon | 7 | 14 | 29 |
| Broadsides | 9 | 23 | 53 |
| Zombies | 8 | 21 | 62 |
| Vampire | 10 | 25 | 48 |

First-person option text: Dragon 12% · Broadsides 23% · Romance 28% ·
Zombies 28% · Vampire 30%.

## Arc position of the largest scene

| Game | Largest scene | Words | Position | Last scene |
|---|---|---|---|---|
| Broadsides | CommandMutiny | 8,796 | 82% | WrapUp, 2,919 words, 0 choices |
| Zombies | TempSafeSpotFour | 14,354 | 65% | WrapUp, 1,717 words, 0 choices |
| Vampire | karlstein | 33,182 | 66% | scoring, 1,644 words, 1 choice |

All three end with a choice-free wrap-up that only reports outcomes.

## For comparison: One Soul, first draft

30,870 words · 46 choices · 160 options · 3.5 opts/choice · **671 words per
choice** (4× the dragon) · **87 words per screen** (4× too many breaks) ·
265 stat writes against **3 tests** — a write-to-test ratio of 88 against a
corpus range of 1.8–5.6.

## Failure handling

724 stat-test `*if`/`*else` blocks (pattern `*if <stat> <op> <number>`):

| Outcome of the failure branch | Count | Share |
|---|---|---|
| Reconverges — same `*goto` in both branches | 175 | 24% |
| Reconverges — no `*goto` in either branch | 220 | 30% |
| Genuinely divergent | 329 | 45% |

**55% of failed stat tests cost the player nothing but knowledge.**

## Relationship writes

Vampire + Romance: 844 writes to `*rapport*`/`*love*`/`*affection*` stats.
274 (32%) sit directly inside a chosen option; 570 (68%) fire inside
conditional prose reacting to stats the player built elsewhere.

## Screen rhythm

`*page_break` 1,209 · `*choice` 1,207 — a ratio of **1.00** across all five
games. Median prose before the first choice of a scene: **266 words**
(range 22–2,432).

## Process (from choiceofgames.com/looking-for-writers)

CV → writing sample → several game concepts → **a full pitch in the form of an
outline** → several rounds of editorial revision *on the outline* → contract →
chapters delivered progressively. Chapter two must be at least 10,000 words.
"Players see roughly 20% of the content per playthrough."
