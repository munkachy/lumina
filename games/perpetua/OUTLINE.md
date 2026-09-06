# PERPETUA — outline and budget

*A first command.*

**Pitch.** A newly promoted commander is given a worn-out survey ship, a crew
she assembles herself, and the frontier nobody else wanted — and spends a year
discovering that the rule she swore to keep is the same rule that destroyed the
captain before her.

**Conflicting goals the player cannot all have:**
1. Keep the Reticence — the restraint that holds eleven quarrelling worlds
   together and gets people killed one system at a time.
2. Save the people actually in front of you.
3. Keep your ship, your crew, and your commission, which is the only way you
   will ever be in front of anyone again.

---

## Stats

Four opposed pairs. One slider each; both ends are strengths; there are no dump
stats. All start at 50 and are moved by the background and the first chapter.

| Variable | High | Low |
|---|---|---|
| `nerve` | **Nerve** — you move | **Restraint** — you wait |
| `candor` | **Candour** — you say it | **Guard** — you keep it |
| `crew` | **Crew** — you protect your people | **Mission** — you finish the job |
| `rule` | **Rule** — you decide | **Counsel** — the room decides |

Plus:

| Variable | Range | Meaning |
|---|---|---|
| `standing` | 0–100, starts 40 | Your name in the Survey |
| `strain` | 0–100, starts 12 | What the ship has taken. Expendable resource. |
| `oleyo` | 0–100, starts 50 | The Vaunt captain's regard. Rivalry that can turn. |
| `rel_xo` `rel_eng` `rel_med` `rel_sec` `rel_chap` | 0–100 | Your officers |

**Budget: 96 tests, ~280 writes.** Writes per test ≈ 2.9 (corpus 1.8–5.6).
Tests per core stat, minimum 8. No core stat more than 3× another.

| Stat | Tests |
|---|---|
| `nerve` | 14 |
| `candor` | 12 |
| `crew` | 14 |
| `rule` | 13 |
| `standing` | 10 |
| `strain` | 8 |
| `oleyo` | 9 |
| relationships (5) | 16 total |

**Moments of glory** — one scene each stat alone wins:

- **Nerve** — Ch. 7, the burning hold: you go in before anyone tells you to.
- **Restraint** — Ch. 10, you say nothing for eleven seconds and Oleyo blinks.
- **Candour** — Ch. 8, you tell the Board the thing that damns you and it works.
- **Guard** — Ch. 5, you carry an officer's secret and the ship never learns it.
- **Crew** — Ch. 11, they follow you into a thing no regulation covers.
- **Mission** — Ch. 3, you hold the line and forty thousand people are alive
  three years later because you did.
- **Rule** — Ch. 9, you overrule Halloran to his face.
- **Counsel** — Ch. 6, the youngest person aboard is right and you let her be.

---

## Chapters

Delayed branching: each chapter always leads to the next. The choices decide how
you arrive, not where.

| # | Scene | Words | Choices | Function |
|---|---|---|---|---|
| 1 | `orders` | 3,200 | 16 | Chargen: name, background, motive, five officer posts. Establishing choices only. |
| 2 | `coldreach` | 2,800 | 12 | Shakedown. The ship's voice, the officers' handles, Halloran's ghost raised for the first time. First tests. |
| 3 | `leastthatanswers` | 3,600 | 14 | Melisse's Landing asks for a cure it is not entitled to. First Reticence dilemma; Mission's moment of glory. |
| 4 | `ashaya` | 3,400 | 13 | Oleyo. Courteous, exact, and thanks you for something you did not mean to give. |
| 5 | `articlenine` | 3,200 | 13 | An officer of yours did something wrong. Rule ↔ Counsel bites. Guard's moment of glory. |
| 6 | `quietworld` | 3,000 | 11 | Wonder. A world that is not what the instruments say. Counsel's moment of glory. |
| 7 | `salvage` | 3,400 | 13 | Action. A burning freighter, a bad decision, `strain`. Nerve's moment of glory. |
| 8 | `theboard` | 3,000 | 12 | Recalled. Assessor Ivanescu. Chapters 3 and 5 come due. Candour's moment of glory. Why you got this ship. |
| 9 | `halloran` | 5,000 | 18 | **Crisis (72%).** Tessine Station. The truth about Ceyla, from the man himself. Rule's moment of glory. |
| 10 | `theweighing` | 3,600 | 14 | Oleyo again, across a table. Restraint's moment of glory. |
| 11 | `nadire` | 4,200 | 15 | **Climax.** The same shape as Ceyla, and it is yours now. Crew's moment of glory. |
| 12 | `wrapup` | 2,400 | **0** | Reports consequences. No choices, per the corpus: all three long CoG games end this way. |

**Total: ~40,800 words, 151 choices, ~450 options.**
Words per choice ≈ 270 (corpus 165–450). Words per screen target 325–400.
One `*page_break` per `*choice`, alternating.

---

## Rules for the writing

1. Open every scene on a physical situation. Never on an abstraction.
2. Median 266 words before the first choice of a scene. Orient, then ask.
3. 55% of failed stat tests reconverge — the low-stat player gets description
   where the high-stat player gets understanding. Write the losing branch as
   characterisation, never as a wall.
4. Two thirds of relationship movement comes from stat-gated reactions inside
   ordinary scenes, not from courtship choices.
5. Every officer is reintroduced by handle on re-entry. The player may not have
   seen them for 8,000 words.
6. The Vaunt are never wrong for the sake of being the Vaunt.
7. No one in this book states the moral. The situations do it or nobody does.
