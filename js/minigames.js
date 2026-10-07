// Learning portals. Each portal is a themed adventure that pulls its activities from the adaptive engine
// (Learn.activity) for that portal's subjects, so difficulty follows HER learning profile, not the level number.
'use strict';

function clockSVG(h, m) {
  const cx = 90, cy = 90, r = 80;
  const ma = (m / 60) * Math.PI * 2, ha = ((h % 12) / 12 + m / 720) * Math.PI * 2;
  let ticks = '';
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ticks += `<text x="${cx + Math.sin(a) * 64}" y="${cy - Math.cos(a) * 64 + 7}" font-size="20" font-weight="800" text-anchor="middle" fill="#c2185b">${i}</text>`;
  }
  return `<svg class="clock" width="150" height="150" viewBox="0 0 180 180">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="#ff69b4" stroke-width="8"/>${ticks}
    <line x1="${cx}" y1="${cy}" x2="${cx + Math.sin(ha) * 38}" y2="${cy - Math.cos(ha) * 38}" stroke="#5a2346" stroke-width="8" stroke-linecap="round"/>
    <line x1="${cx}" y1="${cy}" x2="${cx + Math.sin(ma) * 58}" y2="${cy - Math.cos(ma) * 58}" stroke="#8f4dff" stroke-width="5" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="6" fill="#ff2e93"/></svg>`;
}

const MiniGames = {
  // opts: { practice, onDone(won) }
  play(key, level, opts = {}) {
    const g = GAMES[key];
    this.state = { key, g, level, opts, i: 0, right: 0, total: 4, results: [] };
    if (key === 'memory') return this.memory();
    UI.open(`<h2>${g.icon} ${g.name}</h2><div class="result-big">${g.icon}</div>
      <p class="center" style="font-size:20px">${this.state.total} challenges · finish them to win a 🔑 key!</p>
      ${opts.practice ? '<p class="center muted">Bonus round for extra coins</p>' : ''}
      <div class="row-btns"><button class="big-btn pink" id="mg-start">Start!</button></div>`, { onClose: () => this.exit(false) });
    Voice.speak(`${g.name}! Finish the challenges to win a key.`);
    $('mg-start').onclick = () => { Sound.tap(); this.next(); };
  },

  next() {
    const s = this.state;
    if (!s) return;
    if (s.i >= s.total) return this.finish();
    const it = Learn.activity(null, PORTAL_DOMAINS[s.key]);
    const dots = Array.from({ length: s.total }, (_, k) => `<span class="${s.results[k] === true ? 'ok' : s.results[k] === false ? 'bad' : ''}"></span>`).join('');
    Present.run(it, {
      title: `${s.g.icon} ${s.g.name}`,
      frame: `<div class="mg-progress">${dots}</div>`,
      onDone: (r) => {
        if (r.cancelled) return this.exit(false);
        const good = r.correct || (r.partial || 0) >= 0.75;
        s.results.push(good); if (good) s.right++;
        s.i++; this.next();
      },
    });
  },

  finish() {
    const s = this.state;
    // Keep it achievable: 3 of 4 (second tries count) wins the key; otherwise a friendly retry.
    const won = s.right >= s.total - 1;
    Learn.countActivity('portal');
    if (won) {
      const stars = s.right === s.total ? 3 : 2;
      const coins = Save.addCoins((6 + s.right * 2) * (s.opts.practice ? 0.4 : 1), 'game');
      const aff = pick(AFFIRMATIONS);
      UI.open(`<h2>🎉 You did it!</h2><div class="result-big">${'⭐'.repeat(stars)}</div>
        <p class="affirm">${esc(aff)}</p>
        <p class="center" style="font-size:22px">${s.opts.practice ? '' : '🔑 Golden key earned! · '}🪙 +${coins}</p>
        <div class="row-btns"><button class="big-btn pink" id="mg-done">Back to the kingdom</button></div>`, { onClose: () => this.exit(true) });
      Rewards.celebrate(s.opts.practice ? 'small' : 'medium');
      Voice.speak(aff + (s.opts.practice ? '' : ' You earned a golden key!'));
      $('mg-done').onclick = () => UI.close();
    } else {
      UI.open(`<h2>So close! 🌱</h2><div class="result-big">💪</div>
        <p class="affirm">Every try makes your brain stronger!</p>
        <div class="row-btns"><button class="big-btn pink" id="mg-retry">Try again</button><button class="big-btn gray" id="mg-quit">Explore</button></div>`, { onClose: () => this.exit(false) });
      Voice.speak('So close! Every try makes your brain stronger. Want to try again?');
      $('mg-retry').onclick = () => { const { key, level, opts } = s; UI.onModalClose = null; this.play(key, level, opts); };
      $('mg-quit').onclick = () => UI.close();
    }
  },

  // Sight-word memory: match pairs of words she is learning, reading each one aloud as it flips.
  memory() {
    const s = this.state;
    const lv = Learn.levelFor('sight_words');
    const pairs = Math.min(8, 4 + Math.floor(lv / 2));
    const words = shuffle(SIGHT.slice(0, lv).flat()).slice(0, pairs);
    const deck = shuffle([...words, ...words]);
    let open = [], matched = 0, moves = 0, busy = false;
    UI.open(`<div class="mg-head"><span>🪞 Memory Mirror</span><span id="mem-moves">Moves: 0</span></div>
      <div class="mg-prompt">Find the matching words! Read each word you flip.</div>
      <div class="mem-grid" style="grid-template-columns:repeat(4,1fr)">${deck.map((w, k) => `<button class="card word" data-k="${k}">${esc(w)}</button>`).join('')}</div>`,
    { onClose: () => this.exit(matched === pairs) });
    Voice.speak('Find the matching words!');
    document.querySelectorAll('.card').forEach(c => c.onclick = () => {
      if (busy || c.classList.contains('open') || c.classList.contains('matched')) return;
      c.classList.add('open'); open.push(c); Sound.tap(); Voice.speak(deck[+c.dataset.k]);
      if (open.length === 2) {
        moves++; $('mem-moves').textContent = 'Moves: ' + moves;
        const [a, b] = open;
        if (deck[+a.dataset.k] === deck[+b.dataset.k]) {
          a.classList.add('matched'); b.classList.add('matched'); open = []; matched++; Sound.right();
          if (matched === pairs) setTimeout(() => this.finishMemory(moves, pairs), 500);
        } else { busy = true; setTimeout(() => { a.classList.remove('open'); b.classList.remove('open'); open = []; busy = false; }, 900); }
      }
    });
  },
  finishMemory(moves, pairs) {
    const s = this.state;
    const stars = moves <= pairs * 1.5 ? 3 : moves <= pairs * 2.2 ? 2 : 1;
    const coins = Save.addCoins((6 + stars * 3) * (s.opts.practice ? 0.4 : 1), 'game');
    Learn.countActivity('portal');
    UI.open(`<h2>🎉 All pairs found!</h2><div class="result-big">${'⭐'.repeat(stars)}</div>
      <p class="affirm">${esc(pick(AFFIRMATIONS))}</p><p class="center" style="font-size:22px">${s.opts.practice ? '' : '🔑 Golden key earned! · '}🪙 +${coins}</p>
      <div class="row-btns"><button class="big-btn pink" id="mg-done">Back to the kingdom</button></div>`, { onClose: () => this.exit(true) });
    Rewards.celebrate('medium');
    $('mg-done').onclick = () => UI.close();
  },

  exit(won) {
    const s = this.state; if (!s) return;
    this.state = null;
    if (s.opts.onDone) s.opts.onDone(won);
  },
};
