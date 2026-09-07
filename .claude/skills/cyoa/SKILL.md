---
name: cyoa
description: Craft rules for writing branching Choose-Your-Own-Adventure stories — numbered sections, "turn to 85", no stats, no character sheet. Structure shapes, node size, how to write the choice line, how many endings, how much branches should rejoin, world-building that survives arriving from three directions, and a graph audit. Use when writing, outlining, revising or auditing a stat-free branching story; for stat-driven Choice-of-Games-style novels use the interactive-fiction skill instead.
---

# Writing a Choose Your Own Adventure

Stat-free branching. The reader's memory is the only state the story has: no
health, no skills, no character sheet, no invisible numbers. Everything a choice
does, it does by sending the reader somewhere else.

Built from measuring five complete gamebooks directly — 1,800 numbered sections
and 205,363 words of published work — and from published structural analyses of
six Bantam-format CYOA books. `reference/corpus.md` has every number and how to
re-derive it. `reference/audit.py` checks a draft's graph.

**Sister skill:** `interactive-fiction` covers Choice-of-Games-style novels with
stats, fairmath and delayed branching. Different form, different numbers. If the
story needs a character sheet, use that one.

## First: pick a shape

Sam Kabo Ashwell's taxonomy, with the measured profile of each.

| Shape | What it is | Merging | Endings | Best for |
|---|---|---|---|---|
| **Time Cave** | Heavy branching, nothing rejoins, every choice equal | **~2%** | **40** | Freedom, surrealism, replay |
| **Gauntlet** | One anointed thread, branches prune into death or rejoin at once | low | 8–20, mostly bad | A hazardous world, a fated story |
| **Branch and bottleneck** | Branches, then regularly reconverges at fixed events | high | few | Character change over time |
| **Quest** | Clusters of nodes around situations; clusters rejoin toward one win | **~33%** | **14–22, one win** | Exploration, geography, journeys |
| **Loop and grow** | A thread that returns to the same point, opening new options | high | few | Routine, constraint, a day repeating |

*The Cave of Time* (1979) is the pure Time Cave: **114 pages, 39 choices, 40
endings, and exactly 2 places where branches rejoin.** Lone Wolf is the Quest:
**350 sections, ~33% of them reachable from two or more places, one winning
ending.**

That difference — 2% merging against 33% — is the single biggest decision you
make. **Decide it before you write a line, because it is not retrofittable.**

## The measured numbers

Five gamebooks, whole, counted:

| | LW1 1984 | LW5 1985 | LW12 1988 | LW20 1993 | Freeway Warrior 1988 |
|---|---|---|---|---|---|
| Sections | 350 | 400 | 350 | 350 | 350 |
| Words | 22,958 | 40,317 | 41,961 | 54,857 | 46,250 |
| Median words/section | 55 | 83 | 98 | 132 | 104 |
| **Sections with no choice** | **50%** | 43% | 55% | 47% | 52% |
| Two-way choices | 135 | 178 | 133 | 144 | 146 |
| Three-way | 36 | 43 | 24 | 34 | 14 |
| Four or more | 5 | 9 | 2 | 8 | 7 |
| Endings | 17 | 14 | 21 | 21 | 22 |
| — of which deaths | 16 | 12 | 20 | 20 | 20 |
| Sections reached from 2+ places | 37% | 37% | 32% | 32% | 31% |
| Median choice-line length | 11 words | 12 | 11 | 12 | 11 |
| Sections reachable from §1 | 100% | 93% | 100% | 94% | 99% |

## Six rules that fall straight out of those numbers

**1. Half your sections are not choices.** 43–55% of sections in every book
measured offer exactly one way forward. A branching story is not a decision
every paragraph; it is scenes, most of which simply continue. Beginners write
a choice at every node and produce a machine, not a story.

**2. When there is a choice, it is two-way 77–87% of the time.** Three options
are the exception. Four are rare — 2 to 9 per book. If your draft is all
three-and four-way choices, you are building a hedge maze, and the reader
cannot hold it.

**3. Never make the reader take more than three forced jumps in a row.** R. A.
Montgomery worked to a rule that "the average number of no-choice jumps a
player will tolerate is three." Independently measured across 2,000 random
playthroughs of the five gamebooks: the longest run of consecutive no-choice
sections is **2 to 4, median 2–3.** Two matching numbers from different eras.
Treat four as your ceiling.

