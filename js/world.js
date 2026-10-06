// Builds the 3D world for a level: terrain, castle + door, climbing tower, portals, gems, decorations, characters.
'use strict';

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const MatCache = {};
function mat(color, opts) {
  const key = color + (opts ? JSON.stringify(opts) : '');
  if (!MatCache[key]) MatCache[key] = new THREE.MeshLambertMaterial(Object.assign({ color }, opts || {}));
  return MatCache[key];
}

function makeLabel(text, opts = {}) {
  const fs = opts.size || 44;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = `800 ${fs}px "Avenir Next", "Trebuchet MS", sans-serif`;
  const w = Math.ceil(ctx.measureText(text).width) + fs;
  c.width = w; c.height = fs * 1.6;
  ctx.font = `800 ${fs}px "Avenir Next", "Trebuchet MS", sans-serif`;
  ctx.fillStyle = opts.bg || 'rgba(255,255,255,0.88)';
  const r = c.height / 2;
  ctx.beginPath();
  ctx.moveTo(r, 0); ctx.lineTo(w - r, 0); ctx.arc(w - r, r, r, -Math.PI / 2, Math.PI / 2); ctx.lineTo(r, c.height); ctx.arc(r, r, r, Math.PI / 2, -Math.PI / 2); ctx.fill();
  ctx.fillStyle = opts.color || '#c2185b';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, c.height / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: opts.depthTest !== false, transparent: true }));
  const h = opts.height || 0.8;
  sp.scale.set(h * w / c.height, h, 1);
  return sp;
}

// ---------- characters ----------
const SKIN = [0xffe0bd, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac];
const HAIR = [0x3b2314, 0xffd36b, 0x8b4513, 0x1a1a1a, 0xd2691e, 0xff7ab8, 0xb388ff, 0xf5e6c8];
const DRESS = [0xff69b4, 0xb388ff, 0x7ad7f0, 0xffb347, 0x9be59b, 0xff6b6b, 0xfff07a, 0xff9ff3, 0x48dbfb];

function makePrincess(o = {}) {
  const g = new THREE.Group();
  const dress = mat(o.dress || 0xff69b4), skin = mat(o.skin || SKIN[0]), hair = mat(o.hair || HAIR[0]);
  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.15, 14), dress); skirt.position.y = 0.6; g.add(skirt);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.5, 10), dress); torso.position.y = 1.25; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), skin); head.position.y = 1.75; g.add(head);
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.37, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), hair);
  hairCap.position.set(0, 1.8, -0.03); g.add(hairCap);
  const pony = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.55, 4, 8), hair); pony.position.set(0, 1.45, -0.3); pony.rotation.x = 0.25; g.add(pony);
  const eyeM = mat(0x2d1b2e);
  [-0.12, 0.12].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), eyeM); e.position.set(x, 1.78, 0.3); g.add(e); });
  const cheek = mat(0xff9ec4);
  [-0.2, 0.2].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), cheek); e.position.set(x, 1.68, 0.27); g.add(e); });
  const arms = [];
  [-0.34, 0.34].forEach(x => {
    const pivot = new THREE.Group(); pivot.position.set(x, 1.42, 0);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.45, 4, 6), skin); arm.position.y = -0.27; pivot.add(arm);
    g.add(pivot); arms.push(pivot);
  });
  if (o.crown !== false) {
    const crown = new THREE.Group(); crown.position.y = 2.08;
    const gold = mat(o.crownColor || 0xffd700, { emissive: 0x332200 });
    crown.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 12, 1, true), gold));
    for (let i = 0; i < 5; i++) {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 5), gold);
      const a = i / 5 * Math.PI * 2; sp.position.set(Math.cos(a) * 0.19, 0.1, Math.sin(a) * 0.19); crown.add(sp);
    }
    const jewel = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), mat(0xff2e93, { emissive: 0x550022 })); jewel.position.set(0, 0.05, 0.21); crown.add(jewel);
    g.add(crown);
  }
  g.userData.arms = arms;
  g.userData.skirt = skirt;
  return g;
}

