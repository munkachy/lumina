/* Build data-grail.js from tools/grail-source.txt.
   The Grail follows the Hebrew psalter; Lumina files it under the Vulgate numbering
   of the Douay-Rheims so the two line up psalm for psalm.
   Usage: node tools/build-grail.js */
const fs = require("fs"), path = require("path");
const parseGrail = require("./grail-parse.js");
global.window = {};
require(path.join(__dirname, "..", "bible-data.js"));
const D = window.LUMINA_DATA;
const PS = D.books.findIndex(b => b.id === "psalms");
const parts = parseGrail(path.join(__dirname, "grail-source.txt"));

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
fs.writeFileSync(path.join(__dirname, "..", "data-grail.js"),
  "window.LUMINA_TX = window.LUMINA_TX || {};\n" +
  "window.LUMINA_TX['grail'] = " + JSON.stringify(out) + ";\n");
const nv = chapters.reduce((s, c) => s + c.v.length, 0);
console.log("data-grail.js: 150 psalms, " + nv + " verses");