**4. A reader sees about a tenth of the book.** Random walks through the five
gamebooks visit 28–34 sections and read 1,900–6,300 words of a 23,000–55,000
word book: **8–13%.** *The Cave of Time* is the same order. So the book is a
space, not a text — and every path through it has to work as a whole story on
its own, because for most readers it is the whole story.

**5. Everything must be reachable.** 93–100% of sections in every published
book can be reached from section 1. Orphaned nodes are the commonest bug in an
amateur branching story and they are invisible without a tool. Run the audit.

**6. The choice line is one sentence, about 11 words.** Median 11–12 across all
five books, 90th percentile 15–21. Not a paragraph. Not a label.

## Writing a node

**Open on a physical situation.** Not a summary of where you are. The reader may
have arrived here from three different places and needs the room, not the plot.

**Orient in the first sentence.** This is the discipline the form demands and
the one most drafts skip. In a linear story the previous page did the work; here
the previous page could have been any of four. Name the place, the light, the
thing in your hands. Do it in a way that is true no matter which door you came
through — and if you cannot, then this node needs splitting into two.

**One turn per node.** A node does one thing: a discovery, a threat, a
conversation, a decision. Median 55–132 words in a gamebook; a Bantam CYOA page
runs longer, two or three pages between choices. Under 40 words is a
signpost, not a scene. Over 400 and the reader is reading a book, not walking
through one.

**End on the hinge.** The last line before the choice should be the thing that
makes the choice hard. Then the options, then nothing.

## Writing the choice

Choices come in four honest kinds:

- **Direction.** Left path or right path. Cheap, and the backbone of the form.
- **Method.** Same goal, different approach — climb it or talk your way past it.
- **Nerve.** Do the frightening thing or the safe one. This is where the reader
  finds out who they are.
- **Moral.** Two goods you cannot both have. Use sparingly; they are the ones
  the reader remembers, and they stop working if every page has one.

**Rules:**

- **Both options must be plausible.** "Stab yourself in the face" is not a
  choice. The good version is a knife held point-up or point-down — a real
  mistake, not a trap.
- **Signal the kind of risk, never the outcome.** The reader cannot flip back,
  so surprise is betrayal; but tell them the ending and you have told them the
  story.
- **Never a "do nothing" option** unless waiting is genuinely a strategy in this
  world, in which case say what waiting costs.
- **Write the option in the reader's own impulse**, not as a menu label: *If you
  decide to follow the light, turn to 85.* Second person, present tense, one
  sentence.

## Mystery and vagueness are not the same thing

This is the failure that survives every structural check. The graph audits
clean, the numbers are in band, and the reader still finishes a path saying
*I didn't understand what he wanted* or *who was the man outside?*

**John Gardner's test.** Fiction has to sustain "a vivid and continuous dream,"
and it fails when the reader cannot say **who** the people are, **where** they
are, **what they are doing**, **what they are trying to do**, and **why**. Miss
any of the five and, in his words, "our emotions and judgments must be confused,
dissipated, or blocked." He also sets the bar for characters: such continuous
clarity that "nothing they do strikes us as improbable behavior for just that
character." A character who behaves in a way the reader has not been given
grounds for does not read as mysterious. She reads as arbitrary.

**Withhold information. Never withhold context.** The distinction is Jane
Friedman's and it is the practical form of the rule. *Context* is where and when
the scene is, who is in it, how they got there, how they are related, what the
world's rules are, and what each person wants. *Information* is how it turns
out. Context is the floor; information is the door. Take away the door and the
reader leans forward. Take away the floor and they fall over.

**The puzzle test.** Nathan Bransford: a real mystery is "a puzzle with a few
key pieces missing in the middle — you can see the outlines, you know roughly
what you're looking at." Vagueness is a blindfolded search for objects the
reader cannot name. Ask of every withheld thing: *can the reader describe the
shape of what they do not know?* If not, you have not made a mystery.

**Why it goes wrong.** The author's burden of knowledge. You know why she stays.
You know who the man at the fence is. Because you know, the scene reads as
charged rather than blank — to you, and to nobody else.

### What this costs a branching story specifically

Three consequences that do not apply to a novel:

1. **Second person means the reader chooses as the protagonist.** If what the
   protagonist wants in the next sixty seconds is unclear, the choice is not
   hard, it is unanswerable. Vagueness about the viewpoint character's motive
   does not create atmosphere; it disables the mechanism. **Name the want, in
   the node, immediately above the choice.**
