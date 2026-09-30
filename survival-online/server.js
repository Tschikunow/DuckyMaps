const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;
const WORLD = 220;

app.use(express.static(path.join(__dirname, "public")));
app.get("/health", (_, res) => res.json({ ok: true, players: players.size }));

const players = new Map();
const resources = new Map();
const creatures = new Map();
const structures = new Map();

let nextResourceId = 1;
let nextCreatureId = 1;
let nextStructureId = 1;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function dist2(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}
function rand(min, max) { return min + Math.random() * (max - min); }
function randomPoint() {
  return { x: rand(-WORLD + 8, WORLD - 8), z: rand(-WORLD + 8, WORLD - 8) };
}

function spawnResource(type) {
  const p = randomPoint();
  const id = String(nextResourceId++);
  const max = type === "tree" ? 7 : type === "rock" ? 6 : 4;
  resources.set(id, { id, type, x: p.x, z: p.z, hp: max, maxHp: max });
}
for (let i = 0; i < 85; i++) spawnResource("tree");
for (let i = 0; i < 65; i++) spawnResource("rock");
for (let i = 0; i < 45; i++) spawnResource("bush");

const creatureDefs = {
  ridgeclaw: { hp: 65, speed: 5.2, damage: 8, aggro: 22, scale: 1.15 },
  mossback: { hp: 120, speed: 2.0, damage: 4, aggro: 0, scale: 1.65 },
  skitterhorn: { hp: 85, speed: 3.1, damage: 6, aggro: 9, scale: 1.3 }
};

function spawnCreature(kind) {
  const def = creatureDefs[kind];
  const p = randomPoint();
  const id = String(nextCreatureId++);
  creatures.set(id, {
    id, kind, x: p.x, z: p.z,
    vx: 0, vz: 0, yaw: rand(0, Math.PI * 2),
    hp: def.hp, maxHp: def.hp,
    target: null, wanderUntil: 0, attackAt: 0
  });
}
for (let i = 0; i < 7; i++) spawnCreature("ridgeclaw");
for (let i = 0; i < 9; i++) spawnCreature("mossback");
for (let i = 0; i < 6; i++) spawnCreature("skitterhorn");

const recipes = {
  axe: { wood: 3, stone: 4, fiber: 2 },
  spear: { wood: 5, stone: 2, fiber: 3 },
  campfire: { wood: 6, stone: 6 },
  foundation: { wood: 8, fiber: 4 },
  wall: { wood: 7, fiber: 3 }
};

function makePlayer(id) {
  const p = { x: rand(-12, 12), z: rand(-12, 12) };
  return {
    id,
    name: "Survivor-" + id.slice(0, 4),
    x: p.x, y: 1.72, z: p.z,
    yaw: 0, pitch: 0,
    hp: 100, food: 100, water: 100, stamina: 100,
    inv: { wood: 0, stone: 0, fiber: 0, berries: 3, hide: 0, axe: 0, spear: 0, campfire: 0, foundation: 0, wall: 0 },
    lastGather: 0, lastAttack: 0
  };
}

function publicPlayer(p) {
  return {
    id: p.id, name: p.name, x: p.x, y: p.y, z: p.z,
    yaw: p.yaw, hp: p.hp, food: p.food, water: p.water, stamina: p.stamina
  };
}

function inventoryEnough(inv, cost) {
  return Object.entries(cost).every(([k, v]) => (inv[k] || 0) >= v);
}
function pay(inv, cost) {
  for (const [k, v] of Object.entries(cost)) inv[k] -= v;
}
function sendSelf(socket, p) {
  socket.emit("self", {
    hp: p.hp, food: p.food, water: p.water, stamina: p.stamina,
    inv: p.inv
  });
}

