// The living world: the kingdom creates things to do on its own. Mission alerts pop up while she explores
// (missing puppy, treasure, apple picking, secret-agent co-op, family challenges). Missions put the learning
// inside the world: read a sign to learn which way the puppy went, count paw prints, order numbers on a lock.
'use strict';

const EVENT_TYPES = {
  puppy:    { title: '🚨 MISSION ALERT', text: 'A puppy has disappeared near the park! Follow the paw-print clues to find it.', accept: 'Find the puppy' },
  treasure: { title: '💰 TREASURE DETECTED', text: 'A treasure chest appeared somewhere in the kingdom! Follow the gold star on your map.', accept: 'Hunt for treasure' },
  apples:   { title: '🍎 APPLE PICKING', text: 'The apple trees are full! Pick the apples and count them for the baker.', accept: "Let's pick!" },
  agents:   { title: '🕵️ SECRET AGENTS NEEDED', text: 'Help escape the locked lab! You need a partner: one agent sees clues, the other presses buttons.', accept: 'Start the mission' },
  challenge:{ title: '🏟️ CHALLENGE AVAILABLE', text: '', accept: 'Play!' },
};

const World2 = {
  markers: [], active: null, timer: 25, alertOpen: false,

  reset() { this.markers = []; this.active = null; this.timer = 25; this.hideAlert(); },

  update(dt, t) {
    if (!Game.W) return;
    for (const m of this.markers) {
      m.group.rotation.y += dt * 1.5;
      m.label.position.y = 4 + Math.sin(t * 3) * 0.25;
      if (m.done) continue;
      const P = Game.player.pos;
      const dist = Math.hypot(P.x - m.x, P.z - m.z);
      if (m.wait) { if (dist > (m.r || 2) + 1.5) m.wait = false; continue; }      // closed with ✕: walk away and back to retry
      if (dist < (m.r || 2) && P.y < 3 && !UI.modalOpen && !document.querySelector('.reveal')) { m.done = true; m.onReach(m); }
    }
    if (this.active || this.alertOpen || UI.modalOpen || (typeof Arena !== 'undefined' && Arena.active) || (typeof Coop !== 'undefined' && Coop.active)) return;
    this.timer -= dt;
    if (this.timer <= 0) { this.timer = 70 + Math.random() * 60; this.spawnRandom(); }
  },

  spawnRandom() {
    const friendHere = [...Net.players.values()].find(p => p.p === Game.level);
    const pool = ['puppy', 'treasure', 'apples', 'agents'];
    if (friendHere) pool.push('challenge', 'challenge', 'agents');
    this.offer(pick(pool), friendHere);
  },

  // Show the alert banner. Accepting together invites the friend in the room.
  offer(type, friend, fromInvite) {
    const ev = EVENT_TYPES[type];
    let text = ev.text;
    if (type === 'challenge') { const f = friend || [...Net.players.values()][0]; if (!f) return; text = `${f.name} is nearby. Who wins? Pick a game: freeze tag or a math race!`; }
    const bar = $('alert-bar');
    const together = Net.connected && Net.players.size > 0;
    bar.innerHTML = `<div class="al-title">${ev.title}</div><div class="al-text">${esc(fromInvite ? `${fromInvite} invited you: ${text}` : text)}</div>
      ${type === 'challenge' ? `<button class="small-btn pink" data-al="tag">❄️ Freeze Tag</button><button class="small-btn purple" data-al="race">🔢 Math Race</button>`
        : `<button class="small-btn pink" data-al="go">${together && !fromInvite ? 'Accept together 🤝' : fromInvite ? 'Join! 🤝' : ev.accept}</button>`}
      <button class="small-btn gray" data-al="no">Later</button>`;
    bar.hidden = false; this.alertOpen = true;
    Sound.fanfare(); Voice.speak(ev.title.replace(/[^A-Za-z ]/g, '') + '. ' + text);
    bar.querySelectorAll('[data-al]').forEach(b => b.onclick = () => {
      const a = b.dataset.al; this.hideAlert();
      if (a === 'no') return;
      if (type === 'challenge') return Arena.invite(a === 'tag' ? 'tag' : 'race');
      if (type === 'agents') return Coop.start();
      const seed = Math.floor(Math.random() * 1e9);
      if (together && !fromInvite) Net.sendX('ev', { op: 'invite', type, seed, level: Game.level });
      this.start(type, seed, together || !!fromInvite);
    });
    clearTimeout(this.alertTO);
    this.alertTO = setTimeout(() => this.hideAlert(), 25000);
  },
  hideAlert() { const b = $('alert-bar'); if (b) b.hidden = true; this.alertOpen = false; },

  // ---------- markers ----------
  spot(rand, near, minD = 10, maxD = 40) {
    const W = Game.W;
    for (let i = 0; i < 80; i++) {
      const a = rand() * Math.PI * 2, d = minD + rand() * (maxD - minD);
      const x = (near ? near.x : 0) + Math.cos(a) * d, z = (near ? near.z : 0) + Math.sin(a) * d;
      if (Math.hypot(x, z) > W.S - 4) continue;
      if (Game.blocked(x, z, 0) || Game.groundAt(x, z, 0.5) > 0.1) continue;
      return { x, z };
    }
    return { x: (rand() - 0.5) * W.S, z: (rand() - 0.5) * W.S };
  },
  addMarker(x, z, emoji, onReach, opts = {}) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 7, 16, 1, true), new THREE.MeshBasicMaterial({ color: opts.color || 0xffd700, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
    beam.position.y = 3.5; g.add(beam);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.12, 8, 24), mat(opts.color || 0xffd700)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.1; g.add(ring);
    const label = makeLabel(emoji, { height: 1.5, bg: 'rgba(255,255,255,0)', depthTest: false }); label.position.y = 4; label.renderOrder = 9;
    const holder = new THREE.Group(); holder.position.set(x, 0, z); holder.add(label);
    Game.W.root.add(g); Game.W.root.add(holder);
    const m = { x, z, group: g, holder, label, onReach, r: opts.r || 2, kind: opts.kind || 'goal' };
    this.markers.push(m);
    return m;
  },
  removeMarker(m) { Game.W.root.remove(m.group); Game.W.root.remove(m.holder); this.markers = this.markers.filter(x => x !== m); },
  clear() { [...this.markers].forEach(m => this.removeMarker(m)); },

  // ---------- missions ----------
  start(type, seed, together) {
    this.clear();
    const rand = mulberry32(seed);
    this.anchor = together ? { x: Game.W.spawn.x, z: Game.W.spawn.z } : { x: Game.player.pos.x, z: Game.player.pos.z };
    this.active = { type, seed, together, step: 0 };
    this['start_' + type](rand);
    Learn.countActivity('mission');
  },
  finish(text, size = 'big') {
    const a = this.active; this.active = null; this.clear();
    Rewards.celebrate(size);
    Daily.progress('adventure');
    if (a && a.together) { Family.record('coop', text); Net.sendX('ev', { op: 'done', type: a.type, seed: a.seed }); }
    Game.updateObjectives();
  },
  // Embedded learning stop: an activity framed as part of the story.
  learnStop(frame, domains, then, skill) {
    const it = Learn.activity(skill || null, domains);
    Present.run(it, { title: frame.title, frame: `<div class="story-frame">${frame.text}</div>`, onDone: (r) => { if (r.cancelled) return then(false, true); UI.close(); then(r.correct || (r.partial || 0) >= 0.75); } });
  },

  // Missing puppy: three clue stops, each a learning task, then the puppy.
  start_puppy(rand) {
    const stops = [
      { e: '🪧', title: '🐾 Clue 1: The sign', text: 'There is a sign next to the paw prints. Read it to find out which way the puppy went!', dom: ['comprehension', 'sightwords', 'phonics', 'vocabulary'] },
      { e: '🐾', title: '🐾 Clue 2: Paw prints', text: 'Lots of paw prints! Solve this to follow the trail.', dom: ['numbers', 'addition', 'subtraction', 'measurement'] },
      { e: '🧑‍🌾', title: '🐾 Clue 3: Ask a neighbor', text: 'A neighbor saw something! Help with their question and they will tell you where the puppy went.', dom: ['science', 'social', 'shapes'] },
    ];
    let prev = this.anchor;
    const next = (i) => {
      if (i >= stops.length) {
        const sp = this.spot(rand, prev, 8, 18);
        this.addMarker(sp.x, sp.z, '🐶', () => {
          Sound.fanfare();
          UI.open(`<h2>🐶 You found the puppy!</h2><div class="result-big">🐶💖</div><p class="affirm">The puppy is so happy to be found! You are a great detective!</p>
            <div class="row-btns"><button class="big-btn pink" id="pp-ok">Hooray!</button></div>`);
          Voice.speak('You found the puppy! You are a great detective!');
          $('pp-ok').onclick = () => { UI.close(); this.finish('Found the missing puppy'); Rewards.mysteryBox('common'); };
        }, { color: 0xff69b4 });
        UI.toast('🐶 Woof! The puppy is close - look for the pink light!');
        return;
      }
      const s = stops[i], sp = this.spot(rand, prev, 10, 26); prev = sp;
      this.addMarker(sp.x, sp.z, s.e, (m) => {
        this.learnStop(s, s.dom, (ok, cancelled) => {
          if (cancelled) { m.done = false; m.wait = true; return; }
          if (!ok) { UI.toast('🔍 The clue is tricky - step away and come back to try another one!'); m.done = false; m.wait = true; return; }
          this.removeMarker(m); this.active.step = i + 1;
          if (this.active.together) Net.sendX('ev', { op: 'step', step: i + 1 });
          UI.toast(`🐾 Clue ${i + 1} solved! Follow the trail...`); next(i + 1);
        });
      });
      if (i === 0) UI.toast('🐾 Follow the gold light to the first clue!');
    };
    this.puppyNext = next;
    next(0);
  },

  // Treasure: far away chest with a number lock.
  start_treasure(rand) {
    const sp = this.spot(rand, null, 20, Game.W.S * 0.8);
    this.addMarker(sp.x, sp.z, '💰', (m) => {
      const it = Learn.activity(Math.random() < 0.6 ? 'number_order' : 'missing_number');
      Present.run(it, {
        title: '💰 The number lock', frame: '<div class="story-frame">The chest has a number lock! Solve it to open the treasure.</div>',
        onDone: (r) => {
          if (r.cancelled) { m.done = false; m.wait = true; return; }
          UI.close();
          if (!(r.correct || (r.partial || 0) >= 0.75)) { UI.toast('🔒 The lock clicked but stayed shut - step back and try again!'); m.done = false; m.wait = true; return; }
          const c = Save.addCoins(15 + Math.random() * 15, 'treasure');
          UI.open(`<h2>💰 Treasure!</h2><div class="result-big">💎🪙👑</div><p class="center" style="font-size:22px">🪙 +${c}</p><div class="row-btns"><button class="big-btn pink" id="tr-ok">Yay!</button></div>`);
          $('tr-ok').onclick = () => { UI.close(); this.finish('Opened a treasure chest', 'medium'); if (Math.random() < 0.35) Rewards.mysteryBox('rare'); };
        },
      });
    }, { r: 2.2 });
    UI.toast('💰 Find the gold star on your map!');
  },

  // Apple picking: collect N apples, then count them.
  start_apples(rand) {
    const lv = Learn.levelFor('counting');
    const n = [5, 8, 12, 15, 18][lv - 1];
    const center = this.spot(rand, this.anchor, 8, 20);
    let got = 0;
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2, d = 2 + rand() * 9;
      const x = center.x + Math.cos(a) * d, z = center.z + Math.sin(a) * d;
      this.addMarker(x, z, '🍎', (m) => {
        this.removeMarker(m); got++; Sound.gem();
        if (got < n) return;
        // Count the basket: a real counting observation.
        const it = makeActivity('counting', lv);
        Object.assign(it, { type: 'count', prompt: `How many apples did you pick? Tap each one to count!`, emoji: '🍎', n, choices: numberChoices(n), answer: String(n), key: 'apples' + n });
        Present.run(it, { title: '🍎 Count your basket', frame: '<div class="story-frame">The baker needs to know how many apples you picked!</div>', onDone: (r) => {
          UI.close();
          const c = Save.addCoins(8 + n, 'apples');
          UI.toast(r.correct ? `🥧 The baker made an apple pie! 🪙 +${c}` : `🥧 Thanks for picking! 🪙 +${c}`);
          this.finish('Picked apples for the baker', 'medium');
        } });
      }, { r: 1.4, color: 0xff4d4d });
    }
    UI.toast(`🍎 Pick all the apples! Follow the red lights.`);
  },
};

