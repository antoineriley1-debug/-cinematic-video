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

// ---------- word banks (by difficulty band 0..4) ----------
const WORDS = [
  ['cat', 'sun', 'pig', 'hat', 'bee', 'red', 'cup', 'dog', 'fox', 'bus', 'map', 'pen'],
  ['pink', 'star', 'frog', 'cake', 'fish', 'moon', 'ring', 'tree', 'bird', 'rose', 'gift', 'king'],
  ['crown', 'tower', 'queen', 'heart', 'jewel', 'magic', 'horse', 'smile', 'apple', 'cloud', 'brave', 'happy'],
  ['dragon', 'castle', 'garden', 'friend', 'flower', 'rocket', 'planet', 'bridge', 'kitten', 'sparkle', 'rainbow', 'teacher'],
  ['princess', 'kingdom', 'unicorn', 'treasure', 'butterfly', 'adventure', 'courage', 'science', 'library', 'kindness', 'imagine', 'mountain'],
];

// ---------- reading / phonics ----------
const STORIES = [
  { t: 'Rosie the dragon loves to eat pink berries. She eats them every morning.', q: 'What does Rosie eat?', a: 'Pink berries', d: ['Carrots', 'Pizza', 'Fish'] },
  { t: 'Lily built a sand castle by the sea. A wave came and she built it again, even bigger!', q: 'What did Lily do after the wave?', a: 'Built it again', d: ['Cried', 'Went home', 'Gave up'] },
  { t: 'The baby unicorn was scared of the dark, so her friend gave her a glowing star.', q: 'Why did she get a star?', a: 'She was scared of the dark', d: ['It was her birthday', 'She was hungry', 'She was cold'] },
  { t: 'Princess Mia planted a seed. She gave it water and sun. Soon a flower grew.', q: 'What did the seed need?', a: 'Water and sun', d: ['Candy', 'Toys', 'Snow'] },
  { t: 'Ivy saw a girl sitting alone at lunch. Ivy sat next to her and said hello.', q: 'How did Ivy help?', a: 'She sat with her', d: ['She ran away', 'She laughed', 'She ate her lunch'] },
  { t: 'The castle has three towers. The tallest tower is pink and has a gold flag.', q: 'What color is the tallest tower?', a: 'Pink', d: ['Blue', 'Green', 'Gold'] },
  { t: 'Zara practiced her song every day. On the day of the show she sang perfectly.', q: 'Why did Zara sing well?', a: 'She practiced', d: ['She was lucky', 'She was tall', 'She had a crown'] },
  { t: 'Puff the dragon sneezed and made bubbles instead of fire. Everyone giggled, even Puff.', q: 'What came out when Puff sneezed?', a: 'Bubbles', d: ['Fire', 'Snow', 'Flowers'] },
  { t: 'Luna counted the stars: one, two, three... she found ten stars before bedtime.', q: 'How many stars did Luna find?', a: '10', d: ['3', '5', '100'] },
  { t: 'Knight Sam forgot his shield. Princess Ella shared hers so they could both play.', q: 'What did Ella share?', a: 'Her shield', d: ['Her crown', 'Her cake', 'Her horse'] },
  { t: 'Bees fly from flower to flower. They help the flowers grow and they make honey.', q: 'What do bees make?', a: 'Honey', d: ['Milk', 'Bread', 'Juice'] },
  { t: 'The mermaid swam deep to find a lost pearl. It was hiding inside a shell.', q: 'Where was the pearl?', a: 'Inside a shell', d: ['On a rock', 'In a tree', 'In the castle'] },
  { t: 'When Nora felt angry, she took three deep breaths. Then she felt calm again.', q: 'What helped Nora feel calm?', a: 'Deep breaths', d: ['Yelling', 'Stomping', 'Running away'] },
  { t: 'The queen asked everyone for ideas. Maya had a great plan to build a bridge.', q: 'What was Maya\'s plan?', a: 'Build a bridge', d: ['Dig a hole', 'Bake a cake', 'Go to sleep'] },
  { t: 'Snow fell on the palace. The princess wore a warm coat, mittens, and a hat.', q: 'Why did she wear a coat?', a: 'It was cold', d: ['It was hot', 'It was dark', 'It was raining candy'] },
  { t: 'Chloe wanted to be an inventor. She built a robot that could water plants.', q: 'What could the robot do?', a: 'Water plants', d: ['Dance', 'Fly', 'Cook dinner'] },
];
const RHYMES = [
  ['cat', 'hat', ['dog', 'cup', 'sun']], ['star', 'car', ['moon', 'pen', 'fish']], ['cake', 'lake', ['ring', 'bird', 'cup']],
  ['king', 'ring', ['rose', 'hat', 'tree']], ['moon', 'spoon', ['frog', 'gift', 'crown']], ['bee', 'tree', ['pig', 'sun', 'cake']],
  ['pink', 'sink', ['blue', 'fish', 'map']], ['light', 'night', ['day', 'star', 'cup']], ['fish', 'dish', ['bird', 'cow', 'hat']],
  ['bear', 'chair', ['dog', 'cake', 'sun']], ['bug', 'rug', ['bee', 'pen', 'fox']], ['crown', 'town', ['king', 'gem', 'cup']],
];
const FIRST_LETTER = [['🍎', 'apple', 'A'], ['🐝', 'bee', 'B'], ['🐱', 'cat', 'C'], ['🐶', 'dog', 'D'], ['🥚', 'egg', 'E'], ['🐸', 'frog', 'F'],
  ['🎁', 'gift', 'G'], ['🎩', 'hat', 'H'], ['🍦', 'ice cream', 'I'], ['🃏', 'joker', 'J'], ['🪁', 'kite', 'K'], ['🦁', 'lion', 'L'],
  ['🌙', 'moon', 'M'], ['🪺', 'nest', 'N'], ['🐙', 'octopus', 'O'], ['🐷', 'pig', 'P'], ['👑', 'queen', 'Q'], ['🌹', 'rose', 'R'],
  ['⭐', 'star', 'S'], ['🌳', 'tree', 'T'], ['🦄', 'unicorn', 'U'], ['🎻', 'violin', 'V'], ['🐋', 'whale', 'W'], ['🦊', 'fox', 'F'], ['🪀', 'yo-yo', 'Y'], ['🦓', 'zebra', 'Z']];

