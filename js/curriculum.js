// Curriculum content engine.
// Every skill has metadata (grade, subject, domain, prerequisites, reward weight) and a generator that builds
// fresh activities for a difficulty level 1-5. Activities carry their expected answer, hint, explanation and
// error tags so the learner model can tell *why* something was missed, not just that it was.
// Current catalog: GRADE 1. No multiplication or division anywhere in this grade.
'use strict';

// ---------- small helpers ----------
const R = {
  int: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
  pick: (a) => a[Math.floor(Math.random() * a.length)],
  shuffle: (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  sample: (a, n) => R.shuffle(a).slice(0, n),
};
// Multiple choice: answer + unique distractors, n options total.
function mc(answer, distractors, n = 4) {
  const out = [String(answer)];
  for (const d of R.shuffle(distractors)) { if (out.length >= n) break; const s = String(d); if (!out.includes(s)) out.push(s); }
  return R.shuffle(out);
}
// Number choices near the answer (never negative), with named error tags for common mistakes.
function numMc(ans, near = [], n = 4) {
  const ds = near.filter(v => v >= 0 && v !== ans);
  for (let i = 1; ds.length < 8; i++) { if (ans + i >= 0) ds.push(ans + i); if (ans - i >= 0) ds.push(ans - i); }
  return mc(ans, ds, n);
}
const NAMES1 = ['Mia', 'Leo', 'Ava', 'Sam', 'Zoe', 'Max', 'Lily', 'Ben', 'Ruby', 'Omar', 'Ivy', 'Kai'];
const OBJ = [['🍎', 'apples'], ['⭐', 'stars'], ['🐟', 'fish'], ['🌸', 'flowers'], ['🧁', 'cupcakes'], ['🐞', 'ladybugs'], ['🎈', 'balloons'], ['🍓', 'berries'], ['🐚', 'shells'], ['🔋', 'batteries'], ['💎', 'gems'], ['🦋', 'butterflies']];

// ---------- word banks ----------
const CVC = [['cat', '🐱'], ['dog', '🐶'], ['pig', '🐷'], ['sun', '☀️'], ['hat', '🎩'], ['bat', '🦇'], ['bus', '🚌'], ['cup', '🥤'], ['bed', '🛏️'], ['box', '📦'],
  ['fox', '🦊'], ['hen', '🐔'], ['map', '🗺️'], ['pen', '🖊️'], ['web', '🕸️'], ['bug', '🐛'], ['jet', '✈️'], ['net', '🥅'], ['log', '🪵'], ['pot', '🍲'],
  ['van', '🚐'], ['can', '🥫'], ['bag', '👜'], ['nut', '🥜'], ['pin', '📌'], ['ram', '🐏'], ['rat', '🐀'], ['cap', '🧢'], ['tub', '🛁'], ['ten', '🔟']];
const DIGRAPH = [['ship', '🚢'], ['shell', '🐚'], ['fish', '🐟'], ['chick', '🐥'], ['cheese', '🧀'], ['chair', '🪑'], ['thumb', '👍'], ['bath', '🛁'], ['whale', '🐋'], ['duck', '🦆'], ['sock', '🧦'], ['shoe', '👟']];
const LONGV = [['cake', '🎂'], ['bike', '🚲'], ['kite', '🪁'], ['rose', '🌹'], ['bone', '🦴'], ['home', '🏠'], ['five', '5️⃣'], ['nine', '9️⃣'], ['snake', '🐍'], ['plane', '✈️'], ['smile', '😊'], ['cube', '🧊']];
const FAMILIES = { at: ['cat', 'hat', 'bat', 'rat', 'mat', 'sat'], an: ['can', 'van', 'fan', 'man', 'pan', 'ran'], ig: ['pig', 'wig', 'dig', 'big', 'fig'],
  op: ['top', 'mop', 'hop', 'pop'], ug: ['bug', 'rug', 'hug', 'mug', 'jug'], en: ['hen', 'pen', 'ten', 'men'], ot: ['pot', 'hot', 'dot', 'not'], et: ['jet', 'net', 'wet', 'pet'] };
const RHYME = [['cat', 'hat'], ['dog', 'log'], ['sun', 'run'], ['bug', 'rug'], ['cake', 'lake'], ['star', 'car'], ['bee', 'tree'], ['moon', 'spoon'], ['king', 'ring'],
  ['fish', 'dish'], ['bear', 'chair'], ['light', 'night'], ['goat', 'boat'], ['mouse', 'house'], ['snake', 'rake'], ['frog', 'log'], ['pink', 'sink'], ['ten', 'hen']];
// Dolch sight words by difficulty: pre-primer -> primer -> first grade.
const SIGHT = [
  ['a', 'I', 'is', 'it', 'in', 'me', 'my', 'up', 'we', 'go', 'to', 'see', 'the', 'and', 'can', 'run', 'big', 'red'],
  ['you', 'look', 'play', 'said', 'come', 'down', 'help', 'here', 'jump', 'make', 'not', 'one', 'two', 'blue', 'find', 'for', 'little', 'where', 'yellow', 'funny', 'away', 'three'],
  ['all', 'are', 'at', 'be', 'but', 'did', 'do', 'eat', 'get', 'good', 'have', 'he', 'like', 'no', 'now', 'on', 'out', 'she', 'so', 'that', 'they', 'this', 'too', 'was', 'went', 'what', 'who', 'with', 'yes'],
  ['came', 'into', 'must', 'new', 'our', 'please', 'pretty', 'ride', 'saw', 'say', 'soon', 'there', 'under', 'want', 'well', 'white', 'will', 'brown', 'black', 'four'],
  ['after', 'again', 'any', 'ask', 'by', 'could', 'every', 'from', 'give', 'going', 'had', 'has', 'her', 'him', 'how', 'just', 'know', 'live', 'of', 'once', 'open', 'over', 'put', 'some', 'stop', 'take', 'thank', 'them', 'then', 'think', 'walk', 'were', 'when'],
];
const OPPOSITES = [['big', 'small'], ['hot', 'cold'], ['up', 'down'], ['happy', 'sad'], ['fast', 'slow'], ['open', 'closed'], ['full', 'empty'], ['day', 'night'], ['wet', 'dry'], ['loud', 'quiet'], ['in', 'out'], ['old', 'new'], ['tall', 'short'], ['light', 'dark']];
const SYNONYMS = [['big', 'large'], ['small', 'little'], ['happy', 'glad'], ['fast', 'quick'], ['start', 'begin'], ['shut', 'close'], ['yell', 'shout'], ['look', 'see'], ['scared', 'afraid'], ['sleepy', 'tired']];
const CATEGORIES = { fruit: ['🍎 apple', '🍌 banana', '🍇 grapes', '🍓 strawberry', '🍐 pear'], animal: ['🐶 dog', '🐴 horse', '🐸 frog', '🐘 elephant', '🦁 lion'],
  vehicle: ['🚗 car', '🚌 bus', '🚲 bike', '🚂 train', '✈️ plane'], clothing: ['👕 shirt', '👖 pants', '🧦 socks', '🧥 coat', '👒 hat'], color: ['red', 'blue', 'green', 'yellow', 'purple'] };
const PICTURE_WORDS = [['🐱', 'cat'], ['🌳', 'tree'], ['🏠', 'house'], ['🚗', 'car'], ['🍎', 'apple'], ['📚', 'book'], ['☀️', 'sun'], ['🌙', 'moon'], ['🐟', 'fish'], ['🎈', 'balloon'], ['🦋', 'butterfly'], ['🌧️', 'rain']];

// ---------- stories for comprehension (level = length / complexity) ----------
const STORIES = [
  { lv: 1, title: 'The Red Ball', t: 'Sam has a red ball. Sam and his dog play with it.', who: ['Who plays with the ball?', 'Sam and his dog', ['A cat', 'Mom', 'A bird']], what: ['What color is the ball?', 'Red', ['Blue', 'Green', 'Yellow']], main: ['Sam and his dog play ball', ['Sam goes to sleep', 'A dog eats lunch']] },
  { lv: 1, title: 'Lunch Time', t: 'Mia eats lunch at school. She has an apple and milk.', who: ['Who eats lunch?', 'Mia', ['Leo', 'A teacher', 'A cat']], where: ['Where does Mia eat lunch?', 'At school', ['At the beach', 'In a car', 'At the zoo']], what: ['What does Mia drink?', 'Milk', ['Juice', 'Water', 'Tea']] },
  { lv: 2, title: 'The Little Seed', t: 'Ava planted a seed. She gave it water every day. Soon a flower grew.', who: ['Who planted the seed?', 'Ava', ['Max', 'A bird', 'Grandpa']], what: ['What grew?', 'A flower', ['A tree', 'A carrot', 'A rock']], why: ['Why did the flower grow?', 'Ava gave it water', ['Ava sang to it', 'It was a toy', 'A dog dug it']], seq: ['Ava planted a seed.', 'She gave it water.', 'A flower grew.'], main: ['Ava grows a flower', ['Ava loses her toy', 'Ava rides a bike']] },
  { lv: 2, title: 'Rainy Day', t: 'It rained all day. Leo could not play outside. He built a fort with blankets.', where: ['Where did Leo build the fort?', 'Inside', ['At the park', 'In the rain', 'At school']], why: ['Why did Leo stay inside?', 'It was raining', ['He was sleepy', 'It was dark', 'He was sick']], what: ['What did Leo build?', 'A fort', ['A boat', 'A snowman', 'A car']], seq: ['It started to rain.', 'Leo stayed inside.', 'Leo built a fort.'] },
  { lv: 2, title: 'Puppy Bath', t: 'Zoe gave her puppy a bath. The puppy shook and got Zoe all wet! They both laughed.', who: ['Who got wet?', 'Zoe', ['Dad', 'The cat', 'Nobody']], why: ['Why did Zoe get wet?', 'The puppy shook', ['It rained', 'She fell in a pool', 'She spilled juice']], seq: ['Zoe gave the puppy a bath.', 'The puppy shook.', 'They both laughed.'], main: ['A funny puppy bath', ['A trip to the store', 'A sad day']] },
  { lv: 3, title: 'The Lost Mitten', t: 'In the winter, Kai lost his blue mitten in the snow. His sister helped him look. They found it under a tree.', when: ['When did this story happen?', 'In the winter', ['In the summer', 'At night', 'On a hot day']], where: ['Where was the mitten?', 'Under a tree', ['In a box', 'On a bus', 'In the pool']], who: ['Who helped Kai?', 'His sister', ['His dog', 'His teacher', 'A bird']], why: ['Why did Kai need help?', 'He lost his mitten', ['He was hungry', 'He was late', 'He was cold and wet']], seq: ['Kai lost his mitten.', 'His sister helped him look.', 'They found it under a tree.'], main: ['Finding a lost mitten', ['Building a snowman', 'Making hot cocoa']] },
  { lv: 3, title: 'Baby Bird', t: 'A baby bird fell out of its nest. Ruby told her mom. Mom put the bird back in the nest. The mother bird came back.', who: ['Who did Ruby tell?', 'Her mom', ['Her friend', 'A police officer', 'The bird']], why: ['Why did Ruby tell her mom?', 'A baby bird needed help', ['She wanted a snack', 'She wanted to play', 'She was sleepy']], seq: ['A baby bird fell.', 'Ruby told her mom.', 'Mom put the bird back.'], main: ['Helping a baby bird', ['A trip to the zoo', 'Baking a cake']] },
  { lv: 3, title: 'The Big Race', t: 'Max and Omar ran a race at the park. Omar fell down. Max stopped to help him up. They finished the race together.', where: ['Where was the race?', 'At the park', ['At school', 'At the beach', 'In a gym']], why: ['Why did Max stop running?', 'To help Omar', ['He was tired', 'He saw a dog', 'He lost his shoe']], what: ['How did the race end?', 'They finished together', ['Max won alone', 'Nobody finished', 'Omar went home']], seq: ['The race started.', 'Omar fell down.', 'They finished together.'], main: ['Helping a friend is better than winning', ['Max is the fastest', 'Parks are fun']] },
  { lv: 4, title: 'Space Trip', t: 'Lily dreamed she flew a rocket to the moon. The moon was gray and dusty. She jumped very high because things are lighter there. Then she woke up in her bed.', where: ['Where did Lily go in her dream?', 'To the moon', ['To the sun', 'Under the sea', 'To a farm']], what: ['What color was the moon?', 'Gray', ['Pink', 'Green', 'Blue']], why: ['Why could Lily jump so high?', 'Things are lighter on the moon', ['She had springs on her shoes', 'She was a bird', 'It was windy']], when: ['When did this happen?', 'While she was sleeping', ['At lunch', 'At school', 'In the morning bath']], seq: ['Lily flew a rocket.', 'She jumped on the moon.', 'She woke up in bed.'], main: ['Lily dreams about the moon', ['Lily builds a real rocket', 'Lily goes to school']] },
  { lv: 4, title: 'The Garden Helper', t: 'Grandma has a garden. Every morning Ben helps her pull weeds and water the beans. In the fall they picked a big basket of beans. Ben was proud of his hard work.', who: ['Who has a garden?', 'Grandma', ['Ben', 'A farmer', 'Dad']], when: ['When did they pick the beans?', 'In the fall', ['In the winter', 'At night', 'In the spring']], why: ['Why was Ben proud?', 'He worked hard and the beans grew', ['He won a prize', 'He got a toy', 'He went swimming']], seq: ['Ben pulled weeds.', 'He watered the beans.', 'They picked the beans.'], main: ['Working hard in a garden', ['Going to the store', 'Playing in the snow']] },
  { lv: 5, title: 'The New Kid', t: 'Ivy was new at school and felt shy. At recess she sat alone on a bench. A girl named Zoe asked Ivy to play tag. By the end of the day, Ivy had a new friend and did not feel shy anymore.', who: ['Who asked Ivy to play?', 'Zoe', ['The teacher', 'Her brother', 'Nobody']], where: ['Where did Ivy sit at recess?', 'On a bench', ['In the classroom', 'On a swing', 'In the car']], why: ['Why did Ivy stop feeling shy?', 'She made a new friend', ['She went home', 'She ate lunch', 'She took a nap']], seq: ['Ivy felt shy.', 'Zoe asked her to play.', 'Ivy made a new friend.'], main: ['Making a new friend', ['Learning to read', 'A rainy day']] },
  { lv: 5, title: 'The Missing Cookies', t: 'Mom baked cookies and put them on the table. Later, three cookies were gone! There were crumbs on the floor and the dog had chocolate on his nose. Everyone laughed and gave the dog a dog treat instead.', who: ['Who ate the cookies?', 'The dog', ['Mom', 'The cat', 'Dad']], what: ['How many cookies were gone?', 'Three', ['One', 'Five', 'Ten']], why: ['How did they know the dog did it?', 'He had chocolate on his nose', ['He told them', 'He was sleeping', 'He barked a song']], seq: ['Mom baked cookies.', 'Cookies were gone.', 'They found chocolate on the dog.'], main: ['A dog sneaks cookies', ['Mom buys a new dog', 'A day at the beach']] },
];

// Plain-language explanations for error tags (shown to parents).
const TAG_TEXT = {
  b_d: 'mixes up letters that look alike, such as b and d',
  first_sound: 'sometimes picks a word that shares only the ending sound instead of the first sound',
  blend_middle: 'blends the first and last sounds correctly but sometimes misses the middle vowel sound',
  rhyme_start: 'sometimes chooses a word that starts the same instead of one that rhymes',
  similar_word: 'confuses sight words that look similar (for example "was" and "saw")',
  why_q: 'reads the story correctly but sometimes has difficulty explaining why an event happened',
  when_q: 'sometimes has difficulty finding when a story takes place',
  sequence: 'remembers story events but sometimes puts them in the wrong order',
  main_idea: 'notices details but is still learning to say what a story is mostly about',
  letter_order: 'knows the letters in a word but sometimes writes them in the wrong order',
  vowel: 'sometimes uses the wrong vowel sound when spelling',
  added_instead: 'sometimes adds when the problem asks to subtract',
  subtracted_instead: 'sometimes subtracts when the problem asks to add',
  off_by_one: 'is close but often off by one, which usually means a counting slip',
  tens_ones: 'sometimes reverses tens and ones (for example 41 for 14)',
  compare_flip: 'sometimes flips greater than and less than',
  count_skip: 'sometimes skips or double-counts objects when counting',
  word_problem: 'solves number sentences well but sometimes has trouble deciding what a story problem is asking',
  shape_3d: 'sometimes mixes up flat (2D) and solid (3D) shape names',
  time_hands: 'sometimes mixes up the hour hand and the minute hand',
  coin_value: 'knows coin names but sometimes mixes up how much each coin is worth',
  direction_lr: 'sometimes mixes up directions on a map',
  sentence_order: 'knows the words but is still learning how to put them in sentence order',
};

// ---------- READING / LANGUAGE ARTS ----------
function letterSounds(lv) {
  // "Which letter does 🐶 dog start with?"  Lower levels: very different letters; higher: look-alikes (b/d/p/q).
  const w = R.pick(lv <= 2 ? CVC : [...CVC, ...DIGRAPH.filter(d => !/^(sh|ch|th|wh)/.test(d[0]))]);
  const first = w[0][0];
  const look = { b: ['d', 'p'], d: ['b', 'p'], p: ['b', 'q'], m: ['n', 'w'], n: ['m', 'h'] }[first] || [];
  const ds = lv >= 3 ? [...look, ...'abcdefghjklmnoprstw'.split('')] : 'aeiosrtlmnpcdbfgh'.split('');
  const choices = mc(first, ds.filter(c => c !== first)).map(c => c.toUpperCase());
  const tags = {}; look.forEach(l => tags[l.toUpperCase()] = 'b_d');
  return { type: 'choice', prompt: `${w[1]}  "${w[0]}" starts with which letter?`, say: `Which letter does ${w[0]} start with?`, choices, answer: first.toUpperCase(),
    hint: `Say it slowly: ${w[0][0]}... ${w[0]}. What sound do you hear first?`, explain: `${w[0]} starts with the ${first.toUpperCase()} sound.`, tags, key: 'ls' + w[0] };
}
function blending(lv) {
  // Hear sounds "c - a - t" and pick the picture.
  const bank = lv <= 2 ? CVC : lv <= 4 ? [...CVC, ...DIGRAPH] : [...DIGRAPH, ...LONGV];
  const w = R.pick(bank);
  const segs = w[0].match(/sh|ch|th|wh|ck|[a-z]/g);
  const same = bank.filter(x => x[0] !== w[0] && x[0][0] === w[0][0] && x[0].slice(-1) === w[0].slice(-1));
  const others = R.sample(bank.filter(x => x[0] !== w[0]), 4);
  const pool = [...same, ...others];
  const choices = mc(`${w[1]} ${w[0]}`, pool.map(x => `${x[1]} ${x[0]}`));
  const tags = {}; same.forEach(x => tags[`${x[1]} ${x[0]}`] = 'blend_middle');
  return { type: 'choice', prompt: `Blend the sounds: ${segs.join(' - ')}`, say: `Blend these sounds. ${segs.join('. ')}. What word is it?`, choices, answer: `${w[1]} ${w[0]}`,
    hint: 'Say each sound, then say them faster and faster until they make a word!', explain: `${segs.join('-')} makes "${w[0]}".`, tags, key: 'bl' + w[0], noAutoText: true };
}
function rhyming(lv) {
  const pr = R.pick(RHYME);
  const startSame = [...CVC, ...DIGRAPH, ...LONGV].map(x => x[0]).filter(x => x[0] === pr[0][0] && x !== pr[0] && !x.endsWith(pr[1].slice(-2)));
  const other = R.sample(RHYME.filter(p => p !== pr).map(p => p[0]).filter(x => !x.endsWith(pr[1].slice(-2))), 4);
  const ds = lv >= 3 ? [...startSame.slice(0, 1), ...other] : other;
  const tags = {}; startSame.forEach(s => tags[s] = 'rhyme_start');
  return { type: 'choice', prompt: `Which word rhymes with "${pr[0]}"?`, choices: mc(pr[1], ds, lv <= 1 ? 3 : 4), answer: pr[1],
    hint: `Rhyming words sound the same at the END. ${pr[0]}... listen to the end sound.`, explain: `"${pr[0]}" and "${pr[1]}" both end the same way.`, tags, key: 'rh' + pr[0] };
}
function wordFamilies(lv) {
  const fams = Object.keys(FAMILIES);
  const f = R.pick(fams);
  if (lv <= 2) {
    const w = R.pick(FAMILIES[f]);
    const others = fams.filter(x => x !== f).map(x => R.pick(FAMILIES[x]));
    return { type: 'choice', prompt: `Which word is in the "-${f}" family?`, choices: mc(w, others, 3 + (lv > 1)), answer: w,
      hint: `Look at the end of each word. Which one ends with "${f}"?`, explain: `"${w}" ends with -${f}.`, key: 'wf' + w };
  }
  // Make a new word: change the first letter.
  const w = R.pick(FAMILIES[f]);
  const pic = CVC.find(c => c[0] === w);
  const onset = w.slice(0, w.length - f.length);
  const ds = 'bcdfhjlmnprstw'.split('').filter(c => !FAMILIES[f].includes(c + f));
  return { type: 'choice', prompt: `${pic ? pic[1] + ' ' : ''}Add a letter to make "${w}":  __${f}`, say: `Which letter makes the word ${w}?`, choices: mc(onset, ds).map(c => c.toUpperCase()), answer: onset.toUpperCase(),
    hint: `Say "${w}" slowly. What is the first sound?`, explain: `${onset.toUpperCase()} + ${f} = ${w}`, key: 'wf2' + w };
}
function sightWords(lv) {
  const list = SIGHT[Math.min(4, lv - 1)];
  const w = R.pick(list);
  const all = SIGHT.flat();
  const look = all.filter(x => x !== w && (x.length === w.length && (x[0] === w[0] || x.split('').sort().join('') === w.split('').sort().join(''))));
  const pool = [...look, ...R.sample(list.filter(x => x !== w), 6)];
  const tags = {}; look.forEach(x => tags[x] = 'similar_word');
  return { type: 'choice', prompt: '🔊 Listen, then tap the word you hear!', say: `Find the word: ${w}. ${w}.`, choices: mc(w, pool, lv <= 1 ? 3 : 4), answer: w,
    hint: `Tap 🔊 to hear "${w}" again. Look at the first letter.`, explain: `That word is "${w}".`, tags, key: 'sw' + w, wordChoices: true };
}
function comprehensionWH(lv) {
  const pool = STORIES.filter(s => s.lv <= lv && s.lv >= lv - 2);
  const s = R.pick(pool.length ? pool : STORIES);
  const kinds = ['who', 'what', 'where', 'when', 'why'].filter(k => s[k]);
  const k = lv >= 3 && s.why && Math.random() < 0.4 ? 'why' : R.pick(kinds);
  const [q, a, d] = s[k];
  const tags = {}; d.forEach(x => tags[x] = k === 'why' ? 'why_q' : k === 'when' ? 'when_q' : null);
  return { type: 'choice', story: s.t, storyTitle: s.title, prompt: q, choices: mc(a, d, lv <= 1 ? 3 : 4), answer: a, qtype: k,
    hint: `Read the story again and look for the part that tells ${k.toUpperCase()}.`, explain: `The story says: "${s.t}"`, tags, key: 'wh' + s.title + k, readingAudioOptional: true };
}
function sequencing(lv) {
  const s = R.pick(STORIES.filter(x => x.seq && x.lv <= Math.max(2, lv + 1)));
  return { type: 'order', story: s.t, storyTitle: s.title, prompt: 'Put the story in order: what happened FIRST, NEXT, and LAST?', items: R.shuffle(s.seq), order: s.seq,
    hint: 'Find what happened at the very beginning of the story first.', explain: `First: ${s.seq[0]} Next: ${s.seq[1]} Last: ${s.seq[2]}`, errTag: 'sequence', key: 'sq' + s.title, readingAudioOptional: true };
}
function mainIdea(lv) {
  const s = R.pick(STORIES.filter(x => x.main && x.lv <= Math.max(2, lv + 1)));
  const tags = {}; s.main[1].forEach(x => tags[x] = 'main_idea');
  return { type: 'choice', story: s.t, storyTitle: s.title, prompt: 'What is this story MOSTLY about?', choices: mc(s.main[0], s.main[1], 3), answer: s.main[0],
    hint: 'Think about the whole story, not just one part. What is it all about?', explain: `The story is mostly about: ${s.main[0]}.`, tags, key: 'mi' + s.title, readingAudioOptional: true };
}
function charactersSetting(lv) {
  const s = R.pick(STORIES.filter(x => (x.who || x.where) && x.lv <= Math.max(2, lv + 1)));
  const k = s.where && (Math.random() < 0.5 || !s.who) ? 'where' : 'who';
  const [q, a, d] = s[k];
  return { type: 'choice', story: s.t, storyTitle: s.title, prompt: (k === 'who' ? '👤 Character: ' : '🗺️ Setting: ') + q, choices: mc(a, d, 3 + (lv > 2)), answer: a,
    hint: k === 'who' ? 'Characters are the people or animals in a story.' : 'The setting is WHERE (and when) the story happens.', explain: `${a}.`, key: 'cs' + s.title + k, readingAudioOptional: true };
}
const DIR_SHAPES = [['⭐', 'star'], ['❤️', 'heart'], ['🌙', 'moon'], ['🔵', 'blue circle'], ['🔺', 'triangle'], ['🟩', 'green square']];
function directions(lv) {
  // Read and follow written directions: tap the right item in a row.
  const ord = ['first', 'second', 'third', 'fourth', 'fifth'];
  const row = Array.from({ length: 5 }, () => R.pick(DIR_SHAPES));
  let prompt, idx;
  if (lv <= 1) { const t = R.pick(row); idx = row.indexOf(t); prompt = `Tap the ${t[1]}.`; }
  else if (lv <= 3) { idx = R.int(0, 4); prompt = `Tap the ${ord[idx]} shape.`; }
  else {
    // "Tap the star that is next to the moon" style
    idx = R.int(1, 3); const left = row[idx - 1], me = row[idx];
    const matches = row.map((r, i) => i).filter(i => row[i][1] === me[1] && i > 0 && row[i - 1][1] === left[1]);
    if (matches.length !== 1) return directions(3);
    prompt = `Tap the ${me[1]} that comes right after the ${left[1]}.`;
  }
  if (lv <= 1 && row.filter(r => r[1] === row[idx][1]).length > 1) return directions(lv);   // keep it unambiguous
  return { type: 'target', prompt, cells: row.map(r => r[0]), answerIdx: idx, hint: 'Read every word of the direction. Count from the LEFT.', explain: `The answer was the ${ord[idx]} one.`, key: 'dr' + prompt + row.join(''), noAutoText: true };
}
function vocabulary(lv) {
  const r = Math.random();
  if (lv <= 1 || (lv <= 2 && r < 0.5)) {
    const [e, w] = R.pick(PICTURE_WORDS);
    return { type: 'choice', prompt: `Which word goes with ${e}?`, say: 'Which word matches the picture?', choices: mc(w, PICTURE_WORDS.map(p => p[1]).filter(x => x !== w)), answer: w, hint: 'Say the picture name. Which word starts with that sound?', explain: `${e} is a ${w}.`, key: 'vp' + w, noAutoText: true };
  }
  if (lv <= 3 || r < 0.4) {
    const [a, b] = R.pick(OPPOSITES);
    return { type: 'choice', prompt: `What is the OPPOSITE of "${a}"?`, choices: mc(b, OPPOSITES.map(o => o[1]).filter(x => x !== b)), answer: b, hint: 'Opposites mean completely different things, like up and down.', explain: `The opposite of ${a} is ${b}.`, key: 'vo' + a };
  }
  if (r < 0.7) {
    const cats = Object.keys(CATEGORIES).filter(c => c !== 'color'); const c = R.pick(cats);
    const a = R.pick(CATEGORIES[c]); const ds = cats.filter(x => x !== c).map(x => R.pick(CATEGORIES[x]));
    return { type: 'choice', prompt: `Which one is a kind of ${c.toUpperCase()}?`, choices: mc(a, ds), answer: a, hint: `Think about what a ${c} is.`, explain: `${a} is a ${c}.`, key: 'vc' + a };
  }
  const [a, b] = R.pick(SYNONYMS);
  return { type: 'choice', prompt: `Which word means the SAME as "${a}"?`, choices: mc(b, SYNONYMS.map(s => s[1]).filter(x => x !== b)), answer: b, hint: 'Find the word you could use instead without changing the meaning.', explain: `"${a}" and "${b}" mean almost the same thing.`, key: 'vs' + a };
}
function spelling(lv) {
  const bank = lv <= 2 ? CVC : lv === 3 ? DIGRAPH : lv === 4 ? SIGHT[2].filter(w => w.length >= 3).map(w => [w, '']) : [...LONGV, ...SIGHT[4].filter(w => w.length <= 5).map(w => [w, ''])];
  const [w, e] = R.pick(bank);
  const extra = lv >= 4 ? R.sample('aeioustr'.split('').filter(c => !w.includes(c)), 2) : [];
  return { type: 'build', prompt: `${e ? e + ' ' : ''}Spell the word you hear!`, say: `Spell the word: ${w}.`, word: w, letters: R.shuffle([...w.split(''), ...extra]),
    hint: `Say "${w}" slowly and listen for each sound: ${w.match(/sh|ch|th|wh|ck|[a-z]/g).join(' - ')}.`, explain: `"${w}" is spelled ${w.toUpperCase().split('').join('-')}.`, key: 'sp' + w };
}
const FLUENCY = [
  ['I see a cat.', 'The dog can run.', 'I like the sun.', 'We can go up.'],
  ['The big dog can run fast.', 'I like to play with my cat.', 'Mom and I go to the park.', 'The red bus is big.'],
  ['We like to play in the sun.', 'The little fish swims in the pond.', 'My dad said we can get a pet.', 'She has a pink hat and a blue bag.'],
  ['My mom and I went to the big park.', 'The frog sat on a log by the pond.', 'We saw three ducks swim in the lake.', 'Please help me find my little red ball.'],
  ['The little fox jumped over the log and ran home.', 'After lunch we went outside to play tag with our friends.', 'When it rains, I like to jump in the puddles with my boots.', 'Every night my dad reads me a story before bed.'],
];
function readAloud(lv) {
  const t = R.pick(FLUENCY[lv - 1]);
  return { type: 'read', prompt: 'Read this sentence out loud! 🎤', text: t, hint: 'Point to each word as you read it.', explain: `The sentence says: "${t}"`, key: 'ra' + t, noAutoText: true };
}

// Sentence construction: put the words in order to build a sentence (capital first, period last).
function sentences(lv) {
  const t = R.pick(FLUENCY[Math.min(4, lv - 1)].filter(s => s.split(' ').length <= 3 + lv * 1.5) .concat(lv <= 1 ? ['I see a cat.', 'We can go.', 'I like red.'] : []));
  const words = t.split(' ');
  let items = R.shuffle(words);
  for (let i = 0; i < 5 && items.join(' ') === t; i++) items = R.shuffle(words);
  return { type: 'order', prompt: 'Put the words in order to make a sentence!', items, order: words, hint: 'A sentence starts with a capital letter and ends with a period (.)', explain: `The sentence is: "${t}"`, errTag: 'sentence_order', key: 'sc' + t, noAutoText: true };
}

// ---------- MATH (grade 1: no multiplication) ----------
function counting(lv) {
  if (lv <= 2) {
    const o = R.pick(OBJ), n = lv === 1 ? R.int(3, 10) : R.int(8, 20);
    return { type: 'count', prompt: `How many ${o[1]}? Tap each one to count!`, emoji: o[0], n, choices: numMc(n, [n - 1, n + 1]), answer: String(n),
      hint: 'Tap each one only once. Say a number for every tap!', explain: `There are ${n} ${o[1]}.`, offByOneTag: 'count_skip', key: 'ct' + n + o[0] };
  }
  if (lv === 3) {
    const tens = R.int(2, 5), ones = R.int(0, 9), n = tens * 10 + ones;
    return { type: 'choice', prompt: 'How many in all? (Each bar is 10)', html: tensOnesHTML(tens, ones), choices: numMc(n, [ones * 10 + tens, n + 10, n - 10]), answer: String(n),
      hint: 'Count the bars by tens: 10, 20, 30... then count the ones.', explain: `${tens} tens and ${ones} ones make ${n}.`, tags: { [String(ones * 10 + tens)]: 'tens_ones' }, key: 'ct3' + n };
  }
  if (lv === 4) {
    const s = R.int(20, 110), k = R.int(2, 5), n = s + k;
    return { type: 'choice', prompt: `Start at ${s}. Count on ${k} more. Where do you land?`, choices: numMc(n, [n - 1, n + 1]), answer: String(n), hint: `Say ${s}, then count ${k} more numbers.`, explain: `${s} … ${Array.from({ length: k }, (_, i) => s + i + 1).join(', ')}`, offByOneTag: 'count_skip', key: 'ct4' + s + k };
  }
  const step = R.pick([2, 5, 10]), st = step * R.int(1, 6), seq = [0, 1, 2, 3].map(i => st + i * step), n = st + 4 * step;
  return { type: 'choice', prompt: `Skip count by ${step}s: ${seq.join(', ')}, ?`, choices: numMc(n, [n - step + 1, n + 1, n + step]), answer: String(n), hint: `Add ${step} to the last number.`, explain: `${seq.join(', ')}, ${n}`, key: 'ct5' + st + step };
}
function tensOnesHTML(t, o) {
  return `<div class="tens">${Array.from({ length: t }, () => '<span class="ten-bar">' + '<i></i>'.repeat(10) + '</span>').join('')}<span class="ones">${'<i></i>'.repeat(o)}</span></div>`;
}
function numberOrder(lv) {
  const max = [20, 30, 50, 100, 120][lv - 1];
  const r = Math.random();
  if (lv >= 3 && r < 0.4) {
    const nums = []; while (nums.length < (lv >= 5 ? 4 : 3)) { const v = R.int(1, max); if (!nums.includes(v)) nums.push(v); }
    const sorted = [...nums].sort((a, b) => a - b);
    return { type: 'order', prompt: 'Put the numbers in order from SMALLEST to BIGGEST.', items: nums.map(String), order: sorted.map(String), hint: 'Find the smallest number first. Look at the tens!', explain: sorted.join(', '), errTag: 'tens_ones', key: 'no' + nums.join() };
  }
  const n = R.int(2, max - 1);
  const kind = r < 0.7 ? R.pick(['after', 'before']) : 'between';
  const ans = kind === 'after' ? n + 1 : kind === 'before' ? n - 1 : n;
  const prompt = kind === 'between' ? `What number comes BETWEEN ${n - 1} and ${n + 1}?` : `What number comes just ${kind.toUpperCase()} ${n}?`;
  return { type: 'choice', prompt, choices: numMc(ans, [kind === 'after' ? n - 1 : n + 1, ans + 10, ans - 10]), answer: String(ans), hint: kind === 'before' ? 'Count backward one.' : 'Count forward one.', explain: `${n - 1}, ${n}, ${n + 1}`, offByOneTag: 'off_by_one', key: 'no' + kind + n };
}
function compareNumbers(lv) {
  const max = [10, 20, 50, 100, 120][lv - 1];
  let a = R.int(1, max), b = R.int(1, max); while (b === a) b = R.int(1, max);
  if (lv <= 2) {
    const big = Math.random() < 0.5;
    return { type: 'choice', prompt: `Which number is ${big ? 'GREATER (bigger)' : 'LESS (smaller)'}?`, choices: R.shuffle([String(a), String(b)]), answer: String(big ? Math.max(a, b) : Math.min(a, b)),
      tags: { [String(big ? Math.min(a, b) : Math.max(a, b))]: 'compare_flip' }, hint: 'Picture them on a number line. Bigger numbers are farther along.', explain: `${Math.max(a, b)} is greater than ${Math.min(a, b)}.`, key: 'cm' + a + b };
  }
  if (lv >= 4 && Math.random() < 0.25) b = a;
  const sym = a > b ? '>' : a < b ? '<' : '=';
  const tags = {}; if (sym !== '=') tags[sym === '>' ? '<' : '>'] = 'compare_flip';
  return { type: 'choice', prompt: `${a}  ?  ${b}`, say: `Which sign goes between ${a} and ${b}?`, visual: '🐊 The alligator mouth eats the BIGGER number!', choices: ['<', '>', '='], answer: sym, tags,
    hint: 'The open mouth faces the bigger number.', explain: `${a} ${sym} ${b}`, key: 'cm3' + a + b };
}
function placeValue(lv) {
  if (lv <= 3) {
    const t = lv === 1 ? 1 : R.int(1, 9), o = R.int(0, 9), n = t * 10 + o;
    const asNum = Math.random() < 0.5;
    if (asNum) return { type: 'choice', prompt: `${t} ten${t > 1 ? 's' : ''} and ${o} ones make what number?`, html: lv <= 2 ? tensOnesHTML(t, o) : '', choices: numMc(n, [o * 10 + t, t + o, n + 10]), answer: String(n), tags: { [String(o * 10 + t)]: 'tens_ones' }, hint: 'The tens digit goes first, then the ones.', explain: `${t} tens + ${o} ones = ${n}`, key: 'pv' + n };
    const askT = Math.random() < 0.5;
    return { type: 'choice', prompt: `How many ${askT ? 'TENS' : 'ONES'} are in ${n}?`, choices: numMc(askT ? t : o, [askT ? o : t]), answer: String(askT ? t : o), tags: { [String(askT ? o : t)]: 'tens_ones' }, hint: `In ${n}, the left digit is the tens and the right digit is the ones.`, explain: `${n} = ${t} tens and ${o} ones.`, key: 'pvq' + n + askT };
  }
  const n = R.int(lv === 4 ? 10 : 20, 89), more = lv === 4 || Math.random() < 0.5, ans = more ? n + 10 : n - 10;
  return { type: 'choice', prompt: `What is 10 ${more ? 'MORE' : 'LESS'} than ${n}?`, choices: numMc(ans, [more ? n + 1 : n - 1, more ? n - 10 : n + 10]), answer: String(ans), tags: { [String(more ? n + 1 : n - 1)]: 'tens_ones' }, hint: 'Only the tens digit changes!', explain: `${n} ${more ? '+' : '−'} 10 = ${ans}`, key: 'pv10' + n + more };
}
function missingNumber(lv) {
  const step = lv <= 2 ? 1 : lv === 3 ? R.pick([1, 2]) : R.pick([1, 5, 10]);
  const st = R.int(lv <= 1 ? 0 : 5, lv <= 2 ? 15 : 80);
  const seq = [0, 1, 2, 3, 4].map(i => st + i * step);
  const miss = R.int(1, 3);
  const shown = seq.map((v, i) => (i === miss ? '__' : v)).join(',  ');
  return { type: 'choice', prompt: `Which number is missing?  ${shown}`, choices: numMc(seq[miss], [seq[miss] + 1, seq[miss] - 1]), answer: String(seq[miss]), hint: `Look at how much the numbers go up each time.`, explain: seq.join(', '), offByOneTag: 'off_by_one', key: 'mn' + st + step + miss };
}
function numberBonds(lv) {
  const whole = lv === 1 ? 5 : lv <= 3 ? 10 : R.int(11, 20);
  const part = R.int(lv <= 3 ? 0 : whole - 10, whole), other = whole - part;
  return { type: 'choice', prompt: `${part} and ? make ${whole}`, html: `<div class="bond"><b>${whole}</b><span>${part}</span><span>?</span></div>`, choices: numMc(other, [whole + part, other + 1, other - 1]), answer: String(other),
    tags: { [String(whole + part)]: 'added_instead' }, hint: `Start at ${part} and count up to ${whole}.`, explain: `${part} + ${other} = ${whole}`, key: 'nb' + whole + part };
}
function wordProblem(op, lv) {
  const nm = R.pick(NAMES1), nm2 = R.pick(NAMES1.filter(x => x !== nm)), o = R.pick(OBJ);
  const max = lv <= 4 ? 10 : 20;
  if (op === '+') {
    const a = R.int(2, max - 3), b = R.int(1, Math.min(9, max - a)); const ans = a + b;
    const t = R.pick([
      `${nm} has ${a} ${o[1]}. ${nm} finds ${b} more. How many ${o[1]} now?`,
      `${a} ${o[1]} are in a box. ${b} more are put in. How many ${o[1]} are in the box?`,
      `You need ${ans} ${o[1]}. You have ${a}. How many more do you need?`]);
    const missing = t.startsWith('You need');
    const a2 = missing ? b : ans;
    return { prompt: t, choices: numMc(a2, [missing ? ans + a : Math.abs(a - b), a2 + 1, a2 - 1]), answer: String(a2), tags: { [String(missing ? ans + a : Math.abs(a - b))]: missing ? 'added_instead' : 'word_problem' }, hint: missing ? `Start at ${a} and count up to ${ans}.` : 'Putting together means ADD.', explain: missing ? `${a} + ${b} = ${ans}, so you need ${b} more.` : `${a} + ${b} = ${ans}`, key: 'wp+' + t };
  }
  const a = R.int(5, max), b = R.int(1, a - 1); const ans = a - b;
  const compare = lv >= 5 && Math.random() < 0.4;
  const t = compare ? `${nm} has ${a} ${o[1]}. ${nm2} has ${b}. How many MORE does ${nm} have?` : R.pick([
    `${nm} has ${a} ${o[1]}. ${nm} gives ${b} away. How many are left?`,
    `There are ${a} ${o[1]}. ${b} fly away. How many are still here?`]);
  return { prompt: t, choices: numMc(ans, [a + b, ans + 1, ans - 1]), answer: String(ans), tags: { [String(a + b)]: 'added_instead' }, hint: compare ? `Match them up. How many does ${nm} have that ${nm2} doesn't?` : 'Taking away means SUBTRACT.', explain: `${a} − ${b} = ${ans}`, key: 'wp-' + t };
}
function addition(lv) {
  if (lv >= 5 || (lv === 4 && Math.random() < 0.4)) return Object.assign({ type: 'choice', isWord: true }, wordProblem('+', lv));
  let a, b, c = 0;
  if (lv === 1) { a = R.int(0, 4); b = R.int(0, 5 - a); }
  else if (lv === 2) { a = R.int(1, 9); b = R.int(0, 10 - a); }
  else if (lv === 3) { a = R.int(2, 10); b = R.int(1, Math.min(10, 20 - a)); }
  else { a = R.int(1, 7); b = R.int(1, 7); c = R.int(1, Math.min(6, 20 - a - b)); }
  const ans = a + b + c;
  const prompt = c ? `${a} + ${b} + ${c} = ?` : `${a} + ${b} = ?`;
  const item = { type: 'choice', prompt, choices: numMc(ans, [Math.abs(a - b), ans + 1, ans - 1]), answer: String(ans), tags: { [String(Math.abs(a - b))]: 'subtracted_instead' },
    hint: c ? `Add two numbers first, then add the last one. Try making 10!` : `Start at ${Math.max(a, b)} and count up ${Math.min(a, b)}.`, explain: `${prompt.replace('?', ans)}`, offByOneTag: 'off_by_one', key: 'ad' + prompt };
  if (lv <= 2) item.html = pictureSum(a, b, '+');
  return item;
}
function subtraction(lv) {
  if (lv >= 4 && Math.random() < 0.5) return Object.assign({ type: 'choice', isWord: true }, wordProblem('-', lv));
  let a, b;
  if (lv === 1) { a = R.int(2, 5); b = R.int(0, a); }
  else if (lv === 2) { a = R.int(3, 10); b = R.int(1, a); }
  else if (lv === 3) { a = R.int(10, 20); b = R.int(1, a - 1 > 10 ? 10 : a - 1); }
  else if (lv === 4) { a = R.int(10, 20); b = R.int(2, 10); }
  else {
    if (Math.random() < 0.5) { const t = R.int(3, 9), s = R.int(1, t - 1); return { type: 'choice', prompt: `${t}0 − ${s}0 = ?`, choices: numMc((t - s) * 10, [(t + s) * 10, (t - s) * 10 + 10, (t - s)]), answer: String((t - s) * 10), tags: { [String((t + s) * 10)]: 'added_instead' }, hint: `Think: ${t} tens take away ${s} tens.`, explain: `${t * 10} − ${s * 10} = ${(t - s) * 10}`, key: 'sb10' + t + s }; }
    a = R.int(11, 20); b = R.int(2, 9); const ans = a - b;
    return { type: 'choice', prompt: `${a} − ? = ${ans}`, choices: numMc(b, [a + ans, b + 1, b - 1]), answer: String(b), hint: `How many do you take from ${a} to get ${ans}?`, explain: `${a} − ${b} = ${ans}`, key: 'sbm' + a + b };
  }
  const ans = a - b, prompt = `${a} − ${b} = ?`;
  const item = { type: 'choice', prompt, say: `${a} minus ${b}`, choices: numMc(ans, [a + b, ans + 1, ans - 1]), answer: String(ans), tags: { [String(a + b)]: 'added_instead' },
    hint: `Start at ${a} and count back ${b}.`, explain: `${a} − ${b} = ${ans}`, offByOneTag: 'off_by_one', key: 'sb' + prompt };
  if (lv <= 2) item.html = pictureSum(a, b, '-');
  return item;
}
function pictureSum(a, b, op) {
  const e = R.pick(['🍎', '⭐', '🐟', '🌸', '🧁']);
  if (op === '+') return `<div class="picsum">${e.repeat(a)} <b>+</b> ${e.repeat(b)}</div>`;
  // take-away picture: the ones being taken away are crossed out
  return `<div class="picsum">${e.repeat(a - b)}${Array.from({ length: b }, () => `<s>${e}</s>`).join('')}</div>`;
}
const SHAPES2D = [['circle', 0, '<circle cx="50" cy="50" r="40"/>'], ['triangle', 3, '<polygon points="50,8 92,88 8,88"/>'], ['square', 4, '<rect x="12" y="12" width="76" height="76"/>'],
  ['rectangle', 4, '<rect x="6" y="25" width="88" height="50"/>'], ['hexagon', 6, '<polygon points="28,8 72,8 94,50 72,92 28,92 6,50"/>'], ['trapezoid', 4, '<polygon points="28,20 72,20 94,80 6,80"/>']];
const SHAPES3D = [['cube', '🧊'], ['sphere', '⚽'], ['cone', '🍦'], ['cylinder', '🥫']];
const svgShape = (inner, fill = '#ff8ad8') => `<svg viewBox="0 0 100 100" class="shape-svg" fill="${fill}" stroke="#c2185b" stroke-width="3">${inner}</svg>`;
function shapes(lv) {
  if (lv <= 1) { const s = R.pick(SHAPES2D.slice(0, 4)); return { type: 'choice', prompt: 'What shape is this?', html: svgShape(s[2]), choices: mc(s[0], SHAPES2D.slice(0, 4).map(x => x[0]).filter(x => x !== s[0])), answer: s[0], hint: 'Count the sides and corners.', explain: `That is a ${s[0]}.`, key: 'sh1' + s[0] }; }
  if (lv === 2) { const s = R.pick(SHAPES2D.filter(x => x[1])); return { type: 'choice', prompt: `How many SIDES does this ${s[0]} have?`, html: svgShape(s[2]), choices: numMc(s[1]), answer: String(s[1]), hint: 'Touch each straight side as you count.', explain: `A ${s[0]} has ${s[1]} sides.`, offByOneTag: 'count_skip', key: 'sh2' + s[0] }; }
  if (lv === 3) { const s = R.pick(SHAPES3D); const tags = {}; ['circle', 'square', 'triangle'].forEach(t => tags[t] = 'shape_3d'); return { type: 'choice', prompt: `${s[1]} This is shaped like a…`, choices: mc(s[0], [...SHAPES3D.map(x => x[0]), 'circle', 'square'].filter(x => x !== s[0])), answer: s[0], tags, hint: 'Solid shapes are not flat. A ball is a sphere!', explain: `${s[1]} is shaped like a ${s[0]}.`, key: 'sh3' + s[0] }; }
  if (lv === 4) {
    // equal shares: halves and fourths
    const parts = R.pick([2, 4]);
    const name = parts === 2 ? 'halves' : 'fourths';
    const eq2 = '<rect x="10" y="10" width="80" height="80"/><line x1="50" y1="10" x2="50" y2="90"/>';
    const eq4 = '<rect x="10" y="10" width="80" height="80"/><line x1="50" y1="10" x2="50" y2="90"/><line x1="10" y1="50" x2="90" y2="50"/>';
    const uneq = '<rect x="10" y="10" width="80" height="80"/><line x1="30" y1="10" x2="30" y2="90"/>';
    const three = '<rect x="10" y="10" width="80" height="80"/><line x1="37" y1="10" x2="37" y2="90"/><line x1="63" y1="10" x2="63" y2="90"/>';
    const opts = { A: parts === 2 ? eq2 : eq4, B: parts === 2 ? uneq : three, C: parts === 2 ? three : eq2 };
    const keys = R.shuffle(['A', 'B', 'C']);
    return { type: 'choice', prompt: `Which square is cut into ${name} (${parts} EQUAL parts)?`, choices: keys, choiceHtml: keys.map(k => svgShape(opts[k], '#ffe0f0')), answer: 'A', hint: 'Equal parts are all the same size.', explain: `${name.charAt(0).toUpperCase() + name.slice(1)} means ${parts} equal parts.`, key: 'sh4' + parts };
  }
  const combos = [['2 triangles', 'square'], ['2 squares', 'rectangle'], ['6 triangles', 'hexagon']];
  const [p, a] = R.pick(combos);
  return { type: 'choice', prompt: `Put ${p} together. What new shape can you make?`, choices: mc(a, ['circle', 'square', 'rectangle', 'hexagon', 'triangle'].filter(x => x !== a)), answer: a, hint: 'Imagine sliding the shapes together edge to edge.', explain: `${p} can make a ${a}.`, key: 'sh5' + a };
}
const PAT_SETS = [['🔴', '🔵'], ['⭐', '🌙'], ['🍎', '🍌'], ['🐶', '🐱'], ['💗', '💜', '💙'], ['🟥', '🟨', '🟩']];
function patterns(lv) {
  if (lv <= 4) {
    const set = R.pick(PAT_SETS);
    const unit = lv <= 1 ? [set[0], set[1]] : lv === 2 ? [set[0], set[0], set[1]] : lv === 3 ? [set[0], set[1], set[1]] : [set[0], set[1], set[2] || '🟢'];
    const len = unit.length * 2 + R.int(0, unit.length - 1);
    const seq = Array.from({ length: len }, (_, i) => unit[i % unit.length]);
    const ans = unit[len % unit.length];
    return { type: 'choice', prompt: 'What comes next in the pattern?', visual: seq.join(' ') + ' ❓', choices: mc(ans, [...new Set([...unit, ...set, '🟢'])].filter(x => x !== ans), 3), answer: ans, hint: 'Say the pattern out loud. What part repeats?', explain: `The pattern repeats: ${unit.join(' ')}`, key: 'pt' + seq.join('') };
  }
  const step = R.pick([1, 2, 5, 10]), st = R.int(1, 30), seq = [0, 1, 2, 3].map(i => st + i * step), ans = st + 4 * step;
  return { type: 'choice', prompt: `What comes next?  ${seq.join(', ')}, ?`, choices: numMc(ans, [ans + 1, ans - 1, ans + step]), answer: String(ans), hint: 'How much bigger is each number?', explain: `Each time it goes up by ${step}.`, key: 'pt5' + st + step };
}
function lengthSkill(lv) {
  const things = [['✏️', 'pencil'], ['🐍', 'snake'], ['🖍️', 'crayon'], ['🥖', 'bread'], ['🪱', 'worm']];
  if (lv <= 2) {
    const [a, b] = R.sample(things, 2), la = R.int(2, 9); let lb = R.int(2, 9); while (lb === la) lb = R.int(2, 9);
    const longer = Math.random() < 0.5;
    const ans = (longer ? la > lb : la < lb) ? a[1] : b[1];
    return { type: 'choice', prompt: `Which is ${longer ? 'LONGER' : 'SHORTER'}?`, html: `<div class="lenbars"><div>${a[0]} <span style="width:${la * 26}px"></span> ${a[1]}</div><div>${b[0]} <span style="width:${lb * 26}px"></span> ${b[1]}</div></div>`,
      choices: R.shuffle([a[1], b[1]]), answer: ans, tags: { [ans === a[1] ? b[1] : a[1]]: 'compare_flip' }, hint: 'Line them up at the start. Which one goes farther?', explain: `The ${ans} is ${longer ? 'longer' : 'shorter'}.`, key: 'ln' + a[1] + b[1] + la + lb };
  }
  if (lv === 3) {
    const t = R.pick(things), n = R.int(3, 9);
    return { type: 'choice', prompt: `How many cubes long is the ${t[1]}?`, html: `<div class="cubes">${t[0]}<br>${'<i></i>'.repeat(n)}</div>`, choices: numMc(n), answer: String(n), hint: 'Count each cube under it.', explain: `It is ${n} cubes long.`, offByOneTag: 'count_skip', key: 'ln3' + t[1] + n };
  }
  const ls = R.sample([3, 4, 5, 6, 7, 8, 9], 3), ts = R.sample(things, 3);
  const items = ts.map((t, i) => `${t[0]} ${t[1]} (${ls[i]})`);
  const order = [...items].sort((x, y) => +x.match(/\((\d+)\)/)[1] - +y.match(/\((\d+)\)/)[1]);
  return { type: 'order', prompt: 'Put them in order from SHORTEST to LONGEST.', html: `<div class="lenbars">${ts.map((t, i) => `<div>${t[0]} <span style="width:${ls[i] * 24}px"></span> ${t[1]}</div>`).join('')}</div>`, items: R.shuffle(items), order, hint: 'Find the shortest one first.', explain: order.join(' → '), errTag: 'compare_flip', key: 'ln4' + ls.join() };
}
function timeSkill(lv) {
  const h = R.int(1, 12), m = lv <= 3 ? 0 : 30;
  const fmt = (hh, mm) => `${hh}:${String(mm).padStart(2, '0')}`;
  const ans = fmt(h, m);
  const swap = m === 0 ? fmt(12, h * 5 % 60) : fmt(6, h * 5 % 60);
  const ds = [fmt(h % 12 + 1, m), fmt(h === 1 ? 12 : h - 1, m), fmt(h, m === 0 ? 30 : 0), swap];
  const tags = { [swap]: 'time_hands' };
  if (lv <= 2) return { type: 'choice', prompt: `It is ${h} o'clock. Which clock shows ${h} o'clock?`, say: `Find ${h} o'clock.`, choices: mc(ans, ds.slice(0, 3), 3), choiceClock: true, answer: ans, hint: 'The SHORT hand points to the hour. The long hand points straight up to 12.', explain: `At ${h} o'clock the short hand is on ${h}.`, key: 'tm' + h + m };
  return { type: 'choice', prompt: 'What time is it?', clock: { h, m }, choices: mc(ans, ds), answer: ans, tags, hint: m === 0 ? 'The short hand shows the hour. The long hand on 12 means "o\'clock".' : 'Long hand on 6 means half past.', explain: m === 0 ? `It is ${h} o'clock.` : `It is half past ${h}.`, key: 'tm' + h + m };
}
const COINS1 = [['penny', 1, '#c97b4a'], ['nickel', 5, '#b8b8c0'], ['dime', 10, '#d0d0d8'], ['quarter', 25, '#c0c0c8']];
const coinHTML = (c) => `<span class="coin coin-${c[0]}" style="background:${c[2]}">${c[1]}¢</span>`;
function money(lv) {
  if (lv <= 1) { const c = R.pick(COINS1); return { type: 'choice', prompt: 'What is the name of this coin?', html: `<span class="coin big coin-${c[0]}" style="background:${c[2]}">${c[0] === 'penny' ? '🌰' : c[0] === 'quarter' ? '🦅' : c[0] === 'nickel' ? '🏛️' : '🔦'}</span><p class="muted">${c[0] === 'penny' ? 'copper colored' : c[0] === 'dime' ? 'the smallest silver coin' : c[0] === 'quarter' ? 'the biggest silver coin' : 'a thick silver coin'}</p>`, choices: mc(c[0], COINS1.map(x => x[0]).filter(x => x !== c[0])), answer: c[0], hint: 'Pennies are copper. Dimes are the smallest silver coin. Quarters are the biggest.', explain: `That is a ${c[0]}.`, key: 'mo1' + c[0] }; }
  if (lv === 2) { const c = R.pick(COINS1); const tags = {}; COINS1.forEach(x => { if (x !== c) tags[x[1] + '¢'] = 'coin_value'; }); return { type: 'choice', prompt: `How much is a ${c[0]} worth?`, choices: mc(c[1] + '¢', COINS1.map(x => x[1] + '¢').filter(x => x !== c[1] + '¢')), answer: c[1] + '¢', tags, hint: 'Penny 1¢, nickel 5¢, dime 10¢, quarter 25¢.', explain: `A ${c[0]} is worth ${c[1]} cents.`, key: 'mo2' + c[0] }; }
  const pool = lv === 3 ? [COINS1[0], COINS1[2]] : lv === 4 ? COINS1.slice(0, 3) : COINS1;
  const coins = []; let tot = 0;
  for (let i = 0, n = R.int(2, lv === 3 ? 5 : 5); i < n; i++) { const c = R.pick(pool); if (tot + c[1] > (lv >= 5 ? 75 : 50)) break; coins.push(c); tot += c[1]; }
  coins.sort((a, b) => b[1] - a[1]);
  const wrongCount = coins.length;
  if (lv >= 5 && Math.random() < 0.4) {
    const price = R.int(5, 70);
    const ans = tot >= price ? 'Yes' : 'No';
    return { type: 'choice', prompt: `A sticker costs ${price}¢. Do you have enough?`, html: `<div class="coins">${coins.map(coinHTML).join('')}</div>`, choices: ['Yes', 'No'], answer: ans, hint: 'Count your money starting with the biggest coin.', explain: `You have ${tot}¢. ${ans === 'Yes' ? 'That is enough!' : 'That is not enough.'}`, key: 'mo5' + tot + price };
  }
  return { type: 'choice', prompt: 'How much money is this?', html: `<div class="coins">${coins.map(coinHTML).join('')}</div>`, choices: numMc(tot, [wrongCount, tot + 5, tot - 5]).map(x => x + '¢'), answer: tot + '¢', tags: { [wrongCount + '¢']: 'coin_value' }, hint: 'Start with the biggest coin, then count on.', explain: `${coins.map(c => c[1] + '¢').join(' + ')} = ${tot}¢`, key: 'mo' + coins.map(c => c[1]).join() };
}
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function calendar(lv) {
  if (lv <= 3) { const i = R.int(0, 6), after = Math.random() < 0.6; const ans = DAYS[(i + (after ? 1 : 6)) % 7]; return { type: 'choice', prompt: `What day comes ${after ? 'AFTER' : 'BEFORE'} ${DAYS[i]}?`, choices: mc(ans, DAYS.filter(d => d !== ans && d !== DAYS[i])), answer: ans, hint: 'Sing the days of the week song!', explain: DAYS.join(', '), key: 'cl' + i + after }; }
  const i = R.int(0, 11), ans = MONTHS[(i + 1) % 12];
  return { type: 'choice', prompt: `What month comes after ${MONTHS[i]}?`, choices: mc(ans, MONTHS.filter(m => m !== ans && m !== MONTHS[i])), answer: ans, hint: 'There are 12 months. January is first.', explain: `${MONTHS[i]}, then ${ans}.`, key: 'cm' + i };
}

// ---------- SCIENCE ----------
// Banks of [question, answer, distractors, minLevel]. Experiments are separate interactive activities.
const SCI = {
  plants: [['What do plants need to grow?', 'Sun, water and air', ['Candy', 'Toys', 'Darkness'], 1], ['Which part of a plant drinks water from the soil?', 'Roots', ['Petals', 'Flowers', 'Seeds'], 2], ['What grows into a new plant?', 'A seed', ['A rock', 'A leaf', 'A shell'], 1], ['Leaves use sunlight to make…', 'Food for the plant', ['Rain', 'Music', 'Rocks'], 4], ['What happens to a plant with no water?', 'It wilts and dries up', ['It grows faster', 'It turns blue', 'It sings'], 2]],
  animals: [['Where does a fish live?', 'In water', ['In a tree', 'In the desert', 'In the sky'], 1], ['Which animal lives in the Arctic?', 'Polar bear', ['Camel', 'Monkey', 'Lion'], 2], ['A baby frog is called a…', 'Tadpole', ['Puppy', 'Kitten', 'Calf'], 2], ['What covers a bird\'s body?', 'Feathers', ['Scales', 'Fur', 'Shells'], 1], ['Where does a camel live?', 'The desert', ['The ocean', 'The Arctic', 'A pond'], 3], ['Which animal has scales?', 'Fish', ['Dog', 'Bird', 'Cow'], 2], ['A caterpillar turns into a…', 'Butterfly', ['Bee', 'Bird', 'Frog'], 3], ['Animals that sleep all winter…', 'Hibernate', ['Migrate', 'Swim', 'Sing'], 5]],
  weather: [['What do you wear when it is snowing?', 'A warm coat', ['A swimsuit', 'Sandals', 'Shorts'], 1], ['Which season is the coldest?', 'Winter', ['Summer', 'Spring', 'Fall'], 1], ['When do leaves change color and fall?', 'Fall (autumn)', ['Summer', 'Spring', 'Winter'], 2], ['What tool tells how hot or cold it is?', 'Thermometer', ['Ruler', 'Clock', 'Scale'], 3], ['What comes after spring?', 'Summer', ['Winter', 'Fall', 'Spring'], 2], ['Rain, snow and hail fall from…', 'Clouds', ['Trees', 'The ground', 'The sun'], 3]],
  space: [['What gives Earth light and heat?', 'The Sun', ['The Moon', 'A lamp', 'Clouds'], 1], ['When can we usually see the Moon and stars?', 'At night', ['At lunch', 'Only in summer', 'Never'], 1], ['The Sun is a…', 'Star', ['Planet', 'Moon', 'Cloud'], 3], ['Why does the Sun seem to move across the sky?', 'Earth is spinning', ['The Sun is walking', 'Wind pushes it', 'Clouds carry it'], 5], ['What do we live on?', 'Planet Earth', ['The Moon', 'The Sun', 'A star'], 1], ['The shape of the Moon looks different because…', 'We see different amounts of its lit side', ['It breaks', 'Clouds eat it', 'It melts'], 5]],
  body: [['Which body part do you use to smell?', 'Nose', ['Ears', 'Eyes', 'Hands'], 1], ['How many senses do we have?', '5', ['3', '10', '2'], 2], ['You hear with your…', 'Ears', ['Nose', 'Feet', 'Eyes'], 1], ['Which sense tells you a stove is hot?', 'Touch', ['Taste', 'Hearing', 'Smell'], 2], ['What pumps blood through your body?', 'Heart', ['Lungs', 'Stomach', 'Bones'], 4], ['What helps you breathe?', 'Lungs', ['Heart', 'Teeth', 'Hair'], 4], ['Bones help your body…', 'Stand and move', ['See', 'Hear', 'Taste'], 3]],
  living: [['Which one is a LIVING thing?', '🌳 Tree', ['🪨 Rock', '🧸 Teddy bear', '🚗 Car'], 1], ['Which one is NOT living?', '🪨 Rock', ['🐶 Dog', '🌻 Flower', '🐟 Fish'], 1], ['Living things need…', 'Food, water and air', ['Batteries', 'Paint', 'Wheels'], 2], ['Do living things grow and change?', 'Yes', ['No', 'Only toys do', 'Only rocks do'], 2]],
  matter: [['Which one is a SOLID?', '🧱 Brick', ['💧 Water', '💨 Air', '🥛 Milk'], 2], ['What happens to ice in the sun?', 'It melts into water', ['It gets bigger', 'It turns to rock', 'It stays the same'], 1], ['Water that freezes becomes…', 'Ice', ['Steam', 'Sand', 'Juice'], 2], ['Which is a LIQUID?', '🧃 Juice', ['🪨 Rock', '🧸 Teddy', '🪵 Wood'], 3], ['A raincoat is made of something that is…', 'Waterproof', ['Soft as a pillow', 'See-through', 'Sticky'], 4]],
  forces: [['To open a door you PULL or…', 'Push', ['Melt', 'Freeze', 'Sing'], 1], ['A ball rolls farther on…', 'A smooth floor', ['Thick grass', 'Sand', 'Mud'], 3], ['What makes a swing go higher?', 'A bigger push', ['A smaller push', 'No push', 'Rain'], 2], ['What pulls things down to the ground?', 'Gravity', ['Wind', 'Magnets', 'Light'], 5]],
  environment: [['How can we help the Earth?', 'Recycle and not litter', ['Leave trash outside', 'Waste water', 'Break trees'], 1], ['Where do you put an empty plastic bottle?', '♻️ Recycling bin', ['🌳 In a tree', '🌊 The ocean', '🛏️ Under the bed'], 1], ['Turning off lights saves…', 'Energy', ['Water', 'Toys', 'Food'], 3]],
};
function scienceSkill(topic) {
  return (lv) => {
    const bank = SCI[topic].filter(q => q[3] <= lv);
    const q = R.pick(bank.length ? bank : SCI[topic]);
    return { type: 'choice', prompt: q[0], choices: mc(q[1], q[2], lv <= 1 ? 3 : 4), answer: q[1], hint: 'Think about what you have seen in real life.', explain: `${q[1]}.`, key: 'sci' + q[0] };
  };
}
const SORTS = {
  living: { bins: [['living', '🌱 Living'], ['non', '🪨 Not living']], items: [['🐶', 'dog', 'living'], ['🌳', 'tree', 'living'], ['🐟', 'fish', 'living'], ['🌻', 'flower', 'living'], ['🐦', 'bird', 'living'], ['🪨', 'rock', 'non'], ['🧸', 'teddy', 'non'], ['🚗', 'car', 'non'], ['✏️', 'pencil', 'non'], ['⚽', 'ball', 'non']] },
  pastpresent: { bins: [['past', '🕰️ Long ago'], ['now', '📱 Today']], items: [['🕯️', 'candle light', 'past'], ['🐎', 'horse and buggy', 'past'], ['☎️', 'old phone', 'past'], ['📜', 'scroll letter', 'past'], ['💡', 'light bulb', 'now'], ['🚗', 'car', 'now'], ['📱', 'smartphone', 'now'], ['💻', 'computer', 'now']] },
  needswants: { bins: [['need', '🏠 Need'], ['want', '🎮 Want']], items: [['💧', 'water', 'need'], ['🍎', 'food', 'need'], ['🏠', 'home', 'need'], ['🧥', 'warm clothes', 'need'], ['🎮', 'video game', 'want'], ['🧸', 'new toy', 'want'], ['🍭', 'candy', 'want'], ['🎢', 'theme park', 'want']] },
  weatherwear: { bins: [['sunny', '☀️ Sunny day'], ['snowy', '❄️ Snowy day']], items: [['🩳', 'shorts', 'sunny'], ['🕶️', 'sunglasses', 'sunny'], ['👙', 'swimsuit', 'sunny'], ['🧢', 'cap', 'sunny'], ['🧤', 'mittens', 'snowy'], ['🧣', 'scarf', 'snowy'], ['🧥', 'coat', 'snowy'], ['🥾', 'boots', 'snowy']] },
};
function sortSkill(kind) {
  return (lv) => {
    const s = SORTS[kind];
    const n = Math.min(s.items.length, 3 + lv);
    const a = R.shuffle(s.items.filter(i => i[2] === s.bins[0][0])), b = R.shuffle(s.items.filter(i => i[2] === s.bins[1][0]));
    const items = R.shuffle([...a.slice(0, Math.ceil(n / 2)), ...b.slice(0, Math.floor(n / 2))]);
    return { type: 'sort', prompt: `Sort them! Tap a picture, then tap where it goes.`, bins: s.bins, items, hint: `Ask yourself about each one: is it "${s.bins[0][1]}" or "${s.bins[1][1]}"?`, explain: s.bins.map(bn => `${bn[1]}: ${s.items.filter(i => i[2] === bn[0]).map(i => i[0]).join(' ')}`).join('  ·  '), key: 'so' + kind + items.map(i => i[1]).join() };
  };
}

// ---------- SOCIAL STUDIES ----------
const SOC = {
  helpers: [['Who puts out fires?', '🚒 Firefighter', ['👩‍🍳 Chef', '👨‍🌾 Farmer', '💇 Hair stylist'], 1], ['Who helps you when you are sick?', '🩺 Doctor', ['🧑‍🚀 Astronaut', '🧑‍🎨 Artist', '🧑‍🔧 Mechanic'], 1], ['Who delivers letters?', '📬 Mail carrier', ['🧑‍🏫 Teacher', '👮 Police officer', '🧑‍⚕️ Nurse'], 1], ['Who grows food on a farm?', '👨‍🌾 Farmer', ['🧑‍✈️ Pilot', '🧑‍💻 Programmer', '🦷 Dentist'], 2], ['Who keeps your teeth healthy?', '🦷 Dentist', ['🚒 Firefighter', '📬 Mail carrier', '👨‍🌾 Farmer'], 2], ['Who helps keep the community safe?', '👮 Police officer', ['🍰 Baker', '🎤 Singer', '🧑‍🎨 Artist'], 1], ['A librarian helps you…', 'Find books', ['Fix cars', 'Cut hair', 'Fly planes'], 3]],
  rules: [['Why do we have rules?', 'To keep us safe and fair', ['To make us sad', 'To waste time', 'No reason'], 1], ['What should you do before crossing the street?', 'Stop, look both ways, and hold a grown-up\'s hand', ['Run fast', 'Close your eyes', 'Look at your phone'], 1], ['A good classroom rule is…', 'Raise your hand to talk', ['Yell loudly', 'Push in line', 'Throw toys'], 1], ['What does a red traffic light mean?', 'Stop', ['Go', 'Speed up', 'Dance'], 2], ['A responsibility at home could be…', 'Feeding the pet', ['Watching TV all day', 'Leaving toys out', 'Skipping dinner'], 2]],
  symbols: [['What is on the United States flag?', 'Stars and stripes', ['Circles and dots', 'A big tree', 'A lion'], 1], ['Which bird is a symbol of the United States?', '🦅 Bald eagle', ['🦜 Parrot', '🐧 Penguin', '🦆 Duck'], 2], ['The Statue of Liberty holds a…', 'Torch', ['Sword', 'Balloon', 'Broom'], 3], ['What colors are on the U.S. flag?', 'Red, white and blue', ['Green and yellow', 'Pink and purple', 'Black and orange'], 1], ['The Liberty Bell is a symbol of…', 'Freedom', ['Lunch time', 'Winter', 'Sports'], 4]],
  history: [['Who was the first President of the United States?', 'George Washington', ['Abraham Lincoln', 'Martin Luther King Jr.', 'Rosa Parks'], 2], ['Martin Luther King Jr. worked so people would be treated…', 'Fairly and equally', ['Badly', 'With candy', 'Like robots'], 3], ['Rosa Parks is remembered for being brave on a…', 'Bus', ['Boat', 'Plane', 'Bike'], 3], ['Abraham Lincoln was a President who helped end…', 'Slavery', ['School', 'Summer', 'Sports'], 5], ['Long ago, people read at night using…', 'Candles', ['Phones', 'TVs', 'Tablets'], 1]],
  community: [['A place where many people live and work together is a…', 'Community', ['Cloud', 'Ocean', 'Planet'], 2], ['Where do you go to borrow books?', 'Library', ['Bank', 'Gas station', 'Pool'], 1], ['Families can be…', 'Big or small and all different', ['Only 3 people', 'Only grown-ups', 'Only kids'], 1], ['Where do people buy food?', 'Grocery store', ['Library', 'Fire station', 'School'], 1], ['A neighbor is someone who…', 'Lives near you', ['Lives on the Moon', 'Is a cartoon', 'Is a robot'], 2]],
  cultures: [['People around the world celebrate…', 'Many different holidays', ['Only one holiday', 'No holidays', 'Only birthdays'], 1], ['On Thanksgiving, many families…', 'Share a meal and give thanks', ['Go to the Moon', 'Plant snow', 'Hide eggs in snow'], 2], ['Lunar New Year is often celebrated with…', 'Red lanterns and dragon dances', ['Snowballs', 'Pumpkins', 'Christmas trees only'], 3], ['Why is it good to learn about other cultures?', 'To understand and respect each other', ['To make fun of people', 'It is not good', 'To stay away from others'], 2]],
  citizenship: [['A good citizen…', 'Helps others and follows rules', ['Litters', 'Is unkind', 'Breaks things'], 1], ['If you find a lost wallet, you should…', 'Give it to a grown-up to return it', ['Keep it', 'Throw it away', 'Hide it'], 2], ['Voting is a way people…', 'Make choices together', ['Eat lunch', 'Play tag', 'Take naps'], 4], ['How can you help your community?', 'Pick up litter at the park', ['Draw on walls', 'Be loud at night', 'Waste water'], 1]],
};
function socialSkill(topic) {
  return (lv) => {
    const bank = SOC[topic].filter(q => q[3] <= lv);
    const q = R.pick(bank.length ? bank : SOC[topic]);
    return { type: 'choice', prompt: q[0], choices: mc(q[1], q[2], lv <= 1 ? 3 : 4), answer: q[1], hint: 'Think about your own town and family.', explain: `${q[1]}.`, key: 'soc' + q[0] };
  };
}
// Map + compass directions on a little town grid.
const MAP_PLACES = [['🏫', 'school'], ['🏠', 'house'], ['🌳', 'park'], ['🏥', 'hospital'], ['🏪', 'store'], ['🚒', 'fire station'], ['📚', 'library'], ['⛪', 'church'], ['🏦', 'bank']];
function mapSkill(lv) {
  const places = R.sample(MAP_PLACES, 9);
  const grid = places.map(p => p[0]);
  const html = `<div class="mapgrid"><span class="compass">⬆️N</span>${grid.map(e => `<div>${e}</div>`).join('')}</div>`;
  const c = 4; // center
  const dirs = { north: -3, south: 3, east: 1, west: -1 };
  const d = lv <= 2 ? R.pick(['north', 'south']) : R.pick(Object.keys(dirs));
  const ans = places[c + dirs[d]];
  const opp = { north: 'south', south: 'north', east: 'west', west: 'east' }[d];
  const wrong = places[c + dirs[opp]];
  return { type: 'choice', prompt: `On the map, what is ${d.toUpperCase()} of the ${places[c][1]} ${places[c][0]}?`, html, choices: mc(`${ans[0]} ${ans[1]}`, places.filter((p, i) => i !== c && p !== ans).map(p => `${p[0]} ${p[1]}`)), answer: `${ans[0]} ${ans[1]}`,
    tags: { [`${wrong[0]} ${wrong[1]}`]: 'direction_lr' }, hint: 'North is up, south is down, east is right, west is left.', explain: `${ans[1]} is ${d} of the ${places[c][1]}.`, key: 'map' + d + grid.join('') };
}

// ---------- the skill catalog ----------
// domain: what the parent dashboard groups by. weight: reward weighting. prereq: skills that should come first.
const SKILLS = [
  // Reading
  { id: 'letter_sounds', domain: 'phonics', subject: 'Reading', name: 'Letter sounds', prereq: [], weight: 1, gen: letterSounds },
  { id: 'blending', domain: 'phonics', subject: 'Reading', name: 'Blending sounds', prereq: ['letter_sounds'], weight: 1.2, gen: blending },
  { id: 'rhyming', domain: 'phonics', subject: 'Reading', name: 'Rhyming', prereq: [], weight: 1, gen: rhyming },
  { id: 'word_families', domain: 'phonics', subject: 'Reading', name: 'Word families', prereq: ['letter_sounds'], weight: 1.1, gen: wordFamilies },
  { id: 'sight_words', domain: 'sightwords', subject: 'Reading', name: 'Sight words', prereq: [], weight: 1.2, gen: sightWords },
  { id: 'comp_wh', domain: 'comprehension', subject: 'Reading', name: 'Who/What/Where/When/Why', prereq: ['sight_words'], weight: 1.4, gen: comprehensionWH },
  { id: 'sequencing', domain: 'comprehension', subject: 'Reading', name: 'Story sequencing', prereq: ['sight_words'], weight: 1.3, gen: sequencing },
  { id: 'char_setting', domain: 'comprehension', subject: 'Reading', name: 'Characters & setting', prereq: ['sight_words'], weight: 1.2, gen: charactersSetting },
  { id: 'main_idea', domain: 'comprehension', subject: 'Reading', name: 'Main idea', prereq: ['comp_wh'], weight: 1.4, gen: mainIdea },
  { id: 'directions', domain: 'comprehension', subject: 'Reading', name: 'Following written directions', prereq: ['sight_words'], weight: 1.1, gen: directions },
  { id: 'vocabulary', domain: 'vocabulary', subject: 'Reading', name: 'Vocabulary', prereq: [], weight: 1.1, gen: vocabulary },
  { id: 'spelling', domain: 'spelling', subject: 'Reading', name: 'Spelling', prereq: ['letter_sounds'], weight: 1.2, gen: spelling },
  { id: 'sentences', domain: 'vocabulary', subject: 'Reading', name: 'Building sentences', prereq: ['sight_words'], weight: 1.2, gen: sentences },
  { id: 'read_aloud', domain: 'fluency', subject: 'Reading', name: 'Reading aloud (fluency)', prereq: ['sight_words'], weight: 1.5, gen: readAloud },
  // Math
  { id: 'counting', domain: 'numbers', subject: 'Math', name: 'Counting', prereq: [], weight: 1, gen: counting },
  { id: 'number_order', domain: 'numbers', subject: 'Math', name: 'Number order', prereq: ['counting'], weight: 1, gen: numberOrder },
  { id: 'compare', domain: 'numbers', subject: 'Math', name: 'Greater / less than', prereq: ['counting'], weight: 1.1, gen: compareNumbers },
  { id: 'place_value', domain: 'numbers', subject: 'Math', name: 'Place value (tens & ones)', prereq: ['counting'], weight: 1.3, gen: placeValue },
  { id: 'missing_number', domain: 'numbers', subject: 'Math', name: 'Missing numbers', prereq: ['number_order'], weight: 1, gen: missingNumber },
  { id: 'number_bonds', domain: 'addition', subject: 'Math', name: 'Number bonds', prereq: ['counting'], weight: 1.2, gen: numberBonds },
  { id: 'addition', domain: 'addition', subject: 'Math', name: 'Addition', prereq: ['counting'], weight: 1.2, gen: addition },
  { id: 'subtraction', domain: 'subtraction', subject: 'Math', name: 'Subtraction', prereq: ['addition'], weight: 1.3, gen: subtraction },
  { id: 'shapes', domain: 'shapes', subject: 'Math', name: 'Shapes', prereq: [], weight: 1, gen: shapes },
  { id: 'patterns', domain: 'shapes', subject: 'Math', name: 'Patterns', prereq: [], weight: 1, gen: patterns },
  { id: 'length', domain: 'measurement', subject: 'Math', name: 'Length & measuring', prereq: ['counting'], weight: 1.1, gen: lengthSkill },
  { id: 'time', domain: 'measurement', subject: 'Math', name: 'Telling time', prereq: ['counting'], weight: 1.2, gen: timeSkill },
  { id: 'money', domain: 'measurement', subject: 'Math', name: 'Money', prereq: ['counting'], weight: 1.2, gen: money },
  { id: 'calendar', domain: 'measurement', subject: 'Math', name: 'Days & months', prereq: [], weight: 1, gen: calendar },
  // Science
  { id: 'sci_plants', domain: 'science', subject: 'Science', name: 'Plants', prereq: [], weight: 1.1, gen: scienceSkill('plants'), experiment: ['plant'] },
  { id: 'sci_animals', domain: 'science', subject: 'Science', name: 'Animals & habitats', prereq: [], weight: 1, gen: scienceSkill('animals') },
  { id: 'sci_living', domain: 'science', subject: 'Science', name: 'Living vs. nonliving', prereq: [], weight: 1, gen: (lv) => (Math.random() < 0.5 ? sortSkill('living')(lv) : scienceSkill('living')(lv)) },
  { id: 'sci_weather', domain: 'science', subject: 'Science', name: 'Weather & seasons', prereq: [], weight: 1, gen: (lv) => (Math.random() < 0.35 ? sortSkill('weatherwear')(lv) : scienceSkill('weather')(lv)) },
  { id: 'sci_space', domain: 'science', subject: 'Science', name: 'Sun, Moon & Earth', prereq: [], weight: 1.1, gen: scienceSkill('space') },
  { id: 'sci_body', domain: 'science', subject: 'Science', name: 'Body & five senses', prereq: [], weight: 1, gen: scienceSkill('body') },
  { id: 'sci_matter', domain: 'science', subject: 'Science', name: 'Materials, water & magnets', prereq: [], weight: 1.1, gen: scienceSkill('matter'), experiment: ['float', 'magnet'] },
  { id: 'sci_forces', domain: 'science', subject: 'Science', name: 'Pushes, pulls & motion', prereq: [], weight: 1.1, gen: scienceSkill('forces') },
  { id: 'sci_environment', domain: 'science', subject: 'Science', name: 'Caring for Earth', prereq: [], weight: 1, gen: scienceSkill('environment') },
  // Social studies
  { id: 'soc_helpers', domain: 'social', subject: 'Social Studies', name: 'Community helpers', prereq: [], weight: 1, gen: socialSkill('helpers') },
  { id: 'soc_maps', domain: 'social', subject: 'Social Studies', name: 'Maps & directions', prereq: [], weight: 1.2, gen: mapSkill },
  { id: 'soc_rules', domain: 'social', subject: 'Social Studies', name: 'Rules & responsibilities', prereq: [], weight: 1, gen: socialSkill('rules') },
  { id: 'soc_past', domain: 'social', subject: 'Social Studies', name: 'Past vs. present', prereq: [], weight: 1, gen: sortSkill('pastpresent') },
  { id: 'soc_symbols', domain: 'social', subject: 'Social Studies', name: 'U.S. symbols', prereq: [], weight: 1, gen: socialSkill('symbols') },
  { id: 'soc_history', domain: 'social', subject: 'Social Studies', name: 'People in history', prereq: [], weight: 1.1, gen: socialSkill('history') },
  { id: 'soc_community', domain: 'social', subject: 'Social Studies', name: 'Families & communities', prereq: [], weight: 1, gen: socialSkill('community') },
  { id: 'soc_cultures', domain: 'social', subject: 'Social Studies', name: 'Cultures & holidays', prereq: [], weight: 1, gen: socialSkill('cultures') },
  { id: 'soc_citizen', domain: 'social', subject: 'Social Studies', name: 'Citizenship', prereq: [], weight: 1, gen: (lv) => (Math.random() < 0.4 ? sortSkill('needswants')(lv) : socialSkill('citizenship')(lv)) },
];
SKILLS.forEach(s => { s.grade = 1; });
const SKILL_BY_ID = Object.fromEntries(SKILLS.map(s => [s.id, s]));

// Dashboard domains (in the order parents see them).
const DOMAINS = [
  ['phonics', 'Phonics', 'Reading'], ['sightwords', 'Sight words', 'Reading'], ['comprehension', 'Reading comprehension', 'Reading'], ['vocabulary', 'Vocabulary & sentences', 'Reading'],
  ['spelling', 'Spelling', 'Reading'], ['fluency', 'Reading aloud', 'Reading'], ['numbers', 'Numbers', 'Math'], ['addition', 'Addition', 'Math'], ['subtraction', 'Subtraction', 'Math'],
  ['shapes', 'Shapes & patterns', 'Math'], ['measurement', 'Measurement, time & money', 'Math'], ['science', 'Science', 'Science'], ['social', 'Social Studies', 'Social Studies'],
];
const DOMAIN_NAME = Object.fromEntries(DOMAINS.map(d => [d[0], d[1]]));
// Which domains each learning portal / activity source draws from.
const PORTAL_DOMAINS = {
  math: ['addition', 'subtraction', 'numbers'], spell: ['spelling', 'phonics'], pattern: ['shapes'], count: ['numbers', 'measurement'], read: ['comprehension', 'sightwords', 'fluency'],
  science: ['science'], shapes: ['shapes', 'measurement'], heart: ['social'], money: ['measurement', 'numbers'], memory: ['sightwords', 'vocabulary'],
};

// Build one activity for a skill at a level, stamped with full metadata.
function makeActivity(skillId, level, opts = {}) {
  const sk = SKILL_BY_ID[skillId];
  level = Math.max(1, Math.min(5, Math.round(level)));
  let it = null;
  for (let i = 0; i < 6 && !it; i++) { try { it = sk.gen(level, opts); } catch (e) { it = null; } }
  if (!it) it = counting(1);
  return Object.assign({ type: 'choice', tags: {} }, it, {
    grade: sk.grade, subject: sk.subject, domain: sk.domain, skill: sk.id, skillName: sk.name, difficulty: level,
    prereq: sk.prereq, reward: sk.weight * (0.8 + level * 0.1),
  });
}
