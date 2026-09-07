#!/usr/bin/env python3
"""Render a working design document as a readable page.

These documents exist to be argued with, so the page is built for reading and
marking up rather than for display: one narrow column of prose, tables that
break out wider and scroll on their own, and the closing list of open questions
given its own weight at the foot of the page.

Design language is inherited from hub/index.html — Barlow Condensed over
Spectral, the LCARS elbow, and the same tokens. Dark only, on purpose, and
every colour is painted rather than inherited from the host.

  python3 tools/docpage.py IN.md OUT.html --accent amber [--fragment]

--fragment omits <!doctype>/<html>/<head>/<body> for publishing as an artifact.
"""
import argparse, html, re, sys, io

ACCENTS = {  # name -> (hex, second hex for the elbow)
    "amber": ("#f0a63c", "#c9a86a"),
    "sky":   ("#7ea6d8", "#b39ad8"),
    "rose":  ("#d47f7f", "#c9a86a"),
    "mauve": ("#b39ad8", "#7ea6d8"),
    "sand":  ("#c9a86a", "#f0a63c"),
}

def slug(t):
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")[:48]

def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![*\w])\*([^*\n]+)\*(?!\w)", r"<em>\1</em>", t)
    return t

FENCE = "\x00FENCE%d\x00"

def extract_fences(md):
    """Pull ``` blocks out before splitting on blank lines, so the scene
    skeletons survive intact."""
    out, fences, buf, inside = [], [], None, False
    for line in md.split("\n"):
        if line.startswith("```"):
            if inside:
                fences.append(buf); out.append(""); out.append(FENCE % (len(fences)-1))
                out.append(""); buf, inside = None, False
            else:
                buf, inside = [], True
            continue
        (buf if inside else out).append(line)
    if inside:
        fences.append(buf); out.append(FENCE % (len(fences)-1))
    return "\n".join(out), fences

def render_fence(lines):
    """A scene skeleton: header line, then aligned Label: value rows.
    Each blank-line group is one scene and gets its own block."""
    groups, cur = [], []
    for l in lines:
        if l.strip() == "":
            if cur: groups.append(cur); cur = []
        else:
            cur.append(l)
    if cur: groups.append(cur)
    out = []
    for g in groups:
        rows = []
        for i, l in enumerate(g):
            e = html.escape(l, quote=False)
            if i == 0:
                rows.append('<b>%s</b>' % e)
                continue
            m = re.match(r"^(\s*)([^:]{1,14}:)(\s*)(.*)$", e)
            if m:
                rest = m.group(4)
                rest = re.sub(r"(←.*)$", r'<i>\1</i>', rest)
                rows.append("%s<u>%s</u>%s%s" % (m.group(1), m.group(2), m.group(3), rest))
            else:
                rows.append(e)
        body = rows[0] + "\n".join(rows[1:]) if len(rows) > 1 else rows[0]
        out.append('<pre class="scene">%s</pre>' % body)
    return "\n".join(out)

def blocks(md):
    """Split into blank-line-separated blocks, keeping tables whole."""
    out, cur = [], []
    for line in md.split("\n"):
        if line.strip() == "":
            if cur: out.append(cur); cur = []
        else:
            cur.append(line)
    if cur: out.append(cur)
    return out

def render_table(lines):
    rows = [[c.strip() for c in l.strip().strip("|").split("|")] for l in lines]
    head, body = rows[0], rows[2:]          # rows[1] is the ---|--- rule
    h = "".join("<th>%s</th>" % inline(c) for c in head)
    b = ""
    for r in body:
        b += "<tr>" + "".join("<td>%s</td>" % inline(c) for c in r) + "</tr>"
    return ('<div class="scroll"><table><thead><tr>%s</tr></thead>'
            '<tbody>%s</tbody></table></div>' % (h, b))