// A friend accepted / progressed a shared mission.
Net.on('ev', (from, d) => {
  if (!d || typeof d !== 'object') return;
  const pl = Net.players.get(from), name = pl ? pl.name : 'Your friend';
  if (d.op === 'invite' && EVENT_TYPES[d.type] && Number.isFinite(d.seed)) {
    if (!Game.running || Game.level !== d.level) { UI.toast(`🤝 ${name} started a mission on Level ${d.level} - tap Go to join!`); return; }
    World2.pendingSeed = d.seed;
    const bar = $('alert-bar');
    World2.offer(d.type, null, name);
    // joining uses the same seed so the clues are in the same places for both players
    bar.querySelectorAll('[data-al="go"]').forEach(b => b.onclick = () => { World2.hideAlert(); World2.start(d.type, d.seed, true); });
  } else if (d.op === 'step' && World2.active && World2.active.type === 'puppy' && d.step > World2.active.step) {
    // the partner solved a clue: move both players along the trail
    const m = World2.markers.find(x => !x.done); if (m) World2.removeMarker(m);
    World2.active.step = d.step; UI.toast(`🐾 ${name} solved a clue!`); World2.puppyNext(d.step);
  } else if (d.op === 'done' && World2.active && World2.active.seed === d.seed) {
    UI.toast(`🎉 ${name} finished the mission!`); World2.finish('Mission complete together', 'medium');
  }
});
