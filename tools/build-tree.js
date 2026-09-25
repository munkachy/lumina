/* Build data-tree.js — the Psalm Tree — from tree-rules.js and the Grail text.
   Every leaf is [psalm, verse] in Vulgate psalm numbering with the Grail's verse numbers.
   Usage: node tools/build-tree.js [--review file]  (review: every verse with its twigs) */
const fs = require("fs"), path = require("path");
global.window = {};
require(path.join(__dirname, "..", "data-grail.js"));
const G = window.LUMINA_TX.grail;
const PS = G.books.find(b => b.ch.length).ch;
const RULES = require("./tree-rules.js");

const num = (ch, j) => ch.n ? ch.n[j] : j + 1;
const verses = [];                        // { ps, n, text }
PS.forEach((ch, c) => ch.v.forEach((t, j) => verses.push({ ps: c + 1, n: num(ch, j),
  text: t.replace(/\n/g, " ").replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').toLowerCase() })));
const key = v => v.ps + ":" + v.n;
const exists = new Set(verses.map(key));

/* hand corrections: "add|drop branch/twig ps:v ps:v ..." */
const EDITS = {};
fs.readFileSync(path.join(__dirname, "tree-edits.txt"), "utf8").split("\n").forEach(line => {
  line = line.replace(/#.*/, "").trim();
  if (!line) return;
  const [op, twig, ...refs] = line.split(/\s+/);
  const e = EDITS[twig] = EDITS[twig] || { add: [], drop: [] };
  e[op].push(...refs);
});
const tags = {};                           // "ps:n" -> [twig paths]
let problems = 0;
const tree = { branches: RULES.map(br => ({
  id: br.id, name: br.name, icon: br.icon, desc: br.desc,
  twigs: br.twigs.map(tw => {
    const set = new Set();
    const ed = EDITS[br.id + "/" + tw.id] || { add: [], drop: [] };
    delete EDITS[br.id + "/" + tw.id];
    if (tw.re) verses.forEach(v => { if (tw.re.test(v.text) && !(tw.not && tw.not.test(v.text))) set.add(key(v)); });
    (tw.add || []).concat(ed.add).forEach(k => { if (!exists.has(k)){ console.error("missing verse " + k + " in " + br.id + "/" + tw.id); problems++; } else set.add(k); });
    (tw.drop || []).concat(ed.drop).forEach(k => set.delete(k));
    const refs = [...set].map(k => k.split(":").map(Number)).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    refs.forEach(r => (tags[r.join(":")] = tags[r.join(":")] || []).push(br.id + "/" + tw.id));
    return { id: tw.id, name: tw.name, refs };
  }),
}))};

Object.keys(EDITS).forEach(k => { console.error("tree-edits.txt names an unknown twig: " + k); problems++; });

/* coverage: every psalm on at least two branches */
const perPsalm = {};
Object.keys(tags).forEach(k => {
  const ps = +k.split(":")[0];
  tags[k].forEach(t => (perPsalm[ps] = perPsalm[ps] || new Set()).add(t.split("/")[0]));
});
for (let p = 1; p <= 150; p++){
  const n = perPsalm[p] ? perPsalm[p].size : 0;
  if (n < 2){ console.error("Psalm " + p + " is on only " + n + " branch(es)"); problems++; }
}
tree.branches.forEach(br => br.twigs.forEach(tw => {
  if (!tw.refs.length){ console.error("empty twig " + br.id + "/" + tw.id); problems++; }
}));

if (process.argv[2] === "--stats") tree.branches.forEach(br => console.log(br.id.padEnd(10), br.twigs.map(t => t.id + "=" + t.refs.length).join("  ")));
const ri = process.argv.indexOf("--review");
if (ri > 0){
  const lines = [];
  PS.forEach((ch, c) => ch.v.forEach((t, j) => {
    const k = (c + 1) + ":" + num(ch, j);
    lines.push(k + " " + t.replace(/\n/g, " / ") + "  {" + (tags[k] || []).join(" ") + "}");
  }));
  fs.writeFileSync(process.argv[ri + 1], lines.join("\n"));
}
const tagged = Object.keys(tags).length;
fs.writeFileSync(path.join(__dirname, "..", "data-tree.js"),
  "window.LUMINA_TREE = " + JSON.stringify(tree) + ";\n");
console.log("data-tree.js: " + tree.branches.length + " branches, " +
  tree.branches.reduce((s, b) => s + b.twigs.length, 0) + " twigs, " + tagged + " of " + verses.length + " verses placed");
if (problems) process.exit(1);