// ---------- science (band 0..4) ----------
const SCIENCE = [
  // band 0
  { b: 0, q: 'What do plants need to grow?', a: 'Water and sunlight', d: ['Candy', 'Toys', 'Shoes'] },
  { b: 0, q: 'Which animal can fly?', a: 'Bird', d: ['Fish', 'Cow', 'Snail'] },
  { b: 0, q: 'What do we use to see?', a: 'Eyes', d: ['Ears', 'Nose', 'Feet'] },
  { b: 0, q: 'Ice is water that is very...', a: 'Cold', d: ['Hot', 'Pink', 'Loud'] },
  { b: 0, q: 'Which one is a baby frog?', a: 'Tadpole', d: ['Puppy', 'Kitten', 'Chick'] },
  { b: 0, q: 'When is the sky dark?', a: 'Night', d: ['Morning', 'Lunch time', 'Noon'] },
  // band 1
  { b: 1, q: 'What does a caterpillar turn into?', a: 'Butterfly', d: ['Bird', 'Bee', 'Frog'] },
  { b: 1, q: 'How many legs does a spider have?', a: '8', d: ['6', '4', '10'] },
  { b: 1, q: 'Which is the closest star to Earth?', a: 'The Sun', d: ['The Moon', 'Mars', 'A comet'] },
  { b: 1, q: 'Which animal lives in the ocean?', a: 'Dolphin', d: ['Camel', 'Horse', 'Owl'] },
  { b: 1, q: 'What do bees collect from flowers?', a: 'Nectar', d: ['Rocks', 'Leaves', 'Water'] },
  { b: 1, q: 'What season comes after winter?', a: 'Spring', d: ['Summer', 'Fall', 'Winter'] },
  // band 2
  { b: 2, q: 'What gas do we breathe in to live?', a: 'Oxygen', d: ['Smoke', 'Helium', 'Steam'] },
  { b: 2, q: 'Which planet do we live on?', a: 'Earth', d: ['Mars', 'Venus', 'Jupiter'] },
  { b: 2, q: 'What pulls things down to the ground?', a: 'Gravity', d: ['Magnets', 'Wind', 'Light'] },
  { b: 2, q: 'Water turns into steam when it is...', a: 'Heated', d: ['Frozen', 'Shaken', 'Painted'] },
  { b: 2, q: 'Which body part pumps blood?', a: 'Heart', d: ['Lungs', 'Stomach', 'Brain'] },
  { b: 2, q: 'A magnet sticks to...', a: 'Iron', d: ['Wood', 'Paper', 'Plastic'] },
  // band 3
  { b: 3, q: 'What is the biggest planet?', a: 'Jupiter', d: ['Earth', 'Mars', 'Mercury'] },
  { b: 3, q: 'Plants make food from sunlight. This is called...', a: 'Photosynthesis', d: ['Hibernation', 'Migration', 'Evaporation'] },
  { b: 3, q: 'Animals that eat only plants are called...', a: 'Herbivores', d: ['Carnivores', 'Predators', 'Insects'] },
  { b: 3, q: 'Which is a mammal?', a: 'Whale', d: ['Shark', 'Lizard', 'Frog'] },
  { b: 3, q: 'What are the three states of matter?', a: 'Solid, liquid, gas', d: ['Hot, warm, cold', 'Big, medium, small', 'Red, blue, yellow'] },
  { b: 3, q: 'The Moon shines because it reflects light from...', a: 'The Sun', d: ['Earth', 'Stars', 'Itself'] },
  // band 4
  { b: 4, q: 'What part of a cell holds its DNA?', a: 'Nucleus', d: ['Wall', 'Petal', 'Root'] },
  { b: 4, q: 'Which force keeps planets orbiting the Sun?', a: 'Gravity', d: ['Friction', 'Magnetism', 'Wind'] },
  { b: 4, q: 'What do we call scientists who study dinosaurs?', a: 'Paleontologists', d: ['Astronomers', 'Chefs', 'Botanists'] },
  { b: 4, q: 'Sound travels as...', a: 'Vibrations', d: ['Colors', 'Smells', 'Shadows'] },
  { b: 4, q: 'Electricity flows easily through...', a: 'Metal', d: ['Rubber', 'Wood', 'Glass'] },
  { b: 4, q: 'Which organ helps you breathe?', a: 'Lungs', d: ['Liver', 'Heart', 'Skin'] },
];

