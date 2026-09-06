---
name: interactive-fiction
description: Craft rules for writing Choice-of-Games-style interactive novels for the Scriptorium engine — story architecture, scene and arc shape, choice design, prose and characterisation, stat systems and balance, and continuity discipline for book-length work. Use whenever writing, outlining, revising or auditing a game in games/*/scenes/, adding scenes to an existing story, or planning a new one.
---

# Writing interactive novels

Built from Choice of Games' design blog and judging rubric, and from measuring
five of their published games directly — 414,000 words of shipped work whose
scene files are public. Numbers below are measured, not remembered.
`reference/corpus.md` has the full tables.

## Before writing a line

1. **Elevator pitch in one sentence.** If it is only a genre name, stop. Their
   own examples: *tour guide on the moon obsessed with a video game*; *psychic
   spy inhabiting other people's bodies*; *real estate agent renting a haunted
   house*.
2. **Name the conflicting goals.** Two or three things the player cannot all
   have. This is 15% of their score and it is what makes endings mean anything.
3. **Write the ledger first** (see *Continuity*). Then outline. Then write.

## Measured shape of a real game

| Game | Words | Choices | Opts/choice | Words/choice | Words/screen |
|---|---|---|---|---|---|
| Dragon | 23,658 | 142 | 2.8 | 167 | 401 |
| Broadsides | 45,573 | 195 | 3.1 | 234 | 348 |
| Romance | 40,616 | 109 | 3.3 | 373 | 514 |
| Zombies | 106,344 | 434 | 2.7 | 245 | 324 |
| Vampire | 198,210 | 439 | 3.3 | 452 | 325 |

**What holds across all five:**

- **Words per screen: 325–400.** The single most stable number in the corpus.
  A `*page_break` roughly every 350 words. Breaking every 90 words turns
  reading into tapping.
- **Options per choice: 2.7–3.3.** Aim at 3.
- **Words per choice: 165–450**, and it *rises with length*. A short game wants
  ~170; a 100,000-word game runs 245–450. Do not force 165 into a long book.
- **Scenes are large.** Mean scene: Broadsides 3,505 · Zombies 6,646 ·
  Vampire 9,438. A 100,000-word game is ~15 scenes of ~6,500 words, not 40
  small ones.

## The arc

All three long games do the same thing:

- **The biggest scene sits at 60–80% of the way through**, and it is the
  crisis, not the climax. (Vampire's *karlstein*: 33,182 words at 66%.
  Broadsides' *CommandMutiny*: 8,796 at 82%.)
- **A distinct climax scene follows it**, shorter and tighter.
- **The last scene has zero choices.** Every one of them ends with a WrapUp of
  1,700–2,900 words that only reports what the player's stats produced. The
  falling action is mechanically inert on purpose — the deciding is over.
- **Openings are small.** Zombies opens at 1,886 words; Broadsides at 2,139.
  Get into the first real scene fast.
- Early scenes are establishing-heavy; the middle is testing-heavy; the last
  act cashes everything in.

## Structure: delayed branching

Branching the story is arithmetic suicide — seven pages of two-way branching
needs 128 pages; twenty needs a million. So **chapters run in a fixed line**.
Chapter 1 always leads to Chapter 2. A choice decides not *where* you go but
whether you *succeed* when you get there. Branch inside the scene; carry
memory in stats.

## The four kinds of choice

- **Establishing** — sets a Primary Variable, does not change what happens.
  Broadsides does this openly: two options give *word-for-word identical* result
  text and differ only in the `*set`. Use heavily early; this is character
  creation without a form.
- **Testing** — reads a Primary Variable, writes the result to a Secondary.
- **Multi-level testing** — the same with graduated bands. Prefer these,
  especially at climaxes.
- **Objective** — options point at genuinely different *goals*. Strongest kind,
  because something must be given up.

**Primary Variables** are what the character is; **Secondary Variables** are
what has happened to the world.

## The Four Point Trap

The commonest failure: the game asks strong/sneaky/smart/charming forever, so
only the first choice ever mattered. Three defences:

1. **More stats than options per choice** — 5–6 stats against 3–4 options.
2. **Add a motivation axis.** Same act, different reason, is a real choice.
   Broadsides at its best: *marriage might be kind of nice* vs *marriage to the
   right person would be useful to my career* — identical outcome, different
   person.
3. **Objective choices** aimed at incompatible goals.

## Intentional choices

The player cannot flip back or peek ahead, so a surprise is a betrayal. Before
the menu, signal the **story result**, the **stat being tested**, and the
**relative difficulty** — either in the narration just above it or inside the
option text. Never a "do nothing" option, and never let an NPC decide for them.

## Writing the options

Measured across the corpus: **median 7–10 words, 90th percentile 21–25, up to
60.** They are not terse labels.

The strongest ones are **the character's own thought, in first person**, and
they carry the motivation:

> `#Bryce seems to have stumbled onto a good thing. It might be. . . kind of nice to have something like this myself. A home to return to, a loving ${spouse_word}. . .`

First-person option text runs **12–30%** of options across the corpus — it is a
strong pattern, not a house rule. Narration is second person present throughout;
options may be first-person thought, quoted speech, or plain action.

## Prose

Prose styling is 10% of the rubric, and word-perfection is part of it: real
em-dashes, no smart quotes, no typos.

What their prose actually does:

- **Opens a scene on a physical situation, never an abstraction.**
  *"The tropical sun is hot even through your hat, and it glares painfully off
  the water. Through your stinging eyes, you can see looming up ahead the cliffs
  of a little island."* Heat, glare, stinging, then the island.
- **Carries exposition in dialogue.** The Captain explains the mission out loud;
  the narration does not summarise it.
- **Uses the concrete detail that implies the rest** — the charts say the island
  is uninhabited, the Gaulish ship is *streaking*, the men's feet pound.
- **Keeps sentences plain.** The register is a competent novelist, not a poet.
  When a sentence is doing something clever, the reader stops being in the
  world.

**Characterisation.** Give the reader a small cast with sharp, repeated
handles — a habit, a phrase, a physical tell — and reintroduce each one on
re-entry, because the player may not have seen them for 10,000 words. Vampire
carries 63 named `*_rapport` stats; Broadsides carries three. Either is fine.
What is not fine is a character who exists only to deliver a choice.

## Stats, and how to balance on the first pass

Seven rules, theirs: don't use only skills; include personality traits; include
**opposed** morality traits rather than a good/evil slider; include stats about
the world; give an expendable resource; make every stat equally useful; avoid
the standard RPG six.

**Opposed pairs** are the workhorse — one slider, two names, no dump stats.
**Fairmath**: `%+20` adds 20% of the distance to 100. Never hits 0 or 100.
Early changes move much further than late ones, so front-load establishing
choices and taper. **Test in bands** (~70/50/30), not at one cutoff.

Measured balance targets:

| Metric | Corpus | Rule |
|---|---|---|
| Writes per test | Zombies 1.8 · Broadsides 3.0 · Vampire 3.2 · Dragon 5.6 | **2–5.** Above 10 the stats are decoration. |
| Tests per core stat | Dragon 8–19 · Zombies 14–25 · Vampire 33–73 | **At least 8**, whatever the length. |
| Spread across core stats | 1.8×–3× | **No core stat tested more than 3× another.** |
| Core stats | 5–8 | Plus as many flags as you like — Vampire declares 218 and tests 54. |

**On the first pass**, before writing prose: list the core stats, decide how
many tests each gets, and write those test moments into the outline as named
beats. Then write toward them. Balancing afterwards is a rewrite.

Every core stat needs **one moment of glory** — a scene only that stat wins,
and one the player will remember.

## Continuity for book-length work

100,000 words fits in context. **Continuity still fails without external
scaffolding**, and it has already failed here: in a 30,000-word draft a
character's nickname was coined "as a kid" three paragraphs below being coined
in 1979 at age twenty-six; 154 choices were designed and 46 written; 265 stat
changes were set and 3 ever read. None of that was a memory limit. It was
writing without a check.

So, always:

1. **A ledger file, written before the prose and updated as you go** —
   `games/<name>/LEDGER.md`: every proper name, date, age, place, physical
   detail, who knows what and when, and every promise made to the reader that
   must pay off. Re-read it at the head of every scene.
2. **Write scenes in story order.** Out-of-order writing is where dates drift.
3. **Run `audit.py` before declaring a draft done**, not after. It counts
   words, choices, options, screens, and every read and write of every stat.
4. **A grep pass for hard facts** — years, ages, names — at the end of each act.
5. **State budgets in the outline and check against them.** The 46-vs-154 gap
   was visible from the first scene and nobody was counting.

## Ending rules

- **Multiple winning conditions**, none obviously best.
- **Every ending needs weight, including the losing ones.**
- **Endings must respect the stats.** Never ignore the skill a player spent the
  game building; never kill them at random.
- **No ending before 75%.**
- Last scene: no choices, report the consequences.

## How failure is actually written

Measured: **724 stat-test `*if`/`*else` blocks** across the corpus.
**55% of them reconverge immediately** — both branches reach the same label, or
neither branches at all. Failing a test usually costs you nothing but knowledge.

Three patterns, in order of frequency:

1. **Reconvergent flavour.** The high-stat player gets *understanding*; the
   low-stat player gets *description*. Same plot, next line.

   > `*if engineering > 60` → *"You're pretty sure that's a large electric motor at the end of those pipes. Probably the coolant pump."*
   > `*else` → *"The pipe ends in another metal housing of some kind."*
   > Both `*goto pump`.

   This is the workhorse. It makes a stat feel like a sense organ rather than a
   lock. Write it for every stat the player might have brought to a scene.

2. **Failure costs something nameable** — a companion (`*set companioncount - 1`),
   a wound, a reputation. Not the plot; a resource. The story continues poorer.

3. **Failure hands the choice back.** Zombies answers a stupid plan with
   *"A pew, huh. Um, I guess you could…hell, I don't know…sit on it and expire
   quietly in the corner?"*, then a page break, then *"Really?"*, then a new
   `*choice`. Failure as a beat of characterisation, not a wall.

Death and hard branch-off are the minority and are earned. **Never write a
failure branch that only says the player failed.**

## How relationships are actually paced

In the two romance-heavy games, **844 writes to relationship stats — but only
32% sit directly inside a chosen option.** Two-thirds fire inside conditional
prose: the person warms to you because of who you already are, not because you
picked the kind line. Affection is mostly a *consequence of the character you
built somewhere else*, revealed at the moment you meet.

Practical rule: for each relationship, roughly one third of its movement from
direct courtship choices, two thirds from stat-gated reactions inside ordinary
scenes.

## The rhythm of a screen

`*page_break` to `*choice` runs **1.00 across the whole corpus** — one break per
choice, alternating. Combined with 325–400 words per screen: the reader gets a
paragraph block, a decision, a paragraph block, a break. Median prose before a
scene's first choice: **266 words.** Open, orient, then ask.

## How the professionals sequence the work

They outline first, and it is not casual. Choice of Games' own submission
pipeline: CV → writing sample → **several game concepts** → *"a full pitch for a
game, in the form of an outline"* → **several rounds of revision with the
editorial team on the outline** → contract → chapters delivered progressively,
with **chapter two required to be at least 10,000 words**. Nobody writes scene
one until the shape is agreed.

Also from that page: **a player sees roughly 20% of the content in one
playthrough.** A 100,000-word game is a 20,000-word read. Budget accordingly —
variation is the product, not overhead.

## What is still unknown

Worth researching before it matters, rather than guessing:

- Whether they use any beat-level scene template below the scene level.
- What separates a 10% prose score from a 6% one, beyond "engaging".

## The Scriptorium engine

Format in `games/*/FORMAT.md`. Build with `python3 build.py` inside the game
directory — injects scenes into `app-shell.html`, writes `index.html` and
`<game>.html`. A line is a command only if it matches `*[a-z_]+`; a line
starting `**bold**` is prose. Author notes from edit mode live in the artifact
database, read back with the Artifact tool's `read_db`. Audit with `audit.py`.
