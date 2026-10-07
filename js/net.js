// Play with real friends: private rooms over WebRTC (PeerJS). One player hosts a room and shares
// the room code; friends join with it. The host relays positions and chat to everyone.
'use strict';

const ROOM_PREFIX = 'pkq-room-';
const ROOM_MAX = 6;
const CODE_LETTERS = 'BCDFGHJKMNPQRSTVWXZ';   // no vowels, so codes never spell words

function cleanName(n) { return String(n || '').replace(/[^A-Za-z ]/g, '').trim().slice(0, 12) || 'Princess'; }
// Only accept style ids the game knows about.
function pickId(slot, v) { return WARDROBE[slot].items.some(it => it[0] === v) ? v : WARDROBE[slot].items[0][0]; }
function cleanLook(l) {
  const num = (v, d) => (Number.isInteger(v) && v >= 0 && v <= 0xffffff ? v : d);
  l = l || {};
  const sh = l.shoes || {};
  return {
    hair: num(l.hair, 0x5a2d1a), dress: num(l.dress, 0xff69b4), skin: num(l.skin, 0xffe0bd),
    hairStyle: HAIR_STYLES.some(s => s[0] === l.hairStyle) ? l.hairStyle : 'pony',
    eyeColor: num(l.eyeColor, 0x4a2a1a),
    eyes: pickId('eyes', l.eyes), nose: pickId('nose', l.nose), mouth: pickId('mouth', l.mouth),
    cheeks: pickId('cheeks', l.cheeks), outfit: pickId('outfit', l.outfit), headwear: pickId('headwear', l.headwear),
    shoes: { base: num(sh.base, 0xffffff), laces: num(sh.laces, 0xff69b4), sole: num(sh.sole, 0xff69b4) },
  };
}
const numOr = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);

