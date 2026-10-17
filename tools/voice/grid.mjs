import fs from 'fs';
import { say } from './say.mjs';
const corpus = JSON.parse(fs.readFileSync('corpus.json', 'utf8')).map(t => t.replace(/\b[A-Z]{2,}\b/g, w => w.toLowerCase()));
const configs = JSON.parse(process.argv[2]);
const D = process.argv[3] || 'wav'; fs.mkdirSync(D, { recursive: true });
for (const c of configs) for (let i = 0; i < corpus.length; i++)
  fs.writeFileSync(`${D}/${c.name}__${i}.wav`, await say(corpus[i], c));
