# 🎲 Roulette

A 3D Russian Roulette card game built with React and Three.js. Play solo against **VLAD**, or challenge a friend in real-time online PvP — no account, no install, just share a room code.

🎮 **Play it now:** [roulette-mealify.vercel.app](https://roulette-mealify.vercel.app)

---

## About the Game

Roulette is a high-stakes Hi-Lo card game with a twist: guess wrong, and *you* pull the trigger. The chamber has one bullet. The deck has fifty-two cards. Your nerves have a limit.

- 🃏 **Hi-Lo mechanic** — Predict whether the next card is higher or lower
- 🔫 **Single-elimination stakes** — Wrong guess pulls the trigger on you; right guess passes it to your opponent
- 🤖 **Solo mode (VS VLAD)** — Face off against an AI opponent
- 👥 **Online PvP (VS FRIEND)** — Peer-to-peer multiplayer with shareable room codes

---

## Tech Stack

| Layer | Tech |
| --- | --- |
| Framework | [React 19](https://react.dev) + [Vite](https://vitejs.dev) |
| 3D rendering | [Three.js](https://threejs.org), [@react-three/fiber](https://github.com/pmndrs/react-three-fiber), [@react-three/drei](https://github.com/pmndrs/drei) |
| State management | [Zustand](https://github.com/pmndrs/zustand) |
| Multiplayer | [PeerJS](https://peerjs.com) (WebRTC, peer-to-peer) |
| Serverless / KV | [Vercel Functions](https://vercel.com/docs/functions) + [@vercel/kv](https://vercel.com/docs/storage/vercel-kv) |
| Hosting | [Vercel](https://vercel.com) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or pnpm / yarn)

### Local development

```bash
# Clone the repo
git clone https://github.com/ken-kinneen/roulette.git
cd roulette

# Install dependencies
npm install

# Start the dev server (with HMR)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and you're in.

### Available scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Build the production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint over the project |

---

## Multiplayer

Online PvP runs over WebRTC via PeerJS — there's no game server. One player creates a room (`RR-XXXXXX`), shares the code, and the other joins directly. The host acts as authority for randomness (bullet position, deck order) to keep things honest.

To test locally, just open two browser windows: one creates a room, the other joins with the code.

📖 **Full multiplayer details:** [MULTIPLAYER_GUIDE.md](./MULTIPLAYER_GUIDE.md)

---

## Project Structure

```
roulette/
├── api/                  # Vercel serverless functions
├── public/               # Static assets
├── src/
│   ├── components/       # React components (UI + 3D scene)
│   ├── stores/           # Zustand stores (game state, multiplayer sync)
│   └── utils/            # Helpers (PeerJS wrapper, etc.)
├── index.html
├── vite.config.js
└── vercel.json           # Vercel deployment config
```

---

## Deployment

The app is deployed on Vercel and rebuilds automatically on every push to `main`. To deploy your own fork:

1. Fork this repo
2. Import it into Vercel
3. Vercel auto-detects Vite — no extra config needed

---

## License

No license file is currently included. If you'd like to use, modify, or distribute this code, please open an issue or reach out.

---

Built with caffeine and questionable judgment by [@ken-kinneen](https://github.com/ken-kinneen). 🃏
