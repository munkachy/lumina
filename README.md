# ✠ Lumina — Catholic Bible Web App

A contemplative reader for the complete Catholic Bible — all 73 books,
1,334 chapters — in **six translations**:

| Translation | Source | Character |
|---|---|---|
| **Douay-Rheims** (Challoner) | built in | The classic, in plain modern English (*you* for *thee*, *has* for *hath*, *Do not fear* for *Fear ye not*) — with Challoner's 1,222 chapter summaries and 1,749 notes. The **original wording** is one choice away in the translation menu; [`tools/build-plain.py`](tools/build-plain.py) makes the plain version |
| **Grail Psalms** (1963) | your own file | The Psalms as chanted in the Divine Office; Psalms only (other books show the Douay). Under copyright, so not included: import your own copy (see below) |
| **Catholic Public Domain Version** (2009) | built in | Modern English from the same Latin Vulgate |
| **World English Bible, British Edition** | built in | Very easy modern English, complete with Deuterocanon |
| **Good News Translation** | API.Bible, live | The easiest reading of all (incl. Sirach via your GNT license) |
| **Amplified Bible** | API.Bible, live | Expanded renderings that unfold each phrase |
| **NASB 2020** | API.Bible, live | The most literal modern English |

The Douay, CPDV and WEBBE are embedded and work **offline**, and so does the Grail once you import
your own copy; the last three are fetched
live from **API.Bible** (American Bible Society) under your personal key, which
is the licensed way to display these copyrighted translations.

**No server, no database, no AI.** Four files. It runs anywhere a browser runs.

## Features

- **Floating chapter bar** — in a chapter, a thin bar stays at the top as you scroll:
  ‹ previous chapter · Book · Chapter · Verse (jumps within the chapter and lights the verse) ·
  ♡ save the chapter · Summary (opens in the bar, so you keep your place) · › next chapter.
  The bottom bar's **Psalter** button opens the Monastic Psalter of Saint Bernard Abbey
  (munkachy.github.io/sing-with-us/psalter), and its **Timer** works like ⏱ at the top,
  showing the time left.
- **⏱ Timer** — beside 🔍. 40 minutes by default (or 10–60, or any number). It keeps counting
  wherever you go in Lumina, and even if Lumina is closed and reopened; the button shows the
  minutes left. At the end: a chime, or a chime and then a sentence you write, said in your
  reading voice. iPhone pauses web pages when the screen locks, so for an alarm that rings
  anyway choose **iPhone timer**: Lumina starts the Clock app's timer through a one-step
  Shortcut (setup steps are in the timer sheet).
- **▶ Read aloud** — **Listen** on the bottom bar (or ▶ by A−/A+) reads what is on screen, from the first verse or
  paragraph you can see: a chapter, a Psalm, the Catechism, a Church document. Each verse is
  lit up as it is read and the page follows along; ■ stops. **⚙** sets the voice: voice and
  accent, speed, pitch, intonation, word spacing, vowel length, the pause between verses, and
  a clarity filter. The defaults (American Male 3, 160 words a minute, 40 ms between words)
  were chosen by measurement: see [`tools/voice-clarity.md`](tools/voice-clarity.md).
  ⚙ also offers **Device voice (natural)**: your phone's own synthetic voice (on an iPhone,
  Apple's voices, recorded by hired voice actors), labelled plainly as a machine voice, in
  keeping with Pope Leo XIV's 2026 Message *Preserving Human Voices and Faces*.
  **Tap a highlight** and open *Hear it in other voices* for Vox Machina's 22 presets
  (Gregorian Machine, Cold Cathedral, Kraftwerk, West Coast Talkbox…), with the robot amount
  at 50% to start; *♪ Tune* gives a sung preset a new melody. The voice is eSpeak NG, made on
  the device (the 18 MB engine downloads on the first ▶); no recorded human voice is used.
- **✠ Church Documents** — choose it from the **Book** menu. A compact library ranked by
  authority, each document with a one-sentence summary; tap a level's name to read what
  kind of assent it asks. At the top, the solemn definitions of councils: *Constantinople III*
  on the two wills of Christ, Trent's decrees on *Justification*, the *Eucharist* and the
  *Sacrifice of the Mass*, and Vatican I's *Dei Filius* on faith and reason, each in Lumina's
  own translation from the original, with a public-domain translation one tap away
  (Percival 1900, Waterworth 1848, Manning 1871). Then Vatican II's dogmatic constitutions,
  constitutions, decrees and declarations, and St John Paul II's *Veritatis Splendor* and
  *Reconciliatio et Paenitentia* (texts © Libreria Editrice Vaticana). The reader has
  section headings, a Contents menu, and chapter and canon numbers; highlights, notes,
  favorites and search all work. **¶** gives a random paragraph, **Chapter** a random
  section, **Library** the list.
