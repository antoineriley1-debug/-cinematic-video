// Private family voice chat over the same private room (WebRTC audio via PeerJS calls).
// Off on a child's device until a parent turns it on in the PIN-locked settings. Only people in the private
// room (who were given the room code) can ever be heard. Open mic, push-to-talk, mute, per-person volume,
// and a speaking indicator. A visible LIVE badge shows whenever her microphone is sending.
'use strict';

const VoiceChat = {
  stream: null, mode: 'open', calls: new Map(), ready: new Set(), announced: new Set(), vol: {}, ctx: null,

  allowed() { return Profile.isParent() || Save.parent.voiceChat === 'family'; },
  get on() { return !!this.stream; },

  refreshButton() {
    const show = Net.connected && this.allowed();
    $('btn-voice').hidden = !show;
    $('btn-voice').classList.toggle('live', this.on && this.mode !== 'muted' && this.track() && this.track().enabled);
    $('btn-ptt').hidden = !(this.on && this.mode === 'ptt');
    if (!Net.connected && this.on) this.stop();
  },
  track() { return this.stream && this.stream.getAudioTracks()[0]; },

  async start() {
    if (this.on) return;
    if (!this.allowed()) { UI.toast('🔒 Ask a grown-up to turn on voice chat in Parents → Settings'); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { UI.toast('Voice chat is not supported on this browser'); return; }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (e) { UI.toast('🎙️ Microphone permission was not given'); return; }
    try { this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)(); if (this.ctx.state === 'suspended') await this.ctx.resume(); } catch (e) { this.ctx = null; }
    this.localAnalyser = this.analyser(this.stream);
    this.setMode(this.mode);
    this.hookPeer();
    this.announced.clear();
    Net.sendX('voice', { op: 'ready' });
    for (const id of this.ready) this.maybeCall(id);
    this.meter = setInterval(() => this.levels(), 150);
    UI.toast('🎙️ Voice chat is on');
    this.refreshButton();
  },
  stop() {
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    this.stream = null; clearInterval(this.meter);
    for (const c of this.calls.values()) { try { c.call.close(); } catch (e) {} if (c.el) c.el.remove(); }
    this.calls.clear(); this.ready.clear(); this.announced.clear();
    if (Net.connected) Net.sendX('voice', { op: 'off' });
    this.refreshButton();
  },
  setMode(m) {
    this.mode = m;
    const t = this.track(); if (t) t.enabled = m === 'open';
    this.refreshButton();
  },
  // push-to-talk: hold the button
  talk(down) { if (this.mode !== 'ptt') return; const t = this.track(); if (t) t.enabled = down; this.refreshButton(); },

  hookPeer() {
    const peer = Net.peer; if (!peer || peer._voiceHooked) return;
    peer._voiceHooked = true;
    peer.on('call', (call) => {
      if (!this.stream || !Net.players.has(call.peer)) { try { call.close(); } catch (e) {} return; }   // only people in this private room
      call.answer(this.stream);
      this.attach(call);
    });
  },
  // the lower peer id places the call so each pair connects exactly once
  maybeCall(id) {
    if (!this.stream || this.calls.has(id) || !Net.players.has(id)) return;
    if (Net.myId < id) { const call = Net.peer.call(id, this.stream); if (call) this.attach(call); }
  },
  attach(call) {
    const entry = { call, el: null, gain: null, an: null, speaking: false };
    this.calls.set(call.peer, entry);
    call.on('stream', (remote) => {
      if (entry.el) return;
      const el = document.createElement('audio'); el.autoplay = true; el.setAttribute('playsinline', ''); el.srcObject = remote; document.body.appendChild(el); entry.el = el;
      if (this.ctx) {
        try {
          // route through Web Audio so each person gets their own volume (iPad ignores element volume)
          const src = this.ctx.createMediaStreamSource(remote); const g = this.ctx.createGain(); g.gain.value = this.vol[call.peer] != null ? this.vol[call.peer] : 1;
          src.connect(g); g.connect(this.ctx.destination); entry.gain = g; el.muted = true;
          entry.an = this.analyserFrom(src);
        } catch (e) { entry.gain = null; el.muted = false; }
      }
      el.play().catch(() => {});
    });
    call.on('close', () => { if (entry.el) entry.el.remove(); this.calls.delete(call.peer); });
    call.on('error', () => { if (entry.el) entry.el.remove(); this.calls.delete(call.peer); });
  },
  setVolume(id, v) {
    this.vol[id] = v;
    const c = this.calls.get(id); if (!c) return;
    if (c.gain) c.gain.gain.value = v; else if (c.el) c.el.volume = Math.min(1, v);
  },
  analyser(stream) { if (!this.ctx) return null; try { return this.analyserFrom(this.ctx.createMediaStreamSource(stream)); } catch (e) { return null; } },
  analyserFrom(src) { const an = this.ctx.createAnalyser(); an.fftSize = 512; src.connect(an); return an; },
  rms(an) { if (!an) return 0; const d = new Uint8Array(an.fftSize); an.getByteTimeDomainData(d); let s = 0; for (const v of d) { const x = (v - 128) / 128; s += x * x; } return Math.sqrt(s / d.length); },
  // speaking indicators for me and each person
  levels() {
    const t = this.track();
    const meTalking = t && t.enabled && this.rms(this.localAnalyser) > 0.04;
    $('btn-voice').classList.toggle('speaking', !!meTalking);
    for (const [id, c] of this.calls) {
      const talking = this.rms(c.an) > 0.04;
      if (talking !== c.speaking) { c.speaking = talking; Game.setSpeaking(id, talking); UI.renderFriendsBar(); }
    }
  },
  isSpeaking(id) { const c = this.calls.get(id); return !!(c && c.speaking); },

  panel() {
    if (!this.allowed()) { UI.open(`<h2>🎙️ Voice chat</h2><p class="center" style="font-size:20px">🔒 Voice chat is turned off. A grown-up can turn it on in Parents → ⚙️ Settings.</p>`); return; }
    const pls = [...Net.players.values()];
    UI.open(`<h2>🎙️ Family voice chat</h2>
      <p class="center muted">Only people in your private room can hear you.</p>
      ${!this.on ? '<div class="row-btns"><button class="big-btn pink" id="vc-start">🎙️ Turn on voice</button></div>' : `
      <div class="row-btns">${[['open', '🎙️ Open mic'], ['ptt', '👆 Push to talk'], ['muted', '🔇 Mute']].map(([k, n]) => `<button class="mid-btn ${this.mode === k ? 'on' : ''}" data-vm="${k}">${n}</button>`).join('')}</div>
      <h3>Volume</h3><div class="list">${pls.map(p => `<div class="list-row"><b style="flex:1">${this.isSpeaking(p.id) ? '🗣️' : '⭐'} ${esc(p.name)}</b><input type="range" min="0" max="1.5" step="0.1" value="${this.vol[p.id] != null ? this.vol[p.id] : 1}" data-vol="${esc(p.id)}" style="width:50%">${this.calls.has(p.id) ? '<span class="muted">connected</span>' : '<span class="muted">waiting…</span>'}</div>`).join('') || '<p class="muted">Nobody else is in the room yet.</p>'}</div>
      <div class="row-btns"><button class="mid-btn" id="vc-stop">Turn voice off</button></div>`}`);
    if ($('vc-start')) $('vc-start').onclick = async () => { await this.start(); this.panel(); };
    document.querySelectorAll('[data-vm]').forEach(b => b.onclick = () => { this.setMode(b.dataset.vm); this.panel(); });
    document.querySelectorAll('[data-vol]').forEach(r => r.oninput = () => this.setVolume(r.dataset.vol, +r.value));
    if ($('vc-stop')) $('vc-stop').onclick = () => { this.stop(); this.panel(); };
  },
};

Net.on('voice', (from, d) => {
  if (!d) return;
  if (d.op === 'ready') {
    VoiceChat.ready.add(from);
    // answer the announcement once so late joiners connect too
    if (VoiceChat.on && !VoiceChat.announced.has(from)) { VoiceChat.announced.add(from); Net.sendX('voice', { op: 'ready' }, from); }
    VoiceChat.maybeCall(from);
  } else if (d.op === 'off') {
    VoiceChat.ready.delete(from);
    const c = VoiceChat.calls.get(from); if (c) { try { c.call.close(); } catch (e) {} if (c.el) c.el.remove(); VoiceChat.calls.delete(from); }
  }
});

$('btn-voice').onclick = () => { Sound.unlock(); VoiceChat.panel(); };
$('btn-ptt').addEventListener('pointerdown', (e) => { e.preventDefault(); VoiceChat.talk(true); });
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => $('btn-ptt').addEventListener(ev, () => VoiceChat.talk(false)));
