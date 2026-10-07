// Adaptive learner model.
// Each skill keeps an ability estimate (theta, on the same 1-5 scale as activity difficulty) that moves a little
// after every observation, so one lucky answer never jumps the difficulty. Activities are pitched where the
// child should succeed about 70-80% of the time ("I can do this"). After two misses in a row the next activity
// switches to a supported version (easier level, hint up front, fewer choices, audio, manipulatives).
// The first observations in each domain silently establish a permanent baseline.
'use strict';

const BASELINE_N = 6;            // observations per domain that form the starting point
const TARGET = 4.0;              // end-of-first-grade proficiency on the 1-5 scale
const STATUS = { MASTERED: 'Mastered', ON_TRACK: 'On track', DEVELOPING: 'Developing', NEEDS: 'Needs practice', NEW: 'Getting started' };
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const Learn = {
  get m() {
    if (this._view) return this._view;
    const d = Save.data;
    if (!d.learn) d.learn = { grade: 1, skills: {}, baseline: {}, baseN: {}, daily: {}, recent: [], log: [], reports: [], startedAt: Date.now() };
    return d.learn;
  },
  // Only the child's profile is measured; a parent playing on their own device never changes her data.
  get tracking() { return typeof Profile === 'undefined' || Profile.isChild(); },
  childName() { return this._viewName || (Save.data.profile && Save.data.profile.name) || Save.data.nickname || 'Your child'; },
  // Run fn against another learner model (a parent viewing the child's synced data).
  withModel(m, name, fn) { const pv = this._view, pn = this._viewName; this._view = m; this._viewName = name; try { return fn(); } finally { this._view = pv; this._viewName = pn; } },

  skill(id) {
    const s = this.m.skills[id] || (this.m.skills[id] = { th: 1.6, n: 0, nc: 0, hist: [], tags: {}, streak: 0, miss: 0, ms: 0, hints: 0, assists: 0 });
    return s;
  },
  // Difficulty pitched just under ability: P(success) ≈ 0.7-0.8.
  levelFor(id) {
    const sk = SKILL_BY_ID[id];
    // during the baseline period use a placement staircase (round), afterwards stay just under ability (floor)
    const th = this.skill(id).th;
    return clamp(sk && !this.m.baseline[sk.domain] ? Math.round(th) : Math.floor(th + 0.1), 1, 5);
  },
  pSuccess(th, d) { return sigmoid(1.5 * (th - d + 0.5)); },

  status(id) {
    const s = this.skill(id);
    if (s.n < 4) return STATUS.NEW;
    const recent = s.hist.slice(-8), acc = recent.reduce((a, h) => a + h[1], 0) / recent.length;
    if (s.th >= 4.2 && acc >= 0.85 && s.n >= 8) return STATUS.MASTERED;
    if (s.th >= 3 && acc >= 0.7) return STATUS.ON_TRACK;
    if (s.th >= 2 || acc >= 0.55) return STATUS.DEVELOPING;
    return STATUS.NEEDS;
  },
  recentAcc(id, k = 8) { const h = this.skill(id).hist.slice(-k); return h.length ? h.reduce((a, x) => a + x[1], 0) / h.length : null; },

  domainSkills(dom) { return SKILLS.filter(s => s.domain === dom); },
  domainScore(dom) {
    let w = 0, t = 0;
    for (const sk of this.domainSkills(dom)) { const s = this.m.skills[sk.id]; if (s && s.n) { const ww = Math.min(s.n, 10); w += ww; t += s.th * ww; } }
    return w ? t / w : null;
  },
  domainN(dom) { return this.domainSkills(dom).reduce((a, sk) => a + ((this.m.skills[sk.id] || {}).n || 0), 0); },
  domainAcc(dom, sinceTs = 0) {
    let n = 0, c = 0;
    for (const sk of this.domainSkills(dom)) { const s = this.m.skills[sk.id]; if (!s) continue; for (const h of s.hist) if (h[0] >= sinceTs) { n++; c += h[1]; } }
    return n ? c / n : null;
  },
  domainStatus(dom) {
    const ids = this.domainSkills(dom).map(s => s.id).filter(id => (this.m.skills[id] || {}).n >= 4);
    if (!ids.length) return STATUS.NEW;
    const order = [STATUS.NEEDS, STATUS.DEVELOPING, STATUS.ON_TRACK, STATUS.MASTERED];
    const vals = ids.map(id => order.indexOf(this.status(id))).filter(v => v >= 0);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return order[Math.round(avg)];
  },

  unlocked(sk) {
    const s = this.m.skills[sk.id];
    if (s && s.n) return true;
    return sk.prereq.every(p => { const ps = this.m.skills[p]; return ps && ps.n >= 3 && ps.th >= 1.8; });
  },

  // Choose the next skill to practice, optionally restricted to some domains.
  pickSkill(domains) {
    let cands = SKILLS.filter(s => (!domains || domains.includes(s.domain)) && this.unlocked(s));
    if (!cands.length) cands = SKILLS.filter(s => (!domains || domains.includes(s.domain)) && !s.prereq.length);
    if (!cands.length) cands = SKILLS.filter(s => !s.prereq.length);
    const last = this.m.recentSkills || [];
    const weights = cands.map(sk => {
      const st = this.status(sk.id);
      let w = { [STATUS.NEEDS]: 3, [STATUS.DEVELOPING]: 2.6, [STATUS.NEW]: 2.3, [STATUS.ON_TRACK]: 1.5, [STATUS.MASTERED]: 0.5 }[st];
      if (!this.m.baseline[sk.domain]) w *= 1.8;                    // quietly finish the baseline in every domain
      const rep = last.slice(-3).filter(x => x === sk.id).length;  // avoid hammering one skill
      w *= [1, 0.45, 0.15, 0.05][rep];
      if (sk.id === 'read_aloud' && !Present.canListen()) w *= 0.3;
      return w * (0.8 + Math.random() * 0.4);
    });
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < cands.length; i++) { r -= weights[i]; if (r <= 0) return cands[i].id; }
    return cands[0].id;
  },

  // Build the next activity. Struggling -> a supported version of the same skill (a different teaching approach).
  activity(skillId, domains) {
    const id = skillId || this.pickSkill(domains);
    const s = this.skill(id);
    const scaffold = s.miss >= 2;
    const lv = scaffold ? Math.max(1, this.levelFor(id) - 1) : this.levelFor(id);
    let it = null;
    const sk = SKILL_BY_ID[id];
    if (sk.experiment && !scaffold && Math.random() < 0.4 && typeof makeExperiment !== 'undefined') it = makeExperiment(pick(sk.experiment), id);
    for (let i = 0; i < 10 && !it; i++) { it = makeActivity(id, lv, { scaffold }); if (this.m.recent.includes(it.key)) it = i < 9 ? null : it; }
    it.scaffold = scaffold;
    this.m.recentSkills = [...(this.m.recentSkills || []), id].slice(-6);
    return it;
  },

  // Record one observation. result = { correct, firstTry, attempts, ms, hint, audio, chosen }
  record(it, r) {
    if (!this.tracking || !it || !it.skill) return;
    const s = this.skill(it.skill), m = this.m, now = Date.now();
    const assisted = !!(r.hint || it.scaffold || (r.attempts > 1));
    // credit: first-try correct = 1, correct after a retry or with support = partial, wrong = 0
    let c = r.correct ? (r.firstTry ? 1 : 0.5) : 0;
    if (r.correct && r.firstTry && (r.hint || it.scaffold)) c = 0.75;
    if (typeof r.partial === 'number') c = r.partial;                  // sorts / reading: fraction correct
    const p = this.pSuccess(s.th, it.difficulty);
    const placing = !m.baseline[it.domain];
    const K = placing ? 0.8 : Math.max(0.2, 0.5 / Math.sqrt(1 + s.n / 4));
    const before = this.status(it.skill);
    s.th = clamp(s.th + K * (c - p) * 1.4, 0.5, 5.5);
    // several first-try successes in a row at the current level -> ready for a little more challenge
    if (c === 1 && s.streak >= 3 && it.difficulty >= Math.floor(s.th)) s.th = clamp(s.th + 0.25, 0.5, 5.5);
    s.n++; if (c >= 0.75) s.nc++;
    s.hist.push([now, +c.toFixed(2), it.difficulty, Math.round(r.ms || 0), r.hint ? 1 : 0, assisted ? 1 : 0, it.qtype || '']);
    if (s.hist.length > 40) s.hist.shift();
    s.ms = s.ms ? s.ms * 0.8 + (r.ms || 0) * 0.2 : (r.ms || 0);
    if (r.hint) s.hints++;
    if (assisted) s.assists++;
    if (c >= 0.75) { s.streak++; s.miss = 0; } else if (c < 0.5) { s.miss++; s.streak = 0; } else { s.streak = 0; }
    // error patterns
    if (!r.correct) {
      let tag = it.tags && r.chosen != null ? it.tags[r.chosen] : null;
      if (!tag && it.offByOneTag && Math.abs(+r.chosen - +it.answer) === 1) tag = it.offByOneTag;
      if (!tag && it.errTag) tag = it.errTag;
      if (!tag && it.isWord) tag = 'word_problem';
      if (!tag && it.qtype === 'why') tag = 'why_q';
      if (tag) s.tags[tag] = (s.tags[tag] || 0) + 1;
    }
    m.recent = [...m.recent, it.key].slice(-40);
    // baseline: first observations in each domain, frozen once complete
    if (!m.baseline[it.domain]) {
      m.baseN[it.domain] = (m.baseN[it.domain] || 0) + 1;
      if (m.baseN[it.domain] >= BASELINE_N) {
        m.baseline[it.domain] = { score: +this.domainScore(it.domain).toFixed(2), acc: +(this.domainAcc(it.domain) || 0).toFixed(2), date: dayKey(), ts: now };
        this.logEvent(`Starting point recorded for ${DOMAIN_NAME[it.domain]}`, 'baseline');
      }
    }
    // daily snapshot for trend graphs
    const d = this.today();
    d.items++; d.correct += c >= 0.75 ? 1 : 0; d.learnSec += Math.round((r.ms || 0) / 1000);
    d.dom[it.domain] = +this.domainScore(it.domain).toFixed(2);
    d.skills[it.skill] = (d.skills[it.skill] || 0) + 1;
    const after = this.status(it.skill);
    if (after === STATUS.MASTERED && before !== STATUS.MASTERED && !s.masteredAt) {
      s.masteredAt = now; d.mastered.push(it.skill);
      this.logEvent(`Mastered: ${it.skillName}`, 'mastery');
      if (typeof Rewards !== 'undefined') Rewards.onMastery(it.skill);
    }
    Save.write();
    if (typeof Daily !== 'undefined') Daily.onLearn(it);
    if (typeof Rewards !== 'undefined') Rewards.checkMilestones();
  },

  // Learning that happens inside world activities (shops, missions) is recorded against a curriculum skill.
  recordWorld(skillId, correct, extra = {}) {
    const sk = SKILL_BY_ID[skillId]; if (!sk) return;
    const it = { skill: sk.id, skillName: sk.name, domain: sk.domain, subject: sk.subject, difficulty: extra.difficulty || this.levelFor(sk.id), key: 'world' + skillId + Date.now(), tags: {}, qtype: extra.qtype };
    this.record(it, { correct, firstTry: extra.firstTry !== false, attempts: 1, ms: extra.ms || 0, chosen: extra.chosen, partial: extra.partial });
  },
  // Shop/world difficulty band 0-2 for a domain, from her measured level (grade 1 content only).
  band(dom) { const s = this.domainScore(dom); return s == null ? 0 : clamp(Math.floor((s - 1.2) / 1.2), 0, 2); },

  today() {
    const k = dayKey(), m = this.m;
    if (!m.daily[k]) {
      m.daily[k] = { items: 0, correct: 0, learnSec: 0, playSec: 0, dom: {}, skills: {}, mastered: [], acts: {} };
      const keys = Object.keys(m.daily).sort();
      while (keys.length > 400) delete m.daily[keys.shift()];
    }
    return m.daily[k];
  },
  // Called every second of active play.
  tick(sec) { if (this.tracking) this.today().playSec += sec; },
  countActivity(kind) { if (!this.tracking) return; const a = this.today().acts; a[kind] = (a[kind] || 0) + 1; Save.write(); },
  logEvent(text, kind = 'event') { this.m.log.push({ t: Date.now(), text, kind }); if (this.m.log.length > 200) this.m.log.shift(); },

  // ---------- insights for parents ----------
  topTag(dom) {
    const tags = {};
    for (const sk of this.domainSkills(dom)) { const s = this.m.skills[sk.id]; if (s) for (const [t, c] of Object.entries(s.tags)) tags[t] = (tags[t] || 0) + c; }
    const best = Object.entries(tags).sort((a, b) => b[1] - a[1])[0];
    return best && best[1] >= 2 ? best[0] : null;
  },
  tagCount(dom, tag) { return this.domainSkills(dom).reduce((a, sk) => a + (((this.m.skills[sk.id] || {}).tags || {})[tag] || 0), 0); },
  insights() {
    const name = this.childName();
    const out = { strengths: [], developing: [], attention: [], next: [] };
    const STRENGTH = { phonics: 'hears and matches letter sounds well', sightwords: 'demonstrates strong sight-word recognition', comprehension: 'understands the stories they read', vocabulary: 'knows the meaning of many words',
      spelling: 'spells grade-level words accurately', fluency: 'reads sentences aloud smoothly', numbers: 'has strong number sense', addition: 'adds accurately', subtraction: 'subtracts accurately', shapes: 'recognizes shapes and patterns',
      measurement: 'handles measuring, time and money well', science: 'shows strong science understanding', social: 'understands community and the wider world' };
    for (const [dom, label] of DOMAINS) {
      const st = this.domainStatus(dom), score = this.domainScore(dom), n = this.domainN(dom);
      if (st === STATUS.NEW) continue;
      const acc = this.domainAcc(dom, Date.now() - 14 * 864e5);
      const accTxt = acc != null ? `${Math.round(acc * 100)}% accuracy over the last two weeks` : '';
      if (st === STATUS.MASTERED || (st === STATUS.ON_TRACK && acc >= 0.85)) out.strengths.push(`${name} ${STRENGTH[dom]} (${label}: ${accTxt}).`);
      else if (st === STATUS.ON_TRACK || st === STATUS.DEVELOPING) {
        const base = this.m.baseline[dom];
        const grow = base && score != null ? score - base.score : 0;
        out.developing.push(`${label} ${grow > 0.15 ? 'continues to improve' : 'is developing'}${grow > 0.15 ? ` (up ${grow.toFixed(1)} levels since the start)` : ''}.`);
      }
      if (st === STATUS.NEEDS || (st === STATUS.DEVELOPING && acc != null && acc < 0.6)) {
        const tag = this.topTag(dom);
        const weak = this.domainSkills(dom).filter(sk => this.status(sk.id) === STATUS.NEEDS).map(sk => sk.name);
        out.attention.push({ domain: label, text: tag ? `${name} ${TAG_TEXT[tag]}.` : `${label}: ${weak.length ? weak.join(', ') + ' — ' : ''}${accTxt || 'accuracy is still low'}.`, detail: `${n} activities so far.` });
      } else if (score != null && score < 2.2 && n >= 30 && (!this.m.baseline[dom] || score - this.m.baseline[dom].score < 0.3)) {
        out.attention.push({ domain: label, text: `${label} is still at an early first-grade level (${score.toFixed(1)} of the ${TARGET.toFixed(1)} target) after ${n} activities.`, detail: 'The game is using easier, supported activities here.' });
      } else {
        const tag = this.topTag(dom), cnt = tag ? this.tagCount(dom, tag) : 0;
        if (tag && (cnt >= 3 || (this.domainAcc(dom, Date.now() - 7 * 864e5) || 1) < 0.85)) out.attention.push({ domain: label, text: `${name} ${TAG_TEXT[tag]}.`, detail: `Seen ${cnt} times in ${label.toLowerCase()}.` });
      }
    }
    // keep the list focused: the most frequent issues first
    out.attention.forEach(a => { a.w = +(String(a.detail).match(/\d+/) || [0])[0]; });
    out.attention = out.attention.sort((x, y) => y.w - x.w).slice(0, 4);
    out.next = this.plan().map(p => p.text);
    return out;
  },
  // What the engine will focus on next, with reasons.
  plan() {
    const rows = SKILLS.filter(sk => this.unlocked(sk)).map(sk => {
      const st = this.status(sk.id), s = this.skill(sk.id);
      const pr = { [STATUS.NEEDS]: 4, [STATUS.DEVELOPING]: 3, [STATUS.NEW]: 2, [STATUS.ON_TRACK]: 1, [STATUS.MASTERED]: 0 }[st];
      return { sk, st, pr: pr + (Object.keys(s.tags).length ? 0.3 : 0) + Math.min(s.n, 10) / 100 };
    }).sort((a, b) => b.pr - a.pr).slice(0, 4);
    return rows.map(({ sk, st }) => {
      const s = this.skill(sk.id), tag = Object.entries(s.tags).sort((a, b) => b[1] - a[1])[0];
      const how = st === STATUS.NEW ? 'introduce it through game missions' : st === STATUS.NEEDS ? 'use easier, supported activities with pictures and hints before stepping back up'
        : st === STATUS.DEVELOPING ? `keep practicing at level ${this.levelFor(sk.id)} until accuracy is steady` : 'stretch to the next level';
      return { skill: sk.id, text: `${sk.name} (${DOMAIN_NAME[sk.domain]}): ${st.toLowerCase()} — the game will ${how}${tag && tag[1] >= 2 ? `, with extra focus because ${this.childName()} ${TAG_TEXT[tag[0]]}` : ''}.` };
    });
  },

  // ---------- reports ----------
  periodData(fromKey, toKey) {
    const m = this.m, days = Object.keys(m.daily).filter(k => k >= fromKey && k <= toKey).sort();
    const sum = { playSec: 0, learnSec: 0, items: 0, correct: 0, mastered: [], skills: {}, acts: {}, days: days.length };
    for (const k of days) {
      const d = m.daily[k];
      sum.playSec += d.playSec; sum.learnSec += d.learnSec; sum.items += d.items; sum.correct += d.correct; sum.mastered.push(...d.mastered);
      for (const [s, c] of Object.entries(d.skills)) sum.skills[s] = (sum.skills[s] || 0) + c;
      for (const [a, c] of Object.entries(d.acts)) sum.acts[a] = (sum.acts[a] || 0) + c;
    }
    // domain score at start of period vs end (from snapshots)
    const series = {};
    for (const [dom] of DOMAINS) {
      let last = null; const pts = [];
      for (const k of Object.keys(m.daily).sort()) { if (m.daily[k].dom[dom] != null) last = m.daily[k].dom[dom]; if (k >= fromKey && k <= toKey && last != null) pts.push([k, last]); }
      const prior = Object.keys(m.daily).sort().filter(k => k < fromKey && m.daily[k].dom[dom] != null).pop();
      series[dom] = { pts, start: prior ? m.daily[prior].dom[dom] : (pts[0] ? pts[0][1] : null), end: pts.length ? pts[pts.length - 1][1] : (prior ? m.daily[prior].dom[dom] : null) };
    }
    sum.series = series;
    sum.acc = sum.items ? sum.correct / sum.items : null;
    sum.accomplishments = m.log.filter(e => { const k = dayKey(new Date(e.t)); return k >= fromKey && k <= toKey; }).slice(-12);
    return sum;
  },
  // Create any weekly (Mon-Sun) or monthly reports that are due. Runs at startup.
  autoReports() {
    const m = this.m;
    const first = Object.keys(m.daily).sort()[0]; if (!first) return;
    const have = new Set(m.reports.map(r => r.type + r.from));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    // weekly: every completed Monday-Sunday week since the first day played
    const start = new Date(first + 'T00:00:00'); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    for (const d = new Date(start); ; d.setDate(d.getDate() + 7)) {
      const end = new Date(d); end.setDate(end.getDate() + 6);
      if (end >= today) break;
      const from = dayKey(d), to = dayKey(end);
      if (!have.has('week' + from)) m.reports.push({ type: 'week', from, to, created: Date.now(), data: this.compactReport(from, to) });
    }
    // monthly: every completed calendar month
    const ms = new Date(first + 'T00:00:00'); ms.setDate(1);
    for (const d = new Date(ms); ; d.setMonth(d.getMonth() + 1)) {
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      if (end >= today) break;
      const from = dayKey(d), to = dayKey(end);
      if (!have.has('month' + from)) m.reports.push({ type: 'month', from, to, created: Date.now(), data: this.compactReport(from, to) });
    }
    m.reports.sort((a, b) => (a.from < b.from ? 1 : -1));
    m.reports = m.reports.slice(0, 80);
    Save.write();
  },
  compactReport(from, to) {
    const p = this.periodData(from, to), ins = this.insights();
    return { playMin: Math.round(p.playSec / 60), learnMin: Math.round(p.learnSec / 60), items: p.items, acc: p.acc, mastered: p.mastered, skills: Object.keys(p.skills).length, acts: p.acts,
      dom: Object.fromEntries(DOMAINS.map(([d]) => [d, [p.series[d].start, p.series[d].end]])), strengths: ins.strengths.slice(0, 3), attention: ins.attention.slice(0, 3).map(a => a.text), next: ins.next.slice(0, 3),
      accomplishments: p.accomplishments.map(a => a.text) };
  },
};