// ---------- kindness / empowerment scenarios ----------
const HEART = [
  { q: 'Your friend falls down on the playground. What do you do?', a: 'Help her up and ask if she is okay', d: ['Laugh', 'Walk away'] },
  { q: 'You got a math problem wrong. What should you say?', a: 'I can learn from this and try again!', d: ['I am bad at math', 'I quit'] },
  { q: 'A new girl does not know anyone. What can you do?', a: 'Invite her to play', d: ['Ignore her', 'Whisper about her'] },
  { q: 'You feel really angry. What is a good choice?', a: 'Take deep breaths and talk about it', d: ['Throw things', 'Yell at someone'] },
  { q: 'Someone says girls cannot build robots. What is true?', a: 'Girls can build anything!', d: ['They are right', 'Only boys can'] },
  { q: 'You broke your sister\'s toy by accident. What do you do?', a: 'Tell the truth and say sorry', d: ['Hide it', 'Blame the dog'] },
  { q: 'Your team lost the game. What do you say?', a: 'Good game! We will practice and try again', d: ['This is unfair!', 'I am never playing again'] },
  { q: 'A friend shares a cool idea. How do you respond?', a: 'That is a great idea!', d: ['Mine is better', 'Say nothing'] },
  { q: 'Something feels too hard. What can you do?', a: 'Ask for help and keep trying', d: ['Give up right away', 'Cry and stop'] },
  { q: 'You see someone being teased. What is brave?', a: 'Stand up for them and get a grown-up', d: ['Join in', 'Laugh along'] },
  { q: 'How can you show you are a good listener?', a: 'Look at them and wait for my turn', d: ['Talk over them', 'Play with my toy'] },
  { q: 'What makes a real princess?', a: 'Being kind, brave and smart', d: ['Only a fancy dress', 'Being bossy'] },
  { q: 'You want a turn on the swing. What do you say?', a: 'Can I have a turn next, please?', d: ['Get off!', 'Push them off'] },
  { q: 'Your friend is sad. What can you do?', a: 'Give a hug and listen', d: ['Tell her to stop', 'Leave'] },
  { q: 'You finished a hard puzzle! How should you feel?', a: 'Proud of my hard work', d: ['Nothing', 'Embarrassed'] },
  { q: 'Someone made a mistake on your team. What do you say?', a: 'It is okay, we all make mistakes', d: ['You ruined it!', 'You are bad'] },
];

