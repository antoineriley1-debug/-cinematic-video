// Princess Kingdom Quest - game data: themes, tiers, NPCs, and educational content.
'use strict';

const TOTAL_LEVELS = 100;
const LEVELS_PER_THEME = 5;
const LEVELS_PER_TIER = 10;

// 20 worlds x 5 levels = 100 levels. Every world keeps pink in its palette.
const THEMES = [
  { name: 'Pink Meadow Kingdom',   sky: 0xffd6ea, fog: 0xffe4f1, ground: 0x9be59b, accent: 0xff69b4, trim: 0xffffff, tree: 'round',    deco: 0xff8fc7, msg: 'Every great princess starts with one brave step.' },
  { name: 'Cupcake Castle',        sky: 0xffe0f0, fog: 0xfff0f7, ground: 0xffc8dd, accent: 0xff4fa3, trim: 0xfff3b0, tree: 'candy',    deco: 0xb5f0ff, msg: 'You can learn anything if you keep trying.' },
  { name: 'Baby Dragon Valley',    sky: 0xffd1dc, fog: 0xffe2ea, ground: 0x8fd694, accent: 0xff5c8a, trim: 0xb388ff, tree: 'cone',     deco: 0x7ee0b5, msg: 'Being kind to everyone makes you strong.' },
  { name: 'Crystal Caves',         sky: 0xe8cfff, fog: 0xf0dcff, ground: 0xc9b6f0, accent: 0xff7ad9, trim: 0x8ee8ff, tree: 'crystal',  deco: 0xff9ee5, msg: 'Your mind sparkles brighter than any crystal.' },
  { name: 'Unicorn Cloud Isles',   sky: 0xd6ecff, fog: 0xffeaf6, ground: 0xfafaff, accent: 0xff8ad8, trim: 0xffe066, tree: 'cloud',    deco: 0xc6a8ff, msg: 'Dream big - then go make it happen.' },
  { name: 'Mermaid Lagoon',        sky: 0xc8f3ff, fog: 0xe0f9ff, ground: 0xffe8b8, accent: 0xff6fb5, trim: 0x48d1cc, tree: 'coral',    deco: 0xff9f9f, msg: 'Mistakes help your brain grow.' },
  { name: 'Enchanted Forest',      sky: 0xf6d0ff, fog: 0xf8e2ff, ground: 0x7fcf87, accent: 0xff59b6, trim: 0xffd166, tree: 'mushroom', deco: 0xff6b9a, msg: 'You are braver than you believe.' },
  { name: 'Candy Mountains',       sky: 0xffd8f0, fog: 0xffebf7, ground: 0xffb3d9, accent: 0xff3d9a, trim: 0x9df2c4, tree: 'candy',    deco: 0xffe27a, msg: 'Sharing makes everything sweeter.' },
  { name: 'Fairy Garden',          sky: 0xe9ffe0, fog: 0xffeefa, ground: 0xa6eba0, accent: 0xff70c2, trim: 0xfff07a, tree: 'flower',   deco: 0xd59cff, msg: 'Little things you do can make a big difference.' },
  { name: 'Snow Princess Palace',  sky: 0xe6f3ff, fog: 0xf5faff, ground: 0xf4f8ff, accent: 0xff8fcf, trim: 0x9ad7ff, tree: 'snow',     deco: 0xc8e6ff, msg: 'Stay cool, think it through, and you will find the answer.' },
  { name: 'Rainbow Bridge Realm',  sky: 0xfff0d6, fog: 0xffeef6, ground: 0x9ee6a8, accent: 0xff5fa8, trim: 0x6ec6ff, tree: 'round',    deco: 0xffb347, msg: 'Everyone is different, and that is beautiful.' },
  { name: 'Dragon Tower Peaks',    sky: 0xffd3c8, fog: 0xffe4dc, ground: 0xb7d68c, accent: 0xff4f7b, trim: 0xffa94d, tree: 'cone',     deco: 0xff8c66, msg: 'Courage means trying even when it feels hard.' },
  { name: 'Butterfly Islands',     sky: 0xfde2ff, fog: 0xfff0ff, ground: 0x8ee6b0, accent: 0xff6ec7, trim: 0x7ad7f0, tree: 'flower',   deco: 0xffcf5c, msg: 'You can change and grow, just like a butterfly.' },
  { name: 'Star Observatory',      sky: 0x3b2a6b, fog: 0x4b3580, ground: 0x6b5aa8, accent: 0xff7ad0, trim: 0xffe680, tree: 'crystal',  deco: 0xfff3a3, msg: 'Ask big questions - that is how scientists start.' },
  { name: 'Royal Library',         sky: 0xffe6d5, fog: 0xfff1e8, ground: 0xd9b38c, accent: 0xff5f9e, trim: 0x8b5a2b, tree: 'book',     deco: 0xff9fc9, msg: 'Every book you read makes you wiser.' },
  { name: 'Volcano Dragon Isle',   sky: 0xffc2b3, fog: 0xffd9cc, ground: 0x8d6e63, accent: 0xff4d88, trim: 0xffb300, tree: 'cone',     deco: 0xff7043, msg: 'Big feelings are okay - breathe and be calm.' },
  { name: 'Moonlight Ballroom',    sky: 0x2d1f4f, fog: 0x3c2a66, ground: 0x5c4b8a, accent: 0xff8ad8, trim: 0xe0e0ff, tree: 'crystal',  deco: 0xffd1f0, msg: 'Your voice matters. Speak up kindly.' },
  { name: 'Sky Pirate Princess',   sky: 0xbfe8ff, fog: 0xdff3ff, ground: 0xc4e3a6, accent: 0xff5ca8, trim: 0xa0522d, tree: 'cloud',    deco: 0xffd27f, msg: 'Leaders help their team succeed.' },
  { name: 'Golden Desert Oasis',   sky: 0xffe9c4, fog: 0xfff3dd, ground: 0xf5d79e, accent: 0xff6fa8, trim: 0x2ec4b6, tree: 'palm',     deco: 0xffb4d0, msg: 'Keep going - you are closer than you think.' },
  { name: "Queen's Grand Palace",  sky: 0xffd9f2, fog: 0xffeaf8, ground: 0xa8e6a1, accent: 0xff2e93, trim: 0xffd700, tree: 'round',    deco: 0xffb3e6, msg: 'You are smart, strong, kind - and ready to lead.' },
];