function makeKnight(o = {}) {
  const g = new THREE.Group();
  const armor = mat(0xd9dde8), cape = mat(o.dress || 0xff69b4), skin = mat(o.skin || SKIN[1]);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.4), armor); body.position.y = 1.15; g.add(body);
  [-0.15, 0.15].forEach(x => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.75, 0.24), armor); l.position.set(x, 0.38, 0); g.add(l); });
  const capeM = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.1, 0.05), cape); capeM.position.set(0, 1.0, -0.24); g.add(capeM);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), skin); head.position.y = 1.85; g.add(head);
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), armor); helm.position.y = 1.9; g.add(helm);
  const plume = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 6), cape); plume.position.y = 2.3; g.add(plume);
  const eyeM = mat(0x2d1b2e);
  [-0.11, 0.11].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), eyeM); e.position.set(x, 1.85, 0.29); g.add(e); });
  const arms = [];
  [-0.4, 0.4].forEach(x => {
    const pivot = new THREE.Group(); pivot.position.set(x, 1.5, 0);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.5, 4, 6), armor); arm.position.y = -0.3; pivot.add(arm);
    g.add(pivot); arms.push(pivot);
  });
  g.userData.arms = arms;
  return g;
}

function makeDragon(color = 0x7ee0b5, scale = 1) {
  const g = new THREE.Group();
  const m = mat(color), belly = mat(0xfff3c4), wingM = mat(0xff9ee5, { side: THREE.DoubleSide });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 10), m); body.scale.set(1, 0.85, 1.3); body.position.y = 0.8; g.add(body);
  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), belly); bel.scale.set(0.8, 0.7, 1.1); bel.position.set(0, 0.7, 0.18); g.add(bel);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10), m); head.position.set(0, 1.45, 0.55); g.add(head);
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), m); snout.scale.set(1, 0.8, 1.2); snout.position.set(0, 1.35, 0.9); g.add(snout);
  [-0.16, 0.16].forEach(x => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), mat(0x222222)); e.position.set(x, 1.55, 0.88); g.add(e);
    const h = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.25, 6), mat(0xfff3c4)); h.position.set(x, 1.85, 0.45); g.add(h);
  });
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.1, 8), m); tail.rotation.x = -Math.PI / 2 - 0.3; tail.position.set(0, 0.7, -1.1); g.add(tail);
  const wings = [];
  [-1, 1].forEach(s => {
    const pivot = new THREE.Group(); pivot.position.set(0.35 * s, 1.1, -0.1);
    const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(0.9 * s, 0.5); shape.lineTo(1.0 * s, -0.1); shape.lineTo(0.5 * s, -0.3); shape.lineTo(0, 0);
    const w = new THREE.Mesh(new THREE.ShapeGeometry(shape), wingM); w.rotation.x = -Math.PI / 2; pivot.add(w);
    g.add(pivot); wings.push(pivot);
  });
  g.userData.wings = wings;
  g.scale.setScalar(scale);
  return g;
}

function makeShadow(r = 0.6) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.03;
  return m;
}

