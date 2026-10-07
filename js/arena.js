// Family challenges: Freeze Tag (teams of players + AI teammates, host runs the bots) and Math Race
// (head-to-head first-grade race). Both work solo against AI. Competition stays playful: grown-ups get a
// handicap in the race and results never shame anyone.
'use strict';

const TEAM = { pink: { name: 'Team Pink', icon: '🩷', dress: 0xff4fa3 }, blue: { name: 'Team Blue', icon: '💙', dress: 0x48a8ff } };
const BOT_NAMES = ['Lily', 'Aria', 'Rosie', 'Zara', 'Luna', 'Ivy', 'Nora', 'Ella'];

const Arena = {
  active: null,
  invite(kind) {
    const partner = [...Net.players.values()].find(p => p.p === Game.level);
    if (partner) { Net.sendX('arena', { op: 'invite', kind, level: Game.level }); UI.toast(`📨 Invited ${partner.name}! Waiting for them to join...`); this.pending = { kind, partner: partner.id }; }
    else (kind === 'tag' ? Tag : Race).start(null);
  },
  menu() {
    UI.open(`<h2>🏟️ Challenges</h2><p class="center">Play with a family member in the same level, or against AI friends!</p>
      <div class="shop-menu"><button class="shop-btn pink" id="ar-tag">❄️ Freeze Tag<small>Tag the other team · touch frozen teammates to free them</small></button>
      <button class="shop-btn purple" id="ar-race">🔢 Math Race<small>First to the finish line wins</small></button>
      <button class="shop-btn green" id="ar-agents">🕵️ Secret Agents (co-op)<small>Escape the lab together</small></button></div>`);
    $('ar-tag').onclick = () => { UI.close(); this.invite('tag'); };
    $('ar-race').onclick = () => { UI.close(); this.invite('race'); };
    $('ar-agents').onclick = () => { UI.close(); Coop.start(); };
  },
};

