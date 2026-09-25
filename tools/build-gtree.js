/* Build data-gtree.js — the Gospel Tree (the four Gospels and Acts).
   Leaves are scenes ("s:<id>") or single verses [book, chapter, verse(, "psalm:verse")],
   all in the Douay-Rheims (Vulgate) numbering Lumina uses.
   Usage: node tools/build-gtree.js [--stats] [--review file] */
const fs = require("fs"), path = require("path");
const R = require("./nt-refs.js");
const SCENES = require("./gospel-scenes.js");
const RULES = require("./gospel-tree-rules.js");
global.window = {};
require(path.join(__dirname, "..", "bible-data.js"));
require(path.join(__dirname, "..", "data-cpdv.js"));
require(path.join(__dirname, "..", "data-grail.js"));
const GRAIL = window.LUMINA_TX.grail.books.find(b => b.ch.length).ch;
const grailHas = ref => { const [p, v] = ref.split(":").map(Number); const ch = GRAIL[p - 1]; return !!ch && (ch.n ? ch.n.includes(v) : v >= 1 && v <= ch.v.length); };
const D = window.LUMINA_DATA, CP = window.LUMINA_TX.cpdv;
const ORDER = ["matthew", "mark", "luke", "john", "acts"];
const SHORT = { matthew:"mt", mark:"mk", luke:"lk", john:"jn", acts:"ac" };
const bidx = id => D.books.findIndex(b => b.id === id);
const chLen = (book, c) => D.books[bidx(book)].ch[c - 1].v.length;
let problems = 0;
const warn = m => { console.error(m); problems++; };

/* every verse of the five books, with Douay + CPDV text for the patterns */
const VERSES = [], TEXT = {};
ORDER.forEach(book => {
  const b = bidx(book);
  D.books[b].ch.forEach((ch, ci) => ch.v.forEach((t, vi) => {
    const k = book + ":" + (ci + 1) + ":" + (vi + 1);
    VERSES.push(k);
    const cp = (CP.books[b].ch[ci] && CP.books[b].ch[ci].v[vi]) || "";
    TEXT[k] = (t + " || " + cp).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').toLowerCase();
  }));
});
const vkey = (book, c, v) => book + ":" + c + ":" + v;
const posOf = {}; VERSES.forEach((k, i) => { posOf[k] = i; });

/* a passage string (possibly several, ";"-separated) → Set of verse keys */
function expand(str){
  const out = [];
  (str || "").split(";").map(s => s.trim()).filter(Boolean).forEach(s => {
    const p = R.parsePassage(s);
    for (let c = p.c1; c <= p.c2; c++){
      const a = c === p.c1 ? p.v1 : 1, z = c === p.c2 ? p.v2 : chLen(p.book, c);
      for (let v = a; v <= z; v++){
        const k = vkey(p.book, c, v);
        if (!(k in TEXT)) warn("no such verse " + k + " (from " + s + ")"); else out.push(k);
      }
    }
  });
  return out;
}

/* scenes */
const scenes = {}, sceneVerses = {}, containing = {};
SCENES.forEach(([id, title, period, tellings, key]) => {
  if (scenes[id]) warn("duplicate scene " + id);
  const tl = [];
  tellings.split(";").forEach(s => {
    const p = R.parsePassage(s);
    let t = tl.find(x => x[0] === SHORT[p.book]);
    if (!t) tl.push(t = [SHORT[p.book], []]);
    t[1].push([p.c1, p.v1, p.c2, p.v2]);
  });
  tl.sort((a, b) => ORDER.indexOf(Object.keys(SHORT).find(x => SHORT[x] === a[0])) - ORDER.indexOf(Object.keys(SHORT).find(x => SHORT[x] === b[0])));
  const kv = R.parseVerse(key);
  scenes[id] = { t: title, p: period, k: [SHORT[kv[0]], kv[1], kv[2]], tl };
  sceneVerses[id] = expand(tellings);
  if (!sceneVerses[id].includes(vkey(...kv))) warn("key verse outside scene " + id);
  sceneVerses[id].forEach(k => (containing[k] = containing[k] || []).push(id));
});
/* the most specific scene holding a verse */
const smallestScene = k => (containing[k] || []).slice().sort((a, b) => sceneVerses[a].length - sceneVerses[b].length)[0];
const sceneOrder = {}; SCENES.forEach((s, i) => { sceneOrder[s[0]] = i; });

