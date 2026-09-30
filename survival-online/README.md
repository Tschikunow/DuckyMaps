# Wildreach Online

A browser-based online survival prototype inspired by the broad survival-crafting genre.

## Included

- Real-time multiplayer with Socket.IO
- Large explorable 3D wilderness
- Hunger, thirst, health and stamina
- Trees, rocks and bushes with shared resource state
- Crafting: axe, spear, campfire, foundations and walls
- Three original creature species with server-side roaming / aggression
- Melee combat and creature respawning
- Shared building placement
- Desktop first-person controls plus basic mobile controls
- Day/night lighting and a water area

## Run locally

```bash
cd survival-online
npm install
npm start
```

Open `http://localhost:3000`.

## Put it online

Deploy the `survival-online` directory to any Node.js host that supports WebSockets, for example Render, Railway, Fly.io, a VPS or similar. The start command is `npm start`.

Static-only GitHub Pages is not enough for multiplayer because the Socket.IO server needs to stay running.

## Controls

- WASD: move
- Shift: sprint
- Mouse: look
- Left click: attack / gather targeted object
- E: gather / interact
- 1 / 2 / 3: hands / axe / spear
- B: build mode
- F: eat berries
- R: drink when standing in the lake
- Escape: release mouse

This is intentionally an original game foundation, not a copy of ARK assets, maps, creatures or code.
