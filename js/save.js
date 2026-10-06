// Persistent state: kid progress + parent settings, stored on the device.
'use strict';

const SAVE_KEY = 'pkq_save_v1';
const PARENT_KEY = 'pkq_parent_v1';

function safeGet(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
}
function safeSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* storage unavailable - play continues unsaved */ }
}

const Save = {
  data: null,
  parent: null,

  load() {
    this.data = Object.assign({
      unlocked: 1,           // highest level unlocked
      current: 1,            // level being played
      completed: [],         // level numbers finished
      coins: 0,
      lifetimeCoins: 0,
      correct: 0,
      answered: 0,
      subjects: {},          // subject -> {right, total}
      purchases: [],         // {id, emoji, name, price, date, delivered}
      levelState: null,      // in-progress objectives for current level
      playerName: '',
    }, safeGet(SAVE_KEY) || {});
    this.parent = Object.assign({
      pin: '',
      items: DEFAULT_STORE.map(i => Object.assign({}, i)),
      coinMultiplier: 1,
      voice: true,
      dailyGoal: 0,
    }, safeGet(PARENT_KEY) || {});
  },
  write() { safeSet(SAVE_KEY, this.data); },
  writeParent() { safeSet(PARENT_KEY, this.parent); },

  addCoins(n, reason) {
    const amt = Math.max(1, Math.round(n * (this.parent.coinMultiplier || 1)));
    this.data.coins += amt;
    this.data.lifetimeCoins += amt;
    this.write();
    if (typeof UI !== 'undefined') UI.updateCoins(amt, reason);
    return amt;
  },

  recordAnswer(subject, right) {
    this.data.answered++;
    if (right) this.data.correct++;
    const s = this.data.subjects[subject] || (this.data.subjects[subject] = { right: 0, total: 0 });
    s.total++; if (right) s.right++;
    this.write();
  },

  // Level progress (resumes if the app is closed mid-level).
  levelState(level) {
    const ls = this.data.levelState;
    if (ls && ls.level === level) return ls;
    this.data.levelState = { level, gems: [], keys: [], friends: [], crown: false };
    this.write();
    return this.data.levelState;
  },

  completeLevel(level) {
    if (!this.data.completed.includes(level)) this.data.completed.push(level);
    this.data.unlocked = Math.min(TOTAL_LEVELS, Math.max(this.data.unlocked, level + 1));
    this.data.levelState = null;
    this.write();
  },

  resetProgress() {
    const keepPurchases = this.data.purchases;
    localStorage.removeItem(SAVE_KEY);
    this.load();
    this.data.purchases = keepPurchases;
    this.write();
  },
};
Save.load();
