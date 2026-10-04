/* The Grail as a file you keep yourself: Lumina's Grail data <-> a "selah-pack" file
   (selah-pack.v1.json, the format of the SELAH game in munkachy/monastic-games, so the
   one file serves both). The Grail is under copyright, so it is not in this repository:
   you import the file into Lumina on each device (☰ More → Grail Psalms), and it stays there.

   toPack(grail)   Lumina's window.LUMINA_TX.grail  ->  the file's object
   fromPack(pack, books)  the file's object  ->  Lumina's grail data (the same as index.html's
                   grailFromPack; keep the two alike). `books` is the Douay's book list.

   Each psalm keeps its Latin incipit; each verse its lines, its Grail number (v), the Douay
   verse it answers to (douay, when not the same), a heading before it (Psalm 118's letters,
   a stanza mark), and where a second Hebrew psalm joined into it begins (sectionStart). */
function toPack(G){
  const ps = G.books.find(b => b.id === "psalms").ch;
  return {
    selahPack: 1, id: "grail", displayName: "Grail", name: G.name,
    numbering: "vulgate", titlesCounted: true,
    license: "user-supplied-do-not-redistribute", language: "en",
    psalms: ps.map((c, i) => ({
      n: i + 1, incipit: c.title,
      verses: c.v.map((text, j) => {
        const v = c.n ? c.n[j] : j + 1, o = { v, lines: text.split("\n") };
        if (c.d[j] + 1 !== v) o.douay = c.d[j] + 1;
        if (c.h && c.h[j] != null) o.heading = c.h[j];
        if (c.sb && c.sb.includes(j)) o.sectionStart = true;
        return o;
      }),
    })),
  };
}

function fromPack(p, books){
  const out = books.map(b => ({ id: b.id, name: b.name, ch: [] }));
  const ch = out.find(b => b.id === "psalms").ch;
  for (let i = 0; i < 150; i++) ch.push({ v: [], d: [], missing: true });
  p.psalms.forEach(ps => {
    const c = { v: [], d: [] }, nums = [];
    ps.verses.forEach((x, j) => {
      c.v.push(x.lines.join("\n")); c.d.push((x.douay || x.v) - 1); nums.push(x.v);
      if (x.heading != null) (c.h = c.h || {})[j] = x.heading;
      if (x.sectionStart) (c.sb = c.sb || []).push(j);
    });
    if (ps.incipit) c.title = ps.incipit;
    if (nums.some((n, j) => n !== j + 1)) c.n = nums;
    ch[ps.n - 1] = c;
  });
  return { id: "grail", name: p.name || "The Grail Psalms", abbr: "Grail", books: out };
}

module.exports = { toPack, fromPack };