// ---------- decorations ----------
function makeTree(type, th, rand) {
  const g = new THREE.Group();
  const trunk = mat(0x9c6b4e);
  const s = 0.8 + rand() * 0.7;
  if (type === 'round' || type === 'flower') {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 2, 8), trunk); t.position.y = 1; g.add(t);
    const col = rand() < 0.5 ? th.deco : (rand() < 0.5 ? 0x7fd77f : 0xff9fd0);
    const top = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 10), mat(col)); top.position.y = 3; g.add(top);
    if (type === 'flower') for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), mat(0xffffff)); const a = rand() * 6.28; f.position.set(Math.cos(a) * 1.3, 3 + rand() - 0.5, Math.sin(a) * 1.3); g.add(f); }
  } else if (type === 'cone' || type === 'snow') {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 1.2, 8), trunk); t.position.y = 0.6; g.add(t);
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(1.6 - i * 0.4, 1.6, 10), mat(type === 'snow' ? (i === 2 ? 0xffffff : 0xbfe6d0) : 0x5cb85c));
      c.position.y = 1.6 + i * 0.9; g.add(c);
    }
    if (type === 'snow') { const c = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.7, 10), mat(0xffffff)); c.position.y = 4.2; g.add(c); }
  } else if (type === 'crystal') {
    const n = 3 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) {
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.6 + rand() * 0.8), mat(rand() < 0.5 ? th.deco : th.trim, { emissive: 0x220022 }));
      c.scale.y = 2; c.position.set((rand() - 0.5) * 1.5, 1.2 + rand(), (rand() - 0.5) * 1.5); c.rotation.set(rand() * 0.4, rand() * 3, rand() * 0.4); g.add(c);
    }
  } else if (type === 'candy') {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3, 8), mat(0xffffff)); t.position.y = 1.5; g.add(t);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.35, 20), mat(rand() < 0.5 ? th.accent : th.trim)); top.rotation.x = Math.PI / 2; top.position.y = 3.6; g.add(top);
    const sw = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.12, 6, 20), mat(0xffffff)); sw.position.set(0, 3.6, 0.2); g.add(sw);
  } else if (type === 'mushroom') {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.55, 2, 10), mat(0xfff3e0)); t.position.y = 1; g.add(t);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(rand() < 0.5 ? 0xff5c8a : 0xb388ff)); cap.position.y = 2; g.add(cap);
    for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), mat(0xffffff)); const a = rand() * 6.28, rr = 0.6 + rand() * 0.7; d.position.set(Math.cos(a) * rr, 2 + Math.sqrt(Math.max(0, 2.56 - rr * rr)) - 0.05, Math.sin(a) * rr); g.add(d); }
  } else if (type === 'coral') {
    for (let i = 0; i < 4; i++) {
      const c = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.5 + rand() * 1.5, 4, 8), mat(rand() < 0.5 ? th.accent : th.deco));
      c.position.set((rand() - 0.5) * 1.2, 1.2, (rand() - 0.5) * 1.2); c.rotation.set((rand() - 0.5) * 0.8, 0, (rand() - 0.5) * 0.8); g.add(c);
    }
  } else if (type === 'cloud') {
    for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.8 + rand() * 0.5, 12, 10), mat(rand() < 0.5 ? 0xffffff : th.deco)); c.position.set((rand() - 0.5) * 2, 0.8 + rand() * 0.8, (rand() - 0.5) * 2); g.add(c); }
  } else if (type === 'book') {
    for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 1), mat([th.accent, th.trim, th.deco, 0x54a0ff, 0x1dd1a1][i])); b.position.y = 0.2 + i * 0.36; b.rotation.y = rand() * 0.6; g.add(b); }
  } else if (type === 'palm') {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 4, 8), trunk); t.position.y = 2; t.rotation.z = 0.1; g.add(t);
    for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.5), mat(0x3cb371)); const a = i / 6 * 6.28; l.position.set(Math.cos(a) * 0.9, 4, Math.sin(a) * 0.9); l.rotation.y = -a; l.rotation.z = -0.35; g.add(l); }
  }
  g.scale.setScalar(s);
  return g;
}

function makeGem(color) {
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.42), new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.35 }));
  return m;
}

