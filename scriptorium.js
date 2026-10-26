/* Scriptorium in Lumina — talk to the Scriptorium app on the Mac from anywhere.

   Messages travel through a private GitHub repo (the relay). Each one is encrypted here,
   end to end, with a key made from your Scriptorium password (PBKDF2, 600,000 rounds →
   AES-256-CBC + HMAC-SHA256), so GitHub only ever holds scrambled text; the Mac decrypts,
   answers, and encrypts its reply. Your GitHub key is stored on this device encrypted with
   the same password. Nothing here works until you unlock it. */
(function () {
  "use strict";
  const API = "https://api.github.com";
  const VAULT = "lumina.scriptorium.vault";
  const MARK = (k) => "<!--scriptorium:" + k + "-->";
  const enc = new TextEncoder(), dec = new TextDecoder();
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  let view = null;          // Lumina's <main id="view">
  let S = null;             // unlocked session: { keys, token, login, repo, issue }
  let data = null;          // decrypted vault contents
  let tab = "faith", web = false, current = null, lockTimer = null;

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

  /* ---------- the vault on this device ---------- */
  function readVault() { try { return JSON.parse(localStorage.getItem(VAULT) || "null"); } catch (e) { return null; } }
  async function saveVault() {
    const v = readVault() || {};
    v.blob = await encryptText(S.keys, JSON.stringify(data));
    localStorage.setItem(VAULT, JSON.stringify(v));
  }
  function lock() { S = null; data = null; current = null; if (view && document.body.contains(view)) render(); }
  function touch() { clearTimeout(lockTimer); lockTimer = setTimeout(lock, 20 * 60 * 1000); }  // lock after 20 idle minutes

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

  /* ---------- screens ---------- */
  function open(v) { view = v; injectStyle(); render(); }

  function render() {
    if (!view) return;
    if (!readVault()) return renderSetup();
    if (!S) return renderUnlock();
    renderMain();
  }

  function renderSetup(err) {
    view.innerHTML = '<div class="view scr"><h2 class="ch-title">Ⓢ Scriptorium</h2>' +
      '<p class="scr-hint">Talk to Scriptorium on your Mac from anywhere. Set this up once on each device.</p>' +
      (err ? '<p class="scr-err">' + esc(err) + "</p>" : "") +
      '<label>Your GitHub username<input id="scrLogin" autocomplete="username" autocapitalize="off" spellcheck="false"></label>' +
      '<label>Relay repo <input id="scrRepo" value="scriptorium-relay" autocapitalize="off" spellcheck="false"></label>' +
      '<label>GitHub key for the relay <span class="scr-hint">(fine-grained token: only the relay repo, Issues read &amp; write)</span>' +
      '<input id="scrToken" type="password" autocomplete="off" spellcheck="false"></label>' +
      '<label>Scriptorium password <span class="scr-hint">(the same one you set on the Mac)</span><input id="scrPw" type="password" autocomplete="new-password"></label>' +
      '<label>Password again<input id="scrPw2" type="password" autocomplete="new-password"></label>' +
      '<button class="btn primary" id="scrSetup">Connect</button></div>';
    view.querySelector("#scrSetup").onclick = async (e) => {
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
        S = { keys, token, login, repo, issue };
        data = { token, issue, conv: {}, history: { faith: [], code: [], mail: [] }, project: null };
        localStorage.setItem(VAULT, JSON.stringify({ login, repo }));
        await saveVault();
        touch(); render(); hello();
      } catch (err) { renderSetup("Couldn't connect: " + err.message); }
    };
  }

  function renderUnlock(err) {
    const v = readVault();
    view.innerHTML = '<div class="view scr scr-lock"><div class="scr-seal">Ⓢ</div><h2 class="ch-title">Scriptorium</h2>' +
      (err ? '<p class="scr-err">' + esc(err) + "</p>" : '<p class="scr-hint">Locked</p>') +
      '<input id="scrPw" type="password" placeholder="Password" autocomplete="current-password">' +
      '<button class="btn primary" id="scrUnlock">Unlock</button>' +
      '<p class="scr-small"><a href="#" id="scrForget">Forget this device</a></p></div>';
    const go = async () => {
      const b = view.querySelector("#scrUnlock"); b.disabled = true; b.textContent = "Unlocking…";
      try {
        const keys = await deriveKeys(val("scrPw"), v.login);
        data = JSON.parse(await decryptText(keys, v.blob));
        S = { keys, token: data.token, login: v.login, repo: v.repo, issue: data.issue };
        touch(); render(); hello();
      } catch (e) { renderUnlock("Wrong password."); }
    };
    view.querySelector("#scrUnlock").onclick = go;
    view.querySelector("#scrPw").onkeydown = (e) => { if (e.key === "Enter") go(); };
    view.querySelector("#scrForget").onclick = (e) => {
      e.preventDefault();
      if (confirm("Remove the Scriptorium key and history from this device?")) { localStorage.removeItem(VAULT); render(); }
    };
    setTimeout(() => view.querySelector("#scrPw") && view.querySelector("#scrPw").focus(), 50);
  }

  const TABS = { faith: "✝ Faith", code: "⌘ Code", mail: "✉ Mail" };
  function renderMain() {
    const hist = data.history[tab] || [];
    view.innerHTML = '<div class="view scr scr-main">' +
      '<div class="scr-top"><div class="scr-tabs">' + Object.entries(TABS).map(([k, l]) =>
        '<button class="btn small' + (k === tab ? " on" : "") + '" data-tab="' + k + '">' + l + "</button>").join("") + "</div>" +
      '<button class="btn small" id="scrNew" title="New conversation">＋</button><button class="btn small" id="scrLock" title="Lock">🔒</button></div>' +
      '<div class="scr-bar"><span id="scrConn" class="scr-small">' + (S.connected ? "● Mac connected" : "○ Reaching your Mac…") + "</span>" +
      '<span class="scr-modes">' + ["eco", "normal", "turbo"].map((m) =>
        '<button class="btn small' + (S.mode === m ? " on" : "") + '" data-mode="' + m + '">' + m[0].toUpperCase() + m.slice(1) + "</button>").join("") + "</span></div>" +
      (tab === "code" ? '<div class="scr-bar"><select id="scrProject">' + (S.projects || []).map((p) =>
        '<option value="' + esc(p) + '"' + (p === data.project ? " selected" : "") + ">" + esc(p.split("/").pop()) + "</option>").join("") +
        (S.projects && S.projects.length ? "" : "<option>Add a project on the Mac first</option>") + "</select></div>" : "") +
      (tab === "mail" ? '<p class="scr-small">Mail answers are encrypted on the way, like everything here.</p>' : "") +
      '<div class="scr-thread" id="scrThread">' + (hist.length ? hist.map(renderTurn).join("") :
        '<p class="scr-hint scr-empty">' + ({ faith: "Ask about Scripture or the faith.", code: "Ask about your project.", mail: "Ask about your email." })[tab] + "</p>") +
      (current && current.tab === tab ? '<div id="scrLive">' + renderReply(current.state, true) + "</div>" : "") + "</div>" +
      '<div class="scr-compose"><textarea id="scrText" rows="2" placeholder="Message Scriptorium…"></textarea>' +
      '<div class="scr-sendrow"><span>' + (tab === "faith" ? '<button class="btn small' + (web ? " on" : "") + '" id="scrWeb">🌐 Web</button>' : "") +
      ' <button class="btn small" id="scrMic" title="Speak — Whisper on your Mac">🎙 Speak</button></span>' +
      (current ? '<button class="btn" id="scrStop">■ Stop</button>' : '<button class="btn primary" id="scrSend">Send</button>') + "</div></div></div>";
    wire();
    const th = view.querySelector("#scrThread"); th.scrollTop = th.scrollHeight;
  }

  function renderTurn(t) {
    return '<div class="scr-u">' + esc(t.text) + "</div>" + renderReply(t.reply, false);
  }

  function renderReply(r, live) {
    if (!r) return "";
    let h = '<div class="scr-a">';
    if (r.thinking) h += '<details class="scr-think"' + (live && !r.content ? " open" : "") + "><summary>" + (live && !r.content ? "Thinking…" : "Reasoning") + "</summary><div>" + esc(r.thinking) + "</div></details>";
    if (r.steps && r.steps.length) h += '<div class="scr-steps">' + r.steps.map((s) => "<div>· " + esc(s) + "</div>").join("") + "</div>";
    (r.memories || []).forEach((m) => { h += '<div class="scr-mem">📝 Remembered: ' + esc(m) + "</div>"; });
    if (r.approval) h += '<div class="scr-appr"><b>' + esc(r.approval.title) + '</b><pre>' + esc(r.approval.detail) + "</pre>" +
      '<button class="btn primary" data-appr="' + esc(r.approval.id) + '" data-ok="1">Approve</button> <button class="btn" data-appr="' + esc(r.approval.id) + '" data-ok="0">Decline</button></div>';
    if (live && r.status) h += '<div class="scr-status">' + esc(r.status) + "</div>";
    h += '<div class="scr-md">' + md(r.content || "", r.refs || []) + "</div>";
    if (r.sources && r.sources.length) h += '<details class="scr-src"><summary>' + r.sources.length + " emails used</summary>" +
      r.sources.map((s) => "<div>[" + s.n + "] " + esc(s.sender) + " — " + esc(s.subject) + "</div>").join("") + "</details>";
    if (r.error) h += '<div class="scr-err">' + esc(r.error) + "</div>";
    return h + "</div>";
  }

  function md(src, refs) {
    let t = esc(src);
    t = t.replace(/```[\w-]*\n([\s\S]*?)(```|$)/g, (m, c) => "<pre>" + c + "</pre>");
    t = t.replace(/`([^`\n]+)`/g, "<code>$1</code>").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|\W)\*([^*\n]+)\*(?=\W|$)/g, "$1<i>$2</i>");
    t = t.replace(/^#{1,4}\s+(.*)$/gm, "<b>$1</b>").replace(/^\s*[-*•]\s+(.*)$/gm, "• $1");
    refs.forEach((r, i) => { t = t.split(esc(r.text)).join('<a href="#" class="scr-ref" data-ref="' + i + '">' + esc(r.text) + "</a>"); });
    return t.split(/\n{2,}/).map((p) => p.startsWith("<pre>") ? p : "<p>" + p.replace(/\n/g, "<br>") + "</p>").join("");
  }

  function wire() {
    view.querySelectorAll("[data-tab]").forEach((b) => b.onclick = () => { tab = b.dataset.tab; render(); });
    view.querySelectorAll("[data-mode]").forEach((b) => b.onclick = () => request({ kind: "mode", mode: b.dataset.mode }, true));
    view.querySelector("#scrLock").onclick = lock;
    view.querySelector("#scrNew").onclick = async () => { if (current) return; data.conv[tab] = null; data.history[tab] = []; await saveVault(); render(); };
    const proj = view.querySelector("#scrProject");
    if (proj) proj.onchange = async () => { data.project = proj.value; data.conv.code = null; await saveVault(); };
    const w = view.querySelector("#scrWeb");
    if (w) w.onclick = () => { web = !web; w.classList.toggle("on", web); };
    const send = view.querySelector("#scrSend");
    if (send) send.onclick = () => {
      const text = val("scrText");
      if (!text) return;
      request({ kind: tab, text, conversation: data.conv[tab] || null, project: tab === "code" ? data.project || (S.projects || [])[0] : null, web });
      web = false;
    };
    const mic = view.querySelector("#scrMic");
    if (mic) mic.onclick = () => voice ? stopVoice() : startVoice();
    const stop = view.querySelector("#scrStop");
    if (stop) stop.onclick = () => { stop.disabled = true; postSealed("stop", { request: current.id }); };
    view.querySelector("#scrText").onkeydown = (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) view.querySelector("#scrSend") && view.querySelector("#scrSend").click(); };
    view.onclick = (e) => {
      const ap = e.target.closest("[data-appr]");
      if (ap) { ap.parentElement.querySelectorAll("button").forEach((b) => b.disabled = true); postSealed("approve", { id: ap.dataset.appr, ok: ap.dataset.ok === "1" }); }
      const ref = e.target.closest(".scr-ref");
      if (ref) {
        e.preventDefault();
        const turn = ref.closest("#scrLive") ? current.state : findReplyFor(ref);
        const r = turn && (turn.refs || [])[+ref.dataset.ref];
        if (r && window.LuminaNav) r.ccc ? window.LuminaNav.ccc(r.ccc) : window.LuminaNav.verse(r.book, r.c, r.v || 1);
      }
    };
  }
  function findReplyFor(el) {
    const replies = [...view.querySelectorAll(".scr-a")];
    const i = replies.indexOf(el.closest(".scr-a"));
    return ((data.history[tab] || [])[i] || {}).reply;
  }
  const val = (id) => (view.querySelector("#" + id) || {}).value?.trim() || "";

  /* ---------- speaking: the recording goes to the Mac in encrypted pieces, Whisper
     transcribes it there, and the text comes back as it forms ---------- */
  let voice = null;
  const blobToB64 = (blob) => blob.arrayBuffer().then((b) => b64(new Uint8Array(b)));

  async function startVoice() {
    const box = view.querySelector("#scrText"), mic = view.querySelector("#scrMic");
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) { return alert("Lumina couldn't use the microphone. Allow it in the browser's settings and try again."); }
    const mime = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || "";
    const rec = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 32000 });
    voice = { sid: Math.random().toString(36).slice(2, 10), seq: 0, rec, stream, before: box.value.trim(), since: new Date(Date.now() - 60000).toISOString(), done: false };
    const v = voice;
    mic.textContent = "■ Stop"; mic.classList.add("on");
    box.classList.add("scr-listening"); box.placeholder = "Listening… the words will appear here in a few seconds";
    rec.ondataavailable = async (ev) => {
      if (!ev.data.size) return;
      const seq = v.seq++, final = rec.state === "inactive";
      try { await postSealed("audio", { session: v.sid, seq, data: await blobToB64(ev.data), mime: rec.mimeType, final }); }
      catch (e) { box.placeholder = "Couldn't send the audio: " + e.message; }
    };
    rec.start(3000);
    touch();
    pollTranscript(v);
  }

  function stopVoice() {
    if (!voice) return;
    const mic = view.querySelector("#scrMic");
    if (mic) { mic.textContent = "… finishing"; mic.disabled = true; }
    voice.rec.stop();
    voice.stream.getTracks().forEach((t) => t.stop());
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
        const box = view && view.querySelector("#scrText");
        if (box && t.text) box.value = (v.before ? v.before + " " : "") + t.text;
        if (t.complete) {
          v.done = true;
          gh("DELETE", "/repos/" + S.repo + "/issues/comments/" + c.id).catch(() => {});
        }
      }
    }
    if (voice === v) voice = null;
    const box = view && view.querySelector("#scrText"), mic = view && view.querySelector("#scrMic");
    if (box) { box.classList.remove("scr-listening"); box.placeholder = "Message Scriptorium…"; box.focus(); }  // check it, edit, then Send
    if (mic) { mic.textContent = "🎙 Speak"; mic.disabled = false; mic.classList.remove("on"); }
  }

  /* ---------- talking to the Mac ---------- */
  async function hello() { request({ kind: "hello" }, true); }

  async function request(req, quiet) {
    if (current && !quiet) return;
    touch();
    const id = Math.random().toString(36).slice(2, 10);
    const since = new Date(Date.now() - 60000).toISOString();
    const job = { id, tab: req.kind === "hello" || req.kind === "mode" ? null : req.kind, text: req.text, state: { status: "Sent — waiting for your Mac…" }, quiet };
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
      if (!quiet && current === job) {
        const live = view && view.querySelector("#scrLive");
        if (live) { live.innerHTML = renderReply(job.state, true); const th = view.querySelector("#scrThread"); th.scrollTop = th.scrollHeight; }
      }
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
    if (st.done !== undefined) S.connected = true;
    if (job.tab) {
      if (st.conversation) data.conv[job.tab] = st.conversation;
      (data.history[job.tab] = data.history[job.tab] || []).push({ text: job.text, reply: st });
      data.history[job.tab] = data.history[job.tab].slice(-30);
      await saveVault();
    }
    if (current === job) current = null;
    if (view && document.body.contains(view) && view.querySelector(".scr-main")) renderMain();
  }

  /* ---------- look ---------- */
  function injectStyle() {
    if (document.getElementById("scrStyle")) return;
    const st = document.createElement("style"); st.id = "scrStyle";
    st.textContent = `