// ================= FREEZE TAG =================
const Tag = {
  // host side: build teams, run bots. partnerId = the other human (or null for solo)
  start(partnerId) {
    const me = Net.myId || 'me';
    const partner = partnerId ? Net.players.get(partnerId) : null;
    const myTeam = 'pink', otherTeam = 'blue';
    // the child's side is pink; with a partner, each human leads a team of AI friends
    const humans = [{ id: me, team: partner && Profile.isParent() ? otherTeam : myTeam, name: Profile.name() }];
    if (partner) humans.push({ id: partner.id, team: humans[0].team === 'pink' ? 'blue' : 'pink', name: partner.name });
    const bots = [];
    const names = shuffle(BOT_NAMES);
    const per = 3;
    for (const t of ['pink', 'blue']) {
      const have = humans.filter(h => h.team === t).length;
      for (let i = 0; i < per - have; i++) bots.push({ id: 'b' + bots.length, team: t, name: names[bots.length], x: 0, z: 0, f: 0, frozen: false, cool: 0, rescue: 0, flee: Math.random() < 0.5 });
    }
    const P = Game.player.pos;
    bots.forEach((b, i) => { const a = (i / bots.length) * Math.PI * 2; const sp = World2.spot(Math.random, P, 6, 16); b.x = sp.x; b.z = sp.z; b.f = a; });
    const st = { host: true, humans, bots, frozenH: {}, time: 150, me };
    if (partner) Net.sendX('arena', { op: 'tagstart', humans, bots: bots.map(b => ({ id: b.id, team: b.team, name: b.name })) }, partner.id);
    this.begin(st);
  },
  begin(st) {
    this.st = st; Arena.active = 'tag';
    st.bots.forEach(b => { b.mesh = makePrincess({ dress: TEAM[b.team].dress, hair: HAIR[(b.name.length * 3) % HAIR.length], skin: SKIN[b.name.length % SKIN.length], hairStyle: 'pony' }); b.label = makeLabel(`${TEAM[b.team].icon} ${b.name}`, { height: 0.5, color: '#5a2346' }); b.label.position.y = 2.75; b.mesh.add(b.label); Game.W.root.add(b.mesh); });
    $('tag-hud').hidden = false; $('btn-tag').hidden = false;
    const mine = st.humans.find(h => h.id === st.me);
    UI.toast(`❄️ Freeze Tag! You are on ${TEAM[mine.team].name} ${TEAM[mine.team].icon}`);
    Voice.speak(`Freeze tag! You are on ${TEAM[mine.team].name}. Tap TAG when you are close to the other team. Touch frozen teammates to free them!`);
    $('btn-tag').onclick = () => this.tryTag();
  },
  myTeam() { return this.st.humans.find(h => h.id === this.st.me).team; },
  isFrozenMe() { return !!(this.st && this.st.frozenH[this.st.me]); },
  // everyone's position (bots + humans)
  everyone() {
    const st = this.st, out = [];
    st.humans.forEach(h => {
      if (h.id === st.me) out.push({ id: h.id, team: h.team, human: true, x: Game.player.pos.x, z: Game.player.pos.z, frozen: !!st.frozenH[h.id] });
      else { const pl = Net.players.get(h.id); if (pl) out.push({ id: h.id, team: h.team, human: true, x: pl.x, z: pl.z, frozen: !!st.frozenH[h.id] }); }
    });
    st.bots.forEach(b => out.push({ id: b.id, team: b.team, bot: b, x: b.x, z: b.z, frozen: b.frozen }));
    return out;
  },
  setFrozen(id, v) { const st = this.st; const b = st.bots.find(x => x.id === id); if (b) b.frozen = v; else st.frozenH[id] = v; },
  tryTag() {
    const st = this.st; if (!st || this.isFrozenMe()) return;
    const P = Game.player.pos, mt = this.myTeam();
    const target = this.everyone().filter(e => e.team !== mt && !e.frozen).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0];
    if (!target || Math.hypot(target.x - P.x, target.z - P.z) > 2.4) { UI.toast('Get closer to tag!'); return; }
    if (st.host) this.applyTag(st.me, target.id); else Net.sendX('arena', { op: 'tag', target: target.id });
  },
  applyTag(by, id) {
    const st = this.st; if (!st) return;
    const all = this.everyone(), a = all.find(e => e.id === by), b = all.find(e => e.id === id);
    if (!a || !b || a.team === b.team || b.frozen || a.frozen || Math.hypot(a.x - b.x, a.z - b.z) > 2.6) return;
    this.setFrozen(id, true); Sound.tap();
    if (b.human) UI.toast(id === st.me ? '🥶 You got frozen! A teammate can free you!' : `❄️ You froze ${st.humans.find(h => h.id === id).name}!`);
  },
  update(dt, t) {
    const st = this.st; if (!st) return;
    if (st.host) {
      st.time -= dt;
      const all = this.everyone();
      for (const b of st.bots) {
        b.cool -= dt;
        if (b.frozen) continue;
        const enemies = all.filter(e => e.team !== b.team && !e.frozen), frozenMates = all.filter(e => e.team === b.team && e.frozen);
        const near = (list) => list.sort((p, q) => Math.hypot(p.x - b.x, p.z - b.z) - Math.hypot(q.x - b.x, q.z - b.z))[0];
        let tgt = null, flee = false;
        const threat = near(enemies.slice());
        if (frozenMates.length && (b.rescue > 0 || Math.random() < dt * 0.6)) { tgt = near(frozenMates.slice()); b.rescue = 3; }
        else if (b.flee && threat && Math.hypot(threat.x - b.x, threat.z - b.z) < 4.5) { tgt = threat; flee = true; }
        else tgt = threat;
        b.rescue -= dt;
        if (tgt) {
          let dx = tgt.x - b.x, dz = tgt.z - b.z; const d = Math.hypot(dx, dz) || 1;
          if (flee) { dx = -dx; dz = -dz; }
          const sp = 5.4 * dt;
          const nx = b.x + dx / d * sp, nz = b.z + dz / d * sp;
          if (!Game.blocked(nx, b.z, 0) && Math.hypot(nx, b.z) < Game.W.S - 2) b.x = nx;
          if (!Game.blocked(b.x, nz, 0) && Math.hypot(b.x, nz) < Game.W.S - 2) b.z = nz;
          b.f = Math.atan2(dx, dz); b.walk = (b.walk || 0) + dt * 10;
          if (!flee && d < 1.5 && b.cool <= 0) {
            if (tgt.team !== b.team) { b.cool = 1.2; this.applyTag(b.id, tgt.id); }
          }
        }
      }
      // rescues: standing next to a frozen teammate frees them
      for (const f of all.filter(e => e.frozen)) {
        const helper = all.find(e => e.team === f.team && !e.frozen && e.id !== f.id && Math.hypot(e.x - f.x, e.z - f.z) < 1.6);
        if (helper) { f.rescueT = (this.rescueT[f.id] || 0) + dt; this.rescueT[f.id] = f.rescueT; if (f.rescueT > 0.7) { this.setFrozen(f.id, false); this.rescueT[f.id] = 0; if (f.id === st.me) UI.toast('🔥 You were freed! Go go go!'); } }
        else this.rescueT[f.id] = 0;
      }
      this.netT = (this.netT || 0) - dt;
      if (this.netT <= 0 && st.humans.length > 1) { this.netT = 0.12; Net.sendX('arena', { op: 'st', bots: st.bots.map(b => [+b.x.toFixed(2), +b.z.toFixed(2), +b.f.toFixed(2), b.frozen ? 1 : 0]), frozenH: st.frozenH, time: st.time }); }
      this.checkEnd();
      if (!this.st) return;     // the game just ended
    }
    // render bots
    for (const b of st.bots) {
      const gh = Game.groundAt(b.x, b.z, 3);
      b.mesh.position.set(b.x, gh + (b.frozen ? 0 : Math.abs(Math.sin(b.walk || 0)) * 0.08), b.z); b.mesh.rotation.y = b.f;
      this.ice(b.mesh, b.frozen);
    }
    this.ice(Game.player.mesh, this.isFrozenMe());
    for (const h of st.humans) if (h.id !== st.me) { const r = Game.remotes.get(h.id); if (r) this.ice(r.mesh, !!st.frozenH[h.id]); }
    // HUD + tag button
    const all = this.everyone();
    const left = (team) => all.filter(e => e.team === team && !e.frozen).length;
    $('tag-hud').textContent = `❄️ FREEZE TAG   🩷 ${left('pink')} left   💙 ${left('blue')} left   ⏱️ ${Math.max(0, Math.ceil(st.time))}s`;
    const P = Game.player.pos, mt = this.myTeam();
    const close = all.some(e => e.team !== mt && !e.frozen && Math.hypot(e.x - P.x, e.z - P.z) < 2.4);
    $('btn-tag').classList.toggle('ready', close && !this.isFrozenMe());
  },
  rescueT: {},
  ice(mesh, on) {
    if (!mesh) return;
    if (on && !mesh.userData.ice) { const ice = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 2.5, 8), new THREE.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.45, depthWrite: false })); ice.position.y = 1.2; mesh.add(ice); mesh.userData.ice = ice; }
    else if (!on && mesh.userData.ice) { mesh.remove(mesh.userData.ice); mesh.userData.ice = null; }
  },
  checkEnd() {
    const st = this.st, all = this.everyone();
    const left = (team) => all.filter(e => e.team === team && !e.frozen).length;
    let winner = null;
    if (!left('pink')) winner = 'blue'; else if (!left('blue')) winner = 'pink';
    else if (st.time <= 0) winner = left('pink') === left('blue') ? 'draw' : left('pink') > left('blue') ? 'pink' : 'blue';
    if (!winner) return;
    if (st.humans.length > 1) Net.sendX('arena', { op: 'tagend', winner });
    this.end(winner);
  },
  end(winner) {
    const st = this.st; if (!st) return;
    st.bots.forEach(b => Game.W.root.remove(b.mesh));
    this.ice(Game.player.mesh, false);
    for (const r of Game.remotes.values()) this.ice(r.mesh, false);
    this.st = null; Arena.active = null; $('tag-hud').hidden = true; $('btn-tag').hidden = true;
    const mine = st.humans.find(h => h.id === st.me).team;
    const won = winner === mine;
    if (st.humans.length > 1 && st.host) {
      const champ = st.humans.find(h => h.team === winner);
      if (winner === 'draw') Family.record('team', 'Freeze Tag ended in a tie');
      else Family.record(champ && (champ.id === st.me ? Profile.isParent() : Net.players.get(champ.id) && Net.players.get(champ.id).role === 'parent') ? 'parent' : 'child', `${champ ? champ.name : TEAM[winner].name} won Freeze Tag`);
    } else if (st.humans.length === 1) Daily.progress('challenge');
    const coins = Save.addCoins(won ? 15 : 8, 'tag');
    UI.open(`<h2>${winner === 'draw' ? '🤝 It\'s a tie!' : won ? '🏆 Your team wins!' : `${TEAM[winner].icon} ${TEAM[winner].name} wins!`}</h2><div class="result-big">${won ? '🥳' : '😄'}</div>
      <p class="affirm">${won ? 'Awesome teamwork!' : 'Great game! Rematch?'}</p><p class="center">🪙 +${coins}</p>
      <div class="row-btns"><button class="big-btn pink" id="tg-ok">Yay!</button></div>`);
    Rewards.celebrate(won ? 'big' : 'small');
    $('tg-ok').onclick = () => UI.close();
  },
};

