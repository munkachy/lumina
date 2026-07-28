# ✠ Lumina — Catholic Bible Web App

A contemplative reader for the complete Catholic Bible — all 73 books,
1,334 chapters — in **six translations**:

| Translation | Source | Character |
|---|---|---|
| **Douay-Rheims** (Challoner) | built in | The classic — with Challoner's 1,222 chapter summaries and 1,749 notes |
| **Catholic Public Domain Version** (2009) | built in | Modern English from the same Latin Vulgate |
| **World English Bible, British Edition** | built in | Very easy modern English, complete with Deuterocanon |
| **Good News Translation** | API.Bible, live | The easiest reading of all (incl. Sirach via your GNT license) |
| **Amplified Bible** | API.Bible, live | Expanded renderings that unfold each phrase |
| **NASB 2020** | API.Bible, live | The most literal modern English |

The first three are embedded and work **offline**; the last three are fetched
live from **API.Bible** (American Bible Society) under your personal key, which
is the licensed way to display these copyrighted translations.

**No server, no database, no AI.** Four files. It runs anywhere a browser runs.

## Features

- **Random Verse** — uniform across the whole Bible, or a chosen *Focus*
  (Old/New Testament, Gospels, Epistles, Psalms, Deuterocanonical Books,
  Prophetic Books, Wisdom Literature, Pentateuch).
- **Random Chapter** — a complete chapter at random, honoring the Focus.
- **Full Chapter** — from any verse, one tap opens its chapter with the verse
  gently illuminated.
- **Books menu** — choose any book and chapter by hand.
- **Bible selector** — switch among all six translations anywhere; your place is kept.
- **⇄ Compare** — on any verse, view all six translations side by side.
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

All three translations share the traditional Vulgate arrangement: Psalms are
numbered the Catholic way in every translation (Psalm 22 is *The Lord is my
shepherd* in all three), Daniel keeps chapters 13–14, Baruch keeps chapter 6.
Where a passage exists only in the Vulgate tradition (e.g. Esther 11–16),
Lumina shows the Douay text with a gentle notice.

## Try it on your computer

Open the folder and **double-click `index.html`**. Entirely offline.

## Publish free on GitHub Pages

1. Create a free account at **github.com** (or sign in).
2. **+** (top-right) → **New repository** → name it `lumina`, Public → **Create repository**.
3. Click **"uploading an existing file"** (or **Add file → Upload files**).
4. Drag in all six files: **`index.html`**, **`bible-data.js`**,
   **`data-cpdv.js`**, **`data-webc.js`**, **`data-summaries.js`**,
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
| `data-cpdv.js` | CPDV text (loads only when first selected) |
| `data-webc.js` | WEBBE text (loads only when first selected) |
| `data-summaries.js` | AI chapter summaries (loads on first Summary tap) |
| `data-catechism.js` | The Catechism, 2,865 ¶ (loads when first selected) |

Favorites, highlights, notes, search history, and plan progress live in your
browser's local storage — private to each device, no account required.

*Keys: R = random verse · C = random chapter · ← / → = previous / next.*

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

Douay-Rheims text from your Nexus project files (public domain); CPDV by
Ronald L. Conte Jr. (sacredbible.org, public domain); World English Bible from
eBible.org (public domain). GNT © American Bible Society; Amplified and NASB
2020 © The Lockman Foundation — both displayed under license via API.Bible.
Lumina itself carries no copyright claim.
