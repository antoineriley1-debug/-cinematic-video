# 👑 Princess Kingdom Quest

A Roblox-style, free-roam 3D learning game for iPad (also works in any modern browser).

## How to play on iPad
1. Host this folder on any static web host (e.g. turn on **GitHub Pages** for this repo: Settings → Pages → deploy from this branch, root folder).
2. Open the link in **Safari** on the iPad.
3. Tap **Share → Add to Home Screen**. It then opens full screen like an app.

Controls: pink joystick to move · purple button to jump · swipe the screen to look around · pink action button to talk / enter portals.
Keyboard also works: WASD/arrows, Space to jump, E to interact.

## What's in it
- **100 levels** in **20 themed worlds** (Pink Meadow, Baby Dragon Valley, Crystal Caves, Mermaid Lagoon, Dragon Tower Peaks, Queen's Grand Palace…), all with pink.
- **10 tiers**: Sprout Princess → Brave → Clever → Kind → Dragon Friend → Crystal Knight → Star Scholar → Royal Inventor → Wise Leader → Queen of Kingdoms.
- **Each level is a free-roam quest**: collect gems, win golden keys in learning portals, help friends who have a ❗, climb the spiral tower for the crown, and then the castle door opens to the next-level portal. Levels get bigger and longer as she goes.
- **10 learning portals** that get harder with each level: Magic Math, Spell Castle, Pattern Path, Memory Mirror, Dragon Count, Story Scroll (reading), Wonder Lab (science), Clock & Shapes, Royal Market (money), Heart Choices (kindness & confidence).
- **AI players** (princesses, knights, baby dragons) roam, jump, chat, go into portals, and sometimes give coins.
- Questions can be **read out loud**, and wrong answers get growth-mindset encouragement.
- **Parent reward store** (🔒 PIN): set each reward's name, emoji and coin price, see what was redeemed and mark it given, view progress by subject, change how fast coins are earned, give bonus coins, unlock levels.

- **Princess Town** in every kingdom: 🍦 Ice Cream Shop, 🍭 Candy Shop, 👟 Sneaker Studio, 💇‍♀️ Hair Salon and 💅 Nail & Pedi Spa.
  Each shop has a learning **shift** (follow orders, count, make change, sort sizes, mix colors, paint nail patterns), a **treat myself** mode, and a **delivery mission**.
- **Make friends:** ask any princess or knight to **join your team** (up to 2). Teammates follow her into every level and earn team bonuses on missions.
- **👗 Boutique mirror:** change skin tone, eyes, eye color, nose, mouth, cheeks, hair, outfit (gown, tutu, adventure pants, royal ball gown) and crown/tiara/bow/flower. Basics are free. Other looks are **earned with game coins** (a parent can make them all free).
- **👭 Play with real friends (off until a parent turns it on):** one player taps *Make a room* and shares the 5-letter code, and friends on other iPads type it in to join (up to 6). Everyone sees each other in the kingdom and can chat. Chat is **safe phrases + emoji** by default. Parents can allow typing, which hides bad words, numbers, links and emails. There are no public lobbies, so only people with the code can join.

Progress is saved on the device (browser local storage).

### Online play notes
Multiplayer connects iPads directly to each other (WebRTC) using the free PeerJS matchmaking service, so there is no server to set up. Most home Wi-Fi works. A few strict school or office networks block it, and then the game says it couldn't connect.

## Files
`index.html`, `style.css`, `js/` (data, save, audio, ui, minigames, shops, net, world, game), `vendor/three.min.js` (three.js r160, MIT), `vendor/peerjs.min.js` (PeerJS 1.5.4, MIT).
