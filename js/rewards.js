// Rewards: celebrations, mystery boxes, learning milestones that unlock the world, and the usable
// unlocks themselves (pets that follow and play, vehicles that really change how she moves).
'use strict';

const PETS = {
  puppy:   { name: 'Puppy',       icon: '🐶', color: 0xd9a066 },
  kitten:  { name: 'Kitten',      icon: '🐱', color: 0xffb36b },
  bunny:   { name: 'Bunny',       icon: '🐰', color: 0xf5f5f5 },
  dragon:  { name: 'Baby Dragon', icon: '🐲', color: 0x7ee0b5 },
  unicorn: { name: 'Unicorn Foal', icon: '🦄', color: 0xffffff },
};
const VEHICLES = {
  skates:      { name: 'Roller Skates', icon: '🛼', speed: 1.35 },
  scooter:     { name: 'Scooter',       icon: '🛴', speed: 1.5 },
  bike:        { name: 'Bicycle',       icon: '🚲', speed: 1.7 },
  kart:        { name: 'Go-Kart',       icon: '🏎️', speed: 1.9 },
  convertible: { name: 'Convertible',   icon: '🚗', speed: 2.1 },
};
const HOUSE_ITEMS = {
  nook: { name: 'Princess Reading Nook', icon: '📚' }, greenhouse: { name: 'Greenhouse', icon: '🪴' }, library: { name: 'Dream House Library Room', icon: '🏰' },
  townhall: { name: 'Town Hall Plaza', icon: '🏛️' }, canopy: { name: 'Canopy Bed', icon: '🛏️' }, piano: { name: 'Pink Piano', icon: '🎹' },
};
const COLLARS = [['Pink', 0xff69b4], ['Purple', 0xa070ff], ['Blue', 0x48a8ff], ['Gold', 0xffd700], ['Mint', 0x7ee0b5], ['Red', 0xe8303a]];

// Learning milestones -> things that change what she can DO.
const MILESTONES = [
  { id: 'first10', text: 'First 10 learning adventures', test: (L) => L.totalN() >= 10, reward: { box: 'common' } },
  { id: 'sight', text: 'Sight-word milestone', test: (L) => L.th('sight_words') >= 2.6 && L.n('sight_words') >= 10, reward: { pet: 'puppy' } },
  { id: 'reading_adv', text: 'Reading adventure complete', test: (L) => L.domN('comprehension') >= 15 && (L.domAcc('comprehension') || 0) >= 0.65, reward: { house: 'nook', vehicle: 'skates' } },
  { id: 'math_star', text: 'Addition star', test: (L) => L.th('addition') >= 3, reward: { vehicle: 'scooter' } },
  { id: 'scientist', text: '3 science experiments', test: (L) => L.experiments() >= 3, reward: { house: 'greenhouse', pet: 'bunny' } },
  { id: 'citizen', text: 'Social studies adventure', test: (L) => L.domN('social') >= 15, reward: { house: 'townhall', pet: 'kitten' } },
  { id: 'subtract', text: 'Subtraction hero', test: (L) => L.th('subtraction') >= 3, reward: { vehicle: 'bike' } },
  { id: 'master1', text: 'First skill mastered', test: (L) => L.mastered() >= 1, reward: { pet: 'dragon' } },
  { id: 'master5', text: '5 skills mastered', test: (L) => L.mastered() >= 5, reward: { vehicle: 'kart', house: 'canopy' } },
  { id: 'reader', text: 'Reading milestone', test: (L) => ['phonics', 'sightwords', 'comprehension'].every(d => (Learn.domainScore(d) || 0) >= 3.2), reward: { house: 'library', vehicle: 'convertible' } },
  { id: 'master10', text: '10 skills mastered', test: (L) => L.mastered() >= 10, reward: { pet: 'unicorn', house: 'piano' } },
];
const LQ = {      // small query helpers over the learner model
  totalN: () => Object.values(Learn.m.skills).reduce((a, s) => a + s.n, 0),
  th: (id) => (Learn.m.skills[id] || { th: 0 }).th, n: (id) => (Learn.m.skills[id] || { n: 0 }).n,
  domN: (d) => Learn.domainN(d), domAcc: (d) => Learn.domainAcc(d),
  mastered: () => Object.values(Learn.m.skills).filter(s => s.masteredAt).length,
  experiments: () => Object.values(Learn.m.daily).reduce((a, d) => a + (d.acts.experiment || 0), 0),
};