2. **Anybody who appears on more than one path must be established on all of
   them.** A recurring character explained in one branch is an unexplained
   stranger to every reader who took another. In a draft of *The Red Lamp* the
   antagonist's identity — the man who made you, ninety-four years ago — was
   established only inside the branch where you answer the telephone. A reader
   who hung up finished the story calling him "a vampire hunter or something."
   The graph was fine. The introduction was in one node instead of four.
3. **Consequences must be legible even when they are not explained.** If
   something enormous happens and the text declines to say what it meant, the
   reader will not read restraint; they will read an author who forgot. You may
   absolutely leave the meaning open — but say plainly *what occurred*, and let
   the silence fall on the interpretation, not on the event.

### The four-line check, per node

Before you leave a node, answer these in one line each. If you cannot, the
reader cannot either.

- **Where am I, and who is here?**
- **What do I want in the next sixty seconds?**
- **What is in the way?**
- **What do I not know, and can I describe its shape?**

## Give each mouth a different shape

The test is mechanical and unforgiving: **strip every dialogue tag from a page
and see whether you can still tell who is speaking.** If you cannot, the
characters do not have voices, they have lines. Two people who sound alike are
one person having an argument with himself, and a reader feels it before they
can name it.

A character's *idiolect* — their own private dialect — is built from levers you
can set deliberately, one at a time:

| Lever | What to vary |
|---|---|
| **Vocabulary** | Trade, schooling, decade. A millwright and a delegate reach for different nouns for the same object. |
| **Sentence length** | Clipped, or long and joined with *and*. This is the loudest difference and the easiest to hold. |
| **Grammar** | Contractions or none. Dropped subjects. Whether they finish sentences. |
| **How they answer** | Straight, sideways, with a fact, with another question, or by changing the subject. |
| **What they never say** | The strongest lever and the least used. A character with no word for *grace*, or who cannot say *I'm frightened*, is characterised every time the gap shows. |
| **Openers and fillers** | "Well." "Right." "I'm not going to pretend." Two per character, no more. |
| **Register under stress** | Some people get shorter. Some get formal. Some start doing arithmetic. |

**Write the sheet before the dialogue.** One line per character in the ledger,
naming three levers and one forbidden thing. Then, in revision, read only that
character's lines end to end and cut anything that could have come out of
somebody else's mouth.

**A warning about compression.** Terse, aphoristic dialogue reads as strong on
the page and is the commonest way a voice goes hollow: *"You know why, and it is
not the reason you made up."* That is a sentence with a shape and no content.
If a line withholds, the reader must be able to describe what is being withheld
(see the puzzle test above). If they cannot, the line is decoration. Give the
character something concrete to say instead — a date, a number, a name, an
object — and let the withholding sit in what they do not bring up.

## Two more rules the form is strict about

**Every option needs a reason a sane person would have.** Not just the good
one — *both*. If the reader cannot see why anybody would take the second option,
it is not a choice, it is a trap with a door painted on it. Fixing this is
usually a matter of one sentence of context above the menu: name the cost of the
safe route. A choice between "go the safe way" and "go the way that hurts" is
not a choice until the safe way costs something too.

**Put a beat between the temptation and the irreversible act.** Any choice the
reader cannot come back from — a death, a betrayal, the worst thing available —
gets Emily Short's *confirmation-required* structure: choose to approach, then
stand there a moment with it in your hands, then choose again. Not to be kind.
Because in life nobody does the worst thing in one motion, and a story that lets
them makes the act feel like a slip rather than a decision. A reader who falls
into the worst ending has been tripped, not tempted.

**Get the world's real facts right.** A story set inside somebody's actual
tradition, trade or century is checked by readers who know it. One wrong detail
— a lamp that behaves like a lightbulb, a rule that does not work that way —
undoes a page of good atmosphere, because it tells the reader you were
decorating rather than describing. Look the thing up. The true version is
almost always better than the invented one, and it comes with detail attached.

## World-building in a branching story

Branching fights world-building, and the fight is the reason a lot of CYOA feels
thin. In a novel the world accumulates: chapter four can rely on chapter two. In
a branching book **nothing accumulates**, because the reader may not have read
chapter two, and 90% of the book is chapter two to somebody.

Four things that actually work:

1. **Put the world in the situation, not in the exposition.** A world explained
   at a node is lost the moment the reader takes another path. A world you have
   to *stand in* — cold, a smell, a rule you are breaking by being here — comes
   through on every path, because every path has a place.
2. **Repeat the load-bearing facts in every branch that needs them.** This feels
   like bad writing and is not. The reader sees one path. Say the important
   thing on all of them, phrased differently each time.