.scr{max-width:720px;margin:0 auto}
.scr label{display:block;margin:.7rem 0;font-weight:600;color:var(--ink-soft)}
.scr input,.scr select,.scr textarea{display:block;width:100%;box-sizing:border-box;margin-top:.3rem;padding:.55rem .7rem;border:1px solid var(--gold-line);border-radius:10px;background:var(--panel);color:var(--ink);font:inherit}
.scr-hint{color:var(--ink-faint);font-weight:400;font-size:.92em}
.scr-small{color:var(--ink-faint);font-size:.85em}
.scr-err{color:#b3261e}
.scr-lock{text-align:center;padding-top:2rem}
.scr-lock input{max-width:280px;margin:1rem auto}
.scr-seal{font-size:3rem;color:var(--gold)}
.scr-top,.scr-bar{display:flex;gap:.4rem;align-items:center;margin-bottom:.5rem;flex-wrap:wrap}
.scr-tabs{display:flex;gap:.3rem;flex:1}
.scr-bar{justify-content:space-between}
.scr-modes{display:flex;gap:.25rem}
.scr .btn.on{border-color:var(--gold-line);color:var(--gold);background:var(--panel2);font-weight:600}
.scr-thread{min-height:40vh;max-height:62vh;overflow-y:auto;padding:.5rem 0}
.scr-empty{text-align:center;margin-top:3rem}
.scr-u{margin:.8rem 0 .5rem auto;max-width:85%;width:fit-content;background:var(--panel2);border:1px solid var(--gold-line);border-radius:14px;padding:.5rem .8rem;white-space:pre-wrap}
.scr-a{margin:.3rem 0 1.2rem;line-height:1.6}
.scr-md p{margin:.4rem 0}
.scr-md pre{background:var(--panel);border:1px solid var(--gold-line);border-radius:8px;padding:.6rem;overflow-x:auto;font-size:.85em}
.scr-md code{background:var(--panel);border-radius:4px;padding:0 .2rem;font-size:.9em}
.scr-ref{color:var(--gold);text-decoration:underline dotted}
.scr-think,.scr-src{border:1px solid var(--gold-line);border-radius:10px;padding:.3rem .6rem;margin:.3rem 0;color:var(--ink-faint);font-size:.9em}
.scr-think div{white-space:pre-wrap;max-height:40vh;overflow-y:auto}
.scr-steps,.scr-status{color:var(--ink-faint);font-size:.88em;margin:.2rem 0}
.scr-mem{color:var(--gold);font-size:.88em}
.scr-appr{border:1px solid var(--gold);border-radius:10px;padding:.5rem;margin:.4rem 0}
.scr-appr pre{max-height:40vh;overflow:auto;font-size:.78em;white-space:pre}
.scr-compose{position:sticky;bottom:0;background:var(--bg);padding:.4rem 0}
.scr-sendrow{display:flex;justify-content:space-between;margin-top:.4rem}
.scr-listening{font-style:italic;color:var(--ink-soft)}
#scrMic.on{border-color:#b3261e;color:#b3261e}`;
    document.head.appendChild(st);
  }

  window.Scriptorium = { open, lock };
})();