const Rewards = {
  queue: [],
  inv() {
    const d = Save.data;
    if (!d.inv) d.inv = { pets: [], vehicles: [], house: [], petInfo: {}, activePet: null, vehicle: null, boxes: 0 };
    if (!d.milestones) d.milestones = [];
    return d.inv;
  },

  // ---------- celebration: confetti + music + her character cheers ----------
  celebrate(size = 'medium') {
    const n = { small: 60, medium: 140, big: 260 }[size] || 100;
    this.confetti(n);
    if (size === 'big') Sound.fanfare(); else if (size === 'medium') Sound.right();
    if (typeof Game !== 'undefined' && Game.player) Game.player.cheer = size === 'big' ? 3 : 1.6;
  },
  confetti(n) {
    let cv = $('confetti');
    if (!cv) { cv = document.createElement('canvas'); cv.id = 'confetti'; document.body.appendChild(cv); }
    cv.width = innerWidth; cv.height = innerHeight;
    const ctx = cv.getContext('2d');
    const cols = ['#ff69b4', '#ffd700', '#8f4dff', '#48dbfb', '#1dd1a1', '#ff9f43', '#ffffff'];
    const parts = Array.from({ length: n }, () => ({ x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.5, vx: (Math.random() - 0.5) * 4, vy: 4 + Math.random() * 5,
      r: 5 + Math.random() * 7, c: cols[Math.floor(Math.random() * cols.length)], a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3, star: Math.random() < 0.25 }));
    this.confettiParts = (this.confettiParts || []).concat(parts).slice(-260);   // never let celebrations pile up
    if (this.confettiRunning) return;
    this.confettiRunning = true;
    const step = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      this.confettiParts = this.confettiParts.filter(p => p.y < cv.height + 30);
      for (const p of this.confettiParts) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.a += p.va;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c;
        if (p.star) { ctx.font = `${p.r * 3}px sans-serif`; ctx.fillText('⭐', 0, 0); } else ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        ctx.restore();
      }
      if (this.confettiParts.length) requestAnimationFrame(step); else { this.confettiRunning = false; ctx.clearRect(0, 0, cv.width, cv.height); }
    };
    requestAnimationFrame(step);
  },

  // ---------- mystery box reveal ----------
  mysteryBox(rarity = 'common', onDone) {
    const prize = this.rollPrize(rarity);
    const glow = { common: '#ffb6d9', rare: '#48dbfb', epic: '#c58cff', legendary: '#ffd700' }[rarity];
    const ov = document.createElement('div'); ov.className = 'reveal'; ov.style.setProperty('--glow', glow);
    ov.innerHTML = `<div class="reveal-in"><div class="rarity">${rarity.toUpperCase()} MYSTERY BOX</div><button class="box" id="mb-box">🎁</button><p>Tap the box to open it!</p></div>`;
    document.body.appendChild(ov);
    Voice.speak('A mystery box! Tap it to open it!');
    let taps = 0;
    ov.querySelector('#mb-box').onclick = () => {
      taps++; Sound.tap();
      const b = ov.querySelector('#mb-box'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
      if (taps < 3) return;
      this.grant(prize);
      ov.querySelector('.reveal-in').innerHTML = `<div class="rarity">${rarity.toUpperCase()}!</div><div class="burst"></div><div class="prize">${prize.icon}</div>
        <h2>${esc(prize.label)}</h2><p>${esc(prize.sub || '')}</p><button class="big-btn pink" id="mb-ok">Awesome!</button>`;
      this.celebrate(rarity === 'common' ? 'medium' : 'big');
      Voice.speak(`You got ${prize.label}!`);
      ov.querySelector('#mb-ok').onclick = () => { ov.remove(); if (onDone) onDone(prize); };
    };
  },
  rollPrize(rarity) {
    const inv = this.inv();
    // rarer boxes prefer real unlocks she does not have yet; otherwise boutique looks or coins
    const lockedLooks = [];
    for (const [slot, cat] of Object.entries(WARDROBE)) for (const it of cat.items) if (it[2] > 0 && !Save.data.owned.includes(slot + ':' + it[0])) lockedLooks.push([slot, it]);
    const pets = Object.keys(PETS).filter(k => !inv.pets.includes(k)), cars = Object.keys(VEHICLES).filter(k => !inv.vehicles.includes(k));
    if ((rarity === 'epic' || rarity === 'legendary') && (pets.length || cars.length) && Math.random() < 0.7) {
      const pickPet = pets.length && (!cars.length || Math.random() < 0.5);
      return pickPet ? { kind: 'pet', id: pick(pets), icon: PETS[pick(pets)].icon } : { kind: 'vehicle', id: pick(cars) };
    }
    if (lockedLooks.length && Math.random() < (rarity === 'common' ? 0.5 : 0.8)) { const [slot, it] = pick(lockedLooks); return { kind: 'look', slot, id: it[0], icon: '👗', label: `New look: ${it[1]}`, sub: `${WARDROBE[slot].label} unlocked in the Boutique` }; }
    const c = { common: 25, rare: 50, epic: 90, legendary: 150 }[rarity];
    return { kind: 'coins', n: c, icon: '🪙', label: `${c} coins!`, sub: 'Spend them on rewards or new looks' };
  },
  grant(p) {
    const inv = this.inv();
    if (p.kind === 'pet') { if (!inv.pets.includes(p.id)) inv.pets.push(p.id); inv.petInfo[p.id] = inv.petInfo[p.id] || { name: PETS[p.id].name, collar: 0xff69b4, happy: 80 }; inv.activePet = p.id; p.icon = PETS[p.id].icon; p.label = `A ${PETS[p.id].name}!`; p.sub = 'Your new pet will follow you everywhere. Tap 🐾 to feed and play!'; if (typeof Game !== 'undefined') Game.refreshPet && Game.refreshPet(); }
    else if (p.kind === 'vehicle') { if (!inv.vehicles.includes(p.id)) inv.vehicles.push(p.id); p.icon = VEHICLES[p.id].icon; p.label = `${VEHICLES[p.id].name}!`; p.sub = 'Tap 🛴 to ride it and go faster!'; }
    else if (p.kind === 'house') { if (!inv.house.includes(p.id)) inv.house.push(p.id); p.icon = HOUSE_ITEMS[p.id].icon; p.label = HOUSE_ITEMS[p.id].name; p.sub = 'Added to your Dream House collection!'; }
    else if (p.kind === 'look') { if (!Save.data.owned.includes(p.slot + ':' + p.id)) Save.data.owned.push(p.slot + ':' + p.id); }
    else if (p.kind === 'coins') Save.addCoins(p.n, 'box');
    Learn.logEvent(`Unlocked: ${p.label || p.id}`, 'unlock');
    Save.write();
    if (typeof UI !== 'undefined') UI.updateRewardButtons && UI.updateRewardButtons();
  },

  // ---------- learning milestones ----------
  checkMilestones() {
    if (!Learn.tracking) return;
    this.inv();
    for (const ms of MILESTONES) {
      if (Save.data.milestones.includes(ms.id)) continue;
      let ok = false; try { ok = ms.test(LQ); } catch (e) { ok = false; }
      if (ok) { Save.data.milestones.push(ms.id); this.queue.push(ms); Learn.logEvent(`Milestone: ${ms.text}`, 'milestone'); Save.write(); }
    }
  },
  onMastery(skillId) { this.queue.push({ id: 'mastery_' + skillId, text: `You mastered ${SKILL_BY_ID[skillId].name}!`, reward: { box: 'rare' } }); },
  // Shown when nothing else is on screen, so rewards never interrupt an activity.
  flush() {
    if (!this.queue.length || UI.modalOpen || document.querySelector('.reveal')) return;
    // never interrupt a mission, challenge or alert - rewards wait for a calm moment
    if ((typeof Coop !== 'undefined' && Coop.active) || (typeof Arena !== 'undefined' && Arena.active) || (typeof World2 !== 'undefined' && World2.alertOpen)) return;
    const ms = this.queue.shift(), r = ms.reward;
    const grants = [];
    if (r.pet) grants.push({ kind: 'pet', id: r.pet });
    if (r.vehicle) grants.push({ kind: 'vehicle', id: r.vehicle });
    if (r.house) grants.push({ kind: 'house', id: r.house });
    if (r.box) return this.unlockScreen(ms.text, null, () => this.mysteryBox(r.box));
    grants.forEach(g => this.grant(g));
    this.unlockScreen(ms.text, grants);
  },
  unlockScreen(title, grants, then) {
    const ov = document.createElement('div'); ov.className = 'reveal'; ov.style.setProperty('--glow', '#ffd700');
    ov.innerHTML = `<div class="reveal-in"><div class="rarity">🏆 LEARNING MILESTONE</div><h2>${esc(title)}</h2>
      ${grants ? `<div class="unlocks">${grants.map(g => `<div class="unlock-card"><div class="prize">${g.icon}</div><b>${esc(g.label)}</b><small>${esc(g.sub || '')}</small></div>`).join('')}</div>` : '<div class="prize">🎁</div><p>You earned a mystery box!</p>'}
      <p class="affirm">Learning makes your world bigger! 🌍</p><button class="big-btn pink" id="ul-ok">${grants ? 'Yay!' : 'Open it!'}</button></div>`;
    document.body.appendChild(ov);
    this.celebrate('big');
    Voice.speak(`${title}! ${grants ? 'You unlocked ' + grants.map(g => g.label).join(' and ') : 'You earned a mystery box!'}`);
    ov.querySelector('#ul-ok').onclick = () => { ov.remove(); if (then) then(); };
  },

  // ---------- pets ----------
  showPets() {
    const inv = this.inv();
    if (!inv.pets.length) {
      UI.open(`<h2>🐾 My Pets</h2><div class="result-big">🐶❓</div><p class="center" style="font-size:20px">Pets are unlocked by learning! Keep practicing sight words to unlock your first puppy.</p>
        <div class="list">${MILESTONES.filter(m => m.reward.pet).map(m => `<div class="list-row"><span style="font-size:28px">${PETS[m.reward.pet].icon}</span><b style="flex:1">${PETS[m.reward.pet].name}</b><span class="muted">${esc(m.text)}</span></div>`).join('')}</div>`);
      return;
    }
    const cur = inv.activePet, info = cur ? inv.petInfo[cur] : null;
    UI.open(`<h2>🐾 My Pets</h2><div class="pet-pick">${inv.pets.map(k => `<button class="mid-btn ${k === cur ? 'on' : ''}" data-pet="${k}">${PETS[k].icon} ${esc(inv.petInfo[k].name)}</button>`).join('')}
        <button class="mid-btn ${!cur ? 'on' : ''}" data-pet="">🏠 Stay home</button></div>
      ${info ? `<div class="pet-card"><div class="pet-big" id="pet-big">${PETS[cur].icon}</div>
        <div class="bar"><div style="width:${info.happy}%"></div></div><p class="center">Happiness ${Math.round(info.happy)}%</p>
        <div class="row-btns"><button class="big-btn pink" id="pt-feed">🍖 Feed</button><button class="big-btn purple" id="pt-play">🎾 Play fetch</button><button class="big-btn green" id="pt-pat">🤚 Pet</button></div>
        <p class="pick-label">Collar</p>${swatches(COLLARS, info.collar, 'col')}
        <p class="pick-label">Name</p><input id="pt-name" class="name-input" maxlength="12" value="${esc(info.name)}"></div>` : ''}`);
    document.querySelectorAll('[data-pet]').forEach(b => b.onclick = () => { inv.activePet = b.dataset.pet || null; Save.write(); Game.refreshPet(); this.showPets(); });
    if (!info) return;
    const react = (emo, txt) => { info.happy = Math.min(100, info.happy + 12); Save.write(); $('pet-big').textContent = emo; Sound.right(); Voice.speak(txt); Game.petReact(emo); setTimeout(() => this.showPets(), 900); };
    $('pt-feed').onclick = () => react('😋', `${info.name} loves that snack!`);
    $('pt-pat').onclick = () => react('💗', `${info.name} is so happy!`);
    $('pt-play').onclick = () => { UI.close(); Game.petFetch(); };
    document.querySelectorAll('[data-col]').forEach(b => b.onclick = () => { info.collar = +b.dataset.col; Save.write(); Game.refreshPet(); this.showPets(); });
    $('pt-name').onchange = (e) => { info.name = cleanName(e.target.value); Save.write(); Game.refreshPet(); };
  },

  // ---------- vehicles ----------
  showVehicles() {
    const inv = this.inv();
    UI.open(`<h2>🛴 Ride</h2>${inv.vehicles.length ? '' : '<p class="center" style="font-size:20px">Vehicles are unlocked by learning! Here is how to earn each one:</p>'}
      <div class="store-grid">${Object.entries(VEHICLES).map(([k, v]) => {
        const has = inv.vehicles.includes(k), ms = MILESTONES.find(m => m.reward.vehicle === k);
        return `<div class="item"><div class="em">${v.icon}</div><div class="nm">${v.name}</div>${has ? `<button class="${inv.vehicle === k ? 'gray' : 'pink'}" data-ride="${k}">${inv.vehicle === k ? 'Riding ✓' : 'Ride!'}</button>` : `<div class="muted">🔒 ${esc(ms ? ms.text : '')}</div>`}</div>`;
      }).join('')}</div>
      ${inv.vehicle ? '<div class="row-btns"><button class="big-btn gray" id="rd-off">🚶 Walk</button></div>' : ''}`);
    document.querySelectorAll('[data-ride]').forEach(b => b.onclick = () => { inv.vehicle = b.dataset.ride; Save.write(); Game.refreshVehicle(); UI.close(); UI.toast(`${VEHICLES[inv.vehicle].icon} Zoom zoom!`); });
    if ($('rd-off')) $('rd-off').onclick = () => { inv.vehicle = null; Save.write(); Game.refreshVehicle(); UI.close(); };
  },
};