io.on("connection", socket => {
  const p = makePlayer(socket.id);
  players.set(socket.id, p);

  socket.emit("init", {
    id: socket.id,
    worldSize: WORLD,
    player: publicPlayer(p),
    resources: [...resources.values()],
    creatures: [...creatures.values()],
    structures: [...structures.values()]
  });
  sendSelf(socket, p);
  io.emit("feed", p.name + " entered the wilds.");

  socket.on("setName", name => {
    if (typeof name !== "string") return;
    p.name = name.replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 18) || p.name;
  });

  socket.on("move", data => {
    if (!data || !Number.isFinite(data.x) || !Number.isFinite(data.z)) return;
    p.x = clamp(data.x, -WORLD, WORLD);
    p.z = clamp(data.z, -WORLD, WORLD);
    if (Number.isFinite(data.yaw)) p.yaw = data.yaw;
    if (Number.isFinite(data.pitch)) p.pitch = clamp(data.pitch, -1.45, 1.45);
    if (Number.isFinite(data.stamina)) p.stamina = clamp(data.stamina, 0, 100);
  });

  socket.on("eat", () => {
    if ((p.inv.berries || 0) <= 0) return;
    p.inv.berries -= 1;
    p.food = clamp(p.food + 12, 0, 100);
    p.water = clamp(p.water + 4, 0, 100);
    sendSelf(socket, p);
  });

  socket.on("drink", () => {
    if (Math.abs(p.x) < 38 && p.z > 65 && p.z < 115) {
      p.water = 100;
      sendSelf(socket, p);
    }
  });

  socket.on("gather", ({ id, tool } = {}) => {
    const now = Date.now();
    if (now - p.lastGather < 450) return;
    const r = resources.get(String(id));
    if (!r || dist2(p, r) > 4.4) return;
    p.lastGather = now;

    const usingAxe = tool === "axe" && p.inv.axe > 0;
    let amount = 1;
    if (r.type === "tree" && usingAxe) amount = 3;
    if (r.type === "rock" && tool === "axe" && p.inv.axe > 0) amount = 2;

    if (r.type === "tree") p.inv.wood += amount;
    if (r.type === "rock") p.inv.stone += amount;
    if (r.type === "bush") {
      p.inv.fiber += 2;
      if (Math.random() < 0.8) p.inv.berries += 1;
    }

    r.hp -= 1;
    if (r.hp <= 0) {
      resources.delete(r.id);
      io.emit("resourceGone", r.id);
      setTimeout(() => {
        spawnResource(r.type);
        const newest = [...resources.values()].at(-1);
        if (newest) io.emit("resourceSpawn", newest);
      }, 12000);
    } else {
      io.emit("resourceHit", { id: r.id, hp: r.hp });
    }
    sendSelf(socket, p);
  });

  socket.on("craft", item => {
    if (!recipes[item]) return;
    const cost = recipes[item];
    if (!inventoryEnough(p.inv, cost)) return;
    pay(p.inv, cost);
    p.inv[item] = (p.inv[item] || 0) + 1;
    socket.emit("toast", "Crafted " + item);
    sendSelf(socket, p);
  });

  socket.on("attack", ({ creatureId, weapon } = {}) => {
    const now = Date.now();
    if (now - p.lastAttack < 500) return;
    const c = creatures.get(String(creatureId));
    if (!c || dist2(p, c) > 4.8) return;
    p.lastAttack = now;

    let damage = 7;
    if (weapon === "spear" && p.inv.spear > 0) damage = 24;
    else if (weapon === "axe" && p.inv.axe > 0) damage = 13;

    c.hp -= damage;
    c.target = p.id;
    io.emit("creatureHit", { id: c.id, hp: Math.max(0, c.hp) });

    if (c.hp <= 0) {
      const kind = c.kind;
      creatures.delete(c.id);
      p.inv.hide += kind === "mossback" ? 6 : 3;
      p.inv.food = p.inv.food || 0;
      socket.emit("toast", "Creature defeated. Hide collected.");
      io.emit("creatureGone", c.id);
      sendSelf(socket, p);
      setTimeout(() => {
        spawnCreature(kind);
        const newest = [...creatures.values()].at(-1);
        if (newest) io.emit("creatureSpawn", newest);
      }, 15000);
    }
  });

  socket.on("place", ({ type, x, z, yaw } = {}) => {
    if (!["foundation", "wall", "campfire"].includes(type)) return;
    if ((p.inv[type] || 0) <= 0) return;
    const pos = { x: Number(x), z: Number(z) };
    if (!Number.isFinite(pos.x) || !Number.isFinite(pos.z) || dist2(p, pos) > 7) return;
    p.inv[type] -= 1;
    const s = {
      id: String(nextStructureId++),
      owner: p.id,
      type,
      x: clamp(pos.x, -WORLD, WORLD),
      z: clamp(pos.z, -WORLD, WORLD),
      yaw: Number.isFinite(yaw) ? yaw : 0
    };
    structures.set(s.id, s);
    io.emit("structureSpawn", s);
    sendSelf(socket, p);
  });

  socket.on("disconnect", () => {
    players.delete(socket.id);
    io.emit("playerGone", socket.id);
    io.emit("feed", p.name + " left the wilds.");
  });
});

