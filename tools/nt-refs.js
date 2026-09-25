/* New Testament references for the Gospel tree: parsing, and the modern → Douay-Rheims
   (Vulgate) verse numbering. The two differ only in these chapters of the Gospels and Acts. */
const BOOKS = { mt:"matthew", mk:"mark", lk:"luke", jn:"john", ac:"acts" };
const LABEL = { matthew:"Matthew", mark:"Mark", luke:"Luke", john:"John", acts:"Acts" };
function toDrb(book, c, v){
  if (book === "matthew" && c === 17 && v >= 15) return [c, v - 1];
  if (book === "mark" && c === 9) return v === 1 ? [8, 39] : [c, v - 1];
  if (book === "mark" && c === 4 && v === 41) return [c, 40];
  if (book === "john" && c === 6 && v >= 52) return [c, v + 1];
  if (book === "john" && c === 11 && v === 57) return [c, 56];
  if (book === "acts" && c === 7 && v >= 56) return [c, v - 1];
  if (book === "acts" && c === 14 && v >= 8) return [c, v - 1];
  if (book === "acts" && c === 19 && v === 41) return [c, 40];
  return [c, v];
}
/* "mt 14:13-21", "mk 8:31-9:1", "lk 2:21" → { book, c1, v1, c2, v2 } in Douay numbering */
function parsePassage(s){
  const m = s.trim().match(/^(mt|mk|lk|jn|ac) (\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/);
  if (!m) throw new Error("bad reference: " + s);
  const book = BOOKS[m[1]];
  const c1 = +m[2], v1 = +m[3];
  const c2 = m[4] ? +m[4] : c1, v2 = m[5] ? +m[5] : v1;
  const a = toDrb(book, c1, v1), b = toDrb(book, c2, v2);
  return { book, c1: a[0], v1: a[1], c2: b[0], v2: b[1] };
}
function parseVerse(s){ const p = parsePassage(s); return [p.book, p.c1, p.v1]; }
module.exports = { BOOKS, LABEL, toDrb, parsePassage, parseVerse };