- **Ⓢ Scriptorium** — on the menu where the Tree used to be. Talk to Scriptorium, the AI
  app on your Mac (Faith, Code and Mail), from anywhere. Locked with your password; every
  message is encrypted on this device before it travels through a private GitHub repo, and
  only your Mac can read it. Catechism and Douay citations in answers open right here in
  Lumina. **🎙 Speak** sends your voice (encrypted) to Whisper on the Mac; the words appear a few
  seconds behind you, and you can correct them before sending. The code is in
  [`scriptorium.js`](scriptorium.js); set it up from Scriptorium's Settings on the Mac.
- **🌳 The Psalm Tree** *(retired from the menu; still reachable from history)* — a way into the Psalter by choice instead of chance.
  Twelve branches open like a flow chart, each closed until you open it:
  *Earth, Sky & Water · Things Made by Hands · Creatures · Places of the Soul ·
  The Body at Prayer · Names of God · States of the Soul · Gestures & Postures ·
  The Hours · Food & Drink · Sounds & Silence · Christ in the Psalms*.
  Each branch holds twigs (Rivers & streams, Bow & arrow, Deer & wild goats,
  Shepherd, Thirst & longing, Dawn & morning, The Passion…), and each twig holds
  the verses that carry that image: the Grail's, once you have imported your Grail
  file, and otherwise the same verses in the Douay. Every one of the 150 psalms hangs on the
  tree. Tap a verse to open its psalm with the verse illuminated. Key **T**.
- **🌳 The Gospels & Acts Tree** — the same Tree button, switched to *Gospels & Acts*.
  Fourteen branches: *The Life of Christ & His Church* (the Rosary mysteries, then
  every scene in order from the Word before all ages to Paul in Rome) · *What He Does* ·
  *What He Says* · *His Questions* · *Parables* · *Names of Jesus* · *People* · *Places* ·
  *States of the Soul* · *Touch & Gesture* · *Hours & Feasts* · *Bread, Wine & Water* ·
  *Creation & Things* · *Scripture Fulfilled*. Leaves are **scenes** — 261 of them, each
  gathering every Evangelist's telling ("Told in Mt · Mk · Lk · Jn") with its key verse
  lit — or single verses, shown in your chosen translation. Verses that quote a Psalm
  carry a link straight to that Psalm. Every chapter of the four Gospels and Acts is on
  the tree.
- **Random Verse** — uniform across the whole Bible, or a chosen *Focus*
  (Old/New Testament, Gospels, Epistles, Psalms, Deuterocanonical Books,
  Prophetic Books, Wisdom Literature, Pentateuch).
- **Random Chapter** — a complete chapter at random, honoring the Focus.
- **Full Chapter** — from any verse, one tap opens its chapter with the verse
  gently illuminated.
- **Books menu** — choose any book and chapter by hand.
- **Bible selector** — switch among all the translations anywhere; your place is kept.
- **⇄ Compare** — on any verse, view every translation side by side (the Grail joins in the Psalms once imported).
- **Text size** — A− / A+ buttons (or keyboard − / +) scale the whole app; remembered.
- **Catechism of the Catholic Church** (locked: it opens with your Scriptorium password, once per device, because the text is © Libreria Editrice Vaticana and is kept encrypted here) — choose it in the Book selector: all 2,865
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
4. Drag in all the files: **`index.html`**, **`bible-data.js`**, **`data-grail-map.js`**,
   **`data-tree.js`**, **`data-gtree.js`**, **`data-cpdv.js`**, **`data-webc.js`**, **`data-summaries.js`**,
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
| `data-grail-map.js` | The Grail's verse numbers against the Douay's (numbers only, no text), so the Trees work without a Grail file |
| `data-tree.js` | The Psalm Tree: branches, twigs and their verses (loads on first Tree tap) |
| `data-gtree.js` | The Gospels & Acts tree: scenes, branches, twigs (loads when first opened) |
| `data-cpdv.js` | CPDV text (loads only when first selected) |
| `data-webc.js` | WEBBE text (loads only when first selected) |
| `data-summaries.js` | AI chapter summaries (loads on first Summary tap) |
| `data-catechism.js` | The Catechism, 2,865 ¶ (loads when first selected) |
| `vox/` | The voice: Vox Machina's eSpeak NG engine and effects (GPL v3, see `vox/lib/ESPEAK-NG-LICENSE.txt`), and `lumina-voice.js`, which reads Lumina aloud |
| `data-docs.js` | Church documents: ten of Vatican II, *Veritatis Splendor*, *Reconciliatio et Paenitentia* (loads when first selected; built by `tools/build-docs.py` from vatican.va and `tools/councils/`) |

