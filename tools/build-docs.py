"""Build data-docs.js: the Church documents in Lumina.
Usage: python3 tools/build-docs.py <folder with lg.html, dv.html, ...>
The Vatican II and papal texts come from vatican.va HTML copies: numbered paragraphs
(as the Church cites them), with section headings kept and footnote markers removed.
The older conciliar texts come from tools/councils/<file>.new.txt (Lumina's own
translation) and <file>.old.txt (a public-domain translation), item for item."""
import re, html, json, sys, os

DOCS = [  # id, title, English title, kind, author, date, authority level (see LEVELS)
 ("lg","Lumen Gentium","Dogmatic Constitution on the Church","Dogmatic Constitution","Second Vatican Council","21 November 1964","council-dogmatic"),
 ("dv","Dei Verbum","Dogmatic Constitution on Divine Revelation","Dogmatic Constitution","Second Vatican Council","18 November 1965","council-dogmatic"),
 ("sc","Sacrosanctum Concilium","Constitution on the Sacred Liturgy","Constitution","Second Vatican Council","4 December 1963","council-const"),
 ("gs","Gaudium et Spes","Pastoral Constitution on the Church in the Modern World","Pastoral Constitution","Second Vatican Council","7 December 1965","council-const"),
 ("ur","Unitatis Redintegratio","Decree on Ecumenism","Decree","Second Vatican Council","21 November 1964","council-decree"),
 ("pc","Perfectae Caritatis","Decree on the Adaptation and Renewal of Religious Life","Decree","Second Vatican Council","28 October 1965","council-decree"),
 ("ag","Ad Gentes","Decree on the Mission Activity of the Church","Decree","Second Vatican Council","7 December 1965","council-decree"),
 ("po","Presbyterorum Ordinis","Decree on the Ministry and Life of Priests","Decree","Second Vatican Council","7 December 1965","council-decree"),
 ("dh","Dignitatis Humanae","Declaration on Religious Freedom","Declaration","Second Vatican Council","7 December 1965","council-decl"),
 ("na","Nostra Aetate","Declaration on the Relation of the Church to Non-Christian Religions","Declaration","Second Vatican Council","28 October 1965","council-decl"),
 ("vs","Veritatis Splendor","On Certain Fundamental Questions of the Church’s Moral Teaching","Encyclical Letter","Pope St John Paul II","6 August 1993","papal-encyclical"),
 ("rp","Reconciliatio et Paenitentia","On Reconciliation and Penance in the Mission of the Church Today","Post-Synodal Apostolic Exhortation","Pope St John Paul II","2 December 1984","papal-exhortation"),
]
COUNCILS = [  # id, file, title, subtitle, kind, author, date, name of the old translation
 ("c3","constantinople3","Constantinople III: Definition of Faith","On the Two Wills and Two Operations of Christ","Definition of Faith","Third Council of Constantinople","16 September 681","Percival (1900)"),
 ("tj","trent-justification","Trent: Decree on Justification","Session 6","Doctrinal Decree with Canons","Council of Trent","13 January 1547","Waterworth (1848)"),
 ("te","trent-eucharist","Trent: Decree on the Eucharist","On the Most Holy Sacrament of the Eucharist · Session 13","Doctrinal Decree with Canons","Council of Trent","11 October 1551","Waterworth (1848)"),
 ("tm","trent-mass","Trent: The Sacrifice of the Mass","Doctrine on the Most Holy Sacrifice of the Mass · Session 22","Doctrinal Decree with Canons","Council of Trent","17 September 1562","Waterworth (1848)"),
 ("df","dei-filius","Dei Filius","Dogmatic Constitution on the Catholic Faith","Dogmatic Constitution","First Vatican Council","24 April 1870","Manning (1871)"),
]
SUMS = {  # one sentence for each document
 "c3": "Christ has a true human will as well as a divine one, and his human will freely follows the divine: the Church’s answer to Monothelitism, with Gethsemane at its heart.",
 "tj": "How a sinner is made righteous: grace comes first and freely, free will truly cooperates, and the righteousness given really changes us and can grow.",
 "te": "Christ is truly, really and substantially present in the Eucharist by transubstantiation, and is to be adored there.",
 "tm": "The Mass makes present the one sacrifice of the cross, now offered without blood, and is truly propitiatory for the living and the dead.",
 "df": "God can be known by reason, yet revelation gives what reason cannot reach; faith is free assent to God’s own authority, and faith and reason can never truly conflict.",
 "lg": "The Church as mystery and People of God, its bishops and their college, the universal call to holiness, and Mary in the mystery of Christ and the Church.",
 "dv": "How God reveals himself in Christ, how Scripture and Tradition hand that revelation on, and why the Church’s whole life must be fed by Scripture.",
 "sc": "The liturgy as the summit and source of the Church’s life, and the principles for its reform, aiming at full, conscious and active participation.",
 "gs": "The Church in dialogue with the modern world: the dignity of the person, marriage and the family, culture, economic life, politics and peace.",
 "ur": "The principles of Catholic ecumenism: a real though imperfect communion with other Christians, and the change of heart that unity demands.",
 "pc": "The renewal of religious life by a return to the Gospel and to each founder’s spirit, adapted to the needs of the time.",
 "ag": "The Church is missionary by its very nature, because it comes from the sending of the Son and of the Holy Spirit.",
 "po": "The ministry of priests in word, sacrament and shepherding, and the holiness that belongs to it.",
 "dh": "Every person has a right to be free from coercion in religious matters, grounded in human dignity, while the duty to seek the truth remains.",
 "na": "How the Church regards other religions, above all the Jewish people, rejecting every kind of hatred and discrimination.",
 "vs": "There is objective moral truth, known by reason and revealed in Christ, and some acts are intrinsically evil whatever the intention or circumstances.",
 "rp": "Sin, the loss of the sense of sin, and the sacrament of penance as the Church’s ministry of reconciliation.",
}
LEVELS = [
 ("council-defined","Ecumenical Councils · Solemn Definitions","Here a council defines doctrine with its full authority, usually closing each point with a canon: “let them be anathema.” What is defined as revealed calls for the assent of divine and catholic faith (Dei Filius 3). The explanatory chapters carry great weight too; theologians differ on how far every sentence in them is itself defined, but not on their authority."),
 ("council-dogmatic","Vatican II · Dogmatic Constitutions","The Council’s most solemn kind of document. Vatican II chose to define no new dogma (see the note of the Theological Commission printed with Lumen Gentium). Where these texts repeat what is already defined, they call for the assent of faith. Everything else in them is the authentic teaching of an ecumenical council with the Pope, owed religious submission of mind and will (LG 25)."),
 ("council-const","Vatican II · Constitutions","Sacrosanctum Concilium mixes doctrine on the liturgy with practical norms. Gaudium et Spes is a “pastoral” constitution: its own first footnote warns that its doctrine is permanent, but its judgments on the circumstances of the 1960s are contingent."),
 ("council-decree","Vatican II · Decrees","Mostly practical directives that apply the constitutions to particular groups and tasks. The doctrine in them binds as conciliar teaching. The norms bind as Church law, which later law can and often did change."),
 ("council-decl","Vatican II · Declarations","Statements of principle on particular questions. The title names a kind of document, not a lower grade of truth: what a declaration teaches has conciliar authority, but it seldom restates defined dogma."),
 ("papal-encyclical","Papal Magisterium · Encyclicals","The weightiest ordinary form of a Pope’s own teaching. It calls for religious submission of mind and will (LG 25), and when a Pope deliberately settles a debated point, theologians may no longer treat it as an open question (Humani Generis 20). Veritatis Splendor reaffirms as constant teaching that some acts are intrinsically evil."),
 ("papal-exhortation","Papal Magisterium · Apostolic Exhortations","After a Synod of Bishops, the Pope gathers its fruit and teaches on it. This is ordinary magisterium, usually more pastoral in tone than an encyclical, but no less his own teaching."),
]
INTRO = ("Ordered by the kind of document, from the solemn definitions of councils down to papal exhortations. That is a fair rough guide, but not the whole rule. "
         "What binds is the teaching itself and how it is proposed: a defined truth keeps its full weight wherever it is repeated, "
         "and a passing judgment on circumstances does not become dogma by sitting in a constitution. As an act, a council outranks one encyclical, "
         "yet both are the Church’s authentic magisterium.")

