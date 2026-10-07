// Co-op mission "Secret Agents: Escape the Lab". Players get DIFFERENT information and must talk to each other.
//   Room 1 Color code  - Agent A sees the code, Agent B has the buttons.
//   Room 2 Secret note - Agent B (the child) READS the note aloud, Agent A presses the matching button.
//   Room 3 Power lock  - Agent A reads the problem, Agent B (the child) solves it on the keypad.
// With no partner online, Pip the dragon plays Agent A on the same screen.
'use strict';

const CODE_COLORS = [['red', '🔴', '#e8303a'], ['blue', '🔵', '#2a78d6'], ['green', '🟢', '#1baf7a'], ['yellow', '🟡', '#eda100'], ['purple', '🟣', '#8f4dff']];
const NOTE_ITEMS = [['star', '⭐'], ['heart', '❤️'], ['moon', '🌙'], ['flower', '🌸'], ['crown', '👑'], ['fish', '🐟']];

const Coop = {
  active: null,

  // Build the three rooms. Difficulty follows the child's measured levels when the child starts it.
  makeContent() {
    const codeLen = Learn.tracking && Learn.levelFor('patterns') >= 3 ? 5 : 4;
    const code = Array.from({ length: codeLen }, () => R.pick(CODE_COLORS)[0]);
    // the note: a short decodable sentence; distractor buttons share the color or the object
    const [cName, cEmoji] = R.pick(CODE_COLORS.slice(0, 4)).slice(0, 2), item = R.pick(NOTE_ITEMS);
    const big = Math.random() < 0.5;
    const answer = `${big ? 'big' : 'little'} ${cName} ${item[0]}`;
    const options = R.shuffle([answer, `${big ? 'little' : 'big'} ${cName} ${item[0]}`, `${big ? 'big' : 'little'} ${R.pick(CODE_COLORS.filter(c => c[0] !== cName))[0]} ${item[0]}`, `${big ? 'big' : 'little'} ${cName} ${R.pick(NOTE_ITEMS.filter(i => i !== item))[0]}`]);
    const note = R.pick([`The door will open if you press the ${answer}.`, `Press the ${answer} to get out.`, `Find the ${answer} and press it.`]);
    // power lock: missing addend (grade 1)
    const lv = Learn.tracking ? Learn.levelFor('number_bonds') : 2;
    const need = lv <= 2 ? 10 : R.int(11, 20), have = R.int(Math.max(1, need - 9), need - 1);
    return { code, note, answer, options, need, have, itemEmoji: item[1] };
  },

  start() {
    const partner = [...Net.players.values()][0];
    const content = this.makeContent();
    let roles;
    if (partner) {
      // the child does the reading and solving; a parent holds the clues
      const meChild = Profile.isChild(), partnerChild = partner.role !== 'parent';
      const meA = !meChild || (meChild && partnerChild);
      roles = { [Net.myId]: meA ? 'A' : 'B', [partner.id]: meA ? 'B' : 'A' };
      Net.sendX('coop', { op: 'start', content, roles });
    }
    this.begin(content, partner ? roles[Net.myId] : 'solo', partner ? partner.name : 'Pip the dragon');
  },
  begin(content, role, partnerName) {
    this.active = { content, role, partnerName, room: 0, entry: [], t0: performance.now(), tries: 0 };
    Learn.countActivity('coop');
    this.render();
    Voice.speak(role === 'solo' ? 'Secret agents! Pip the dragon will help you escape the lab!' : `Secret agents! Talk to ${partnerName} to escape the lab!`);
  },

  header(title, hint) {
    const a = this.active;
    return `<div class="mg-head"><span>🕵️ Escape the Lab · Door ${a.room + 1} of 3</span><span class="muted">${a.role === 'solo' ? 'with 🐲 Pip' : `with ${esc(a.partnerName)} · you are Agent ${a.role}`}</span></div>
      <h2>${title}</h2>${hint ? `<p class="center muted">${hint}</p>` : ''}`;
  },
  render() {
    const a = this.active; if (!a) return;
    const c = a.content, role = a.role;
    let html = '';
    if (a.room === 0) {
      const codeHTML = `<div class="code-row">${c.code.map(n => `<span>${CODE_COLORS.find(x => x[0] === n)[1]}</span>`).join('')}</div>`;
      const pad = `<div class="code-slots">${c.code.map((_, i) => `<span>${a.entry[i] ? CODE_COLORS.find(x => x[0] === a.entry[i])[1] : '·'}</span>`).join('')}</div>
        <div class="code-pad">${CODE_COLORS.map(([n, e, h]) => `<button data-col="${n}" style="background:${h}">${n}</button>`).join('')}</div><div class="row-btns"><button class="mid-btn" id="cp-clear">⌫ Clear</button></div>`;
      if (role === 'A') html = this.header('🔐 Color Code Door', 'Only YOU can see the code. Tell your partner the colors in order!') + codeHTML + '<p class="center">Waiting for your partner to press the buttons… 🎙️</p>';
      else if (role === 'B') html = this.header('🔐 Color Code Door', `${esc(a.partnerName)} can see the code. Listen and press the colors in order!`) + pad;
      else html = this.header('🔐 Color Code Door', 'Pip will show you the secret code for 4 seconds. Remember it, then press the colors in order!') + `<div id="pip-code">${codeHTML}<p class="center">🐲 Pip: “Quick, remember it!”</p></div>` + pad;
    } else if (a.room === 1) {
      const noteHTML = `<div class="secret-note">📜 ${esc(c.note)}</div>`;
      const btns = `<div class="choices">${c.options.map((o, k) => `<button class="choice note-opt" data-o="${k}">${esc(o)}</button>`).join('')}</div>`;
      if (role === 'B') html = this.header('📜 The Secret Note', `Read the note OUT LOUD to ${esc(a.partnerName)}. They have the buttons!`) + noteHTML + '<p class="center">Waiting for your partner to press the right button… 🎙️</p>';
      else if (role === 'A') html = this.header('📜 The Secret Note', 'Your partner has a secret note. Listen while they read it, then press the right button!') + btns;
      else html = this.header('📜 The Secret Note', 'Read the note, then press the button it tells you to!') + noteHTML + btns;
    } else {
      const story = `<div class="secret-note">🔋 We need <b>${c.need}</b> batteries to power the door. The robot already has <b>${c.have}</b>. How many more batteries do we need?</div>`;
      const pad = `<div class="batteries">${Array.from({ length: c.need }, (_, i) => `<span class="${i < c.have ? 'full' : ''}">🔋</span>`).join('')}</div>
        <div class="num-pad">${Array.from({ length: Math.min(20, c.need) + 1 }, (_, i) => `<button data-n="${i}">${i}</button>`).join('')}</div>`;
      if (role === 'A') html = this.header('⚡ The Power Lock', 'Read the problem to your partner. They solve it on the keypad!') + story + '<p class="center">Waiting for your partner… 🎙️</p>';
      else if (role === 'B') html = this.header('⚡ The Power Lock', `${esc(a.partnerName)} will read you the problem. Count the empty battery spots!`) + pad;
      else html = this.header('⚡ The Power Lock', 'Solve it to power the door!') + story + pad;
    }
    UI.open(html + '<div id="cp-msg" class="center"></div>', { onClose: () => this.quit(true) });
    this.bind();
  },
  bind() {
    const a = this.active, c = a.content;
    if (a.room === 0) {
      if (a.role === 'solo' && !a.shown) { a.shown = true; setTimeout(() => { const p = $('pip-code'); if (p && this.active && this.active.room === 0) p.innerHTML = '<p class="center">🐲 Pip: “Now press the colors in order!”</p>'; }, 4000); }
      else if (a.role === 'solo' && $('pip-code')) $('pip-code').innerHTML = '<p class="center">🐲 Pip: “Press the colors in order!” <button class="speak" id="cp-peek">👀 Peek again</button></p>';
      if ($('cp-peek')) $('cp-peek').onclick = () => { a.shown = false; a.entry = []; this.render(); };
      document.querySelectorAll('[data-col]').forEach(b => b.onclick = () => {
        if (a.entry.length >= c.code.length) return;
        a.entry.push(b.dataset.col); Sound.tap(); Voice.speak(b.dataset.col);
        if (a.entry.length === c.code.length) {
          const ok = a.entry.every((v, i) => v === c.code[i]);
          this.result(ok);
        } else this.render();
      });
      if ($('cp-clear')) $('cp-clear').onclick = () => { a.entry = []; this.render(); };
    } else if (a.room === 1) {
      document.querySelectorAll('.note-opt').forEach(b => b.onclick = () => {
        const ok = c.options[+b.dataset.o] === c.answer;
        b.classList.add(ok ? 'right' : 'wrong');
        this.result(ok);
      });
    } else {
      document.querySelectorAll('[data-n]').forEach(b => b.onclick = () => this.result(+b.dataset.n === c.need - c.have, +b.dataset.n));
    }
  },
  // Whoever acted reports the result; both screens move on together.
  result(ok, chosen) {
    const a = this.active;
    a.tries++;
    this.recordLearning(a.room, ok, chosen);
    if (a.role !== 'solo') Net.sendX('coop', { op: ok ? 'open' : 'wrong', room: a.room });
    ok ? this.open() : this.wrong();
  },
  // The child's own device records what she did: her reading (room 2) and her math (room 3).
  recordLearning(room, ok, chosen) {
    const a = this.active;
    if (!Learn.tracking) return;
    if (room === 1 && (a.role === 'solo' || a.role === 'B')) Learn.recordWorld('directions', ok, { firstTry: a.tries <= 1 });
    if (room === 2 && (a.role === 'solo' || a.role === 'B')) Learn.recordWorld('number_bonds', ok, { firstTry: a.tries <= 1, chosen: chosen != null ? String(chosen) : null });
  },
  wrong() {
    const a = this.active; if (!a) return;
    Sound.wrong(); a.entry = [];
    const msg = $('cp-msg'); if (msg) msg.innerHTML = '<p class="affirm">🚨 Beep boop! Not quite - talk it over and try again!</p>';
    Voice.speak('Not quite. Talk it over and try again!');
    setTimeout(() => { if (this.active === a) this.render(); }, 1400);
  },
  open() {
    const a = this.active; if (!a) return;
    Sound.door(); Rewards.confetti(60);
    a.room++; a.entry = []; a.tries = 0;
    if (a.room >= 3) return this.win();
    UI.toast(`🚪 Door ${a.room} opened! Great teamwork!`);
    Voice.speak('The door opened! Great teamwork!');
    this.render();
  },
  win() {
    const a = this.active; this.active = null;
    const together = a.role !== 'solo';
    UI.open(`<h2>🕵️ You escaped the lab!</h2><div class="result-big">🎉🔓🎉</div><p class="affirm">${together ? 'Amazing teamwork, agents!' : 'You and Pip make a great team!'}</p>
      <div class="row-btns"><button class="big-btn pink" id="cp-ok">Open the reward!</button></div>`, { closable: false });
    Rewards.celebrate('big');
    Voice.speak(together ? 'You escaped the lab! Amazing teamwork!' : 'You escaped the lab!');
    if (together) Family.record('coop', 'Escaped the Secret Agent lab together'); else Daily.progress('coop');
    Daily.progress('adventure');
    $('cp-ok').onclick = () => { UI.close(); Rewards.mysteryBox(together ? 'rare' : 'common'); };
  },
  quit(local) {
    if (!this.active) return;
    const a = this.active; this.active = null;
    if (local && a.role !== 'solo') Net.sendX('coop', { op: 'quit' });
  },
};

Net.on('coop', (from, d) => {
  if (!d || typeof d !== 'object') return;
  const pl = Net.players.get(from), name = pl ? pl.name : 'Your partner';
  if (d.op === 'start' && d.content && d.roles && d.roles[Net.myId]) {
    const c = d.content;
    if (!Array.isArray(c.code) || !Array.isArray(c.options)) return;
    UI.close();
    World2.hideAlert();
    Coop.begin(c, d.roles[Net.myId] === 'B' ? 'B' : 'A', name);
  } else if (!Coop.active) {
    return;
  } else if (d.op === 'open' && d.room === Coop.active.room) Coop.open();
  else if (d.op === 'wrong' && d.room === Coop.active.room) Coop.wrong();
  else if (d.op === 'quit') { Coop.active = null; UI.close(); UI.toast(`${name} left the mission`); }
});
