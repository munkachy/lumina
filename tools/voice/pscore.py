import json, sys, wave, audioop, re, glob
from multiprocessing import Pool
corpus = json.load(open('corpus.json'))
norm = lambda t: re.sub(r"[^a-z' ]", " ", t.lower()).split()
def wer(ref, hyp):
    d = list(range(len(hyp)+1))
    for i, r in enumerate(ref, 1):
        p, d[0] = d[0], i
        for j, h in enumerate(hyp, 1):
            p, d[j] = d[j], min(d[j]+1, d[j-1]+1, p+(r != h))
    return d[len(hyp)]
M = None
def init():
    global M
    from vosk import Model, SetLogLevel; SetLogLevel(-1); M = Model('../asr/vosk-model-small-en-us-0.15')
def job(a):
    from vosk import KaldiRecognizer
    n, i, d = a
    w = wave.open(f'{d}/{n}__{i}.wav'); raw = w.readframes(10**9)
    raw, _ = audioop.ratecv(raw, 2, 1, w.getframerate(), 16000, None)
    r = KaldiRecognizer(M, 16000); r.AcceptWaveform(raw)
    ref = norm(corpus[i]); return n, wer(ref, json.loads(r.FinalResult())['text'].split()), len(ref)
if __name__ == '__main__':
    d = sys.argv[1]
    names = sorted({f.split('/')[-1].split('__')[0] for f in glob.glob(d + '/*.wav')})
    with Pool(4, init) as p: out = p.map(job, [(n, i, d) for n in names for i in range(len(corpus))])
    agg = {}
    for n, e, w in out: a = agg.setdefault(n, [0, 0]); a[0] += e; a[1] += w
    for n, (e, w) in sorted(agg.items(), key=lambda x: x[1][0] / x[1][1]): print(f"{e / w * 100:5.1f}%  {n}")