def clean(raw):
    raw = re.sub(r'<sup>.*?</sup>', '', raw, flags=re.S)
    raw = re.sub(r'<a [^>]*href="#_ftn[^>]*>.*?</a>', '', raw, flags=re.S)
    raw = re.sub(r'<br\s*/?>', ' ', raw)
    t = html.unescape(re.sub(r'<[^>]+>', '', raw))
    t = re.sub(r'\s*(\(\d{1,3}\*?\))+(?=([-A-Za-z\s.,;:"”\'(]|$))', lambda m: ' ' if t[m.end():m.end()+1].isalpha() else '', t)
    t = re.sub(r'\[\d{1,3}\]', '', t)
    return re.sub(r'\s+', ' ', t).strip()

def is_heading(raw, t):
    if re.match(r'^\d+\.\s', t) or len(t) > 220 or not t: return False
    inner = re.sub(r'<(b|strong|i|em|font|span|a)[^>]*>.*?</\1>', '', raw, flags=re.S|re.I)
    inner = re.sub(r'<[^>]+>|&nbsp;|\s|[-–—()]', '', html.unescape(inner))
    return len(inner) < 4 or (t.isupper() and len(t) < 160)

def parse(path):
    s = open(path, encoding="utf-8", errors="replace").read()
    ps = [(m, clean(m)) for m in re.findall(r'<p[^>]*>(.*?)</p>', s, re.S)]
    first = next(i for i, (_, t) in enumerate(ps) if re.match(r'^1\.\s', t))
    pre = []
    for raw, t in reversed(ps[max(0, first - 8):first]):
        if not t or t.startswith('['): continue
        if is_heading(raw, t): break
        if len(t) > 60 and not t.isupper(): pre.insert(0, t)
    paras, heads, cur, expect = [], {}, None, 1
    if pre: paras.append({"n": 0, "t": "\n".join(pre)})
    pending = None
    body = ps[first:]
    def numbered(t):
        m = re.match(r'^(\d+)\.?\s+([A-Z1-9\u201c"\'(].*)$', t)
        return (int(m.group(1)), m.group(2)) if m else None
    for k, (raw, t) in enumerate(body):
        if not t: continue
        if re.match(r'^(NOTES|Notes|Footnotes|FOOTNOTES)\b', t) or t.startswith('Copyright') or re.match(r'^\*\s*\*', t): break
        m = numbered(t)
        if m and m[0] != expect:
            # a misprinted number (vatican.va prints SC 87 as "81."): accept it when the next is expect+1
            nxt = next((numbered(x[1]) for x in body[k + 1:] if numbered(x[1])), None)
            if nxt and nxt[0] == expect + 1: m = (expect, m[1])
        if m and m[0] < expect and m[0] != expect - 1:
            # a chapter title ("1. The Nature of…") or sub-list inside a paragraph — unless the notes begin again
            if not any((numbered(x[1]) or (0,))[0] == expect for x in body[k + 1:]): break
            m = None
            if len(t) < 120 and not t.endswith(('.', ':', ';')):
                pending = t if not pending else pending + " · " + t; continue
        if m and m[0] == expect:
            cur = {"n": expect, "t": m[1]}
            if pending: heads[str(len(paras))] = pending; pending = None
            paras.append(cur); expect += 1; continue
        if is_heading(raw, t):
            pending = t if not pending else pending + " · " + t; continue
        if cur: cur["t"] += "\n" + t
        if re.match(r'^Given,? (at|in) ', t): break
    return paras, heads

