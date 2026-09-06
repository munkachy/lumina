# Measured corpus — branching stories without stats

Two kinds of evidence, kept apart because they were gathered differently.

**A. Five complete gamebooks, measured directly.** 1,800 numbered sections and
205,363 words. Released under a free licence by their authors and hosted by
Project Aon, so the text is legally readable and machine-readable. No game text
is stored in this repository — these are measurements only.

**B. Six Bantam-format CYOA books**, from published structural analyses by Sam
Kabo Ashwell, who drew the digraphs by hand. Those books are in copyright; the
numbers are cited, not derived here.

## How to re-derive part A

    curl -O https://www.projectaon.org/en/xhtml/lw/01fftd/01fftd.zip
    # also 05sots, 12tmod, 20tcon; and fw/01hh/01hh.zip
    unzip each, then: python3 measure_gamebooks.py

Project Aon marks structure in the HTML itself, which is what makes this
possible: `<p class="choice">` for a branch, `<p class="deadend">` for a
terminal failure, `<p class="combat">` for a fight.

## A. The gamebooks

| | LW1 1984 | LW5 1985 | LW12 1988 | LW20 1993 | Freeway Warrior 1 1988 |
|---|---|---|---|---|---|
| Sections | 350 | 400 | 350 | 350 | 350 |
| Words (prose only) | 22,958 | 40,317 | 41,961 | 54,857 | 46,250 |
| Mean words/section | 66 | 101 | 120 | 157 | 132 |
| Median words/section | 55 | 83 | 98 | 132 | 104 |
| Longest section | 472 | 586 | 761 | 851 | 470 |
| Sections with 0 branches | 17 | 14 | 21 | 21 | 22 |
| Sections with 1 (a forced jump) | 157 | 156 | 170 | 143 | 161 |
| **No choice at all** | **50%** | **43%** | **55%** | **47%** | **52%** |
| Two-way choices | 135 | 178 | 133 | 144 | 146 |
| Three-way | 36 | 43 | 24 | 34 | 14 |
| Four or more | 5 | 9 | 2 | 8 | 7 |
| **Two-way share of choices** | **77%** | **77%** | **84%** | **77%** | **87%** |
| Terminal sections | 17 | 14 | 21 | 21 | 22 |
| — marked deadend (death) | 16 | 12 | 20 | 20 | 20 |
| — other (win / cliff) | 1 | 2 | 1 | 1 | 2 |
| Sections with in-degree ≥ 2 | 128 | 149 | 112 | 112 | 108 |
| **Merge rate** | **37%** | **37%** | **32%** | **32%** | **31%** |
| Highest in-degree | 9 | 13 | 11 | 9 | 6 |
| Choice lines total | 556 | 680 | 516 | 565 | 523 |
| Median choice-line words | 11 | 12 | 11 | 12 | 11 |
| 90th percentile | 19 | 18 | 21 | 20 | 15 |
| Choices gated on an item/skill | 11% | 15% | 25% | 38% | 12% |
| Reachable from section 1 | 100% | 93% | 100% | 94% | 99% |
| Deepest section from §1 | 33 | 54 | 97 | 53 | 95 |
| Sections with a formal combat | 29 | 39 | 65 | 26 | 32 |

### Random walks (600 per book, uniform choice)

| | LW1 | LW5 | LW12 | LW20 | FW1 |
|---|---|---|---|---|---|
| Median sections visited | 28 | 34 | 29 | 28 | 32 |
| Median words read | 1,930 | 3,767 | 5,821 | 6,283 | 5,900 |
| Share of the book seen | 8% | 9% | 14% | 11% | 13% |
| Median longest run of no-choice sections | 2 | 2 | 3 | 3 | 4 |
| Worst run seen | 5 | 4 | 8 | 3 | 4 |

That last row is the important one. R. A. Montgomery worked to a rule that a
reader tolerates about **three** consecutive no-choice jumps. Measured
independently across a different publisher, a different decade and 3,000
walks: the median longest run is **2–3** and the ceiling is **4**.

### The trend across the series

Sections stay at 350. Words per section nearly triple, 66 → 157 across nine
years. Gating rises 11% → 38%. Three-and-four-way choices do not increase.
The books got wordier and more conditional, not more branchy.

## B. Bantam-format CYOA (cited)

| Book | Year | Pages | Nodes | Choices | Endings | Merges |
|---|---|---|---|---|---|---|
| The Cave of Time (Packard) | 1979 | 114 | — | 39 | **40** (18 good, 16 bad, 6 ambiguous) | **2** |
| Secret of the Knights (Time Machine 1) | 1984 | 124 | 42 | 17 | 1 good | heavy, forced loopbacks |
| In Search of a Shark (Explorer 3) | 1987 | 109 | 38 | 16 | 10 (1 good, 9 bad) | minimal |
| The Island of Time (Montgomery) | 1991 | — | — | **11** | mostly neither good nor bad | none |
| African Safari (Young Indiana Jones 5) | 1993 | 110 | 18 | 5 | 6, mostly good | near-linear |
| Return to the Cave of Time (Packard) | 1985 | — | — | nearly all binary | asymmetric by branch | little |

Series-wide: endings fall from **40–44 in the earliest titles to 7–8 in the
latest**, and the later books favour one best ending.

**The dividing line.** *The Cave of Time* merges 2 times in 114 pages. The
gamebooks merge at 31–37%. That is the whole difference between a Time Cave and
a Quest, and it is a decision made before writing, not after.

## Sources

- Project Aon, free-licence texts: https://www.projectaon.org/
- Sam Kabo Ashwell, *Standard Patterns in Choice-Based Games* (2015) —
  https://heterogenoustasks.wordpress.com/2015/01/26/standard-patterns-in-choice-based-games/
- Ashwell, *CYOA structure: The Cave of Time* (2011), *…: Educational* (2011),
  *…: Revenge of the Return to the Island of the Son of the Cave of Time* (2011)
- Emily Short, *Small-Scale Structures in CYOA* (2016) —
  https://emshort.blog/2016/11/05/small-scale-structures-in-cyoa/
- Choose Your Own Adventure: An Analysis of Interactive Gamebooks Using Graph
  Theory, *Journal of Humanistic Mathematics* 9(2), 2019 (abstract only; the
  full PDF is behind a block)
