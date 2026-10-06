// Educational mini-games played inside portals. Difficulty scales with level.
'use strict';

function clockSVG(h, m) {
  const cx = 90, cy = 90, r = 80;
  const ma = (m / 60) * Math.PI * 2, ha = ((h % 12) / 12 + m / 720) * Math.PI * 2;
  let ticks = '';
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ticks += `<text x="${cx + Math.sin(a) * 64}" y="${cy - Math.cos(a) * 64 + 7}" font-size="20" font-weight="800" text-anchor="middle" fill="#c2185b">${i}</text>`;
  }
  return `<svg class="clock" width="180" height="180" viewBox="0 0 180 180">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="#ff69b4" stroke-width="8"/>${ticks}
    <line x1="${cx}" y1="${cy}" x2="${cx + Math.sin(ha) * 38}" y2="${cy - Math.cos(ha) * 38}" stroke="#5a2346" stroke-width="8" stroke-linecap="round"/>
    <line x1="${cx}" y1="${cy}" x2="${cx + Math.sin(ma) * 58}" y2="${cy - Math.cos(ma) * 58}" stroke="#8f4dff" stroke-width="5" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="6" fill="#ff2e93"/></svg>`;
}

const MiniGames = {
  // opts: { practice: bool, onDone(won:boolean) }
  play(key, level, opts = {}) {
    const g = GAMES[key];
    this.state = { key, g, level, opts, i: 0, right: 0, results: [], total: levelConfig(level).questions };
    if (key === 'memory') return this.memory();
    this.intro();
  },

  intro() {
    const { g, level, total, opts } = this.state;
    UI.open(`<h2>${g.icon} ${g.name}</h2>
      <p class="center" style="font-size:20px">${total} questions · get <b>${this.needed()}</b> right to win a 🔑 key!</p>
      <p class="center muted">${g.subject} · Level ${level}${opts.practice ? ' · Practice round (bonus coins)' : ''}</p>
      <div class="result-big">${g.icon}</div>
      <div class="row-btns"><button class="big-btn pink" id="mg-start">Start!</button></div>`, { onClose: () => this.exit(false) });
    $('mg-start').onclick = () => { Sound.tap(); this.ask(); };
    Voice.speak(g.name + '! Get ' + this.needed() + ' right to win a key.');
  },

  needed() { return Math.ceil(this.state.total * 0.7); },

  header() {
    const s = this.state;
    const dots = Array.from({ length: s.total }, (_, k) => `<span class="${s.results[k] === true ? 'ok' : s.results[k] === false ? 'bad' : ''}"></span>`).join('');
    return `<div class="mg-head"><span>${s.g.icon} ${s.g.name}</span><div class="mg-progress">${dots}</div></div>`;
  },

  ask() {
    const s = this.state;
    if (s.i >= s.total) return this.finish();
    const q = s.g.gen(s.level);
    s.q = q;
    if (q.kind === 'spell') return this.spell(q);
    let html = this.header();
    if (q.story) html += `<div class="mg-story">${esc(q.story)}</div>`;
    html += `<div class="mg-prompt">${esc(q.prompt)} <button class="speak" id="mg-say">🔊</button></div>`;
    if (q.visual) html += `<div class="mg-visual">${esc(q.visual)}</div>`;
    if (q.clock) html += clockSVG(q.clock.h, q.clock.m);
    html += `<div class="choices" ${q.choices.length === 3 ? 'style="grid-template-columns:1fr"' : ''}>` +
      q.choices.map((c, k) => `<button class="choice" data-k="${k}">${esc(c)}</button>`).join('') + '</div>';
    UI.open(html, { onClose: () => this.exit(false) });
    const say = () => Voice.speak((q.story ? q.story + ' ' : '') + q.prompt + (q.choices.length <= 4 && !q.visual ? ' ' + q.choices.join(', or ') : ''));
    $('mg-say').onclick = say;
    if (q.story || s.key === 'heart' || s.level <= 20) say();
    let locked = false;
    document.querySelectorAll('.choice').forEach(b => b.onclick = () => {
      if (locked) return; locked = true;
      const val = q.choices[+b.dataset.k], ok = val === q.answer;
      b.classList.add(ok ? 'right' : 'wrong');
      if (!ok) document.querySelectorAll('.choice').forEach(c => { if (q.choices[+c.dataset.k] === q.answer) c.classList.add('right'); });
      this.answer(ok);
    });
  },

  spell(q) {
    const s = this.state;
    const picked = [];
    const render = () => {
      let html = this.header() + `<div class="mg-prompt">${esc(q.prompt)} <button class="speak" id="mg-say">🔊</button></div>
        <p class="center muted">Hint: it sounds like “${esc(q.word)}” - tap 🔊 to hear it</p>
        <div class="answer-slots">${q.word.split('').map((_, k) => `<div class="slot">${picked[k] !== undefined ? esc(q.letters[picked[k]]) : ''}</div>`).join('')}</div>
        <div class="letters">${q.letters.map((l, k) => `<button class="letter ${picked.includes(k) ? 'used' : ''}" data-k="${k}">${esc(l)}</button>`).join('')}</div>
        <div class="row-btns"><button class="mid-btn" id="sp-undo">⌫ Undo</button></div>`;
      UI.open(html, { onClose: () => this.exit(false) });
      // Hide the word from the hint for older levels so it is real spelling, not copying.
      if (s.level > 10) document.querySelector('.muted').textContent = 'Tap 🔊 to hear the word, then spell it!';
      $('mg-say').onclick = () => Voice.speak('Spell the word: ' + q.word);
      $('sp-undo').onclick = () => { picked.pop(); Sound.tap(); render(); };
      document.querySelectorAll('.letter').forEach(b => b.onclick = () => {
        const k = +b.dataset.k; if (picked.includes(k)) return;
        picked.push(k); Sound.tap();
        if (picked.length === q.word.length) {
          const typed = picked.map(p => q.letters[p]).join('');
          render();
          const ok = typed === q.word;
          document.querySelectorAll('.slot').forEach((el, idx) => { el.style.color = ok ? '#1fb86a' : '#ff9f43'; if (!ok) el.textContent = q.word[idx]; });
          document.querySelectorAll('.letter,#sp-undo').forEach(x => x.disabled = true);
          this.answer(ok);
        } else render();
      });
    };
    render();
    if (s.i === 0 || s.level <= 30) Voice.speak('Spell the word: ' + q.word);
  },

  answer(ok) {
    const s = this.state;
    s.results.push(ok); if (ok) s.right++;
    Save.recordAnswer(s.g.subject, ok);
    if (ok) { Sound.right(); } else { Sound.wrong(); }
    const fb = document.createElement('p');
    fb.className = 'affirm';
    fb.textContent = ok ? pick(['Correct! ✨', 'You got it! 💖', 'Brilliant! 🌟', 'Yes! 👑']) : 'Good try! The right answer is shown. 🌱';
    $('modal-box').appendChild(fb);
    const next = document.createElement('div');
    next.className = 'row-btns';
    next.innerHTML = '<button class="big-btn purple" id="mg-next">Next ➜</button>';
    $('modal-box').appendChild(next);
    $('modal-box').scrollTop = $('modal-box').scrollHeight;
    $('mg-next').onclick = () => { s.i++; this.ask(); };
    if (!ok) Voice.speak('Good try! The answer is ' + String(s.q.answer || s.q.word));
  },

  finish() {
    const s = this.state;
    const won = s.right >= this.needed();
    if (won) {
      const stars = s.right === s.total ? 3 : s.right >= s.total * 0.85 ? 2 : 1;
      const base = 6 + s.level * 0.15 + s.right;
      const coins = Save.addCoins(s.opts.practice ? base * 0.4 : base, 'game');
      const aff = pick(AFFIRMATIONS);
      Sound.fanfare();
      UI.open(`<h2>🎉 You did it!</h2><div class="result-big">${'⭐'.repeat(stars)}</div>
        <p class="center" style="font-size:22px">${s.right} / ${s.total} right</p>
        <p class="affirm">${esc(aff)}</p>
        <p class="center" style="font-size:22px">${s.opts.practice ? '' : '🔑 Golden key earned! · '}🪙 +${coins}</p>
        <div class="row-btns"><button class="big-btn pink" id="mg-done">Back to the kingdom</button></div>`, { onClose: () => this.exit(true) });
      Voice.speak(aff + (s.opts.practice ? '' : ' You earned a golden key!'));
      $('mg-done').onclick = () => UI.close();
    } else {
      UI.open(`<h2>So close! 🌱</h2><div class="result-big">💪</div>
        <p class="center" style="font-size:22px">${s.right} / ${s.total} right · you need ${this.needed()}</p>
        <p class="affirm">Every try makes your brain stronger!</p>
        <div class="row-btns"><button class="big-btn pink" id="mg-retry">Try again</button><button class="big-btn gray" id="mg-quit">Explore</button></div>`, { onClose: () => this.exit(false) });
      Voice.speak('So close! Every try makes your brain stronger. Want to try again?');
      $('mg-retry').onclick = () => { const { key, level, opts } = s; UI.onModalClose = null; this.play(key, level, opts); };
      $('mg-quit').onclick = () => UI.close();
    }
  },

  memory() {
    const s = this.state;
    const pairs = Math.min(10, 4 + Math.floor(s.level / 15));
    const pool = shuffle(['🐉', '🦄', '👑', '💎', '🌸', '🧁', '🦋', '⭐', '🏰', '🌙', '🍓', '🎀', '🐠', '🌈']).slice(0, pairs);
    const deck = shuffle([...pool, ...pool]);
    const cols = deck.length <= 8 ? 4 : deck.length <= 12 ? 4 : deck.length <= 16 ? 4 : 5;
    let open = [], matched = 0, moves = 0, busy = false;
    UI.open(`<div class="mg-head"><span>🪞 Memory Mirror</span><span id="mem-moves">Moves: 0</span></div>
      <div class="mg-prompt">Find all the matching pairs!</div>
      <div class="mem-grid" style="grid-template-columns:repeat(${cols},1fr)">${deck.map((e, k) => `<button class="card" data-k="${k}">${e}</button>`).join('')}</div>`,
    { onClose: () => this.exit(matched === pairs) });
    Voice.speak('Find all the matching pairs!');
    document.querySelectorAll('.card').forEach(c => c.onclick = () => {
      if (busy || c.classList.contains('open') || c.classList.contains('matched')) return;
      c.classList.add('open'); open.push(c); Sound.tap();
      if (open.length === 2) {
        moves++; $('mem-moves').textContent = 'Moves: ' + moves;
        const [a, b] = open;
        if (deck[+a.dataset.k] === deck[+b.dataset.k]) {
          a.classList.add('matched'); b.classList.add('matched'); open = []; matched++; Sound.right();
          if (matched === pairs) {
            Save.recordAnswer('Memory', true);
            s.right = s.total = 1;
            setTimeout(() => { s.results = [true]; s.right = 1; s.total = 1; this.finishMemory(moves, pairs); }, 500);
          }
        } else {
          busy = true;
          setTimeout(() => { a.classList.remove('open'); b.classList.remove('open'); open = []; busy = false; }, 800);
        }
      }
    });
  },

  finishMemory(moves, pairs) {
    const s = this.state;
    const stars = moves <= pairs * 1.5 ? 3 : moves <= pairs * 2.2 ? 2 : 1;
    const coins = Save.addCoins((6 + s.level * 0.15 + stars * 3) * (s.opts.practice ? 0.4 : 1), 'game');
    const aff = pick(AFFIRMATIONS);
    Sound.fanfare();
    UI.open(`<h2>🎉 All pairs found!</h2><div class="result-big">${'⭐'.repeat(stars)}</div>
      <p class="center" style="font-size:22px">${moves} moves</p><p class="affirm">${esc(aff)}</p>
      <p class="center" style="font-size:22px">${s.opts.practice ? '' : '🔑 Golden key earned! · '}🪙 +${coins}</p>
      <div class="row-btns"><button class="big-btn pink" id="mg-done">Back to the kingdom</button></div>`, { onClose: () => this.exit(true) });
    Voice.speak(aff);
    $('mg-done').onclick = () => UI.close();
  },

  exit(won) {
    const s = this.state; if (!s) return;
    this.state = null;
    if (s.opts.onDone) s.opts.onDone(won);
  },
};
