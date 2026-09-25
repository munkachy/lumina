/* Parse the Grail Psalms source text (extracted from the .docx) into one part per heading.
   Each part: { heb, vg, inc, vs:[{n,t}], marks:{index:label}, stanza:{index:1} } */
const fs = require("fs");
const FIXES = require("./grail-fixes.js");
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function corrected(file){
  let src = fs.readFileSync(file, "utf8")
    .replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&apos;/g, "'");
  FIXES.replace.forEach(([from, to]) => {
    if (!src.includes(from)) throw new Error("grail-fixes: text not found: " + JSON.stringify(from));
    src = src.split(from).join(to);
  });
  Object.keys(FIXES.hyphens).forEach(w => {
    /* the word, and a line break after it unless the next line starts a verse */
    const re = new RegExp("(^|[^A-Za-z])" + esc(w) + "(?![A-Za-z])(\n(?![\\/.\\[]?\\d))?", "g");
    src = src.replace(re, (m, pre, br) => pre + FIXES.hyphens[w] + (br ? " " : ""));
  });
  return src;
}
module.exports = function parseGrail(file){
const src = corrected(file);
const lines = src.split("\n");
const HEAD = /^Psalm\s+(\d+)(?:\.(\d))?\s*\((\d+)(?:\.(\d))?\)\s*(.*)$/;
const parts = [];         // one per heading in the source
let cur = null, pend = "";
for (let raw of lines){
  const line = raw.replace(/\s+/g, " ").trim();
  if (!line) continue;
  if (/^Psalm\s*\(151\)/.test(line)) break;           // outside the number; not in the Vulgate 150
  const h = line.match(HEAD);
  if (h){ cur = { heb: +h[1], vg: +h[3], inc: h[5].trim(), vs: [], marks: {} }; parts.push(cur); pend = ""; continue; }
  if (!cur) continue;
  if (/^\*/.test(line)){ cur.marks[cur.vs.length] = line.replace(/^\*/, "").trim(); continue; }
  if (/^\[\.?$/.test(line)) continue;                   // opening of a bracketed doxology verse
  const dox = line.match(/^\[?(\d+)\]\s*(.*)$/);       // "[19] ever blessed…" / "14] Blessed be…"
  if (dox){ cur.vs.push({ n: +dox[1], t: dox[2] }); continue; }
  /* "16c", "3b": a half-verse the Grail has moved; the marker is dropped, the line kept */
  const moved = line.match(/^\.?\d+[abc]\s+(.*)$/);
  if (moved && cur.vs.length){ const l = cur.vs[cur.vs.length - 1]; l.t += "\n" + moved[1]; continue; }
  /* "/" before a number marks a new stanza in the source layout */
  const m = line.match(/^(\/?)\.?(\d+)(?:\s+(.*))?$/);
  if (m){
    if (m[1]) cur.stanza = cur.stanza || {}, cur.stanza[cur.vs.length] = 1;
    cur.vs.push({ n: +m[2], t: [pend, m[3] || ""].filter(Boolean).join("\n") }); pend = ""; continue;
  }
  if (!cur.vs.length){ pend = pend ? pend + "\n" + line : line; continue; }   // e.g. ALLELUIA! before v.1
  const last = cur.vs[cur.vs.length - 1];
  last.t = last.t ? last.t + "\n" + line : line;
}
return parts;
};
if (require.main === module) process.stdout.write(JSON.stringify(module.exports(process.argv[2]), null, 1));