def render_list(lines, ordered):
    items, cur = [], None
    pat = r"^\s*\d+\.\s+" if ordered else r"^\s*[-*]\s+"
    for l in lines:
        if re.match(pat, l):
            if cur is not None: items.append(cur)
            cur = re.sub(pat, "", l)
        elif cur is not None:
            cur += " " + l.strip()
    if cur is not None: items.append(cur)
    tag = "ol" if ordered else "ul"
    return "<%s>%s</%s>" % (tag, "".join("<li>%s</li>" % inline(i) for i in items), tag)

def convert(md):
    global FENCES
    md, FENCES = extract_fences(md)
    title, sections, parts = None, [], []
    reject_open = False
    for blk in blocks(md):
        first = blk[0]

        if first.startswith("\x00FENCE"):
            parts.append(render_fence(FENCES[int(first[6:-1])])); continue

        if first.startswith("# "):
            title = first[2:].strip(); continue
        if first.startswith("## "):
            t = first[3:].strip()
            if reject_open:
                parts.append("</section>"); reject_open = False
            sections.append(t)
            if t.lower().startswith("what i would like you to reject"):
                parts.append('<section class="reject" id="%s">' % slug(t))
                parts.append('<div class="eyebrow">Open questions</div>')
                parts.append("<h2>%s</h2>" % inline(t))
                reject_open = True
            else:
                parts.append('<h2 id="%s">%s</h2>' % (slug(t), inline(t)))
            continue
        if first.startswith("### "):
            parts.append("<h3>%s</h3>" % inline(first[4:].strip())); continue
        if set("".join(blk).strip()) == {"-"}:
            continue          # h2 already carries the rule; a second one is noise
        if first.lstrip().startswith("|"):
            parts.append(render_table(blk)); continue
        if first.lstrip().startswith("> "):
            inner = " ".join(l.lstrip()[2:] if l.lstrip().startswith("> ") else l.strip()
                             for l in blk)
            # a quote written as separate short lines keeps its line breaks
            if len(blk) > 1 and all(l.lstrip().startswith("> ") for l in blk):
                inner = "<br>".join(inline(l.lstrip()[2:]) for l in blk)
            else:
                inner = inline(inner)
            parts.append("<blockquote>%s</blockquote>" % inner); continue
        if re.match(r"^\s*[-*]\s+", first):
            parts.append(render_list(blk, False)); continue
        if re.match(r"^\s*\d+\.\s+", first):
            parts.append(render_list(blk, True)); continue
        parts.append("<p>%s</p>" % inline(" ".join(l.strip() for l in blk)))
    if reject_open:
        parts.append("</section>")
    return title, sections, "\n".join(parts)

