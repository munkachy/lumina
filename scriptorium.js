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
  const PREFS = "lumina.scriptorium.prefs";
  const MARK = (k) => "<!--scriptorium:" + k + "-->";
  const enc = new TextEncoder(), dec = new TextDecoder();
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (sel, root) => (root || document).querySelector(sel);

  let view = null;          // Lumina's <main id="view">
  let S = null;             // unlocked session: { keys, token, login, repo, issue, mode, choices, projects, connected }
  let data = null;          // decrypted vault contents
  let tab = "faith", web = false, current = null, voice = null, speaking = null;
  let prefs = Object.assign({
    answerSize: 1, answerFont: "serif", thinkSize: 0.9, thinkFont: "sans",
    autoRead: false, voice: { engine: "device", id: "" },
  }, readJSON(PREFS) || {});

  function readJSON(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; } }
  function savePrefs() { try { localStorage.setItem(PREFS, JSON.stringify(prefs)); } catch (e) {} applyPrefs(); }

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
  async function open(v) {
    view = v;
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
      '<button data-act="new" title="New conversation">＋</button>';
    if (!box) {
      box = document.createElement("div"); box.id = "scrCompose"; box.className = "normal"; document.body.appendChild(box);
      box.innerHTML = '<div class="scr-cbox"><textarea id="scrText" rows="3" placeholder="Message Scriptorium…"></textarea><div class="scr-crow"></div></div>';
      const ta = $("#scrText");
      ta.addEventListener("focus", () => { if (!box.dataset.shrunk) setComposer("full"); });
      ta.addEventListener("blur", () => { delete box.dataset.shrunk; });
      box.addEventListener("click", composerClick);
      if (window.visualViewport) {
        const fit = () => {   // keep the box above the iPhone keyboard
          const vv = window.visualViewport;
          box.style.bottom = Math.max(0, window.innerHeight - vv.height - vv.offsetTop) + "px";
        };
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
      (tab === "faith" ? '<button class="scr-ib ' + (web ? "on" : "") + '" data-act="web" title="Let Faith use the web for this message">🌐</button>' : "") +
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
    if (t.dataset.tab) { tab = t.dataset.tab; web = false; renderMain(); return; }
    if (t.dataset.mode) { request({ kind: "mode", mode: t.dataset.mode }, true); S.mode = t.dataset.mode; chrome(true); return; }
    const act = t.dataset.act;
    if (act === "lumina") backToLumina();
    else if (act === "theme" && window.LuminaTheme) window.LuminaTheme.toggle();
    else if (act === "prefs") openPrefs();
    else if (act === "new") newConversation();
  }

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
    else if (act === "mic") voice ? stopVoice() : startVoice();
    else if (act === "models") openModels();
  }

  async function newConversation() {
    if (current) return;
    data.conv[tab] = null; data.history[tab] = [];
    await saveVault();
    renderMain();
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

  function renderTurn(t, i) {
    return '<div class="scr-turn"><div class="scr-u">' + esc(t.text) + '</div><div class="scr-a" data-i="' + i + '">' + renderReply(t.reply, false) + "</div></div>";
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
    h += '<div class="scr-md">' + md(r.content || "", r.refs || []) + "</div>";
    if (r.sources && r.sources.length) h += '<details class="scr-src"><summary><span class="chev"></span>' + r.sources.length + " emails used</summary>" +
      r.sources.map((s) => "<div>" + s.n + ". " + esc(s.sender) + " — " + esc(s.subject) + "</div>").join("") + "</details>";
    const cc = r.citecheck;
    if (cc && (cc.corrected || []).length) h += '<div class="scr-mem">⚠ Quote check flagged ' + cc.corrected.map(esc).join("; ") + ". It reread the sources and corrected itself above.</div>";
    if (cc && (cc.unverified || []).length + (cc.misquoted || []).length) h += '<div class="scr-err">⚠ Still unverified: ' + cc.unverified.concat(cc.misquoted).map(esc).join("; ") + ". Check before relying on it.</div>";
    if (r.error) h += '<div class="scr-err">' + esc(r.error) + "</div>";
    if (!live && r.content) h += '<div class="scr-actions"><button data-speak="1">🔊 Listen</button><button data-copy="1">Copy</button></div>';
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
    return out.join("").replace(/<\/blockquote><blockquote>/g, "<br>");
  }

  function threadClick(e) {
    const ap = e.target.closest("[data-appr]");
    if (ap) { ap.parentElement.querySelectorAll("button").forEach((b) => b.disabled = true); postSealed("approve", { id: ap.dataset.appr, ok: ap.dataset.ok === "1" }); return; }
    const pill = e.target.closest(".scr-pill");
    if (pill) {
      e.preventDefault();
      const reply = replyFor(pill), r = reply && (reply.refs || [])[+pill.dataset.ref];
      if (r && window.LuminaNav) { leaveChrome(); r.ccc ? window.LuminaNav.ccc(r.ccc) : window.LuminaNav.verse(r.book, r.c, r.v || 1); }
      return;
    }
    const sp = e.target.closest("[data-speak]");
    if (sp) { if (speaking === sp) stopSpeaking(); else { const reply = replyFor(sp); speak(reply && reply.content, sp); } return; }
    const cp = e.target.closest("[data-copy]");
    if (cp) { const reply = replyFor(cp); if (reply) navigator.clipboard.writeText(reply.content).then(() => { cp.textContent = "Copied"; setTimeout(() => cp.textContent = "Copy", 1500); }); }
  }
  function replyFor(el) {
    const a = el.closest(".scr-a");
    if (!a) return null;
    if (a.id === "scrLive") return current && current.state;
    return ((data.history[tab] || [])[+a.dataset.i] || {}).reply;
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
    box.value = ""; box.blur();
    setComposer("normal");
    request({ kind: tab, text, conversation: data.conv[tab] || null, project: tab === "code" ? data.project || (S.projects || [])[0] : null, web });
    web = false;
  }

  function hello() { request({ kind: "hello" }, true); }

  async function request(req, quiet) {
    if (current && !quiet) return;
    const id = Math.random().toString(36).slice(2, 10);
    const since = new Date(Date.now() - 60000).toISOString();
    const job = { id, tab: ["hello", "mode", "setmodel"].includes(req.kind) ? null : req.kind, text: req.text, state: { status: "Sent — waiting for your Mac…" }, quiet };
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
      if (live) { live.removeAttribute("id"); live.dataset.i = data.history[tab].length - 1; live.innerHTML = renderReply(st, false); }
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
    s.innerHTML = '<div class="scr-sheet-card"><div class="scr-grab"></div>' + html + "</div>";
  }
  function closeSheet() { const s = document.getElementById("scrSheet"); if (s) s.remove(); }

  /* ---------- speaking to Scriptorium: the recording goes to the Mac in encrypted
     pieces, Whisper transcribes it there, and the text comes back as it forms ---------- */
  const blobToB64 = (blob) => blob.arrayBuffer().then((b) => b64(new Uint8Array(b)));

  async function startVoice() {
    const box = $("#scrText");
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
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
    voice.rec.stop();
    voice.stream.getTracks().forEach((t) => t.stop());
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
        if (box && t.text) box.value = (v.before ? v.before + " " : "") + t.text;
        if (t.complete) { v.done = true; gh("DELETE", "/repos/" + S.repo + "/issues/comments/" + c.id).catch(() => {}); }
      }
    }
    if (voice === v) voice = null;
    const box = $("#scrText");
    if (box) { box.classList.remove("scr-listening"); box.placeholder = "Message Scriptorium…"; box.focus(); }  // check it, edit, then send
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

  window.Scriptorium = { open };
})();
