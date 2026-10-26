"""Plain modern English for the Douay-Rheims: thee/thou/ye → you, thy/thine → your/yours,
hath → has, giveth → gives, "Fear ye not" → "Do not fear", spake → spoke, unto → to.
Everything else in the translation is untouched.

Builds two files from the original bible-data.js:
  bible-data.js  — the Douay in plain English (verses, Challoner's notes and chapter summaries)
  data-dro.js    — the original wording, offered as "Douay-Rheims (original wording)"

Run from the repo root:  python3 tools/build-plain.py   (needs macOS's /usr/share/dict/words).
The original is read from data-dro.js once it exists, so running it again is safe."""

import json
import os
import re
import sys

# ---------- plain modern English for the old pronouns and verb endings ----------
# thee/thou/thy → you/your; hath → has; giveth → gives; knowest → know (beside "thou");
# a few fixed archaisms (spake, shew, unto). Everything else in the translation is untouched.

def _dictionary() -> set[str]:
    try:
        with open("/usr/share/dict/words", encoding="utf-8") as fh:
            return {w.strip().lower() for w in fh}
    except OSError:
        return set()


_WORDS = _dictionary()

FIXED = {
    # pronouns
    "thou": "you", "thee": "you", "ye": "you", "thy": "your", "thyself": "yourself",
    # verbs that only ever go with "thou", or are simply old forms
    "art": None, "hast": "have", "hadst": "had", "wast": "were", "wert": "were", "shalt": "shall",
    "wilt": "will", "canst": "can", "couldst": "could", "dost": "do", "didst": "did", "wouldst": "would",
    "shouldst": "should", "mayest": "may", "mayst": "may", "mightest": "might", "mightst": "might",
    "art": "are", "hath": "has", "doth": "does", "saith": "says", "spake": "spoke", "brake": "broke",
    "shew": "show", "shewed": "showed", "sheweth": "shows", "shewn": "shown", "shewing": "showing",
    "unto": "to", "hither": "here", "thither": "there", "whither": "where",
}
NOT_VERBS = {"teeth", "seth", "beneath", "breath", "death", "heath", "sheath", "wreath", "meth",
             "japheth", "nazareth", "elisabeth", "elizabeth", "heth", "ashtaroth", "astaroth"}
_ES_AFTER = ("s", "x", "z", "ch", "sh", "o")


def _third_person(word: str) -> str | None:
    """giveth → gives, teacheth → teaches, flieth → flies, putteth → puts."""
    lw = word.lower()
    if not lw.endswith("eth") or len(lw) < 5 or lw in NOT_VERBS or lw.endswith("tieth"):
        return None
    base = lw[:-3]
    for stem in (base, base + "e", base[:-1] if len(base) > 2 and base[-1] == base[-2] else None):
        if stem and stem in _WORDS:
            return stem + ("es" if stem.endswith(_ES_AFTER) else "s")
    if base.endswith("i") and base[:-1] + "y" in _WORDS:
        return base[:-1] + "ies"
    return None


def _second_person(word: str) -> str | None:
    """knowest → know, lovest → love, seest → see, forgettest → forget (only beside 'thou')."""
    lw = word.lower()
    for cut in ("est", "st"):
        if lw.endswith(cut) and len(lw) > len(cut) + 1:
            base = lw[:-len(cut)]
            for stem in (base, base + "e", base[:-1] if len(base) > 2 and base[-1] == base[-2] else None):
                if stem and stem in _WORDS:
                    return stem
    return None


def _case_like(src: str, new: str) -> str:
    if src.isupper() and len(src) > 1:
        return new.upper()
    return new[0].upper() + new[1:] if src[0].isupper() else new


_WORD_RX = re.compile(r"[A-Za-z]+")


_THINE_YOURS_BEFORE = {"is", "are", "was", "were", "and", "or", "as", "in", "at", "art", "hath", "have", "has",
                       "o", "also", "even", "unto", "upon", "alone", "only", "indeed"}
_NO_DO = {"have", "had", "were", "shall", "will", "can", "could", "do", "did", "would", "should", "may",
          "might", "must", "are"}


# A verb followed by "ye" at the start of a clause is a command ("Teach ye all nations"),
# unless it is a helper verb, which makes a question ("Are ye not…?", "Have ye not read?").
_HELPERS = {"are", "were", "have", "had", "shall", "will", "can", "could", "do", "did", "may", "might",
            "must", "should", "would", "is", "was"}
_COMMAND = re.compile(r"(^|[.:;!?,]\s+|\band\s+|\b(?:why|what|how|whom|where|wherefore|whence)\s+)([A-Za-z]+) ye( not)?\b", re.I)
_KNOW_YE_NOT = re.compile(r"\b([Kk])now ye not\b")


def _imperatives(text: str) -> str:
    """'Fear ye not' → 'Do not fear'; 'Teach ye all nations' → 'Teach all nations';
    'Know ye not that…' (a question) → 'Do you not know that…'."""
    text = _KNOW_YE_NOT.sub(lambda m: ("Do" if m.group(1) == "K" else "do") + " you not know", text)

    def command(m):
        lead, verb, neg = m.group(1), m.group(2), m.group(3)
        if verb.lower() in _HELPERS:
            return m.group(0)          # "Are ye…?" is handled word by word below
        rest = text[m.end():]
        end = re.search(r"[.?!]", rest)
        question = bool(end and end.group(0) == "?") or lead.strip().lower() in (
            "why", "what", "how", "whom", "where", "wherefore", "whence")
        do = "Do" if verb[0].isupper() else "do"
        if question:   # "Why fear ye?" → "Why do you fear?"; "See ye not…?" → "Do you not see…?"
            return lead + do + " you" + (" not " if neg else " ") + verb.lower()
        if neg:        # "Fear ye not" → "Do not fear"
            return lead + do + " not " + verb.lower()
        return lead + verb             # "Teach ye all nations" → "Teach all nations"
    return _COMMAND.sub(command, text)


