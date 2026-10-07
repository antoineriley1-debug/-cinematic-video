# 👑 Princess Kingdom Quest — a first-grade learning adventure world

A Roblox-style 3D world for iPad where a child explores, plays with her parent, completes missions, and earns
rewards that change what she can do, while an adaptive learning engine quietly measures and grows her
first-grade skills, and the parent gets a real progress dashboard.

**Status of every product requirement:** see [docs/ROADMAP.md](docs/ROADMAP.md).

## Play on iPad
1. The game is published with GitHub Pages from this branch: `https://antoineriley1-debug.github.io/-cinematic-video/`
2. Open it in **Safari**, then **Share → Add to Home Screen**.
3. On first launch each iPad asks who plays there: **a child** or **a parent**.

Controls: pink joystick to move, purple JUMP, swipe to look around, the pink action button to talk, enter
shops and portals. Side buttons: 📅 Today · 🏆 Family team · 🐾 Pets · 🛴 Ride · 🎙️ Voice (when enabled).

## What's inside
**Learning (grade 1, no multiplication)**
- 46 skills across reading (phonics, sight words, comprehension, vocabulary, sentences, spelling, reading aloud), math (numbers, place value, addition, subtraction, shapes, patterns, measurement, time, money), science and social studies.
- Many activity types: choose, tap-to-count, put in order, spell with tiles, follow directions, sort, read aloud (speech recognition), and science experiments (Plant Lab, Sink or Float, Magnet Lab).
- Adaptive: difficulty follows her measured level per skill, targets ~75-85% success, changes approach after misses, and tracks time, attempts, hints, help and mistake patterns.
- A silent baseline per area, frozen as her starting point.

**For parents** (🔒 Parents → 📊 Progress)
- Start → Now → Growth → Target per area, trend graphs, weekly play time, strengths / developing / needs attention with specific causes, next steps, and a per-skill table.
- Weekly and monthly reports, created automatically and printable as PDF.
- Reward store with your own prices, coin speed, voice/online/chat controls, grade, and progress backup and restore.

**The world**
- 100 levels in 20 themed kingdoms, AI players, portals, a tower, and a castle.
- A shop street (ice cream, candy, sneakers, hair salon, nail & pedi spa), the Boutique dress-up, and AI teammates.
- Living-world events: missing puppy, treasure, apple picking, secret agents, and challenge invites.
- Rewards: confetti celebrations, mystery boxes, and learning milestones that unlock usable pets and vehicles.

**Family play** (private 5-letter room code)
- See each other in the world, safe chat, and private voice chat (open mic, push-to-talk, mute, volume).
- Co-op Secret Agents escape room with split clues, Freeze Tag with AI teammates, and Math Race.
- Family Team stats and trophy room, plus daily and weekly Family Adventures.
- The child's progress syncs to the parent's iPad while you play together.

Progress is saved on each iPad. Use Parents → Settings → Backup to keep a copy.

## Code map
`js/curriculum.js` skills & activity generators · `js/learner.js` adaptive model, baseline, insights, reports ·
`js/present.js` activity screens & experiments · `js/dashboard.js` parent dashboard & sync ·
`js/rewards.js` celebrations, milestones, pets, vehicles · `js/family.js` profiles, family team, daily/weekly ·
`js/events.js` world events & missions · `js/coop.js` escape room · `js/arena.js` freeze tag & math race ·
`js/voice.js` voice chat · `js/net.js` private rooms · `js/game.js`, `js/world.js` 3D world ·
`js/shops.js`, `js/minigames.js`, `js/ui.js`, `js/save.js`, `js/data.js`.
Libraries: three.js r160 (MIT), PeerJS 1.5.4 (MIT), in `vendor/`.
