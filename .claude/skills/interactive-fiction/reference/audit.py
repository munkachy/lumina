#!/usr/bin/env python3
"""Audit a Scriptorium game against the Choice of Games craft numbers.
Run from inside a game directory: python3 audit.py"""
import io, glob, re, collections, sys

PRIM = sys.argv[1:] or ['valor','severity','splendor','charity','hope']
tot = choices = opts = pages = 0
tests = collections.Counter(); writes = collections.Counter()
per_scene = []

for f in sorted(glob.glob('scenes/*.txt')):
    s = io.open(f, encoding='utf-8').read()
    w = len([x for x in re.sub(r'(?m)^\*.*$', '', s).split()])
    c = len(re.findall(r'(?m)^\s*\*(?:fake_)?choice', s))
    tot += w; choices += c
    per_scene.append((f.split('/')[-1][:-4], w, c))
    for ln in s.split('\n'):
        t = ln.strip()
        if t.startswith('#'): opts += 1
        if t.startswith('*page_break'): pages += 1
        m = re.match(r'^\*(?:el)?if.*?\b(%s)\b' % '|'.join(PRIM), t)
        if m: tests[m.group(1)] += 1
        m2 = re.match(r'^\*set(?:_hidden)?\s+(%s)\s' % '|'.join(PRIM), t)
        if m2: writes[m2.group(1)] += 1

def flag(ok): return '  ok' if ok else '  <-- OFF TARGET'
print('%-22s %8d  %s' % ('total words', tot, ''))
print('%-22s %8d  %s' % ('choices', choices, ''))
print('%-22s %8.1f  target 3+%s' % ('options per choice', opts/max(choices,1), flag(opts/max(choices,1) >= 3)))
print('%-22s %8.0f  dragon 165%s' % ('words per choice', tot/max(choices,1), flag(tot/max(choices,1) <= 260)))
print('%-22s %8.0f  dragon 400%s' % ('words per screen', tot/max(pages,1), flag(200 <= tot/max(pages,1) <= 600)))
print()
print('%-12s %8s %8s   %s' % ('stat', 'written', 'tested', 'verdict'))
for k in PRIM:
    w, t = writes[k], tests[k]
    v = 'never read' if t == 0 else ('thin' if t < 4 else 'ok')
    print('%-12s %8d %8d   %s' % (k, w, t, v))
if tests:
    mx, mn = max(tests.values()), min(tests[k] for k in PRIM)
    print('\nspread across stats: %d..%d  %s' % (mn, mx, flag(mx <= mn*1.5 and mn > 0)))
print('\nscene           words  choices  w/choice')
for n, w, c in per_scene:
    print('%-14s %6d %8d %9s' % (n, w, c, ('%.0f' % (w/c)) if c else '—'))