CSS = """
:root{
  --bg:#07070a; --panel:#101016; --panel2:#15151c;
  --ink:#e9e6df; --ink2:#a29d90; --ink3:#635e55;
  --rule:#22222b; --accent:%(a1)s; --accent2:%(a2)s;
  --col:40rem;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);
  font-family:Spectral,Georgia,"Times New Roman",serif;font-size:17px;line-height:1.72;
  -webkit-text-size-adjust:100%%;
  background-image:radial-gradient(ellipse 70%% 34%% at 50%% -4%%,%(a1)s14,transparent 70%%)}
.wrap{max-width:58rem;margin:0 auto;padding:0 1.4rem 6rem}
p,ul,ol,blockquote,h3{max-width:var(--col)}

/* the elbow, once, as on the index */
header{display:grid;grid-template-columns:9rem 1fr;gap:1.2rem;align-items:end;padding:2.8rem 0 .4rem}
.elbow{height:6.2rem;position:relative}
.elbow i{position:absolute;display:block;border-radius:1.6rem}
.elbow i:nth-child(1){left:0;top:0;width:9rem;height:2.1rem;background:var(--accent);border-bottom-right-radius:0}
.elbow i:nth-child(2){left:0;top:2.3rem;width:3.4rem;height:3.9rem;background:var(--accent2);border-top-right-radius:0}
.elbow i:nth-child(3){left:3.6rem;top:2.3rem;width:2.4rem;height:1.7rem;background:#4a4a58}
.elbow i:nth-child(4){left:6.2rem;top:2.3rem;width:2.8rem;height:1.7rem;background:#2c2c38}
.kicker{font-family:"Barlow Condensed",Arial Narrow,sans-serif;letter-spacing:.32em;
  text-transform:uppercase;font-size:.7rem;color:var(--accent)}
h1{font-family:"Barlow Condensed",Arial Narrow,sans-serif;font-weight:600;
  font-size:clamp(2.2rem,7vw,3.7rem);letter-spacing:.11em;text-transform:uppercase;
  margin:.1rem 0 0;line-height:1;text-wrap:balance}

/* contents: a real aid on a phone, not decoration */
nav{margin:2.2rem 0 .6rem;padding:1rem 1.2rem;background:var(--panel);
  border-radius:.2rem .9rem .9rem .2rem;border-left:.4rem solid var(--accent2)}
nav .eyebrow{margin-bottom:.55rem}
nav ol{margin:0;padding:0;list-style:none;max-width:none;
  columns:2;column-gap:2rem;font-family:"Barlow Condensed",sans-serif;font-size:.98rem;
  letter-spacing:.02em}
nav li{break-inside:avoid;margin:0 0 .12rem}
nav a{color:var(--ink2);text-decoration:none;border-bottom:1px solid transparent}
nav a:hover,nav a:focus{color:var(--accent);border-bottom-color:var(--accent)}
@media (max-width:38rem){nav ol{columns:1}}

.eyebrow{font-family:"Barlow Condensed",sans-serif;letter-spacing:.26em;
  text-transform:uppercase;font-size:.66rem;color:var(--ink3)}

h2{font-family:"Barlow Condensed",Arial Narrow,sans-serif;font-weight:500;
  letter-spacing:.2em;text-transform:uppercase;font-size:.92rem;color:var(--accent);
  margin:3.4rem 0 1rem;padding-bottom:.5rem;border-bottom:1px solid var(--rule);
  text-wrap:balance;scroll-margin-top:1rem}
h3{font-family:"Barlow Condensed",Arial Narrow,sans-serif;font-weight:600;
  letter-spacing:.09em;text-transform:uppercase;font-size:1.06rem;color:var(--ink);
  margin:2.1rem 0 .5rem;text-wrap:balance}
p{margin:0 0 1.05rem}
strong{color:#fff;font-weight:600}
em{color:var(--ink)}
code{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:.86em;
  background:var(--panel2);color:var(--accent2);padding:.08em .38em;border-radius:.2rem}
hr{border:0;height:1px;background:var(--rule);margin:2.6rem 0;max-width:none}

ul,ol{margin:0 0 1.05rem;padding-left:1.35rem}
li{margin:0 0 .42rem}
li::marker{color:var(--ink3)}
ol li::marker{font-family:"Barlow Condensed",sans-serif;color:var(--accent)}

blockquote{margin:1.4rem 0;padding:.85rem 1.15rem;background:var(--panel);
  border-left:.28rem solid var(--accent);border-radius:0 .5rem .5rem 0;color:var(--ink)}
blockquote strong{color:var(--accent)}

pre.scene{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
  font-size:.8rem;line-height:1.65;margin:1.2rem 0;padding:1rem 1.1rem;
  background:var(--panel);border-left:.28rem solid var(--accent2);
  border-radius:0 .5rem .5rem 0;overflow-x:auto;color:var(--ink2);
  white-space:pre;max-width:none}
pre.scene b{display:block;font-weight:600;color:var(--accent);letter-spacing:.04em;
  margin-bottom:.35rem}
pre.scene u{text-decoration:none;color:var(--ink3)}
pre.scene i{color:var(--accent2);font-style:normal}

.scroll{overflow-x:auto;margin:1.3rem 0 1.6rem;
  border-top:1px solid var(--rule);border-bottom:1px solid var(--rule)}
table{border-collapse:collapse;width:100%%;font-size:.93rem;
  font-variant-numeric:tabular-nums}
th{font-family:"Barlow Condensed",sans-serif;font-weight:500;letter-spacing:.15em;
  text-transform:uppercase;font-size:.68rem;color:var(--ink3);text-align:left;
  padding:.62rem .8rem;white-space:nowrap;vertical-align:bottom}
td{padding:.55rem .8rem;border-top:1px solid var(--rule);color:var(--ink2);
  vertical-align:top;line-height:1.5}
td:first-child{color:var(--ink)}
tbody tr:hover td{background:var(--panel)}
td strong{color:var(--ink)}

/* the closing list is the point of these documents, so it gets its own footing */
.reject{margin-top:4rem;padding:1.6rem 1.5rem 1.1rem;background:var(--panel);
  border-radius:.2rem 1rem 1rem .2rem;border-left:.55rem solid var(--accent)}
.reject h2{margin:.25rem 0 1rem;border-bottom-color:#2e2e3a}
.reject ol{max-width:var(--col)}
.reject li{margin-bottom:.9rem;color:var(--ink2)}
.reject li strong{color:var(--accent2)}

footer{margin-top:3.4rem;padding-top:1.1rem;border-top:1px solid var(--rule);
  font-family:"Barlow Condensed",sans-serif;letter-spacing:.2em;text-transform:uppercase;
  font-size:.66rem;color:var(--ink3);display:flex;justify-content:space-between;
  gap:1rem;flex-wrap:wrap}
footer a{color:var(--ink3)}
a:focus-visible,nav a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media (max-width:34rem){
  header{grid-template-columns:1fr}
  .elbow{display:none}
  body{font-size:16px}
  .reject{padding:1.2rem 1.1rem .8rem}
}
"""

