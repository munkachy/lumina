import re, glob, os, statistics, collections, json
from collections import deque

BOOKS = [('Lone Wolf 1 (1984)','01fftd/en/xhtml/lw/01fftd'),
         ('Lone Wolf 5 (1985)','05sots/en/xhtml/lw/05sots'),
         ('Lone Wolf 12 (1988)','12tmod/en/xhtml/lw/12tmod'),
         ('Lone Wolf 20 (1993)','20tcon/en/xhtml/lw/20tcon'),
         ('Freeway Warrior 1 (1988)','fw01/en/xhtml/fw/01hh')]

ENT = {'&eacute;':'e','&nbsp;':' ','&amp;':'&','&lt;':'<','&gt;':'>','&mdash;':'-',
       '&rsquo;':"'",'&lsquo;':"'",'&ldquo;':'"','&rdquo;':'"','&hellip;':'...',
       '&ndash;':'-','&egrave;':'e','&auml;':'a','&ouml;':'o','&uuml;':'u'}
def strip(h):
    h = re.sub(r'<[^>]+>', ' ', h)
    for k,v in ENT.items(): h = h.replace(k,v)
    return re.sub(r'\s+',' ',h).strip()

def parse(path):
    raw = open(path, encoding='utf-8', errors='replace').read()
    m = re.search(r'<article>(.*?)</article>', raw, re.S)
    body = m.group(1) if m else raw
    body = re.sub(r'<div class="navigation">.*?</div>', ' ', body, flags=re.S)
    body = re.sub(r'<nav\b.*?</nav>', ' ', body, flags=re.S)
    body = re.sub(r'<p id="page-navigation"\s*/?>', ' ', body)
    choices = re.findall(r'<p class="choice">(.*?)</p>', body, re.S)
    deadend = 'class="deadend"' in body
    combat  = 'class="combat"' in body
    prose_html = re.sub(r'<p class="(choice|deadend|copyright)">.*?</p>', ' ', body, flags=re.S)
    prose_html = re.sub(r'<h3>.*?</h3>', ' ', prose_html, flags=re.S)
    prose = strip(prose_html)
    links = [int(x) for x in re.findall(r'sect(\d+)\.htm', ' '.join(choices))]
    other = [int(x) for x in re.findall(r'sect(\d+)\.htm', prose_html)]
    return dict(words=len(prose.split()), choices=choices, links=links, other=other,
                deadend=deadend, combat=combat, prose=prose)

rows=[]
for title, d in BOOKS:
    files = glob.glob(os.path.join(d,'sect*.htm'))
    sect = {int(re.search(r'sect(\d+)\.htm',f).group(1)): parse(f) for f in files}
    N=len(sect)
    words=[s['words'] for s in sect.values()]
    succ={n:set(s['links']+s['other'])&set(sect) for n,s in sect.items()}
    outdeg={n:len(v) for n,v in succ.items()}
    nchoice={n:len(set(s['links'])) for n,s in sect.items()}   # real branching only
    dist=collections.Counter(nchoice.values())
    terminal=[n for n in sect if outdeg[n]==0]
    deaths=[n for n in terminal if sect[n]['deadend']]
    wins=[n for n in terminal if not sect[n]['deadend']]
    indeg=collections.Counter()
    for n,v in succ.items():
        for t in v: indeg[t]+=1
    merged=[t for t,c in indeg.items() if c>=2]
    clines=[]; gated=0; tot=0
    gate=re.compile(r'\bif you (have|possess|do not have|are|know|wish to use)\b|Kai Discipline|Magnakai|Grand Master|Special Item|Backpack Item|Weaponmastery|Discipline of', re.I)
    for s in sect.values():
        for c in s['choices']:
            t=strip(c); clines.append(len(t.split())); tot+=1
            if gate.search(t): gated+=1
    depth={1:0}; q=deque([1])
    while q:
        u=q.popleft()
        for v in succ.get(u,()):
            if v not in depth: depth[v]=depth[u]+1; q.append(v)
    reachwin=[n for n in wins if n in depth]
    rows.append(dict(t=title, N=N, W=sum(words), wm=round(statistics.mean(words)),
        wmed=int(statistics.median(words)), wmax=max(words),
        b0=dist[0], b1=dist[1], b2=dist[2], b3=dist[3], b4=sum(v for k,v in dist.items() if k>=4),
        term=len(terminal), deaths=len(deaths), wins=len(wins),
        merged=len(merged), mpct=round(100*len(merged)/N), maxin=max(indeg.values()),
        ch=tot, cmed=int(statistics.median(clines)), c90=int(statistics.quantiles(clines,n=10)[8]),
        gpct=round(100*gated/max(tot,1)), rpct=round(100*len(depth)/N),
        minwin=min((depth[n] for n in reachwin), default=None),
        deep=max(depth.values()), combat=sum(1 for s in sect.values() if s['combat'])))

cols=[('book','t',26),('sects','N',5),('words','W',6),('w/sect','wm',6),('med','wmed',4),('max','wmax',4),
      ('0br','b0',4),('1br','b1',4),('2br','b2',4),('3br','b3',4),('4+','b4',3),
      ('term','term',4),('die','deaths',4),('win','wins',4),('merged','merged',6),('%mrg','mpct',4),
      ('maxin','maxin',5),('choices','ch',7),('cmed','cmed',4),('c90','c90',4),('%gate','gpct',5),
      ('%reach','rpct',6),('minwin','minwin',6),('deep','deep',4),('cbt','combat',3)]
print(' '.join(h.ljust(w) for h,_,w in cols))
for r in rows:
    print(' '.join(str(r[k])[:w].ljust(w) for _,k,w in cols))
json.dump(rows, open('lw_stats.json','w'), indent=1)

# ---- extra: forced-jump runs and words between choices, along random walks ----
import random
print()
print('walks: median sections per playthrough, words per playthrough, longest run of no-choice sections')
for title, d in BOOKS:
    files = glob.glob(os.path.join(d,'sect*.htm'))
    sect = {int(re.search(r'sect(\d+)\.htm',f).group(1)): parse(f) for f in files}
    succ={n:sorted(set(s['links']+s['other'])&set(sect)) for n,s in sect.items()}
    nbr ={n:sorted(set(s['links'])&set(sect)) for n,s in sect.items()}
    L=[];W=[];RUN=[];ENDD=0
    random.seed(7)
    for _ in range(400):
        n=1; seen=set(); steps=0; words=0; run=0; best=0
        while n in sect and steps<600:
            seen.add(n); steps+=1; words+=sect[n]['words']
            if len(nbr[n])<=1: run+=1; best=max(best,run)
            else: run=0
            nxt=succ[n]
            if not nxt: break
            n=random.choice(nxt)
        L.append(steps); W.append(words); RUN.append(best)
    print('%-26s sections %3d  words %5d  longest no-choice run %d (max seen %d)'
          % (title, int(statistics.median(L)), int(statistics.median(W)),
             int(statistics.median(RUN)), max(RUN)))
