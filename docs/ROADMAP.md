# First-Grade Learning Adventure World — Build Status & Roadmap

This maps every section of the product handoff to what is built. **Phase 1** (this release) builds the four
pillars as one connected product: the learning engine, the parent analytics, the shared family world, and
meaningful rewards. Later phases add the remaining games, places and polish.

Legend: ✅ built · 🟡 partly built · ⬜ not started yet

| # | Section | Status | What exists / what's missing |
|---|---|---|---|
| 1 | Player profiles | ✅ | Child and Parent profiles per device. The child profile stores name, grade, learning model (per-skill level, status, history), baseline, mastery, game/mission history, rewards, inventory, pets, vehicles, house items, clothing and level progress. A parent's own play never changes the child's data. |
| 2 | First-grade learning engine | ✅ | 46 grade-1 skills (reading, math, science, social studies) with generators for each difficulty level 1-5. **No multiplication or division anywhere** (verified by an automated check over 69,000 generated activities). Spoken audio, read-aloud with speech recognition, 3 hands-on science experiments (Plant Lab, Sink or Float, Magnet Lab). 🟡 Geography covers maps and directions only, not continents or oceans yet. |
| 3 | Baseline assessment | ✅ | No test. The first 6 activities in each of the 13 areas form a placement "staircase", then the starting point is frozen permanently with its date. |
| 4 | Adaptive learning | ✅ | Every activity records correct/incorrect, skill, difficulty, response time, attempts, hints, help needed and error patterns. Ability moves gradually (never on one answer), activities target ~75-85% success, and after two misses the next activity switches to a supported version (easier, hint first, fewer choices, pictures). Statuses: Mastered / On track / Developing / Needs practice. 🟡 Response time is reported to parents but not yet used to choose difficulty. |
| 5 | Parent dashboard | ✅ | Start → Now → Growth → Target for every area, trend graph (date range + per-area filter, table view), weekly play-time chart, strengths, areas developing, needs attention (specific causes such as "adds when the problem asks to subtract"), recommended next steps, and a full per-skill table. |
| 6 | Progress reports | ✅ | Weekly (Mon-Sun) and monthly reports are created automatically, with time, activities, skills, accuracy, start vs. current, strongest areas, attention areas, accomplishments, focus, and a trend graph. They can be printed or saved as PDF. ⬜ Emailing reports automatically needs a server. |
| 7 | Multiplayer family world | 🟡 | Parent and child share a private room and see each other walk, run and jump in real time, chat, play missions and games. Rooms hold up to 6 players, so more approved players can join later. ⬜ Sitting, dancing and emote menus. ⬜ Friends can't yet see each other's pets and vehicles. ⬜ Persistent shared houses (needs a server; today each iPad keeps its own world and family stats are merged). |
| 8 | Private voice chat | ✅ | Open mic, push-to-talk, mute, per-person volume, speaking indicators, LIVE badge. Off on the child's device until a parent turns it on; private rooms only. ⚠️ Tested with simulated devices; needs a real two-iPad test. Some strict networks may block it (a relay server would fix that). |
| 9 | Cooperative missions | 🟡 | ✅ Secret Agents escape room with split information (code holder / button presser, note reader / button presser, problem reader / keypad solver), with Pip the dragon as a solo partner. ✅ Missing Puppy with shared clue trail. ⬜ Space Rescue, Island Survival, Museum Mystery, City Rescue, split-clue Treasure Island. |
| 10 | Player vs. player | 🟡 | ✅ Freeze Tag, ✅ Math Race (grown-up handicap), ✅ family scores and records. ⬜ Hide & Seek, Tag (classic), Water Blasters, Basketball / HORSE / 3-point, Soccer, Dodgeball, Capture the Flag, obstacle courses, kart racing, Tic-Tac-Toe, treasure race, drawing, reading/spelling races, trivia. |
| 11 | Freeze tag team system | ✅ | Teams of players + AI teammates, freezing, rescue by touch, win when the whole other team is frozen (or most players left at the time limit). Each kingdom is a different map with its own obstacles. |
| 12 | Water blaster battles | ⬜ | Planned next. It will reuse Freeze Tag's host-run game framework. |
| 13 | Dynamic world events | ✅ | Mission alerts, treasure detected, apple picking, secret agents, and "challenge available" when a family member is nearby. Accept alone or together. |
| 14 | Learning inside missions | 🟡 | Clues are learning tasks (read the sign, count the paw prints, help a neighbor), treasure has a number lock, apples are counted, the escape room puts reading and math in the doors, shop orders are real learning. ⬜ More physical-world puzzles (number-order bridges, triangle keys, block spelling). |
| 15 | Reward system | ✅ | Confetti, music, her character dances, mystery boxes with rarity and a tap-to-open reveal, milestone unlock screens. Rewards wait for a calm moment and never interrupt an activity. |
| 16 | Fashion-doll world (original) | 🟡 | ✅ Boutique (face, hair, outfits, accessories), hair salon, nail & pedi spa, ice cream / candy / sneaker shops. ✅ Pets you can feed, pet, play fetch with, name and customize. ✅ Usable vehicles: skates, scooter, bike, go-kart, convertible. ⬜ Dream House interior, dance studio, music stage, pool, amusement park, garage. |
| 17 | Doll transformation portal | ⬜ | Planned with the Dream House neighborhood. |
| 18 | Learning unlocks the world | 🟡 | ✅ Milestones unlock pets, vehicles, furniture and areas, and the unlock screen says why ("Sight-word milestone → Puppy"). ⬜ House items and the Town Hall area are collected now but appear physically once the Dream House is built. |
| 19 | Family team | 🟡 | ✅ Team name, emblem, team level, missions together, parent wins, child wins, team victories, streaks, trophy room, history (synced between devices). ⬜ Shared clubhouse building. |
| 20 | Daily / weekly content | ✅ | Daily Adventure, Daily Reading Challenge, Daily Mystery, Daily Reward, optional family challenge. A weekly Family Adventure with 5 steps and a legendary reward. |
| 21 | Engagement philosophy | ✅ | Success is targeted at ~75-85% ("I can do this"). Wrong answers get a second try and encouragement; nothing shames her. |
| 22 | Content engine | ✅ | Every activity carries grade, subject, skill, difficulty, activity type, prerequisite, expected answer, hint, explanation, error tags and reward weighting, and repeats are avoided. 🟡 Some fact banks (science, social studies) are small and should grow. |
| 23 | Session design | 🟡 | All of it works except returning to the Dream House to see the new puppy (the puppy follows her in the world instead). |
| 24 | Non-negotiables | 🟡 | 1-6, 8-11, 14-15 and 17 are met. 7 and 12-13 are partly met (see above). 16 and 18 are met for pets and vehicles. |

## Recommended Phase 2 (in order)
1. **Dream House + doll neighborhood** (transformation portal, rooms, lights/doors, furniture from unlocks, pets at home, pool), then the dance studio and music stage.
2. **Water Blaster battles**, plus Hide & Seek and a basketball "first to 7" court, all on the Freeze Tag framework.
3. **More co-op missions**: Space Rescue and Museum Mystery with split clues.
4. **Show pets and vehicles to friends**, plus emotes, dancing and sitting.
5. **Optional family cloud sync** (small server): one shared persistent world, reports emailed weekly, and a voice relay for strict networks.
6. **Grow the content banks** (more stories, science and social studies items, geography), then Grade 2.
