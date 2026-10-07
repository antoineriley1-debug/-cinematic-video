// Profiles (child / parent), the Family Team, and rotating daily + weekly content.
'use strict';

const Profile = {
  get p() { return Save.data.profile || null; },
  isChild() { return !this.p || this.p.role === 'child'; },
  isParent() { return !!this.p && this.p.role === 'parent'; },
  name() { return this.p ? this.p.name : (Save.data.nickname || 'Princess'); },

  // First launch on a device: who plays here?
  ensure(then) {
    if (this.p) return then && then();
    UI.open(`<h2>👋 Welcome!</h2><p class="center" style="font-size:20px">Who is playing on this iPad?</p>
      <div class="row-btns"><button class="big-btn pink" id="pf-child">👧 A child</button><button class="big-btn purple" id="pf-parent">🧑 A parent</button></div>
      <p class="center muted">Each iPad has its own profile. The child's learning is only measured on the child's profile.</p>`, { closable: false });
    $('pf-child').onclick = () => this.setup('child', then);
    $('pf-parent').onclick = () => this.setup('parent', then);
  },
  setup(role, then) {
    UI.open(`<h2>${role === 'child' ? '👧 Your name' : '🧑 Parent profile'}</h2>
      <input id="pf-name" class="name-input" maxlength="12" placeholder="${role === 'child' ? 'First name' : 'Dad, Mom...'}">
      ${role === 'child' ? `<p class="center">Grade: <select id="pf-grade" class="pf-grade"><option value="1" selected>1st grade</option></select></p>
        <p class="center muted">More grades will be added. First grade content has no multiplication.</p>`
        : `<p class="pick-label">Shirt color</p>${swatches(PAINT_COLORS, 0x48a8ff, 'sc')}`}
      <div class="row-btns"><button class="big-btn pink" id="pf-ok">Let's play!</button></div>`, { closable: false });
    let shirt = 0x48a8ff;
    document.querySelectorAll('[data-sc]').forEach(b => b.onclick = () => { shirt = +b.dataset.sc; document.querySelectorAll('[data-sc]').forEach(x => x.classList.toggle('sel', x === b)); });
    $('pf-ok').onclick = () => {
      const name = cleanName($('pf-name').value);
      Save.data.profile = { role, name, grade: 1, shirt, created: Date.now() };
      if (!Save.data.nickname) Save.data.nickname = name;
      if (role === 'parent') Save.data.look = Object.assign(Save.data.look, { adult: true, shirt });
      Save.write(); Game.refreshLook(); UI.close();
      if (then) then();
    };
  },
};

// A simple grown-up avatar for parent profiles.
function makeAdult(o = {}) {
  const g = new THREE.Group();
  const shirt = mat(o.shirt || 0x48a8ff), pants = mat(0x34495e), skin = mat(o.skin || 0xf1c27d), hair = mat(o.hair || 0x3b2314);
  [-0.16, 0.16].forEach(x => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 1.0, 8), pants); l.position.set(x, 0.5, 0); g.add(l); });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.32, 0.9, 10), shirt); torso.position.y = 1.45; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.33, 14, 10), skin); head.position.y = 2.15; g.add(head);
  const hc = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), hair); hc.position.y = 2.2; g.add(hc);
  [-0.11, 0.11].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat(0x2d1b2e)); e.position.set(x, 2.18, 0.29); g.add(e); });
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 12, Math.PI), mat(0x8a3040)); smile.rotation.z = Math.PI; smile.position.set(0, 2.06, 0.3); g.add(smile);
  const arms = [];
  [-0.45, 0.45].forEach(x => { const pv = new THREE.Group(); pv.position.set(x, 1.8, 0); const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.6, 4, 6), shirt); a.position.y = -0.38; pv.add(a); g.add(pv); arms.push(pv); });
  if (o.shoes) [-0.16, 0.16].forEach(x => { const sh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.4), mat(o.shoes.base)); sh.position.set(x, 0.07, 0.08); g.add(sh); });
  g.userData.arms = arms;
  return g;
}
// Pick the right body for any look (child princess or grown-up).
function makeAvatar(o) { return o && o.adult ? makeAdult(o) : makePrincess(o); }