// ---------- mini-game question generators ----------
// Each returns { prompt, visual?, choices[], answer } with difficulty driven by level (1..100).
const band = (level) => Math.min(4, Math.floor((level - 1) / 20));

function genMath(level) {
  const b = band(level);
  const r = Math.random();
  let a, c, op, ans;
  if (b === 0) {
    const max = 5 + Math.floor(level / 2);
    a = rnd(0, max); c = rnd(0, Math.min(max, 10));
    if (r < 0.6) { op = '+'; ans = a + c; } else { if (c > a) [a, c] = [c, a]; op = '−'; ans = a - c; }
  } else if (b === 1) {
    if (r < 0.4) { a = rnd(10, 60); c = rnd(5, 39); op = '+'; ans = a + c; }
    else if (r < 0.75) { a = rnd(20, 99); c = rnd(5, a); op = '−'; ans = a - c; }
    else { a = rnd(1, 5); c = rnd(1, 10); op = '×'; ans = a * c; }
  } else if (b === 2) {
    if (r < 0.45) { a = rnd(2, 10); c = rnd(2, 10); op = '×'; ans = a * c; }
    else if (r < 0.75) { c = rnd(2, 10); ans = rnd(1, 10); a = c * ans; op = '÷'; }
    else { a = rnd(100, 500); c = rnd(10, 300); op = '+'; ans = a + c; }
  } else if (b === 3) {
    if (r < 0.3) { a = rnd(6, 12); c = rnd(6, 12); op = '×'; ans = a * c; }
    else if (r < 0.55) { c = rnd(3, 12); ans = rnd(3, 12); a = c * ans; op = '÷'; }
    else if (r < 0.8) { const den = pick([2, 3, 4, 5, 10]); const whole = den * rnd(2, 8); ans = whole / den; return { prompt: `What is 1/${den} of ${whole}?`, choices: numberChoices(ans), answer: String(ans) }; }
    else { a = rnd(100, 999); c = rnd(100, a); op = '−'; ans = a - c; }
  } else {
    if (r < 0.25) { a = rnd(11, 25); c = rnd(3, 9); op = '×'; ans = a * c; }
    else if (r < 0.5) { const x = rnd(2, 12), m = rnd(2, 9), k = rnd(1, 20); return { prompt: `${m} × ? + ${k} = ${m * x + k}`, choices: numberChoices(x), answer: String(x) }; }
    else if (r < 0.75) { const p = pick([10, 20, 25, 50]); const base = pick([20, 40, 60, 80, 100, 200]); ans = base * p / 100; return { prompt: `What is ${p}% of ${base}?`, choices: numberChoices(ans, 5), answer: String(ans) }; }
    else { const s = rnd(2, 9); return { prompt: `What is ${s} squared (${s}×${s})?`, choices: numberChoices(s * s, 4), answer: String(s * s) }; }
  }
  return { prompt: `${a} ${op} ${c} = ?`, choices: numberChoices(ans), answer: String(ans) };
}

