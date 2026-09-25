# ✠ Lumina — Catholic Bible Web App

A contemplative reader for the complete Catholic Bible — all 73 books,
1,334 chapters — in **six translations**:

| Translation | Source | Character |
|---|---|---|
| **Douay-Rheims** (Challoner) | built in | The classic — with Challoner's 1,222 chapter summaries and 1,749 notes |
| **Grail Psalms** (1963) | built in | The Psalms as chanted in the Divine Office; Psalms only (other books show the Douay) |
| **Catholic Public Domain Version** (2009) | built in | Modern English from the same Latin Vulgate |
| **World English Bible, British Edition** | built in | Very easy modern English, complete with Deuterocanon |
| **Good News Translation** | API.Bible, live | The easiest reading of all (incl. Sirach via your GNT license) |
| **Amplified Bible** | API.Bible, live | Expanded renderings that unfold each phrase |
| **NASB 2020** | API.Bible, live | The most literal modern English |

The Douay, Grail, CPDV and WEBBE are embedded and work **offline**; the last three are fetched
live from **API.Bible** (American Bible Society) under your personal key, which
is the licensed way to display these copyrighted translations.

**No server, no database, no AI.** Four files. It runs anywhere a browser runs.

## Features

- **🌳 The Psalm Tree** — a way into the Psalter by choice instead of chance.
  Twelve branches open like a flow chart, each closed until you open it:
  *Earth, Sky & Water · Things Made by Hands · Creatures · Places of the Soul ·
  The Body at Prayer · Names of God · States of the Soul · Gestures & Postures ·
  The Hours · Food & Drink · Sounds & Silence · Christ in the Psalms*.
  Each branch holds twigs (Rivers & streams, Bow & arrow, Deer & wild goats,
  Shepherd, Thirst & longing, Dawn & morning, The Passion…), and each twig holds
  the Grail verses that carry that image. Every one of the 150 psalms hangs on the
  tree. Tap a verse to open its psalm with the verse illuminated. Key **T**.
- **Random Verse** — uniform across the whole Bible, or a chosen *Focus*
  (Old/New Testament, Gospels, Epistles, Psalms, Deuterocanonical Books,
  Prophetic Books, Wisdom Literature, Pentateuch).
- **Random Chapter** — a complete chapter at random, honoring the Focus.
- **Full Chapter** — from any verse, one tap opens its chapter with the verse
  gently illuminated.
- **Books menu** — choose any book and chapter by hand.
- **Bible selector** — switch among all the translations anywhere; your place is kept.
- **⇄ Compare** — on any verse, view every translation side by side (the Grail joins in the Psalms).
- **Text size** — A− / A+ buttons (or keyboard − / +) scale the whole app; remembered.
- **Catechism of the Catholic Church** — choose it in the Book selector: all 2,865
  paragraphs, random paragraph, random chapter, full table of contents.
- **Favorites in custom lists** — ♥ any verse or CCC paragraph; Lumina proposes
  your most recent list, or any other, or a new one. Deleting a list removes its
  favorites with it (no tedious emptying first).
- **Highlights with notes** — select any text in a chapter or verse; choose one
  of four colors and optionally attach a note. Click a highlight to read or edit
  its note, change color, or remove it.
- **Search** (☰ More) — full-text search of the active translation or the
  Catechism; your previous searches are kept as one-tap chips.
- **Daily Mass Readings** (☰ More) — the day's readings (NABRE) fetched live
  from Cathople, any date selectable.
- **Reading Plans** (☰ More) — Whole Bible (canonical), Whole Bible + daily
  Psalm, New Testament in a Year, Old Testament in a Year, Gospels in 90 Days;
  daily portions, one-tap chapter access, progress tracking.
- **Chapter summaries** — a Summary button on every verse and chapter view
  (AI-written synopses of all 1,334 chapters).
- **Proverbs focus** — draw random verses from Proverbs alone.
- Challoner's summaries and ✝ notes (Douay) · psalm headings (WEBBE) ·
  copy with citation · previous/next · remembers your place · light/dark themes.

All the built-in translations share the traditional Vulgate arrangement: Psalms are
numbered the Catholic way in every translation (Psalm 22 is *The Lord is my
shepherd* in all of them, the Grail included), Daniel keeps chapters 13–14, Baruch keeps chapter 6.
Where a passage exists only in the Vulgate tradition (e.g. Esther 11–16),
Lumina shows the Douay text with a gentle notice.