const Net = {
  peer: null, isHost: false, code: '', myId: '', status: 'off',   // off | connecting | hosting | joined
  conns: new Map(),          // host: peerId -> DataConnection
  hostConn: null,            // client: connection to host
  players: new Map(),        // id -> { id, name, look, p, x, y, z, f, m }
  chatLog: [],

  peerOptions() {
    const q = new URLSearchParams(location.search), o = { debug: 0 };
    if (q.get('peerhost')) { o.host = q.get('peerhost'); o.port = +(q.get('peerport') || 443); o.path = q.get('peerpath') || '/'; o.secure = q.get('peersecure') !== '0'; }
    return o;
  },
  get connected() { return this.status === 'hosting' || this.status === 'joined'; },
  me() { return { name: cleanName(Save.data.nickname), look: cleanLook(Save.data.look) }; },

  host() {
    if (this.peer) this.leave(true);
    this.code = Array.from({ length: 5 }, () => CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)]).join('');
    this.status = 'connecting'; this.isHost = true; this.changed();
    const peer = this.peer = new Peer(ROOM_PREFIX + this.code, this.peerOptions());
    peer.on('open', (id) => { this.myId = id; this.status = 'hosting'; this.changed(); UI.toast(`🏰 Room ${this.code} is open!`); });
    peer.on('connection', (c) => this.hostAccept(c));
    peer.on('error', (e) => {
      if (e.type === 'unavailable-id') return this.host();        // code taken - pick another
      this.fail(e);
    });
    peer.on('disconnected', () => { if (this.peer === peer && !peer.destroyed) peer.reconnect(); });
  },

  join(code) {
    code = String(code || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (code.length !== 5) { UI.toast('Room codes have 5 letters'); return; }
    if (this.peer) this.leave(true);
    this.code = code; this.isHost = false; this.status = 'connecting'; this.changed();
    const peer = this.peer = new Peer(this.peerOptions());
    peer.on('open', (id) => {
      this.myId = id;
      const c = this.hostConn = peer.connect(ROOM_PREFIX + code, { reliable: true });
      c.on('open', () => { this.status = 'joined'; this.changed(); c.send(Object.assign({ t: 'hello' }, this.me())); UI.toast(`🎉 You joined room ${code}!`); });
      c.on('data', (d) => this.clientHandle(d));
      c.on('close', () => { if (this.peer === peer) { UI.toast('👋 The room closed'); this.leave(true); } });
    });
    peer.on('error', (e) => this.fail(e));
  },

  fail(e) {
    const msg = e && e.type === 'peer-unavailable' ? 'Could not find that room. Check the code!'
      : e && (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error') ? 'Could not reach the internet. Try again!'
        : 'Connection problem. Try again!';
    UI.toast('😕 ' + msg);
    this.leave(true);
  },

  leave(quiet) {
    try { if (this.peer) this.peer.destroy(); } catch (e) { /* already gone */ }
    this.peer = null; this.hostConn = null; this.conns.clear(); this.players.clear();
    this.status = 'off'; this.isHost = false; this.code = '';
    if (!quiet) UI.toast('You left the room');
    this.changed();
  },

  // ---------- host side ----------
  hostAccept(c) {
    c.on('data', (d) => this.hostHandle(c, d));
    c.on('close', () => {
      this.conns.delete(c.peer);
      const pl = this.players.get(c.peer);
      if (pl) { this.players.delete(c.peer); this.broadcast({ t: 'leave', id: c.peer }); UI.toast(`👋 ${pl.name} left`); this.changed(); }
    });
  },
  hostHandle(c, d) {
    if (!d || typeof d !== 'object') return;
    if (d.t === 'hello') {
      if (this.conns.size >= ROOM_MAX - 1) { c.send({ t: 'full' }); setTimeout(() => c.close(), 300); return; }
      this.conns.set(c.peer, c);
      const pl = { id: c.peer, name: cleanName(d.name), look: cleanLook(d.look), p: 0, x: 0, y: 0, z: 0, f: 0, m: 0 };
      this.players.set(c.peer, pl);
      const roster = [Object.assign({ id: this.myId }, this.me(), this.lastState || {})].concat([...this.players.values()].filter(p => p.id !== c.peer));
      c.send({ t: 'roster', players: roster });
      this.broadcast({ t: 'join', id: pl.id, name: pl.name, look: pl.look }, c.peer);
      UI.toast(`🎉 ${pl.name} joined!`); Sound.right();
      this.changed();
    } else if (!this.conns.has(c.peer)) {
      return;
    } else if (d.t === 's') {
      const st = this.applyState(c.peer, d);
      if (st) this.broadcast(Object.assign({ t: 's', id: c.peer }, st), c.peer);
    } else if (d.t === 'chat') {
      const text = cleanChat(d.text); if (!text) return;
      const pl = this.players.get(c.peer);
      this.broadcast({ t: 'chat', id: c.peer, name: pl ? pl.name : 'Friend', text }, c.peer);
      this.gotChat(c.peer, pl ? pl.name : 'Friend', text);
    } else if (d.t === 'look') {
      const pl = this.players.get(c.peer); if (!pl) return;
      pl.look = cleanLook(d.look);
      this.broadcast({ t: 'look', id: c.peer, look: pl.look }, c.peer);
      Game.remoteLookChanged(c.peer);
    }
  },
  broadcast(msg, except) {
    for (const [id, c] of this.conns) if (id !== except && c.open) { try { c.send(msg); } catch (e) { /* dropped */ } }
  },

  // ---------- client side ----------
  clientHandle(d) {
    if (!d || typeof d !== 'object') return;
    if (d.t === 'roster') {
      this.players.clear();
      (d.players || []).slice(0, ROOM_MAX).forEach(p => { if (p.id !== this.myId) { this.players.set(p.id, { id: p.id, name: cleanName(p.name), look: cleanLook(p.look), p: 0, x: 0, y: 0, z: 0, f: 0, m: 0 }); this.applyState(p.id, p); } });
      this.changed();
    } else if (d.t === 'join') {
      if (d.id === this.myId) return;
      this.players.set(d.id, { id: d.id, name: cleanName(d.name), look: cleanLook(d.look), p: 0, x: 0, y: 0, z: 0, f: 0, m: 0 });
      UI.toast(`🎉 ${cleanName(d.name)} joined!`); this.changed();
    } else if (d.t === 'leave') {
      const pl = this.players.get(d.id);
      if (pl) { this.players.delete(d.id); UI.toast(`👋 ${pl.name} left`); this.changed(); }
    } else if (d.t === 's') {
      this.applyState(d.id, d);
    } else if (d.t === 'chat') {
      const text = cleanChat(d.text); if (text) this.gotChat(d.id, cleanName(d.name), text);
    } else if (d.t === 'look') {
      const pl = this.players.get(d.id); if (pl) { pl.look = cleanLook(d.look); Game.remoteLookChanged(d.id); }
    } else if (d.t === 'full') {
      UI.toast('😕 That room is full (6 players max)'); this.leave(true);
    }
  },

  applyState(id, d) {
    const pl = this.players.get(id); if (!pl) return null;
    const st = { p: Math.max(0, Math.min(TOTAL_LEVELS, Math.round(numOr(d.p, 0)))), x: numOr(d.x, 0), y: numOr(d.y, 0), z: numOr(d.z, 0), f: numOr(d.f, 0), m: d.m ? 1 : 0 };
    const placeChanged = pl.p !== st.p;
    Object.assign(pl, st);
    if (placeChanged) this.changed();
    return st;
  },

  // ---------- sending ----------
  sendState(st) {
    if (!this.connected) return;
    this.lastState = st;
    if (this.isHost) this.broadcast(Object.assign({ t: 's', id: this.myId }, st));
    else if (this.hostConn && this.hostConn.open) this.hostConn.send(Object.assign({ t: 's' }, st));
  },
  sendLook() {
    if (!this.connected) return;
    const look = cleanLook(Save.data.look);
    if (this.isHost) this.broadcast({ t: 'look', id: this.myId, look });
    else if (this.hostConn && this.hostConn.open) this.hostConn.send({ t: 'look', look });
  },
  chat(text) {
    text = cleanChat(text);
    if (!text || !this.connected) return;
    const name = this.me().name;
    if (this.isHost) this.broadcast({ t: 'chat', id: this.myId, name, text });
    else if (this.hostConn && this.hostConn.open) this.hostConn.send({ t: 'chat', text });
    this.gotChat(this.myId, name, text);
  },
  gotChat(id, name, text) {
    this.chatLog.push({ id, name, text, mine: id === this.myId });
    if (this.chatLog.length > 30) this.chatLog.shift();
    Game.showChatBubble(id === this.myId ? 'me' : id, text);
    UI.renderChatLog();
    if (id !== this.myId) Sound.tap();
  },

  changed() { if (typeof UI !== 'undefined') UI.netChanged(); },
};