def items(path):
    """tools/councils/<file>.txt → (paragraphs [[n, text, label]], headings {index: heading})"""
    ps, heads, pend = [], {}, None
    for line in open(path, encoding="utf-8"):
        line = line.rstrip("\n")
        if not line.strip() or line.startswith("#!"): continue
        if line.startswith("# "): pend = line[2:]; continue
        if line.startswith("+ "): ps[-1][1] += "\n" + line[2:]; continue
        m = re.match(r'\[([^\]]+)\] (.*)', line)
        if not m: sys.exit("bad line in " + path + ": " + line[:60])
        if pend: heads[str(len(ps))] = pend; pend = None
        ps.append([len(ps) + 1, m.group(2), m.group(1)])
    return ps, heads

out, problems = [], []
here = os.path.dirname(os.path.abspath(__file__))
for cid, f, title, sub, kind, by, date, oldname in COUNCILS:
    p, h = items(os.path.join(here, "councils", f + ".new.txt"))
    q, _ = items(os.path.join(here, "councils", f + ".old.txt"))
    if [x[2] for x in p] != [x[2] for x in q]: sys.exit("items differ between the two translations of " + f)
    old = open(os.path.join(here, "councils", f + ".old.txt"), encoding="utf-8").readline()[3:].strip()
    out.append({"id": cid, "title": title, "sub": sub, "kind": kind, "by": by, "date": date, "level": "council-defined",
                "sum": SUMS[cid], "unit": "§" if cid == "c3" else "ch.", "p": p, "h": h, "tr": "Translated for Lumina from the original",
                "alt": {"name": oldname, "credit": old, "p": [x[:2] for x in q]}})
    print(title, len(p), "items, headings", len(h))
for d in DOCS:
    paras, heads = parse(os.path.join(sys.argv[1], d[0] + ".html"))
    out.append({"id": d[0], "title": d[1], "sub": d[2], "kind": d[3], "by": d[4], "date": d[5], "level": d[6], "sum": SUMS[d[0]],
                "p": [[p["n"], p["t"]] for p in paras], "h": heads})
    print(d[1], len(paras), "paragraphs, last", paras[-1]["n"], "headings", len(heads))
data = {"intro": INTRO, "levels": [{"id": a, "name": b, "note": c} for a, b, c in LEVELS], "docs": out,
        "credit": "Texts © Libreria Editrice Vaticana, from vatican.va"}
open(os.path.join(os.path.dirname(__file__), "..", "data-docs.js"), "w").write(
    "window.LUMINA_DOCS = " + json.dumps(data, ensure_ascii=False) + ";\n")