// 10 tiers x 10 levels.
const TIERS = [
  { name: 'Sprout Princess',   icon: '🌱', color: '#7bd389' },
  { name: 'Brave Princess',    icon: '🛡️', color: '#ff9f43' },
  { name: 'Clever Princess',   icon: '🧠', color: '#54a0ff' },
  { name: 'Kind Princess',     icon: '💖', color: '#ff6b9d' },
  { name: 'Dragon Friend',     icon: '🐉', color: '#1dd1a1' },
  { name: 'Crystal Knight',    icon: '💎', color: '#a29bfe' },
  { name: 'Star Scholar',      icon: '🌟', color: '#feca57' },
  { name: 'Royal Inventor',    icon: '⚙️', color: '#48dbfb' },
  { name: 'Wise Leader',       icon: '🦉', color: '#c56cf0' },
  { name: 'Queen of Kingdoms', icon: '👑', color: '#ff2e93' },
];

const themeFor = (level) => THEMES[Math.floor((level - 1) / LEVELS_PER_THEME) % THEMES.length];
const tierIndexFor = (level) => Math.min(TIERS.length - 1, Math.floor((level - 1) / LEVELS_PER_TIER));
const tierFor = (level) => TIERS[tierIndexFor(level)];

const NPC_NAMES = ['Lily', 'Aria', 'Rosie', 'Mia', 'Zara', 'Luna', 'Ivy', 'Sophie', 'Nora', 'Ella', 'Maya', 'Chloe',
  'Ruby', 'Hazel', 'Jade', 'Willow', 'Amara', 'Leah', 'Isla', 'Gigi', 'Sir Felix', 'Sir Theo', 'Prince Leo', 'Knight Sam'];
const DRAGON_NAMES = ['Sparkle', 'Puff', 'Ember', 'Pip', 'Blossom', 'Sunny', 'Mochi', 'Bubbles'];

