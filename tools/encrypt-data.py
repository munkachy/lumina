"""Make Lumina's encrypted data files: data-catechism.enc and data-docs.enc.

The Catechism and the Church documents are © Libreria Editrice Vaticana, so the public repo
holds them only encrypted, with the same key as Scriptorium (PBKDF2 from the Scriptorium
password → AES-256-CBC + HMAC-SHA256; see scriptorium.js). The readable sources
(data-catechism.js, data-docs.js) stay on this Mac only; .gitignore keeps them out of git.
The Catechism's footnotes (from Scriptorium's ccc_footnotes.py) are folded in as paras[i].f.

Run on the Mac:  python3 tools/encrypt-data.py
It uses the key Scriptorium already keeps, so the password itself is never needed here."""

import json
import os
import sqlite3
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTORIUM = os.path.expanduser("~/mail-assistant")
sys.path.insert(0, SCRIPTORIUM)
import relaycrypto  # noqa: E402  (Scriptorium's encryption, the same scheme as scriptorium.js)


def load_js(name):
    s = open(os.path.join(HERE, name), encoding="utf-8").read()
    return json.loads(s[s.index("{"):s.rindex("}") + 1])


def main():
    settings = json.load(open(os.path.join(SCRIPTORIUM, "data", "settings.json")))
    keys = bytes.fromhex(settings["relay_keys"])

    ccc = load_js("data-catechism.js")
    db = sqlite3.connect(os.path.join(SCRIPTORIUM, "data", "library.db"))
    notes = {}
    try:
        for n, num, text in db.execute("SELECT n, num, text FROM ccc_footnotes ORDER BY n, num"):
            notes.setdefault(n, []).append([num, text])
    except sqlite3.Error:
        pass
    for i, p in enumerate(ccc["paras"], 1):
        if notes.get(i):
            p["f"] = notes[i]
    docs = load_js("data-docs.js")

    for name, data in (("data-catechism.enc", ccc), ("data-docs.enc", docs)):
        blob = relaycrypto.encrypt(keys, json.dumps(data, ensure_ascii=False, separators=(",", ":")))
        open(os.path.join(HERE, name), "w").write(blob + "\n")
        print(f"{name}: {len(blob):,} characters")
    print(f"footnotes included on {len(notes):,} paragraphs")


if __name__ == "__main__":
    main()