// ---------- level builder ----------
const World = {
  build(scene, level) {
    const rand = mulberry32(level * 9973 + 17);
    const th = themeFor(level);
    const cfg = levelConfig(level);
    const S = cfg.worldSize / 2;
    const W = { level, theme: th, cfg, S, colliders: [], gems: [], portals: [], friendSpots: [], occupied: [], animated: [], dragons: [] };
    const root = new THREE.Group(); scene.add(root); W.root = root;

    const night = th.sky < 0x606060;
    scene.background = new THREE.Color(th.sky);
    scene.fog = new THREE.Fog(th.fog, S * 0.9, S * 2.6);

    const hemi = new THREE.HemisphereLight(night ? 0xc8b8ff : 0xffffff, th.ground, night ? 0.9 : 1.1); root.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff1f8, night ? 0.6 : 1.3); sun.position.set(30, 60, 20); root.add(sun);

    // Ground + pink border hedge
    const ground = new THREE.Mesh(new THREE.CircleGeometry(S * 1.6, 48), mat(th.ground)); ground.rotation.x = -Math.PI / 2; root.add(ground);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(S + 1.5, 1.2, 8, 64), mat(th.accent)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.4; root.add(ring);
    // flower specks on ground
    for (let i = 0; i < 120; i++) {
      const f = new THREE.Mesh(new THREE.CircleGeometry(0.3 + rand() * 0.3, 6), mat([0xffffff, th.accent, th.deco, th.trim][i % 4]));
      f.rotation.x = -Math.PI / 2; f.position.set((rand() * 2 - 1) * S, 0.02, (rand() * 2 - 1) * S); root.add(f);
    }
    if (night) {
      const pts = []; for (let i = 0; i < 400; i++) { const a = rand() * 6.28, b = rand() * 1.2 + 0.1, r = 220; pts.push(Math.cos(a) * Math.cos(b) * r, Math.sin(b) * r, Math.sin(a) * Math.cos(b) * r); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      root.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, fog: false })));
    }

    const occupy = (x, z, r) => W.occupied.push({ x, z, r });
    const isFree = (x, z, r) => {
      if (Math.hypot(x, z) > S - r - 1) return false;
      return W.occupied.every(o => Math.hypot(o.x - x, o.z - z) > o.r + r);
    };
    const freeSpot = (r, tries = 60) => {
      for (let i = 0; i < tries; i++) { const x = (rand() * 2 - 1) * S, z = (rand() * 2 - 1) * S; if (isFree(x, z, r)) return { x, z }; }
      return null;
    };
    const addBox = (x, y, z, w, h, d, material, opts = {}) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material); m.position.set(x, y + h / 2, z); root.add(m);
      const c = { x1: x - w / 2, x2: x + w / 2, z1: z - d / 2, z2: z + d / 2, y1: y, y2: y + h, mesh: m, type: opts.type || 'solid' };
      W.colliders.push(c);
      return c;
    };

    // Spawn
    W.spawn = { x: 0, z: S - 10 };
    occupy(W.spawn.x, W.spawn.z, 6);
    const spawnPad = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.3, 0.2, 24), mat(th.trim)); spawnPad.position.set(W.spawn.x, 0.1, W.spawn.z); root.add(spawnPad);

    // ---------- Castle with door ----------
    const cx = 0, cz = -S + 16, half = 8, wallH = 6, t = 1;
    W.castle = { x: cx, z: cz, half };
    occupy(cx, cz, 14);
    const wallM = mat(0xffe3f1), trimM = mat(th.accent), roofM = mat(th.accent);
    addBox(cx, 0, cz - half, half * 2, wallH, t, wallM);                 // back
    addBox(cx - half, 0, cz, t, wallH, half * 2, wallM);                 // left
    addBox(cx + half, 0, cz, t, wallH, half * 2, wallM);                 // right
    const gap = 4;
    addBox(cx - (half + gap / 2) / 2 - 0.0, 0, cz + half, half - gap / 2, wallH, t, wallM); // front-left
    addBox(cx + (half + gap / 2) / 2, 0, cz + half, half - gap / 2, wallH, t, wallM);       // front-right
    addBox(cx, 4.5, cz + half, gap, wallH - 4.5, t, wallM);                                 // above door
    // battlements
    for (let i = -half; i <= half; i += 2) {
      [[cx + i, cz - half], [cx + i, cz + half], [cx - half, cz + i], [cx + half, cz + i]].forEach(([x, z]) => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 1), trimM); b.position.set(x, wallH + 0.4, z); root.add(b);
      });
    }
    // corner towers
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const x = cx + sx * half, z = cz + sz * half;
      const tw = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 9, 14), wallM); tw.position.set(x, 4.5, z); root.add(tw);
      const rf = new THREE.Mesh(new THREE.ConeGeometry(2.1, 3.5, 14), roofM); rf.position.set(x, 10.75, z); root.add(rf);
      const fl = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.05), mat(th.trim)); fl.position.set(x + 0.4, 13, z); root.add(fl);
      W.colliders.push({ x1: x - 1.6, x2: x + 1.6, z1: z - 1.6, z2: z + 1.6, y1: 0, y2: 9, type: 'solid' });
    });
    // big keep behind
    const keep = new THREE.Mesh(new THREE.BoxGeometry(7, 11, 4), wallM); keep.position.set(cx, 5.5, cz - half - 3); root.add(keep);
    const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 5, 4), roofM); keepRoof.rotation.y = Math.PI / 4; keepRoof.position.set(cx, 13.5, cz - half - 3); root.add(keepRoof);
    W.colliders.push({ x1: cx - 3.5, x2: cx + 3.5, z1: cz - half - 5, z2: cz - half - 1, y1: 0, y2: 11, type: 'solid' });
    // Door (hinged)
    const hinge = new THREE.Group(); hinge.position.set(cx - gap / 2, 0, cz + half + 0.3); root.add(hinge);
    const doorM = new THREE.Mesh(new THREE.BoxGeometry(gap, 4.5, 0.4), mat(th.trim === 0xffffff ? 0xc77dff : th.trim)); doorM.position.set(gap / 2, 2.25, 0); hinge.add(doorM);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), mat(0xffd700)); knob.position.set(gap - 0.5, 2.2, 0.25); hinge.add(knob);
    const heart = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.12, 8, 20), mat(th.accent)); heart.position.set(gap / 2, 3.3, 0.25); hinge.add(heart);
    W.door = { hinge, collider: { x1: cx - gap / 2, x2: cx + gap / 2, z1: cz + half - 0.2, z2: cz + half + 0.6, y1: 0, y2: 4.5, type: 'door' }, open: false, angle: 0 };
    W.colliders.push(W.door.collider);
    W.castleLabel = makeLabel('🏰 Castle', { height: 1.1 }); W.castleLabel.position.set(cx, wallH + 2.6, cz + half); root.add(W.castleLabel);
    // Level portal inside courtyard
    const lp = new THREE.Group(); lp.position.set(cx, 0, cz);
    const lpRing = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.35, 12, 32), mat(0xffd700, { emissive: 0x664400 })); lpRing.position.y = 2.6; lp.add(lpRing);
    const lpDisc = new THREE.Mesh(new THREE.CircleGeometry(2.0, 32), new THREE.MeshBasicMaterial({ color: 0xff8ad8, transparent: true, opacity: 0.75, side: THREE.DoubleSide })); lpDisc.position.y = 2.6; lp.add(lpDisc);
    const lpLabel = makeLabel('✨ Next Level ✨', { height: 0.9 }); lpLabel.position.y = 5.6; lp.add(lpLabel);
    root.add(lp);
    W.levelPortal = { group: lp, disc: lpDisc, ring: lpRing, x: cx, z: cz };
    // Pink path from spawn to castle
    const path = new THREE.Mesh(new THREE.PlaneGeometry(3.5, (W.spawn.z - (cz + half))), mat(0xffc1e3)); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.025, (W.spawn.z + cz + half) / 2); root.add(path);

    // ---------- Climbing tower ----------
    const side = rand() < 0.5 ? -1 : 1;
    const tx = side * (S * 0.55), tz = -S * 0.1;
    occupy(tx, tz, 8);
    const steps = cfg.towerSteps, R = 4.2, stepA = 0.55 + cfg.towerGap * 0.35, rise = 1.1;
    const topY = 0.6 + steps * rise;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, topY + 1, 16), mat(0xffe3f1)); col.position.set(tx, (topY + 1) / 2, tz); root.add(col);
    W.colliders.push({ x1: tx - 1.2, x2: tx + 1.2, z1: tz - 1.2, z2: tz + 1.2, y1: 0, y2: topY + 1, type: 'solid' });
    for (let i = 0; i < steps; i++) {
      const a = i * stepA, y = 0.6 + i * rise;
      const last = i === steps - 1;
      const sz = last ? 4 : 3;
      addBox(tx + Math.cos(a) * R, y - 0.5, tz + Math.sin(a) * R, sz, 0.5, sz, mat(i % 2 ? th.accent : th.trim === 0xffffff ? 0xc77dff : th.trim));
      if (last) W.crownPos = { x: tx + Math.cos(a) * R, y: y + 1.2, z: tz + Math.sin(a) * R };
    }
    const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(2, 3, 14), mat(th.accent)); towerRoof.position.set(tx, topY + 2.5, tz); root.add(towerRoof);
    const towerLabel = makeLabel('🗼 Climb me!', { height: 1 }); towerLabel.position.set(tx, 4, tz + side * 0 + 2); root.add(towerLabel);
    W.tower = { x: tx, z: tz, label: towerLabel };
    const crown = new THREE.Group();
    const gold = mat(0xffd700, { emissive: 0x553300 });
    crown.add(new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.35, 16, 1, true), gold));
    for (let i = 0; i < 6; i++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.45, 6), gold); const a = i / 6 * 6.28; sp.position.set(Math.cos(a) * 0.58, 0.35, Math.sin(a) * 0.58); crown.add(sp); }
    crown.position.set(W.crownPos.x, W.crownPos.y, W.crownPos.z); root.add(crown);
    W.crown = crown;

    // ---------- Activity portals ----------
    const order = shuffle(GAME_KEYS);
    // rotate the starting game by level so every subject appears regularly
    const startIdx = level % GAME_KEYS.length;
    const keys = [];
    for (let i = 0; i < cfg.portals; i++) keys.push(GAME_KEYS[(startIdx + i * 3) % GAME_KEYS.length]);
    const uniq = [...new Set(keys)];
    while (uniq.length < cfg.portals) { const k = order.find(x => !uniq.includes(x)); if (!k) break; uniq.push(k); }
    uniq.forEach((key, i) => {
      let spot = null;
      for (let tries = 0; tries < 80 && !spot; tries++) {
        const a = (i / uniq.length) * Math.PI * 2 + rand() * 0.5, r = S * (0.35 + rand() * 0.45);
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (isFree(x, z, 4.5)) spot = { x, z };
      }
      if (!spot) spot = freeSpot(4) || { x: (rand() - 0.5) * S, z: (rand() - 0.5) * S };
      occupy(spot.x, spot.z, 4.5);
      const gm = GAMES[key];
      const p = new THREE.Group(); p.position.set(spot.x, 0, spot.z); p.rotation.y = Math.atan2(-spot.x, -spot.z);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.9, 0.3, 24), mat(0xffffff)); base.position.y = 0.15; p.add(base);
      const ringM = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.3, 12, 32), mat(gm.color, { emissive: gm.color, emissiveIntensity: 0.25 })); ringM.position.y = 2.4; p.add(ringM);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(1.75, 32), new THREE.MeshBasicMaterial({ color: gm.color, transparent: true, opacity: 0.55, side: THREE.DoubleSide })); disc.position.y = 2.4; p.add(disc);
      const label = makeLabel(`${gm.icon} ${gm.name}`, { height: 0.95 }); label.position.y = 5.1; p.add(label);
      root.add(p);
      W.portals.push({ key, x: spot.x, z: spot.z, group: p, ring: ringM, disc, label, index: i });
    });

    // ---------- Hills / jump platforms ----------
    const nHills = 14 + Math.floor(level / 4);
    W.hillTops = [];
    for (let i = 0; i < nHills; i++) {
      const w = 3 + rand() * 5, d = 3 + rand() * 5;
      const spot = freeSpot(Math.max(w, d) / 2 + 1.5);
      if (!spot) continue;
      occupy(spot.x, spot.z, Math.max(w, d) / 2 + 1);
      const tiers = 1 + Math.floor(rand() * Math.min(4, 1 + level / 15));
      let y = 0, cw = w, cd = d;
      for (let k = 0; k < tiers; k++) {
        const h = 0.9 + rand() * 0.5;
        addBox(spot.x, y, spot.z, cw, h, cd, mat(k % 2 ? th.accent : (k === 0 ? th.deco : th.trim)));
        y += h; cw *= 0.62; cd *= 0.62;
      }
      W.hillTops.push({ x: spot.x, y, z: spot.z });
    }

    // ---------- Trees / decor ----------
    const nTrees = 30 + Math.floor(S / 2);
    for (let i = 0; i < nTrees; i++) {
      const spot = freeSpot(2.2, 20); if (!spot) continue;
      occupy(spot.x, spot.z, 1.6);
      const tr = makeTree(th.tree, th, rand); tr.position.set(spot.x, 0, spot.z); tr.rotation.y = rand() * 6.28; root.add(tr);
      if (th.tree !== 'cloud') W.colliders.push({ x1: spot.x - 0.45, x2: spot.x + 0.45, z1: spot.z - 0.45, z2: spot.z + 0.45, y1: 0, y2: 2.5, type: 'solid' });
    }
    // floating clouds / hearts in the sky
    for (let i = 0; i < 14; i++) {
      const c = new THREE.Group();
      for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(2 + rand() * 1.5, 10, 8), mat(rand() < 0.3 ? th.deco : 0xffffff)); s.position.set(k * 2.4, rand(), rand()); c.add(s); }
      c.position.set((rand() * 2 - 1) * S * 1.4, 30 + rand() * 18, (rand() * 2 - 1) * S * 1.4); root.add(c);
      W.animated.push({ obj: c, kind: 'cloud', speed: 0.5 + rand() });
    }

    // ---------- Gems ----------
    const gemTotal = cfg.gems + 6;
    const gemColors = [0xff2e93, 0xb388ff, 0x48dbfb, 0xffd700, 0x1dd1a1];
    for (let i = 0; i < gemTotal; i++) {
      let pos;
      if (i % 3 === 0 && W.hillTops.length) {
        const h = W.hillTops[(i / 3 | 0) % W.hillTops.length];
        pos = { x: h.x + (rand() - 0.5) * 0.6, y: h.y + 1, z: h.z + (rand() - 0.5) * 0.6 };
        // keep only one gem per hill top
        if (W.gems.some(g => Math.hypot(g.x - pos.x, g.z - pos.z) < 1)) pos = null;
      }
      if (!pos) { const s = freeSpot(0.8, 40) || { x: (rand() - 0.5) * S, z: (rand() - 0.5) * S }; pos = { x: s.x, y: 1, z: s.z }; occupy(s.x, s.z, 0.8); }
      const gm = makeGem(gemColors[i % gemColors.length]); gm.position.set(pos.x, pos.y, pos.z); root.add(gm);
      W.gems.push({ id: i, x: pos.x, y: pos.y, z: pos.z, mesh: gm, taken: false });
    }

    // ---------- Friend (quest) spots ----------
    for (let i = 0; i < cfg.friends; i++) {
      const s = freeSpot(2) || { x: rand() * 10, z: rand() * 10 };
      occupy(s.x, s.z, 2); W.friendSpots.push(s);
    }

    // ---------- Baby dragons flying around ----------
    const nDragons = 2 + Math.floor(rand() * 3) + (/Dragon/.test(th.name) ? 3 : 0);
    for (let i = 0; i < nDragons; i++) {
      const d = makeDragon([0x7ee0b5, 0xff9ee5, 0xb388ff, 0xffb347, 0x48dbfb][i % 5], 1.2);
      root.add(d);
      W.dragons.push({ obj: d, cx: (rand() * 2 - 1) * S * 0.6, cz: (rand() * 2 - 1) * S * 0.6, r: 8 + rand() * 14, h: 7 + rand() * 8, speed: 0.25 + rand() * 0.3, phase: rand() * 6.28 });
    }

    return W;
  },

  dispose(scene, W) {
    if (!W) return;
    scene.remove(W.root);
    W.root.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && o.material.map) { o.material.map.dispose(); o.material.dispose(); }
      else if (o.material && !Object.values(MatCache).includes(o.material)) o.material.dispose();
    });
  },
};