function respawnPlayer(p) {
  p.x = rand(-12, 12);
  p.z = rand(-12, 12);
  p.hp = 100;
  p.food = 80;
  p.water = 80;
  p.stamina = 100;
}

setInterval(() => {
  for (const [id, p] of players) {
    p.food = clamp(p.food - 0.32, 0, 100);
    p.water = clamp(p.water - 0.48, 0, 100);
    if (p.food <= 0 || p.water <= 0) p.hp = clamp(p.hp - 2.5, 0, 100);
    if (p.hp <= 0) {
      respawnPlayer(p);
      io.to(id).emit("toast", "You collapsed and woke up near the shore.");
    }
    const s = io.sockets.sockets.get(id);
    if (s) sendSelf(s, p);
  }
}, 1000);

setInterval(() => {
  const now = Date.now();
  for (const c of creatures.values()) {
    const def = creatureDefs[c.kind];
    let target = c.target ? players.get(c.target) : null;

    if (!target && def.aggro > 0) {
      let best = null;
      let bestD = def.aggro;
      for (const p of players.values()) {
        const d = dist2(c, p);
        if (d < bestD) { best = p; bestD = d; }
      }
      target = best;
      c.target = best ? best.id : null;
    }

    if (target && dist2(c, target) < def.aggro * 1.8 + 8) {
      const dx = target.x - c.x;
      const dz = target.z - c.z;
      const d = Math.max(0.001, Math.hypot(dx, dz));
      c.yaw = Math.atan2(dx, dz);
      c.x += (dx / d) * def.speed * 0.1;
      c.z += (dz / d) * def.speed * 0.1;

      if (d < 2.4 && now > c.attackAt) {
        c.attackAt = now + 1100;
        target.hp = clamp(target.hp - def.damage, 0, 100);
      }
      if (d > def.aggro * 1.8 + 8) c.target = null;
    } else {
      c.target = null;
      if (now > c.wanderUntil) {
        c.wanderUntil = now + rand(1500, 5000);
        c.yaw += rand(-1.2, 1.2);
      }
      c.x += Math.sin(c.yaw) * def.speed * 0.025;
      c.z += Math.cos(c.yaw) * def.speed * 0.025;
    }

    c.x = clamp(c.x, -WORLD, WORLD);
    c.z = clamp(c.z, -WORLD, WORLD);
  }
}, 100);

setInterval(() => {
  io.emit("snapshot", {
    players: [...players.values()].map(publicPlayer),
    creatures: [...creatures.values()].map(c => ({
      id: c.id, kind: c.kind, x: c.x, z: c.z, yaw: c.yaw, hp: c.hp, maxHp: c.maxHp
    }))
  });
}, 100);

server.listen(PORT, () => {
  console.log("Wildreach Online listening on http://localhost:" + PORT);
});