## Try it on your computer

Open the folder and **double-click `index.html`**. Entirely offline.

## Publish free on GitHub Pages

1. Create a free account at **github.com** (or sign in).
2. **+** (top-right) → **New repository** → name it `lumina`, Public → **Create repository**.
3. Click **"uploading an existing file"** (or **Add file → Upload files**).
4. Drag in all the files: **`index.html`**, **`bible-data.js`**, **`data-grail.js`**,
   **`data-tree.js`**, **`data-cpdv.js`**, **`data-webc.js`**, **`data-summaries.js`**,
   **`data-catechism.js`** → **Commit changes** (~18 MB total; allow a minute).
5. **Settings → Pages** → Source: *Deploy from a branch* → branch **main**, folder **/ (root)** → **Save**.
6. After about a minute, your Bible lives at
   **`https://YOURUSERNAME.github.io/lumina/`** — reachable from any device on earth.

To update later, upload the changed files again the same way.

## The files

| File | Purpose |
|---|---|
| `index.html` | The entire application |
| `bible-data.js` | Douay-Rheims text (loads at start; defines the canonical structure) |
| `data-grail.js` | Grail Psalms, Vulgate-numbered (loads when first selected, or with the Tree) |
| `data-tree.js` | The Psalm Tree: branches, twigs and their verses (loads on first Tree tap) |
| `data-cpdv.js` | CPDV text (loads only when first selected) |
| `data-webc.js` | WEBBE text (loads only when first selected) |
| `data-summaries.js` | AI chapter summaries (loads on first Summary tap) |
| `data-catechism.js` | The Catechism, 2,865 ¶ (loads when first selected) |

Favorites, highlights, notes, search history, and plan progress live in your
browser's local storage — private to each device, no account required.

*Keys: R = random verse · C = random chapter · T = Psalm Tree · ← / → = previous / next.*

## The Grail Psalms and the Psalm Tree

The Grail text comes from a Word copy of the Psalter used in choir. It follows the
Hebrew psalter; Lumina files it under the Vulgate numbering of the Douay-Rheims so the
two line up psalm for psalm and verse for verse (Grail 10 is Vulgate 9:22–39, Grail
114–115 is Vulgate 113, Grail 116 is Vulgate 114–115, Grail 147 is Vulgate 146–147).
Each psalm shows its Latin incipit; Psalm 118 carries its Hebrew-letter stanzas.

The `tools/` folder rebuilds both data files (`node tools/build-grail.js`, then
`node tools/build-tree.js`):

- `grail-source.txt` — the text as extracted from the .docx;
- `grail-fixes.js` — corrections made while reading every psalm: hyphens the .docx
  had lost (*evil-doers, ten-stringed, red-hot…*), a stray line break after each,
  and typing slips checked against the printed Grail;
- `tree-rules.js` — the branches and twigs, and the words that gather verses to them;
- `tree-edits.txt` — verses placed or removed by hand after reading each psalm.

`build-tree.js` refuses to finish if any psalm is left off the tree.

## The API translations & your key

The GNT, Amplified, and NASB are **not stored in these files** — each chapter is
fetched from API.Bible when you open it, with the required attribution shown and
API.Bible's usage reporting (FUMS) included. Psalms are automatically converted
between the Catholic (Vulgate) numbering Lumina uses and the Hebrew numbering
these editions use — Psalm 22 is the Shepherd Psalm everywhere. Passages these
editions lack (Deuterocanon, Esther 11–16, Daniel 3:24–90 & 13–14) appear in the
Douay-Rheims with a notice; Sirach in GNT works via your separate Sirach license.

**About the key:** your API key is embedded in `index.html`, and a public
GitHub Pages site exposes it to anyone who reads the source. For a free
personal key the practical risk is only that someone else could use your
request quota. If that ever happens, regenerate the key in your API.Bible
dashboard (scripture.api.bible) and replace it in `index.html` (the
`API_KEY` line near the top of the script).

## Sources & rights

Douay-Rheims text from your Nexus project files (public domain); the Grail
Psalms © 1963 The Grail (England), used by permission; CPDV by
Ronald L. Conte Jr. (sacredbible.org, public domain); World English Bible from
eBible.org (public domain). GNT © American Bible Society; Amplified and NASB
2020 © The Lockman Foundation — both displayed under license via API.Bible.
Lumina itself carries no copyright claim.