FONTS = ('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
         'family=Barlow+Condensed:wght@400;500;600&'
         'family=Spectral:ital,wght@0,300;0,400;0,600;1,400&display=swap">')

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("dst")
    ap.add_argument("--accent", default="amber", choices=sorted(ACCENTS))
    ap.add_argument("--kicker", default="")
    ap.add_argument("--title", default="", help="override the name taken from the h1")
    ap.add_argument("--fragment", action="store_true")
    a = ap.parse_args()

    md = io.open(a.src, encoding="utf-8").read()
    title, sections, body = convert(md)
    if " — " in (title or ""):
        name, kind = title.split(" — ", 1)
    else:
        name, kind = title or a.src, ""
    if a.title: name = a.title
    elif name.isupper():          # the h1 is shouted in the source; CSS shouts it
        name = name.title()       # again, so the tab and gallery get the real name
    kicker = a.kicker or kind or "document"
    a1, a2 = ACCENTS[a.accent]

    toc = "".join('<li><a href="#%s">%s</a></li>' % (slug(s), html.escape(s))
                  for s in sections)
    inner = """<style>
%(css)s
</style>

<div class="wrap">

<header>
  <div class="elbow"><i></i><i></i><i></i><i></i></div>
  <div>
    <div class="kicker">%(kicker)s</div>
    <h1>%(name)s</h1>
  </div>
</header>

<nav aria-label="Contents">
  <div class="eyebrow">Contents</div>
  <ol>%(toc)s</ol>
</nav>

%(body)s

<footer>
  <span>Scriptorium · working document</span>
  <span><a href="https://github.com/munkachy/lumina">github.com/munkachy/lumina</a></span>
</footer>

</div>""" % dict(css=CSS % dict(a1=a1, a2=a2), kicker=html.escape(kicker),
                 name=html.escape(name), toc=toc, body=body)

    if a.fragment:
        out = "<title>%s</title>\n%s\n%s" % (html.escape(name), FONTS, inner)
    else:
        out = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
               '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
               '<title>%s — %s</title>\n%s\n</head>\n<body>\n%s\n</body>\n</html>\n'
               % (html.escape(name), html.escape(kicker), FONTS, inner))
    io.open(a.dst, "w", encoding="utf-8").write(out)
    print("%s -> %s  (%d sections, %d bytes)" % (a.src, a.dst, len(sections), len(out)))

main()