// ================= MATH RACE =================
const Race = {
  // Questions come from the child's own addition/subtraction levels (grade 1, no multiplication).
  makeQuestions() {
    return Array.from({ length: 14 }, () => {
      const it = makeActivity(Math.random() < 0.55 ? 'addition' : 'subtraction', Learn.tracking ? Math.min(3, Learn.levelFor('addition')) : 2);
      return { prompt: it.prompt, choices: it.choices, answer: it.answer, skill: it.skill, difficulty: it.difficulty };
    });
  },
  start(partnerId) {
    const qs = this.makeQuestions();
    const partner = partnerId ? Net.players.get(partnerId) : null;
    // grown-up handicap keeps it fair and fun
    const goalMe = Profile.isParent() ? 10 : 7, goalThem = partner ? (partner.role === 'parent' ? 10 : 7) : 7;
    if (partner) Net.sendX('arena', { op: 'racestart', qs, goalYou: goalThem, goalMe }, partner.id);
    this.begin(qs, goalMe, goalThem, partner ? partner.name : 'Pip 🐲', !partner);
  },
  begin(qs, goal, goalThem, them, bot) {
    this.r = { qs, i: 0, n: 0, goal, goalThem, them, themN: 0, bot, t0: performance.now(), lock: false };
    Arena.active = 'race';
    if (bot) {
      // Pip answers at about her own pace so it stays close
      const pace = Math.max(3000, Math.min(9000, (Learn.m.skills.addition ? Learn.m.skills.addition.ms : 5000) * 1.15 || 5000));
      this.botT = setInterval(() => { if (!this.r) return; if (Math.random() < 0.8) { this.r.themN++; this.render(); this.check(); } }, pace);
    }
    this.render();
    Voice.speak(`Math race against ${them}! Ready, set, go!`);
  },
  render() {
    const r = this.r; if (!r) return;
    const q = r.qs[r.i % r.qs.length];
    const bar = (n, g) => `<div class="race-track"><div class="race-runner" style="left:${Math.min(100, n / g * 100)}%"></div><span class="race-flag">🏁</span></div>`;
    UI.open(`<div class="mg-head"><span>🔢 Math Race</span><span class="muted">first to the flag!</span></div>
      <div class="race"><b>You</b> ${bar(r.n, r.goal)}<b>${esc(r.them)}</b> ${bar(r.themN, r.goalThem)}</div>
      <div class="mg-prompt" style="font-size:40px">${esc(q.prompt)}</div>
      <div class="choices">${q.choices.map((c, k) => `<button class="choice" data-k="${k}">${esc(c)}</button>`).join('')}</div><div id="race-msg" class="center"></div>`, { onClose: () => this.stop(true) });
    r.qt = performance.now();
    document.querySelectorAll('.choice').forEach(b => b.onclick = () => this.answer(q, q.choices[+b.dataset.k], b));
  },
  answer(q, val, btn) {
    const r = this.r; if (!r || r.lock) return;
    const ok = val === q.answer;
    if (Learn.tracking) Learn.record(Object.assign(makeActivity(q.skill, q.difficulty), { prompt: q.prompt, choices: q.choices, answer: q.answer, key: 'race' + q.prompt }), { correct: ok, firstTry: true, attempts: 1, ms: performance.now() - r.qt, chosen: val });
    r.i++;
    if (ok) { r.n++; Sound.right(); if (Net.connected && !r.bot) Net.sendX('arena', { op: 'raceprog', n: r.n }); this.render(); this.check(); }
    else { Sound.wrong(); btn.classList.add('wrong'); r.lock = true; $('race-msg').innerHTML = `<p class="affirm small">Oops! It was ${esc(q.answer)} 🌱</p>`; setTimeout(() => { r.lock = false; this.render(); }, 1300); }
  },
  check() {
    const r = this.r; if (!r) return;
    if (r.n >= r.goal) this.finish(true); else if (r.themN >= r.goalThem) this.finish(false);
  },
  finish(won) {
    const r = this.r; this.stop(false);
    if (!r.bot) { if (won) Net.sendX('arena', { op: 'racewin' }); Family.record(won ? (Profile.isParent() ? 'parent' : 'child') : (Profile.isParent() ? 'child' : 'parent'), `${won ? Profile.name() : r.them} won the Math Race`); }
    else Daily.progress('challenge');
    const coins = Save.addCoins(won ? 15 : 8, 'race');
    UI.open(`<h2>${won ? '🏆 You win the race!' : `🏁 ${esc(r.them)} wins!`}</h2><div class="result-big">${won ? '🥇' : '🥈'}</div>
      <p class="affirm">${won ? 'Lightning-fast math brain!' : 'So close! Your brain is getting faster!'}</p><p class="center">🪙 +${coins}</p>
      <div class="row-btns"><button class="big-btn pink" id="rc-ok">Yay!</button></div>`);
    Rewards.celebrate(won ? 'big' : 'small');
    $('rc-ok').onclick = () => UI.close();
  },
  stop(quit) { clearInterval(this.botT); if (quit && this.r && !this.r.bot) Net.sendX('arena', { op: 'racequit' }); this.r = null; Arena.active = null; },
};