function genSpell(level) {
  const b = band(level);
  const word = pick(WORDS[Math.min(4, b + (Math.random() < 0.3 ? 1 : 0))]);
  let letters = word.split('');
  // Make sure scrambled order differs from the real word.
  let scr = shuffle(letters);
  for (let i = 0; i < 5 && scr.join('') === word; i++) scr = shuffle(letters);
  return { kind: 'spell', prompt: 'Tap the letters to spell the word!', word, letters: scr };
}

const PATTERN_SETS = [['🌸', '⭐'], ['👑', '💎', '🌸'], ['🐉', '🦄'], ['🍓', '🍰', '🧁'], ['💗', '💜', '💙'], ['🌙', '⭐', '☀️']];
function genPattern(level) {
  const b = band(level);
  if (b === 0 || (b === 1 && Math.random() < 0.5)) {
    const set = pick(PATTERN_SETS);
    const unit = b === 0 ? set.slice(0, 2 + (level > 10 ? 1 : 0)) : [...set, set[0]];
    const len = unit.length * 2 + 1;
    const seq = []; for (let i = 0; i < len; i++) seq.push(unit[i % unit.length]);
    const ans = unit[len % unit.length];
    return { prompt: 'What comes next?', visual: seq.join(' ') + ' ❓', choices: choicesWith(ans, ['🌸', '⭐', '👑', '💎', '🐉', '🦄', '🍓', '💗', '🌙']), answer: ans };
  }
  let seq, ans;
  const r = Math.random();
  if (b <= 2 && r < 0.5) { const st = rnd(1, 10), step = rnd(2, 5 + b * 2); seq = [0, 1, 2, 3].map(i => st + i * step); ans = st + 4 * step; }
  else if (b <= 2) { const st = rnd(40, 100), step = rnd(2, 10); seq = [0, 1, 2, 3].map(i => st - i * step); ans = st - 4 * step; }
  else if (r < 0.4) { const st = rnd(1, 4), m = pick([2, 3]); seq = [0, 1, 2, 3].map(i => st * Math.pow(m, i)); ans = st * Math.pow(m, 4); }
  else if (r < 0.7) { seq = [1, 1, 2, 3, 5]; const extra = rnd(0, 2); for (let i = 0; i < extra; i++) seq.push(seq[seq.length - 1] + seq[seq.length - 2]); ans = seq[seq.length - 1] + seq[seq.length - 2]; }
  else { const st = rnd(1, 5); seq = [0, 1, 2, 3].map(i => (st + i) * (st + i)); ans = (st + 4) * (st + 4); }
  return { prompt: 'What number comes next?', visual: seq.join(', ') + ', ?', choices: numberChoices(ans, 4), answer: String(ans) };
}

const COUNT_EMOJI = ['🐉', '🦄', '🌸', '👑', '💎', '🧁', '🦋', '⭐', '🐠', '🍓'];
function genCount(level) {
  const b = band(level);
  if (b === 0) {
    const e = pick(COUNT_EMOJI), n = rnd(2, Math.min(15, 5 + level));
    return { prompt: `How many ${e} can you count?`, visual: Array(n).fill(e).join(' '), choices: numberChoices(n), answer: String(n) };
  }
  if (b === 1) {
    if (Math.random() < 0.5) {
      const x = rnd(10, 99), y = rnd(10, 99); if (x === y) return genCount(level);
      return { prompt: 'Which number is bigger?', visual: `${x}   or   ${y}`, choices: shuffle([String(x), String(y)]), answer: String(Math.max(x, y)) };
    }
    const n = rnd(11, 99), tens = Math.floor(n / 10);
    return { prompt: `How many TENS are in ${n}?`, choices: numberChoices(tens), answer: String(tens) };
  }
  if (b === 2) {
    const n = rnd(100, 999); const place = pick(['hundreds', 'tens', 'ones']);
    const v = place === 'hundreds' ? Math.floor(n / 100) : place === 'tens' ? Math.floor(n / 10) % 10 : n % 10;
    return { prompt: `What digit is in the ${place} place of ${n}?`, choices: choicesWith(v, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), answer: String(v) };
  }
  if (b === 3) {
    const n = rnd(1000, 9999), to = pick([10, 100]);
    const ans = Math.round(n / to) * to;
    return { prompt: `Round ${n} to the nearest ${to}`, choices: choicesWith(ans, [ans + to, ans - to, Math.floor(n / to) * to === ans ? ans + to * 2 : Math.floor(n / to) * to]), answer: String(ans) };
  }
  const fr = pick([['1/2', '0.5'], ['1/4', '0.25'], ['3/4', '0.75'], ['1/10', '0.1'], ['2/5', '0.4'], ['1/5', '0.2']]);
  return { prompt: `Which decimal equals ${fr[0]}?`, choices: choicesWith(fr[1], ['0.5', '0.25', '0.75', '0.1', '0.4', '0.2', '1.2', '0.3']), answer: fr[1] };
}