// ---------- 3D models for pets and vehicles ----------
function makePet(kind, collar = 0xff69b4) {
  const g = new THREE.Group(), p = PETS[kind];
  const body = mat(kind === 'dragon' ? 0x7ee0b5 : p.color), dark = mat(0x3a2a2a), pink = mat(0xff9ec4);
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), body); torso.scale.set(1, 0.85, 1.35); torso.position.y = 0.38; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 10), body); head.position.set(0, 0.62, 0.38); g.add(head);
  [-0.09, 0.09].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), dark); e.position.set(x, 0.67, 0.6); g.add(e); });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), kind === 'bunny' || kind === 'kitten' ? pink : dark); nose.position.set(0, 0.6, 0.63); g.add(nose);
  const col = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.04, 6, 14), mat(collar)); col.position.set(0, 0.5, 0.3); col.rotation.x = Math.PI / 2.4; g.add(col);
  if (kind === 'puppy') [-1, 1].forEach(s => { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), mat(0x9c6b4e)); ear.scale.set(0.6, 1.3, 0.5); ear.position.set(0.2 * s, 0.6, 0.35); g.add(ear); });
  if (kind === 'kitten') [-1, 1].forEach(s => { const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 4), body); ear.position.set(0.13 * s, 0.85, 0.36); g.add(ear); });
  if (kind === 'bunny') [-1, 1].forEach(s => { const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.3, 4, 6), body); ear.position.set(0.08 * s, 0.98, 0.34); g.add(ear); });
  if (kind === 'dragon') [-1, 1].forEach(s => { const w = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 3), mat(0xff9ee5)); w.rotation.z = s * 1.2; w.position.set(0.3 * s, 0.6, 0.05); g.add(w); });
  if (kind === 'unicorn') { const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.25, 8), mat(0xffd700)); horn.position.set(0, 0.92, 0.45); g.add(horn); const mane = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), mat(0xff8ad8)); mane.position.set(0, 0.8, 0.25); g.add(mane); }
  const tail = new THREE.Mesh(new THREE.SphereGeometry(kind === 'bunny' ? 0.1 : 0.07, 6, 4), kind === 'unicorn' ? mat(0xff8ad8) : body); tail.position.set(0, 0.45, -0.45); g.add(tail);
  [[-0.15, 0.2], [0.15, 0.2], [-0.15, -0.22], [0.15, -0.22]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.25, 6), body); l.position.set(x, 0.12, z); g.add(l); });
  g.userData.tail = tail;
  return g;
}
function makeVehicle(kind) {
  const g = new THREE.Group();
  const pink = mat(0xff4fa3), white = mat(0xffffff), dark = mat(0x333333), gold = mat(0xffd700);
  const wheel = (x, z, r = 0.14) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.08, 12), dark); w.rotation.z = Math.PI / 2; w.position.set(x, r, z); g.add(w); };
  if (kind === 'skates') { [-0.2, 0.2].forEach(x => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.45), pink); b.position.set(x, 0.12, 0.15); g.add(b); [0, 0.3].forEach(z => wheel(x, z - 0.0, 0.05)); }); }
  else if (kind === 'scooter') { const deck = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 1.1), pink); deck.position.set(0, 0.14, 0.2); g.add(deck); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6), white); pole.position.set(0, 0.7, 0.72); g.add(pole); const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), white); bar.rotation.z = Math.PI / 2; bar.position.set(0, 1.25, 0.72); g.add(bar); wheel(0, -0.3, 0.1); wheel(0, 0.72, 0.1); }
  else if (kind === 'bike') { wheel(0, -0.5, 0.32); wheel(0, 0.6, 0.32); const fr = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.1), pink); fr.position.set(0, 0.5, 0.05); g.add(fr); const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6), white); bar.rotation.z = Math.PI / 2; bar.position.set(0, 1.0, 0.55); g.add(bar); const bk = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.25), mat(0xfff07a)); bk.position.set(0, 0.85, 0.75); g.add(bk); }
  else { // kart / convertible: she sits inside
    const big = kind === 'convertible';
    const body = new THREE.Mesh(new THREE.BoxGeometry(big ? 1.5 : 1.1, big ? 0.5 : 0.35, big ? 2.6 : 1.7), big ? pink : mat(0xa070ff)); body.position.set(0, big ? 0.45 : 0.3, 0); g.add(body);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.25), white); seat.position.set(0, big ? 0.85 : 0.6, -0.4); g.add(seat);
    if (big) { const ws = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.4, 0.05), mat(0xbfe9ff, { transparent: true, opacity: 0.6 })); ws.position.set(0, 0.9, 0.55); ws.rotation.x = -0.3; g.add(ws); const st = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 6, 14), dark); st.position.set(0, 0.95, 0.35); st.rotation.x = -0.8; g.add(st); [-0.55, 0.55].forEach(x => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), gold); l.position.set(x, 0.5, 1.3); g.add(l); }); }
    const r = big ? 0.3 : 0.22, wx = big ? 0.78 : 0.6, wz = big ? 0.9 : 0.6;
    [[-wx, wz], [wx, wz], [-wx, -wz], [wx, -wz]].forEach(([x, z]) => wheel(x, z, r));
  }
  g.userData.seated = kind === 'kart' || kind === 'convertible';
  g.userData.lift = kind === 'skates' ? 0.12 : kind === 'scooter' ? 0.17 : kind === 'bike' ? 0.55 : kind === 'kart' ? 0.25 : 0.4;
  return g;
}