Net.on('arena', (from, d) => {
  if (!d || typeof d !== 'object') return;
  const pl = Net.players.get(from), name = pl ? pl.name : 'Your friend';
  if (d.op === 'invite') {
    if (!Game.running || Game.level !== d.level) { UI.toast(`🏟️ ${name} wants to play! Tap Go to join Level ${d.level}.`); return; }
    const bar = $('alert-bar');
    bar.innerHTML = `<div class="al-title">🏟️ CHALLENGE!</div><div class="al-text">${esc(name)} challenges you to ${d.kind === 'tag' ? '❄️ Freeze Tag' : '🔢 a Math Race'}!</div>
      <button class="small-btn pink" id="ar-yes">Let's play!</button><button class="small-btn gray" id="ar-no">Not now</button>`;
    bar.hidden = false; World2.alertOpen = true; Sound.fanfare();
    $('ar-yes').onclick = () => { World2.hideAlert(); Net.sendX('arena', { op: 'accept', kind: d.kind }, from); };
    $('ar-no').onclick = () => { World2.hideAlert(); Net.sendX('arena', { op: 'decline' }, from); };
  } else if (d.op === 'accept' && Arena.pending && Arena.pending.partner === from) {
    Arena.pending = null; (d.kind === 'tag' ? Tag : Race).start(from);
  } else if (d.op === 'decline') { Arena.pending = null; UI.toast(`${name} said maybe later!`); }
  else if (d.op === 'tagstart' && Array.isArray(d.humans) && Array.isArray(d.bots)) {
    UI.close();
    Tag.begin({ host: false, humans: d.humans.slice(0, 2).map(h => ({ id: String(h.id), team: h.team === 'blue' ? 'blue' : 'pink', name: cleanName(h.name) })), bots: d.bots.slice(0, 6).map(b => ({ id: String(b.id), team: b.team === 'blue' ? 'blue' : 'pink', name: cleanName(b.name), x: 0, z: 0, f: 0, frozen: false })), frozenH: {}, time: 150, me: Net.myId });
  } else if (d.op === 'st' && Tag.st && !Tag.st.host && Array.isArray(d.bots)) {
    d.bots.forEach((v, i) => { const b = Tag.st.bots[i]; if (b && Array.isArray(v)) { b.x = +v[0] || 0; b.z = +v[1] || 0; b.f = +v[2] || 0; b.frozen = !!v[3]; } });
    Tag.st.frozenH = d.frozenH && typeof d.frozenH === 'object' ? d.frozenH : {}; Tag.st.time = +d.time || 0;
  } else if (d.op === 'tag' && Tag.st && Tag.st.host) Tag.applyTag(from, String(d.target));
  else if (d.op === 'tagend' && Tag.st && !Tag.st.host) Tag.end(d.winner);
  else if (d.op === 'racestart' && Array.isArray(d.qs)) { UI.close(); Race.begin(d.qs.slice(0, 20), +d.goalYou || 7, +d.goalMe || 7, name, false); }
  else if (d.op === 'raceprog' && Race.r) { Race.r.themN = Math.min(+d.n || 0, 20); Race.render(); }
  else if (d.op === 'racewin' && Race.r) Race.finish(false);
  else if (d.op === 'racequit' && Race.r) { Race.stop(false); UI.close(); UI.toast(`${name} left the race`); }
});