function genRead(level) {
  const b = band(level);
  const r = Math.random();
  if (b === 0 && r < 0.5) {
    const f = pick(FIRST_LETTER);
    return { prompt: `${f[0]}  ${f[1]} starts with which letter?`, choices: choicesWith(f[2], 'ABCDEFGHIJKLMNOPRSTWZ'.split('')), answer: f[2] };
  }
  if (b <= 1 && r < 0.75) {
    const rh = pick(RHYMES);
    return { prompt: `Which word rhymes with "${rh[0]}"?`, choices: choicesWith(rh[1], rh[2]), answer: rh[1] };
  }
  const s = pick(STORIES);
  return { prompt: s.q, story: s.t, choices: choicesWith(s.a, s.d), answer: s.a };
}

function genScience(level) {
  const b = band(level);
  const pool = SCIENCE.filter(s => s.b <= b && s.b >= b - 1);
  const s = pick(pool);
  return { prompt: s.q, choices: choicesWith(s.a, s.d), answer: s.a };
}

function genHeart() {
  const s = pick(HEART);
  return { prompt: s.q, choices: choicesWith(s.a, s.d, 3), answer: s.a };
}

const SHAPES = [['🔺', 'Triangle', 3], ['🟥', 'Square', 4], ['⭐', 'Star', 10], ['⬠', 'Pentagon', 5], ['⬡', 'Hexagon', 6], ['⚪', 'Circle', 0]];
function fmtTime(h, m) { return `${h}:${String(m).padStart(2, '0')}`; }
function genShapesTime(level) {
  const b = band(level);
  const r = Math.random();
  if (b === 0 || (b === 1 && r < 0.4)) {
    const s = pick(SHAPES.filter(x => x[1] !== 'Star'));
    if (Math.random() < 0.5) return { prompt: 'What shape is this?', visual: s[0], choices: choicesWith(s[1], SHAPES.map(x => x[1])), answer: s[1] };
    return { prompt: `How many sides does a ${s[1].toLowerCase()} have?`, visual: s[0], choices: numberChoices(s[2]), answer: String(s[2]) };
  }
  if (b <= 2) {
    const h = rnd(1, 12), m = b === 1 ? pick([0, 30]) : pick([0, 15, 30, 45, 5, 20, 50]);
    const ans = fmtTime(h, m);
    return { prompt: 'What time does the clock show?', clock: { h, m }, choices: choicesWith(ans, [fmtTime(h % 12 + 1, m), fmtTime(h, (m + 30) % 60), fmtTime((h + 10) % 12 + 1, m), fmtTime(m === 0 ? 12 : Math.max(1, Math.floor(m / 5)), h * 5 % 60)]), answer: ans };
  }
  if (r < 0.5) {
    const h = rnd(1, 10), m = pick([0, 15, 30, 45]), add = pick([15, 30, 45, 60, 90]);
    let tm = h * 60 + m + add; const ans = fmtTime(Math.floor(tm / 60) > 12 ? Math.floor(tm / 60) - 12 : Math.floor(tm / 60), tm % 60);
    return { prompt: `The ball starts at ${fmtTime(h, m)}. It lasts ${add} minutes. When does it end?`, choices: choicesWith(ans, [fmtTime(h, m), fmtTime(h + 1, (m + 15) % 60), fmtTime(h + 2, m), fmtTime(h, (m + 45) % 60)]), answer: ans };
  }
  const w = rnd(2, 12), l = rnd(2, 12);
  if (Math.random() < 0.5) return { prompt: `A garden is ${w} m by ${l} m. What is its AREA?`, choices: numberChoices(w * l, 6), answer: String(w * l) };
  return { prompt: `A rectangle is ${w} by ${l}. What is its PERIMETER?`, choices: numberChoices(2 * (w + l), 6), answer: String(2 * (w + l)) };
}

