// Parent Progress Dashboard + weekly/monthly reports, and syncing the child's learning data to a
// parent's own device when they play together. Charts are plain SVG with hover tooltips.
'use strict';

const SUBJECTS = [['Reading', 'var(--s1)'], ['Math', 'var(--s2)'], ['Science', 'var(--s3)'], ['Social Studies', 'var(--s4)']];
const STATUS_ICON = { 'Mastered': '🏆', 'On track': '✅', 'Developing': '🌱', 'Needs practice': '⚠️', 'Getting started': '⏳' };
const fmtLv = (v) => (v == null ? '—' : v.toFixed(1));
const addDays = (k, n) => { const d = new Date(k + 'T00:00:00'); d.setDate(d.getDate() + n); return dayKey(d); };

const Dashboard = {
  range: 30, focus: 'subjects', tab: 'overview',

  // Which learner model to show: her own on the child's iPad, or the synced copy on a parent's iPad.
  source() {
    if (Profile.isChild()) return { m: null, name: Learn.childName() };
    const cs = Save.data.childSync;
    return cs ? { m: cs.m, name: cs.name, at: cs.at } : null;
  },
  run(fn) { const src = this.source(); return src.m ? Learn.withModel(src.m, src.name, fn) : fn(); },

  show(tab) {
    if (tab) this.tab = tab;
    const src = this.source();
    if (!src) {
      $('ptab').innerHTML = `<div class="viz-root"><h3>📊 Progress dashboard</h3><p style="font-size:18px">This iPad has a <b>parent profile</b>. Your child's progress lives on the child's iPad.</p>
        <p>To see it here: open 👭 Friends on both iPads, join the same room, and the child's progress will sync to this iPad automatically. You can also open 🔒 Parents on the child's iPad any time.</p></div>`;
      return;
    }
    const tabs = [['overview', 'Overview'], ['skills', 'All skills'], ['reports', 'Reports']];
    $('ptab').innerHTML = `<div class="viz-root"><div class="viz-tabs">${tabs.map(([k, n]) => `<button class="${k === this.tab ? 'on' : ''}" data-dtab="${k}">${n}</button>`).join('')}</div>
      ${src.at ? `<p class="muted">Synced from ${esc(src.name)}'s iPad ${new Date(src.at).toLocaleString()}</p>` : ''}<div id="dash"></div><div id="viz-tip" class="viz-tip" hidden></div></div>`;
    document.querySelectorAll('[data-dtab]').forEach(b => b.onclick = () => this.show(b.dataset.dtab));
    this.run(() => this['tab_' + this.tab]());
  },

  // ---------- overview ----------
  tab_overview() {
    const name = Learn.childName(), m = Learn.m;
    const wk = this.weekStats(0), prev = this.weekStats(1);
    const doms = DOMAINS.map(([d, label, subj]) => ({ d, label, subj, base: m.baseline[d], now: Learn.domainScore(d), st: Learn.domainStatus(d), n: Learn.domainN(d), acc: Learn.domainAcc(d) }));
    const withBase = doms.filter(x => x.base && x.now != null);
    const avg = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
    const startAvg = avg(withBase.map(x => x.base.score)), nowAvg = avg(withBase.map(x => x.now));
    const pace = this.pace();
    const ins = Learn.insights();
    const baselineDone = withBase.length, baselineTotal = DOMAINS.length;
    const firstDay = Object.keys(m.daily).sort()[0];
    const delta = (a, b, unit = '', pct = false) => {
      if (a == null || b == null) return '';
      const d = pct ? Math.round((a - b) * 100) : Math.round(a - b);
      if (!d) return `<span class="delta flat">same as last week</span>`;
      return `<span class="delta ${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'} ${Math.abs(d)}${unit} vs last week</span>`;
    };
    let html = `<h2 class="dash-title">${esc(name)} · Grade ${m.grade || 1}</h2>
      <p class="muted center">${firstDay ? `Learning since ${new Date(firstDay + 'T00:00:00').toLocaleDateString()}` : 'No learning activity yet - play a few portals or missions!'}</p>
      <div class="tiles">
        <div class="tile"><span>Time playing this week</span><b>${wk.min} min</b>${delta(wk.min, prev.min, ' min')}</div>
        <div class="tile"><span>Learning activities</span><b>${wk.items}</b>${delta(wk.items, prev.items)}</div>
        <div class="tile"><span>Accuracy this week</span><b>${wk.acc == null ? '—' : Math.round(wk.acc * 100) + '%'}</b>${delta(wk.acc, prev.acc, '%', true)}</div>
        <div class="tile"><span>Skills mastered</span><b>${Object.values(m.skills).filter(s => s.masteredAt).length}</b><span class="delta flat">of ${SKILLS.length} first-grade skills</span></div>
      </div>
      <div class="answers">
        <div><b>Where did ${esc(name)} start?</b><p>${startAvg != null ? `Level ${fmtLv(startAvg)} of 5 on average (starting points measured quietly during her first activities in each area).` : 'Still measuring - the starting point is recorded quietly through play.'} ${baselineDone < baselineTotal ? `<span class="muted">${baselineDone}/${baselineTotal} areas measured so far.</span>` : ''}</p></div>
        <div><b>Where is ${esc(name)} now?</b><p>${nowAvg != null ? `Level ${fmtLv(nowAvg)} on average. The end-of-first-grade target is ${TARGET.toFixed(1)}.` : '—'}</p></div>
        <div><b>How quickly is ${esc(name)} improving?</b><p>${pace != null ? `${pace >= 0 ? '+' : ''}${pace.toFixed(2)} levels per week over the last 4 weeks${pace > 0.15 ? ' - strong growth' : pace > 0.03 ? ' - steady growth' : ' - holding steady'}.` : 'Needs about two weeks of play to measure.'}</p></div>
        <div><b>What does ${esc(name)} need help with?</b><p>${ins.attention.length ? esc(ins.attention[0].text) : 'Nothing is flagged right now.'}</p></div>
      </div>
      <h3>Starting point → now → target</h3>
      <div class="legend"><span><i class="dot start"></i>Starting point</span><span><i class="dot now"></i>Now</span><span><i class="tick"></i>Grade 1 target (${TARGET.toFixed(1)})</span></div>
      ${this.dumbbells(doms)}
      <h3>Progress over time</h3>
      <div class="filters"><select id="dz-range">${[[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days'], [3650, 'All time']].map(([v, n]) => `<option value="${v}" ${v === this.range ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <select id="dz-focus"><option value="subjects">All subjects</option>${DOMAINS.map(([d, l]) => `<option value="${d}" ${d === this.focus ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <button class="small-btn gray" id="dz-table">Table view</button></div>
      <div id="trend">${this.trendChart(this.range, this.focus)}</div>
      <h3>Weekly play time</h3>${this.weeklyBars()}
      ${this.insightsHTML(ins)}`;
    $('dash').innerHTML = html;
    this.bindTips();
    $('dz-range').onchange = (e) => { this.range = +e.target.value; this.show(); };
    $('dz-focus').onchange = (e) => { this.focus = e.target.value; this.show(); };
    $('dz-table').onclick = () => { const t = $('trend-table'); if (t) t.hidden = !t.hidden; };
  },

  insightsHTML(ins) {
    return `<div class="ins">
      <div class="ins-col good"><h4>✅ Strengths</h4>${ins.strengths.map(t => `<p>${esc(t)}</p>`).join('') || '<p class="muted">Strengths appear after a few days of play.</p>'}</div>
      <div class="ins-col grow"><h4>🌱 Areas developing</h4>${ins.developing.map(t => `<p>${esc(t)}</p>`).join('') || '<p class="muted">—</p>'}</div>
      <div class="ins-col warn"><h4>⚠️ Needs attention</h4>${ins.attention.map(a => `<p>${esc(a.text)} <span class="muted">${esc(a.domain)} · ${esc(a.detail)}</span></p>`).join('') || '<p class="muted">Nothing needs attention right now.</p>'}</div>
      <div class="ins-col next"><h4>➡️ Recommended next steps</h4><p class="muted">The game adjusts automatically. Here is what it will work on next:</p>${ins.next.map(t => `<p>${esc(t)}</p>`).join('')}</div>
    </div>`;
  },

  weekStats(ago) {
    const end = new Date(); end.setDate(end.getDate() - ago * 7);
    const start = new Date(end); start.setDate(start.getDate() - 6);
    const p = Learn.periodData(dayKey(start), dayKey(end));
    return { min: Math.round(p.playSec / 60), items: p.items, acc: p.acc };
  },
  // Average level change per week, over the last 28 days.
  pace() {
    const m = Learn.m, keys = Object.keys(m.daily).sort();
    if (keys.length < 2) return null;
    const from = addDays(dayKey(), -28);
    const levelAt = (k) => { const vals = DOMAINS.map(([d]) => this.valueAt(d, k)).filter(v => v != null); return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null; };
    const firstKey = keys.find(k => k >= from) || keys[0];
    const a = levelAt(firstKey), b = levelAt(dayKey());
    const days = Math.max(1, (new Date(dayKey()) - new Date(firstKey)) / 864e5);
    if (a == null || b == null || days < 7) return null;
    return (b - a) / days * 7;
  },
  // Domain level on a day (carries the last snapshot forward).
  valueAt(dom, k) {
    const m = Learn.m; let v = null;
    for (const key of Object.keys(m.daily).sort()) { if (key > k) break; if (m.daily[key].dom[dom] != null) v = m.daily[key].dom[dom]; }
    return v;
  },
  subjectAt(subj, k) {
    const vals = DOMAINS.filter(d => d[2] === subj).map(([d]) => this.valueAt(d, k)).filter(v => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  },

  // ---------- charts ----------
  dumbbells(doms) {
    const W = 560, rowH = 34, left = 190, right = 120, plotW = W - left - right;
    const x = (v) => left + (v - 1) / 4 * plotW;
    const rows = doms.map((r, i) => {
      const y = 22 + i * rowH;
      if (r.now == null) return `<text x="${left - 10}" y="${y + 5}" class="ax-l" text-anchor="end">${esc(r.label)}</text><text x="${left}" y="${y + 5}" class="muted-t">${STATUS_ICON['Getting started']} not started yet</text>`;
      const s = r.base ? r.base.score : null;
      const tip = `${r.label}|Starting point: ${s == null ? 'measuring…' : fmtLv(s)}|Now: ${fmtLv(r.now)}|Target: ${TARGET.toFixed(1)}|${r.n} activities · ${r.acc == null ? '' : Math.round(r.acc * 100) + '% correct'}|${r.st}`;
      return `<g class="hit" data-tip="${esc(tip)}"><rect x="0" y="${y - rowH / 2}" width="${W}" height="${rowH}" fill="transparent"/>
        <text x="${left - 10}" y="${y + 5}" class="ax-l" text-anchor="end">${esc(r.label)}</text>
        <line x1="${x(1)}" y1="${y}" x2="${x(5)}" y2="${y}" class="grid"/>
        <line x1="${x(TARGET)}" y1="${y - 9}" x2="${x(TARGET)}" y2="${y + 9}" class="target"/>
        ${s != null ? `<line x1="${x(s)}" y1="${y}" x2="${x(r.now)}" y2="${y}" class="conn"/><circle cx="${x(s)}" cy="${y}" r="5" class="start"/>` : ''}
        <circle cx="${x(r.now)}" cy="${y}" r="6" class="now"/>
        <text x="${W - right + 12}" y="${y + 5}" class="ax-v">${fmtLv(r.now)}${s != null ? ` <tspan class="${r.now - s >= 0 ? 'up' : 'down'}">${r.now - s >= 0 ? '+' : ''}${(r.now - s).toFixed(1)}</tspan>` : ''}</text>
        <text x="${W - 4}" y="${y + 5}" class="ax-s" text-anchor="end">${STATUS_ICON[r.st]}</text></g>`;
    }).join('');
    const H = 22 + doms.length * rowH;
    const ticks = [1, 2, 3, 4, 5].map(v => `<text x="${x(v)}" y="${H + 4}" class="ax-t" text-anchor="middle">${v}</text>`).join('');
    return `<svg viewBox="0 0 ${W} ${H + 12}" class="viz">${rows}${ticks}</svg>
      <p class="muted small">Level scale 1-5 for first grade (4.0 = end-of-year target). ${Object.entries(STATUS_ICON).map(([k, v]) => `${v} ${k}`).join(' · ')}</p>`;
  },

  trendChart(days, focus) {
    const today = dayKey(), m = Learn.m;
    const first = Object.keys(m.daily).sort()[0];
    if (!first) return '<p class="muted">The graph appears after the first day of play.</p>';
    let from = addDays(today, -days + 1); if (from < first) from = first;
    const keys = []; for (let k = from; k <= today; k = addDays(k, 1)) keys.push(k);
    const series = focus === 'subjects'
      ? SUBJECTS.map(([s, c]) => ({ name: s, color: c, pts: keys.map(k => this.subjectAt(s, k)) }))
      : [{ name: DOMAIN_NAME[focus], color: 'var(--s1)', pts: keys.map(k => this.valueAt(focus, k)) }];
    const W = 560, H = 230, L = 34, Rr = 140, T = 12, B = 28, pw = W - L - Rr, ph = H - T - B;
    const x = (i) => L + (keys.length === 1 ? pw / 2 : i / (keys.length - 1) * pw), y = (v) => T + (1 - (v - 1) / 4) * ph;
    let g = '';
    [1, 2, 3, 4, 5].forEach(v => { g += `<line x1="${L}" x2="${L + pw}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 6}" y="${y(v) + 4}" class="ax-t" text-anchor="end">${v}</text>`; });
    g += `<line x1="${L}" x2="${L + pw}" y1="${y(TARGET)}" y2="${y(TARGET)}" class="target-line"/><text x="${L + pw + 4}" y="${y(TARGET) - 4}" class="ax-t">target</text>`;
    const step = Math.max(1, Math.ceil(keys.length / 6));
    keys.forEach((k, i) => { if (i % step === 0 || i === keys.length - 1) g += `<text x="${x(i)}" y="${H - 8}" class="ax-t" text-anchor="middle">${k.slice(5).replace('-', '/')}</text>`; });
    const ends = [];
    series.forEach(s => {
      let d = '', started = false;
      s.pts.forEach((v, i) => { if (v == null) return; d += `${started ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`; started = true; });
      if (!started) return;
      const li = s.pts.map((v, i) => (v == null ? -1 : i)).filter(i => i >= 0).pop();
      g += `<path d="${d}" class="line" style="stroke:${s.color}"/><circle cx="${x(li)}" cy="${y(s.pts[li])}" r="4.5" class="end" style="fill:${s.color}"/>`;
      ends.push({ y: y(s.pts[li]), x: x(li), name: s.name, v: s.pts[li], color: s.color });
    });
    // direct end labels with leader lines when they would collide
    ends.sort((a, b) => a.y - b.y);
    let lastY = -99;
    ends.forEach(e => { const ly = Math.max(e.y, lastY + 14); lastY = ly; g += `${Math.abs(ly - e.y) > 2 ? `<line x1="${e.x + 5}" y1="${e.y}" x2="${L + pw + 8}" y2="${ly - 4}" class="leader"/>` : ''}<text x="${L + pw + 10}" y="${ly}" class="ax-v">${esc(e.name)} ${fmtLv(e.v)}</text>`; });
    // hover layer: crosshair snaps to the nearest day
    g += `<line id="xh" class="xhair" y1="${T}" y2="${T + ph}" x1="0" x2="0" visibility="hidden"/><rect id="xh-hit" x="${L}" y="${T}" width="${pw}" height="${ph}" fill="transparent"/>`;
    this.trendData = { keys, series, x, L, pw };
    const legend = series.length > 1 ? `<div class="legend">${series.map(s => `<span><i class="lkey" style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>` : `<p class="muted">${esc(series[0].name)} level over time</p>`;
    const table = `<table id="trend-table" class="viz-table" hidden><tr><th>Date</th>${series.map(s => `<th>${esc(s.name)}</th>`).join('')}</tr>${keys.filter((_, i) => i % step === 0 || i === keys.length - 1).map(k => `<tr><td>${k}</td>${series.map(s => `<td>${fmtLv(s.pts[keys.indexOf(k)])}</td>`).join('')}</tr>`).join('')}</table>`;
    return legend + `<svg viewBox="0 0 ${W} ${H}" class="viz" id="trend-svg">${g}</svg>` + table;
  },

  weeklyBars() {
    const weeks = [];
    for (let i = 7; i >= 0; i--) { const end = new Date(); end.setDate(end.getDate() - i * 7); const st = new Date(end); st.setDate(st.getDate() - 6); const p = Learn.periodData(dayKey(st), dayKey(end)); weeks.push({ label: dayKey(st).slice(5).replace('-', '/'), min: Math.round(p.playSec / 60), items: p.items }); }
    const max = Math.max(10, ...weeks.map(w => w.min));
    const W = 560, H = 160, L = 34, T = 18, B = 24, pw = W - L - 10, ph = H - T - B, bw = Math.min(24, pw / weeks.length - 10);
    let g = `<line x1="${L}" x2="${L + pw}" y1="${T + ph}" y2="${T + ph}" class="grid"/>`;
    weeks.forEach((w, i) => {
      const cx = L + (i + 0.5) * pw / weeks.length, h = w.min / max * ph, yy = T + ph - h;
      g += `<g class="hit" data-tip="${esc(`Week of ${w.label}|${w.min} minutes played|${w.items} learning activities`)}"><rect x="${cx - pw / weeks.length / 2}" y="${T}" width="${pw / weeks.length}" height="${ph}" fill="transparent"/>
        ${h > 0 ? `<path d="M${cx - bw / 2},${T + ph} V${yy + 4} Q${cx - bw / 2},${yy} ${cx - bw / 2 + 4},${yy} H${cx + bw / 2 - 4} Q${cx + bw / 2},${yy} ${cx + bw / 2},${yy + 4} V${T + ph} Z" class="bar"/>` : ''}
        ${w.min ? `<text x="${cx}" y="${yy - 5}" class="ax-v" text-anchor="middle">${w.min}</text>` : ''}<text x="${cx}" y="${H - 6}" class="ax-t" text-anchor="middle">${w.label}</text></g>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" class="viz">${g}</svg><p class="muted small">Minutes of play per week (week starting date).</p>`;
  },

  bindTips() {
    const tip = $('viz-tip');
    const show = (e, lines) => {
      tip.innerHTML = '';
      lines.forEach((l, i) => { const p = document.createElement('div'); if (i === 0) p.className = 'tt-h'; if (l.color) { const k = document.createElement('i'); k.className = 'lkey'; k.style.background = l.color; p.appendChild(k); } p.appendChild(document.createTextNode(l.text != null ? l.text : l)); tip.appendChild(p); });
      tip.hidden = false;
      const box = $('modal-box').getBoundingClientRect();
      tip.style.left = Math.min(e.clientX - box.left + 12, box.width - 220) + 'px';
      tip.style.top = (e.clientY - box.top + $('modal-box').scrollTop + 12) + 'px';
    };
    document.querySelectorAll('.viz .hit').forEach(h => {
      h.addEventListener('pointermove', (e) => show(e, h.dataset.tip.split('|')));
      h.addEventListener('pointerleave', () => { tip.hidden = true; });
    });
    const hit = $('xh-hit'), svg = $('trend-svg');
    if (hit && this.trendData) {
      const td = this.trendData;
      hit.addEventListener('pointermove', (e) => {
        const r = svg.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * 560;
        const i = Math.max(0, Math.min(td.keys.length - 1, Math.round((sx - td.L) / td.pw * (td.keys.length - 1))));
        const xh = $('xh'); xh.setAttribute('x1', td.x(i)); xh.setAttribute('x2', td.x(i)); xh.setAttribute('visibility', 'visible');
        show(e, [td.keys[i], ...td.series.map(s => ({ text: `${fmtLv(s.pts[i])}  ${s.name}`, color: s.color }))]);
      });
      hit.addEventListener('pointerleave', () => { tip.hidden = true; $('xh').setAttribute('visibility', 'hidden'); });
    }
  },

  // ---------- every skill ----------
  tab_skills() {
    const rows = SKILLS.map(sk => {
      const s = Learn.m.skills[sk.id];
      if (!s || !s.n) return `<tr class="dim"><td>${esc(sk.name)}</td><td>${esc(DOMAIN_NAME[sk.domain])}</td><td>⏳ Not started</td><td>—</td><td>—</td><td>0</td><td>—</td><td>—</td></tr>`;
      const st = Learn.status(sk.id), acc = Learn.recentAcc(sk.id, 10);
      return `<tr><td>${esc(sk.name)}</td><td>${esc(DOMAIN_NAME[sk.domain])}</td><td>${STATUS_ICON[st]} ${st}</td><td>${s.th.toFixed(1)}</td><td>${acc == null ? '—' : Math.round(acc * 100) + '%'}</td><td>${s.n}</td><td>${(s.ms / 1000).toFixed(0)}s</td><td>${Math.round(100 * s.assists / s.n)}%</td></tr>`;
    }).join('');
    $('dash').innerHTML = `<p class="muted">Level = estimated ability on the 1-5 first-grade scale. Accuracy = last 10 tries. Help = share of activities where she used a hint, a second try, or a supported version.</p>
      <div class="table-wrap"><table class="viz-table full"><tr><th>Skill</th><th>Area</th><th>Status</th><th>Level</th><th>Accuracy</th><th>Tries</th><th>Avg time</th><th>Help</th></tr>${rows}</table></div>`;
  },

  // ---------- reports ----------
  tab_reports() {
    Learn.autoReports();
    const today = dayKey(), wkStart = Daily.weekKey(), moStart = today.slice(0, 8) + '01';
    const list = Learn.m.reports;
    $('dash').innerHTML = `<p>Reports are created automatically every week (Monday-Sunday) and every month.</p>
      <div class="list"><div class="list-row"><b style="flex:1">📅 This week so far</b><button class="small-btn purple" data-rep="live-week">View</button></div>
      <div class="list-row"><b style="flex:1">🗓️ This month so far</b><button class="small-btn purple" data-rep="live-month">View</button></div>
      ${list.map((r, i) => `<div class="list-row"><b style="flex:1">${r.type === 'week' ? '📅 Weekly' : '🗓️ Monthly'} report · ${r.from} → ${r.to}</b><span class="muted">${r.data.items} activities</span><button class="small-btn purple" data-rep="${i}">View</button></div>`).join('')}</div>`;
    document.querySelectorAll('[data-rep]').forEach(b => b.onclick = () => {
      const v = b.dataset.rep;
      if (v === 'live-week') this.report('This week so far', wkStart, today);
      else if (v === 'live-month') this.report('This month so far', moStart, today);
      else { const r = list[+v]; this.report(`${r.type === 'week' ? 'Weekly' : 'Monthly'} report`, r.from, r.to); }
    });
  },
  report(title, from, to) {
    const name = Learn.childName(), p = Learn.periodData(from, to), ins = Learn.insights();
    const days = Math.max(1, Math.round((new Date(to) - new Date(from)) / 864e5) + 1);
    const rows = DOMAINS.map(([d, l]) => {
      const base = Learn.m.baseline[d], s = p.series[d];
      if (s.end == null) return '';
      const ch = s.start != null ? s.end - s.start : null;
      return `<tr><td>${esc(l)}</td><td>${base ? fmtLv(base.score) : '—'}</td><td>${fmtLv(s.start)}</td><td>${fmtLv(s.end)}</td><td class="${ch > 0 ? 'up' : ''}">${ch == null ? '—' : (ch >= 0 ? '+' : '') + ch.toFixed(1)}</td><td>${STATUS_ICON[Learn.domainStatus(d)]} ${Learn.domainStatus(d)}</td></tr>`;
    }).join('');
    const strongest = DOMAINS.filter(([d]) => p.series[d].end != null).sort((a, b) => p.series[b[0]].end - p.series[a[0]].end).slice(0, 3).map(d => d[1]);
    $('dash').innerHTML = `<div class="report" id="report">
      <div class="row-btns no-print" style="justify-content:space-between"><button class="small-btn gray" id="rp-back">← All reports</button><button class="small-btn purple" id="rp-print">🖨️ Print / save as PDF</button></div>
      <h2>${esc(title)}: ${esc(name)}</h2><p class="muted">${from} → ${to} · Grade 1</p>
      <div class="tiles">
        <div class="tile"><span>Time playing</span><b>${Math.round(p.playSec / 60)} min</b><span class="delta flat">${Math.round(p.playSec / 60 / days)} min per day</span></div>
        <div class="tile"><span>Learning activities</span><b>${p.items}</b><span class="delta flat">${Object.keys(p.skills).length} skills practiced</span></div>
        <div class="tile"><span>Accuracy</span><b>${p.acc == null ? '—' : Math.round(p.acc * 100) + '%'}</b></div>
        <div class="tile"><span>Skills mastered</span><b>${p.mastered.length}</b><span class="delta flat">${p.mastered.map(id => SKILL_BY_ID[id] ? SKILL_BY_ID[id].name : id).join(', ') || 'this period'}</span></div>
      </div>
      <p><b>Other activities:</b> ${Object.entries(p.acts).map(([k, v]) => `${v} ${k}${v > 1 ? 's' : ''}`).join(', ') || 'none recorded'}.</p>
      <h3>Starting point vs. now</h3>
      <table class="viz-table full"><tr><th>Area</th><th>Starting point</th><th>Start of period</th><th>End of period</th><th>Change</th><th>Status</th></tr>${rows}</table>
      <h3>Trend</h3>${this.trendChart(days, 'subjects')}
      <p><b>Strongest areas:</b> ${esc(strongest.join(', ') || '—')}</p>
      ${this.insightsHTML(ins)}
      <h3>Recent accomplishments</h3>${p.accomplishments.length ? `<ul>${p.accomplishments.map(a => `<li>${esc(a.text)}</li>`).join('')}</ul>` : '<p class="muted">—</p>'}
    </div>`;
    this.bindTips();
    $('rp-back').onclick = () => this.show('reports');
    $('rp-print').onclick = () => { document.body.classList.add('printing'); setTimeout(() => { window.print(); document.body.classList.remove('printing'); }, 50); };
  },
};

// ---------- syncing between family devices ----------
const Sync = {
  last: 0,
  roomChanged() {
    if (!Net.connected) return;
    Family.sync();
    this.sendLearn(true);
  },
  // The child's device shares her learning data with parent devices in the room (never with other children).
  sendLearn(force) {
    if (!Profile.isChild() || !Net.connected) return;
    if (!force && Date.now() - this.last < 45000) return;
    const parents = Net.parents(); if (!parents.length) return;
    this.last = Date.now();
    const m = Learn.m, keys = Object.keys(m.daily).sort().slice(-120);
    const payload = { name: Learn.childName(), m: Object.assign({}, m, { daily: Object.fromEntries(keys.map(k => [k, m.daily[k]])), recent: [], log: m.log.slice(-60) }) };
    parents.forEach(p => Net.sendX('learn', payload, p.id));
  },
};
Net.on('learn', (from, d) => {
  if (!Profile.isParent() || !d || !d.m || typeof d.m !== 'object' || !d.m.skills) return;
  Save.data.childSync = { name: cleanName(d.name), at: Date.now(), m: d.m };
  Save.write();
});
Net.on('family', (from, d) => Family.merge(d));
setInterval(() => Sync.sendLearn(false), 60000);
