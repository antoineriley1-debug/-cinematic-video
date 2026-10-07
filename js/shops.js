// Princess Town shops: Ice Cream, Candy, Sneakers, Hair Salon, Nail & Pedi Spa.
// Each shop has: a learning "shift" with customers, a "treat myself" mode, and a delivery mission.
'use strict';

const CUSTOMER_FACES = ['👧', '👧🏽', '👧🏾', '👧🏻', '👩', '👩🏾', '🧒', '👸', '👸🏽', '👵', '🧑‍🦱'];
const FLAVORS = [['Strawberry', '#ff9ec4'], ['Vanilla', '#fff1c9'], ['Chocolate', '#8b5a2b'], ['Mint', '#a8f0c8'], ['Blueberry', '#8fb8ff']];
const TOPPINGS = [['none', 'No topping'], ['sprinkles', '🌈 Sprinkles'], ['cherry', '🍒 Cherry']];
const CANDIES = [['Lollipop', '🍭'], ['Candy', '🍬'], ['Chocolate', '🍫'], ['Cupcake', '🧁'], ['Donut', '🍩'], ['Cookie', '🍪']];
const COLOR_RIDDLES = [['the sky', 'Blue'], ['grass', 'Mint'], ['snow', 'White'], ['a banana', 'Gold'], ['a strawberry', 'Red'], ['the night sky', 'Black'], ['a flamingo', 'Pink'], ['a pumpkin', 'Orange']];
const HAIR_MIXES = [['Red', 'Blue', 'Purple'], ['Red', 'White', 'Pink'], ['Blue', 'Yellow', 'Green'], ['Red', 'Yellow', 'Orange']];
const STYLE_RIDDLES = [['one tail at the back', 'pony'], ['long and flowing', 'long'], ['two round buns on top', 'buns'], ['two braids', 'braids'], ['lots of bouncy curls', 'curly'], ['short and round', 'bob']];
const NAIL_NAMES = ['thumb', 'pointer', 'middle', 'ring', 'pinky'];
const PATTERNS = [['solid', 'Shiny'], ['glitter', '✨ Glitter'], ['dots', '⚪ Dots'], ['stripes', '〰️ Stripes'], ['hearts', '💖 Hearts']];

const styleName = (k) => (HAIR_STYLES.find(s => s[0] === k) || ['', k])[1];

