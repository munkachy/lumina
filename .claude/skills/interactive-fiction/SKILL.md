---
name: interactive-fiction
description: Craft rules for writing Choice-of-Games-style interactive novels for the Scriptorium engine — structure, choice design, stat systems and balance, prose style, and endings. Use whenever writing, outlining, revising or auditing a game in games/*/scenes/, adding scenes to an existing story, or planning a new one.
---

# Writing interactive novels

Distilled from Choice of Games' own design blog and judging rubric, plus a
direct measurement of `Choice of the Dragon`'s public scene files. Their
numbers are the industry's only published ones; treat them as the default and
depart from them on purpose, not by accident.

## The rubric they actually score against

| Weight | Criterion |
|---|---|
| 15% | Original, interesting **characters** |
| 15% | Original, interesting **setting and plot** |
| 15% | **Conflicting goals** with satisfying endings |
| 15% | **Balanced, intentional, interesting choices** |
| 10% | Inclusivity |
| 10% | **Prose styling** |
| 10% | **Creative stats**, consistently applied |
| 5% | Length and coding efficiency |
| 5% | Judge's choice |

A zero in any one category disqualifies the whole game regardless of the rest.
Plot is scored on an **elevator-pitch test**: one sentence, understandable and
compelling. If the pitch is just a genre name, the premise is not there yet.

## Numbers

- **Total ≥ 100,000 words; average playthrough ≥ 20,000.** Their minimum.
- **Playthrough ÷ total should land between 0.2 and 0.4.** Below 0.2 the game
  is "bushy" — enormous effort the player never sees. Above 0.4 the choices
  are not changing enough text.
- **One choice roughly every 165 words.** Measured across the dragon.
- **2.8 options per choice** on average; most sit at 2–4. Their rubric wants
  **three or more** on most choices.
- **A screen every ~400 words** (`*page_break`).
- **~14 achievements**, mostly "finish above 80 in X" plus event flags. Cheap
  to write, large effect on replay.
- **No ending before 75% of the way through.**

## Structure: delayed branching

Branching the story itself is arithmetic suicide — a seven-page two-way branch
needs 128 pages; twenty pages needs over a million. So:

**Chapters run in a fixed line. Chapter 1 always leads to Chapter 2.** What a
choice decides is not *where* you go but whether you *succeed* when you get
there. Stats carry the memory forward. Branch inside the scene, never between
scenes.

Shape of a 12-scene book, taken from the dragon: two large scenes (~5,500–6,500
words, ~33 choices each), a spine of mediums (1,400–2,300), two or three smalls
(550–1,050), a 15-word checkpoint, and a short ending.

## The four kinds of choice

- **Establishing** — sets Primary Variables, does not branch the story. "How
  did you catch him?" Talked him down / chased him / frightened him. Same
  outcome, different character. Use heavily in early chapters; this is
  character creation without a form.
- **Testing** — checks a Primary Variable and writes the result to a Secondary
  Variable. Pass or fail.
- **Multi-level testing** — the same, with graduated bands instead of pass/fail.
  **Prefer these**, especially at climaxes.
- **Objective** — the options point at genuinely different *goals*, not
  different skills. The strongest kind, because the player must give something
  up.

**Primary Variables** are what the character is. **Secondary Variables** are
what has happened to the world. Too many objective choices that only raise
Secondaries drains tension — let some of them cost something.

## The Four Point Trap

The commonest failure: the game asks the same question over and over — strong,
sneaky, smart, charming — so the only choice that ever mattered was the first
one. Three defences:

1. **More primary stats than options per choice.** Five or six stats against
   three or four options forces variety.
2. **Add a second axis.** The taxonomy names three: *choice* (how you try),
   *success* (how well it goes), and **motivation** (why you did it). Same
   action, different reason, is a real choice: shooting the man *because he
   deserves it* versus *because procedure says so*.
3. **Objective choices** — make the options aim at mutually exclusive goals.

## Intentional choices

The player must be able to predict what they are choosing. They cannot flip
back or peek ahead, so a surprise is a betrayal, not a twist. Before the menu,
signal three things:

- the **story result** of each option
- the **stat being tested**, if one is
- the **relative difficulty**

Either in the narration just above the menu, or inside the option text itself.
"I put on a baseball cap" tells the player nothing; "…because it looks good"
or "…to hide my face" tells them which stat they are spending.

**No "do nothing" option**, and never let the player hand the decision to an NPC.

## Stats

Seven rules, theirs:

1. **Don't use only skills** — or every choice collapses to "which skill wins?"
2. **Include personality traits** — they let the player decide what the
   character *wants*, not just what works.
3. **Include morality traits, plural and opposed.** Honesty against compassion
   beats a good/evil slider.
4. **Include stats about the world** — relationships, reputation, progress.
5. **Give expendable resources** — something that runs out.
6. **Make every stat equally useful** across the whole story.
7. **Avoid the standard RPG six.** Their best examples: *Je Ne Sais Quoi*
   (heist), sleep deprivation (lawyers), Autonomy vs Empathy (robots).

**Opposed pairs** are the workhorse: one slider, two names, high Brutality *is*
low Finesse. No dump stats, because both ends unlock content.

**Fairmath**: `%+20` adds 20% of the distance to 100, `%-20` subtracts 20% of
the current value. Never reaches 0 or 100. This is what keeps a stat meaningful
across 100,000 words instead of pinning to the ceiling by chapter three.
Consequence: **early changes move a stat much further than late ones**, so
front-load the establishing choices and taper.

**Thresholds**: test in bands — roughly 70 / 50 / 30 — not at a single cutoff.

## Balancing stat distribution

Auditable, and worth actually counting before shipping:

1. **Tests per stat within ±20% of each other.** Count every `*if` that reads a
   primary stat. A stat tested twice as often as its neighbour is the real stat
   and the others are decoration.
2. **Raise opportunities ≥ tests, per stat.** A stat you are asked to spend
   more often than you can build is a trap.
3. **Every stat gets one moment of glory** — at least one scene where only that
   stat wins, and it is a scene the player will remember.
4. **A specialist should pass most tests in their specialty; a generalist about
   half of everything.** If a generalist fails nearly everything, the bands are
   too high.
5. **No late difficulty spike** that suddenly demands one maxed stat after the
   game has taught balanced growth.
6. **Consistency**: the same act moves the same stat in chapter 3 and chapter 12.

## Prose

- **Narration in second person; options in first person.** This is their house
  style and it is what the dragon does: *"You leap to the air…"* above,
  `#I take to the air with a quick beat of my wings.` below. Options that are
  spoken dialogue can stay in quotes.
- **Present tense** is the default for the form.
- **Word-perfect** is 10% of the score: real em-dashes, no smart quotes, no
  typos. They will fail a game for punctuation.
- Prose is scored on whether it *engages*, not whether it is ornate.

## Endings

- **Multiple winning conditions**, no single obviously-best ending.
- Every ending needs dramatic weight, **including the losing ones**.
- Endings must **respect the stats**: do not ignore the swordfighting a player
  spent the game building, and never kill them at random.
- **Conflicting goals** are what make endings matter — give the player two or
  three things they cannot all have.

## Measured reference: Choice of the Dragon

23,658 words · 142 choices · 399 options · 12 scenes · 14 achievements ·
6 stats in 3 opposed pairs + Infamy + wealth/wounds/blasphemy.

## The Scriptorium engine

Format and commands are in `games/*/FORMAT.md`. Build with
`python3 build.py` inside the game directory — it injects the scenes into
`app-shell.html` and writes both `index.html` and `<game>.html`. A line is a
command only if it matches `*[a-z_]+`; a line starting `**bold**` is prose.
Notes written by the author in edit mode live in the artifact database and are
read back with the Artifact tool's `read_db`.
