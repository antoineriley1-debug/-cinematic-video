// Main game: renderer, player controller (touch + keyboard), camera, AI players, objectives, level flow.
'use strict';

const Game = {
  running: false,
  level: 1,
  W: null,

  init() {
    const canvas = $('game');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 600);
    this.clock = new THREE.Clock();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 200));

    this.input = { jx: 0, jy: 0, keys: {}, jumpQueued: 0, yaw: 0, pitch: 0.38 };
    this.setupInput();

    // Player
    this.player = {
      pos: new THREE.Vector3(), vy: 0, onGround: true, lastGround: 0, facing: 0, walk: 0,
      mesh: makePrincess({ dress: 0xff4fa3, hair: 0x5a2d1a, skin: SKIN[0] }),
    };
    this.player.shadow = makeShadow(0.65);
    // sparkle trail
    const spGeo = new THREE.BufferGeometry();
    this.sparkN = 30; this.sparkPos = new Float32Array(this.sparkN * 3); this.sparkLife = new Float32Array(this.sparkN); this.sparkI = 0;
    spGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPos, 3));
    this.sparks = new THREE.Points(spGeo, new THREE.PointsMaterial({ color: 0xffe0f5, size: 0.25, transparent: true, opacity: 0.9 }));
    this.sparks.frustumCulled = false;

    this.camPos = new THREE.Vector3();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
    // Attract-mode world behind the title screen
    this.buildLevel(Save.data.current || 1, true);
  },

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 72 : 60;
    this.camera.updateProjectionMatrix();
  },

  // ---------- input ----------
  setupInput() {
    const joy = $('joystick'), stick = $('stick');
    let joyId = null, jc = { x: 0, y: 0 };
    const joyR = 55;
    const setStick = (dx, dy) => {
      const d = Math.hypot(dx, dy), k = d > joyR ? joyR / d : 1;
      dx *= k; dy *= k;
      stick.style.transform = `translate(${dx}px, ${dy}px)`;
      this.input.jx = dx / joyR; this.input.jy = -dy / joyR;
    };
    joy.addEventListener('pointerdown', (e) => {
      Sound.unlock();
      joyId = e.pointerId; joy.setPointerCapture(e.pointerId);
      const r = joy.getBoundingClientRect(); jc = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      setStick(e.clientX - jc.x, e.clientY - jc.y); e.preventDefault();
    });
    joy.addEventListener('pointermove', (e) => { if (e.pointerId === joyId) setStick(e.clientX - jc.x, e.clientY - jc.y); });
    const joyEnd = (e) => { if (e.pointerId === joyId) { joyId = null; setStick(0, 0); } };
    joy.addEventListener('pointerup', joyEnd); joy.addEventListener('pointercancel', joyEnd); joy.addEventListener('lostpointercapture', joyEnd);

    // camera look: drag on the 3D view
    const canvas = $('game');
    const looks = new Map();
    canvas.addEventListener('pointerdown', (e) => { Sound.unlock(); looks.set(e.pointerId, { x: e.clientX, y: e.clientY }); canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', (e) => {
      const p = looks.get(e.pointerId); if (!p) return;
      this.input.yaw -= (e.clientX - p.x) * 0.006;
      this.input.pitch = Math.max(0.08, Math.min(1.2, this.input.pitch + (e.clientY - p.y) * 0.004));
      p.x = e.clientX; p.y = e.clientY;
    });
    const lookEnd = (e) => looks.delete(e.pointerId);
    canvas.addEventListener('pointerup', lookEnd); canvas.addEventListener('pointercancel', lookEnd);

    const jump = $('btn-jump');
    jump.addEventListener('pointerdown', (e) => { Sound.unlock(); this.input.jumpQueued = 0.15; e.preventDefault(); });
    $('btn-action').addEventListener('click', () => { Sound.unlock(); this.doAction(); });
    $('btn-menu').onclick = () => { Sound.tap(); UI.showMenu(); };
    $('btn-store').onclick = () => { Sound.tap(); UI.showStore(); };

    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      this.input.keys[e.code] = true;
      if (e.code === 'Space') { this.input.jumpQueued = 0.15; e.preventDefault(); }
      if (e.code === 'KeyE' || e.code === 'Enter') this.doAction();
      if (e.code === 'Escape' && this.running) UI.modalOpen ? null : UI.showMenu();
    });
    window.addEventListener('keyup', (e) => { this.input.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.input.keys = {}; });
  },

  // ---------- level lifecycle ----------
  buildLevel(level, attract = false) {
    if (this.W) { this.W.root.remove(this.player.mesh, this.player.shadow, this.sparks); World.dispose(this.scene, this.W); }
    this.level = level;
    this.W = World.build(this.scene, level);
    const W = this.W;
    this.state = attract ? { level, gems: [], keys: [], friends: [], crown: false } : Save.levelState(level);
    // restore progress
    W.gems.forEach(g => { if (this.state.gems.includes(g.id)) { g.taken = true; g.mesh.visible = false; } });
    W.portals.forEach(p => { if (this.state.keys.includes(p.index)) this.markPortalDone(p); });
    if (this.state.crown) W.crown.visible = false;

    W.root.add(this.player.mesh); W.root.add(this.player.shadow); W.root.add(this.sparks);
    this.player.pos.set(W.spawn.x, 0, W.spawn.z);
    this.player.vy = 0; this.player.facing = Math.PI;
    this.input.yaw = 0;
    this.camPos.set(W.spawn.x, 8, W.spawn.z + 12);

    this.spawnNPCs();
    this.portalCooldown = new Set();
    this.doorOpened = false;
    if (this.allDone()) this.openDoor(true);
    this.nearby = null;
    this.bubbleTimer = 2;
  },

  startLevel(level) {
    level = Math.max(1, Math.min(TOTAL_LEVELS, level));
    Save.data.current = level; Save.write();
    UI.hideTitle();
    this.buildLevel(level);
    this.running = true;
    UI.setLevelHud(level);
    this.updateObjectives();
    const th = themeFor(level), tr = tierFor(level), cfg = this.W.cfg;
    UI.open(`<h2>Level ${level}</h2><div class="result-big">${tr.icon}</div>
      <p class="center" style="font-size:24px;font-weight:800;color:#8f4dff">${esc(th.name)}</p>
      <p class="center muted">${esc(tr.name)} · Tier ${tierIndexFor(level) + 1}</p>
      <div style="font-size:20px;line-height:1.7;max-width:420px;margin:0 auto">
        💎 Collect <b>${cfg.gems}</b> gems<br>🔑 Win <b>${cfg.keys}</b> keys in the learning portals<br>
        💬 Help <b>${cfg.friends}</b> friend${cfg.friends > 1 ? 's' : ''} with a <b>!</b><br>🗼 Climb the tower to get the 👑 crown<br>🏰 Then open the castle door!</div>
      <p class="affirm">“${esc(th.msg)}”</p>
      <div class="row-btns"><button class="big-btn pink" id="lv-go">Let's go! 👑</button></div>`);
    Voice.speak(`Level ${level}. ${th.name}. ${th.msg}`);
    $('lv-go').onclick = () => {
      UI.close();
      if (!Save.data.seenHelp) { Save.data.seenHelp = true; Save.write(); UI.showHelp(); }
    };
  },

  stop() { this.running = false; },

  // ---------- NPCs ----------
  spawnNPCs() {
    const W = this.W, cfg = W.cfg;
    const rand = mulberry32(this.level * 31 + 5);
    this.npcs = [];
    const names = shuffle(NPC_NAMES);
    const total = cfg.npcs + cfg.friends;
    for (let i = 0; i < total; i++) {
      const isFriend = i < cfg.friends;
      const name = names[i % names.length];
      const knight = /^(Sir|Knight|Prince)/.test(name);
      const look = { dress: DRESS[(i * 3 + this.level) % DRESS.length], hair: HAIR[(i * 5 + this.level) % HAIR.length], skin: SKIN[(i * 7 + this.level) % SKIN.length], crown: !knight };
      const mesh = knight ? makeKnight(look) : makePrincess(look);
      const sh = makeShadow(0.6);
      let x, z;
      if (isFriend) ({ x, z } = W.friendSpots[i]);
      else { x = (rand() * 2 - 1) * W.S * 0.8; z = (rand() * 2 - 1) * W.S * 0.8; }
      const label = makeLabel(name, { height: 0.5, color: '#7a3b63' }); label.position.y = 2.75; mesh.add(label);
      let mark = null;
      if (isFriend) {
        mark = makeLabel(this.state.friends.includes(i) ? '💖' : '❗', { height: 0.9, bg: 'rgba(255,255,255,0)' });
        mark.position.y = 3.5; mesh.add(mark);
      }
      W.root.add(mesh); W.root.add(sh);
      const n = { i, name, mesh, shadow: sh, label, mark, friend: isFriend, x, z, y: 0, vy: 0, heading: rand() * 6.28,
        target: null, speed: 2.2 + rand() * 1.8, wait: rand() * 2, walk: rand() * 6, hidden: 0, gifted: false };
      this.npcs.push(n);
    }
  },

  pickNpcTarget(n) {
    const W = this.W, r = Math.random();
    if (r < 0.3 && W.portals.length) { const p = pick(W.portals); return { x: p.x, z: p.z, portal: true }; }
    if (r < 0.4) return { x: W.tower.x + 4.5, z: W.tower.z + 1 };
    if (r < 0.55) { const g = W.gems.find(g => !g.taken); if (g) return { x: g.x, z: g.z }; }
    if (r < 0.65) return { x: this.player.pos.x + (Math.random() - 0.5) * 8, z: this.player.pos.z + (Math.random() - 0.5) * 8 };
    return { x: (Math.random() * 2 - 1) * W.S * 0.85, z: (Math.random() * 2 - 1) * W.S * 0.85 };
  },

  npcBlocked(x, z) {
    const W = this.W, c = W.castle;
    if (Math.abs(x - c.x) < c.half + 2.5 && z > c.z - c.half - 6 && z < c.z + c.half + 1.5) return true;
    if (Math.hypot(x - W.tower.x, z - W.tower.z) < 2) return true;
    return Math.hypot(x, z) > W.S - 1;
  },

  updateNPCs(dt, t) {
    for (const n of this.npcs) {
      if (n.hidden > 0) { // "inside" a portal playing a game
        n.hidden -= dt;
        if (n.hidden <= 0) { n.mesh.visible = true; n.shadow.visible = true; n.mesh.scale.setScalar(0.01); }
        continue;
      }
      if (n.mesh.scale.x < 1) n.mesh.scale.setScalar(Math.min(1, n.mesh.scale.x + dt * 2));
      let moving = false;
      const dp = Math.hypot(this.player.pos.x - n.x, this.player.pos.z - n.z);
      if (n.friend) {
        // friends wait in place and face the player when near
        if (dp < 8) n.heading = Math.atan2(this.player.pos.x - n.x, this.player.pos.z - n.z);
      } else if (n.wait > 0) {
        n.wait -= dt;
        if (dp < 4) n.heading = Math.atan2(this.player.pos.x - n.x, this.player.pos.z - n.z);
      } else {
        if (!n.target) n.target = this.pickNpcTarget(n);
        const dx = n.target.x - n.x, dz = n.target.z - n.z, d = Math.hypot(dx, dz);
        if (d < 1.2) {
          if (n.target.portal && Math.random() < 0.7) { n.hidden = 3 + Math.random() * 5; n.mesh.visible = false; n.shadow.visible = false; }
          n.target = null; n.wait = 1 + Math.random() * 4;
        } else {
          const want = Math.atan2(dx, dz);
          let da = want - n.heading; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283;
          n.heading += Math.max(-3 * dt, Math.min(3 * dt, da));
          const nx = n.x + Math.sin(n.heading) * n.speed * dt, nz = n.z + Math.cos(n.heading) * n.speed * dt;
          if (this.npcBlocked(nx, nz)) { n.target = null; n.heading += Math.PI * 0.5; }
          else { n.x = nx; n.z = nz; moving = true; }
          if (n.y <= this.groundAt(n.x, n.z, n.y + 1, 0.3) + 0.01 && Math.random() < dt * 0.35) n.vy = 8;
        }
      }
      // simple vertical: hop and settle on top of whatever is below
      const gh = this.groundAt(n.x, n.z, n.y + 1, 0.3);
      n.vy -= 28 * dt; n.y += n.vy * dt;
      if (n.y < gh) { n.y = gh; n.vy = 0; }
      n.walk += moving ? dt * 10 : 0;
      n.mesh.position.set(n.x, n.y + (moving ? Math.abs(Math.sin(n.walk)) * 0.08 : 0), n.z);
      n.mesh.rotation.y = n.heading;
      const arms = n.mesh.userData.arms;
      if (arms) { arms[0].rotation.x = moving ? Math.sin(n.walk) * 0.7 : Math.sin(t * 2 + n.i) * 0.08; arms[1].rotation.x = -arms[0].rotation.x; }
      if (n.friend && !this.state.friends.includes(n.i)) { arms[1].rotation.z = 2.5 + Math.sin(t * 6) * 0.4; } // waving for help
      n.shadow.position.set(n.x, gh + 0.03, n.z);
      if (n.mark) n.mark.position.y = 3.5 + Math.sin(t * 3) * 0.15;
    }
  },

  // ---------- physics helpers ----------
  groundAt(x, z, feet, r = 0.4) {
    let h = 0;
    for (const c of this.W.colliders) {
      if (x + r > c.x1 && x - r < c.x2 && z + r > c.z1 && z - r < c.z2 && c.y2 <= feet + 0.4 && c.y2 > h) h = c.y2;
    }
    return h;
  },
  blocked(x, z, feet, r = 0.45) {
    for (const c of this.W.colliders) {
      if (x + r > c.x1 && x - r < c.x2 && z + r > c.z1 && z - r < c.z2 && c.y2 > feet + 0.4 && c.y1 < feet + 1.8) return true;
    }
    return false;
  },

  updatePlayer(dt, t) {
    const P = this.player, I = this.input, W = this.W;
    // input -> camera-relative direction
    let jx = I.jx, jy = I.jy;
    const k = I.keys;
    if (k.KeyW || k.ArrowUp) jy = 1; if (k.KeyS || k.ArrowDown) jy = -1;
    if (k.KeyA || k.ArrowLeft) jx = -1; if (k.KeyD || k.ArrowRight) jx = 1;
    const mag = Math.min(1, Math.hypot(jx, jy));
    const fx = -Math.sin(I.yaw), fz = -Math.cos(I.yaw), rx = Math.cos(I.yaw), rz = -Math.sin(I.yaw);
    let mx = rx * jx + fx * jy, mz = rz * jx + fz * jy;
    const ml = Math.hypot(mx, mz);
    const speed = 7.5;
    if (ml > 0.05) {
      mx = mx / ml * mag * speed; mz = mz / ml * mag * speed;
      const want = Math.atan2(mx, mz);
      let da = want - P.facing; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283;
      P.facing += da * Math.min(1, dt * 12);
    } else { mx = mz = 0; }

    // horizontal move with per-axis collision
    const feet = P.pos.y;
    const nx = P.pos.x + mx * dt;
    if (!this.blocked(nx, P.pos.z, feet)) P.pos.x = nx;
    const nz = P.pos.z + mz * dt;
    if (!this.blocked(P.pos.x, nz, feet)) P.pos.z = nz;
    // keep inside the kingdom
    const dc = Math.hypot(P.pos.x, P.pos.z), lim = W.S - 0.5;
    if (dc > lim) { P.pos.x *= lim / dc; P.pos.z *= lim / dc; }

    // jump (with coyote time + input buffer so it feels forgiving on a tablet)
    if (P.onGround) P.lastGround = t;
    if (I.jumpQueued > 0) {
      I.jumpQueued -= dt;
      if (P.onGround || t - P.lastGround < 0.15) { P.vy = 11.2; P.onGround = false; P.lastGround = -1; I.jumpQueued = 0; Sound.jump(); }
    }
    P.vy -= 28 * dt;
    P.pos.y += P.vy * dt;
    const gh = this.groundAt(P.pos.x, P.pos.z, Math.max(feet, P.pos.y));
    if (P.pos.y <= gh) { P.pos.y = gh; P.vy = 0; P.onGround = true; } else P.onGround = P.pos.y - gh < 0.02;

    // animate
    const moving = ml > 0.05;
    P.walk += moving ? dt * 12 : 0;
    const m = P.mesh;
    m.position.set(P.pos.x, P.pos.y + (moving && P.onGround ? Math.abs(Math.sin(P.walk)) * 0.1 : 0), P.pos.z);
    m.rotation.y = P.facing;
    const arms = m.userData.arms;
    arms[0].rotation.x = moving ? Math.sin(P.walk) * 0.8 : 0; arms[1].rotation.x = -arms[0].rotation.x;
    if (!P.onGround) { arms[0].rotation.z = -0.8; arms[1].rotation.z = 0.8; } else { arms[0].rotation.z = arms[1].rotation.z = 0; }
    P.shadow.position.set(P.pos.x, gh + 0.03, P.pos.z);
    P.shadow.scale.setScalar(Math.max(0.4, 1 - (P.pos.y - gh) * 0.12));

    // sparkle trail
    if (moving) {
      const i = this.sparkI = (this.sparkI + 1) % this.sparkN;
      this.sparkPos[i * 3] = P.pos.x + (Math.random() - 0.5) * 0.6;
      this.sparkPos[i * 3 + 1] = P.pos.y + 0.2 + Math.random() * 0.4;
      this.sparkPos[i * 3 + 2] = P.pos.z + (Math.random() - 0.5) * 0.6;
    }
    for (let i = 0; i < this.sparkN; i++) this.sparkPos[i * 3 + 1] += dt * 0.6;
    this.sparks.geometry.attributes.position.needsUpdate = true;
  },

  updateCamera(dt) {
    const P = this.player, I = this.input;
    const dist = 10, h = Math.sin(I.pitch) * dist, flat = Math.cos(I.pitch) * dist;
    const tx = P.pos.x + Math.sin(I.yaw) * flat, ty = P.pos.y + 1.5 + h, tz = P.pos.z + Math.cos(I.yaw) * flat;
    const a = 1 - Math.exp(-dt * 10);
    this.camPos.x += (tx - this.camPos.x) * a; this.camPos.y += (ty - this.camPos.y) * a; this.camPos.z += (tz - this.camPos.z) * a;
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(P.pos.x, P.pos.y + 1.6, P.pos.z);
  },

  // ---------- objectives ----------
  allDone() {
    const s = this.state, c = this.W.cfg;
    return s.gems.length >= c.gems && s.keys.length >= c.keys && s.friends.length >= c.friends && s.crown;
  },

  saveState() { if (this.running) Save.write(); },

  checkPickups(t) {
    const P = this.player, W = this.W, s = this.state;
    for (const g of W.gems) {
      if (g.taken) continue;
      g.mesh.rotation.y = t * 2 + g.id; g.mesh.position.y = g.y + Math.sin(t * 3 + g.id) * 0.15;
      if (Math.abs(P.pos.x - g.x) < 1.2 && Math.abs(P.pos.z - g.z) < 1.2 && Math.abs(P.pos.y + 0.9 - g.y) < 1.6) {
        g.taken = true; g.mesh.visible = false; s.gems.push(g.id);
        Sound.gem(); Save.addCoins(1, 'gem');
        if (s.gems.length === W.cfg.gems) { UI.toast('💎 All gems found!'); Voice.speak('You found all the gems!'); }
        this.afterProgress();
      }
    }
    if (!s.crown) {
      const c = W.crownPos;
      W.crown.rotation.y = t * 1.5;
      if (Math.hypot(P.pos.x - c.x, P.pos.z - c.z) < 1.8 && Math.abs(P.pos.y + 1 - c.y) < 1.8) {
        s.crown = true; W.crown.visible = false;
        Sound.fanfare(); const n = Save.addCoins(10 + this.level * 0.2, 'crown');
        UI.toast(`👑 You climbed the tower! +${n} 🪙`); Voice.speak('You climbed all the way to the top! You are so brave!');
        this.afterProgress();
      }
    }
  },

  afterProgress() {
    this.saveState();
    this.updateObjectives();
    if (!this.doorOpened && this.allDone()) this.openDoor(false);
  },

  openDoor(instant) {
    this.doorOpened = true;
    const d = this.W.door;
    d.open = true;
    this.W.colliders = this.W.colliders.filter(c => c !== d.collider);
    if (instant) d.hinge.rotation.y = Math.PI * 0.48;
    else {
      Sound.door();
      UI.toast('🏰 The castle door is OPEN!'); setTimeout(() => UI.toast('Walk through the magic portal inside ✨'), 1200);
      Voice.speak('Amazing! The castle door is open! Go inside to the magic portal.');
    }
  },

  updateObjectives() {
    const s = this.state, c = this.W.cfg;
    const row = (icon, label, have, need) => `<div class="row ${have >= need ? 'done' : ''}"><span>${icon} ${label}</span><span>${have >= need ? '✅' : Math.min(have, need) + '/' + need}</span></div>`;
    let html = '<div class="title">Quest</div>' +
      row('💎', 'Gems', s.gems.length, c.gems) +
      row('🔑', 'Keys', s.keys.length, c.keys) +
      row('💬', 'Help friends', s.friends.length, c.friends) +
      row('👑', 'Tower crown', s.crown ? 1 : 0, 1);
    if (this.allDone()) html += '<div class="go">🏰 Go to the castle!</div>';
    $('objectives').innerHTML = html;
  },

  // ---------- interactions ----------
  findNearby() {
    const P = this.player, W = this.W;
    let best = null, bd = 1e9;
    for (const p of W.portals) {
      const d = Math.hypot(P.pos.x - p.x, P.pos.z - p.z);
      if (d < 3.6 && d < bd && P.pos.y < 3) { best = { type: 'portal', p }; bd = d; }
    }
    for (const n of this.npcs) {
      if (n.hidden > 0) continue;
      const d = Math.hypot(P.pos.x - n.x, P.pos.z - n.z);
      if (d < 3 && d < bd + (n.friend ? 1.5 : 0)) { best = { type: 'npc', n }; bd = d; }
    }
    const lp = W.levelPortal;
    if (this.doorOpened && Math.hypot(P.pos.x - lp.x, P.pos.z - lp.z) < 3) best = { type: 'level' };
    return best;
  },

  updateAction() {
    const nb = this.findNearby();
    this.nearby = nb;
    const btn = $('btn-action');
    if (!nb) { btn.classList.add('hidden'); return; }
    btn.classList.remove('hidden');
    if (nb.type === 'portal') {
      const g = GAMES[nb.p.key], done = this.state.keys.includes(nb.p.index);
      btn.textContent = `${g.icon} ${done ? 'Play again' : 'Play ' + g.name}`;
    } else if (nb.type === 'npc') {
      const n = nb.n;
      btn.textContent = n.friend && !this.state.friends.includes(n.i) ? `❗ Help ${n.name}` : `💬 Talk to ${n.name}`;
    } else btn.textContent = '✨ Next Level!';
  },

  doAction() {
    if (!this.running || UI.modalOpen || !this.nearby) return;
    const nb = this.nearby;
    if (nb.type === 'portal') this.enterPortal(nb.p);
    else if (nb.type === 'npc') this.talkTo(nb.n);
    else if (nb.type === 'level') this.completeLevel();
  },

  // Walking right through a portal's ring also enters it.
  autoEnter() {
    const P = this.player;
    for (const p of this.W.portals) {
      const d = Math.hypot(P.pos.x - p.x, P.pos.z - p.z);
      if (d > 4.5) this.portalCooldown.delete(p.index);
      else if (d < 1.1 && P.pos.y < 2 && !this.portalCooldown.has(p.index)) { this.portalCooldown.add(p.index); this.enterPortal(p); return; }
    }
    const lp = this.W.levelPortal;
    if (this.doorOpened && Math.hypot(P.pos.x - lp.x, P.pos.z - lp.z) < 1.4) this.completeLevel();
  },

  enterPortal(p) {
    this.portalCooldown.add(p.index);
    const done = this.state.keys.includes(p.index);
    Sound.door();
    this.input.jx = this.input.jy = 0;
    MiniGames.play(p.key, this.level, {
      practice: done,
      onDone: (won) => {
        if (won && !done) {
          this.state.keys.push(p.index);
          this.markPortalDone(p);
          UI.toast(`🔑 Key ${this.state.keys.length}/${this.W.cfg.keys}!`);
          this.afterProgress();
        }
        this.portalCooldown.add(p.index);
      },
    });
  },

  markPortalDone(p) {
    p.ring.material = mat(0xffd700, { emissive: 0x664400 });
    p.group.remove(p.label);
    p.label = makeLabel(`⭐ ${GAMES[p.key].name}`, { height: 0.95, color: '#b8860b' }); p.label.position.y = 5.1; p.group.add(p.label);
  },

  talkTo(n) {
    const s = this.state;
    if (n.friend && !s.friends.includes(n.i)) return this.friendQuest(n);
    const line = pick(NPC_CHATTER);
    let gift = '';
    if (!n.gifted && Math.random() < 0.5) { n.gifted = true; const c = Save.addCoins(3, 'gift'); gift = `<p class="center" style="font-size:20px">${esc(n.name)} gave you 🪙 ${c}!</p>`; }
    UI.open(`<h2>💬 ${esc(n.name)}</h2><div class="result-big">${/^(Sir|Knight|Prince)/.test(n.name) ? '🛡️' : '👸'}</div>
      <p class="center" style="font-size:24px">“${esc(line)}”</p>${gift}
      <div class="row-btns"><button class="big-btn pink" id="t-ok">Bye ${esc(n.name)}! 👋</button></div>`);
    Voice.speak(line);
    $('t-ok').onclick = () => UI.close();
  },

  friendQuest(n) {
    const gens = [genHeart, genScience, genRead, genMath, genCount];
    const q = pick(gens)(this.level);
    const ask = () => {
      UI.open(`<h2>❗ ${esc(n.name)} needs help!</h2>
        ${q.story ? `<div class="mg-story">${esc(q.story)}</div>` : ''}
        <div class="mg-prompt">${esc(q.prompt)} <button class="speak" id="f-say">🔊</button></div>
        ${q.visual ? `<div class="mg-visual">${esc(q.visual)}</div>` : ''}
        <div class="choices" ${q.choices.length === 3 ? 'style="grid-template-columns:1fr"' : ''}>${q.choices.map((c, k) => `<button class="choice" data-k="${k}">${esc(c)}</button>`).join('')}</div>`);
      const say = () => Voice.speak(`${n.name} asks: ` + (q.story ? q.story + ' ' : '') + q.prompt);
      $('f-say').onclick = say; say();
      document.querySelectorAll('.choice').forEach(b => b.onclick = () => {
        const ok = q.choices[+b.dataset.k] === q.answer;
        Save.recordAnswer('Helping friends', ok);
        if (ok) {
          Sound.right();
          this.state.friends.push(n.i);
          n.mark.material.map.dispose();
          n.mesh.remove(n.mark); n.mark = makeLabel('💖', { height: 0.9, bg: 'rgba(255,255,255,0)' }); n.mark.position.y = 3.5; n.mesh.add(n.mark);
          const c = Save.addCoins(8 + this.level * 0.15, 'friend');
          UI.open(`<h2>💖 Thank you!</h2><div class="result-big">🤗</div>
            <p class="center" style="font-size:22px">“You helped me so much! You are a true princess!”</p>
            <p class="center" style="font-size:20px">🪙 +${c}</p>
            <div class="row-btns"><button class="big-btn pink" id="f-ok">You're welcome!</button></div>`);
          Voice.speak('Thank you! You helped me so much! You are a true princess!');
          $('f-ok').onclick = () => UI.close();
          this.afterProgress();
        } else {
          Sound.wrong();
          b.classList.add('wrong');
          document.querySelectorAll('.choice').forEach(c => { if (q.choices[+c.dataset.k] === q.answer) c.classList.add('right'); });
          const p = document.createElement('div'); p.className = 'row-btns';
          p.innerHTML = '<p class="affirm" style="width:100%">Good try! Let\'s try a different one. 🌱</p><button class="big-btn purple" id="f-again">Try another</button>';
          $('modal-box').appendChild(p);
          Voice.speak('Good try! The answer was ' + q.answer + '. Let us try a different one.');
          document.querySelectorAll('.choice').forEach(c => c.disabled = true);
          $('f-again').onclick = () => this.friendQuest(n);
        }
      });
    };
    ask();
  },

  completeLevel() {
    if (this.completing) return;
    this.completing = true;
    const lv = this.level;
    const wasDone = Save.data.completed.includes(lv);
    const coins = Save.addCoins(wasDone ? 10 : 20 + lv, 'level');
    Save.completeLevel(lv);
    const tierUp = lv % LEVELS_PER_TIER === 0;
    const worldUp = lv % LEVELS_PER_THEME === 0;
    let bonus = 0;
    if (tierUp && !wasDone) bonus = Save.addCoins(50 + lv, 'tier');
    Sound.fanfare();
    const tr = tierFor(lv), next = Math.min(TOTAL_LEVELS, lv + 1), ntr = tierFor(next);
    const aff = pick(AFFIRMATIONS);
    let html;
    if (lv === TOTAL_LEVELS) {
      html = `<h2>👑 You are the QUEEN OF KINGDOMS! 👑</h2><div class="result-big">👑🐉🏰</div>
        <p class="affirm">You finished all 100 levels! You are smart, brave, kind, and a true leader.</p>
        <p class="center" style="font-size:22px">🪙 +${coins + bonus}</p>
        <div class="row-btns"><button class="big-btn pink" id="lc-map">🗺️ Replay any level</button></div>`;
      Voice.speak('You are the queen of kingdoms! You finished all one hundred levels! You are smart, brave, kind, and a true leader.');
    } else {
      html = `<h2>🎉 Level ${lv} Complete!</h2><div class="result-big">${tierUp ? ntr.icon : '⭐⭐⭐'}</div>
        <p class="affirm">${esc(aff)}</p>
        ${tierUp ? `<p class="center" style="font-size:24px;font-weight:800;color:${ntr.color}">NEW TIER! You are now a ${esc(ntr.icon + ' ' + ntr.name)}!<br><span style="font-size:18px">Tier bonus 🪙 +${bonus}</span></p>` : ''}
        ${worldUp && !tierUp ? `<p class="center" style="font-size:20px">🌍 New world unlocked: <b>${esc(themeFor(next).name)}</b>!</p>` : ''}
        <p class="center" style="font-size:22px">🪙 +${coins}</p>
        <div class="row-btns"><button class="big-btn pink" id="lc-next">Level ${next} ➜</button></div>
        <div class="row-btns"><button class="mid-btn" id="lc-store">🛍️ Rewards</button><button class="mid-btn" id="lc-map">🗺️ Levels</button></div>`;
      Voice.speak(`Level ${lv} complete! ${aff}` + (tierUp ? ` You are now a ${ntr.name}!` : ''));
    }
    UI.open(html, { closable: false });
    const go = (fn) => () => { this.completing = false; UI.close(); fn(); };
    if ($('lc-next')) $('lc-next').onclick = go(() => this.startLevel(next));
    if ($('lc-store')) $('lc-store').onclick = go(() => { this.startLevel(next); UI.showStore(); });
    $('lc-map').onclick = () => { this.completing = false; UI.showLevels(); };
  },

  // ---------- minimap ----------
  drawMinimap() {
    const cv = $('minimap'), ctx = cv.getContext('2d'), W = this.W, P = this.player;
    const size = cv.width, half = size / 2, sc = (half - 6) / W.S;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath(); ctx.arc(half, half, half, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#' + new THREE.Color(W.theme.ground).getHexString(); ctx.globalAlpha = 0.6; ctx.fillRect(0, 0, size, size); ctx.globalAlpha = 1;
    const pt = (x, z) => [half + x * sc, half + z * sc];
    const dot = (x, z, r, col) => { const [a, b] = pt(x, z); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(a, b, r, 0, Math.PI * 2); ctx.fill(); };
    // castle
    const [cx, cz] = pt(W.castle.x - W.castle.half, W.castle.z - W.castle.half);
    ctx.fillStyle = this.doorOpened ? '#ffd700' : '#ff69b4'; ctx.fillRect(cx, cz, W.castle.half * 2 * sc, W.castle.half * 2 * sc);
    // tower
    dot(W.tower.x, W.tower.z, 5, this.state.crown ? '#bbb' : '#8f4dff');
    W.gems.forEach(g => { if (!g.taken) dot(g.x, g.z, 2, '#ff2e93'); });
    W.portals.forEach(p => dot(p.x, p.z, 4, this.state.keys.includes(p.index) ? '#ffd700' : '#' + new THREE.Color(GAMES[p.key].color).getHexString()));
    this.npcs.forEach(n => { if (n.hidden <= 0) dot(n.x, n.z, n.friend && !this.state.friends.includes(n.i) ? 4 : 2, n.friend && !this.state.friends.includes(n.i) ? '#ff9f43' : '#ffffff'); });
    // player arrow
    const [px, pz] = pt(P.pos.x, P.pos.z);
    ctx.translate(px, pz); ctx.rotate(-P.facing + Math.PI);
    ctx.fillStyle = '#5a2346'; ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
    ctx.restore();
  },

  // ---------- main loop ----------
  loop() {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    const W = this.W;
    if (!W) return;
    const active = this.running && !UI.modalOpen;
    if (active) {
      this.updatePlayer(dt, t);
      this.checkPickups(t);
      this.autoEnter();
      this.updateAction();
      this.mmTimer = (this.mmTimer || 0) - dt;
      if (this.mmTimer <= 0) { this.mmTimer = 0.1; this.drawMinimap(); }
    } else if (!this.running) {
      // title screen: slow orbit around the kingdom
      const a = t * 0.08;
      this.camera.position.set(Math.sin(a) * W.S * 0.8, 22, Math.cos(a) * W.S * 0.8);
      this.camera.lookAt(0, 2, 0);
    }
    if (this.running) this.updateCamera(dt);
    this.updateNPCs(dt, t);
    // ambient animation
    W.portals.forEach(p => { p.disc.rotation.z = t; p.ring.rotation.z = Math.sin(t) * 0.1; });
    W.levelPortal.disc.material.opacity = this.doorOpened ? 0.6 + Math.sin(t * 4) * 0.25 : 0.25;
    W.levelPortal.ring.rotation.z = t * 0.5;
    if (W.door.open && W.door.hinge.rotation.y < Math.PI * 0.48) W.door.hinge.rotation.y += dt * 1.2;
    W.animated.forEach(a => { a.obj.position.x += a.speed * dt; if (a.obj.position.x > W.S * 1.5) a.obj.position.x = -W.S * 1.5; });
    W.dragons.forEach(d => {
      const a = t * d.speed + d.phase;
      d.obj.position.set(d.cx + Math.cos(a) * d.r, d.h + Math.sin(t * 2 + d.phase) * 0.6, d.cz + Math.sin(a) * d.r);
      d.obj.rotation.y = -a;
      d.obj.userData.wings.forEach((w, i) => w.rotation.z = (i ? -1 : 1) * Math.sin(t * 10 + d.phase) * 0.6);
    });
    this.renderer.render(this.scene, this.camera);
  },
};

// ---------- boot ----------
window.addEventListener('load', () => {
  Game.init();
  UI.showTitle();
  $('btn-play').onclick = () => { Sound.unlock(); Sound.tap(); Game.startLevel(Save.data.levelState ? Save.data.levelState.level : Save.data.current || 1); };
  $('btn-levels').onclick = () => { Sound.unlock(); UI.showLevels(); };
  $('btn-store-title').onclick = () => { Sound.unlock(); UI.showStore(); };
  $('btn-parent-title').onclick = () => { Sound.unlock(); UI.showParentGate(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden && Game.running && !UI.modalOpen) UI.showMenu(); });
});