// ---------- Family team ----------
const EMBLEMS = ['🦄', '🐉', '👑', '⭐', '🌈', '🦁', '🚀', '🌸', '🐬', '🏰'];
const Family = {
  get f() {
    if (!Save.data.family) Save.data.family = { name: '', emblem: '👑', xp: 0, coop: 0, parentWins: 0, childWins: 0, teamWins: 0, challenges: 0, streak: 0, lastTogether: '', best: 0, history: [], updated: 0 };
    return Save.data.family;
  },
  level() { return 1 + Math.floor(Math.sqrt(this.f.xp / 40)); },
  addXP(n, why) {
    const f = this.f; f.xp += n; f.updated = Date.now();
    f.history.unshift({ t: Date.now(), text: why }); f.history = f.history.slice(0, 40);
    // play-together streak (days in a row with a shared activity)
    const today = dayKey(), y = new Date(); y.setDate(y.getDate() - 1);
    if (f.lastTogether !== today) { f.streak = f.lastTogether === dayKey(y) ? f.streak + 1 : 1; f.lastTogether = today; f.best = Math.max(f.best, f.streak); }
    Save.write(); this.sync();
  },
  // results: 'coop' | 'parent' | 'child' | 'team' | 'challenge'
  record(kind, text) {
    const f = this.f;
    if (kind === 'coop') f.coop++; if (kind === 'parent') f.parentWins++; if (kind === 'child') f.childWins++; if (kind === 'team') f.teamWins++;
    if (kind !== 'coop') f.challenges++;
    this.addXP(kind === 'coop' ? 30 : 15, text);
    Daily.progress(kind === 'coop' ? 'coop' : 'challenge');
  },
  show() {
    const f = this.f;
    if (!f.name) {
      UI.open(`<h2>🏆 Create your Family Team</h2><input id="fm-name" class="name-input" maxlength="16" placeholder="Team name">
        <p class="pick-label">Team emblem</p><div class="tool-row">${EMBLEMS.map(e => `<button class="emblem" data-em="${e}">${e}</button>`).join('')}</div>
        <div class="row-btns"><button class="big-btn pink" id="fm-ok">Create team</button></div>`);
      let em = '👑';
      document.querySelectorAll('[data-em]').forEach(b => b.onclick = () => { em = b.dataset.em; document.querySelectorAll('[data-em]').forEach(x => x.classList.toggle('on', x === b)); });
      $('fm-ok').onclick = () => { f.name = ($('fm-name').value || '').replace(/[^A-Za-z0-9 ']/g, '').trim().slice(0, 16) || 'Team Sparkle'; f.emblem = em; f.updated = Date.now(); Save.write(); this.sync(); this.show(); };
      return;
    }
    const lv = this.level(), next = 40 * lv * lv, prev = 40 * (lv - 1) * (lv - 1);
    const trophies = [[f.coop >= 1, '🗝️', 'First co-op mission'], [f.coop >= 5, '🏅', '5 missions together'], [f.challenges >= 5, '🎯', '5 challenges played'], [f.best >= 3, '🔥', '3-day streak'], [f.best >= 7, '🌟', '7-day streak'], [lv >= 5, '👑', 'Team level 5'], [f.teamWins >= 3, '🤝', '3 team victories']];
    UI.open(`<h2>${f.emblem} ${esc(f.name)}</h2><p class="center"><b>Team level ${lv}</b></p><div class="bar"><div style="width:${Math.min(100, (f.xp - prev) / (next - prev) * 100)}%"></div></div>
      <div class="stat-grid">
        <div><b>${f.coop}</b><span>Missions together</span></div><div><b>${f.teamWins}</b><span>Team victories</span></div>
        <div><b>${f.childWins}</b><span>${esc(Profile.isChild() ? Profile.name() : 'Kid')} wins</span></div><div><b>${f.parentWins}</b><span>Grown-up wins</span></div>
        <div><b>${f.streak}🔥</b><span>Day streak</span></div><div><b>${f.challenges}</b><span>Challenges</span></div></div>
      <h3>🏆 Trophy room</h3><div class="trophies">${trophies.map(([got, e, t]) => `<div class="trophy ${got ? '' : 'locked'}"><span>${got ? e : '🔒'}</span><small>${t}</small></div>`).join('')}</div>
      <h3>📜 Recent</h3><div class="list">${f.history.slice(0, 6).map(h => `<div class="list-row"><span class="muted">${new Date(h.t).toLocaleDateString()}</span> ${esc(h.text)}</div>`).join('') || '<p class="muted">Play a mission together to start your story!</p>'}</div>
      <div class="row-btns"><button class="big-btn pink" id="fm-play">🏟️ Challenges & co-op missions</button></div>
      <p class="center muted">Every game is for fun - win or lose, you play as a team. 💖</p>`);
    $('fm-play').onclick = () => Arena.menu();
  },
  // Keep both devices' family stats in step (take the larger value of each counter).
  sync() { if (typeof Net !== 'undefined' && Net.connected) Net.sendX('family', this.f); },
  merge(o) {
    if (!o || typeof o !== 'object') return;
    const f = this.f;
    for (const k of ['xp', 'coop', 'parentWins', 'childWins', 'teamWins', 'challenges', 'streak', 'best']) if (typeof o[k] === 'number' && o[k] > f[k]) f[k] = Math.min(o[k], 1e6);
    if (o.updated > f.updated && typeof o.name === 'string') { f.name = o.name.replace(/[^A-Za-z0-9 ']/g, '').slice(0, 16); f.emblem = EMBLEMS.includes(o.emblem) ? o.emblem : f.emblem; f.updated = o.updated; }
    Save.write();
  },
};

// ---------- Daily + weekly content ----------
const Daily = {
  get d() {
    const k = dayKey();
    if (!Save.data.dailyContent || Save.data.dailyContent.day !== k) {
      Save.data.dailyContent = { day: k, adventure: 0, reading: 0, challenge: 0, mysteryClaimed: false, rewardClaimed: false };
      Save.write();
    }
    return Save.data.dailyContent;
  },
  weekKey() { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dayKey(d); },
  get w() {
    const k = this.weekKey();
    if (!Save.data.weekly || Save.data.weekly.week !== k) {
      Save.data.weekly = { week: k, claimed: false, steps: [
        { id: 'coop', text: 'Complete 2 missions together (or with Pip)', goal: 2, n: 0 },
        { id: 'challenge', text: 'Play a family challenge', goal: 1, n: 0 },
        { id: 'reading', text: 'Do 25 reading activities', goal: 25, n: 0 },
        { id: 'math', text: 'Do 15 math activities', goal: 15, n: 0 },
        { id: 'experiment', text: 'Run a science experiment', goal: 1, n: 0 },
      ] };
      Save.write();
    }
    return Save.data.weekly;
  },
  progress(kind, n = 1) {
    const d = this.d;
    if (kind === 'adventure' || kind === 'coop') d.adventure += n;
    if (kind === 'reading') d.reading += n;
    if (kind === 'challenge') d.challenge += n;
    for (const st of this.w.steps) if (st.id === kind || (kind === 'adventure' && st.id === 'coop')) st.n = Math.min(st.goal, st.n + n);
    Save.write();
  },
  onLearn(it) {
    if (!Learn.tracking) return;
    if (it.subject === 'Reading') this.progress('reading');
    if (it.subject === 'Math') this.progress('math');
    if (it.type === 'experiment') this.progress('experiment');
  },
  show() {
    const d = this.d, w = this.w;
    const rows = [
      ['🗺️', 'Daily Adventure', 'Finish a world mission (missing puppy, treasure hunt...)', d.adventure >= 1],
      ['📖', 'Daily Reading Challenge', `Do 5 reading activities (${Math.min(5, d.reading)}/5)`, d.reading >= 5],
      ['🤝', 'Parent vs Child Challenge (optional)', 'Play any family challenge', d.challenge >= 1],
    ];
    const mysteryReady = d.adventure >= 1 && d.reading >= 5;
    const weekDone = w.steps.every(s => s.n >= s.goal);
    UI.open(`<h2>📅 Today</h2>
      <div class="list">${rows.map(([e, t, s, done]) => `<div class="list-row"><span style="font-size:28px">${done ? '✅' : e}</span><div style="flex:1"><b>${t}</b><br><span class="muted">${s}</span></div></div>`).join('')}</div>
      <div class="row-btns"><button class="big-btn ${d.rewardClaimed ? 'gray' : 'green'}" id="dy-reward">${d.rewardClaimed ? 'Daily gift claimed ✓' : '🎁 Daily gift'}</button>
        <button class="big-btn ${d.mysteryClaimed ? 'gray' : mysteryReady ? 'pink' : 'gray'}" id="dy-mystery">${d.mysteryClaimed ? 'Mystery opened ✓' : mysteryReady ? '❓ Daily Mystery!' : '🔒 Daily Mystery'}</button></div>
      <h3>🏰 This week's Family Adventure</h3>
      <div class="list">${w.steps.map(s => `<div class="list-row"><span style="font-size:22px">${s.n >= s.goal ? '✅' : '⬜'}</span><b style="flex:1">${esc(s.text)}</b><span>${s.n}/${s.goal}</span></div>`).join('')}</div>
      <div class="row-btns"><button class="big-btn ${w.claimed ? 'gray' : weekDone ? 'pink' : 'gray'}" id="dy-week">${w.claimed ? 'Adventure complete ✓' : weekDone ? '🏆 Claim the big reward!' : '🔒 Big reward'}</button></div>`);
    $('dy-reward').onclick = () => { if (d.rewardClaimed) return; d.rewardClaimed = true; Save.write(); UI.close(); Rewards.mysteryBox('common'); };
    $('dy-mystery').onclick = () => { if (d.mysteryClaimed || !mysteryReady) { if (!mysteryReady) UI.toast('Finish the adventure and reading challenge first!'); return; } d.mysteryClaimed = true; Save.write(); UI.close(); Rewards.mysteryBox('rare'); };
    $('dy-week').onclick = () => { if (w.claimed || !weekDone) { if (!weekDone) UI.toast('Finish every step of the Family Adventure!'); return; } w.claimed = true; Save.write(); UI.close(); Family.addXP(80, 'Weekly Family Adventure complete'); Rewards.mysteryBox('legendary'); };
  },
};