const COINS = [['🟤', 1, 'penny'], ['⚪', 5, 'nickel'], ['🔘', 10, 'dime'], ['🪙', 25, 'quarter']];
function genMoney(level) {
  const b = band(level);
  if (b === 0) {
    const n = rnd(2, 9);
    return { prompt: `Each 🪙 is 1 coin. How many coins in all?`, visual: Array(n).fill('🪙').join(' '), choices: numberChoices(n), answer: String(n) };
  }
  if (b === 1) {
    const items = []; let total = 0;
    for (let i = 0; i < rnd(2, 5); i++) { const c = pick(COINS); items.push(c); total += c[1]; }
    return { prompt: 'Add up the coins! (penny 1¢, nickel 5¢, dime 10¢, quarter 25¢)', visual: items.map(c => c[2]).join(' + '), choices: numberChoices(total, 5).map(x => x + '¢'), answer: total + '¢' };
  }
  if (b === 2) {
    const price = rnd(10, 90), paid = price < 50 ? 50 : 100;
    return { prompt: `A tiara costs ${price}¢. You pay ${paid}¢. How much change?`, choices: numberChoices(paid - price, 5).map(x => x + '¢'), answer: (paid - price) + '¢' };
  }
  const p = rnd(2, 9), q = rnd(2, 6);
  if (Math.random() < 0.5) return { prompt: `Crowns cost $${p} each. How much for ${q} crowns?`, choices: numberChoices(p * q, 5).map(x => '$' + x), answer: '$' + (p * q) };
  const save = rnd(2, 10), goal = save * rnd(3, 9);
  return { prompt: `You save $${save} each week. How many weeks to save $${goal}?`, choices: numberChoices(goal / save), answer: String(goal / save) };
}

// Portal/minigame catalog.
const GAMES = {
  math:    { name: 'Magic Math',       icon: '🔢', color: 0xff69b4, gen: genMath,        subject: 'Math' },
  spell:   { name: 'Spell Castle',     icon: '🔤', color: 0xb388ff, gen: genSpell,       subject: 'Spelling' },
  pattern: { name: 'Pattern Path',     icon: '🌈', color: 0xffb347, gen: genPattern,     subject: 'Patterns' },
  memory:  { name: 'Memory Mirror',    icon: '🪞', color: 0x48dbfb, gen: null,           subject: 'Memory' },
  count:   { name: 'Dragon Count',     icon: '🐉', color: 0x1dd1a1, gen: genCount,       subject: 'Numbers' },
  read:    { name: 'Story Scroll',     icon: '📜', color: 0xff9ff3, gen: genRead,        subject: 'Reading' },
  science: { name: 'Wonder Lab',       icon: '🔬', color: 0x54a0ff, gen: genScience,     subject: 'Science' },
  shapes:  { name: 'Clock & Shapes',   icon: '⏰', color: 0xfeca57, gen: genShapesTime,  subject: 'Shapes & Time' },
  heart:   { name: 'Heart Choices',    icon: '💖', color: 0xff6b9d, gen: genHeart,       subject: 'Kindness' },
  money:   { name: 'Royal Market',     icon: '🪙', color: 0xffd700, gen: genMoney,       subject: 'Money' },
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
