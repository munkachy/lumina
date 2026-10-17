// node say.mjs <out.wav> <voice> <variant> <speed> <gap> <pitch> <range> <text>
import fs from 'fs';
globalThis.window = globalThis; globalThis.self = globalThis;
const { default: ESpeakNG } = await import('./espeak-ng.js');
const wasm = await WebAssembly.compile(fs.readFileSync(new URL('./espeak-ng.wasm', import.meta.url)));
export async function say(text, { voice='en-us', variant='', speed=160, gap=0, pitch=50, range=50 }) {
  const v = variant ? `${voice}+${variant}` : voice;
  const mod = await ESpeakNG({
    instantiateWasm(imports, done) { WebAssembly.instantiate(wasm, imports).then(i => done(i, wasm)); return {}; },
    preRun: [m => m.FS.writeFile('/in.txt', text)],
    arguments: ['-v', v, '-p', String(pitch), '-P', String(range), '-s', String(speed), '-g', String(gap), '-w', '/out.wav', '-f', '/in.txt'],
    print: () => {}, printErr: () => {},
  });
  return mod.FS.readFile('/out.wav');
}
if (process.argv[1].endsWith("say.mjs")) {
  const [out, voice, variant, speed, gap, pitch, range, ...t] = process.argv.slice(2);
  fs.writeFileSync(out, await say(t.join(' '), { voice, variant: variant === '-' ? '' : variant, speed:+speed, gap:+gap, pitch:+pitch, range:+range }));
}