// ---------- SVG drawings ----------
function svgPatternDefs() {
  return `<defs>
    <pattern id="p-glitter" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="#fff" opacity=".9"/><circle cx="6" cy="5" r=".8" fill="#fff8b0"/></pattern>
    <pattern id="p-dots" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2.2" fill="#fff" opacity=".9"/></pattern>
    <pattern id="p-stripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="8" fill="#fff" opacity=".8"/></pattern>
    <pattern id="p-hearts" width="14" height="14" patternUnits="userSpaceOnUse"><text x="2" y="11" font-size="10" fill="#fff">♥</text></pattern>
  </defs>`;
}
function nailSVG(cx, cy, rx, ry, color, pattern, idx, rot = 0) {
  const fill = color == null ? '#ffe6ee' : hex(color);
  const tr = rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : '';
  let s = `<ellipse class="nail" data-n="${idx}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="#e8a0b8" stroke-width="2"${tr}/>`;
  if (color != null && pattern && pattern !== 'solid') s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#p-${pattern})" pointer-events="none"${tr}/>`;
  if (color != null) s += `<ellipse cx="${cx - rx * 0.35}" cy="${cy - ry * 0.3}" rx="${rx * 0.2}" ry="${ry * 0.35}" fill="#fff" opacity=".6" pointer-events="none"${tr}/>`;
  return s;
}
// Hand seen from above, thumb on the left (nail 0) to pinky on the right (nail 4).
function handSVG(nails, pattern, skin = '#ffd9bd') {
  const fingers = [[40, 120, 22, 70, -35], [82, 40, 24, 110, -6], [124, 28, 25, 120, 0], [166, 40, 24, 110, 6], [204, 72, 21, 90, 14]];
  let s = `<svg viewBox="0 0 250 300" class="nail-svg">${svgPatternDefs()}`;
  s += `<rect x="55" y="140" width="160" height="150" rx="60" fill="${skin}"/>`;
  fingers.forEach(([x, y, w, h, r], i) => {
    s += `<rect x="${x - w / 2}" y="${y}" width="${w}" height="${h + 40}" rx="${w / 2}" fill="${skin}" transform="rotate(${r} ${x} ${y + h})"/>`;
  });
  fingers.forEach(([x, y, w, h, r], i) => {
    // nail sits near the fingertip: rotate the tip point around the finger's base pivot (x, y + h)
    const a = r * Math.PI / 180, d = h - 18;
    s += nailSVG(x + d * Math.sin(a), y + h - d * Math.cos(a), w * 0.36, 14, nails[i], pattern, i, r);
  });
  return s + '</svg>';
}
// Foot seen from above, big toe on the left (nail 0) to little toe (nail 4).
function footSVG(nails, pattern, skin = '#ffd9bd') {
  const toes = [[62, 70, 26], [108, 62, 19], [146, 68, 17], [180, 80, 15], [210, 96, 13]];
  let s = `<svg viewBox="0 0 250 300" class="nail-svg">${svgPatternDefs()}`;
  s += `<path d="M40 110 Q125 70 225 110 L215 230 Q125 300 50 240 Z" fill="${skin}"/>`;
  toes.forEach(([x, y, r]) => { s += `<circle cx="${x}" cy="${y + 14}" r="${r + 6}" fill="${skin}"/>`; });
  toes.forEach(([x, y, r], i) => { s += nailSVG(x, y + 6, r * 0.62, r * 0.55, nails[i], pattern, i); });
  return s + '</svg>';
}
function sneakerSVG(sh) {
  return `<svg viewBox="0 0 240 130" class="sneaker-svg">
    <path d="M20 95 L25 45 Q30 25 60 30 L95 40 Q120 70 170 72 Q215 74 222 98 Z" fill="${hex(sh.base)}" stroke="#00000022" stroke-width="2"/>
    <rect x="16" y="94" width="210" height="18" rx="9" fill="${hex(sh.sole)}" stroke="#00000022" stroke-width="2"/>
    ${[0, 1, 2, 3].map(i => `<line x1="${68 + i * 14}" y1="${44 + i * 7}" x2="${84 + i * 14}" y2="${38 + i * 7}" stroke="${hex(sh.laces)}" stroke-width="6" stroke-linecap="round"/>`).join('')}
    <path d="M120 82 Q150 60 190 84" stroke="#ffffffaa" stroke-width="6" fill="none"/>
  </svg>`;
}
// Portrait of a princess with any look (used by the salon and the Boutique mirror).
function avatarSVG(l) {
  const h = hex(l.hair), skin = hex(l.skin || 0xffe0bd), dr = hex(l.dress || 0xff4fa3), ey = hex(l.eyeColor != null ? l.eyeColor : 0x3a2030);
  const style = l.hairStyle || 'pony';
  let back = '';
  if (style === 'pony') back = `<ellipse cx="160" cy="105" rx="22" ry="45" fill="${h}" transform="rotate(20 160 105)"/>`;
  if (style === 'long') back = `<rect x="50" y="60" width="100" height="130" rx="40" fill="${h}"/>`;
  if (style === 'buns') back = `<circle cx="60" cy="45" r="22" fill="${h}"/><circle cx="140" cy="45" r="22" fill="${h}"/>`;
  if (style === 'braids') back = [55, 145].map(x => `<rect x="${x - 10}" y="80" width="20" height="100" rx="10" fill="${h}"/>${[0, 1, 2, 3].map(k => `<line x1="${x - 10}" y1="${100 + k * 20}" x2="${x + 10}" y2="${100 + k * 20}" stroke="#0002" stroke-width="3"/>`).join('')}`).join('');
  if (style === 'curly') back = Array.from({ length: 14 }, (_, k) => { const a = k / 14 * Math.PI * 2; return `<circle cx="${100 + Math.cos(a) * 52}" cy="${92 + Math.sin(a) * 50}" r="18" fill="${h}"/>`; }).join('');
  if (style === 'bob') back = `<path d="M45 95 Q45 35 100 35 Q155 35 155 95 L155 125 Q100 135 45 125 Z" fill="${h}"/>`;
  const outfit = l.outfit || 'gown';
  let body = `<rect x="85" y="132" width="30" height="20" fill="${skin}"/>`;
  if (outfit === 'gown') body += `<path d="M70 150 Q100 140 130 150 L160 240 L40 240 Z" fill="${dr}"/>`;
  if (outfit === 'royal') body += `<path d="M66 150 Q100 140 134 150 L190 240 L10 240 Z" fill="${dr}"/><path d="M72 160 Q100 150 128 160 L150 215 L50 215 Z" fill="#fff" opacity=".9"/><rect x="74" y="160" width="52" height="8" fill="#ffd700"/>`;
  if (outfit === 'tutu') body += `<path d="M72 150 Q100 140 128 150 L130 195 L70 195 Z" fill="${dr}"/><ellipse cx="100" cy="200" rx="70" ry="16" fill="${dr}" opacity=".85"/><rect x="82" y="210" width="12" height="30" fill="${skin}"/><rect x="106" y="210" width="12" height="30" fill="${skin}"/>`;
  if (outfit === 'pants') body += `<path d="M72 150 Q100 140 128 150 L130 200 L70 200 Z" fill="${dr}"/><rect x="74" y="195" width="24" height="45" fill="${dr}" opacity=".85"/><rect x="102" y="195" width="24" height="45" fill="${dr}" opacity=".85"/><rect x="70" y="192" width="60" height="8" fill="#ffd700"/>`;
  // eyes
  let eyes = '';
  [84, 116].forEach(x => {
    if (l.eyes === 'happy') eyes += `<path d="M${x - 7} 100 Q${x} 90 ${x + 7} 100" stroke="${ey}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    else {
      const r = l.eyes === 'sparkle' || l.eyes === 'starry' ? 7 : 5;
      eyes += `<circle cx="${x}" cy="98" r="${r}" fill="${ey}"/>`;
      if (l.eyes === 'sparkle') eyes += `<circle cx="${x + 2.5}" cy="95.5" r="2.4" fill="#fff"/>`;
      if (l.eyes === 'starry') eyes += `<text x="${x}" y="101" font-size="8" text-anchor="middle" fill="#fff">★</text>`;
      if (l.eyes === 'lashes') eyes += [-6, 0, 6].map(d => `<line x1="${x + d}" y1="${92}" x2="${x + d * 1.4}" y2="${86}" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/>`).join('');
    }
  });
  const nose = { button: `<circle cx="100" cy="108" r="4" fill="#0002"/>`, small: `<path d="M100 103 L97 111 L102 111" stroke="#0003" stroke-width="2.5" fill="none"/>`,
    dot: `<circle cx="100" cy="108" r="2.5" fill="#ff8fb0"/>`, round: `<ellipse cx="100" cy="109" rx="7" ry="5" fill="#0002"/>` }[l.nose || 'button'] || '';
  const mouth = { smile: `<path d="M88 116 Q100 126 112 116" stroke="#c2185b" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    grin: `<path d="M84 114 Q100 132 116 114 Z" fill="#fff" stroke="#c2185b" stroke-width="3" stroke-linejoin="round"/>`,
    open: `<ellipse cx="100" cy="120" rx="7" ry="9" fill="#8a1040"/>`,
    tongue: `<path d="M88 116 Q100 126 112 116" stroke="#c2185b" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="103" cy="124" rx="5" ry="6" fill="#ff6b9d"/>`,
    smirk: `<path d="M92 120 Q104 124 114 113" stroke="#c2185b" stroke-width="3" fill="none" stroke-linecap="round"/>` }[l.mouth || 'smile'] || '';
  let cheeks = '';
  [74, 126].forEach(x => {
    if ((l.cheeks || 'blush') === 'blush') cheeks += `<circle cx="${x}" cy="110" r="6" fill="#ff9ec4" opacity=".7"/>`;
    if (l.cheeks === 'freckles') cheeks += [[0, 0], [5, 4], [-4, 5]].map(([dx, dy]) => `<circle cx="${x + dx}" cy="${107 + dy}" r="1.6" fill="#9c6b4e"/>`).join('');
    if (l.cheeks === 'hearts') cheeks += `<text x="${x}" y="114" font-size="11" text-anchor="middle" fill="#ff2e93">♥</text>`;
    if (l.cheeks === 'stars') cheeks += `<text x="${x}" y="114" font-size="11" text-anchor="middle" fill="#ffc400">★</text>`;
  });
  const hw = { crown: `<path d="M78 52 L86 36 L94 50 L100 32 L106 50 L114 36 L122 52 Z" fill="#ffd700"/>`,
    tiara: `<path d="M70 62 Q100 40 130 62" stroke="#dfe6ff" stroke-width="5" fill="none"/><path d="M100 38 L106 48 L100 56 L94 48 Z" fill="#8ee8ff"/>`,
    bow: `<path d="M100 48 L76 34 L76 62 Z M100 48 L124 34 L124 62 Z" fill="#ff2e93"/><circle cx="100" cy="48" r="7" fill="#ff2e93"/>`,
    flower: [0, 1, 2, 3, 4].map(i => { const a = i / 5 * Math.PI * 2; return `<circle cx="${138 + Math.cos(a) * 8}" cy="${62 + Math.sin(a) * 8}" r="6" fill="#ff9ec4"/>`; }).join('') + `<circle cx="138" cy="62" r="5" fill="#ffd700"/>`,
    none: '' }[l.headwear || 'crown'] || '';
  return `<svg viewBox="0 0 200 240" class="face-svg">${back}${body}
    <circle cx="100" cy="95" r="45" fill="${skin}"/><path d="M62 80 Q100 30 138 80 Q120 58 100 62 Q80 58 62 80 Z" fill="${h}"/>
    ${eyes}${nose}${mouth}${cheeks}${hw}</svg>`;
}
function faceSVG(hairColor, style) {
  return avatarSVG({ hair: hairColor, hairStyle: style, eyes: 'round', nose: 'button', mouth: 'smile', cheeks: 'blush', outfit: 'gown', dress: 0xffd1e8, headwear: 'none' });
}
function swatches(list, selected, attr) {
  return `<div class="swatches">${list.map(([n, c]) => `<button class="swatch ${c === selected ? 'sel' : ''}" data-${attr}="${c}" style="background:${hex(c)}" title="${n}"><span>${n}</span></button>`).join('')}</div>`;
}

const Shops = {
  // ---------- shop front door ----------
  open(key) {
    const sp = SHOPS[key], lv = Game.level;
    const m = Save.data.mission;
    const treat = { icecream: 'Make my own sundae', candy: 'Fill my own candy jar', sneakers: 'Design MY sneakers', salon: 'Style MY hair', spa: 'Get MY nails & toes done' }[key];
    UI.open(`<h2>${sp.icon} ${sp.name}</h2>
      <p class="center muted">Welcome, princess! What would you like to do?</p>
      <div class="shop-menu">
        <button class="shop-btn pink" id="sh-work">💼 Work a shift<small>Help 5 customers · earn coins</small></button>
        <button class="shop-btn purple" id="sh-treat">✨ ${treat}<small>Just for fun!</small></button>
        <button class="shop-btn green" id="sh-mission">📜 Delivery mission<small>${m ? `Busy: ${m.done}/${m.need} ${SHOPS[m.shop].item} delivered` : `Deliver ${sp.itemName} with your team`}</small></button>
      </div>`);
    Voice.speak(`Welcome to the ${sp.name}!`);
    $('sh-work').onclick = () => this.startShift(key, lv);
    $('sh-treat').onclick = () => this['treat_' + key]();
    $('sh-mission').onclick = () => this.mission(key);
  },

  mission(key) {
    const sp = SHOPS[key], m = Save.data.mission;
    if (m && m.shop !== key) {
      UI.open(`<h2>📜 One mission at a time!</h2><p class="center" style="font-size:20px">You are still delivering ${SHOPS[m.shop].item} for the ${esc(SHOPS[m.shop].name)} (${m.done}/${m.need}).</p>
        <div class="row-btns"><button class="big-btn pink" id="ms-ok">Keep going!</button><button class="big-btn gray" id="ms-drop">Switch to this one</button></div>`);
      $('ms-ok').onclick = () => UI.close();
      $('ms-drop').onclick = () => { Save.data.mission = null; this.mission(key); };
      return;
    }
    if (!m) Game.startMission(key);
    const team = Game.teamNames();
    UI.open(`<h2>📜 ${sp.name} Mission</h2><div class="result-big">${sp.item}</div>
      <p class="center" style="font-size:22px">Deliver <b>${Save.data.mission.need} ${esc(sp.itemName)}</b> to friends in the kingdom.<br>Look for a <b>${sp.item}</b> over their heads!</p>
      <p class="center">${team.length ? `👭 Your team: <b>${esc(team.join(', '))}</b> - team bonus on every delivery!` : '👭 Tip: talk to friends and ask them to <b>join your team</b> for bonus coins!'}</p>
      <div class="row-btns"><button class="big-btn pink" id="ms-go">Let's go!</button></div>`);
    Voice.speak(`Deliver ${Save.data.mission.need} ${sp.itemName}. Look for the sign over their heads!`);
    $('ms-go').onclick = () => UI.close();
  },

  // ---------- shifts (learning with customers) ----------
  startShift(key, level) {
    this.shift = { key, level, i: 0, total: 5, right: 0 };
    this.nextCustomer();
  },
  nextCustomer() {
    const s = this.shift;
    if (s.i >= s.total) return this.endShift();
    s.face = pick(CUSTOMER_FACES); s.name = pick(NPC_NAMES);
    this['cust_' + s.key](band(s.level));
  },
  custHeader(text, sayText) {
    const s = this.shift;
    return `<div class="mg-head"><span>${SHOPS[s.key].icon} ${SHOPS[s.key].name}</span><span>Customer ${s.i + 1} of ${s.total} · ⭐ ${s.right}</span></div>
      <div class="cust"><div class="cust-face">${s.face}</div><div class="cust-bubble"><b>${esc(s.name)}:</b> ${esc(text)} <button class="speak" id="cu-say">🔊</button></div></div>`;
  },
  bindSay(text) {
    const say = () => Voice.speak(text);
    $('cu-say').onclick = say; say();
  },
  served(ok, explain) {
    const s = this.shift;
    if (ok) s.right++;
    Save.recordAnswer({ icecream: 'Following directions', candy: 'Counting & money', sneakers: 'Reading & ordering', salon: 'Reading & color mixing', spa: 'Patterns & counting' }[s.key], ok);
    ok ? Sound.right() : Sound.wrong();
    UI.open(`<div class="result-big">${ok ? '😍' : '🤔'}</div>
      <p class="affirm">${ok ? pick(['Perfect! Thank you!', 'Just what I wanted!', 'You are the best!', 'Wow, amazing!']) : 'Hmm, not quite what I asked for - but thanks for trying!'}</p>
      ${!ok && explain ? `<p class="center" style="font-size:19px">${esc(explain)}</p>` : ''}
      <div class="row-btns"><button class="big-btn purple" id="cu-next">${s.i + 1 >= s.total ? 'Finish shift' : 'Next customer ➜'}</button></div>`);
    Voice.speak(ok ? 'Perfect! Thank you!' : 'Not quite. ' + (explain || ''));
    $('cu-next').onclick = () => { s.i++; this.nextCustomer(); };
  },
  endShift() {
    const s = this.shift;
    const coins = s.right ? Save.addCoins(s.right * 2 + 3 + s.level * 0.08, 'shop') : 0;
    if (s.right >= 3) Sound.fanfare();
    UI.open(`<h2>🎉 Shift complete!</h2><div class="result-big">${'⭐'.repeat(Math.max(1, Math.round(s.right * 3 / s.total)))}</div>
      <p class="center" style="font-size:22px">${s.right} of ${s.total} happy customers</p>
      <p class="affirm">${esc(pick(['You are a great boss!', 'Business princess!', 'Your customers love you!', 'Hard work pays off!']))}</p>
      <p class="center" style="font-size:22px">🪙 +${coins}</p>
      <div class="row-btns"><button class="big-btn pink" id="sh-again">Work again</button><button class="big-btn gray" id="sh-out">Leave shop</button></div>`);
    Voice.speak(`Shift complete! ${s.right} happy customers!`);
    $('sh-again').onclick = () => this.startShift(s.key, s.level);
    $('sh-out').onclick = () => UI.close();
  },

  // ===== Ice cream =====
  cust_icecream(b) {
    const fl = shuffle(FLAVORS.map(f => f[0]));
    const want = {}; let text;
    const cont = pick(['cone', 'cup']);
    const top = b === 0 ? 'none' : pick(['none', 'sprinkles', 'cherry']);
    const r = Math.random();
    if (b === 0) { const n = rnd(1, 2); for (let i = 0; i < n; i++) want[fl[i]] = 1; text = `${Object.keys(want).map(f => `1 ${f}`).join(' and ')} scoop${n > 1 ? 's' : ''}`; }
    else if (b === 1 || r < 0.3) { want[fl[0]] = rnd(1, 2); want[fl[1]] = rnd(1, 2); text = `${want[fl[0]]} ${fl[0]} and ${want[fl[1]]} ${fl[1]}`; }
    else if (r < 0.55) { const tot = rnd(3, 5), a = rnd(1, tot - 1); want[fl[0]] = a; want[fl[1]] = tot - a; text = `${tot} scoops in all: ${a} ${fl[0]} and the rest ${fl[1]}`; }
    else if (r < 0.8) { const a = rnd(1, 2); want[fl[0]] = a; want[fl[1]] = a * 2; text = `${a} ${fl[0]} and TWICE as many ${fl[1]}`; }
    else { const a = rnd(2, 3); want[fl[0]] = a; want[fl[1]] = a - 1; text = `${a} ${fl[0]} and ONE LESS ${fl[1]}`; }
    text = `Can I have ${text} in a ${cont}${top === 'none' ? '' : ` with ${top === 'cherry' ? 'a cherry' : 'sprinkles'} on top`}, please?`;
    const st = { scoops: [], cont: 'cone', top: 'none' };
    const render = () => {
      UI.open(this.custHeader(text) + `<div class="ic-wrap">${this.sundae(st)}</div>
        <div class="tool-row">${FLAVORS.map(([n, c]) => `<button class="flav" data-f="${n}" style="background:${c}">${n}</button>`).join('')}</div>
        <div class="tool-row"><button class="mid-btn ${st.cont === 'cone' ? 'on' : ''}" data-c="cone">🍦 Cone</button><button class="mid-btn ${st.cont === 'cup' ? 'on' : ''}" data-c="cup">🥣 Cup</button>
          ${TOPPINGS.map(([k, n]) => `<button class="mid-btn ${st.top === k ? 'on' : ''}" data-t="${k}">${n}</button>`).join('')}</div>
        <div class="row-btns"><button class="mid-btn" id="ic-undo">⌫ Undo</button><button class="big-btn pink" id="ic-serve">Serve! 🛎️</button></div>`);
      $('cu-say').onclick = () => Voice.speak(text);
      document.querySelectorAll('[data-f]').forEach(bn => bn.onclick = () => { if (st.scoops.length < 6) { st.scoops.push(bn.dataset.f); Sound.tap(); render(); } });
      document.querySelectorAll('[data-c]').forEach(bn => bn.onclick = () => { st.cont = bn.dataset.c; render(); });
      document.querySelectorAll('[data-t]').forEach(bn => bn.onclick = () => { st.top = bn.dataset.t; render(); });
      $('ic-undo').onclick = () => { st.scoops.pop(); render(); };
      $('ic-serve').onclick = () => {
        const got = {}; st.scoops.forEach(f => got[f] = (got[f] || 0) + 1);
        const same = Object.keys(want).length === Object.keys(got).length && Object.keys(want).every(f => got[f] === want[f]);
        const ok = same && st.cont === cont && st.top === top;
        this.served(ok, `They wanted ${Object.entries(want).map(([f, n]) => `${n} ${f}`).join(' and ')} in a ${cont}${top === 'none' ? ' with no topping' : ' with ' + top}.`);
      };
    };
    render();
    Voice.speak(text);
  },
  sundae(st) {
    const scoops = st.scoops.map((f, i) => `<div class="scoop" style="background:${FLAVORS.find(x => x[0] === f)[1]};bottom:${(st.cont === 'cone' ? 92 : 62) + i * 34}px"></div>`).join('');
    const top = st.top === 'cherry' ? `<div class="ic-top" style="bottom:${(st.cont === 'cone' ? 92 : 62) + st.scoops.length * 34 + 8}px">🍒</div>`
      : st.top === 'sprinkles' && st.scoops.length ? `<div class="ic-top" style="bottom:${(st.cont === 'cone' ? 92 : 62) + st.scoops.length * 34 - 14}px">🌈</div>` : '';
    return `<div class="sundae">${st.cont === 'cone' ? '<div class="cone"></div>' : '<div class="cup"></div>'}${scoops}${top}</div>`;
  },
  treat_icecream() {
    const st = { scoops: [], cont: 'cone', top: 'none' };
    const render = () => {
      UI.open(`<h2>🍦 Make my own sundae!</h2><div class="ic-wrap">${this.sundae(st)}</div>
        <div class="tool-row">${FLAVORS.map(([n, c]) => `<button class="flav" data-f="${n}" style="background:${c}">${n}</button>`).join('')}</div>
        <div class="tool-row"><button class="mid-btn" data-c="cone">🍦 Cone</button><button class="mid-btn" data-c="cup">🥣 Cup</button>${TOPPINGS.map(([k, n]) => `<button class="mid-btn" data-t="${k}">${n}</button>`).join('')}</div>
        <p class="center muted">${st.scoops.length} scoop${st.scoops.length === 1 ? '' : 's'} - count them!</p>
        <div class="row-btns"><button class="mid-btn" id="ic-undo">⌫ Undo</button><button class="big-btn pink" id="ic-eat">Yum! 😋</button></div>`);
      document.querySelectorAll('[data-f]').forEach(bn => bn.onclick = () => { if (st.scoops.length < 8) { st.scoops.push(bn.dataset.f); Sound.tap(); Voice.speak(String(st.scoops.length)); render(); } });
      document.querySelectorAll('[data-c]').forEach(bn => bn.onclick = () => { st.cont = bn.dataset.c; render(); });
      document.querySelectorAll('[data-t]').forEach(bn => bn.onclick = () => { st.top = bn.dataset.t; render(); });
      $('ic-undo').onclick = () => { st.scoops.pop(); render(); };
      $('ic-eat').onclick = () => { Sound.fanfare(); Voice.speak(`Yummy! ${st.scoops.length} scoops!`); UI.toast(`😋 Yummy! ${st.scoops.length} scoops!`); UI.close(); };
    };
    render();
  },

  // ===== Candy =====
  cust_candy(b) {
    const cs = shuffle(CANDIES);
    if (b >= 2 && Math.random() < 0.5) {
      const r = Math.random(); let q, ans;
      if (r < 0.33) { const p = pick([5, 10, 25]), n = rnd(2, 5); ans = p * n; q = `${cs[0][1]} ${cs[0][0]}s cost ${p}¢ each. How much for ${n}?`; return this.quizCust(q, numberChoices(ans, 5).map(x => x + '¢'), ans + '¢'); }
      if (r < 0.66) { const bags = rnd(2, 5), each = rnd(2, 6); ans = each; q = `Please share ${bags * each} ${cs[0][1]} equally into ${bags} bags. How many in each bag?`; return this.quizCust(q, numberChoices(ans), String(ans)); }
      const had = rnd(15, 40), sold = rnd(3, had - 5); ans = had - sold; q = `The shop had ${had} ${cs[0][1]}. We sold ${sold}. How many are left?`; return this.quizCust(q, numberChoices(ans, 5), String(ans));
    }
    const want = {}; let text;
    if (b === 0) { want[cs[0][0]] = rnd(1, 4); want[cs[1][0]] = rnd(1, 3); text = `${want[cs[0][0]]} ${cs[0][1]} ${cs[0][0]}${want[cs[0][0]] > 1 ? 's' : ''} and ${want[cs[1][0]]} ${cs[1][1]} ${cs[1][0]}${want[cs[1][0]] > 1 ? 's' : ''}`; }
    else if (Math.random() < 0.5) { const tot = rnd(6, 10), a = rnd(2, tot - 2); want[cs[0][0]] = a; want[cs[1][0]] = tot - a; text = `${tot} treats: ${a} ${cs[0][1]} and the rest ${cs[1][1]}`; }
    else { const a = rnd(1, 4), more = rnd(1, 3); want[cs[0][0]] = a; want[cs[1][0]] = a + more; text = `${a} ${cs[0][1]} and ${more} MORE ${cs[1][1]} than that`; }
    text = `I would like a bag with ${text}, please!`;
    const bag = [];
    const render = () => {
      UI.open(this.custHeader(text) + `<div class="candy-bag">${bag.length ? bag.map(c => CANDIES.find(x => x[0] === c)[1]).join(' ') : '<span class="muted">Your bag is empty</span>'}</div>
        <div class="tool-row">${CANDIES.map(([n, e]) => `<button class="candy-btn" data-c="${n}">${e}<small>${n}</small></button>`).join('')}</div>
        <div class="row-btns"><button class="mid-btn" id="cd-undo">⌫ Undo</button><button class="big-btn pink" id="cd-serve">Give bag 🛍️</button></div>`);
      $('cu-say').onclick = () => Voice.speak(text);
      document.querySelectorAll('[data-c]').forEach(bn => bn.onclick = () => { if (bag.length < 16) { bag.push(bn.dataset.c); Sound.tap(); render(); } });
      $('cd-undo').onclick = () => { bag.pop(); render(); };
      $('cd-serve').onclick = () => {
        const got = {}; bag.forEach(c => got[c] = (got[c] || 0) + 1);
        const ok = Object.keys(got).length === Object.keys(want).length && Object.keys(want).every(c => got[c] === want[c]);
        this.served(ok, `They wanted ${Object.entries(want).map(([c, n]) => `${n} ${c}${n > 1 ? 's' : ''}`).join(' and ')}.`);
      };
    };
    render(); Voice.speak(text);
  },
  quizCust(q, choices, answer) {
    UI.open(this.custHeader(q) + `<div class="choices">${choices.map((c, k) => `<button class="choice" data-k="${k}">${esc(c)}</button>`).join('')}</div>`);
    this.bindSay(q);
    document.querySelectorAll('.choice').forEach(bn => bn.onclick = () => this.served(choices[+bn.dataset.k] === answer, `The answer was ${answer}.`));
  },
  treat_candy() {
    const jar = [];
    const render = () => {
      UI.open(`<h2>🍭 My candy jar</h2><div class="candy-bag">${jar.map(c => CANDIES.find(x => x[0] === c)[1]).join(' ') || '<span class="muted">Tap treats to fill your jar!</span>'}</div>
        <p class="center" style="font-size:20px">${CANDIES.filter(([n]) => jar.includes(n)).map(([n, e]) => `${e} × ${jar.filter(j => j === n).length}`).join(' · ')}${jar.length ? ` · <b>Total: ${jar.length}</b>` : ''}</p>
        <div class="tool-row">${CANDIES.map(([n, e]) => `<button class="candy-btn" data-c="${n}">${e}<small>${n}</small></button>`).join('')}</div>
        <div class="row-btns"><button class="mid-btn" id="cd-undo">⌫ Undo</button><button class="big-btn pink" id="cd-done">All done!</button></div>`);
      document.querySelectorAll('[data-c]').forEach(bn => bn.onclick = () => { if (jar.length < 20) { jar.push(bn.dataset.c); Sound.tap(); render(); } });
      $('cd-undo').onclick = () => { jar.pop(); render(); };
      $('cd-done').onclick = () => { Voice.speak(`You have ${jar.length} treats! Remember to share!`); UI.toast(`🍭 ${jar.length} treats! Sharing is caring 💖`); UI.close(); };
    };
    render();
  },

  // ===== Sneakers =====
  cust_sneakers(b) {
    if (Math.random() < 0.45) return this.sizeSort(b);
    const pc = shuffle(PAINT_COLORS);
    const want = {}; const parts = [];
    const desc = (k, c) => {
      if (b >= 2 && Math.random() < 0.5) { const rr = COLOR_RIDDLES.find(x => x[1] === c[0]); if (rr) return `the color of ${rr[0]}`; }
      return c[0];
    };
    want.base = pc[0]; parts.push(`${desc('base', pc[0])} sneakers`);
    if (b >= 0) { want.laces = pc[1]; parts.push(`${desc('laces', pc[1])} laces`); }
    if (b >= 1) { want.sole = Math.random() < 0.3 ? pc[1] : pc[2]; parts.push(want.sole === pc[1] && b >= 2 ? 'a sole the SAME color as the laces' : `a ${desc('sole', want.sole)} sole`); }
    const text = `I want ${parts.slice(0, -1).join(', ')}${parts.length > 1 ? ' and ' : ''}${parts[parts.length - 1]}!`;
    const sh = { base: 0xffffff, laces: 0xffffff, sole: 0xffffff };
    const render = () => {
      UI.open(this.custHeader(text) + `<div class="center">${sneakerSVG(sh)}</div>
        <p class="pick-label">Sneaker</p>${swatches(PAINT_COLORS, sh.base, 'base')}
        <p class="pick-label">Laces</p>${swatches(PAINT_COLORS, sh.laces, 'laces')}
        <p class="pick-label">Sole</p>${swatches(PAINT_COLORS, sh.sole, 'sole')}
        <div class="row-btns"><button class="big-btn pink" id="sn-serve">Box them up! 📦</button></div>`);
      $('cu-say').onclick = () => Voice.speak(text);
      ['base', 'laces', 'sole'].forEach(k => document.querySelectorAll(`[data-${k}]`).forEach(bn => bn.onclick = () => { sh[k] = +bn.dataset[k]; Sound.tap(); render(); }));
      $('sn-serve').onclick = () => {
        const ok = Object.keys(want).every(k => sh[k] === want[k][1]);
        this.served(ok, `They wanted ${Object.entries(want).map(([k, c]) => `${c[0]} ${k === 'base' ? 'sneakers' : k}`).join(', ')}.`);
      };
    };
    render(); Voice.speak(text);
  },
  sizeSort(b) {
    const n = [3, 4, 5, 5, 6][b];
    const pool = new Set();
    while (pool.size < n) {
      if (b <= 1) pool.add(rnd(1, b === 0 ? 10 : 20));
      else if (b === 2) pool.add(rnd(10, 99));
      else pool.add(rnd(4, 12) + (Math.random() < 0.5 ? 0.5 : 0));
    }
    const sizes = shuffle([...pool]);
    const sorted = [...sizes].sort((a, c) => a - c);
    const fmt = (v) => Number.isInteger(v) ? String(v) : `${Math.floor(v)}½`;
    const text = 'Can you line up the shoe boxes from the SMALLEST size to the BIGGEST?';
    const placed = []; let mistakes = 0;
    const render = () => {
      UI.open(this.custHeader(text) + `<div class="shelf">${sorted.map((_, i) => `<div class="box-slot">${placed[i] !== undefined ? `📦<b>${fmt(placed[i])}</b>` : ''}</div>`).join('')}</div>
        <div class="tool-row">${sizes.map((v, k) => `<button class="shoebox ${placed.includes(v) ? 'used' : ''}" data-k="${k}">👟<b>${fmt(v)}</b></button>`).join('')}</div>`);
      $('cu-say').onclick = () => Voice.speak(text);
      document.querySelectorAll('.shoebox').forEach(bn => bn.onclick = () => {
        const v = sizes[+bn.dataset.k]; if (placed.includes(v)) return;
        if (v === sorted[placed.length]) { placed.push(v); Sound.tap(); if (placed.length === sorted.length) { render(); setTimeout(() => this.served(mistakes === 0, 'Look for the smallest number first each time.'), 400); } else render(); }
        else { mistakes++; Sound.wrong(); bn.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 250 }); }
      });
    };
    render(); Voice.speak(text);
  },
  treat_sneakers() {
    const sh = Object.assign({}, Save.data.look.shoes);
    const render = () => {
      UI.open(`<h2>👟 Design MY sneakers</h2><div class="center">${sneakerSVG(sh)}</div>
        <p class="pick-label">Sneaker</p>${swatches(PAINT_COLORS, sh.base, 'base')}
        <p class="pick-label">Laces</p>${swatches(PAINT_COLORS, sh.laces, 'laces')}
        <p class="pick-label">Sole</p>${swatches(PAINT_COLORS, sh.sole, 'sole')}
        <div class="row-btns"><button class="big-btn pink" id="sn-wear">Wear them! ✨</button></div>`);
      ['base', 'laces', 'sole'].forEach(k => document.querySelectorAll(`[data-${k}]`).forEach(bn => bn.onclick = () => { sh[k] = +bn.dataset[k]; Sound.tap(); render(); }));
      $('sn-wear').onclick = () => { Save.data.look.shoes = sh; Save.write(); Game.refreshLook(); Sound.fanfare(); Voice.speak('Your new sneakers look amazing!'); UI.toast('👟 New sneakers on!'); UI.close(); };
    };
    render();
  },

  // ===== Hair salon =====
  cust_salon(b) {
    const col = pick(HAIR_COLORS.filter(c => b < 2 || HAIR_MIXES.some(m => m[2] === c[0]) || Math.random() < 0.3));
    const sty = pick(HAIR_STYLES);
    let colText = col[0], styText = sty[1];
    const mix = HAIR_MIXES.find(m => m[2] === col[0]);
    if (b >= 2 && mix && Math.random() < 0.7) colText = `the color you get when you mix ${mix[0]} and ${mix[1]}`;
    if (b >= 1 && Math.random() < 0.5) { const sr = STYLE_RIDDLES.find(x => x[1] === sty[0]); styText = `${sr[0]}`; }
    const text = `Please make my hair ${colText}, styled ${styText === sty[1] ? 'in a ' + styText : 'with ' + styText}!`;
    const st = { color: 0x5a2d1a, style: 'bob' };
    const render = () => {
      UI.open(this.custHeader(text) + `<div class="center">${faceSVG(st.color, st.style)}</div>
        <p class="pick-label">Color</p>${swatches(HAIR_COLORS, st.color, 'hc')}
        <p class="pick-label">Style</p><div class="tool-row">${HAIR_STYLES.map(([k, n]) => `<button class="mid-btn ${st.style === k ? 'on' : ''}" data-hs="${k}">${n}</button>`).join('')}</div>
        <div class="row-btns"><button class="big-btn pink" id="hs-serve">All done! 💇‍♀️</button></div>`);
      $('cu-say').onclick = () => Voice.speak(text);
      document.querySelectorAll('[data-hc]').forEach(bn => bn.onclick = () => { st.color = +bn.dataset.hc; Sound.tap(); render(); });
      document.querySelectorAll('[data-hs]').forEach(bn => bn.onclick = () => { st.style = bn.dataset.hs; Sound.tap(); render(); });
      $('hs-serve').onclick = () => this.served(st.color === col[1] && st.style === sty[0], `They wanted ${col[0]} hair in ${sty[1]}.`);
    };
    render(); Voice.speak(text);
  },
  treat_salon() { this.boutique('hair'); },

  // ===== Boutique: change face, hair and outfit (items are earned with coins) =====
  owns(slot, it) { return !Save.parent.looksCost || it[2] === 0 || Save.data.owned.includes(slot + ':' + it[0]); },
  boutique(tab = 'face', draft) {
    const look = draft || Object.assign({}, Save.data.look);
    const tabs = [['face', '😊 Face'], ['hair', '💇‍♀️ Hair'], ['outfit', '👗 Outfit']];
    let html = `<h2>👗 Boutique Mirror</h2>
      <div class="row-btns" style="margin-top:0">${tabs.map(([k, n]) => `<button class="mid-btn ${k === tab ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>
      <div class="boutique"><div class="mirror">${avatarSVG(look)}<div class="coins-line">🪙 ${Save.data.coins}</div></div><div class="closet">`;
    for (const [slot, cat] of Object.entries(WARDROBE)) {
      if (cat.tab !== tab) continue;
      const cur = wardrobeCurrent(slot, look)[0];
      html += `<p class="pick-label">${cat.label}</p><div class="tool-row">` + cat.items.map(it => {
        const owned = this.owns(slot, it), isColor = it.length > 3;
        const sw = isColor ? `<i class="dot" style="background:${hex(it[3])}"></i>` : '';
        return `<button class="look-btn ${it[0] === cur ? 'on' : ''} ${owned ? '' : 'locked'}" data-slot="${slot}" data-id="${it[0]}">${sw}${esc(it[1])}${owned ? '' : `<small>🔒 🪙${it[2]}</small>`}</button>`;
      }).join('') + '</div>';
    }
    html += `</div></div><div class="row-btns"><button class="big-btn pink" id="bq-save">Save my look 💖</button></div>
      ${Save.parent.looksCost ? '<p class="center muted">🔒 Locked looks cost coins. Coins are earned by playing!</p>' : ''}`;
    UI.open(html);
    document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => this.boutique(b.dataset.tab, look));
    document.querySelectorAll('.look-btn').forEach(b => b.onclick = () => {
      const slot = b.dataset.slot, it = WARDROBE[slot].items.find(x => x[0] === b.dataset.id);
      if (this.owns(slot, it)) { look[slot] = wardrobeValue(slot, it); Sound.tap(); return this.boutique(tab, look); }
      this.buyLook(slot, it, tab, look);
    });
    $('bq-save').onclick = () => {
      // only keep things she owns (in case a parent turned prices back on)
      for (const slot of Object.keys(WARDROBE)) if (!this.owns(slot, wardrobeCurrent(slot, look))) look[slot] = wardrobeValue(slot, WARDROBE[slot].items[0]);
      Object.assign(Save.data.look, look); Save.write(); Game.refreshLook();
      Sound.fanfare(); Voice.speak('You look amazing! Be proud of who you are!'); UI.toast('💖 New look saved!'); UI.close();
    };
  },
  buyLook(slot, it, tab, look) {
    const price = it[2], have = Save.data.coins;
    const preview = Object.assign({}, look, { [slot]: wardrobeValue(slot, it) });
    if (have < price) {
      Sound.wrong();
      UI.open(`<h2>🔒 ${esc(it[1])}</h2><div class="center">${avatarSVG(preview)}</div>
        <p class="center" style="font-size:20px">This costs 🪙 ${price}. You have 🪙 ${have}.<br><b>${price - have} more coins</b> to go - keep playing! 💪</p>
        <div class="row-btns"><button class="big-btn pink" id="bq-back">OK</button></div>`);
      $('bq-back').onclick = () => this.boutique(tab, look);
      return;
    }
    UI.open(`<h2>Buy ${esc(it[1])}?</h2><div class="center">${avatarSVG(preview)}</div>
      <p class="center" style="font-size:22px">🪙 ${price} <span class="muted">(you have ${have})</span></p>
      <p class="center muted">Remember: coins also buy real rewards from your grown-up!</p>
      <div class="row-btns"><button class="big-btn pink" id="bq-yes">Yes, buy it!</button><button class="big-btn gray" id="bq-no">Not now</button></div>`);
    $('bq-yes').onclick = () => {
      Save.data.coins -= price; Save.data.owned.push(slot + ':' + it[0]); Save.write(); UI.updateCoins();
      Sound.fanfare(); look[slot] = wardrobeValue(slot, it);
      this.boutique(tab, look);
    };
    $('bq-no').onclick = () => this.boutique(tab, look);
  },

  // ===== Nail & Pedi Spa =====
  cust_spa(b) {
    const pc = shuffle(PAINT_COLORS.filter(c => c[0] !== 'White'));
    const A = pc[0], B = pc[1];
    let want, text, check;                              // want: array of 5 colors (positional) or null for count-based
    const r = Math.random();
    if (b === 0 && r < 0.5) { want = Array(5).fill(A[1]); text = `Please paint all 5 nails ${A[0]}!`; }
    else if (b <= 1 && r < 0.75) { const a = rnd(1, 4); check = { [A[1]]: a, [B[1]]: 5 - a }; text = `Please paint ${a} nail${a > 1 ? 's' : ''} ${A[0]} and ${5 - a} nail${5 - a > 1 ? 's' : ''} ${B[0]}.`; }
    else if (b <= 1) { want = [A, B, A, B, A].map(c => c[1]); text = `I want a pattern from thumb to pinky: ${A[0]}, ${B[0]}, ${A[0]}, ${B[0]}, ${A[0]}.`; }
    else if (r < 0.3) { want = [A, B, B, B, A].map(c => c[1]); text = `Paint my thumb and pinky ${A[0]}, and the middle three nails ${B[0]}.`; }
    else if (r < 0.55) { want = [A, B, A, B, A].map(c => c[1]); text = `Make an A-B pattern with ${A[0]} and ${B[0]}. Start with ${A[0]} on the thumb!`; }
    else if (r < 0.8) { const k = rnd(1, 4); check = { [A[1]]: k, [B[1]]: 5 - k }; text = `Paint ${k}/5 of my nails ${A[0]} and the rest ${B[0]}.`; }
    else { want = [A, B, A, B, A].map(c => c[1]); text = `Paint the odd-numbered nails (1st, 3rd, 5th) ${A[0]} and the even ones ${B[0]}.`; }
    const nails = [null, null, null, null, null];
    let cur = PAINT_COLORS[0][1];
    const render = () => {
      UI.open(this.custHeader(text) + `<div class="nail-wrap">${handSVG(nails, 'solid')}</div>
        <p class="center muted">Tap a color, then tap each nail. Thumb is on the left.</p>
        ${swatches(PAINT_COLORS, cur, 'pc')}
        <div class="row-btns"><button class="mid-btn" id="sp-clear">🧽 Remove polish</button><button class="big-btn pink" id="sp-serve">All done! 💅</button></div>`);
      $('cu-say').onclick = () => Voice.speak(text);
      document.querySelectorAll('[data-pc]').forEach(bn => bn.onclick = () => { cur = +bn.dataset.pc; Sound.tap(); render(); });
      document.querySelectorAll('.nail').forEach(n => n.onclick = () => { nails[+n.dataset.n] = cur; Sound.tap(); render(); });
      $('sp-clear').onclick = () => { nails.fill(null); render(); };
      $('sp-serve').onclick = () => {
        let ok;
        if (want) ok = want.every((c, i) => nails[i] === c);
        else { const got = {}; nails.forEach(c => { if (c != null) got[c] = (got[c] || 0) + 1; }); ok = Object.keys(check).every(c => got[c] === check[c]) && nails.every(c => c != null); }
        this.served(ok, want ? `From thumb to pinky: ${want.map(c => colorName(c)).join(', ')}.` : `They wanted ${Object.entries(check).map(([c, n]) => `${n} ${colorName(+c)}`).join(' and ')}.`);
      };
    };
    render(); Voice.speak(text);
  },
  treat_spa() {
    // Step 1: soak (pop the bubbles), step 2: lotion, step 3: paint my own nails & toes.
    let popped = 0;
    const bubbles = Array.from({ length: 8 }, () => ({ x: rnd(5, 85), y: rnd(5, 70) }));
    UI.open(`<h2>💅 Spa time!</h2><p class="center" style="font-size:20px">Step 1: Soak your feet 🛁 - pop all the bubbles!</p>
      <div class="soak">${bubbles.map((b, i) => `<button class="bubble" data-b="${i}" style="left:${b.x}%;top:${b.y}%">🫧</button>`).join('')}<div class="tub">🦶🦶</div></div>`);
    Voice.speak('Spa time! Soak your feet and pop all the bubbles!');
    document.querySelectorAll('.bubble').forEach(bn => bn.onclick = () => {
      bn.remove(); popped++; Sound.tap();
      if (popped === bubbles.length) {
        UI.open(`<h2>💅 Spa time!</h2><p class="center" style="font-size:20px">Step 2: Rub on the lotion 🧴</p><div class="result-big" id="lotion">🧴</div>
          <div class="row-btns"><button class="big-btn purple" id="sp-rub">Rub rub rub! ✋</button></div>`);
        let rubs = 0;
        $('sp-rub').onclick = () => {
          rubs++; Sound.tap(); $('lotion').textContent = ['🧴', '✨', '💗', '✨'][rubs % 4];
          if (rubs >= 5) this.paintMine();
        };
      }
    });
  },
  paintMine() {
    const look = Save.data.look;
    const nails = { hand: look.nails.hand.slice(), foot: look.nails.foot.slice(), pattern: look.nails.pattern || 'solid' };
    let cur = PAINT_COLORS[0][1], part = 'hand';
    const render = () => {
      UI.open(`<h2>💅 Step 3: Paint my ${part === 'hand' ? 'nails' : 'toes'}!</h2>
        <div class="row-btns" style="margin-top:0"><button class="mid-btn ${part === 'hand' ? 'on' : ''}" id="pm-hand">✋ Fingernails</button><button class="mid-btn ${part === 'foot' ? 'on' : ''}" id="pm-foot">🦶 Toenails</button></div>
        <div class="nail-wrap">${part === 'hand' ? handSVG(nails.hand, nails.pattern) : footSVG(nails.foot, nails.pattern)}</div>
        ${swatches(PAINT_COLORS, cur, 'pc')}
        <div class="tool-row">${PATTERNS.map(([k, n]) => `<button class="mid-btn ${nails.pattern === k ? 'on' : ''}" data-pt="${k}">${n}</button>`).join('')}</div>
        <div class="row-btns"><button class="mid-btn" id="pm-all">🖌️ Paint all</button><button class="mid-btn" id="pm-clear">🧽 Remove</button><button class="big-btn pink" id="pm-done">So pretty! 💖</button></div>`);
      $('pm-hand').onclick = () => { part = 'hand'; render(); };
      $('pm-foot').onclick = () => { part = 'foot'; render(); };
      document.querySelectorAll('[data-pc]').forEach(bn => bn.onclick = () => { cur = +bn.dataset.pc; Sound.tap(); render(); });
      document.querySelectorAll('[data-pt]').forEach(bn => bn.onclick = () => { nails.pattern = bn.dataset.pt; Sound.tap(); render(); });
      document.querySelectorAll('.nail').forEach(n => n.onclick = () => { nails[part][+n.dataset.n] = cur; Sound.tap(); render(); });
      $('pm-all').onclick = () => { nails[part].fill(cur); Sound.tap(); render(); };
      $('pm-clear').onclick = () => { nails[part].fill(null); render(); };
      $('pm-done').onclick = () => {
        look.nails = nails; Save.write(); Sound.fanfare();
        Voice.speak('Your nails and toes look beautiful!');
        UI.open(`<h2>💖 Gorgeous!</h2><div class="nail-pair">${handSVG(nails.hand, nails.pattern)}${footSVG(nails.foot, nails.pattern)}</div>
          <p class="affirm">You look beautiful - inside and out!</p><div class="row-btns"><button class="big-btn pink" id="pm-bye">Thank you!</button></div>`);
        $('pm-bye').onclick = () => UI.close();
      };
    };
    render();
  },
};