const NPC_CHATTER = [
  'Have you tried the portals? They are so fun!',
  'I found a gem on top of that hill!',
  'The tower is tall, but you can do it!',
  'Let us be friends!',
  'I love learning new things!',
  'Wow, you are fast!',
  'Did you see the baby dragon? So cute!',
  'I almost have all my keys!',
  'Practice makes progress!',
  'Pink is the best color, right?',
  'Want to race to the castle?',
  'You are doing amazing!',
  'I got a math one wrong, so I tried again and got it!',
  'Look at the minimap to find more gems!',
];

// Affirmations shown on wins - empowering, growth-mindset messages.
const AFFIRMATIONS = [
  'You are smart!', 'You worked hard and it showed!', 'Your brain is growing!', 'You never gave up!',
  'That was brave!', 'You are a great problem solver!', 'Princess power!', 'You are a leader!',
  'Amazing thinking!', 'You can do hard things!', 'So proud of you!', 'You are unstoppable!',
];

// ---------- helpers ----------
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// Build a multiple-choice set: the correct answer plus unique distractors.
function choicesWith(answer, distractors, n = 4) {
  const set = [String(answer)];
  for (const d of shuffle(distractors)) {
    if (set.length >= n) break;
    if (!set.includes(String(d))) set.push(String(d));
  }
  return shuffle(set);
}
function numberChoices(ans, spread = 3) {
  const ds = [];
  for (let i = 1; i <= spread + 3; i++) { ds.push(ans + i); if (ans - i >= 0) ds.push(ans - i); }
  return choicesWith(ans, ds);
}

// Learning content now lives in js/curriculum.js (grade-based, adaptive). The old level-based question
// generators were removed: they included multiplication/division that is not appropriate for grade 1.
const band = (dom) => (typeof Learn !== 'undefined' ? Learn.band(dom) : 0);

// Portal/minigame catalog.
const GAMES = {
  math:    { name: 'Magic Math',       icon: '🔢', color: 0xff69b4, subject: 'Math' },
  spell:   { name: 'Spell Castle',     icon: '🔤', color: 0xb388ff, subject: 'Spelling & phonics' },
  pattern: { name: 'Pattern Path',     icon: '🌈', color: 0xffb347, subject: 'Shapes & patterns' },
  memory:  { name: 'Memory Mirror',    icon: '🪞', color: 0x48dbfb, subject: 'Sight words' },
  count:   { name: 'Dragon Count',     icon: '🐉', color: 0x1dd1a1, subject: 'Numbers & measuring' },
  read:    { name: 'Story Scroll',     icon: '📜', color: 0xff9ff3, subject: 'Reading' },
  science: { name: 'Wonder Lab',       icon: '🔬', color: 0x54a0ff, subject: 'Science' },
  shapes:  { name: 'Clock & Shapes',   icon: '⏰', color: 0xfeca57, subject: 'Shapes, time & length' },
  heart:   { name: 'Town Hall',        icon: '🏛️', color: 0xff6b9d, subject: 'Social studies' },
  money:   { name: 'Royal Market',     icon: '🪙', color: 0xffd700, subject: 'Money & numbers' },
};
const GAME_KEYS = Object.keys(GAMES);

// Level configuration: everything scales so later levels are longer.
function levelConfig(level) {
  const t = tierIndexFor(level);
  return {
    gems: Math.min(45, 12 + Math.floor(level * 0.33)),
    keys: Math.min(8, 3 + Math.floor(level / 18)),
    portals: Math.min(10, 5 + Math.floor(level / 18)),
    friends: Math.min(5, 1 + Math.floor(level / 22)),
    towerSteps: Math.min(36, 10 + Math.floor(level / 3)),
    towerGap: Math.min(1.0, level / 100), // 0 = easy, 1 = hardest
    questions: Math.min(8, 5 + Math.floor(level / 34)),
    npcs: Math.min(16, 8 + Math.floor(level / 12)),
    worldSize: Math.min(150, 90 + level * 0.6),
    tier: t,
  };
}

