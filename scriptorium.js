/* Scriptorium in Lumina: talk to the Scriptorium app on the Mac from anywhere.

   Messages travel through a private GitHub repo (the relay). Each one is encrypted here,
   end to end, with a key made from your Scriptorium password (PBKDF2, 600,000 rounds →
   AES-256-CBC + HMAC-SHA256), so GitHub only ever holds scrambled text; the Mac decrypts,
   answers, and encrypts its reply. After the first unlock the key stays on this device
   (in the browser's key store, where it can be used but not read out), so the password
   isn't asked for again until you choose "Forget this device". */
(function () {
  "use strict";
  const API = "https://api.github.com";
  const VAULT = "lumina.scriptorium.vault";
  const BUILD = 34;   // shown in the toolbar; bump with the ?v= in index.html
  const PREFS = "lumina.scriptorium.prefs";
  const MARK = (k) => "<!--scriptorium:" + k + "-->";
  const enc = new TextEncoder(), dec = new TextDecoder();
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (sel, root) => (root || document).querySelector(sel);

  let view = null;          // Lumina's <main id="view">
  let S = null;             // unlocked session: { keys, token, login, repo, issue, mode, choices, projects, connected }
  let data = null;          // decrypted vault contents
  let tab = "faith", web = false, study = false, current = null, voice = null, speaking = null;
  let prefs = Object.assign({
    answerSize: 1, answerFont: "serif", thinkSize: 0.9, thinkFont: "sans",
    autoRead: false, voice: { engine: "device", id: "" },
  }, readJSON(PREFS) || {});

  function readJSON(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; } }
  function savePrefs() { try { localStorage.setItem(PREFS, JSON.stringify(prefs)); } catch (e) {} applyPrefs(); if (window.LuminaSync) window.LuminaSync.changed(); }   // kept on GitHub with Lumina's data

  /* ---------- illuminated initials ---------- */
  function illum(letter) {   // the illuminated initials; LCARS spells the words out instead
    return '<img class="scr-illum" src="icon-' + letter.toLowerCase() + '.png" alt="">' +
      '<span class="scr-lcars">' + (letter === "S" ? "SCRIPTORIUM" : "LUMINA") + "</span>";
  }

  /* ---------- crypto (must match relaycrypto.py on the Mac) ---------- */
  async function deriveKeys(password, login) {
    const salt = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode("scriptorium-relay:" + login.toLowerCase())));
    const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 600000 }, base, 512));
    return {
      aes: await crypto.subtle.importKey("raw", bits.slice(0, 32), "AES-CBC", false, ["encrypt", "decrypt"]),
      mac: await crypto.subtle.importKey("raw", bits.slice(32), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]),
    };
  }
  const b64 = (u) => { let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  async function encryptText(keys, text) {
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-CBC", iv }, keys.aes, enc.encode(text)));
    const body = new Uint8Array(16 + ct.length); body.set(iv); body.set(ct, 16);
    const tag = new Uint8Array(await crypto.subtle.sign("HMAC", keys.mac, body));
    const all = new Uint8Array(body.length + 32); all.set(body); all.set(tag, body.length);
    return "v1:" + b64(all);
  }
  async function decryptText(keys, blob) {
    const raw = unb64(blob.slice(3)), body = raw.slice(0, -32), tag = raw.slice(-32);
    if (!(await crypto.subtle.verify("HMAC", keys.mac, tag, body))) throw new Error("locked");
    return dec.decode(await crypto.subtle.decrypt({ name: "AES-CBC", iv: body.slice(0, 16) }, keys.aes, body.slice(16)));
  }

  /* ---------- the key, kept on this device after the first unlock ---------- */
  function keyStore(mode) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open("lumina-scriptorium", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("keys");
      req.onsuccess = () => resolve(req.result.transaction("keys", mode).objectStore("keys"));
      req.onerror = () => reject(req.error);
    });
  }
  const idb = (r) => new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
  async function rememberKeys(keys) { try { await idb((await keyStore("readwrite")).put(keys, "keys")); } catch (e) {} }
  async function recallKeys() { try { return await idb((await keyStore("readonly")).get("keys")); } catch (e) { return null; } }
  async function forgetKeys() { try { await idb((await keyStore("readwrite")).delete("keys")); } catch (e) {} }

  /* ---------- the vault on this device ---------- */
  function readVault() { return readJSON(VAULT); }
  async function saveVault() {
    const v = readVault() || {};
    v.blob = await encryptText(S.keys, JSON.stringify(data));
    localStorage.setItem(VAULT, JSON.stringify(v));
  }
  async function openWith(keys) {
    const v = readVault();
    data = JSON.parse(await decryptText(keys, v.blob));
    S = { keys, token: data.token, login: v.login, repo: v.repo, issue: data.issue, connected: false };
    await rememberKeys(keys);
  }

  /* ---------- GitHub ---------- */
  async function gh(method, path, body, token) {
    const r = await fetch(API + path, {
      method, cache: "no-store",
      headers: { Authorization: "Bearer " + (token || S.token), Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28",
                 ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 204) return null;
    if (!r.ok) throw new Error("GitHub said " + r.status + (r.status === 401 ? " (the key was refused)" : r.status === 404 ? " (no access to the relay repo)" : ""));
    return r.json();
  }
  async function postSealed(kind, obj) {
    return gh("POST", "/repos/" + S.repo + "/issues/" + S.issue + "/comments",
      { body: MARK(kind) + "\n" + (await encryptText(S.keys, JSON.stringify(obj))) });
  }

  /* ---------- opening and closing ---------- */
  async function open(v, mode) {
    view = v;
    mindMode = mode === "mind";
    injectStyle();
    document.body.classList.add("scr-on");
    applyPrefs();
    if (!S && readVault()) {
      const keys = await recallKeys();
      if (keys) { try { await openWith(keys); hello(); } catch (e) { S = null; } }
    }
    render();
  }

  function leaveChrome() {
    stopSpeaking();
    document.body.classList.remove("scr-on");
    ["scrBar", "scrCompose", "scrNewPill", "scrSheet"].forEach((id) => { const el = document.getElementById(id); if (el) el.remove(); });
  }
  function backToLumina() { leaveChrome(); location.reload(); }   // Lumina reopens where you were reading

  function render() {
    if (!view) return;
    if (!readVault()) return renderSetup();
    if (!S) return renderUnlock();
    if (mindMode) return renderMind();
    renderMain();
  }

  /* ---------- setup and unlock ---------- */
  function renderSetup(err) {
    chrome(false);
    view.innerHTML = '<div class="scr-page"><div class="scr-seal">' + illum("S") + '</div><h2 class="scr-h">Scriptorium</h2>' +
      '<p class="scr-hint">Talk to Scriptorium on your Mac from anywhere. Set this up once on each device.</p>' +
      (err ? '<p class="scr-err">' + esc(err) + "</p>" : "") +
      '<label>Your GitHub username<input id="scrLogin" autocomplete="username" autocapitalize="off" spellcheck="false"></label>' +
      '<label>Relay repo <input id="scrRepo" value="scriptorium-relay" autocapitalize="off" spellcheck="false"></label>' +
      '<label>GitHub key for the relay <span class="scr-hint">(fine-grained token: only the relay repo, Issues read &amp; write)</span>' +
      '<input id="scrToken" type="password" autocomplete="off" spellcheck="false"></label>' +
      '<label>Scriptorium password <span class="scr-hint">(the same one you set on the Mac)</span><input id="scrPw" type="password" autocomplete="new-password"></label>' +
      '<label>Password again<input id="scrPw2" type="password" autocomplete="new-password"></label>' +
      '<button class="scr-primary" id="scrSetup">Connect</button>' +
      '<p class="scr-small"><a href="#" id="scrBack">‹ Back to Lumina</a></p></div>';
    $("#scrBack", view).onclick = (e) => { e.preventDefault(); backToLumina(); };
    $("#scrSetup", view).onclick = async (e) => {
      const login = val("scrLogin"), repo = login + "/" + val("scrRepo").replace(/^.*\//, ""), token = val("scrToken"), pw = val("scrPw");
      if (!login || !token || !pw) return renderSetup("Fill in every field.");
      if (pw !== val("scrPw2")) return renderSetup("The two passwords don't match.");
      e.target.disabled = true; e.target.textContent = "Connecting…";
      try {
        await gh("GET", "/repos/" + repo, null, token);
        const issues = await gh("GET", "/repos/" + repo + "/issues?state=open&per_page=50", null, token);
        let issue = (issues.find((i) => i.title === "Scriptorium") || {}).number;
        if (!issue) issue = (await gh("POST", "/repos/" + repo + "/issues", { title: "Scriptorium", body: "Encrypted relay. Nothing readable here." }, token)).number;
        const keys = await deriveKeys(pw, login);
        S = { keys, token, login, repo, issue, connected: false };
        data = { token, issue, conv: {}, history: { faith: [], code: [], mail: [] }, project: null };
        localStorage.setItem(VAULT, JSON.stringify({ login, repo }));
        await saveVault();
        await rememberKeys(keys);
        render(); hello();
      } catch (err) { renderSetup("Couldn't connect: " + err.message); }
    };
  }

  function renderUnlock(err) {
    chrome(false);
    view.innerHTML = '<div class="scr-page scr-lock"><div class="scr-seal">' + illum("S") + '</div><h2 class="scr-h">Scriptorium</h2>' +
      (err ? '<p class="scr-err">' + esc(err) + "</p>" : '<p class="scr-hint">Enter your password once on this device.</p>') +
      '<input id="scrPw" type="password" placeholder="Password" autocomplete="current-password">' +
      '<button class="scr-primary" id="scrUnlock">Unlock</button>' +
      '<p class="scr-small"><a href="#" id="scrBack">‹ Back to Lumina</a> · <a href="#" id="scrForget">Forget this device</a></p></div>';
    const go = async () => {
      const b = $("#scrUnlock", view); b.disabled = true; b.textContent = "Unlocking…";
      try { await openWith(await deriveKeys(val("scrPw"), readVault().login)); render(); hello(); }
      catch (e) { renderUnlock("Wrong password."); }
    };
    $("#scrUnlock", view).onclick = go;
    $("#scrPw", view).onkeydown = (e) => { if (e.key === "Enter") go(); };
    $("#scrBack", view).onclick = (e) => { e.preventDefault(); backToLumina(); };
    $("#scrForget", view).onclick = (e) => { e.preventDefault(); forgetDevice(); };
    setTimeout(() => $("#scrPw", view) && $("#scrPw", view).focus(), 50);
  }

  async function forgetDevice() {
    if (!confirm("Remove the Scriptorium key and history from this device? You'll need the GitHub key and password to set it up again.")) return;
    await forgetKeys();
    localStorage.removeItem(VAULT);
    S = null; data = null;
    closeSheet();
    render();
  }

  /* ---------- the fixed toolbar and message box ---------- */
  const TABS = { faith: ["✝", "Faith"], code: ["⌘", "Code"], mail: ["✉", "Mail"] };
  const MODES = [["eco", "Eco"], ["normal", "Normal"], ["turbo", "Turbo"]];

  function chrome(show) {
    let bar = document.getElementById("scrBar"), box = document.getElementById("scrCompose");
    if (!show) { if (bar) bar.remove(); if (box) box.remove(); return; }
    if (!bar) {
      bar = document.createElement("div"); bar.id = "scrBar"; document.body.appendChild(bar);
      bar.onclick = toolbarClick;
    }
    bar.innerHTML =
      '<button class="scr-l" data-act="lumina" title="Back to Lumina">' + illum("L") + "</button>" +
      '<div class="scr-tabs">' + Object.entries(TABS).map(([k, [ic, l]]) =>
        '<button data-tab="' + k + '" class="' + (k === tab ? "on" : "") + '"><span class="ic">' + ic + '</span><span class="lb">' + l + "</span></button>").join("") + "</div>" +
      '<span class="scr-conn ' + (S && S.connected ? "on" : "") + '" title="' + (S && S.connected ? "Mac connected" : "Reaching your Mac…") + '">●<span class="lb"> Mac</span></span>' +
      '<div class="scr-modes">' + MODES.map(([k, l]) =>
        '<button data-mode="' + k + '" class="' + (S && S.mode === k ? "on" : "") + '"><span class="lb">' + l + '</span><span class="ic">' + l[0] + "</span></button>").join("") + "</div>" +
      '<button data-act="theme" title="Light / dark">☾</button>' +
      '<button data-act="prefs" title="Text and voice">Aa</button>' +
      '<button data-act="mind" title="Mind map">🧠</button>' +
      '<button data-act="convs" title="Past conversations">☰</button>' +
      '<button data-act="new" title="New conversation">＋</button>' +
      '<button class="scr-build" data-act="update" title="Check for updates">b' + BUILD + (newerBuild ? ' <span class="scr-upd">↑</span>' : "") + "</button>";
    if (!box) {
      box = document.createElement("div"); box.id = "scrCompose"; box.className = "normal"; document.body.appendChild(box);
      box.innerHTML = '<div class="scr-cbox"><textarea id="scrText" rows="3" placeholder="Message Scriptorium…"></textarea><div class="scr-crow"></div></div>';
      const ta = $("#scrText");
      ta.addEventListener("focus", () => { if (!box.dataset.shrunk) setComposer("full"); });
      ta.addEventListener("blur", () => { delete box.dataset.shrunk; });
      box.addEventListener("click", composerClick);
      if (window.visualViewport) {
        const fit = () => {   // sit the box right on top of the iPhone keyboard, with no gap
          const vv = window.visualViewport, kb = window.innerHeight - vv.height > 120;
          box.classList.toggle("kb", kb);
          const full = box.classList.contains("full"), barH = full ? (document.getElementById("scrBar") || {}).offsetHeight || 0 : 0;
          if (kb && full) { box.style.bottom = "auto"; box.style.top = (vv.offsetTop + barH) + "px"; box.style.height = (vv.height - barH) + "px"; }
          else if (kb) { box.style.bottom = "auto"; box.style.height = ""; box.style.top = (vv.offsetTop + vv.height - box.offsetHeight) + "px"; }
          else { box.style.top = box.style.height = ""; box.style.bottom = "0px"; }
        };
        new ResizeObserver(fit).observe(box);
        visualViewport.addEventListener("resize", fit); visualViewport.addEventListener("scroll", fit); fit();
      }
    }
    composerRow();
  }

  function composerRow() {
    const row = $("#scrCompose .scr-crow");
    if (!row) return;
    const full = $("#scrCompose").classList.contains("full");
    row.innerHTML =
      '<button class="scr-chip" data-act="models" title="Choose the model">' + esc(modelName(tab)) + " ▾</button>" +
      '<span class="grow"></span>' +
      (tab === "faith" ? '<button class="scr-ib ' + (study ? "on" : "") + '" data-act="study" title="Study with Claude: Catechism, Bible and Church documents">✝</button>' +
        '<button class="scr-ib" data-act="mind" title="Mind map">🧠</button>' +
        '<button class="scr-ib ' + (web ? "on" : "") + '" data-act="web" title="Let Faith use the web for this message">🌐</button>' : "") +
      '<button class="scr-ib ' + (voice ? "rec" : "") + '" data-act="mic" title="Speak">' + (voice ? "■" : "🎙") + "</button>" +
      '<button class="scr-ib" data-act="size" title="' + (full ? "Smaller" : "Full screen") + '">' + (full ? "⤡" : "⤢") + "</button>" +
      (current ? '<button class="scr-send stop" data-act="stop" title="Stop">■</button>' : '<button class="scr-send" data-act="send" title="Send">↑</button>');
  }

  function setComposer(size) {
    const box = $("#scrCompose");
    if (!box) return;
    box.classList.toggle("full", size === "full");
    box.classList.toggle("normal", size !== "full");
    composerRow();
  }

  function modelName(purpose) {
    const c = S && S.choices;
    if (!c) return "Model";
    const id = c.current[purpose];
    return (c.models[id] && c.models[id].name) || id || "Model";
  }

  function toolbarClick(e) {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.tab) { leaveMind(); tab = t.dataset.tab; web = false; renderMain(); return; }
    if (t.dataset.mode) { request({ kind: "mode", mode: t.dataset.mode }, true); S.mode = t.dataset.mode; chrome(true); return; }
    const act = t.dataset.act;
    if (act === "lumina") backToLumina();
    else if (act === "theme" && window.LuminaTheme) window.LuminaTheme.toggle();
    else if (act === "prefs") openPrefs();
    else if (act === "convs") { leaveMind(); openConvs(); }
    else if (act === "new") { leaveMind(); newConversation(); }
    else if (act === "mind") { if (mindMode) { leaveMind(); renderMain(); } else { mindMode = true; renderMind(); } }
    else if (act === "update") checkUpdate(true);
  }
  function leaveMind() { if (!mindMode) return; mindMode = false; const box = $("#scrCompose"); if (box) box.style.display = ""; }

  function composerClick(e) {
    const t = e.target.closest("button");
    if (!t) return;
    const act = t.dataset.act, box = $("#scrCompose");
    if (act === "size") {
      const full = box.classList.contains("full");
      if (full) box.dataset.shrunk = "1";
      setComposer(full ? "normal" : "full");
      $("#scrText").focus();
    } else if (act === "send") send();
    else if (act === "stop") { t.disabled = true; postSealed("stop", { request: current.id }); }
    else if (act === "web") { web = !web; composerRow(); }
    else if (act === "study") { study = !study; composerRow(); const t = $("#scrText"); if (t) t.placeholder = study ? "Study with Claude: ask anything…" : "Message Scriptorium…"; }
    else if (act === "mic") voice ? stopVoice() : startVoice();
    else if (act === "mind") { mindMode = true; renderMind(); }
    else if (act === "models") openModels();
  }

  async function newConversation() {
    if (current) return;
    data.conv[tab] = null; data.history[tab] = [];
    await saveVault();
    renderMain();
  }

  /* ---------- updates: fetch the newest page, bypassing the iPhone's cache; nothing saved is lost ---------- */
  let newerBuild = 0;
  async function checkUpdate(ask) {
    let latest = 0;
    try {
      const html = await (await fetch(location.pathname + "?check=" + Date.now(), { cache: "no-store" })).text();
      latest = +((html.match(/scriptorium\.js\?v=(\d+)/) || [])[1] || 0);
    } catch (e) { if (ask) alert("Couldn't check for updates: " + e.message); return; }
    if (latest > BUILD) {
      if (!newerBuild) { newerBuild = latest; chrome(true); }
      if (ask && confirm("Build b" + latest + " is ready (you have b" + BUILD + "). Update now? Your key and conversations stay.")) {
        location.replace(location.pathname + "?b=" + latest + "&t=" + Date.now() + location.hash);
      }
    } else if (ask) alert("You have the latest build, b" + BUILD + ".");
  }

  /* ---------- the mind map: notebook entries he chooses to keep, each an encrypted comment on the
     relay repo's "Mind map" issue (a backup off the Mac, readable here even when the Mac is off).
     Boxes are the Catechism-index topics the entries were filed under, sized by how often they recur. ---------- */
  const MIND_TITLE = "Mind map";
  let mind = null;          // [{cid, date, title, keywords, questions, text, note, annotations?}]
  let mindMeta = { merges: {} };   // his merges of one keyword into another, kept as one encrypted comment
  let mindMode = false;
  const mindKey = (r) => { const c = (r && r.content) || ""; return c.length + ":" + c.slice(0, 60); };
  /* One answer can hold several notebook entries, each under its own heading. headingSplit finds the
     highest heading level (#, ## or ###) used at least twice and cuts the answer there (text before the
     first heading, a greeting say, is left out). If every part has its own Topics or Keywords line the answer is split
     without asking; otherwise the first tap asks "save as N entries, or as one?" and remembers the answer. */
  function headingSplit(content) {
    const c = content || "";
    for (let lvl = 1; lvl <= 4; lvl++) {
      const re = new RegExp("^#{" + lvl + "}(?!#)\\s+(.+)$", "gm"), hits = [...c.matchAll(re)];
      if (hits.length < 2) continue;
      const parts = hits.map((m, k) => c.slice(m.index, k + 1 < hits.length ? hits[k + 1].index : c.length).trim());
      return { parts, titles: hits.map((m) => m[1].replace(/[*#]+$/, "").trim()) };
    }
    return null;
  }
  const splitChoice = (r) => (data.mindSplit || {})[mindKey(r)];
  function mindParts(r) {
    const c = (r && r.content) || "", hs = headingSplit(c), choice = splitChoice(r);
    if (!hs || choice === false) return [c];
    if (choice === true || hs.parts.every((p) => /\b(Topics|Keywords)\**\s*:/i.test(p))) return hs.parts;
    return [c];
  }
  const mindAsks = (r) => { const hs = headingSplit(r && r.content); return !!hs && splitChoice(r) === undefined && mindParts(r).length === 1; };
  const mindSaved = (r) => mindParts(r).every((p) => (data.mindSaved || {})[mindKey({ content: p })]);
  const mindLabel = (r, saved) => { const n = mindParts(r).length;
    return n > 1 ? (saved ? "🧠 " + n + " entries in mind map ✓" : "🧠 Save " + n + " entries to mind map")
      : (saved ? "🧠 In mind map ✓" : "🧠 Save to mind map" + (mindAsks(r) ? "…" : "")); };

  async function mindIssue() {
    if (data.mindIssue) return data.mindIssue;
    const found = (await gh("GET", "/repos/" + S.repo + "/issues?state=all&per_page=100") || []).find((i) => i.title === MIND_TITLE);
    data.mindIssue = found ? found.number :
      (await gh("POST", "/repos/" + S.repo + "/issues", { title: MIND_TITLE, body: "Scriptorium's mind map. Each entry is encrypted with your Scriptorium password." })).number;
    await saveVault();
    return data.mindIssue;
  }

  async function loadMind() {
    const issue = await mindIssue(), out = [];
    for (let page = 1; page < 50; page++) {
      const batch = await gh("GET", "/repos/" + S.repo + "/issues/" + issue + "/comments?per_page=100&page=" + page) || [];
      for (const c of batch) {
        if (c.body.startsWith(MARK("mindmeta"))) {
          try { mindMeta = { cid: c.id, ...JSON.parse(await decryptText(S.keys, c.body.slice(MARK("mindmeta").length).trim())) }; } catch (e) { /* not ours */ }
          continue;
        }
        if (!c.body.startsWith(MARK("mind"))) continue;
        try { out.push({ cid: c.id, ...JSON.parse(await decryptText(S.keys, c.body.slice(MARK("mind").length).trim())) }); } catch (e) { /* not ours */ }
      }
      if (batch.length < 100) break;
    }
    mind = out.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return mind;
  }

  function entryFrom(turn) {
    const c = turn.reply.content || "";
    const title = ((c.match(/^#{1,6}\s+(.+)$/m) || [])[1] || turn.text.slice(0, 60)).replace(/[*#]+$/, "").trim();
    const topics = ((c.match(/\**Topics\**\s*:\**\s*(.+)/i) || [])[1] || "").split(/[;,]/).map((t) => t.replace(/\*+/g, "").trim()).filter(Boolean);
    const qpart = (c.split(/\**Questions\**\s*:?\**/i)[1] || "").split(/\n\s*\*\*/)[0];
    const questions = [...qpart.matchAll(/^\s*[-•*]\s+(.+)$/gm)].map((m) => m[1].trim());
    const kw = (c.split(/\**Keywords\**\s*:\**/i)[1] || "").trim().split(/\n\s*\n/)[0];
    const titleCase = (k) => k.replace(/\b([A-Za-z])([A-Za-z']*)/g, (m, a, b) => a.toUpperCase() + b.toLowerCase());
    const keywords = kw.split(/\s*[·;,\n]\s*/).map((k) => k.replace(/^[\s*\-–•]+|[\s*.]+$/g, ""))
      .map((k) => /[a-z]/.test(k) ? k : titleCase(k))   // ALL CAPS from the model becomes Title Case
      .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
      .filter(Boolean).slice(0, 12);
    return { date: new Date().toISOString(), title, keywords, topics, questions, text: c, note: turn.text, refs: turn.reply.refs || [] };
  }

  async function toggleMind(turn, btn) {
    if (!mindSaved(turn.reply) && mindAsks(turn.reply)) {          // several headings: ask how to save it
      const hs = headingSplit(turn.reply.content);
      sheet("<h3>Save to the mind map</h3><p class=\"scr-hint\">This answer has " + hs.parts.length + " parts:</p><ol>" +
        hs.titles.map((t) => "<li>" + esc(t) + "</li>").join("") + "</ol>" +
        '<div class="scr-appr-b"><button class="scr-primary" id="mmSplit">Save as ' + hs.parts.length + ' entries</button><button id="mmOne">Save as one</button></div>');
      const go = async (split) => { data.mindSplit = data.mindSplit || {}; data.mindSplit[mindKey(turn.reply)] = split; closeSheet(); await toggleMind(turn, btn); };
      $("#mmSplit").onclick = () => go(true);
      $("#mmOne").onclick = () => go(false);
      return;
    }
    btn.disabled = true;
    data.mindSaved = data.mindSaved || {};
    const parts = mindParts(turn.reply), whole = mindKey(turn.reply);
    const drop = async (key) => {
      const cid = data.mindSaved[key]; if (!cid) return;
      await gh("DELETE", "/repos/" + S.repo + "/issues/comments/" + cid).catch(() => {});
      delete data.mindSaved[key];
      if (mind) mind = mind.filter((m) => m.cid !== cid);
    };
    try {
      if (mindSaved(turn.reply)) {                       // in the map: take it (all of its entries) out
        for (const p of parts) await drop(mindKey({ content: p }));
      } else {
        if (parts.length > 1) await drop(whole);         // saved earlier as one lump: replace it with its entries
        for (const p of parts) {
          const key = mindKey({ content: p });
          if (data.mindSaved[key]) continue;
          const entry = entryFrom({ text: turn.text, reply: { content: p, refs: turn.reply.refs } });
          const c = await gh("POST", "/repos/" + S.repo + "/issues/" + (await mindIssue()) + "/comments",
            { body: MARK("mind") + "\n" + (await encryptText(S.keys, JSON.stringify(entry))) });
          data.mindSaved[key] = c.id;
          if (mind) mind.unshift({ cid: c.id, ...entry });
        }
      }
      await saveVault();
    } catch (e) { alert("Couldn't update the mind map: " + e.message); }
    btn.disabled = false;
    const saved = mindSaved(turn.reply);
    btn.classList.toggle("on", saved);
    btn.textContent = mindLabel(turn.reply, saved);
  }

  const mindView = { range: "all", view: "cloud", open: null, merging: false, pick: null, zoom: 1, panX: 0, panY: 0 };
  const tidy = (p) => { p = p.replace(/^[\s"“'‘;:,.—–-]+|[\s"”'’;:,.—–-]+$/g, ""); return p.charAt(0).toUpperCase() + p.slice(1); };
  const topicLabel = (t) => {   // entries saved before keywords: their Catechism-index topics, tidied
    const parts = t.split(/\s+—\s+|\s*;\s*—\s*/).map(tidy).filter(Boolean);
    return parts.length > 1 ? parts[0] + " · " + parts[parts.length - 1] : parts[0] || tidy(t);
  };
  const merged = (k) => { const seen = new Set(); while (mindMeta.merges[k] && !seen.has(k)) { seen.add(k); k = mindMeta.merges[k]; } return k; };
  const keysOf = (m) => [...new Set((m.keywords && m.keywords.length ? m.keywords.map(tidy) : (m.topics || []).map(topicLabel)).filter(Boolean).map(merged))];

  async function saveMeta() {
    const body = MARK("mindmeta") + "\n" + (await encryptText(S.keys, JSON.stringify({ merges: mindMeta.merges })));
    if (mindMeta.cid) await gh("PATCH", "/repos/" + S.repo + "/issues/comments/" + mindMeta.cid, { body });
    else mindMeta.cid = (await gh("POST", "/repos/" + S.repo + "/issues/" + (await mindIssue()) + "/comments", { body })).id;
  }

  const mindHead = () => {
    const todo = (mind || []).filter((m) => !m.annotations).length;
    return '<div class="scr-mind-h"><h2>🧠 Mind map</h2><span class="grow"></span>' +
      (todo ? '<button class="scr-ann" data-annotate="1" title="Claude adds Catechism, Scripture and Church-document references">✳︎ Annotate ' + todo + "</button>" : "") +
      '<button class="scr-x2" data-mind-close="1" title="Back to the notebook">✕</button></div>';
  };

  async function renderMind() {
    chrome(true);
    const box = $("#scrCompose"); if (box) box.style.display = "none";
    view.innerHTML = '<div class="scr-mind">' + mindHead() + '<p class="scr-hint">Loading…</p></div>';
    view.onclick = mindClick;
    // always read it afresh: entries added or removed elsewhere (the Mac, another device) must show here
    try { await loadMind(); } catch (e) { if (!mind) { $(".scr-hint", view).textContent = "Couldn't load the mind map: " + e.message; return; } }
    drawMind();
  }

  function mindData() {
    const since = { month: 31, year: 366, all: 1e6 }[mindView.range] * 864e5;
    const list = mind.filter((m) => Date.now() - Date.parse(m.date) <= since);
    const counts = new Map(), recent = new Set(), pairs = new Map();
    for (const m of list) {
      const ks = keysOf(m);
      for (const k of ks) {
        counts.set(k, (counts.get(k) || 0) + 1);
        if (Date.now() - Date.parse(m.date) < 14 * 864e5) recent.add(k);
      }
      for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) {
        const key = [ks[i], ks[j]].sort().join("\u0001");
        pairs.set(key, (pairs.get(key) || 0) + 1);
      }
    }
    return { list, counts, recent, pairs, max: Math.max(1, ...counts.values()) };
  }

  function drawMind() {
    const { list, counts, recent, pairs, max } = mindData();
    const seg = (name, opts) => '<div class="scr-seg">' + opts.map(([k, l]) => '<button data-' + name + '="' + k + '" class="' + (mindView[name] === k ? "on" : "") + '">' + l + "</button>").join("") + "</div>";
    let h = '<div class="scr-mind">' + mindHead() +
      '<div class="scr-mind-ctl">' + seg("range", [["month", "Month"], ["year", "Year"], ["all", "All"]]) +
      seg("view", [["cloud", "Cloud"], ["web", "Connections"]]) +
      '<button class="scr-merge' + (mindView.merging ? " on" : "") + '" data-merge="1">' + (mindView.merging ? "Done merging" : "Merge") + "</button></div>";
    if (mindView.merging) {
      const ms = Object.entries(mindMeta.merges);
      h += '<p class="scr-hint">' + (mindView.pick ? "Now tap the keyword to merge “" + esc(mindView.pick) + "” into." : "Tap a keyword, then the one to merge it into.") + "</p>" +
        (ms.length ? '<div class="scr-merges">' + ms.map(([a, b]) => '<span>' + esc(a) + " → " + esc(b) + ' <button data-unmerge="' + esc(a) + '" title="Undo">✕</button></span>').join("") + "</div>" : "");
    }
    if (!list.length) {
      h += '<p class="scr-hint">' + (mind.length ? "Nothing saved in this period." : "Nothing saved yet. Tap 🧠 under a notebook entry to add it here.") + "</p>";
    } else if (mindView.view === "web") {
      h += '<p class="scr-hint">Lines join keywords that appear in the same entry. Pinch or scroll to zoom, drag to move.</p>' + webSvg(counts, recent, pairs, max);
    } else {
      h += '<p class="scr-hint">' + list.length + " entr" + (list.length === 1 ? "y" : "ies") + ". Bigger means more often; gold means the last two weeks.</p><div class=\"scr-cloud\">" +
        [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t, n]) =>
          '<button class="scr-box' + (recent.has(t) ? " new" : "") + (mindView.open === t || mindView.pick === t ? " on" : "") + '" data-box="' + esc(t) + '" style="font-size:' +
          (0.8 + 0.9 * (n - 1) / Math.max(1, max - 1)).toFixed(2) + 'rem">' + esc(t) + (n > 1 ? ' <span class="n">' + n + "</span>" : "") + "</button>").join("") + "</div>";
    }
    if (mindView.open && !mindView.merging) {
      const hits = list.filter((m) => keysOf(m).includes(mindView.open));
      h += '<div class="scr-mind-panel"><div class="scr-mind-panel-h"><h3>' + esc(mindView.open) + ' <span class="n">' + hits.length + "</span></h3>" +
        '<button class="scr-x2" data-close-open="1" title="Back to the map">✕</button></div><div class="scr-mind-panel-b">' + hits.map((m) =>
        '<details class="scr-entry"' + (hits.length === 1 ? " open" : "") + '><summary><span class="d">' + new Date(m.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
        "</span> " + esc(m.title) + (m.annotations ? ' <span class="scr-annd">✳︎</span>' : "") + '</summary><div class="scr-md" data-entry="' + m.cid + '">' + md(m.text || "", entryRefs(m)) + "</div>" +
        (m.annotations ? '<div class="scr-sources"><div class="h">✳︎ Sources (Claude)</div><div class="scr-md" data-entry="' + m.cid + '" data-ann="1">' + md(m.annotations, m.annotation_refs || []) + "</div></div>" : "") +
        '<div class="scr-entry-act"><button class="scr-copy2" data-copyentry="' + m.cid + '">Copy</button>' +
        '<button class="scr-del2" data-unmind="' + m.cid + '">Remove from mind map</button></div></details>').join("") + "</div></div>";
    }
    view.innerHTML = h + "</div>";
    if (mindView.view === "web") wireWeb();
  }

  /* the Connections view: keywords placed by a small force layout (linked words pull together), drawn in SVG */
  function webSvg(counts, recent, pairs, max) {
    const nodes = [...counts.keys()].map((k, i) => ({ k, n: counts.get(k), x: Math.cos(i * 2.4) * (60 + i * 6), y: Math.sin(i * 2.4) * (60 + i * 6) }));
    const idx = new Map(nodes.map((d, i) => [d.k, i]));
    const links = [...pairs.entries()].map(([key, w]) => { const [a, b] = key.split("\u0001"); return { a: idx.get(a), b: idx.get(b), w }; }).filter((l) => l.a !== undefined && l.b !== undefined);
    for (let it = 0; it < 300; it++) {
      const cool = 1 - it / 300;
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const A = nodes[i], B = nodes[j]; let dx = A.x - B.x, dy = A.y - B.y; const d2 = dx * dx + dy * dy + 0.01, d = Math.sqrt(d2);
        const f = Math.min(40, 9000 / d2) * cool; dx /= d; dy /= d; A.x += dx * f; A.y += dy * f; B.x -= dx * f; B.y -= dy * f;
      }
      for (const l of links) {
        const A = nodes[l.a], B = nodes[l.b], dx = B.x - A.x, dy = B.y - A.y, d = Math.sqrt(dx * dx + dy * dy) + 0.01;
        const f = (d - 90) * 0.02 * Math.min(3, l.w) * cool; A.x += dx / d * f; A.y += dy / d * f; B.x -= dx / d * f; B.y -= dy / d * f;
      }
      for (const A of nodes) { A.x *= 0.995; A.y *= 0.995; }
    }
    const xs = nodes.map((d) => d.x), ys = nodes.map((d) => d.y);
    const pad = 80, minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad, w = Math.max(...xs) - minX + pad, hgt = Math.max(...ys) - minY + pad;
    const near = mindView.open ? new Set(links.filter((l) => nodes[l.a].k === mindView.open || nodes[l.b].k === mindView.open).flatMap((l) => [nodes[l.a].k, nodes[l.b].k])) : null;
    const dim = (k) => near && !near.has(k) && k !== mindView.open;
    return '<div class="scr-web"><svg id="scrWeb" viewBox="' + [minX, minY, w, hgt].map(Math.round).join(" ") + '" data-vb="' + [minX, minY, w, hgt].join(",") + '">' +
      links.map((l) => '<line x1="' + nodes[l.a].x.toFixed(1) + '" y1="' + nodes[l.a].y.toFixed(1) + '" x2="' + nodes[l.b].x.toFixed(1) + '" y2="' + nodes[l.b].y.toFixed(1) +
        '" stroke-width="' + (0.8 + l.w * 0.9) + '" class="' + (dim(nodes[l.a].k) || dim(nodes[l.b].k) ? "dim" : "") + '"/>').join("") +
      nodes.map((d) => '<text x="' + d.x.toFixed(1) + '" y="' + d.y.toFixed(1) + '" data-box="' + esc(d.k) + '" font-size="' + (12 + 14 * (d.n - 1) / Math.max(1, max - 1)).toFixed(1) +
        '" class="' + (recent.has(d.k) ? "new " : "") + (d.k === mindView.open || d.k === mindView.pick ? "on " : "") + (dim(d.k) ? "dim" : "") + '">' + esc(d.k) + "</text>").join("") +
      "</svg></div>";
  }

  function wireWeb() {
    const svg = $("#scrWeb");
    if (!svg) return;
    const [x0, y0, w0, h0] = svg.dataset.vb.split(",").map(Number);
    let vb = mindView.vb && mindView.vbFor === svg.dataset.vb ? mindView.vb.slice() : [x0, y0, w0, h0];
    const apply = () => { svg.setAttribute("viewBox", vb.join(" ")); mindView.vb = vb.slice(); mindView.vbFor = svg.dataset.vb; };
    apply();
    const zoomAt = (factor, cx, cy) => {   // cx, cy in 0..1 of the box
      const nw = Math.min(w0 * 4, Math.max(w0 / 8, vb[2] * factor)), nh = nw * h0 / w0;
      vb = [vb[0] + (vb[2] - nw) * cx, vb[1] + (vb[3] - nh) * cy, nw, nh]; apply();
    };
    svg.addEventListener("wheel", (e) => { e.preventDefault(); const r = svg.getBoundingClientRect(); zoomAt(e.deltaY > 0 ? 1.12 : 0.89, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); }, { passive: false });
    let drag = null, pinch = null, moved = false;
    svg.addEventListener("touchstart", (e) => {
      moved = false;
      if (e.touches.length === 2) { const [a, b] = e.touches; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) }; drag = null; }
      else if (e.touches.length === 1) drag = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
    svg.addEventListener("touchmove", (e) => {
      e.preventDefault(); moved = true;
      const r = svg.getBoundingClientRect();
      if (pinch && e.touches.length === 2) {
        const [a, b] = e.touches, d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        zoomAt(pinch.d / d, ((a.clientX + b.clientX) / 2 - r.left) / r.width, ((a.clientY + b.clientY) / 2 - r.top) / r.height); pinch.d = d;
      } else if (drag && e.touches.length === 1) {
        const t = e.touches[0];
        vb[0] -= (t.clientX - drag.x) * vb[2] / r.width; vb[1] -= (t.clientY - drag.y) * vb[3] / r.height;
        drag = { x: t.clientX, y: t.clientY }; apply();
      }
    }, { passive: false });
    svg.addEventListener("touchend", (e) => { if (e.touches.length === 0) { drag = pinch = null; } if (moved) e.preventDefault(); });
    let mdrag = null;
    svg.addEventListener("mousedown", (e) => { mdrag = { x: e.clientX, y: e.clientY, moved: false }; });
    window.addEventListener("mousemove", (e) => {
      if (!mdrag) return; const r = svg.getBoundingClientRect();
      if (Math.abs(e.clientX - mdrag.x) + Math.abs(e.clientY - mdrag.y) > 3) mdrag.moved = true;
      vb[0] -= (e.clientX - mdrag.x) * vb[2] / r.width; vb[1] -= (e.clientY - mdrag.y) * vb[3] / r.height; mdrag.x = e.clientX; mdrag.y = e.clientY; apply();
    });
    window.addEventListener("mouseup", () => { if (mdrag && mdrag.moved) svg.dataset.dragged = "1"; mdrag = null; });
  }

  function entryRefs(m) {
    if (m.refs && m.refs.length) return m.refs;
    const seen = new Set();   // saved before links were kept: the Catechism numbers at least
    return [...(m.text || "").matchAll(/CCC\s*(\d{1,4})/g)].filter((x) => !seen.has(x[0]) && seen.add(x[0])).map((x) => ({ text: x[0], ccc: +x[1] }));
  }

  async function annotateAll(btn) {
    const todo = mind.filter((m) => !m.annotations);
    if (!todo.length) return;
    if (!confirm("Ask Claude to add Catechism, Scripture and Church-document references to " + todo.length + " entr" + (todo.length === 1 ? "y" : "ies") +
      "? It uses your Claude plan, roughly 3,000–5,000 tokens each, and runs on your Mac.")) return;
    btn.disabled = true; btn.textContent = "✳︎ Annotating…";
    const st = await request({ kind: "annotate", cids: todo.map((m) => m.cid) }, true);
    mind = null;
    await loadMind().catch(() => {});
    drawMind();
    if (st && st.error) alert(st.error);
  }

  async function mindClick(e) {
    const t = e.target;
    const pill = t.closest(".scr-pill");
    if (pill) {
      e.preventDefault();
      const holder = pill.closest("[data-entry]"), m = holder && mind.find((x) => String(x.cid) === holder.dataset.entry);
      const refs = m ? (holder.dataset.ann ? m.annotation_refs || [] : entryRefs(m)) : [];
      const r = refs[+pill.dataset.ref];
      if (r && window.LuminaNav) { leaveChrome(); r.ccc ? window.LuminaNav.ccc(r.ccc) : window.LuminaNav.verse(r.book, r.c, r.v || 1); }
      return;
    }
    if (t.closest("[data-mind-close]")) { leaveMind(); tab = "faith"; return renderMain(); }
    if (t.closest("[data-close-open]")) { mindView.open = null; return drawMind(); }
    const cpe = t.closest("[data-copyentry]");
    if (cpe) {   // the whole entry, ready to paste to Claude: his words, the summary, and any sources
      const m = mind.find((x) => String(x.cid) === cpe.dataset.copyentry);
      if (!m) return;
      const when = new Date(m.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const text = "Notebook entry (" + when + ")\n\nMy words:\n" + (m.note || "").trim() + "\n\nSummary:\n" + (m.text || "").trim() +
        (m.annotations ? "\n\nSources (Claude):\n" + m.annotations.trim() : "");
      navigator.clipboard.writeText(text).then(() => { cpe.textContent = "Copied ✓"; setTimeout(() => cpe.textContent = "Copy", 1500); },
        () => alert("Couldn't copy: the browser didn't allow it."));
      return;
    }
    const ann = t.closest("[data-annotate]");
    if (ann) return annotateAll(ann);
    const r = t.closest("[data-range]"), v = t.closest("[data-view]"), x = t.closest("[data-box]"), u = t.closest("[data-unmind]");
    const mg = t.closest("[data-merge]"), um = t.closest("[data-unmerge]");
    if (r) { mindView.range = r.dataset.range; return drawMind(); }
    if (v) { mindView.view = v.dataset.view; return drawMind(); }
    if (mg) { mindView.merging = !mindView.merging; mindView.pick = null; return drawMind(); }
    if (um) { delete mindMeta.merges[um.dataset.unmerge]; await saveMeta().catch((err) => alert(err.message)); return drawMind(); }
    if (x) {
      const svg = $("#scrWeb");
      if (svg && svg.dataset.dragged) { delete svg.dataset.dragged; return; }
      const k = x.dataset.box;
      if (mindView.merging) {
        if (!mindView.pick) { mindView.pick = k; return drawMind(); }
        if (mindView.pick !== k && confirm("Merge “" + mindView.pick + "” into “" + k + "”?")) {
          mindMeta.merges[mindView.pick] = k;
          await saveMeta().catch((err) => alert("Couldn't save the merge: " + err.message));
        }
        mindView.pick = null;
        return drawMind();
      }
      mindView.open = mindView.open === k ? null : k;
      return drawMind();
    }
    if (u && confirm("Remove this entry from the mind map?")) {
      await gh("DELETE", "/repos/" + S.repo + "/issues/comments/" + u.dataset.unmind).catch(() => {});
      mind = mind.filter((m) => String(m.cid) !== u.dataset.unmind);
      for (const k in data.mindSaved || {}) if (String(data.mindSaved[k]) === u.dataset.unmind) delete data.mindSaved[k];
      await saveVault();
      drawMind();
    }
  }

  /* ---------- past conversations (kept on the Mac) ---------- */
  async function openConvs() {
    const kindNow = tab;
    sheet("<h3>" + PURPOSE[kindNow] + ' conversations</h3><p class="scr-hint">Asking your Mac…</p>');
    const draw = (list) => {
      const when = (t) => new Date(t * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      sheet("<h3>" + PURPOSE[kindNow] + " conversations</h3>" + (list.length ? list.map((c) =>
        '<div class="scr-conv' + (c.id === data.conv[kindNow] ? " on" : "") + '" data-open="' + c.id + '"><span class="t">' + esc(c.title || "Untitled") +
        '</span><span class="d">' + when(c.updated) + '</span><button class="scr-del" data-del="' + c.id + '" title="Delete">🗑</button></div>').join("")
        : '<p class="scr-hint">No conversations yet.</p>'));
      const card = $(".scr-sheet-card");
      if (card) card.onclick = async (e) => {
        const del = e.target.closest("[data-del]"), open = e.target.closest("[data-open]");
        if (del) {
          e.stopPropagation();
          if (!confirm("Delete this conversation from your Mac? This can't be undone.")) return;
          del.closest(".scr-conv").style.opacity = ".4";
          const st = await request({ kind: "delconv", conv: +del.dataset.del, tab: kindNow }, true);
          if (+del.dataset.del === data.conv[kindNow]) { data.conv[kindNow] = null; data.history[kindNow] = []; await saveVault(); renderMain(); }
          draw((st && st.convs) || []);
        } else if (open) {
          sheet("<h3>Opening…</h3>");
          const st = await request({ kind: "openconv", conv: +open.dataset.open }, true);
          if (!st || !st.messages) return sheet("<h3>Couldn't open it</h3><p class=\"scr-hint\">" + esc((st && st.error) || "Your Mac didn't answer.") + "</p>");
          const turns = [];
          ((st && st.messages) || []).forEach((m) => {
            if (m.role === "user") turns.push({ text: m.content, reply: { content: "", done: true } });
            else if (turns.length) { turns[turns.length - 1].reply.content = m.content; turns[turns.length - 1].reply.refs = m.refs || []; }
          });
          data.conv[kindNow] = +open.dataset.open; data.history[kindNow] = turns;
          await saveVault();
          closeSheet(); tab = kindNow; renderMain();
        }
      };
    };
    const st = await request({ kind: "convs", tab: kindNow }, true);
    draw((st && st.convs) || []);
  }

  /* ---------- the conversation ---------- */
  function renderMain() {
    chrome(true);
    const hist = data.history[tab] || [];
    view.innerHTML = '<div class="scr-thread" id="scrThread">' +
      (tab === "code" ? '<div class="scr-proj"><span>Project</span><select id="scrProject">' + (S.projects || []).map((p) =>
        '<option value="' + esc(p) + '"' + (p === data.project ? " selected" : "") + ">" + esc(p.split("/").pop()) + "</option>").join("") +
        (S.projects && S.projects.length ? "" : "<option>Add a project on the Mac first</option>") + "</select></div>" : "") +
      (hist.length ? hist.map(renderTurn).join("") : '<div class="scr-empty">' + illum("S") + "<p>" +
        ({ faith: "Ask about Scripture or the faith, or share a reflection to check.", code: "Ask about your project.", mail: "Ask about your email." })[tab] + "</p></div>") +
      (current && current.tab === tab ? '<div class="scr-turn"><div class="scr-u">' + esc(current.text) + '</div><div class="scr-a" id="scrLive">' + renderReply(current.state, true) + "</div></div>" : "") +
      "</div>";
    const proj = $("#scrProject", view);
    if (proj) proj.onchange = async () => { data.project = proj.value; data.conv.code = null; await saveVault(); };
    view.onclick = threadClick;
    window.scrollTo(0, document.documentElement.scrollHeight);
  }

  const turnId = (t) => t.id || (t.id = Math.random().toString(36).slice(2, 10));
  function renderTurn(t, i) {
    return '<div class="scr-turn"><div class="scr-u">' + esc(t.text) + '</div><div class="scr-a" data-i="' + i + '" data-tid="' + turnId(t) + '">' + renderReply(t.reply, false) + "</div></div>";
  }
  /* the turn an answer on screen belongs to: by its id, which doesn't shift when old turns drop off */
  function turnOf(a) {
    const h = data.history[tab] || [];
    return (a.dataset.tid && h.find((t) => t.id === a.dataset.tid)) || h[+a.dataset.i];
  }

  function words(t) { return (t.match(/\S+/g) || []).length; }

  function renderReply(r, live) {
    if (!r) return "";
    let h = "";
    if (r.thinking) h += '<details class="scr-think"' + (live && !r.content ? " open" : "") + '><summary><span class="chev"></span>' +
      (live && !r.content ? "Thinking" : "Reasoning") + ' <span class="scr-meta">' + words(r.thinking) + ' words</span></summary><div class="scr-think-body">' + esc(r.thinking) + "</div></details>";
    if (r.steps && r.steps.length) h += '<div class="scr-steps">' + r.steps.map((s) => '<span class="scr-step">' + esc(s) + "</span>").join("") + "</div>";
    (r.memories || []).forEach((m) => { h += '<div class="scr-mem">Remembered: ' + esc(m) + "</div>"; });
    if (r.approval) h += '<div class="scr-appr"><div class="scr-appr-h">' + esc(r.approval.title) + '</div><pre>' + esc(r.approval.detail) + "</pre>" +
      '<div class="scr-appr-b"><button class="scr-primary" data-appr="' + esc(r.approval.id) + '" data-ok="1">Approve</button><button data-appr="' + esc(r.approval.id) + '" data-ok="0">Decline</button></div></div>';
    if (live && r.status) h += '<div class="scr-status"><span class="scr-dots"><i></i><i></i><i></i></span>' + esc(r.status) + "</div>";
    h += '<div class="scr-md">' + md(r.content || "", r.refs && r.refs.length ? r.refs : entryRefs({ text: r.content })) + "</div>";
    if (r.sources && r.sources.length) h += '<details class="scr-src"><summary><span class="chev"></span>' + r.sources.length + " emails used</summary>" +
      r.sources.map((s) => "<div>" + s.n + ". " + esc(s.sender) + " — " + esc(s.subject) + "</div>").join("") + "</details>";
    const cc = r.citecheck;
    if (cc && (cc.corrected || []).length) h += '<div class="scr-mem">⚠ Quote check flagged ' + cc.corrected.map(esc).join("; ") + ". It reread the sources and corrected itself above.</div>";
    if (cc && (cc.unverified || []).length + (cc.misquoted || []).length) h += '<div class="scr-err">⚠ Still unverified: ' + cc.unverified.concat(cc.misquoted).map(esc).join("; ") + ". Check before relying on it.</div>";
    if (r.error) h += '<div class="scr-err">' + esc(r.error) + "</div>";
    if (!live && r.content) h += '<div class="scr-actions"><button data-speak="1">🔊 Listen</button><button data-copy="1">Copy</button>' +
      (tab === "faith" ? '<button data-mind="1" class="' + (mindSaved(r) ? "on" : "") + '">' + mindLabel(r, mindSaved(r)) + "</button>" : "") + "</div>";
    return h;
  }

  /* answers: headings, lists, quotations and citation pills, without stray markup */
  function md(src, refs) {
    refs.forEach((r, i) => { src = src.split(r.text).join("\u0002" + i + "\u0003"); });
    const blocks = [];
    src = src.replace(/```[\w-]*\n([\s\S]*?)(```|$)/g, (m, c) => { blocks.push("<pre><code>" + esc(c.replace(/\n$/, "")) + "</code></pre>"); return "\n\u0000" + (blocks.length - 1) + "\u0000\n"; });
    const inline = (t) => esc(t)
      .replace(/`([^`\n]+)`/g, "<code>$1</code>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\u0002(\d+)\u0003/g, (m, i) => '<a href="#" class="scr-pill" data-ref="' + i + '">' + esc(refs[+i].text) + "</a>");
    const out = []; let para = [], list = null;
    const flush = () => { if (para.length) out.push("<p>" + para.map(inline).join("<br>") + "</p>"); para = []; };
    const endList = () => { if (list) out.push("</" + list + ">"); list = null; };
    for (const line of src.split("\n")) {
      let m;
      const cells = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      if (/^\s*\|.*\|\s*$/.test(line)) {   // a Markdown table row
        flush(); endList();
        if (/^\s*\|[\s:|-]+\|\s*$/.test(line)) continue;   // the |---| line
        const prev = out[out.length - 1] || "";
        if (prev.endsWith("</tr>")) out[out.length - 1] = prev + "<tr>" + cells(line).map((c) => "<td>" + inline(c) + "</td>").join("") + "</tr>";
        else out.push("<tr>" + cells(line).map((c) => "<th>" + inline(c) + "</th>").join("") + "</tr>");
        continue;
      }
      if ((m = line.match(/^\u0000(\d+)\u0000$/))) { flush(); endList(); out.push(blocks[+m[1]]); }
      else if ((m = line.match(/^#{1,6}\s+(.*)/))) { flush(); endList(); out.push("<h4>" + inline(m[1].replace(/[*#]+$/, "")) + "</h4>"); }
      else if (/^\s*([-*_])\1{2,}\s*$/.test(line)) { flush(); endList(); out.push("<hr>"); }
      else if ((m = line.match(/^\s*[-*•]\s+(.*)/)) || (m = line.match(/^\s*\d+[.)]\s+(.*)/))) {
        flush(); const kind = /^\s*\d/.test(line) ? "ol" : "ul";
        if (list !== kind) { endList(); out.push("<" + kind + ">"); list = kind; }
        out.push("<li>" + inline(m[1]) + "</li>");
      }
      else if ((m = line.match(/^\s*>\s?(.*)/))) { flush(); endList(); out.push("<blockquote>" + inline(m[1]) + "</blockquote>"); }
      else if (!line.trim()) { flush(); endList(); }
      else { if (list) endList(); para.push(line); }
    }
    flush(); endList();
    return out.map((x) => x.startsWith("<tr>") ? '<div class="scr-tbl"><table>' + x + "</table></div>" : x)
      .join("").replace(/<\/blockquote><blockquote>/g, "<br>");
  }

  function threadClick(e) {
    const ap = e.target.closest("[data-appr]");
    if (ap) { ap.parentElement.querySelectorAll("button").forEach((b) => b.disabled = true); postSealed("approve", { id: ap.dataset.appr, ok: ap.dataset.ok === "1" }); return; }
    const pill = e.target.closest(".scr-pill");
    if (pill) {
      e.preventDefault();
      const reply = replyFor(pill), refs = reply ? (reply.refs && reply.refs.length ? reply.refs : entryRefs({ text: reply.content })) : [];
      const r = refs[+pill.dataset.ref];
      if (r && window.LuminaNav) { leaveChrome(); r.ccc ? window.LuminaNav.ccc(r.ccc) : window.LuminaNav.verse(r.book, r.c, r.v || 1); }
      return;
    }
    const sp = e.target.closest("[data-speak]");
    if (sp) { if (speaking === sp) stopSpeaking(); else { const reply = replyFor(sp); speak(reply && reply.content, sp); } return; }
    const mb = e.target.closest("[data-mind]");
    if (mb) {
      const a = mb.closest(".scr-a"), turn = a && turnOf(a);
      if (turn) toggleMind(turn, mb);
      else alert("Couldn't find this answer. Close Scriptorium and open it again, then try once more.");
      return;
    }
    const cp = e.target.closest("[data-copy]");
    if (cp) { const reply = replyFor(cp); if (reply) navigator.clipboard.writeText(reply.content).then(() => { cp.textContent = "Copied"; setTimeout(() => cp.textContent = "Copy", 1500); }); }
  }
  function replyFor(el) {
    const a = el.closest(".scr-a");
    if (!a) return null;
    if (a.id === "scrLive") return current && current.state;
    return (turnOf(a) || {}).reply;
  }

  /* ---------- reading without being pulled to the bottom ---------- */
  function atBottom() { return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160; }
  function newPill(show) {
    let p = document.getElementById("scrNewPill");
    if (!show) { if (p) p.remove(); return; }
    if (!p) {
      p = document.createElement("button"); p.id = "scrNewPill"; p.textContent = "↓ New";
      p.onclick = () => { window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" }); p.remove(); };
      document.body.appendChild(p);
    }
  }
  window.addEventListener("scroll", () => { if (atBottom()) newPill(false); }, { passive: true });

  function updateLive(state) {
    const live = $("#scrLive");
    if (!live) return;
    const stick = atBottom();
    const think = $(".scr-think", live), body = think && $(".scr-think-body", think);
    const thinkOpen = think ? think.open : null, thinkTop = body ? body.scrollTop : 0;
    const thinkFollow = body ? body.scrollTop > 0 && body.scrollTop + body.clientHeight >= body.scrollHeight - 30 : false;
    live.innerHTML = renderReply(state, true);
    const t2 = $(".scr-think", live), b2 = t2 && $(".scr-think-body", t2);
    if (t2 && thinkOpen !== null) t2.open = thinkOpen;
    if (b2) b2.scrollTop = thinkFollow ? b2.scrollHeight : thinkTop;   // the reasoning stays where you're reading
    if (stick) window.scrollTo(0, document.documentElement.scrollHeight);
    else newPill(true);
  }

  /* ---------- sending and talking to the Mac ---------- */
  function send() {
    const box = $("#scrText"), text = box.value.trim();
    if (!text || current) return;
    if (prefs.autoRead) primeSpeech();
    if (voice && !voice.sent) { voice.sent = true; if (voice.rec.state !== "inactive") stopVoice(); }   // a late transcript mustn't refill the box
    box.value = ""; box.blur();
    [60, 400].forEach((ms) => setTimeout(() => { box.value = ""; }, ms));   // iOS can re-insert its last word after blur
    setComposer("normal");
    request({ kind: tab, text, conversation: data.conv[tab] || null, project: tab === "code" ? data.project || (S.projects || [])[0] : null, web, study: tab === "faith" && study });
    web = false;
  }

  function hello() { request({ kind: "hello" }, true); checkUpdate(false); syncMindSaved(); }
  async function syncMindSaved() {   // forget "saved" marks for entries no longer in the mind map (removed elsewhere)
    if (!data.mindSaved || !Object.keys(data.mindSaved).length) return;
    try { await loadMind(); } catch (e) { return; }
    const live = new Set(mind.map((m) => String(m.cid)));
    let changed = false;
    for (const k of Object.keys(data.mindSaved)) if (!live.has(String(data.mindSaved[k]))) { delete data.mindSaved[k]; changed = true; }
    if (changed) { await saveVault(); if (!mindMode && view && document.body.classList.contains("scr-on")) renderMain(); }
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && S) checkUpdate(false); });   // back in the app: anything new?

  async function request(req, quiet) {
    if (current && !quiet) return;
    const id = Math.random().toString(36).slice(2, 10);
    const since = new Date(Date.now() - 60000).toISOString();
    const job = { id, tab: ["hello", "mode", "setmodel", "convs", "openconv", "delconv", "annotate"].includes(req.kind) ? null : req.kind, text: req.text, state: { status: "Sent — waiting for your Mac…" }, quiet };
    if (!quiet) { current = job; renderMain(); }
    let reqComment;
    try { reqComment = await postSealed("request", { ...req, id }); }
    catch (e) { job.state = { error: "Couldn't send: " + e.message, done: true }; return finish(job); }
    const started = Date.now();
    while (S) {
      await sleep(2500);
      let comments;
      try { comments = await gh("GET", "/repos/" + S.repo + "/issues/" + S.issue + "/comments?per_page=100&since=" + since); }
      catch (e) { continue; }
      for (const c of comments) {
        if (!c.body.startsWith(MARK("reply"))) continue;
        try {
          const st = JSON.parse(await decryptText(S.keys, c.body.slice(MARK("reply").length).trim()));
          if (st.request !== id) continue;
          job.state = st; job.replyComment = c.id;
        } catch (e) { /* not ours */ }
      }
      if (!job.replyComment && Date.now() - started > 45000)
        job.state = { status: "Your Mac hasn't picked this up yet. Is Scriptorium running, and the Mac awake?" };
      if (!job.replyComment && Date.now() - started > (quiet ? 60000 : 10 * 60000)) {
        job.state = quiet ? {} : { error: "No answer from your Mac. Is Scriptorium running, and the Mac awake?", done: true };
        break;
      }
      if (Date.now() - started > 60 * 60000) { job.state.error = "Gave up waiting after an hour."; job.state.done = true; break; }
      if (!quiet && current === job) updateLive(job.state);
      if (job.state.done) break;
    }
    // Leave nothing behind on GitHub.
    gh("DELETE", "/repos/" + S.repo + "/issues/comments/" + reqComment.id).catch(() => {});
    if (job.replyComment) gh("DELETE", "/repos/" + S.repo + "/issues/comments/" + job.replyComment).catch(() => {});
    finish(job);
    return job.state;
  }

  async function finish(job) {
    if (!S) return;
    const st = job.state;
    if (st.projects) { S.projects = st.projects; if (!data.project) data.project = st.projects[0] || null; }
    if (st.mode) S.mode = st.mode;
    if (st.choices) S.choices = st.choices;
    if (st.done !== undefined) S.connected = true;
    if (job.tab) {
      if (st.conversation) data.conv[job.tab] = st.conversation;
      (data.history[job.tab] = data.history[job.tab] || []).push({ text: job.text, reply: st });
      data.history[job.tab] = data.history[job.tab].slice(-30);
      await saveVault();
    }
    const wasCurrent = current === job;
    if (wasCurrent) current = null;
    if (!view || !document.body.classList.contains("scr-on")) return;
    if (wasCurrent && job.tab === tab) {
      const stick = atBottom(), live = $("#scrLive");
      if (live) { const h = data.history[tab]; live.removeAttribute("id"); live.dataset.i = h.length - 1; live.dataset.tid = turnId(h[h.length - 1]); live.innerHTML = renderReply(st, false); }
      if (!stick) newPill(true);
      if (prefs.autoRead && st.content) speak(st.content, live && $("[data-speak]", live));
    }
    chrome(true);
    if (openModels.refresh) openModels.refresh();
  }

  /* ---------- the model picker ---------- */
  const PURPOSE = { faith: "Faith", code: "Code", mail: "Mail" };
  function openModels() {
    const draw = () => {
      const c = S && S.choices;
      if (!c) return sheet('<h3>Models</h3><p class="scr-hint">Waiting for your Mac to say which models it has…</p>');
      const cur = c.current[tab];
      const dots = (n) => "●".repeat(n || 0) + '<span class="off">' + "●".repeat(5 - (n || 0)) + "</span>";
      sheet("<h3>Model for " + PURPOSE[tab] + '</h3><p class="scr-hint">' + (c.mode === "eco" ? "Eco mode has its own lighter choices." : "Used in Normal and Turbo.") + " Tap ? for each one's strengths.</p>" +
        Object.entries(c.models).filter(([, m]) => m.installed).map(([id, m]) =>
          '<div class="scr-model ' + (id === cur ? "on" : "") + '" data-model="' + esc(id) + '">' +
            '<div class="scr-model-top"><div><div class="scr-model-name">' + esc(m.name) + (id === cur ? ' <span class="scr-tick">✓</span>' : "") + "</div>" +
            '<div class="scr-model-spec">' + esc(m.specialty) + "</div></div>" +
            '<button class="scr-q" data-q="1" title="Strengths and weaknesses">?</button></div>' +
            '<div class="scr-model-more">' +
              '<div class="scr-uses">' + ["faith", "code", "mail"].map((u) => "<span><b>" + PURPOSE[u] + "</b> " + dots((m.uses || {})[u]) + "</span>").join("") + "</div>" +
              "<p><b>Best at</b> " + esc(m.best) + "</p><p><b>Watch out</b> " + esc(m.weak) + "</p>" +
              '<p class="scr-meta">' + esc(m.speed || "") + " · " + esc(m.memory || "") + "</p></div></div>").join(""));
      $("#scrSheet").dataset.kind = "models";
    };
    openModels.refresh = () => { const s = document.getElementById("scrSheet"); if (s && s.dataset.kind === "models") draw(); };
    draw();
    $("#scrSheet").onclick = (e) => {
      if (e.target.id === "scrSheet") return closeSheet();
      const q = e.target.closest("[data-q]");
      if (q) { q.closest(".scr-model").classList.toggle("open"); return; }
      const row = e.target.closest("[data-model]");
      if (row && !row.classList.contains("on") && S.choices) {
        S.choices.current[tab] = row.dataset.model;
        request({ kind: "setmodel", purpose: tab, model: row.dataset.model }, true);
        draw(); composerRow();
      }
    };
  }

  /* ---------- text and voice ---------- */
  const FONTS = { serif: "Georgia, 'Iowan Old Style', 'Times New Roman', serif", sans: "-apple-system, 'Helvetica Neue', Arial, sans-serif", book: "'Palatino Linotype', Palatino, 'Book Antiqua', serif" };
  function applyPrefs() {
    const r = document.documentElement.style;
    r.setProperty("--scr-a-size", prefs.answerSize + "rem");
    r.setProperty("--scr-a-font", FONTS[prefs.answerFont] || FONTS.serif);
    r.setProperty("--scr-t-size", prefs.thinkSize + "rem");
    r.setProperty("--scr-t-font", FONTS[prefs.thinkFont] || FONTS.sans);
  }

  async function openPrefs() {
    const device = window.LuminaSpeak ? window.LuminaSpeak.deviceVoices() : [];
    let presets = [], reading = [];
    try { const m = await window.LuminaSpeak.engine(); presets = Object.keys(m.PRESETS); reading = m.READ_VOICES; } catch (e) {}
    const fontPick = (key) => Object.keys(FONTS).map((f) => '<button data-font="' + key + ":" + f + '" class="' + (prefs[key] === f ? "on" : "") + '" style="font-family:' + FONTS[f].replace(/"/g, "'") + '">' + f[0].toUpperCase() + f.slice(1) + "</button>").join("");
    const v = prefs.voice;
    const opt = (engine, id, label) => '<option value="' + engine + ":" + esc(id) + '"' + (v.engine === engine && v.id === id ? " selected" : "") + ">" + esc(label) + "</option>";
    sheet("<h3>Text and voice</h3>" +
      '<div class="scr-pref"><div class="scr-pref-l">Answers</div><div class="scr-seg">' + fontPick("answerFont") + "</div>" +
        '<div class="scr-seg"><button data-size="answerSize:-1">A−</button><button data-size="answerSize:1">A+</button></div></div>' +
      '<div class="scr-pref"><div class="scr-pref-l">Reasoning</div><div class="scr-seg">' + fontPick("thinkFont") + "</div>" +
        '<div class="scr-seg"><button data-size="thinkSize:-1">A−</button><button data-size="thinkSize:1">A+</button></div></div>' +
      '<div class="scr-pref"><div class="scr-pref-l">Voice</div><select id="scrVoice">' +
        '<optgroup label="Apple voices">' + opt("device", "", "Best Apple voice") + device.map((d) => opt("device", d.id, d.name)).join("") + "</optgroup>" +
        (reading.length ? '<optgroup label="eSpeak reading voices">' + reading.map(([id, l]) => opt("espeak", id, l)).join("") + "</optgroup>" : "") +
        (presets.length ? '<optgroup label="Vox Machina">' + presets.map((p) => opt("vox", p, p)).join("") + "</optgroup>" : "") +
      "</select></div>" +
      '<label class="scr-pref scr-check"><input type="checkbox" id="scrAuto"' + (prefs.autoRead ? " checked" : "") + "> Read every new answer aloud</label>" +
      '<p class="scr-small"><a href="#" id="scrForget2">Forget this device</a></p>');
    const sh = $("#scrSheet");
    sh.dataset.kind = "prefs";
    sh.onclick = (e) => {
      if (e.target.id === "scrSheet") return closeSheet();
      const f = e.target.closest("[data-font]"), z = e.target.closest("[data-size]");
      if (f) { const [k, val] = f.dataset.font.split(":"); prefs[k] = val; savePrefs(); f.parentElement.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === f)); }
      if (z) { const [k, d] = z.dataset.size.split(":"); prefs[k] = Math.min(1.6, Math.max(0.75, Math.round((prefs[k] + 0.08 * d) * 100) / 100)); savePrefs(); }
      if (e.target.id === "scrForget2") { e.preventDefault(); forgetDevice(); }
    };
    $("#scrVoice").onchange = (e) => { const [engine, ...rest] = e.target.value.split(":"); prefs.voice = { engine, id: rest.join(":") }; savePrefs(); };
    $("#scrAuto").onchange = (e) => { prefs.autoRead = e.target.checked; savePrefs(); };
  }

  function plainForSpeech(text) {
    return (text || "").replace(/```[\s\S]*?```/g, " (code) ").replace(/[*_#>`]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\bCCC\s*(\d)/g, "Catechism paragraph $1").split(/\n{2,}/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  }
  function primeSpeech() {   // iPhone only lets sound start from a tap; this keeps the door open for auto-read
    try { if (window.speechSynthesis) speechSynthesis.speak(new SpeechSynthesisUtterance("")); } catch (e) {}
    if (window.LuminaSpeak) window.LuminaSpeak.engine().then((m) => m.unlock()).catch(() => {});
  }
  async function speak(text, btn) {
    const parts = plainForSpeech(text);
    if (!parts.length || !window.LuminaSpeak) return;
    stopSpeaking();
    speaking = btn || true;
    if (btn) btn.textContent = "■ Stop";
    const done = () => { if (btn) btn.textContent = "🔊 Listen"; if (speaking === (btn || true)) speaking = null; };
    const v = prefs.voice;
    try {
      if (v.engine === "device") window.LuminaSpeak.readDevice(parts, v.id, done);
      else {
        const m = await window.LuminaSpeak.engine();
        m.unlock();
        if (v.engine === "vox") { await m.play(parts.join(" "), v.id, 0.5); done(); }
        else m.read(parts.map((t) => ({ text: t })), { ...m.READ_DEFAULTS, variant: v.id }, { onDone: done });
      }
    } catch (e) { done(); }
  }
  function stopSpeaking() {
    if (window.LuminaSpeak) window.LuminaSpeak.stop();
    if (speaking && speaking.textContent) speaking.textContent = "🔊 Listen";
    speaking = null;
  }

  /* ---------- sheets ---------- */
  function sheet(html) {
    let s = document.getElementById("scrSheet");
    if (!s) { s = document.createElement("div"); s.id = "scrSheet"; document.body.appendChild(s); }
    s.innerHTML = '<div class="scr-sheet-card"><div class="scr-grab"></div><button class="scr-x" title="Close">✕</button>' + html + "</div>";
    s.onclick = (e) => { if (e.target.id === "scrSheet") closeSheet(); };   // tapping outside closes it; sheets may add more
    $(".scr-x", s).onclick = (e) => { e.stopPropagation(); closeSheet(); };
  }
  function closeSheet() { const s = document.getElementById("scrSheet"); if (s) s.remove(); }

  /* ---------- speaking to Scriptorium: the recording goes to the Mac in encrypted
     pieces, Whisper transcribes it there, and the text comes back as it forms ---------- */
  const blobToB64 = (blob) => blob.arrayBuffer().then((b) => b64(new Uint8Array(b)));

  /* The microphone is kept open between recordings (released after 10 idle minutes, or when Lumina is
     left), so the phone asks permission once a session rather than for every note. */
  let micStream = null, micRelease = null;
  async function microphone() {
    clearTimeout(micRelease);
    if (micStream && micStream.getAudioTracks().some((t) => t.readyState === "live")) return micStream;
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return micStream;
  }
  function releaseMicrophone() {
    clearTimeout(micRelease);
    if (micStream) micStream.getTracks().forEach((t) => t.stop());
    micStream = null;
  }
  document.addEventListener("visibilitychange", () => { if (document.hidden && !voice) releaseMicrophone(); });

  async function startVoice() {
    const box = $("#scrText");
    let stream;
    try { stream = await microphone(); }
    catch (e) { return alert("Lumina couldn't use the microphone. Allow it in the browser's settings and try again."); }
    const mime = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || "";
    const rec = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 32000 });
    voice = { sid: Math.random().toString(36).slice(2, 10), seq: 0, rec, stream, before: box.value.trim(), since: new Date(Date.now() - 60000).toISOString(), done: false };
    const v = voice;
    composerRow();
    box.classList.add("scr-listening"); box.placeholder = "Listening… the words appear here a few seconds behind you";
    rec.ondataavailable = async (ev) => {
      if (!ev.data.size) return;
      const seq = v.seq++, final = rec.state === "inactive";
      try { await postSealed("audio", { session: v.sid, seq, data: await blobToB64(ev.data), mime: rec.mimeType, final }); }
      catch (e) { box.placeholder = "Couldn't send the audio: " + e.message; }
    };
    rec.start(3000);
    pollTranscript(v);
  }

  function stopVoice() {
    if (!voice) return;
    voice.rec.stop();   // the microphone itself stays open for the next note, for 10 minutes
    clearTimeout(micRelease);
    micRelease = setTimeout(releaseMicrophone, 10 * 60000);
    const b = $('#scrCompose [data-act="mic"]'); if (b) { b.textContent = "…"; b.disabled = true; }
  }

  async function pollTranscript(v) {
    const started = Date.now();
    while (S && !v.done && Date.now() - started < 10 * 60000) {
      await sleep(2000);
      let comments;
      try { comments = await gh("GET", "/repos/" + S.repo + "/issues/" + S.issue + "/comments?per_page=100&since=" + v.since); }
      catch (e) { continue; }
      for (const c of comments) {
        if (!c.body.startsWith(MARK("transcript"))) continue;
        let t;
        try { t = JSON.parse(await decryptText(S.keys, c.body.slice(MARK("transcript").length).trim())); } catch (e) { continue; }
        if (t.session !== v.sid) continue;
        const box = $("#scrText");
        if (box && t.text && !v.sent) box.value = (v.before ? v.before + " " : "") + t.text;
        if (t.complete && !v.sent && box && box.value.trim()) { v.sent = true; v.done = true; send(); }   // spoken notes go straight in
        if (t.complete) { v.done = true; gh("DELETE", "/repos/" + S.repo + "/issues/comments/" + c.id).catch(() => {}); }
      }
    }
    if (voice === v) voice = null;
    const box = $("#scrText");
    if (box) { box.classList.remove("scr-listening"); box.placeholder = "Message Scriptorium…"; if (!v.sent) box.focus(); }  // check it, edit, then send
    composerRow();
  }

  const val = (id) => (($("#" + id, view) || {}).value || "").trim();

  /* ---------- look ---------- */
  function injectStyle() {
    if (document.getElementById("scrStyle")) return;
    const st = document.createElement("style"); st.id = "scrStyle";
    st.textContent = `
:root{--scr-bar-h:52px;--scr-a-size:1rem;--scr-a-font:Georgia,serif;--scr-t-size:.9rem;--scr-t-font:-apple-system,sans-serif}
body.scr-on{padding-top:calc(var(--scr-bar-h) + env(safe-area-inset-top));padding-bottom:160px}
.scr-illum{width:34px;height:34px;display:block;border-radius:6px;object-fit:cover}
.scr-lcars{display:none;font-weight:700;letter-spacing:.08em;font-size:.8rem}
:root[data-theme="lcars"] .scr-illum{display:none}
:root[data-theme="lcars"] .scr-lcars{display:inline-block;background:var(--gold);color:#000;border-radius:999px;padding:4px 10px}
#scrBar{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;gap:6px;padding:calc(6px + env(safe-area-inset-top)) 10px 6px;
  background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid var(--gold-line)}
#scrBar button{border:0;background:none;color:var(--ink);font:inherit;font-size:.92rem;padding:6px 8px;border-radius:10px;cursor:pointer}
#scrBar .scr-l{padding:2px}
.scr-tabs{display:flex;gap:2px;flex:1;min-width:0}
.scr-tabs button.on,.scr-modes button.on{background:var(--panel2);color:var(--gold);font-weight:600;box-shadow:inset 0 0 0 1px var(--gold-line)}
.scr-tabs .ic{margin-right:4px}
.scr-modes{display:flex;gap:1px;background:var(--panel);border-radius:10px;padding:2px}
.scr-modes button{font-size:.78rem!important;padding:5px 7px!important}
.scr-modes .ic{display:none}
.scr-tbl{overflow-x:auto;margin:.6em 0}
.scr-tbl table{border-collapse:collapse;font-size:.92em;min-width:100%}
.scr-tbl th,.scr-tbl td{border-bottom:1px solid var(--gold-line);padding:6px 8px;text-align:left;vertical-align:top}
.scr-tbl th{color:var(--gold);font-weight:600}
.scr-conv{display:flex;align-items:center;gap:8px;padding:11px 4px;border-bottom:1px solid var(--gold-line);cursor:pointer}
.scr-conv.on .t{color:var(--gold);font-weight:600}
.scr-conv .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.scr-conv .d{font-size:.78rem;color:var(--ink-faint);white-space:nowrap}
.scr-del{border:0;background:none;font-size:1rem;padding:4px 6px;cursor:pointer;opacity:.7}
.scr-sheet-card{position:relative}
.scr-x{position:absolute;top:10px;right:12px;border:0;background:var(--panel);color:var(--ink-soft);width:30px;height:30px;border-radius:50%;font-size:.9rem;cursor:pointer}
.scr-mind{max-width:760px;margin:0 auto;padding:4px 4px 40px}
.scr-mind-h{display:flex;align-items:center;justify-content:space-between}
.scr-mind-h h2{font-family:Georgia,serif;margin:.4rem 0}
.scr-x2{border:0;background:var(--panel);color:var(--ink-soft);width:34px;height:34px;border-radius:50%;font-size:1rem;cursor:pointer}
.scr-mind-ctl{display:flex;gap:10px;flex-wrap:wrap;margin:.3rem 0 .4rem}
.scr-seg{display:flex;background:var(--panel);border-radius:10px;padding:2px}
.scr-seg button{border:0;background:none;color:var(--ink);padding:6px 12px;border-radius:8px;font:inherit;font-size:.85rem;cursor:pointer}
.scr-seg button.on{background:var(--panel2);color:var(--gold);font-weight:600;box-shadow:inset 0 0 0 1px var(--gold-line)}
.scr-cloud{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;padding:14px 0}
.scr-box{border:1px solid var(--gold-line);background:var(--panel);color:var(--ink-soft);border-radius:10px;padding:6px 10px;font-family:Georgia,serif;line-height:1.2;cursor:pointer;max-width:100%;text-align:left}
.scr-box.new{color:var(--gold);border-color:var(--gold)}
.scr-box.on{background:var(--gold);color:var(--bg)}
.scr-box .n{font-family:-apple-system,sans-serif;font-size:.7em;opacity:.7}
.scr-mind-panel{position:fixed;left:0;right:0;bottom:0;top:calc(var(--scr-bar-h) + env(safe-area-inset-top));z-index:45;background:var(--bg);display:flex;flex-direction:column}
.scr-mind-panel-h{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-bottom:1px solid var(--gold-line);max-width:760px;width:100%;margin:0 auto;box-sizing:border-box}
.scr-mind-panel-h h3{font-family:Georgia,serif;margin:0;font-size:1.15rem}
.scr-mind-panel-h .n{font-family:-apple-system,sans-serif;font-size:.75em;color:var(--ink-faint)}
.scr-mind-panel-b{overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 14px calc(30px + env(safe-area-inset-bottom));max-width:760px;width:100%;margin:0 auto;box-sizing:border-box;flex:1}
.scr-mind-sub{font-family:Georgia,serif;margin:1rem 0 .4rem;border-top:1px solid var(--gold-line);padding-top:.8rem}
.scr-entry{border-bottom:1px solid var(--gold-line);padding:8px 2px}
.scr-entry summary{cursor:pointer;font-family:Georgia,serif}
.scr-entry summary .d{font-family:-apple-system,sans-serif;font-size:.78rem;color:var(--ink-faint)}
.scr-entry-act{display:flex;gap:14px;align-items:center}
.scr-copy2{border:1px solid var(--gold-line);background:var(--panel);color:var(--ink);border-radius:8px;font-size:.82rem;padding:5px 12px;cursor:pointer}
.scr-del2{border:0;background:none;color:var(--ink-faint);font-size:.8rem;cursor:pointer;padding:6px 0}
.scr-actions button.on{color:var(--gold)}
.scr-mind-h .grow{flex:1}
.scr-ann{border:1px solid var(--gold);background:none;color:var(--gold);border-radius:10px;padding:6px 10px;margin-right:8px;font:inherit;font-size:.85rem;cursor:pointer}
.scr-merge{border:1px solid var(--gold-line);background:var(--panel);color:var(--ink);border-radius:10px;padding:6px 12px;font:inherit;font-size:.85rem;cursor:pointer}
.scr-merge.on{background:var(--gold);color:var(--bg)}
.scr-merges{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:4px 0}
.scr-merges span{font-size:.8rem;background:var(--panel);border-radius:8px;padding:3px 4px 3px 8px;color:var(--ink-soft)}
.scr-merges button{border:0;background:none;color:var(--ink-faint);cursor:pointer}
.scr-web{border:1px solid var(--gold-line);border-radius:14px;overflow:hidden;background:var(--panel);touch-action:none}
.scr-web svg{width:100%;height:62vh;display:block;cursor:grab}
.scr-web line{stroke:var(--gold-line)}
.scr-web line.dim{opacity:.15}
.scr-web text{fill:var(--ink-soft);font-family:Georgia,serif;text-anchor:middle;dominant-baseline:middle;cursor:pointer;paint-order:stroke;stroke:var(--panel);stroke-width:4px}
.scr-web text.new{fill:var(--gold)}
.scr-web text.on{fill:var(--gold);font-weight:700}
.scr-web text.dim{opacity:.25}
.scr-sources{margin:.6rem 0;padding:.6rem .8rem;border-left:3px solid var(--gold);background:var(--panel);border-radius:0 10px 10px 0}
.scr-sources .h{font-size:.75rem;letter-spacing:.06em;color:var(--gold);margin-bottom:.3rem}
.scr-annd{color:var(--gold);font-size:.8em}
.scr-build{font-size:.62rem!important;color:var(--ink-faint)!important;opacity:.85;margin-left:1px;white-space:nowrap;padding:4px 3px!important}
.scr-upd{color:#fff;background:var(--gold);border-radius:8px;padding:0 4px;font-weight:700}
#scrCompose.kb{padding-bottom:4px;background:var(--bg)}
.scr-conn{color:var(--ink-faint);font-size:.78rem;white-space:nowrap}
.scr-conn.on{color:#2e8b57}
@media (max-width:640px){.scr-tabs .lb,.scr-conn .lb,.scr-modes .lb{display:none}.scr-modes .ic{display:inline}.scr-tabs .ic{margin:0;font-size:1.05rem}#scrBar{gap:2px;padding-left:6px;padding-right:6px}}

.scr-thread{max-width:740px;margin:0 auto;padding:10px 4px 20px}
.scr-proj{display:flex;gap:8px;align-items:center;color:var(--ink-faint);font-size:.85rem;margin:4px 0 10px}
.scr-proj select{flex:1;padding:6px 8px;border-radius:10px;border:1px solid var(--gold-line);background:var(--panel);color:var(--ink)}
.scr-empty{text-align:center;color:var(--ink-faint);margin-top:16vh}
.scr-empty .scr-illum{width:84px;height:84px;margin:0 auto 12px}
.scr-turn{margin:0 0 26px}
.scr-u{margin:0 0 12px auto;max-width:86%;width:fit-content;background:var(--panel2);border:1px solid var(--gold-line);border-radius:18px 18px 4px 18px;
  padding:10px 14px;white-space:pre-wrap;font-family:var(--scr-a-font);font-size:var(--scr-a-size);line-height:1.5}
.scr-a{font-family:var(--scr-a-font);font-size:var(--scr-a-size);line-height:1.7;color:var(--ink)}
.scr-md p{margin:0 0 .85em}
.scr-md h4{font-size:1.06em;margin:1.2em 0 .45em;letter-spacing:.01em;color:var(--gold)}
.scr-md ul,.scr-md ol{margin:0 0 .9em;padding-left:1.4em}
.scr-md ul{list-style:none;padding-left:1.1em}
.scr-md ul li{position:relative;margin:.35em 0}
.scr-md ul li::before{content:"";position:absolute;left:-.95em;top:.68em;width:.38em;height:.38em;border-radius:1px;background:var(--gold);transform:rotate(45deg);opacity:.75}
.scr-md ol li{margin:.35em 0;padding-left:.15em}
.scr-md ol li::marker{color:var(--gold);font-weight:600}
.scr-md blockquote{margin:.4em 0 1em;padding:.15em 0 .15em 1em;border-left:3px solid var(--gold);color:var(--ink-soft);font-style:italic}
.scr-md hr{border:0;border-top:1px solid var(--gold-line);margin:1.2em 0}
.scr-md code{font-family:ui-monospace,Menlo,monospace;font-size:.86em;background:var(--panel);border-radius:5px;padding:.08em .35em}
.scr-md pre{background:var(--panel);border:1px solid var(--gold-line);border-radius:12px;padding:12px 14px;overflow-x:auto;font-size:.82em;line-height:1.5}
.scr-md pre code{background:none;padding:0}
.scr-md a{color:var(--gold)}
.scr-pill{display:inline-block;text-decoration:none!important;font-family:-apple-system,sans-serif;font-size:.74em;font-weight:600;letter-spacing:.02em;
  color:var(--gold)!important;background:var(--panel2);border:1px solid var(--gold-line);border-radius:999px;padding:.08em .6em;margin:0 .1em;vertical-align:.08em;white-space:nowrap}
.scr-think,.scr-src{border:1px solid var(--gold-line);border-radius:14px;margin:0 0 12px;background:var(--panel);overflow:hidden}
.scr-think summary,.scr-src summary{list-style:none;cursor:pointer;padding:8px 12px;font-family:-apple-system,sans-serif;font-size:.82rem;color:var(--ink-faint);display:flex;align-items:center;gap:6px}
.scr-think summary::-webkit-details-marker,.scr-src summary::-webkit-details-marker{display:none}
.chev{width:7px;height:7px;border-right:1.6px solid currentColor;border-bottom:1.6px solid currentColor;transform:rotate(-45deg);transition:transform .15s;margin-right:3px}
details[open]>summary .chev{transform:rotate(45deg)}
.scr-meta{color:var(--ink-faint);font-size:.78rem;margin-left:auto}
.scr-think-body{padding:2px 14px 12px;white-space:pre-wrap;font-family:var(--scr-t-font);font-size:var(--scr-t-size);line-height:1.6;color:var(--ink-soft);max-height:45vh;overflow-y:auto;overscroll-behavior:contain}
.scr-src div{padding:2px 14px;font-size:.82rem;color:var(--ink-soft)}
.scr-steps{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}
.scr-step{font-family:-apple-system,sans-serif;font-size:.74rem;color:var(--ink-faint);background:var(--panel);border:1px solid var(--gold-line);border-radius:999px;padding:3px 10px}
.scr-mem{font-family:-apple-system,sans-serif;font-size:.8rem;color:var(--gold);margin:0 0 10px}
.scr-status{display:flex;align-items:center;gap:8px;font-family:-apple-system,sans-serif;font-size:.84rem;color:var(--ink-faint);margin:2px 0 10px}
.scr-dots i{display:inline-block;width:5px;height:5px;margin:0 1.5px;border-radius:50%;background:var(--gold);animation:scrDot 1.2s infinite ease-in-out}
.scr-dots i:nth-child(2){animation-delay:.15s}.scr-dots i:nth-child(3){animation-delay:.3s}
@keyframes scrDot{0%,80%,100%{opacity:.25}40%{opacity:1}}
.scr-actions{display:flex;gap:4px;margin-top:4px}
.scr-actions button{border:0;background:none;color:var(--ink-faint);font-family:-apple-system,sans-serif;font-size:.8rem;padding:4px 8px;border-radius:8px;cursor:pointer}
.scr-appr{border:1px solid var(--gold);border-radius:14px;overflow:hidden;margin:6px 0 12px}
.scr-appr-h{padding:8px 12px;background:var(--panel2);font-family:-apple-system,sans-serif;font-weight:600;font-size:.85rem}
.scr-appr pre{margin:0;padding:10px 12px;max-height:40vh;overflow:auto;font-size:.74rem}
.scr-appr-b{display:flex;gap:8px;padding:8px 12px;border-top:1px solid var(--gold-line)}
.scr-appr-b button{border:1px solid var(--gold-line);background:var(--panel);color:var(--ink);border-radius:10px;padding:6px 14px;font-weight:600;margin:0}
.scr-err{color:#b3261e;font-family:-apple-system,sans-serif;font-size:.86rem;margin:6px 0}

#scrCompose{position:fixed;left:0;right:0;bottom:0;z-index:40;padding:8px 10px calc(8px + env(safe-area-inset-bottom));background:linear-gradient(to top,var(--bg) 70%,transparent)}
.scr-cbox{max-width:740px;margin:0 auto;border:1px solid var(--gold-line);border-radius:22px;background:var(--panel);box-shadow:0 4px 18px rgba(0,0,0,.08);
  display:flex;flex-direction:column;padding:10px 12px 8px}
#scrText{border:0;outline:none;resize:none;background:none;color:var(--ink);font-family:var(--scr-a-font);font-size:max(16px,var(--scr-a-size));line-height:1.5;min-height:4.5em;max-height:4.5em}
#scrCompose.full{top:calc(var(--scr-bar-h) + env(safe-area-inset-top));background:var(--bg)}
#scrCompose.full .scr-cbox{height:100%;box-sizing:border-box}
#scrCompose.full #scrText{flex:1;max-height:none}
.scr-listening{font-style:italic;color:var(--ink-soft)!important}
.scr-crow{display:flex;align-items:center;gap:4px;margin-top:6px}
.scr-crow .grow{flex:1}
.scr-chip{border:1px solid var(--gold-line);background:var(--panel2);color:var(--ink-soft);border-radius:999px;padding:5px 11px;font-family:-apple-system,sans-serif;font-size:.78rem;cursor:pointer;max-width:50vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.scr-ib{border:0;background:none;font-size:1.05rem;width:36px;height:36px;border-radius:50%;cursor:pointer;color:var(--ink-soft);padding:0}
.scr-ib.on{background:var(--panel2);box-shadow:inset 0 0 0 1px var(--gold)}
.scr-ib.rec{color:#b3261e;animation:scrDot 1.2s infinite}
.scr-send{border:0;width:36px;height:36px;border-radius:50%;background:var(--gold);color:var(--bg);font-size:1.1rem;font-weight:700;cursor:pointer;padding:0}
.scr-send.stop{background:var(--ink);font-size:.8rem}
#scrNewPill{position:fixed;left:50%;transform:translateX(-50%);bottom:150px;z-index:45;border:1px solid var(--gold-line);background:var(--panel2);color:var(--gold);
  border-radius:999px;padding:6px 14px;font-family:-apple-system,sans-serif;font-size:.8rem;font-weight:600;box-shadow:0 3px 12px rgba(0,0,0,.15);cursor:pointer}

#scrSheet{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.35);display:flex;align-items:flex-end;justify-content:center}
.scr-sheet-card{width:100%;max-width:560px;max-height:82vh;overflow-y:auto;background:var(--bg);border-radius:22px 22px 0 0;padding:8px 18px calc(18px + env(safe-area-inset-bottom));
  box-shadow:0 -6px 30px rgba(0,0,0,.2);font-family:-apple-system,sans-serif;color:var(--ink)}
.scr-grab{width:40px;height:5px;border-radius:3px;background:var(--gold-line);margin:4px auto 12px}
.scr-sheet-card h3{margin:0 0 4px;font-family:Georgia,serif;font-size:1.2rem}
.scr-model{border:1px solid var(--gold-line);border-radius:14px;padding:10px 12px;margin:10px 0;cursor:pointer;background:var(--panel)}
.scr-model.on{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold)}
.scr-model-top{display:flex;align-items:center;gap:10px}
.scr-model-top>div{flex:1}
.scr-model-name{font-weight:600}
.scr-tick{color:var(--gold)}
.scr-model-spec{font-size:.82rem;color:var(--ink-soft)}
.scr-q{width:26px;height:26px;border-radius:50%;border:1px solid var(--gold-line);background:var(--panel2);color:var(--gold);font-weight:700;cursor:pointer;padding:0}
.scr-model-more{display:none;margin-top:8px;font-size:.84rem;line-height:1.5;color:var(--ink-soft)}
.scr-model.open .scr-model-more{display:block}
.scr-model-more p{margin:.35em 0}
.scr-model-more b{color:var(--ink)}
.scr-uses{display:flex;gap:14px;flex-wrap:wrap;font-size:.8rem}
.scr-uses span{color:var(--gold);letter-spacing:1px}
.scr-uses .off{color:var(--gold-line);opacity:.5}
.scr-uses b{color:var(--ink);letter-spacing:0;margin-right:2px}
.scr-pref{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:14px 0}
.scr-pref-l{width:84px;font-weight:600;font-size:.88rem}
.scr-pref select{flex:1;padding:7px;border-radius:10px;border:1px solid var(--gold-line);background:var(--panel);color:var(--ink);font-size:.9rem}
.scr-seg{display:flex;border:1px solid var(--gold-line);border-radius:10px;overflow:hidden}
.scr-seg button{border:0;background:var(--panel);color:var(--ink);padding:6px 11px;font-size:.88rem;cursor:pointer;margin:0}
.scr-seg button.on{background:var(--panel2);color:var(--gold);font-weight:600}
.scr-check{font-size:.9rem}

.scr-page{max-width:460px;margin:6vh auto 0;padding:0 8px;font-family:-apple-system,sans-serif}
.scr-page label{display:block;margin:.8rem 0;font-weight:600;color:var(--ink-soft);font-size:.9rem}
.scr-page input{display:block;width:100%;box-sizing:border-box;margin-top:.35rem;padding:.65rem .8rem;border:1px solid var(--gold-line);border-radius:12px;background:var(--panel);color:var(--ink);font:inherit;font-size:16px}
.scr-seal{display:flex;justify-content:center}.scr-seal .scr-illum{width:96px;height:96px}
.scr-h{text-align:center;font-family:Georgia,serif;margin:.4rem 0}
.scr-hint{color:var(--ink-faint);font-weight:400;font-size:.88rem;text-align:center}
.scr-small{color:var(--ink-faint);font-size:.82rem;text-align:center;margin-top:1rem}
.scr-small a{color:var(--gold)}
.scr-lock input{max-width:300px;margin:1rem auto}
.scr-primary{display:block;margin:1rem auto;border:0;border-radius:12px;background:var(--gold);color:var(--bg);font-weight:700;padding:.7rem 1.6rem;font-size:1rem;cursor:pointer}
.scr-primary:disabled{opacity:.6}`;
    document.head.appendChild(st);
  }


  /* ---------- Lumina's saved data: highlights, notes, favorites, plans and settings, kept in the
     relay repo's "Lumina data" issue, so they are safe off the phone and the same on every device.
     The data is compressed and sealed with the Scriptorium key (GitHub holds only scrambled text),
     then split into comments under GitHub's 65,536-character limit. A save writes the new set
     first and only then removes the old one, so a reader never meets half a save. ---------- */
  const DATA_TITLE = "Lumina data", DATA_PART = 40000;
  async function quietOpen() {          // unlock with the key kept on this device, showing nothing
    if (S) return true;
    if (!readVault()) return false;
    const keys = await recallKeys();
    if (!keys) return false;
    try { await openWith(keys); return true; } catch (e) { S = null; return false; }
  }
  async function dataIssue() {
    if (data.dataIssue) return data.dataIssue;
    const found = (await gh("GET", "/repos/" + S.repo + "/issues?state=all&per_page=100") || []).find((i) => i.title === DATA_TITLE);
    data.dataIssue = found ? found.number :
      (await gh("POST", "/repos/" + S.repo + "/issues", { title: DATA_TITLE, body: "Lumina's highlights, notes and favorites. Encrypted with your Scriptorium password." })).number;
    await saveVault();
    return data.dataIssue;
  }
  async function squeeze(text) {        // gzip, as base64 (plain text where the browser cannot)
    if (!window.CompressionStream) return { z: 0, s: text };
    const out = new Uint8Array(await new Response(new Blob([enc.encode(text)]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer());
    return { z: 1, s: b64(out) };
  }
  async function unsqueeze(z, s) {
    if (!z) return s;
    return dec.decode(await new Response(new Blob([unb64(s)]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
  }
  async function dataComments(kind = "lumdata") {
    const issue = await dataIssue(), out = [];
    for (let page = 1; page < 50; page++) {
      const batch = await gh("GET", "/repos/" + S.repo + "/issues/" + issue + "/comments?per_page=100&page=" + page) || [];
      for (const c of batch) {
        if (!c.body.startsWith(MARK(kind))) continue;
        try { out.push({ cid: c.id, ...JSON.parse(await decryptText(S.keys, c.body.slice(MARK(kind).length).trim())) }); }
        catch (e) { out.push({ cid: c.id, bad: true }); }
      }
      if (batch.length < 100) break;
    }
    return out;
  }
  async function loadData(kind) {       // the newest complete save, or null if there is none yet
    const parts = await dataComments(kind), sets = {};
    parts.filter((p) => !p.bad).forEach((p) => { (sets[p.v] = sets[p.v] || []).push(p); });
    const whole = Object.values(sets).filter((ps) => ps.length === ps[0].n).sort((a, b) => b[0].t - a[0].t)[0];
    if (!whole) return null;
    whole.sort((a, b) => a.i - b.i);
    return JSON.parse(await unsqueeze(whole[0].z, whole.map((p) => p.part).join("")));
  }
  async function storeData(obj, kind = "lumdata") {
    const old = await dataComments(kind), issue = await dataIssue();
    const { z, s } = await squeeze(JSON.stringify(obj));
    const v = Date.now().toString(36) + Math.random().toString(36).slice(2, 6), t = Date.now();
    const n = Math.max(1, Math.ceil(s.length / DATA_PART));
    for (let i = 0; i < n; i++)
      await gh("POST", "/repos/" + S.repo + "/issues/" + issue + "/comments",
        { body: MARK(kind) + "\n" + (await encryptText(S.keys, JSON.stringify({ v, t, i, n, z, part: s.slice(i * DATA_PART, (i + 1) * DATA_PART) }))) });
    for (const c of old) await gh("DELETE", "/repos/" + S.repo + "/issues/comments/" + c.cid).catch(() => {});
  }
  async function removeData(kind) {     // e.g. the Grail file, removed on purpose
    for (const c of await dataComments(kind)) await gh("DELETE", "/repos/" + S.repo + "/issues/comments/" + c.cid).catch(() => {});
  }

  window.Scriptorium = { open, data: { ready: quietOpen, load: loadData, store: storeData, remove: removeData } };
})();
