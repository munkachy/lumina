#!/usr/bin/env python3
"""Graph audit for a stat-free branching story in the Scriptorium format.

    python3 audit.py games/<name>

Reads startup.txt for *scene_list, then every scene in scenes/. Treats each
*label as a section; a section runs forward until a *goto, *choice, *finish,
*ending or the next *label. Reports the numbers the cyoa skill is written
against, and names the three faults you cannot see by reading: unreachable
sections, unintended dead ends, and forced runs longer than three.

It also checks what a reader was told before they had to choose. Mark a
section that establishes a fact, and a section that assumes it:

    *comment teaches: marek, the-lamp
    *comment needs: marek

`*comment` is ignored by the engine, so the markers ride in the source next
to the prose. The audit then reports any section that needs a fact the
reader might not have, because at least one path reaches it without ever
passing a section that teaches it. That fault is invisible on the page: the
scene reads fine to the author, who knows who Marek is.
"""
import io, os, re, sys, glob, random, statistics, collections
from collections import deque

root = sys.argv[1] if len(sys.argv) > 1 else '.'
start_at = sys.argv[2] if len(sys.argv) > 2 else None

# ---------- read ----------
order = []
sp = os.path.join(root, 'startup.txt')
if os.path.exists(sp):
    collecting = False
    for line in io.open(sp, encoding='utf-8'):
        if line.startswith('*scene_list'): collecting = True; continue
        if collecting:
            if not line.strip() or line.lstrip().startswith('*'): break
            order.append(line.strip())
if not order:
    order = [os.path.basename(p)[:-4]
             for p in sorted(glob.glob(os.path.join(root, 'scenes', '*.txt')))]

lines = {}   # scene -> [(indent, text)]
for s in order:
    p = os.path.join(root, 'scenes', s + '.txt')
    if not os.path.exists(p): print('missing scene:', p); continue
    out = []
    for raw in io.open(p, encoding='utf-8'):
        t = raw.replace('\t', '  ').rstrip('\n')
        out.append((len(t) - len(t.lstrip()), t.strip()))
    lines[s] = out
order = [s for s in order if s in lines]

CMD = re.compile(r'^\*([a-z_]+)\s?(.*)$')
def cmd(t):
    m = CMD.match(t)
    return (m.group(1), m.group(2).strip()) if m else (None, None)

# ---------- build the graph ----------
# node id: "scene:label"  plus "scene:__top__" for the head of each scene
nodes = {}          # id -> dict(words, choices, opts, succ, terminal)
def nid(sc, lb): return sc + ':' + lb

for si, sc in enumerate(order):
    L = lines[sc]
    # index of every label
    marks = [(i, cmd(t)[1]) for i, (ind, t) in enumerate(L) if cmd(t)[0] == 'label']
    bounds = [(0, '__top__')] + marks
    for k, (start, name) in enumerate(bounds):
        stop = bounds[k + 1][0] if k + 1 < len(bounds) else len(L)
        me = nid(sc, name)
        words = 0; succ = []; opts = []; terminal = False; nchoice = 0
        i = start + (0 if name == '__top__' else 1)
        while i < stop:
            ind, t = L[i]
            c, a = cmd(t)
            if c is None:
                if t.startswith('#'):
                    opts.append(t[1:].strip())
                    # body of this option: scan for its first *goto / *goto_scene
                    j = i + 1
                    while j < stop and (not L[j][1] or L[j][0] > ind):
                        c2, a2 = cmd(L[j][1])
                        if c2 == 'goto': succ.append(nid(sc, a2.split()[0])); break
                        if c2 == 'goto_scene':
                            p = a2.split()
                            succ.append(nid(p[0], p[1] if len(p) > 1 else '__top__')); break
                        if c2 in ('finish', 'ending'): terminal = (c2 == 'ending'); break
                        j += 1
                    i = j
                    continue
                elif t:
                    words += len(t.split())
            elif c == 'goto':
                succ.append(nid(sc, a.split()[0]))
            elif c == 'goto_scene':
                p = a.split(); succ.append(nid(p[0], p[1] if len(p) > 1 else '__top__'))
            elif c == 'choice' or c == 'fake_choice':
                nchoice += 1
            elif c == 'ending':
                terminal = True
            elif c == 'finish':
                if si + 1 < len(order): succ.append(nid(order[si + 1], '__top__'))
                else: terminal = True
            i += 1
        # fall-through to the next label in the same scene
        if not succ and not terminal and stop < len(L):
            succ.append(nid(sc, bounds[k + 1][1]))
        nodes[me] = dict(words=words, opts=opts, succ=[s for s in succ], terminal=terminal,
                         nchoice=nchoice, scene=sc, label=name)

