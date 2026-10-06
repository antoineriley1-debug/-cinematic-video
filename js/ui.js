// UI: modals, toasts, HUD, title, level map, kid reward store, and the PIN-locked parent area.
'use strict';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const UI = {
  modalOpen: false,
  onModalClose: null,

  // ---------- modal ----------
  open(html, opts = {}) {
    const box = $('modal-box');
    box.innerHTML = (opts.closable === false ? '' : '<button class="close-x" id="modal-x">✕</button>') + html;
    $('modal').classList.remove('hidden');
    this.modalOpen = true;
    this.onModalClose = opts.onClose || null;
    box.scrollTop = 0;
    const x = $('modal-x'); if (x) x.onclick = () => { Sound.tap(); this.close(); };
  },
  close() {
    $('modal').classList.add('hidden');
    $('modal-box').innerHTML = '';
    this.modalOpen = false;
    Voice.stop();
    const cb = this.onModalClose; this.onModalClose = null;
    if (cb) cb();
  },

  toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    $('toasts').appendChild(t);
    setTimeout(() => t.remove(), 2500);
    while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
  },

  updateCoins(gained) {
    $('hud-coins').textContent = '🪙 ' + Save.data.coins;
    if (gained) {
      $('hud-coins').animate([{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 300 });
    }
  },

  setLevelHud(level) {
    const th = themeFor(level), tr = tierFor(level);
    $('hud-level').textContent = `Lv ${level} · ${th.name}`;
    $('hud-tier').textContent = `${tr.icon} ${tr.name}`;
    $('hud-tier').style.color = tr.color;
    this.updateCoins();
  },

  // ---------- title ----------
  showTitle() {
    $('title').classList.remove('hidden');
    $('hud').classList.add('hidden');
    const lv = Save.data.unlocked, tr = tierFor(lv);
    $('title-tier').innerHTML = `${tr.icon} ${esc(tr.name)} · Level ${lv} of ${TOTAL_LEVELS} · 🪙 ${Save.data.coins}`;
    $('btn-play').textContent = Save.data.completed.length || Save.data.levelState ? '▶ Continue' : '▶ Play';
  },
  hideTitle() { $('title').classList.add('hidden'); $('hud').classList.remove('hidden'); },

  // ---------- level map ----------
  showLevels() {
    let html = '<h2>🗺️ Kingdom Map</h2><p class="center muted">10 tiers · 20 worlds · 100 levels. Tap any unlocked level to play.</p>';
    TIERS.forEach((tr, ti) => {
      html += `<div class="tier-block"><div class="tier-title" style="color:${tr.color}">${tr.icon} Tier ${ti + 1}: ${esc(tr.name)}</div><div class="lv-grid">`;
      for (let l = ti * 10 + 1; l <= ti * 10 + 10; l++) {
        const locked = l > Save.data.unlocked, done = Save.data.completed.includes(l);
        const cls = locked ? 'locked' : done ? 'done' : '';
        const cur = l === Save.data.current ? ' current' : '';
        html += `<button class="lv ${cls}${cur}" data-lv="${l}" title="${esc(themeFor(l).name)}">${locked ? '🔒' : done ? '⭐' + l : l}</button>`;
      }
      html += '</div></div>';
    });
    this.open(html);
    document.querySelectorAll('.lv').forEach(b => b.onclick = () => {
      const l = +b.dataset.lv;
      if (l > Save.data.unlocked) { Sound.wrong(); this.toast('Finish earlier levels to unlock!'); return; }
      Sound.tap(); this.close(); Game.startLevel(l);
    });
  },

  // ---------- pause menu ----------
  showMenu() {
    const lv = Game.level, th = themeFor(lv);
    const acc = Save.data.answered ? Math.round(100 * Save.data.correct / Save.data.answered) : 0;
    this.open(`<h2>⏸️ Paused</h2>
      <p class="center"><b>Level ${lv}</b> · ${esc(th.name)}<br><span class="muted">“${esc(th.msg)}”</span></p>
      <p class="center">⭐ Levels done: <b>${Save.data.completed.length}</b> · 🧠 Answers right: <b>${acc}%</b></p>
      <div class="row-btns">
        <button class="big-btn pink" id="m-resume">▶ Keep Playing</button>
      </div>
      <div class="row-btns">
        <button class="mid-btn" id="m-levels">🗺️ Levels</button>
        <button class="mid-btn" id="m-store">🛍️ Rewards</button>
        <button class="mid-btn" id="m-help">❓ How to Play</button>
        <button class="mid-btn" id="m-parent">🔒 Parents</button>
        <button class="mid-btn" id="m-home">🏠 Title</button>
      </div>`);
    $('m-resume').onclick = () => this.close();
    $('m-levels').onclick = () => this.showLevels();
    $('m-store').onclick = () => this.showStore();
    $('m-help').onclick = () => this.showHelp();
    $('m-parent').onclick = () => this.showParentGate();
    $('m-home').onclick = () => { this.close(); Game.stop(); this.showTitle(); };
  },

  showHelp(after) {
    this.open(`<h2>👑 How to Play</h2>
      <div style="font-size:19px;line-height:1.6">
      🕹️ <b>Move:</b> drag the pink joystick (bottom-left).<br>
      ⬆️ <b>Jump:</b> tap the purple JUMP button.<br>
      👆 <b>Look around:</b> swipe anywhere on the screen.<br>
      💎 <b>Collect gems</b> all over the kingdom.<br>
      🌀 <b>Walk into portals</b> to play learning games and win 🔑 keys.<br>
      💬 <b>Help friends</b> with a <b>!</b> over their heads.<br>
      🗼 <b>Climb the tower</b> and grab the 👑 crown on top.<br>
      🏰 When everything is done, the <b>castle door opens</b> - go through the magic portal inside to the next level!<br>
      🪙 <b>Coins</b> buy real rewards in the 🛍️ store that your grown-up sets up.
      </div>
      <div class="row-btns"><button class="big-btn pink" id="h-ok">Let's go!</button></div>`, { onClose: after });
    $('h-ok').onclick = () => this.close();
  },

  // ---------- kid store ----------
  showStore() {
    const items = Save.parent.items;
    let html = `<h2>🛍️ Royal Reward Store</h2><p class="center" style="font-size:22px;font-weight:800;color:#b8860b">You have 🪙 ${Save.data.coins}</p>`;
    if (!items.length) html += '<p class="center muted">No rewards yet. Ask your grown-up to add some in the Parents area!</p>';
    html += '<div class="store-grid">';
    items.forEach(it => {
      const can = Save.data.coins >= it.price;
      const pct = Math.min(100, Math.round(100 * Save.data.coins / Math.max(1, it.price)));
      html += `<div class="item"><div class="em">${esc(it.emoji)}</div><div class="nm">${esc(it.name)}</div><div class="pr">🪙 ${it.price}</div>
        ${can ? '' : `<div class="bar"><div style="width:${pct}%"></div></div><div class="muted">${it.price - Save.data.coins} more coins</div>`}
        <button class="${can ? 'pink' : 'gray'}" data-buy="${esc(it.id)}">${can ? 'Get it!' : 'Saving up'}</button></div>`;
    });
    html += '</div>';
    const mine = Save.data.purchases.slice().reverse();
    if (mine.length) {
      html += '<h3>🎁 My rewards</h3><div class="list">';
      mine.slice(0, 20).forEach(p => {
        html += `<div class="list-row"><span style="font-size:24px">${esc(p.emoji)}</span><b style="flex:1">${esc(p.name)}</b>
          <span class="muted">${p.delivered ? '✅ Received' : '⏳ Waiting for grown-up'}</span></div>`;
      });
      html += '</div>';
    }
    this.open(html);
    document.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
      const it = Save.parent.items.find(i => i.id === b.dataset.buy);
      if (!it) return;
      if (Save.data.coins < it.price) { Sound.wrong(); this.toast(`Keep playing! ${it.price - Save.data.coins} more coins.`); return; }
      this.confirmBuy(it);
    });
  },

  confirmBuy(it) {
    this.open(`<h2>Get this reward?</h2><div class="result-big">${esc(it.emoji)}</div>
      <p class="center" style="font-size:22px"><b>${esc(it.name)}</b><br>for 🪙 ${it.price}</p>
      <div class="row-btns"><button class="big-btn pink" id="b-yes">Yes!</button><button class="big-btn gray" id="b-no">Not yet</button></div>`);
    $('b-yes').onclick = () => {
      Save.data.coins -= it.price;
      Save.data.purchases.push({ id: it.id, emoji: it.emoji, name: it.name, price: it.price, date: new Date().toISOString(), delivered: false });
      Save.write(); this.updateCoins();
      Sound.fanfare();
      this.open(`<h2>🎉 You earned it!</h2><div class="result-big">${esc(it.emoji)}</div>
        <p class="center" style="font-size:22px">Show your grown-up to get <b>${esc(it.name)}</b>!</p>
        <p class="affirm">Your hard work paid off!</p>
        <div class="row-btns"><button class="big-btn pink" id="b-ok">Yay!</button></div>`);
      Voice.speak('You earned it! Show your grown up to get ' + it.name);
      $('b-ok').onclick = () => this.showStore();
    };
    $('b-no').onclick = () => this.showStore();
  },

  // ---------- parent area ----------
  showParentGate() {
    const p = Save.parent;
    if (!p.pin) {
      this.open(`<h2>🔒 Parent Setup</h2><p class="center">Create a 4-digit PIN so only grown-ups can change rewards and prices.</p>
        <input id="pin1" class="pin-input" type="password" inputmode="numeric" maxlength="4" placeholder="••••">
        <input id="pin2" class="pin-input" type="password" inputmode="numeric" maxlength="4" placeholder="again">
        <div class="row-btns"><button class="big-btn purple" id="pin-save">Save PIN</button></div><p id="pin-msg" class="center"></p>`);
      $('pin-save').onclick = () => {
        const a = $('pin1').value.trim(), b = $('pin2').value.trim();
        if (!/^\d{4}$/.test(a)) { $('pin-msg').textContent = 'PIN must be 4 numbers.'; return; }
        if (a !== b) { $('pin-msg').textContent = 'PINs do not match.'; return; }
        p.pin = a; Save.writeParent(); this.showParent();
      };
      return;
    }
    this.open(`<h2>🔒 Grown-ups Only</h2><p class="center">Enter your PIN</p>
      <input id="pin" class="pin-input" type="password" inputmode="numeric" maxlength="4" placeholder="••••">
      <div class="row-btns"><button class="big-btn purple" id="pin-go">Enter</button></div><p id="pin-msg" class="center"></p>`);
    const go = () => {
      if ($('pin').value === p.pin) this.showParent();
      else { Sound.wrong(); $('pin-msg').textContent = 'That PIN is not right.'; $('pin').value = ''; }
    };
    $('pin-go').onclick = go;
    $('pin').onkeydown = (e) => { if (e.key === 'Enter') go(); };
    setTimeout(() => $('pin') && $('pin').focus(), 50);
  },

  showParent(tab = 'store') {
    const tabs = [['store', '🛍️ Store & Prices'], ['orders', '🎁 Redeemed'], ['progress', '📊 Progress'], ['settings', '⚙️ Settings']];
    let html = '<h2>👪 Parent Area</h2><div class="row-btns" style="margin-top:0">' +
      tabs.map(([k, n]) => `<button class="mid-btn" data-tab="${k}" style="${k === tab ? 'background:#ff69b4;color:#fff' : ''}">${n}</button>`).join('') + '</div>';
    html += '<div id="ptab"></div>';
    this.open(html);
    document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => this.showParent(b.dataset.tab));
    this['parent_' + tab]();
  },

  parent_store() {
    const p = Save.parent;
    let html = `<h3>Rewards your child can earn</h3>
      <p class="muted">Set the name, emoji and coin price for each reward. Your child earns roughly 80 coins per level early on and up to ~400 in the hardest levels
      (gems, learning games, helping friends, tower, and level completion). Use Settings to speed up or slow down earning.</p><div class="list" id="items">`;
    p.items.forEach((it, i) => {
      html += `<div class="list-row" data-i="${i}">
        <input class="em-in" value="${esc(it.emoji)}" maxlength="4" aria-label="emoji">
        <input class="nm-in" value="${esc(it.name)}" maxlength="40" aria-label="name">
        <input class="pr-in" type="number" inputmode="numeric" min="1" value="${it.price}" aria-label="price">
        <button class="small-btn gray" data-del="${i}">🗑️</button></div>`;
    });
    html += `</div><div class="row-btns"><button class="mid-btn" id="add-item">➕ Add reward</button>
      <button class="big-btn green" id="save-items" style="font-size:20px;padding:12px 30px">💾 Save store</button></div><p id="st-msg" class="center"></p>`;
    $('ptab').innerHTML = html;
    const collect = () => {
      document.querySelectorAll('#items .list-row').forEach(row => {
        const it = p.items[+row.dataset.i]; const ins = row.querySelectorAll('input');
        it.emoji = ins[0].value.trim() || '🎁';
        it.name = ins[1].value.trim() || 'Reward';
        it.price = Math.max(1, Math.round(+ins[2].value || 1));
      });
    };
    $('add-item').onclick = () => { collect(); p.items.push({ id: 'r' + Date.now(), emoji: '🎁', name: 'New reward', price: 100 }); this.parent_store(); };
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { collect(); p.items.splice(+b.dataset.del, 1); this.parent_store(); });
    $('save-items').onclick = () => { collect(); Save.writeParent(); $('st-msg').textContent = '✅ Saved!'; Sound.right(); };
  },

  parent_orders() {
    const list = Save.data.purchases;
    let html = '<h3>Rewards your child has bought</h3>';
    if (!list.length) html += '<p class="muted">Nothing redeemed yet.</p>';
    html += '<div class="list">';
    list.slice().reverse().forEach((pu) => {
      const i = list.indexOf(pu);
      html += `<div class="list-row"><span style="font-size:24px">${esc(pu.emoji)}</span><div style="flex:1"><b>${esc(pu.name)}</b><br>
        <span class="muted">🪙 ${pu.price} · ${new Date(pu.date).toLocaleDateString()}</span></div>
        ${pu.delivered ? '<span>✅ Given</span>' : `<button class="small-btn green" data-give="${i}">Mark given</button><button class="small-btn gray" data-refund="${i}">Refund</button>`}</div>`;
    });
    html += '</div>';
    $('ptab').innerHTML = html;
    document.querySelectorAll('[data-give]').forEach(b => b.onclick = () => { list[+b.dataset.give].delivered = true; Save.write(); this.parent_orders(); });
    document.querySelectorAll('[data-refund]').forEach(b => b.onclick = () => {
      const pu = list[+b.dataset.refund]; Save.data.coins += pu.price; list.splice(+b.dataset.refund, 1); Save.write(); this.updateCoins(); this.parent_orders();
    });
  },

  parent_progress() {
    const d = Save.data;
    const acc = d.answered ? Math.round(100 * d.correct / d.answered) : 0;
    let html = `<h3>Progress</h3>
      <p>Highest level unlocked: <b>${d.unlocked}</b> / ${TOTAL_LEVELS} · Tier: <b>${tierFor(d.unlocked).icon} ${esc(tierFor(d.unlocked).name)}</b></p>
      <p>Levels completed: <b>${d.completed.length}</b> · Coins now: <b>${d.coins}</b> · Coins earned all-time: <b>${d.lifetimeCoins}</b></p>
      <p>Questions answered: <b>${d.answered}</b> · Correct: <b>${acc}%</b></p><h3>By subject</h3><div class="list">`;
    const subs = Object.keys(d.subjects);
    if (!subs.length) html += '<p class="muted">No learning games played yet.</p>';
    subs.forEach(s => {
      const v = d.subjects[s], pc = Math.round(100 * v.right / v.total);
      html += `<div class="list-row"><b style="flex:1">${esc(s)}</b><span>${v.right}/${v.total} (${pc}%)</span>
        <div class="bar" style="width:100%;margin:0"><div style="width:${pc}%"></div></div></div>`;
    });
    html += '</div>';
    $('ptab').innerHTML = html;
  },

  parent_settings() {
    const p = Save.parent;
    $('ptab').innerHTML = `<h3>Settings</h3>
      <div class="setting"><span>Coin earning speed</span><select id="s-mult">
        ${[[0.5, 'Slower (½×)'], [1, 'Normal (1×)'], [1.5, 'Faster (1.5×)'], [2, 'Fast (2×)']].map(([v, n]) => `<option value="${v}" ${p.coinMultiplier == v ? 'selected' : ''}>${n}</option>`).join('')}
      </select></div>
      <div class="setting"><span>Read questions out loud</span><select id="s-voice"><option value="1" ${p.voice ? 'selected' : ''}>On</option><option value="0" ${!p.voice ? 'selected' : ''}>Off</option></select></div>
      <div class="setting"><span>Give bonus coins</span><span><input id="s-bonus" type="number" inputmode="numeric" style="width:90px" value="50"> <button class="small-btn green" id="s-give">Give</button></span></div>
      <div class="setting"><span>Unlock levels up to</span><span><input id="s-unlock" type="number" inputmode="numeric" min="1" max="100" style="width:80px" value="${Save.data.unlocked}"> <button class="small-btn purple" id="s-unl">Set</button></span></div>
      <div class="setting"><span>Change PIN</span><span><input id="s-pin" type="password" inputmode="numeric" maxlength="4" style="width:90px" placeholder="new"> <button class="small-btn purple" id="s-pinb">Save</button></span></div>
      <div class="setting"><span>Reset game progress (keeps store & rewards)</span><button class="small-btn" style="background:#e74c3c" id="s-reset">Reset</button></div>
      <p id="s-msg" class="center"></p>`;
    const msg = (t) => { $('s-msg').textContent = t; };
    $('s-mult').onchange = (e) => { p.coinMultiplier = +e.target.value; Save.writeParent(); msg('✅ Saved'); };
    $('s-voice').onchange = (e) => { p.voice = e.target.value === '1'; Save.writeParent(); msg('✅ Saved'); };
    $('s-give').onclick = () => {
      const n = Math.round(+$('s-bonus').value);
      if (n > 0) { Save.data.coins += n; Save.data.lifetimeCoins += n; Save.write(); this.updateCoins(n); msg(`✅ Gave ${n} coins`); }
    };
    $('s-unl').onclick = () => {
      const n = Math.max(1, Math.min(TOTAL_LEVELS, Math.round(+$('s-unlock').value)));
      Save.data.unlocked = n; Save.write(); msg(`✅ Levels 1-${n} unlocked`);
    };
    $('s-pinb').onclick = () => {
      const v = $('s-pin').value; if (!/^\d{4}$/.test(v)) { msg('PIN must be 4 numbers'); return; }
      p.pin = v; Save.writeParent(); msg('✅ PIN changed');
    };
    $('s-reset').onclick = () => {
      if (!confirm('Reset all level progress and coins? Store items and reward history stay.')) return;
      Save.resetProgress(); this.updateCoins(); msg('Progress reset.');
      if (Game.running) { Game.startLevel(1); }
    };
  },
};

// Block iOS pinch-zoom (double-tap zoom is disabled via CSS touch-action).
['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => document.addEventListener(ev, e => e.preventDefault()));
