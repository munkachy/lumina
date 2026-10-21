#!/usr/bin/env python3
"""Inject the scene text into the engine shell and write the playable file."""
import io, json, os, re

order = []
for line in io.open('startup.txt', encoding='utf-8'):
    if line.startswith('*scene_list'): order = ['__collect__']; continue
    if order == ['__collect__'] or (order and order[0] != '__collect__'):
        if line.startswith('*') or not line.strip():
            if order and order[0] == '__collect__': order = []
            break
        if order and order[0] == '__collect__': order = []
        order.append(line.strip())

scenes = {'__startup__': io.open('startup.txt', encoding='utf-8').read()}
for name in order:
    p = os.path.join('scenes', name + '.txt')
    scenes[name] = io.open(p, encoding='utf-8').read()
scenes['__order__'] = ' '.join(order)

shell = io.open('app-shell.html', encoding='utf-8').read()
blob = 'const SCENES = ' + json.dumps(scenes, ensure_ascii=False) + ';'
out = shell.replace('__SCENES__', blob)
for fn in ('perpetua.html', 'index.html'):
    io.open(fn, 'w', encoding='utf-8').write(out)

words = sum(len([w for w in re.sub(r'(?m)^\*.*$', '', scenes[n]).split()]) for n in order)
print('scenes:', len(order), '| words:', words, '| file:', len(out) // 1024, 'KB')
print('order:', ' '.join(order))