Favorites, highlights, notes, search history, and plan progress are saved on the device at once.
**With Scriptorium set up, they are also kept on GitHub**: compressed, encrypted with the
Scriptorium password, and stored as comments on the relay repo's "Lumina data" issue. Lumina sends
changes a few seconds after you make them and fetches new ones when it opens, merging both ways
(edits and deletions on either device carry over). Everything else you choose travels too:
your reading place, translation, theme, text size, timer and voice settings, Scriptorium's display
settings. Opening Lumina on another device takes you to where you stopped. A running timer stays on its
device. Your Grail file is kept too, encrypted in the private relay, so a new or cleared device
gets it back without importing it again; replacing or removing it on one device does the same on
the others. It is never shared with anyone. They survive a lost phone or a cleared browser,
and match on every device where Scriptorium is unlocked. *Favs → ⇪ Back up & export* shows the
last sync, a *Sync now* button, and a switch to turn it off.
**⇪ Back up & export** (on the Favorites screen) saves them as a file you can keep anywhere;
on a phone the share sheet offers *Save to Files → Google Drive*. **Restore** reads a backup
back in on this or another device, adding what is missing and never removing anything.
**Readable copy** gives your highlights and notes as a page in Bible order, to read or print.

*Keys: R = random verse · C = random chapter · T = Psalm Tree · ← / → = previous / next.*

## The Grail Psalms and the Psalm Tree

**The Grail Psalms are under copyright, so they are not in this repository** or on the
public site. Each reader brings their own copy, as a file, and Lumina keeps it on that
device only:

1. Keep your Grail file (`grail.selah-pack.v1.json`) somewhere your phone can reach it:
   the Files app, iCloud Drive or Google Drive.
2. In Lumina, open the **Book** menu and choose **Grail Psalms file…** (or simply choose
   **Grail Psalms**), then **Choose your Grail file**.
3. That is all. The file is kept in this browser on this device, and, if Scriptorium sync is on,
   encrypted in your private relay so your other devices get it; it is never shared.
   Do it once on each phone or computer. **Grail Psalms file…** also replaces or removes it.

On an iPhone, Safari may clear a site's storage if the site is not opened for about a week;
adding Lumina to the Home Screen (Share → Add to Home Screen) keeps it. If the Grail is ever
gone, Lumina opens on the Douay and says so; import the file again.

The same file works in SELAH, the psalm rhythm game in
[munkachy/monastic-games](https://github.com/munkachy/monastic-games) (`selah/PLAN.md`).

The Grail text came from a Word copy of the Psalter used in choir. It follows the
Hebrew psalter; Lumina files it under the Vulgate numbering of the Douay-Rheims so the
two line up psalm for psalm and verse for verse (Grail 10 is Vulgate 9:22–39, Grail
114–115 is Vulgate 113, Grail 116 is Vulgate 114–115, Grail 147 is Vulgate 146–147).
Each psalm shows its Latin incipit; Psalm 118 carries its Hebrew-letter stanzas. The
Grail's chanting lines flow as one paragraph, a faint dot marking where each line ends.

**Rebuilding the Grail file and the Psalm Tree.** The sources stay private, in a
`private/` folder at the top of your Lumina folder, which git ignores (see `.gitignore`):
`private/grail-source.txt` (the text as extracted from the .docx) and
`private/grail-fixes.js` (corrections made while reading every psalm: hyphens the .docx
had lost, a stray line break after each, and typing slips checked against the printed
Grail). Then:

- `node tools/build-grail.js` writes `private/grail.selah-pack.v1.json` (the file to
  import), `private/data-grail.js` (for the tools) and the public `data-grail-map.js`
  (verse numbers only);
- `node tools/build-tree.js` rebuilds `data-tree.js` from `tree-rules.js` (the branches
  and twigs, and the words that gather verses to them) and `tree-edits.txt` (verses
  placed or removed by hand after reading each psalm). It refuses to finish if any psalm
  is left off the tree.

`tools/grail-pack.js` converts between Lumina's Grail data and the file.

The Gospels & Acts tree is rebuilt with `node tools/build-gtree.js`, from
`gospel-scenes.js` (the scenes and their tellings), `gospel-tree-rules.js` (branches,
twigs, hand-picked verses, patterns and the corrections made after reading every
twig) and `nt-refs.js` (modern → Douay verse numbering, which differs in a handful of
chapters). It refuses to finish if a scene or a chapter is left off the tree, or a
Psalm link points nowhere.

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
Psalms © 1963 The Grail (England), not included: each reader imports their own copy; CPDV by
Ronald L. Conte Jr. (sacredbible.org, public domain); World English Bible from
eBible.org (public domain). GNT © American Bible Society; Amplified and NASB
2020 © The Lockman Foundation — both displayed under license via API.Bible.
Lumina itself carries no copyright claim.
