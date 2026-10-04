/* Build the Grail from your private copy.
   The Grail Psalms are under copyright, so their text is not in this repository. Keep your
   copy in private/ (which git ignores): private/grail-source.txt and private/grail-fixes.js.
   This writes, all from that copy:
     private/grail.selah-pack.v1.json  the file to import into Lumina on each device
     private/data-grail.js             the same, as the tools below read it
     data-grail-map.js                 public: only the Grail's verse numbers and the Douay
                                       verse each answers to, so the Trees work without it
   The Grail follows the Hebrew psalter; Lumina files it under the Vulgate numbering
   of the Douay-Rheims so the two line up psalm for psalm.
   Usage: node tools/build-grail.js */
const fs = require("fs"), path = require("path");
const PRIV = path.join(__dirname, "..", "private");
if (!fs.existsSync(path.join(PRIV, "grail-source.txt")) || !fs.existsSync(path.join(PRIV, "grail-fixes.js"))){
  console.error("The Grail is not in this repository. Put your copy in private/ (grail-source.txt, grail-fixes.js).");
  process.exit(1);
}
const parseGrail = require("./grail-parse.js");
const { toPack } = require("./grail-pack.js");
global.window = {};
require(path.join(__dirname, "..", "bible-data.js"));
const D = window.LUMINA_DATA;
const PS = D.books.findIndex(b => b.id === "psalms");
const parts = parseGrail(path.join(PRIV, "grail-source.txt"));

/* Where the Vulgate joins two Hebrew psalms, the second continues the Vulgate verse count */
const JOIN_OFFSET = { "9:10": 21, "113:115": 8 };

/* typographer's quotes: an opening mark follows a space, a line start or a bracket */
function curly(t){
  return t.replace(/(^|[\s(\[—])"/gm, "$1\u201c").replace(/"/g, "\u201d")
          .replace(/(^|[\s(\[—\u201c])'/gm, "$1\u2018").replace(/'/g, "\u2019");
}

const chapters = [];
for (let vg = 1; vg <= 150; vg++){
  const mine = parts.filter(p => p.vg === vg);
  if (!mine.length) throw new Error("no Grail text for Vulgate psalm " + vg);
  const drb = D.books[PS].ch[vg - 1];
  const drbNums = drb.v.map((_, i) => drb.n ? drb.n[i] : i + 1);
  const ch = { v: [], n: [], d: [] };
  const titleParts = [];
  mine.forEach(p => {
    const off = JOIN_OFFSET[vg + ":" + p.heb] || 0;
    if (p.inc) titleParts.push(p.inc);
    const base = ch.v.length;
    /* the Hebrew letters that head the stanzas of Psalm 118(119): "Aleph (A) I" -> "I · Aleph" */
    Object.keys(p.marks).forEach(k => {
      const m = p.marks[k].match(/^(\S+)\s*\([^)]*\)\s*([IVXL]+)$/);
      (ch.h = ch.h || {})[base + +k] = m ? m[2] + " · " + m[1] : p.marks[k];
    });
    Object.keys(p.stanza || {}).forEach(k => { if (base + +k > 0) (ch.sb = ch.sb || []).push(base + +k); });
    if (mine.length > 1 && base > 0) (ch.sb = ch.sb || []).push(base);
    p.vs.forEach(x => {
      const num = x.n + off;
      ch.v.push(curly(x.t.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim()));
      ch.n.push(num);
      /* Douay index for this verse: same number, else the nearest before it */
      let di = drbNums.indexOf(num);
      if (di < 0){ di = 0; drbNums.forEach((m, k) => { if (m <= num) di = k; }); }
      ch.d.push(di);
    });
  });
  if (ch.sb) ch.sb = [...new Set(ch.sb)].sort((a, b) => a - b);
  ch.title = titleParts.join(" · ");
  if (ch.n.every((m, i) => m === i + 1)) delete ch.n;
  chapters.push(ch);
}

const books = D.books.map((bk, b) => b === PS
  ? { id: bk.id, name: "Psalms", ch: chapters }
  : { id: bk.id, name: bk.name, ch: [] });
const out = { id: "grail", name: "The Grail Psalms", abbr: "Grail", books };
fs.writeFileSync(path.join(PRIV, "data-grail.js"),
  "window.LUMINA_TX = window.LUMINA_TX || {};\n" +
  "window.LUMINA_TX['grail'] = " + JSON.stringify(out) + ";\n");
fs.writeFileSync(path.join(PRIV, "grail.selah-pack.v1.json"), JSON.stringify(toPack(out), null, 1));
/* numbers only: for each psalm, the Douay index of each Grail verse (d) and the Grail's own
   verse numbers where they are not 1, 2, 3... (n) */
fs.writeFileSync(path.join(__dirname, "..", "data-grail-map.js"),
  "/* The Grail's verse numbers against the Douay's, for the Trees when no Grail file is imported. No text. */\n" +
  "window.LUMINA_GRAIL_MAP = " + JSON.stringify(chapters.map(c => c.n ? { d: c.d, n: c.n } : { d: c.d })) + ";\n");
const nv = chapters.reduce((s, c) => s + c.v.length, 0);
console.log("private/grail.selah-pack.v1.json and private/data-grail.js: 150 psalms, " + nv + " verses; data-grail-map.js");