def modernize(text: str) -> str:
    text = _imperatives(text)
    tokens = _WORD_RX.split(text)      # the gaps between words (spaces, punctuation)
    words = _WORD_RX.findall(text)
    out: list[str] = []
    skip = set()
    for i, w in enumerate(words):
        if i in skip:
            out.append(None)
            continue
        lw = w.lower()
        prev_ = words[i - 1].lower() if i else ""
        next_ = words[i + 1].lower() if i + 1 < len(words) else ""
        joined = i + 1 < len(words) and tokens[i + 1].strip() == ""   # no punctuation before the next word
        new = None
        if lw == "thine":
            # "thine eyes" → "your eyes"; "thine is the kingdom", "it is thine." → "yours"
            new = "your" if joined and next_ and next_[0] in "aeiouh" and next_ not in _THINE_YOURS_BEFORE else "yours"
        elif lw == "art":
            before_that = words[i - 2].lower() if i > 1 else ""
            if prev_ in ("that", "who", "which") and before_that in ("he", "she", "it", "one", "him", "her"):
                new = "is"      # "he that art to come" → "he that is to come"
            else:
                new = "are" if "thou" in (prev_, next_) or prev_ in ("that", "who", "which") else None
        elif lw in FIXED and FIXED[lw]:
            new = FIXED[lw]
            if next_ == "thou" and joined and lw in ("hast", "shalt", "wilt", "canst", "dost", "didst", "wast", "wert"):
                pass  # "Hast thou" → "Have you": no "do" needed
        elif next_ == "thou" and joined:
            stem = _second_person(w)
            if stem and stem not in _NO_DO:
                # "Why sayest thou?" → "Why do you say?"
                new = ("do you " if not w[0].isupper() else "Do you ") + stem
                skip.add(i + 1)
                out.append(new)
                continue
            new = stem
        elif prev_ == "thou":
            new = _second_person(w)
        if new is None and lw.endswith("eth") and not w[0].isupper():
            new = _third_person(w)
        out.append(_case_like(w, new) if new else w)
    result = [tokens[0]]
    for i, w in enumerate(out):
        if w is None:      # a "thou" absorbed into "do you …": drop it and the space before it
            result[-1] = result[-1].rstrip(" ")
            result.append(tokens[i + 1])
            continue
        result += [w, tokens[i + 1]]
    # "Do you know not?" → "Do you not know?"
    return re.sub(r"\b([Dd]o you) (\w+) not\b", r"\1 not \2", "".join(result))


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    orig_path = os.path.join(root, "data-dro.js")
    data_path = os.path.join(root, "bible-data.js")
    if os.path.exists(orig_path):
        # Rebuild from the saved original: put its verses back into the Douay's structure.
        s = open(orig_path, encoding="utf-8").read()
        orig = json.loads(s[s.index("= ", s.index("['dro']")) + 2:s.rindex("}") + 1])
        s = open(data_path, encoding="utf-8").read()
        data = json.loads(s[s.index("{"):s.rindex("}") + 1])
        for b, ob in zip(data["books"], orig["books"]):
            for ch, och in zip(b["ch"], ob["ch"]):
                ch["v"] = list(och["v"])
                if "notes" in och: ch["notes"] = dict(och["notes"])
                if "s" in och: ch["s"] = och["s"]
    else:
        s = open(data_path, encoding="utf-8").read()
        data = json.loads(s[s.index("{"):s.rindex("}") + 1])
        orig = {"id": "dro", "name": "Douay-Rheims (original wording)", "abbr": "DR orig", "books": [
            {"id": b["id"], "name": b["name"], "ch": [
                {k: v for k, v in (("v", ch["v"]), ("notes", ch.get("notes")), ("s", ch.get("s"))) if v}
                for ch in b["ch"]]} for b in data["books"]]}
        with open(orig_path, "w", encoding="utf-8") as fh:
            fh.write("window.LUMINA_TX = window.LUMINA_TX || {};\nwindow.LUMINA_TX['dro'] = ")
            json.dump(orig, fh, ensure_ascii=False, separators=(",", ":"))
            fh.write(";\n")
    changed = 0
    for b in data["books"]:
        for ch in b["ch"]:
            new = [modernize(v) for v in ch["v"]]
            changed += sum(a != n for a, n in zip(ch["v"], new))
            ch["v"] = new
            if ch.get("notes"):
                ch["notes"] = {k: modernize(v) for k, v in ch["notes"].items()}
            if ch.get("s"):
                ch["s"] = modernize(ch["s"])
    data["translation"] = "Douay-Rheims (plain English)"
    with open(data_path, "w", encoding="utf-8") as fh:
        fh.write("window.LUMINA_DATA = ")
        json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write(";\n")
    print(f"{changed} verses put into plain English; original kept in data-dro.js")


if __name__ == "__main__":
    main()
