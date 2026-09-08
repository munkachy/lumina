# THE RED LAMP — map and budget

**Shape: Gauntlet with a spoke-and-hub middle.** One anointed thread through one
night, branches that prune into death or return to the nave. Target merge rate
25–30% — between *The Cave of Time* (2%) and Lone Wolf (33%) — with hard
bottlenecks at midnight and at 5:40.

Not a Time Cave: this is not a story about possibility, it is a story about one
room you cannot leave. Not a Quest: there is nothing to find and nowhere to go.

---

## The endings

Written first, as the method requires. Two consolidated during the writing:
absolution turned out to be a step on the way to the dawn rather than an exit of
its own, and the two undercroft outcomes are one node with two readings.

| # | Ending | Kind | Requires |
|---|---|---|---|
| 1 | **A Happy Death** | best | contrite · not fed · in the fourth pew at 6:14 |
| 2 | **The Undercroft** | ambiguous, hopeful | contrite · not fed · below ground at 6:14 |
| 3 | **Ninety-Five** | ambiguous, empty | not contrite · below ground at 6:14 |
| 4 | **Sunrise** | death, sad | in the nave at 6:14, having said nothing all night |
| 5 | **Out to Him** | bad, and alive | opened the outer door to Marek |
| 6 | **The Font** | death | went at the granite bowl at speed with eight minutes left |
| 7 | **The Ablutions** | death | drank from the glass by the sacrarium |
| 8 | **What You Broke** | worst death | forced the tabernacle |
| 9 | **The Fourth Pew** | worst, and alive | fed |

Absolution by Fr. Cusack is not an ending. It is reachable inside ending 1 and
marked by an achievement, and it does not stop the sun, because nothing does.

## The three flags

`name` · `fed` · `contrite`. Nothing else. No counters, no hidden numbers.

---

## The map

**ACT ONE — THE DOORWAY** (`one_door`, ~13 nodes, bottleneck at the end)

    1 vestibule → the font in your path → the back pew
      → Verna sees you (the hinge of Act One)
        → you speak / you run / you hold still
      → midnight: the sacristan locks the outer doors  ← BOTTLENECK

**ACT TWO — THE NIGHT** (`two_night`, ~46 nodes, hub and six spokes)

    HUB: the last pew of the nave. Returned to after every spoke.
      Spoke A  the confessional  → the stole, the memory, an act of contrition
      Spoke B  the sacristy      → the registers (name), the sacrarium (death 9)
      Spoke C  the tower         → 91 steps, the rope, Marek from above
      Spoke D  the undercroft    → the vault, the refrigerator, ending 3
      Spoke E  the sanctuary     → three steps, the rail, the tabernacle (death 10)
      Spoke F  the doors         → Marek at the fence, ending 4, deaths 6 and 7
      Spoke G  Verna             → the rosary, the thermos, the feeding (5)
    Any spoke may be taken in any order; the sanctuary is the only one that
    cannot be finished on a first visit.
      → 5:40, headlights in the lot                      ← BOTTLENECK

**ACT THREE — DAWN** (`three_dawn`, ~20 nodes + endings)

    Fr. Cusack unlocks the side door → thirty-four minutes
      → confession / the bell / the stairs down / the fourth pew
      → 6:14

---

## Delivered, against the measured corpus

Audited with `.claude/skills/cyoa/reference/audit.py`.

| | Delivered | Corpus | |
|---|---|---|---|
| Nodes | 73 | — | |
| Words | 11,514 | — | |
| Median words per node | 128 | gamebooks 55–132 | ok |
| Nodes with no choice | 60% | 43–55% | high |
| Two-way share of choices | 82% | 77–87% | ok |
| Two / three / four-plus way | 24 / 4 / 1 | — | ok |
| Longest forced run | 2 | median 2–3, ceiling 4 | ok |
| Merge rate | 23% | Gauntlet low; Quest 31–37% | ok |
| Reachable from node 1 | 100% | 93–100% | ok |
| Median choice-line words | 11 | 11–12 | ok |
| Endings | 9 | Gauntlet 8–20 | ok |
| One playthrough | 28 nodes, ~4,400 words | — | 38% of the book |

The one figure outside its band is nodes-with-no-choice, at 61% against a
published 43–55%. It is arithmetic rather than pacing: each added choice brings
two option-body nodes with it, which are themselves no-choice nodes, so the
ratio resists being pushed down without reconverging branches faster than this
story wants to. At the keyboard the reader gets a decision every second screen.

## Rules for the writing

1. Every node opens on something physical in that room. The reader may have
   come from three directions and needs the floor under them.
2. The load-bearing facts — the font, the lamp, the doors lock at midnight,
   the sun at 6:14 — are restated in every branch that needs them, phrased
   differently each time. This is not repetition; it is the form.
3. Nothing in the church attacks you. All the harm in this book is done by you,
   by Marek, or by the sun.
4. Marek never lies.
5. No one states the theology. The rooms do it.

---

## What the robot playthroughs found

Eight uniform random walks through the first draft ended: **What You Broke ×4,
The Ablutions ×2, The Fourth Pew ×1, A Happy Death ×1.** Half of all walks
forced the tabernacle.

A random walk is not a reader — a reader chooses — but 50% at a near-universal
bottleneck means the road to that ending was too wide. Nearly every path funnels
through the halfway point of the centre aisle, and there it was a straight
coin-flip between opening the box and staying on your knees.

The fix is Emily Short's **confirmation-required choice**: the temptation and
the act are now two separate decisions with a node between them, in which you
are standing at the rail with your hand on warm brass, looking at a keyhole
that has been kept shut for a hundred and twenty-eight years by nothing
whatsoever except what the neighbourhood understood it to be.

After the change, the same eight seeds end: **A Happy Death ×3, What You Broke
×2, The Ablutions ×2, The Fourth Pew ×1.** Nobody smashes a tabernacle in one
motion, and now the game does not let them.