// Default rewards shown before the parent customizes the store.
const DEFAULT_STORE = [
  { id: 'r1', emoji: '🍦', name: 'Ice cream treat', price: 150 },
  { id: 'r2', emoji: '📺', name: '30 min extra screen time', price: 200 },
  { id: 'r3', emoji: '🎨', name: 'New coloring book', price: 300 },
  { id: 'r4', emoji: '🛝', name: 'Trip to the park', price: 400 },
  { id: 'r5', emoji: '🧸', name: 'Small toy', price: 800 },
  { id: 'r6', emoji: '👑', name: 'Princess dress-up day', price: 1200 },
];

// ---------- Princess Town shops (one street in every kingdom) ----------
const SHOPS = {
  icecream: { name: 'Ice Cream Shop', icon: '🍦', color: 0xffb3d9, roof: 0x8ee8ff, item: '🍦', itemName: 'ice cream cones' },
  candy:    { name: 'Candy Shop',     icon: '🍭', color: 0xfff07a, roof: 0xff5fa8, item: '🍬', itemName: 'candy bags' },
  sneakers: { name: 'Sneaker Studio', icon: '👟', color: 0xb5f0ff, roof: 0xb388ff, item: '👟', itemName: 'sneaker boxes' },
  salon:    { name: 'Hair Salon',     icon: '💇‍♀️', color: 0xe9d4ff, roof: 0xff69b4, item: '🎀', itemName: 'hair bows' },
  spa:      { name: 'Nail & Pedi Spa', icon: '💅', color: 0xffd1e8, roof: 0xffd700, item: '💅', itemName: 'nail polish bottles' },
};
const SHOP_KEYS = Object.keys(SHOPS);
const HAIR_STYLES = [['pony', 'Ponytail'], ['long', 'Long'], ['buns', 'Space buns'], ['braids', 'Braids'], ['curly', 'Curly'], ['bob', 'Bob']];
const HAIR_COLORS = [['Brown', 0x5a2d1a], ['Black', 0x1a1a1a], ['Blonde', 0xffd36b], ['Red', 0xd2491e], ['Pink', 0xff7ab8], ['Purple', 0xa070ff], ['Blue', 0x5ab0ff], ['Green', 0x7ee0b5], ['Orange', 0xff9f43]];
const PAINT_COLORS = [['Pink', 0xff69b4], ['Hot pink', 0xff1f8f], ['Purple', 0xa070ff], ['Red', 0xe8303a], ['Orange', 0xff9f43], ['Gold', 0xffd700], ['Mint', 0x7ee0b5], ['Blue', 0x48a8ff], ['White', 0xffffff], ['Black', 0x2a2a2a]];
const hex = (n) => '#' + n.toString(16).padStart(6, '0');
const colorName = (n, list = PAINT_COLORS) => (list.find(c => c[1] === n) || ['?'])[0];

// Kid-safe chat for multiplayer.
const SAFE_PHRASES = ['Hi! 👋', 'Want to play?', 'Follow me!', 'Wait for me!', 'Let\'s go to the castle!', 'Let\'s climb the tower!',
  'I found a gem! 💎', 'Good job! 🌟', 'You are awesome!', 'Let\'s get ice cream! 🍦', 'Let\'s do our nails! 💅', 'Race you! 🏃‍♀️',
  'Help me please!', 'Thank you! 💖', 'Yes!', 'No thanks', 'Be right back', 'Bye! 👋'];
const CHAT_EMOJI = ['😀', '😂', '🥰', '😮', '😢', '👍', '💖', '👑', '🦄', '🐉', '🌈', '⭐'];
const BAD_WORDS = ['stupid', 'dumb', 'idiot', 'hate', 'shut up', 'ugly', 'loser', 'kill', 'die', 'damn', 'hell', 'crap', 'sexy', 'butt'];
function cleanChat(text) {
  let t = String(text || '').slice(0, 80);
  t = t.replace(/https?:\/\/\S+|www\.\S+|\S+@\S+/gi, '***');      // links / emails
  t = t.replace(/\d[\d\s().-]{3,}\d/g, '***');                     // phone numbers / addresses
  for (const w of BAD_WORDS) t = t.replace(new RegExp('\\b' + w + '\\b', 'gi'), '***');
  return t.trim();
}