known = set(nodes)
for n in nodes.values():
    n['succ'] = [s for s in dict.fromkeys(n['succ'])]
dangling = sorted({s for n in nodes.values() for s in n['succ']} - known)

# ---------- measure ----------
N = len(nodes)
W = sum(n['words'] for n in nodes.values())
wl = [n['words'] for n in nodes.values()]
outdeg = collections.Counter(len(n['succ']) for n in nodes.values())
term = [k for k, n in nodes.items() if not n['succ']]
indeg = collections.Counter()
for n in nodes.values():
    for s in n['succ']:
        if s in known: indeg[s] += 1
merged = [k for k, c in indeg.items() if c >= 2]
optlen = [len(o.split()) for n in nodes.values() for o in n['opts']]

start = start_at or nid(order[0], '__top__')
depth = {start: 0}; q = deque([start])
while q:
    u = q.popleft()
    for v in nodes.get(u, {}).get('succ', ()):
        if v in known and v not in depth:
            depth[v] = depth[u] + 1; q.append(v)
unreachable = sorted(known - set(depth))

# ---------- what the reader has been told ----------
# A fact counts as known at a section only if EVERY path from the start to it
# passes a section that teaches it. Intersection over predecessors, iterated to
# a fixed point — the standard available-expressions shape.
FACTS = re.compile(r'^\*comment\s+(teaches|needs)\s*:\s*(.+)$', re.I)
teaches = {k: set() for k in nodes}
needs   = {k: set() for k in nodes}
for si, sc in enumerate(order):
    L = lines[sc]
    marks = [(i, cmd(t)[1]) for i, (ind, t) in enumerate(L) if cmd(t)[0] == 'label']
    bounds = [(0, '__top__')] + marks
    for k, (st, name) in enumerate(bounds):
        stop = bounds[k + 1][0] if k + 1 < len(bounds) else len(L)
        me = nid(sc, name)
        if me not in nodes: continue
        for ind, t in L[st:stop]:
            m = FACTS.match(t)
            if not m: continue
            got = {x.strip().lower() for x in m.group(2).split(',') if x.strip()}
            (teaches if m.group(1).lower() == 'teaches' else needs)[me] |= got

ALLFACTS = set().union(*teaches.values(), *needs.values()) if nodes else set()
blind = []
if ALLFACTS:
    preds = collections.defaultdict(list)
    for u, n in nodes.items():
        for v in n['succ']:
            if v in nodes: preds[v].append(u)
    start0 = start_at or nid(order[0], '__top__')
    known_at = {k: set(ALLFACTS) for k in nodes}
    known_at[start0] = set(teaches.get(start0, ()))
    for _ in range(len(nodes) + 2):
        changed = False
        for v in nodes:
            if v == start0: continue
            ps = [u for u in preds[v] if u in known_at]
            if not ps: newv = set(teaches[v])            # only reachable as a head
            else:
                inter = set(known_at[ps[0]])
                for u in ps[1:]: inter &= known_at[u]
                newv = inter | teaches[v]
            if newv != known_at[v]: known_at[v] = newv; changed = True
        if not changed: break
    for v in sorted(nodes):
        if v not in depth: continue                      # unreachable is its own report
        miss = needs[v] - known_at[v]
        if miss: blind.append((v, sorted(miss)))