3. **Front-load once, hard.** Section 1 and the two or three nodes below it are
   the only text every reader is guaranteed to see. That is where the world goes.
   Everything after it is variation.
4. **Let branches contradict each other about small things and never about
   large ones.** Small inconsistencies read as different days. A large one reads
   as an author who lost track.

## Endings

- **Time Cave: 40 endings.** *The Cave of Time* splits 18 good, 16 bad, 6
  ambiguous. Branching that wide needs a great many places to stop.
- **Quest: 14–22 endings and one win.** Every gamebook measured has one
  winning ending — sometimes two — and 12 to 20 deaths.
- **The series declined from 40 endings to 7 or 8 over its life**, and the later
  books favour one best ending. Fewer endings means a stronger story and less
  reason to read again. Pick your side of that trade deliberately.
- **Every ending needs weight, including the bad ones.** An ending that only
  says "you failed" wastes the one thing the reader came for.
- **Fewer than seven purely punitive endings**, whatever the length. Past that
  the book stops being a world and becomes a minefield.
- **Do not kill the reader in the first ten sections.** Early death for no
  reason teaches the reader that the book is arbitrary, and they stop investing.

## Death

Deaths are the form's oldest tool and its worst habit. Three tests:

1. **Was it earned?** The reader must be able to look back and see the mistake.
2. **Was it interesting?** A death that is a good short scene is worth reading.
3. **Was it signposted?** The choice that led here should have carried a smell
   of risk — not the outcome, the *risk*.

Fail all three and you have punished someone for turning a page.

## How to plan one

The method that survives contact, in order:

1. **Write the endings first.** All of them, one line each. You are building a
   space with exits; find the exits.
2. **Draw the map before the prose.** Nodes and arrows, on paper or in a file.
   Every new pathway is about fifteen pages you did not plan for.
3. **Decide the merge rate now** — 2% or 33% — and mark on the map where the
   bottlenecks are.
4. **Number nothing until the map is stable.** Renumbering is the tax on
   changing your mind late.
5. **Write in map order, not story order**, and re-read the whole cluster before
   each node so the arrivals stay consistent.
6. **Run the audit before you call it done.** Unreachable nodes, dead ends,
   forced runs over three, and the merge rate are all mechanical checks and none
   of them are visible by reading.

## The Scriptorium format, stat-free

The engine in `games/*/` already does everything this form needs. Use:

    *label <name>          a numbered section
    *goto <label>          "turn to 85"
    *choice / # options    the choice
    *page_break            a new screen
    *goto_scene <scene>    cross a chapter boundary
    *ending                a terminal node

Do **not** use `*create`, `*set`, or `*if` on numbers. If you want *"if you have
the silver key"*, that is a flag, not a stat, and it is legitimate — Lone Wolf
gates 11–38% of its choices that way — but every flag you add is a thing the
reader must remember and a thing you must test. Zero is the honest default;
three is plenty.

Build with `python3 build.py`; check the graph with
`python3 .claude/skills/cyoa/reference/audit.py games/<name>`.

## The five ways this goes wrong

1. **A choice on every page.** Half of a real gamebook's sections are not
   choices. Yours should not be either.
2. **Branches that never rejoin, in a story that needed them to.** Time Cave is
   a deliberate choice for a story about possibility. Chosen by accident, it is
   just an author who could not face the merging.
3. **Orphaned nodes.** Written, numbered, unreachable. Run the audit.
4. **Cheap deaths in the first pages.** The reader concludes the book is
   arbitrary, and they are right.
5. **A world explained instead of inhabited.** The reader will see a tenth of
   what you wrote. Put the world in the rooms.
6. **Vagueness wearing mystery's coat.** A reader who cannot name what the
   protagonist wants, or who the second person in the room is, is not
   intrigued. Run the four-line check.
7. **One voice in several mouths.** Strip the tags. If you cannot tell them
   apart, neither can the reader.

## Sources

Structure and measurement: `reference/corpus.md`. Craft of clarity: John
Gardner, *The Art of Fiction* (the vivid and continuous dream); Jane Friedman,
*How Not to Confuse Your Readers* (information versus context); Nathan
Bransford, *Are You Creating a Mystery or Just Being Vague?* (the puzzle test);
Emily Short, *Small-Scale Structures in CYOA* (the confirmation-required
choice, and the rest of the node-level patterns). Dialogue: the idiolect levers
and the tag-strip test, from the working literature on character voice. Short
fiction: Poe's unity of effect — one sitting, one effect, every line doing
double duty — and the modern compression tradition that follows from it, with
the caveat above about compression that carries nothing.