/* branches */
const usedScenes = new Set(), chapterHit = {};
const hitChapter = k => { const [b, c] = k.split(":"); chapterHit[b + ":" + c] = true; };
const branches = RULES.map(br => ({
  id: br.id, name: br.name, icon: br.icon, desc: br.desc,
  twigs: br.twigs.map(tw => {
    const sc = [], vs = new Set();
    (tw.scenes || []).forEach(id => { if (!scenes[id]) warn("unknown scene " + id + " in " + br.id + "/" + tw.id); else if (!sc.includes(id)) sc.push(id); });
    if (tw.period){
      const ids = SCENES.filter(s => s[2] === tw.period).map(s => s[0]);
      if (!ids.length) warn("empty period " + tw.period);
      ids.forEach(id => { if (!sc.includes(id)) sc.push(id); });
    }
    expand(tw.verses).forEach(k => vs.add(k));
    if (tw.re){
      const where = tw.where ? new Set(expand(tw.where)) : null;
      const not = tw.not ? new Set(expand(tw.not)) : null;
      const matched = VERSES.filter(k => tw.re.test(TEXT[k]) && !(tw.notre && tw.notre.test(TEXT[k]))
                                      && (!where || where.has(k)) && !(not && not.has(k)));
      expand(tw.also).forEach(k => matched.push(k));
      matched.forEach(k => {
        const s = tw.promote && smallestScene(k);
        if (s){ if (!sc.includes(s)) sc.push(s); }
        else vs.add(k);
      });
    }
    const drop = new Set(expand(tw.drop));
    drop.forEach(k => vs.delete(k));
    (tw.xscenes || []).forEach(id => { const i = sc.indexOf(id); if (i < 0) warn("xscenes: " + id + " not in " + br.id + "/" + tw.id); else sc.splice(i, 1); });
    if (tw.promote || tw.period) sc.sort((a, b) => sceneOrder[a] - sceneOrder[b]);
    const links = {};
    Object.keys(tw.links || {}).forEach(r => {
      if (!grailHas(tw.links[r])) warn("no Grail verse Psalm " + tw.links[r] + " for " + r);
      links[vkey(...R.parseVerse(r))] = tw.links[r];
    });
    const verses = [...vs].sort((a, b) => posOf[a] - posOf[b]).map(k => {
      const [b, c, v] = k.split(":");
      hitChapter(k);
      return links[k] ? [SHORT[b], +c, +v, links[k]] : [SHORT[b], +c, +v];
    });
    sc.forEach(id => { usedScenes.add(id); sceneVerses[id].forEach(hitChapter); });
    const items = sc.map(id => "s:" + id).concat(verses);
    if (!items.length) warn("empty twig " + br.id + "/" + tw.id);
    const out = { id: tw.id, name: tw.name, items };
    if (tw.group) out.group = tw.group;
    return out;
  }),
}));

/* coverage: every scene on the tree, every chapter of the five books reached */
SCENES.forEach(s => { if (!usedScenes.has(s[0])) warn("scene not on the tree: " + s[0]); });
ORDER.forEach(book => { for (let c = 1; c <= D.books[bidx(book)].ch.length; c++) if (!chapterHit[book + ":" + c]) warn("chapter not on the tree: " + book + " " + c); });

if (process.argv.includes("--stats"))
  branches.forEach(br => console.log(br.id.padEnd(10), br.twigs.map(t => t.id + "=" + t.items.length).join("  ")));
const ri = process.argv.indexOf("--review");
if (ri > 0){
  const L = [];
  const drb = (bk, c, v) => { const book = Object.keys(SHORT).find(x => SHORT[x] === bk); return D.books[bidx(book)].ch[c - 1].v[v - 1]; };
  branches.forEach(br => br.twigs.forEach(tw => {
    L.push("## " + br.id + "/" + tw.id + " — " + tw.name + " (" + tw.items.length + ")");
    tw.items.forEach(it => L.push(typeof it === "string"
      ? "  [" + scenes[it.slice(2)].t + "]"
      : "  " + it[0] + " " + it[1] + ":" + it[2] + (it[3] ? " ↔Ps " + it[3] : "") + "  " + drb(it[0], it[1], it[2]).slice(0, 110)));
  }));
  fs.writeFileSync(process.argv[ri + 1], L.join("\n"));
}
fs.writeFileSync(path.join(__dirname, "..", "data-gtree.js"),
  "window.LUMINA_GTREE = " + JSON.stringify({ scenes, branches }) + ";\n");
const nLeaves = branches.reduce((s, b) => s + b.twigs.reduce((t, w) => t + w.items.length, 0), 0);
console.log("data-gtree.js: " + Object.keys(scenes).length + " scenes, " + branches.length + " branches, " +
  branches.reduce((s, b) => s + b.twigs.length, 0) + " twigs, " + nLeaves + " leaves");
if (problems) process.exit(1);