# random walks: playthrough length and forced runs
random.seed(11)
steps = []; readwords = []; runs = []
for _ in range(600):
    u = start; seen = 0; rw = 0; run = 0; best = 0
    while u in nodes and seen < 4000:
        seen += 1; rw += nodes[u]['words']
        if len(nodes[u]['succ']) <= 1: run += 1; best = max(best, run)
        else: run = 0
        nxt = [s for s in nodes[u]['succ'] if s in known]
        if not nxt: break
        u = random.choice(nxt)
    steps.append(seen); readwords.append(rw); runs.append(best)

def pct(x, t=N): return '%d%%' % round(100 * x / max(t, 1))
def flag(ok): return '  ok' if ok else '  <-- LOOK'

print('%-34s %8d' % ('sections (labels)', N))
print('%-34s %8d' % ('words', W))
print('%-34s %8d  gamebook median 55-132%s' % ('median words per section',
      int(statistics.median(wl)), flag(40 <= statistics.median(wl) <= 420)))
noch = outdeg[0] + outdeg[1]
print('%-34s %8s  published 43-55%%%s' % ('sections with no choice', pct(noch),
      flag(0.35 <= noch / max(N, 1) <= 0.65)))
two = outdeg[2]; three = outdeg[3]; four = sum(v for k, v in outdeg.items() if k >= 4)
ch = two + three + four
print('%-34s %8s  published 77-87%%%s' % ('two-way share of all choices',
      pct(two, ch) if ch else 'n/a', flag(ch and two / ch >= 0.6)))
print('%-34s %4d /%3d /%3d' % ('  two / three / four-plus way', two, three, four))
print('%-34s %8s  Time Cave 2%%, Quest ~33%%' % ('sections reached from 2+ places', pct(len(merged))))
print('%-34s %8d' % ('terminal sections (endings)', len(term)))
print('%-34s %8s  published 93-100%%%s' % ('reachable from the start', pct(len(depth)),
      flag(len(depth) == N)))
if optlen:
    print('%-34s %8d  published median 11-12%s' % ('median choice-line words',
          int(statistics.median(optlen)), flag(6 <= statistics.median(optlen) <= 20)))
print('%-34s %8d  ceiling 4%s' % ('longest run of forced sections',
      max(runs), flag(max(runs) <= 4)))
print('%-34s %8d' % ('median sections per playthrough', int(statistics.median(steps))))
mw = int(statistics.median(readwords))
print('%-34s %8d  (%s of the book)' % ('median words per playthrough', mw, pct(mw, W)))

if unreachable:
    print('\nUNREACHABLE (%d) — written, numbered, and no path leads here:' % len(unreachable))
    for u in unreachable[:30]: print('   ', u)
    if len(unreachable) > 30: print('    ... and %d more' % (len(unreachable) - 30))
if dangling:
    print('\nBROKEN LINKS (%d) — a goto with no such label:' % len(dangling))
    for d in dangling[:30]: print('   ', d)
if ALLFACTS:
    print('\n%-34s %8d  facts tracked' % ('teaches / needs markers',
          sum(1 for k in nodes if teaches[k] or needs[k])))
if blind:
    print('\nTOLD TOO LATE (%d) — a section that assumes something the reader' % len(blind))
    print('may not have been told, because at least one path arrives here without it:')
    for v, miss in blind[:30]:
        print('    %-40s needs %s' % (v, ', '.join(miss)))
    if len(blind) > 30: print('    ... and %d more' % (len(blind) - 30))
if term:
    print('\nENDINGS (%d) — every one of these should be a real ending:' % len(term))
    for t in term[:40]: print('   ', t, '(%d words)' % nodes[t]['words'])