// ---------- Boutique: looks she can earn (price 0 = free from the start) ----------
// Skin tones are always free. Colors carry a numeric value; styles are ids the 3D model understands.
const WARDROBE = {
  skin:      { tab: 'face', label: 'Skin tone', items: [['t1', 'Light', 0, 0xffe0bd], ['t2', 'Fair', 0, 0xffdbac], ['t3', 'Tan', 0, 0xf1c27d], ['t4', 'Golden', 0, 0xe0ac69], ['t5', 'Brown', 0, 0xc68642], ['t6', 'Deep', 0, 0x8d5524]] },
  eyes:      { tab: 'face', label: 'Eyes', items: [['round', 'Round', 0], ['sparkle', 'Sparkly', 30], ['lashes', 'Lashes', 40], ['happy', 'Happy', 30], ['starry', 'Starry', 60]] },
  eyeColor:  { tab: 'face', label: 'Eye color', items: [['brown', 'Brown', 0, 0x4a2a1a], ['black', 'Black', 0, 0x1a1a1a], ['blue', 'Blue', 20, 0x2f7de1], ['green', 'Green', 20, 0x2e9e5b], ['purple', 'Purple', 40, 0x8a3cf0], ['pink', 'Pink', 40, 0xff3d9a]] },
  nose:      { tab: 'face', label: 'Nose', items: [['button', 'Button', 0], ['small', 'Tiny', 0], ['dot', 'Dot', 15], ['round', 'Round', 15]] },
  mouth:     { tab: 'face', label: 'Mouth', items: [['smile', 'Smile', 0], ['grin', 'Big grin', 20], ['open', 'Wow!', 20], ['tongue', 'Silly', 30], ['smirk', 'Sly smile', 25]] },
  cheeks:    { tab: 'face', label: 'Cheeks', items: [['blush', 'Blush', 0], ['none', 'None', 0], ['freckles', 'Freckles', 25], ['hearts', 'Hearts', 50], ['stars', 'Stars', 50]] },
  hairStyle: { tab: 'hair', label: 'Hair style', items: [['pony', 'Ponytail', 0], ['bob', 'Bob', 0], ['long', 'Long', 40], ['buns', 'Space buns', 50], ['braids', 'Braids', 50], ['curly', 'Curly', 50]] },
  hair:      { tab: 'hair', label: 'Hair color', items: [['brown', 'Brown', 0, 0x5a2d1a], ['black', 'Black', 0, 0x1a1a1a], ['blonde', 'Blonde', 0, 0xffd36b], ['red', 'Red', 0, 0xd2491e], ['orange', 'Orange', 30, 0xff9f43], ['pink', 'Pink', 40, 0xff7ab8], ['purple', 'Purple', 40, 0xa070ff], ['blue', 'Blue', 50, 0x5ab0ff], ['green', 'Green', 50, 0x7ee0b5]] },
  outfit:    { tab: 'outfit', label: 'Outfit', items: [['gown', 'Princess gown', 0], ['tutu', 'Ballet tutu', 80], ['pants', 'Adventure pants', 60], ['royal', 'Royal ball gown', 150]] },
  dress:     { tab: 'outfit', label: 'Outfit color', items: [['pink', 'Pink', 0, 0xff4fa3], ['purple', 'Purple', 0, 0xa070ff], ['sky', 'Sky blue', 20, 0x7ad7f0], ['mint', 'Mint', 20, 0x7ee0b5], ['sunny', 'Sunny', 20, 0xfff07a], ['coral', 'Coral', 30, 0xff6b6b], ['white', 'Snow', 30, 0xffffff], ['gold', 'Gold', 100, 0xffd700]] },
  headwear:  { tab: 'outfit', label: 'On my head', items: [['crown', 'Crown', 0], ['none', 'Nothing', 0], ['bow', 'Big bow', 30], ['flower', 'Flower', 40], ['tiara', 'Tiara', 60]] },
};
// Which saved look field and value each catalog slot maps to.
function wardrobeValue(slot, item) { return item.length > 3 ? item[3] : item[0]; }
function wardrobeCurrent(slot, look) {
  const v = look[slot];
  return WARDROBE[slot].items.find(it => wardrobeValue(slot, it) === v) || WARDROBE[slot].items[0];
}
