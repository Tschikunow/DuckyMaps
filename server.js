"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const { WebSocketServer, WebSocket } = require("ws");

const {
  PLAYER_SKINS,
  PETS,
  MONSTER_FORMS,
  WEAPONS,
  TRACKS,
  BLOCKS,
  MINIGAMES,
  MAPS,
  MAP_SPECS,
  BUILD_WORLD,
  BATTLE_PASS,
  BESTIARY,
  clamp
} = require("./content");

const PORT = Number(process.env.PORT) || 3000;

const PHYSICS_HZ = 30;
const NETWORK_HZ = 12;
const DT = 1 / PHYSICS_HZ;

const publicDir = path.join(__dirname, "public");

const databaseUrl = process.env.DATABASE_URL || "";

const db = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false
    })
  : null;

const CLIENTS = new Map();
const LOBBIES = new Map();

const NAV_CACHE = new Map();
const PATH_CACHE = new Map();

const PLAYER = {
  radius: 18,
  walkSpeed: 158,
  accel: 1050,
  jumpDuration: 390,
  jumpLaunch: 250,
  jumpBonus: 28,
  jumpMax: 390,
  bunnyWindow: 500,
  maxChain: 5,
  swimMultiplier: 0.66,
  interactRadius: 145
};

const MODE_HP = {
  monster_hunt: 100,
  horror: 100,
  fog: 100,
  scp: 100,
  stormking: 180,
  battle_royale_ffa: 220,
  battle_royale_team: 240,
  ctf: 220,
  zombie: 180,
  prophunt: 120,
  build: 100,
  neon: 180,
  minigame: 100
};

const BOT_NAMES = [
  "[ACE] Juno",
  "[OWL] NightShift",
  "teapot_97",
  "qweriz 🐥",
  "[404] fox",
  "NotYourBot",
  "[NOVA] Emi",
  "LemonByte",
  "SleepyKai",
  "[WAVE] Luca",
  "miso_soup",
  "PixelNora",
  "[BIRD] Milo",
  "toast.png",
  "Kianツ",
  "[FROG] Finn",
  "Sora.jpg",
  "MayaWasHere",
  "[GG] Alex",
  "cloud.exe",
  "[DUCK] Niko",
  "Vivi_09",
  "MiloOnToast",
  "NoScopePotato",
  "[VOID] Ryn"
];

const PERSONALITIES = [
  "aggressive",
  "careful",
  "beginner",
  "pro",
  "troll",
  "teamplayer",
  "loner",
  "curious",
  "coward"
];

const ROUND_EVENTS = [
  "power_outage",
  "fog",
  "locked_area",
  "alarm",
  "flood",
  "npc_event",
  "secret_room"
];

const ROUND_MODIFIERS = [
  "monster_fast",
  "no_healing",
  "double_loot",
  "random_locked_doors",
  "night_mode",
  "two_monsters"
];

function id(prefix = "") {
  return (
    prefix +
    crypto
      .randomUUID()
      .replaceAll("-", "")
      .slice(0, 14)
  );
}

function lobbyCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let value = "";

  for (let i = 0; i < 6; i += 1) {
    value += chars[crypto.randomInt(0, chars.length)];
  }

  return value;
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalize(x, y) {
  const length = Math.hypot(x, y);

  if (length < 0.0001) {
    return { x: 0, y: 0 };
  }

  return {
    x: x / length,
    y: y / length
  };
}

function safeName(value) {
  return String(value || "Ducky")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 24) || "Ducky";
}

function safeText(value, length = 220) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, length);
}

function safeId(value) {
  return String(value || "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80);
}

function send(ws, payload) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastLobby(lobby, payload, exceptClientId = null) {
  const text = JSON.stringify(payload);

  for (const clientId of lobby.members) {
    if (clientId === exceptClientId) {
      continue;
    }

    const client = CLIENTS.get(clientId);

    if (
      client &&
      client.ws.readyState === WebSocket.OPEN
    ) {
      client.ws.send(text);
    }
  }
}

function getLobbyPlayers(lobby) {
  const result = [];

  for (const clientId of lobby.members) {
    const client = CLIENTS.get(clientId);

    if (client?.player) {
      result.push(client.player);
    }
  }

  return result;
}

function getMap(lobby) {
  return lobby.mode === "build"
    ? BUILD_WORLD
    : MAPS[lobby.mapId] || MAPS.concert;
}

function isWater(map, x, y) {
  return map.water.some(
    (water) =>
      x >= water.x &&
      x <= water.x + water.w &&
      y >= water.y &&
      y <= water.y + water.h
  );
}

function circleRectCollision(cx, cy, radius, rect) {
  const nearestX = clamp(cx, rect.x, rect.x + rect.w);
  const nearestY = clamp(cy, rect.y, rect.y + rect.h);

  const dx = cx - nearestX;
  const dy = cy - nearestY;

  return dx * dx + dy * dy < radius * radius;
}

function collides(map, world, x, y, radius, ignoreDoors = false) {
  if (
    x - radius < 0 ||
    y - radius < 0 ||
    x + radius > map.width ||
    y + radius > map.height
  ) {
    return true;
  }

  for (const wall of map.walls) {
    if (circleRectCollision(x, y, radius, wall)) {
      return true;
    }
  }

  for (const prop of map.props) {
    if (!prop.solid) continue;

    if (circleRectCollision(x, y, radius, prop)) {
      return true;
    }
  }

  if (!ignoreDoors) {
    for (const door of world.doors) {
      if (door.amount > 0.67 || door.locked) {
        if (!door.locked) {
          continue;
        }
      }

      if (circleRectCollision(x, y, radius, door)) {
        return true;
      }
    }
  }

  for (const block of world.buildBlocks.values()) {
    if (
      Math.abs(block.x - x) < 44 + radius &&
      Math.abs(block.y - y) < 44 + radius
    ) {
      return true;
    }
  }

  return false;
}

function moveEntity(map, world, entity, dx, dy, phaseWalls = false) {
  const radius = entity.radius || PLAYER.radius;

  const nextX = entity.x + dx;

  if (
    phaseWalls ||
    !collides(map, world, nextX, entity.y, radius)
  ) {
    entity.x = clamp(nextX, radius, map.width - radius);
  } else {
    entity.vx = 0;
  }

  const nextY = entity.y + dy;

  if (
    phaseWalls ||
    !collides(map, world, entity.x, nextY, radius)
  ) {
    entity.y = clamp(nextY, radius, map.height - radius);
  } else {
    entity.vy = 0;
  }
}

/* ----------------------------------------------------------
   Datenbank / Accounts
---------------------------------------------------------- */

function defaultProfile() {
  return {
    coins: 500,
    xp: 0,
    battlePassTier: 1,
    ownedSkins: ["skin_1", "skin_2", "skin_3"],
    ownedWeapons: ["weapon_1"],
    pets: [],
    selectedSkin: "skin_1",
    selectedWeapon: "weapon_1",
    selectedPet: null,
    unlockedBestiary: [],
    completedChallenges: [],
    stats: {
      rounds: 0,
      wins: 0,
      playSeconds: 0,
      revives: 0,
      petsFound: 0
    }
  };
}

function normalizeProfile(profile) {
  const base = defaultProfile();

  if (!profile || typeof profile !== "object") {
    return base;
  }

  return {
    ...base,
    ...profile,
    ownedSkins: Array.isArray(profile.ownedSkins)
      ? profile.ownedSkins
      : base.ownedSkins,
    ownedWeapons: Array.isArray(profile.ownedWeapons)
      ? profile.ownedWeapons
      : base.ownedWeapons,
    pets: Array.isArray(profile.pets)
      ? profile.pets
      : [],
    unlockedBestiary: Array.isArray(profile.unlockedBestiary)
      ? profile.unlockedBestiary
      : [],
    completedChallenges: Array.isArray(profile.completedChallenges)
      ? profile.completedChallenges
      : [],
    stats: {
      ...base.stats,
      ...(profile.stats || {})
    }
  };
}

async function initDb() {
  if (!db) {
    console.log("DATABASE_URL fehlt: Accounts laufen nur als Gast.");
    return;
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      profile JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS friendships (
      user_a BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_b BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      requested_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_a, user_b)
    );

    CREATE TABLE IF NOT EXISTS chat_groups (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS group_members (
      group_id BIGINT NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (group_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id BIGSERIAL PRIMARY KEY,
      kind TEXT NOT NULL,
      group_id BIGINT REFERENCES chat_groups(id) ON DELETE CASCADE,
      from_user BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      to_user BIGINT REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS build_saves (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  await db.query(
    `
      INSERT INTO sessions(token_hash, user_id, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '30 days')
    `,
    [tokenHash, userId]
  );

  return token;
}

async function authFromRequest(req) {
  if (!db) {
    return null;
  }

  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice(7);

  const result = await db.query(
    `
      SELECT u.id, u.username, u.display_name, u.profile
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.expires_at > NOW()
    `,
    [hashToken(token)]
  );

  if (!result.rows[0]) {
    return null;
  }

  return {
    id: Number(result.rows[0].id),
    username: result.rows[0].username,
    displayName: result.rows[0].display_name,
    profile: normalizeProfile(result.rows[0].profile)
  };
}

async function saveProfile(userId, profile) {
  if (!db || !userId) return;

  await db.query(
    `UPDATE users SET profile = $1 WHERE id = $2`,
    [JSON.stringify(profile), userId]
  );
}

function json(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });

  res.end(JSON.stringify(data));
}

function readBody(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (body.length > limit) {
        reject(new Error("body too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("invalid json"));
      }
    });

    req.on("error", reject);
  });
}

async function handleApi(req, res, pathname) {
  if (pathname === "/api/catalog" && req.method === "GET") {
    json(res, 200, {
      maps: MAP_SPECS.map((map) => ({
        id: map.id,
        name: map.name,
        subtitle: map.subtitle,
        dark: Boolean(map.dark),
        theme: map.theme,
        modeHint: map.modeHint || null
      })),
      skins: PLAYER_SKINS,
      pets: PETS,
      monsterForms: MONSTER_FORMS,
      weapons: WEAPONS,
      tracks: TRACKS,
      blocks: BLOCKS,
      minigames: MINIGAMES,
      battlePass: BATTLE_PASS,
      bestiary: BESTIARY
    });

    return true;
  }

  if (pathname === "/api/register" && req.method === "POST") {
    if (!db) {
      json(res, 503, {
        error: "Für Accounts muss DATABASE_URL gesetzt sein."
      });

      return true;
    }

    const body = await readBody(req);

    const username = safeText(body.username, 20).toLowerCase();
    const displayName = safeName(body.displayName || body.username);
    const password = String(body.password || "");

    if (!/^[a-z0-9_-]{3,20}$/.test(username)) {
      json(res, 400, {
        error: "Benutzername: 3–20 Zeichen, Buchstaben, Zahlen, _ oder -."
      });

      return true;
    }

    if (password.length < 8 || password.length > 100) {
      json(res, 400, {
        error: "Passwort muss mindestens 8 Zeichen haben."
      });

      return true;
    }

    try {
      const passwordHash = await bcrypt.hash(password, 12);
      const profile = defaultProfile();

      const result = await db.query(
        `
          INSERT INTO users(username, display_name, password_hash, profile)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `,
        [username, displayName, passwordHash, JSON.stringify(profile)]
      );

      const userId = Number(result.rows[0].id);
      const token = await createSession(userId);

      json(res, 200, {
        token,
        user: {
          id: userId,
          username,
          displayName,
          profile
        }
      });
    } catch (error) {
      if (error.code === "23505") {
        json(res, 409, {
          error: "Dieser Benutzername ist bereits vergeben."
        });
      } else {
        console.error(error);

        json(res, 500, {
          error: "Registrierung fehlgeschlagen."
        });
      }
    }

    return true;
  }

  if (pathname === "/api/login" && req.method === "POST") {
    if (!db) {
      json(res, 503, {
        error: "Für Accounts muss DATABASE_URL gesetzt sein."
      });

      return true;
    }

    const body = await readBody(req);

    const username = safeText(body.username, 20).toLowerCase();
    const password = String(body.password || "");

    const result = await db.query(
      `
        SELECT id, username, display_name, password_hash, profile
        FROM users
        WHERE username = $1
      `,
      [username]
    );

    const row = result.rows[0];

    if (
      !row ||
      !(await bcrypt.compare(password, row.password_hash))
    ) {
      json(res, 401, {
        error: "Benutzername oder Passwort stimmt nicht."
      });

      return true;
    }

    const token = await createSession(Number(row.id));

    json(res, 200, {
      token,
      user: {
        id: Number(row.id),
        username: row.username,
        displayName: row.display_name,
        profile: normalizeProfile(row.profile)
      }
    });

    return true;
  }

  if (pathname === "/api/me" && req.method === "GET") {
    const user = await authFromRequest(req);

    if (!user) {
      json(res, 401, { error: "Nicht angemeldet." });
      return true;
    }

    json(res, 200, { user });

    return true;
  }

  if (pathname === "/api/social" && req.method === "GET") {
    const user = await authFromRequest(req);

    if (!user) {
      json(res, 401, { error: "Nicht angemeldet." });
      return true;
    }

    const friends = await db.query(
      `
        SELECT
          CASE
            WHEN f.user_a = $1 THEN b.id
            ELSE a.id
          END AS id,
          CASE
            WHEN f.user_a = $1 THEN b.username
            ELSE a.username
          END AS username,
          CASE
            WHEN f.user_a = $1 THEN b.display_name
            ELSE a.display_name
          END AS display_name,
          f.status,
          f.requested_by
        FROM friendships f
        JOIN users a ON a.id = f.user_a
        JOIN users b ON b.id = f.user_b
        WHERE f.user_a = $1 OR f.user_b = $1
      `,
      [user.id]
    );

    const groups = await db.query(
      `
        SELECT g.id, g.name, g.owner_id
        FROM chat_groups g
        JOIN group_members gm ON gm.group_id = g.id
        WHERE gm.user_id = $1
        ORDER BY g.id DESC
      `,
      [user.id]
    );

    json(res, 200, {
      friends: friends.rows.map((row) => ({
        id: Number(row.id),
        username: row.username,
        displayName: row.display_name,
        status: row.status,
        requestedBy: Number(row.requested_by)
      })),
      groups: groups.rows.map((row) => ({
        id: Number(row.id),
        name: row.name,
        ownerId: Number(row.owner_id)
      }))
    });

    return true;
  }

  if (pathname === "/api/friends/request" && req.method === "POST") {
    const user = await authFromRequest(req);

    if (!user) {
      json(res, 401, { error: "Nicht angemeldet." });
      return true;
    }

    const body = await readBody(req);

    const username = safeText(body.username, 20).toLowerCase();

    const targetResult = await db.query(
      `SELECT id FROM users WHERE username = $1`,
      [username]
    );

    if (!targetResult.rows[0]) {
      json(res, 404, { error: "Account nicht gefunden." });
      return true;
    }

    const targetId = Number(targetResult.rows[0].id);

    if (targetId === user.id) {
      json(res, 400, { error: "Du kannst dich nicht selbst hinzufügen." });
      return true;
    }

    const a = Math.min(user.id, targetId);
    const b = Math.max(user.id, targetId);

    await db.query(
      `
        INSERT INTO friendships(user_a, user_b, requested_by, status)
        VALUES ($1, $2, $3, 'pending')
        ON CONFLICT (user_a, user_b)
        DO UPDATE SET requested_by = $3, status = 'pending'
      `,
      [a, b, user.id]
    );

    json(res, 200, { ok: true });

    return true;
  }

  if (pathname === "/api/friends/accept" && req.method === "POST") {
    const user = await authFromRequest(req);
    const body = await readBody(req);

    if (!user) {
      json(res, 401, { error: "Nicht angemeldet." });
      return true;
    }

    const otherId = Number(body.userId);

    const a = Math.min(user.id, otherId);
    const b = Math.max(user.id, otherId);

    await db.query(
      `
        UPDATE friendships
        SET status = 'accepted'
        WHERE user_a = $1
          AND user_b = $2
          AND requested_by <> $3
      `,
      [a, b, user.id]
    );

    json(res, 200, { ok: true });

    return true;
  }

  if (pathname === "/api/groups/create" && req.method === "POST") {
    const user = await authFromRequest(req);
    const body = await readBody(req);

    if (!user) {
      json(res, 401, { error: "Nicht angemeldet." });
      return true;
    }

    const name = safeText(body.name, 40) || "Gruppe";

    const created = await db.query(
      `
        INSERT INTO chat_groups(name, owner_id)
        VALUES ($1, $2)
        RETURNING id
      `,
      [name, user.id]
    );

    const groupId = Number(created.rows[0].id);

    await db.query(
      `
        INSERT INTO group_members(group_id, user_id)
        VALUES ($1, $2)
      `,
      [groupId, user.id]
    );

    json(res, 200, {
      group: {
        id: groupId,
        name
      }
    });

    return true;
  }

  if (pathname === "/api/groups/invite" && req.method === "POST") {
    const user = await authFromRequest(req);
    const body = await readBody(req);

    if (!user) {
      json(res, 401, { error: "Nicht angemeldet." });
      return true;
    }

    const groupId = Number(body.groupId);
    const friendId = Number(body.userId);

    const owner = await db.query(
      `
        SELECT id
        FROM chat_groups
        WHERE id = $1 AND owner_id = $2
      `,
      [groupId, user.id]
    );

    if (!owner.rows[0]) {
      json(res, 403, { error: "Nur der Gruppenbesitzer kann einladen." });
      return true;
    }

    await db.query(
      `
        INSERT INTO group_members(group_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `,
      [groupId, friendId]
    );

    json(res, 200, { ok: true });

    return true;
  }

  if (pathname === "/api/shop/buy" && req.method === "POST") {
    const user = await authFromRequest(req);
    const body = await readBody(req);

    if (!user) {
      json(res, 401, { error: "Nicht angemeldet." });
      return true;
    }

    const itemId = safeId(body.itemId);

    const skin = PLAYER_SKINS.find((item) => item.id === itemId);
    const weapon = WEAPONS.find((item) => item.id === itemId);

    if (!skin && !weapon) {
      json(res, 404, { error: "Gegenstand nicht gefunden." });
      return true;
    }

    const profile = normalizeProfile(user.profile);

    let price;

    if (skin) {
      if (skin.secret || skin.challenge) {
        json(res, 400, {
          error: "Secret-/Challenge-Skins werden nicht gekauft."
        });

        return true;
      }

      price =
        skin.rarity === "legendary"
          ? 2500
          : skin.rarity === "epic"
            ? 1400
            : skin.rarity === "rare"
              ? 800
              : 350;

      if (profile.ownedSkins.includes(itemId)) {
        json(res, 400, { error: "Bereits im Spind." });
        return true;
      }
    } else {
      price = weapon.price;

      if (profile.ownedWeapons.includes(itemId)) {
        json(res, 400, { error: "Bereits im Inventar." });
        return true;
      }
    }

    if (profile.coins < price) {
      json(res, 400, { error: "Nicht genug Coins." });
      return true;
    }

    profile.coins -= price;

    if (skin) {
      profile.ownedSkins.push(itemId);
    } else {
      profile.ownedWeapons.push(itemId);
    }

    await saveProfile(user.id, profile);

    json(res, 200, { profile });

    return true;
  }

  if (pathname === "/api/profile/equip" && req.method === "POST") {
    const user = await authFromRequest(req);
    const body = await readBody(req);

    if (!user) {
      json(res, 401, { error: "Nicht angemeldet." });
      return true;
    }

    const profile = normalizeProfile(user.profile);

    if (body.skin && profile.ownedSkins.includes(body.skin)) {
      profile.selectedSkin = body.skin;
    }

    if (body.weapon && profile.ownedWeapons.includes(body.weapon)) {
      profile.selectedWeapon = body.weapon;
    }

    if (
      body.pet === null ||
      profile.pets.includes(body.pet)
    ) {
      profile.selectedPet = body.pet;
    }

    await saveProfile(user.id, profile);

    json(res, 200, { profile });

    return true;
  }

  if (pathname === "/api/build/save" && req.method === "POST") {
    const user = await authFromRequest(req);
    const body = await readBody(req, 5_000_000);

    if (!user) {
      json(res, 401, { error: "Nicht angemeldet." });
      return true;
    }

    const name = safeText(body.name, 60) || "Meine Map";
    const blocks = Array.isArray(body.blocks)
      ? body.blocks.slice(0, 10000)
      : [];

    const saved = await db.query(
      `
        INSERT INTO build_saves(user_id, name, data)
        VALUES ($1, $2, $3)
        RETURNING id
      `,
      [user.id, name, JSON.stringify({ blocks })]
    );

    json(res, 200, {
      id: Number(saved.rows[0].id)
    });

    return true;
  }

  return false;
}

/* ----------------------------------------------------------
   Navigation
---------------------------------------------------------- */

const NAV_CELL = 96;

function navKey(map) {
  return map.id;
}

function buildNavGrid(map) {
  const key = navKey(map);

  if (NAV_CACHE.has(key)) {
    return NAV_CACHE.get(key);
  }

  const cols = Math.ceil(map.width / NAV_CELL);
  const rows = Math.ceil(map.height / NAV_CELL);

  const blocked = new Uint8Array(cols * rows);

  for (let gy = 0; gy < rows; gy += 1) {
    for (let gx = 0; gx < cols; gx += 1) {
      const x = gx * NAV_CELL + NAV_CELL / 2;
      const y = gy * NAV_CELL + NAV_CELL / 2;

      let isBlocked = false;

      for (const wall of map.walls) {
        if (
          x >= wall.x - 28 &&
          x <= wall.x + wall.w + 28 &&
          y >= wall.y - 28 &&
          y <= wall.y + wall.h + 28
        ) {
          isBlocked = true;
          break;
        }
      }

      if (!isBlocked) {
        for (const prop of map.props) {
          if (!prop.solid) continue;

          if (
            x >= prop.x - 24 &&
            x <= prop.x + prop.w + 24 &&
            y >= prop.y - 24 &&
            y <= prop.y + prop.h + 24
          ) {
            isBlocked = true;
            break;
          }
        }
      }

      blocked[gy * cols + gx] = isBlocked ? 1 : 0;
    }
  }

  /* Türen sind bewusst passierbar: KI öffnet sie automatisch. */

  for (const door of map.doors) {
    const gx = Math.floor((door.x + door.w / 2) / NAV_CELL);
    const gy = Math.floor((door.y + door.h / 2) / NAV_CELL);

    if (gx >= 0 && gy >= 0 && gx < cols && gy < rows) {
      blocked[gy * cols + gx] = 0;
    }
  }

  const grid = {
    cols,
    rows,
    blocked
  };

  NAV_CACHE.set(key, grid);

  return grid;
}

function cellFromPoint(map, x, y) {
  const grid = buildNavGrid(map);

  return {
    x: clamp(Math.floor(x / NAV_CELL), 0, grid.cols - 1),
    y: clamp(Math.floor(y / NAV_CELL), 0, grid.rows - 1)
  };
}

function pointFromCell(cell) {
  return {
    x: cell.x * NAV_CELL + NAV_CELL / 2,
    y: cell.y * NAV_CELL + NAV_CELL / 2
  };
}

function findPath(map, fromX, fromY, toX, toY) {
  if (map.buildOnly) {
    return [{ x: toX, y: toY }];
  }

  const grid = buildNavGrid(map);

  const start = cellFromPoint(map, fromX, fromY);
  const goal = cellFromPoint(map, toX, toY);

  const cacheKey =
    `${map.id}:${start.x},${start.y}:${goal.x},${goal.y}`;

  const cached = PATH_CACHE.get(cacheKey);

  if (cached) {
    return cached;
  }

  const index = (x, y) => y * grid.cols + x;

  const startIndex = index(start.x, start.y);
  const goalIndex = index(goal.x, goal.y);

  const open = new Set([startIndex]);

  const came = new Int32Array(grid.cols * grid.rows);
  const g = new Float32Array(grid.cols * grid.rows);
  const f = new Float32Array(grid.cols * grid.rows);

  came.fill(-1);
  g.fill(Infinity);
  f.fill(Infinity);

  g[startIndex] = 0;

  const heuristic = (x, y) =>
    Math.abs(x - goal.x) + Math.abs(y - goal.y);

  f[startIndex] = heuristic(start.x, start.y);

  const neighbors = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];

  let guard = 0;

  while (open.size && guard < 5000) {
    guard += 1;

    let current = -1;
    let currentScore = Infinity;

    for (const candidate of open) {
      if (f[candidate] < currentScore) {
        currentScore = f[candidate];
        current = candidate;
      }
    }

    if (current === goalIndex) {
      const route = [];
      let cursor = current;

      while (cursor !== -1) {
        const x = cursor % grid.cols;
        const y = Math.floor(cursor / grid.cols);

        route.push(pointFromCell({ x, y }));

        cursor = came[cursor];
      }

      route.reverse();

      route.push({
        x: toX,
        y: toY
      });

      if (PATH_CACHE.size > 1500) {
        PATH_CACHE.clear();
      }

      PATH_CACHE.set(cacheKey, route);

      return route;
    }

    open.delete(current);

    const cx = current % grid.cols;
    const cy = Math.floor(current / grid.cols);

    for (const [dx, dy] of neighbors) {
      const nx = cx + dx;
      const ny = cy + dy;

      if (
        nx < 0 ||
        ny < 0 ||
        nx >= grid.cols ||
        ny >= grid.rows
      ) {
        continue;
      }

      const next = index(nx, ny);

      if (grid.blocked[next]) {
        continue;
      }

      const score = g[current] + 1;

      if (score < g[next]) {
        came[next] = current;
        g[next] = score;
        f[next] = score + heuristic(nx, ny);
        open.add(next);
      }
    }
  }

  return [{ x: toX, y: toY }];
}

function lineOfSight(map, world, a, b) {
  const total = distance(a, b);

  if (total < 25) return true;

  const steps = Math.ceil(total / 40);

  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;

    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;

    for (const wall of map.walls) {
      if (
        x >= wall.x &&
        x <= wall.x + wall.w &&
        y >= wall.y &&
        y <= wall.y + wall.h
      ) {
        return false;
      }
    }
  }

  return true;
}

/* ----------------------------------------------------------
   Lobby / Welt
---------------------------------------------------------- */

function newPlayer(client, map, lobby) {
  const spawn =
    map.spawns[
      crypto.randomInt(0, map.spawns.length)
    ] || { x: 400, y: 400 };

  const profile = normalizeProfile(client.account?.profile);

  return {
    id: client.id,
    accountId: client.account?.id || null,
    name:
      client.account?.displayName ||
      client.displayName ||
      "Ducky",

    skin:
      profile.selectedSkin ||
      client.skin ||
      "skin_1",

    selectedWeapon:
      profile.selectedWeapon ||
      "weapon_1",

    selectedPet:
      profile.selectedPet || null,

    x: spawn.x + randomRange(-35, 35),
    y: spawn.y + randomRange(-35, 35),

    vx: 0,
    vy: 0,

    inputX: 0,
    inputY: 0,

    lastDirX: 1,
    lastDirY: 0,

    radius: PLAYER.radius,

    hp: MODE_HP[lobby.mode] || 100,
    maxHp: MODE_HP[lobby.mode] || 100,

    downed: false,
    eliminated: false,
    downedAt: 0,

    hidden: false,
    hideoutId: null,
    hideExitX: 0,
    hideExitY: 0,

    jumpHeld: false,
    airborne: false,
    jumpStartedAt: 0,
    lastLandedAt: 0,
    jumpChain: 0,

    speedBoostUntil: 0,
    protectedUntil: 0,

    fish: 0,
    catTotem: false,

    team:
      lobby.mode.includes("team") || lobby.mode === "ctf"
        ? lobby.members.size % 2
        : null,

    lastFireAt: 0,
    lastInteractAt: 0,

    vehicleId: null,

    propForm:
      lobby.mode === "prophunt"
        ? ["chair", "crate", "plant", "vending", "barrel"][
            crypto.randomInt(0, 5)
          ]
        : null,

    propMoving: false,

    bhopEnabled:
      lobby.options.bhop !== false,

    aliveSince: Date.now()
  };
}

function newBot(map, lobby, index) {
  const spawn =
    map.spawns[index % map.spawns.length] ||
    { x: 450, y: 450 };

  const personality =
    PERSONALITIES[index % PERSONALITIES.length];

  const skill = {
    beginner: 0.42,
    troll: 0.55,
    coward: 0.58,
    curious: 0.62,
    loner: 0.68,
    careful: 0.72,
    aggressive: 0.76,
    teamplayer: 0.8,
    pro: 0.92
  }[personality];

  return {
    id: id("bot_"),
    bot: true,

    name:
      BOT_NAMES[index % BOT_NAMES.length],

    skin:
      PLAYER_SKINS[
        (index * 11 + 3) %
          PLAYER_SKINS.length
      ].id,

    selectedWeapon:
      WEAPONS[
        (index * 7) %
          WEAPONS.length
      ].id,

    selectedPet:
      index % 5 === 0
        ? PETS[index % PETS.length].id
        : null,

    personality,
    skill,

    x: spawn.x + randomRange(-90, 90),
    y: spawn.y + randomRange(-90, 90),

    vx: 0,
    vy: 0,

    radius: PLAYER.radius,

    hp: MODE_HP[lobby.mode] || 100,
    maxHp: MODE_HP[lobby.mode] || 100,

    downed: false,
    eliminated: false,
    downedAt: 0,

    hidden: false,
    hideoutId: null,
    hideExitX: 0,
    hideExitY: 0,

    airborne: false,
    jumpStartedAt: 0,
    lastLandedAt: 0,

    path: [],
    pathIndex: 0,

    nextThinkAt:
      Date.now() +
      randomRange(250, 900),

    pauseUntil: 0,
    nextPauseOpportunity:
      Date.now() +
      randomRange(45000, 70000),

    lastChatAt: 0,
    lastFireAt: 0,

    relationship: new Map(),

    command: null,
    commandTarget: null,

    team:
      lobby.mode.includes("team") ||
      lobby.mode === "ctf"
        ? index % 2
        : null,

    vehicleId: null,

    propForm:
      lobby.mode === "prophunt"
        ? ["chair", "crate", "plant", "vending", "barrel"][
            index % 5
          ]
        : null,

    seeker:
      lobby.mode === "prophunt" &&
      index === 0
  };
}

function newMonster(map, lobby, index = 0) {
  const spawn =
    map.monsterSpawn ||
    {
      x: map.width - 350,
      y: map.height - 350
    };

  return {
    id: id("monster_"),

    kind: "monster",
    form:
      lobby.options.monsterForm ||
      MONSTER_FORMS[
        index % MONSTER_FORMS.length
      ].id,

    x: spawn.x + index * 90,
    y: spawn.y + index * 70,

    vx: 0,
    vy: 0,

    radius: 25,

    path: [],
    pathIndex: 0,

    targetId: null,

    lastKnownX: spawn.x,
    lastKnownY: spawn.y,
    memoryUntil: 0,

    nextThinkAt: 0,

    sprintUntil: 0,
    nextSprintAt:
      Date.now() +
      randomRange(16000, 28000),

    nextAbilityAt:
      Date.now() + 60000
  };
}

function createWorld(lobby) {
  const map = getMap(lobby);

  const world = {
    doors: map.doors.map((entry) => ({
      ...entry,
      amount: 0,
      locked: false
    })),

    hideouts: new Map(
      map.hideouts.map((entry) => [
        entry.id,
        {
          ...entry,
          occupantId: null
        }
      ])
    ),

    bots: [],
    monsters: [],
    scps: [],
    zombies: [],

    boss: null,

    vehicles: new Map(
      map.vehicles.map((vehicle) => [
        vehicle.id,
        {
          ...vehicle,
          vx: 0,
          vy: 0,
          driverId: null
        }
      ])
    ),

    buildBlocks: new Map(),

    noise: null,

    powerOn: true,
    fogAmount: 0,

    event: null,
    eventUntil: 0,
    nextEventAt:
      Date.now() + 70000,

    petPickup: null,

    cat:
      map.catSpawn
        ? {
            id: "map_cat",
            x: map.catSpawn.x,
            y: map.catSpawn.y,
            ownerId: null,
            active: true
          }
        : null,

    roundStartedAt: Date.now(),
    roundEndsAt:
      Date.now() +
      (lobby.mode === "stormking"
        ? 12 * 60_000
        : 7 * 60_000),

    phase: "playing",

    voteCandidates: [],
    votes: new Map(),
    votingEndsAt: 0,

    ctf: {
      score: [0, 0],
      flags: [
        {
          team: 0,
          x: 350,
          y: map.height / 2,
          carrierId: null
        },
        {
          team: 1,
          x: map.width - 350,
          y: map.height / 2,
          carrierId: null
        }
      ]
    },

    zombieWave: 1,
    nextZombieWaveAt: Date.now() + 25000,

    buildTime: 0.28,

    minigame:
      createMinigameState(
        lobby.options.minigameId ||
        "color_floor"
      )
  };

  const botCount =
    clamp(
      Number(lobby.options.botCount) || 0,
      0,
      20
    );

  for (let i = 0; i < botCount; i += 1) {
    world.bots.push(
      newBot(map, lobby, i)
    );
  }

  initializeMode(lobby, world);

  spawnRoundPet(map, world);

  return world;
}

function initializeMode(lobby, world) {
  const map = getMap(lobby);

  switch (lobby.mode) {
    case "monster_hunt":
      world.monsters.push(
        newMonster(map, lobby)
      );

      if (
        lobby.options.modifiers?.includes(
          "two_monsters"
        )
      ) {
        world.monsters.push(
          newMonster(map, lobby, 1)
        );
      }
      break;

    case "fog": {
      const types = [
        "hunter",
        "stalker",
        "brute",
        "mimic",
        "crawler",
        "phantom"
      ];

      world.monsters = types.map(
        (type, index) => ({
          ...newMonster(map, lobby, index),
          fogType: type,
          form:
            {
              hunter: "wolf",
              stalker: "tall_man",
              brute: "stone",
              mimic: "shadow",
              crawler: "crawler",
              phantom: "ghost"
            }[type]
        })
      );

      world.fogAmount = 0.58;
      break;
    }

    case "scp":
      world.scps = [
        makeScp("scp096", map.width * 0.8, map.height * 0.2),
        makeScp("scp173", map.width * 0.2, map.height * 0.78),
        makeScp("scp999", map.width * 0.55, map.height * 0.55),
        makeScp("scp049", map.width * 0.78, map.height * 0.75),
        makeScp("scp106", map.width * 0.5, map.height * 0.18)
      ];
      break;

    case "stormking":
      world.boss = {
        id: "stormking",
        kind: "stormking",
        x: map.width / 2,
        y: map.height / 2,
        radius: 80,
        hp: 18000,
        maxHp: 18000,
        phase: 1,
        nextMoveAt: 0,
        nextAttackAt: Date.now() + 5000,
        attack: null,
        attackUntil: 0
      };
      break;

    case "zombie":
      spawnZombieWave(lobby, world, 10);
      break;

    case "prophunt":
      break;

    case "build":
      break;

    default:
      break;
  }
}

function makeScp(type, x, y) {
  return {
    id: id("scp_"),
    type,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: type === "scp999" ? 23 : 26,
    path: [],
    pathIndex: 0,
    nextThinkAt: 0,
    aggroTargetId: null,
    phaseUntil: 0
  };
}

function spawnRoundPet(map, world) {
  const candidates = PETS.filter(
    (pet) => pet.id !== "cat"
  );

  const pet =
    candidates[
      crypto.randomInt(0, candidates.length)
    ];

  world.petPickup = {
    petId: pet.id,
    x: randomRange(300, map.width - 300),
    y: randomRange(300, map.height - 300),
    active: true
  };
}

function createMinigameState(idValue) {
  return {
    id:
      MINIGAMES.some(
        (game) => game.id === idValue
      )
        ? idValue
        : "color_floor",

    startedAt: Date.now(),

    score: {},

    targetColor:
      ["red", "blue", "green", "yellow"][
        crypto.randomInt(0, 4)
      ],

    nextStageAt: Date.now() + 7000,

    simonSequence: [
      crypto.randomInt(0, 4)
    ],

    ttt: Array(9).fill(null),

    durak: null
  };
}

function createLobby(client, data) {
  let code;

  do {
    code = lobbyCode();
  } while (LOBBIES.has(code));

  const mapId =
    MAPS[data.mapId]
      ? data.mapId
      : "concert";

  const mode = [
    "monster_hunt",
    "horror",
    "fog",
    "scp",
    "stormking",
    "battle_royale_ffa",
    "battle_royale_team",
    "ctf",
    "zombie",
    "prophunt",
    "build",
    "neon",
    "minigame"
  ].includes(data.mode)
    ? data.mode
    : "monster_hunt";

  const lobby = {
    code,
    hostId: client.id,

    mapId,
    mode,

    private:
      Boolean(data.private),

    members: new Set(),

    options: {
      botCount:
        clamp(
          Number(data.botCount) || 7,
          0,
          20
        ),

      bhop:
        data.bhop !== false,

      monsterForm:
        MONSTER_FORMS.some(
          (form) =>
            form.id === data.monsterForm
        )
          ? data.monsterForm
          : "shadow",

      randomEvents:
        data.randomEvents !== false,

      events:
        Array.isArray(data.events)
          ? data.events.filter(
              (event) =>
                ROUND_EVENTS.includes(event)
            )
          : [...ROUND_EVENTS],

      modifiers:
        Array.isArray(data.modifiers)
          ? data.modifiers.filter(
              (modifier) =>
                ROUND_MODIFIERS.includes(
                  modifier
                )
            )
          : [],

      minigameId:
        safeId(data.minigameId) ||
        "color_floor"
    },

    world: null,

    createdAt: Date.now()
  };

  LOBBIES.set(code, lobby);

  joinLobby(client, code);

  return lobby;
}

function joinLobby(client, code) {
  const lobby = LOBBIES.get(
    String(code || "").toUpperCase()
  );

  if (!lobby) {
    send(client.ws, {
      type: "error",
      message: "Server nicht gefunden."
    });

    return false;
  }

  if (client.lobbyCode) {
    leaveLobby(client);
  }

  client.lobbyCode = lobby.code;

  lobby.members.add(client.id);

  if (!lobby.world) {
    lobby.world = createWorld(lobby);
  }

  const map = getMap(lobby);

  client.player = newPlayer(
    client,
    map,
    lobby
  );

  send(client.ws, {
    type: "lobbyJoined",
    lobby: publicLobby(lobby),
    playerId: client.id,
    map
  });

  broadcastLobby(lobby, {
    type: "lobbyInfo",
    lobby: publicLobby(lobby)
  });

  return true;
}

function leaveLobby(client) {
  if (!client.lobbyCode) return;

  const lobby = LOBBIES.get(client.lobbyCode);

  if (!lobby) {
    client.lobbyCode = null;
    client.player = null;
    return;
  }

  releaseHideout(lobby.world, client.player);
  releaseVehicle(lobby.world, client.player);

  lobby.members.delete(client.id);

  if (lobby.hostId === client.id) {
    lobby.hostId =
      lobby.members.values().next().value ||
      null;
  }

  if (!lobby.members.size) {
    LOBBIES.delete(lobby.code);
  } else {
    broadcastLobby(lobby, {
      type: "lobbyInfo",
      lobby: publicLobby(lobby)
    });
  }

  client.lobbyCode = null;
  client.player = null;
}

function publicLobby(lobby) {
  return {
    code: lobby.code,
    hostId: lobby.hostId,
    mapId: lobby.mapId,
    mode: lobby.mode,
    private: lobby.private,
    options: lobby.options,
    players: [...lobby.members]
      .map((clientId) => CLIENTS.get(clientId))
      .filter(Boolean)
      .map((client) => ({
        id: client.id,
        name:
          client.player?.name ||
          client.displayName,
        accountId:
          client.account?.id ||
          null
      }))
  };
}

/* ----------------------------------------------------------
   Hiding / Vehicle
---------------------------------------------------------- */

function releaseHideout(world, entity) {
  if (!world || !entity?.hideoutId) return;

  const hideout =
    world.hideouts.get(entity.hideoutId);

  if (
    hideout &&
    hideout.occupantId === entity.id
  ) {
    hideout.occupantId = null;
  }

  entity.hideoutId = null;
  entity.hidden = false;
}

function enterHideout(world, entity, hideout) {
  if (
    !hideout ||
    hideout.occupantId ||
    entity.vehicleId
  ) {
    return false;
  }

  releaseHideout(world, entity);

  entity.hideExitX = hideout.entranceX;
  entity.hideExitY = hideout.entranceY;

  entity.x = hideout.hideX;
  entity.y = hideout.hideY;

  entity.hidden = true;
  entity.hideoutId = hideout.id;

  entity.vx = 0;
  entity.vy = 0;

  hideout.occupantId = entity.id;

  return true;
}

function exitHideout(world, entity) {
  if (!entity?.hidden) {
    return false;
  }

  const x = entity.hideExitX;
  const y = entity.hideExitY;

  releaseHideout(world, entity);

  entity.x = x;
  entity.y = y;

  return true;
}

function releaseVehicle(world, entity) {
  if (!world || !entity?.vehicleId) return;

  const vehicle =
    world.vehicles.get(entity.vehicleId);

  if (
    vehicle &&
    vehicle.driverId === entity.id
  ) {
    vehicle.driverId = null;
  }

  entity.vehicleId = null;
}

function enterVehicle(world, entity, vehicle) {
  if (
    !vehicle ||
    vehicle.driverId ||
    entity.hidden
  ) {
    return false;
  }

  vehicle.driverId = entity.id;

  entity.vehicleId = vehicle.id;
  entity.x = vehicle.x;
  entity.y = vehicle.y;

  return true;
}

/* ----------------------------------------------------------
   Damage / Respawn
---------------------------------------------------------- */

function applyDamage(lobby, entity, amount, source = "game") {
  const now = Date.now();

  if (
    entity.downed ||
    entity.eliminated ||
    entity.hidden ||
    entity.protectedUntil > now
  ) {
    return;
  }

  if (entity.catTotem) {
    entity.catTotem = false;
    entity.hp = Math.max(45, entity.hp);
    entity.protectedUntil = now + 3000;

    if (lobby.world.cat?.ownerId === entity.id) {
      lobby.world.cat.active = false;
      lobby.world.cat.ownerId = null;
    }

    broadcastLobby(lobby, {
      type: "toast",
      tone: "gold",
      text: `${entity.name}s Katze hat eine zweite Chance gegeben.`
    });

    return;
  }

  entity.hp = Math.max(
    0,
    entity.hp - amount
  );

  if (entity.hp > 0) {
    return;
  }

  if (lobby.mode.startsWith("battle_royale")) {
    entity.eliminated = true;
    entity.downed = false;
    return;
  }

  entity.downed = true;
  entity.downedAt = now;

  entity.vx = 0;
  entity.vy = 0;

  releaseHideout(lobby.world, entity);
  releaseVehicle(lobby.world, entity);

  broadcastLobby(lobby, {
    type: "toast",
    tone: "danger",
    text: `${entity.name} braucht Hilfe.`
  });
}

function respawn(lobby, entity) {
  const map = getMap(lobby);

  const spawns =
    lobby.mode === "ctf" ||
    lobby.mode === "battle_royale_team"
      ? teamSpawns(map, entity.team)
      : map.spawns;

  const spawn =
    spawns[
      crypto.randomInt(0, spawns.length)
    ];

  entity.x = spawn.x + randomRange(-60, 60);
  entity.y = spawn.y + randomRange(-60, 60);

  entity.hp = entity.maxHp;
  entity.downed = false;
  entity.eliminated = false;
  entity.downedAt = 0;

  entity.vx = 0;
  entity.vy = 0;

  entity.protectedUntil =
    Date.now() + 2200;
}

function teamSpawns(map, team) {
  if (team === 0) {
    return [
      { x: 260, y: map.height * 0.25 },
      { x: 320, y: map.height * 0.5 },
      { x: 260, y: map.height * 0.75 },
      { x: 520, y: map.height * 0.35 }
    ];
  }

  return [
    { x: map.width - 260, y: map.height * 0.25 },
    { x: map.width - 320, y: map.height * 0.5 },
    { x: map.width - 260, y: map.height * 0.75 },
    { x: map.width - 520, y: map.height * 0.65 }
  ];
}

function revive(lobby, reviver, target) {
  if (!target.downed) return false;

  target.downed = false;
  target.downedAt = 0;
  target.hp = Math.round(target.maxHp * 0.55);
  target.protectedUntil = Date.now() + 1800;

  if (reviver.accountId) {
    const client = CLIENTS.get(reviver.id);

    if (client?.account?.profile) {
      client.account.profile.stats.revives += 1;
    }
  }

  return true;
}

/* ----------------------------------------------------------
   Spielerbewegung
---------------------------------------------------------- */

function attemptJump(entity, now) {
  if (
    entity.airborne ||
    entity.hidden ||
    entity.downed ||
    entity.eliminated
  ) {
    return;
  }

  let direction =
    normalize(
      entity.inputX || 0,
      entity.inputY || 0
    );

  if (
    Math.abs(direction.x) < 0.01 &&
    Math.abs(direction.y) < 0.01
  ) {
    direction =
      normalize(
        entity.lastDirX || 1,
        entity.lastDirY || 0
      );
  }

  if (
    now -
      (entity.lastLandedAt || 0) <=
    PLAYER.bunnyWindow
  ) {
    entity.jumpChain =
      Math.min(
        PLAYER.maxChain,
        (entity.jumpChain || 0) + 1
      );
  } else {
    entity.jumpChain = 0;
  }

  const launch =
    Math.min(
      PLAYER.jumpMax,
      PLAYER.jumpLaunch +
        entity.jumpChain *
          PLAYER.jumpBonus
    );

  entity.vx =
    direction.x * launch;

  entity.vy =
    direction.y * launch;

  entity.lastDirX = direction.x;
  entity.lastDirY = direction.y;

  entity.airborne = true;
  entity.jumpStartedAt = now;
}

function updatePlayer(lobby, player, now) {
  const map = getMap(lobby);
  const world = lobby.world;

  if (player.eliminated) return;

  if (player.downed) {
    if (now - player.downedAt > 12000) {
      respawn(lobby, player);
    }

    return;
  }

  if (player.hidden) {
    player.vx = 0;
    player.vy = 0;
    return;
  }

  if (player.vehicleId) {
    const vehicle =
      world.vehicles.get(player.vehicleId);

    if (!vehicle) {
      player.vehicleId = null;
      return;
    }

    const input =
      normalize(
        player.inputX,
        player.inputY
      );

    const speed =
      vehicle.type === "boat"
        ? 260
        : 300;

    vehicle.vx = input.x * speed;
    vehicle.vy = input.y * speed;

    const nextX =
      vehicle.x +
      vehicle.vx * DT;

    const nextY =
      vehicle.y +
      vehicle.vy * DT;

    const inWater =
      isWater(map, nextX, nextY);

    const allowed =
      vehicle.type === "boat"
        ? inWater
        : !inWater;

    if (allowed) {
      vehicle.x =
        clamp(
          nextX,
          40,
          map.width - 40
        );

      vehicle.y =
        clamp(
          nextY,
          40,
          map.height - 40
        );
    }

    player.x = vehicle.x;
    player.y = vehicle.y;

    return;
  }

  if (
    player.airborne &&
    now - player.jumpStartedAt >=
      PLAYER.jumpDuration
  ) {
    player.airborne = false;
    player.lastLandedAt = now;
  }

  if (
    player.jumpHeld &&
    player.bhopEnabled &&
    !player.airborne
  ) {
    attemptJump(player, now);
  }

  const water =
    isWater(map, player.x, player.y);

  if (!player.airborne) {
    const input =
      normalize(
        player.inputX,
        player.inputY
      );

    if (
      Math.abs(input.x) > 0.01 ||
      Math.abs(input.y) > 0.01
    ) {
      player.lastDirX = input.x;
      player.lastDirY = input.y;
    }

    let speed =
      PLAYER.walkSpeed;

    if (
      player.speedBoostUntil > now
    ) {
      speed *= 1.35;
    }

    if (water) {
      speed *= PLAYER.swimMultiplier;
    }

    const targetVx = input.x * speed;
    const targetVy = input.y * speed;

    const blend =
      Math.min(
        1,
        PLAYER.accel *
          DT /
          Math.max(
            1,
            PLAYER.walkSpeed
          )
      );

    player.vx +=
      (targetVx - player.vx) *
      blend;

    player.vy +=
      (targetVy - player.vy) *
      blend;
  } else {
    /*
      Kein zusätzliches Hochbeschleunigen mitten im Sprung.
      Nur kleine Richtungsänderung.
    */
    const input =
      normalize(
        player.inputX,
        player.inputY
      );

    if (
      Math.abs(input.x) > 0.01 ||
      Math.abs(input.y) > 0.01
    ) {
      const magnitude =
        Math.hypot(
          player.vx,
          player.vy
        );

      const old =
        normalize(
          player.vx,
          player.vy
        );

      const steered =
        normalize(
          old.x * 0.9 +
            input.x * 0.1,
          old.y * 0.9 +
            input.y * 0.1
        );

      player.vx =
        steered.x * magnitude;

      player.vy =
        steered.y * magnitude;
    }
  }

  moveEntity(
    map,
    world,
    player,
    player.vx * DT,
    player.vy * DT
  );
}

/* ----------------------------------------------------------
   Türen
---------------------------------------------------------- */

function updateDoors(lobby) {
  const world = lobby.world;

  const entities = [
    ...getLobbyPlayers(lobby),
    ...world.bots,
    ...world.monsters,
    ...world.scps,
    ...world.zombies
  ];

  for (const door of world.doors) {
    if (door.locked) {
      door.amount =
        Math.max(
          0,
          door.amount - 0.12
        );

      continue;
    }

    const center = {
      x: door.x + door.w / 2,
      y: door.y + door.h / 2
    };

    let near = false;

    for (const entity of entities) {
      if (
        entity.hidden ||
        entity.downed ||
        entity.eliminated
      ) {
        continue;
      }

      if (distance(center, entity) < 160) {
        near = true;
        break;
      }
    }

    door.amount +=
      (near ? 1 : -1) *
      3.4 *
      DT;

    door.amount =
      clamp(
        door.amount,
        0,
        1
      );
  }
}

/* ----------------------------------------------------------
   Monster
---------------------------------------------------------- */

function livingTargets(lobby) {
  return [
    ...getLobbyPlayers(lobby),
    ...lobby.world.bots
  ].filter(
    (entity) =>
      !entity.hidden &&
      !entity.downed &&
      !entity.eliminated
  );
}

function entityById(lobby, targetId) {
  return [
    ...getLobbyPlayers(lobby),
    ...lobby.world.bots
  ].find(
    (entity) =>
      entity.id === targetId
  ) || null;
}

function chooseMonsterTarget(lobby, monster, now) {
  const map = getMap(lobby);

  const candidates =
    livingTargets(lobby);

  let best = null;
  let bestDistance = Infinity;

  const sightRange =
    lobby.mode === "fog"
      ? 730
      : 880;

  for (const target of candidates) {
    const d =
      distance(monster, target);

    if (
      d <= sightRange &&
      lineOfSight(
        map,
        lobby.world,
        monster,
        target
      ) &&
      d < bestDistance
    ) {
      best = target;
      bestDistance = d;
    }
  }

  if (best) {
    monster.targetId = best.id;
    monster.lastKnownX = best.x;
    monster.lastKnownY = best.y;
    monster.memoryUntil = now + 4800;

    return {
      x: best.x,
      y: best.y
    };
  }

  if (
    lobby.world.noise &&
    now -
      lobby.world.noise.time <
      6500
  ) {
    return {
      x: lobby.world.noise.x,
      y: lobby.world.noise.y
    };
  }

  if (now < monster.memoryUntil) {
    return {
      x: monster.lastKnownX,
      y: monster.lastKnownY
    };
  }

  monster.targetId = null;

  return {
    x: randomRange(200, map.width - 200),
    y: randomRange(200, map.height - 200)
  };
}

function monsterSpeed(lobby, monster, now) {
  let speed =
    lobby.options.bhop === false
      ? 158
      : 198;

  if (
    lobby.options.modifiers?.includes(
      "monster_fast"
    )
  ) {
    speed *= 1.2;
  }

  if (
    now < monster.sprintUntil
  ) {
    speed *= 1.55;
  }

  if (monster.fogType === "hunter") {
    speed *= 1.18;
  }

  if (monster.fogType === "brute") {
    speed *= 0.72;
  }

  if (monster.fogType === "stalker") {
    speed *= 0.88;
  }

  return speed;
}

function updateMonster(lobby, monster, now) {
  const map = getMap(lobby);

  if (now >= monster.nextSprintAt) {
    monster.sprintUntil =
      now + 1600;

    monster.nextSprintAt =
      now +
      randomRange(18000, 30000);

    broadcastLobby(lobby, {
      type: "monsterSprint",
      monsterId: monster.id
    });
  }

  if (now >= monster.nextThinkAt) {
    const target =
      chooseMonsterTarget(
        lobby,
        monster,
        now
      );

    monster.path =
      findPath(
        map,
        monster.x,
        monster.y,
        target.x,
        target.y
      );

    monster.pathIndex = 0;

    monster.nextThinkAt =
      now +
      (monster.fogType === "stalker"
        ? 700
        : 340);
  }

  let target =
    monster.path[
      monster.pathIndex
    ];

  if (target) {
    const d = Math.hypot(
      target.x - monster.x,
      target.y - monster.y
    );

    if (d < 48) {
      monster.pathIndex += 1;
      target =
        monster.path[
          monster.pathIndex
        ];
    }
  }

  if (target) {
    let direction =
      normalize(
        target.x - monster.x,
        target.y - monster.y
      );

    if (
      monster.fogType === "stalker"
    ) {
      const currentTarget =
        entityById(
          lobby,
          monster.targetId
        );

      if (
        currentTarget &&
        distance(
          monster,
          currentTarget
        ) < 260
      ) {
        direction = {
          x: -direction.x,
          y: -direction.y
        };
      }
    }

    const speed =
      monsterSpeed(
        lobby,
        monster,
        now
      );

    const phaseWalls =
      monster.fogType === "phantom" &&
      Math.floor(now / 2400) % 5 === 0;

    moveEntity(
      map,
      lobby.world,
      monster,
      direction.x *
        speed *
        DT,
      direction.y *
        speed *
        DT,
      phaseWalls
    );
  }

  for (const targetEntity of livingTargets(lobby)) {
    if (
      distance(monster, targetEntity) <
      (monster.fogType === "brute"
        ? 54
        : 42)
    ) {
      applyDamage(
        lobby,
        targetEntity,
        targetEntity.maxHp,
        "monster"
      );
    }
  }

  if (now >= monster.nextAbilityAt) {
    monster.nextAbilityAt =
      now + 60000;

    const target =
      entityById(
        lobby,
        monster.targetId
      );

    if (
      target &&
      !target.hidden &&
      distance(monster, target) < 700 &&
      lineOfSight(
        map,
        lobby.world,
        monster,
        target
      )
    ) {
      broadcastLobby(lobby, {
        type: "beam",
        fromX: monster.x,
        fromY: monster.y,
        toX: target.x,
        toY: target.y,
        color: "#df5364"
      });

      applyDamage(
        lobby,
        target,
        Math.round(
          target.maxHp * 0.72
        ),
        "monsterAbility"
      );
    }
  }
}

/* ----------------------------------------------------------
   Bots
---------------------------------------------------------- */

function nearestThreat(lobby, bot) {
  const threats = [
    ...lobby.world.monsters,
    ...lobby.world.zombies.filter(
      (zombie) => !zombie.dead
    ),
    ...lobby.world.scps.filter(
      (scp) => scp.type !== "scp999"
    )
  ];

  if (lobby.world.boss) {
    threats.push(lobby.world.boss);
  }

  let best = null;
  let bestDistance = Infinity;

  for (const threat of threats) {
    const d = distance(bot, threat);

    if (d < bestDistance) {
      best = threat;
      bestDistance = d;
    }
  }

  return {
    entity: best,
    distance: bestDistance
  };
}

function findSafePoint(map, threat, bot) {
  let best = null;
  let bestScore = -Infinity;

  for (let i = 0; i < 14; i += 1) {
    const candidate = {
      x: randomRange(180, map.width - 180),
      y: randomRange(180, map.height - 180)
    };

    const score =
      Math.hypot(
        candidate.x - threat.x,
        candidate.y - threat.y
      ) -
      Math.hypot(
        candidate.x - bot.x,
        candidate.y - bot.y
      ) * 0.18;

    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}

function nearestFreeHideout(world, entity, radius = 600) {
  let best = null;
  let bestDistance = radius;

  for (const hideout of world.hideouts.values()) {
    if (hideout.occupantId) continue;

    const d = Math.hypot(
      hideout.entranceX - entity.x,
      hideout.entranceY - entity.y
    );

    if (d < bestDistance) {
      best = hideout;
      bestDistance = d;
    }
  }

  return best;
}

function botChat(lobby, bot, text) {
  const now = Date.now();

  if (now - bot.lastChatAt < 9000) {
    return;
  }

  bot.lastChatAt = now;

  broadcastLobby(lobby, {
    type: "chat",
    from: bot.name,
    bot: true,
    text
  });
}

function botBhopSafe(bot, threat, direction) {
  if (!threat) return true;

  const projected = {
    x:
      bot.x +
      direction.x * 180,
    y:
      bot.y +
      direction.y * 180
  };

  return (
    Math.hypot(
      projected.x - threat.x,
      projected.y - threat.y
    ) >=
    distance(bot, threat) - 10
  );
}

function updateBot(lobby, bot, now) {
  const map = getMap(lobby);

  if (bot.eliminated) return;

  if (bot.downed) {
    if (now - bot.downedAt > 12000) {
      respawn(lobby, bot);
    }

    return;
  }

  if (bot.hidden) {
    const threat =
      nearestThreat(lobby, bot);

    if (
      threat.distance > 720 &&
      Math.random() <
        0.007 * bot.skill
    ) {
      exitHideout(
        lobby.world,
        bot
      );
    }

    return;
  }

  if (
    bot.airborne &&
    now - bot.jumpStartedAt >
      PLAYER.jumpDuration
  ) {
    bot.airborne = false;
    bot.lastLandedAt = now;
  }

  if (
    now >= bot.nextPauseOpportunity &&
    now >= bot.pauseUntil &&
    Math.random() < 0.04
  ) {
    bot.pauseUntil =
      now + randomRange(1800, 5000);

    bot.nextPauseOpportunity =
      now + 60000;
  }

  const threat =
    nearestThreat(lobby, bot);

  if (
    now < bot.pauseUntil &&
    threat.distance > 650
  ) {
    return;
  }

  if (
    lobby.mode === "zombie" ||
    lobby.mode === "stormking" ||
    lobby.mode.startsWith(
      "battle_royale"
    ) ||
    lobby.mode === "ctf"
  ) {
    updateCombatBot(
      lobby,
      bot,
      now
    );

    return;
  }

  if (
    lobby.mode === "build"
  ) {
    updateBuilderBot(
      lobby,
      bot,
      now
    );

    return;
  }

  if (
    lobby.mode === "prophunt"
  ) {
    updatePropBot(
      lobby,
      bot,
      now
    );

    return;
  }

  if (
    threat.entity &&
    threat.distance <
      620 +
        bot.skill * 180
  ) {
    if (
      lineOfSight(
        map,
        lobby.world,
        bot,
        threat.entity
      )
    ) {
      if (
        now -
          bot.lastChatAt >
        12000
      ) {
        botChat(
          lobby,
          bot,
          "Monster in meiner Nähe – nicht hier lang!"
        );
      }

      const hideout =
        nearestFreeHideout(
          lobby.world,
          bot,
          500
        );

      if (
        hideout &&
        bot.personality !==
          "aggressive"
      ) {
        const hideDistance =
          Math.hypot(
            hideout.entranceX -
              bot.x,
            hideout.entranceY -
              bot.y
          );

        if (hideDistance < 70) {
          enterHideout(
            lobby.world,
            bot,
            hideout
          );

          return;
        }

        bot.path =
          findPath(
            map,
            bot.x,
            bot.y,
            hideout.entranceX,
            hideout.entranceY
          );

        bot.pathIndex = 0;
      } else {
        const safe =
          findSafePoint(
            map,
            threat.entity,
            bot
          );

        bot.path =
          findPath(
            map,
            bot.x,
            bot.y,
            safe.x,
            safe.y
          );

        bot.pathIndex = 0;
      }

      bot.nextThinkAt =
        now +
        randomRange(
          450,
          900
        );
    }
  }

  if (now >= bot.nextThinkAt) {
    if (
      bot.command === "follow" &&
      bot.commandTarget
    ) {
      bot.path =
        findPath(
          map,
          bot.x,
          bot.y,
          bot.commandTarget.x,
          bot.commandTarget.y
        );
    } else if (
      bot.command === "hold"
    ) {
      bot.path = [];
    } else {
      let target;

      if (
        bot.personality === "loner"
      ) {
        target = {
          x: randomRange(
            map.width * 0.1,
            map.width * 0.9
          ),
          y: randomRange(
            map.height * 0.1,
            map.height * 0.9
          )
        };
      } else {
        target = {
          x: randomRange(
            180,
            map.width - 180
          ),
          y: randomRange(
            180,
            map.height - 180
          )
        };
      }

      bot.path =
        findPath(
          map,
          bot.x,
          bot.y,
          target.x,
          target.y
        );
    }

    bot.pathIndex = 0;

    bot.nextThinkAt =
      now +
      randomRange(
        1500,
        4200
      );
  }

  followBotPath(
    lobby,
    bot,
    threat.entity,
    now
  );
}

function followBotPath(lobby, bot, threat, now) {
  const map = getMap(lobby);

  let target =
    bot.path[
      bot.pathIndex
    ];

  if (!target) {
    return;
  }

  if (
    Math.hypot(
      target.x - bot.x,
      target.y - bot.y
    ) < 45
  ) {
    bot.pathIndex += 1;

    target =
      bot.path[
        bot.pathIndex
      ];

    if (!target) return;
  }

  const direction =
    normalize(
      target.x - bot.x,
      target.y - bot.y
    );

  const mayBhop =
    lobby.options.bhop !== false &&
    !bot.airborne &&
    (
      bot.personality === "pro" ||
      bot.personality === "teamplayer" ||
      bot.personality === "aggressive"
    ) &&
    botBhopSafe(
      bot,
      threat,
      direction
    ) &&
    Math.random() <
      0.012 * bot.skill;

  let speed =
    PLAYER.walkSpeed *
    (0.82 +
      bot.skill * 0.25);

  if (
    isWater(
      map,
      bot.x,
      bot.y
    )
  ) {
    speed *= 0.66;
  }

  if (mayBhop) {
    bot.airborne = true;
    bot.jumpStartedAt = now;

    bot.vx =
      direction.x *
      Math.min(
        330,
        speed * 1.5
      );

    bot.vy =
      direction.y *
      Math.min(
        330,
        speed * 1.5
      );
  }

  if (!bot.airborne) {
    bot.vx =
      direction.x * speed;

    bot.vy =
      direction.y * speed;
  }

  moveEntity(
    map,
    lobby.world,
    bot,
    bot.vx * DT,
    bot.vy * DT
  );
}

function findCombatTarget(lobby, bot) {
  if (lobby.mode === "stormking") {
    return lobby.world.boss;
  }

  if (lobby.mode === "zombie") {
    let nearest = null;
    let best = Infinity;

    for (const zombie of lobby.world.zombies) {
      if (zombie.dead) continue;

      const d = distance(bot, zombie);

      if (d < best) {
        best = d;
        nearest = zombie;
      }
    }

    return nearest;
  }

  const candidates = [
    ...getLobbyPlayers(lobby),
    ...lobby.world.bots
  ].filter(
    (entity) =>
      entity.id !== bot.id &&
      !entity.downed &&
      !entity.eliminated &&
      (
        lobby.mode ===
          "battle_royale_ffa" ||
        entity.team !== bot.team
      )
  );

  let nearest = null;
  let best = Infinity;

  for (const candidate of candidates) {
    const d = distance(bot, candidate);

    if (d < best) {
      best = d;
      nearest = candidate;
    }
  }

  return nearest;
}

function updateCombatBot(lobby, bot, now) {
  const map = getMap(lobby);

  const target =
    findCombatTarget(
      lobby,
      bot
    );

  if (!target) {
    return;
  }

  const d =
    distance(bot, target);

  if (
    d <
      650 +
        bot.skill * 300 &&
    lineOfSight(
      map,
      lobby.world,
      bot,
      target
    )
  ) {
    if (
      now - bot.lastFireAt >
      550 -
        bot.skill * 280
    ) {
      const direction =
        normalize(
          target.x - bot.x +
            randomRange(
              -70,
              70
            ) *
              (1 - bot.skill),
          target.y - bot.y +
            randomRange(
              -70,
              70
            ) *
              (1 - bot.skill)
        );

      fireWeapon(
        lobby,
        bot,
        direction.x,
        direction.y,
        true
      );
    }

    if (
      d < 260 &&
      lobby.mode !==
        "stormking"
    ) {
      const away =
        normalize(
          bot.x - target.x,
          bot.y - target.y
        );

      moveEntity(
        map,
        lobby.world,
        bot,
        away.x *
          PLAYER.walkSpeed *
          DT,
        away.y *
          PLAYER.walkSpeed *
          DT
      );

      return;
    }
  }

  if (
    now >= bot.nextThinkAt
  ) {
    bot.path =
      findPath(
        map,
        bot.x,
        bot.y,
        target.x,
        target.y
      );

    bot.pathIndex = 0;

    bot.nextThinkAt =
      now +
      randomRange(
        550,
        1100
      );
  }

  followBotPath(
    lobby,
    bot,
    target,
    now
  );
}

function updateBuilderBot(lobby, bot, now) {
  if (now < bot.nextThinkAt) return;

  bot.nextThinkAt =
    now +
    randomRange(3500, 7500);

  if (
    lobby.world.buildBlocks.size >
    6000
  ) {
    return;
  }

  const baseX =
    1400 +
    (BOT_NAMES.indexOf(bot.name) % 6) *
      700;

  const baseY =
    1400 +
    (Math.floor(
      BOT_NAMES.indexOf(bot.name) / 6
    ) % 6) *
      700;

  const templates = [
    [0, 0], [90, 0], [180, 0],
    [0, 90], [180, 90],
    [0, 180], [90, 180], [180, 180]
  ];

  const block =
    BLOCKS[
      (BOT_NAMES.indexOf(bot.name) * 7) %
        BLOCKS.length
    ];

  const point =
    bot.personality === "troll"
      ? {
          x: baseX + randomRange(-300, 300),
          y: baseY + randomRange(-300, 300)
        }
      : {
          x:
            baseX +
            templates[
              crypto.randomInt(
                0,
                templates.length
              )
            ][0],
          y:
            baseY +
            templates[
              crypto.randomInt(
                0,
                templates.length
              )
            ][1]
        };

  const blockId =
    id("placed_");

  lobby.world.buildBlocks.set(
    blockId,
    {
      id: blockId,
      blockId: block.id,
      x: point.x,
      y: point.y,
      ownerId: bot.id
    }
  );

  bot.path =
    findPath(
      getMap(lobby),
      bot.x,
      bot.y,
      point.x,
      point.y
    );

  bot.pathIndex = 0;
}

function updatePropBot(lobby, bot, now) {
  const map = getMap(lobby);

  if (!bot.seeker) {
    if (now >= bot.nextThinkAt) {
      bot.path =
        findPath(
          map,
          bot.x,
          bot.y,
          randomRange(200, map.width - 200),
          randomRange(200, map.height - 200)
        );

      bot.pathIndex = 0;

      bot.nextThinkAt =
        now +
        randomRange(2800, 6000);
    }

    followBotPath(
      lobby,
      bot,
      null,
      now
    );

    return;
  }

  /*
    Suchbot kennt Hider nicht automatisch.
    Er patrouilliert und untersucht nur sichtbare / bewegte Props.
  */
  const possible = [
    ...getLobbyPlayers(lobby),
    ...lobby.world.bots
  ].filter(
    (entity) =>
      entity.id !== bot.id &&
      entity.propForm &&
      !entity.eliminated
  );

  let suspicious = null;
  let score = 0;

  for (const candidate of possible) {
    const d = distance(bot, candidate);

    if (
      d > 280 ||
      !lineOfSight(
        map,
        lobby.world,
        bot,
        candidate
      )
    ) {
      continue;
    }

    const chance =
      (candidate.propMoving
        ? 0.85
        : 0.1) *
      bot.skill;

    if (
      Math.random() < chance &&
      chance > score
    ) {
      suspicious = candidate;
      score = chance;
    }
  }

  if (suspicious) {
    applyDamage(
      lobby,
      suspicious,
      suspicious.maxHp,
      "propSeeker"
    );

    return;
  }

  if (now >= bot.nextThinkAt) {
    bot.path =
      findPath(
        map,
        bot.x,
        bot.y,
        randomRange(200, map.width - 200),
        randomRange(200, map.height - 200)
      );

    bot.pathIndex = 0;

    bot.nextThinkAt =
      now +
      randomRange(
        1200,
        2600
      );
  }

  followBotPath(
    lobby,
    bot,
    null,
    now
  );
}

/* ----------------------------------------------------------
   Arcade-Waffen
---------------------------------------------------------- */

function fireWeapon(lobby, shooter, dx, dy, fromBot = false) {
  const now = Date.now();

  const weapon =
    WEAPONS.find(
      (entry) =>
        entry.id === shooter.selectedWeapon
    ) || WEAPONS[0];

  if (
    now - shooter.lastFireAt <
    weapon.cooldown
  ) {
    return;
  }

  shooter.lastFireAt = now;

  const direction =
    normalize(dx, dy);

  if (
    Math.abs(direction.x) < 0.01 &&
    Math.abs(direction.y) < 0.01
  ) {
    return;
  }

  const start = {
    x: shooter.x,
    y: shooter.y
  };

  const map = getMap(lobby);

  let hit = null;
  let hitDistance =
    weapon.range;

  const possible = [];

  if (lobby.mode === "zombie") {
    possible.push(
      ...lobby.world.zombies.filter(
        (zombie) => !zombie.dead
      )
    );
  } else if (
    lobby.mode === "stormking"
  ) {
    if (lobby.world.boss) {
      possible.push(
        lobby.world.boss
      );
    }
  } else if (
    lobby.mode ===
      "battle_royale_ffa" ||
    lobby.mode ===
      "battle_royale_team" ||
    lobby.mode === "ctf"
  ) {
    possible.push(
      ...getLobbyPlayers(lobby),
      ...lobby.world.bots
    );
  }

  for (const target of possible) {
    if (
      target.id === shooter.id ||
      target.downed ||
      target.eliminated
    ) {
      continue;
    }

    if (
      lobby.mode !==
        "battle_royale_ffa" &&
      shooter.team !== null &&
      target.team === shooter.team
    ) {
      continue;
    }

    const relX =
      target.x - start.x;

    const relY =
      target.y - start.y;

    const projection =
      relX * direction.x +
      relY * direction.y;

    if (
      projection < 0 ||
      projection > weapon.range
    ) {
      continue;
    }

    const closestX =
      start.x +
      direction.x * projection;

    const closestY =
      start.y +
      direction.y * projection;

    const perpendicular =
      Math.hypot(
        target.x - closestX,
        target.y - closestY
      );

    if (
      perpendicular <
        (target.radius || 25) + 12 &&
      projection < hitDistance
    ) {
      if (
        lineOfSight(
          map,
          lobby.world,
          shooter,
          target
        )
      ) {
        hit = target;
        hitDistance = projection;
      }
    }
  }

  const end = {
    x:
      start.x +
      direction.x *
        hitDistance,
    y:
      start.y +
      direction.y *
        hitDistance
  };

  broadcastLobby(lobby, {
    type: "shot",
    fromX: start.x,
    fromY: start.y,
    toX: end.x,
    toY: end.y,
    color: weapon.color
  });

  if (!hit) {
    return;
  }

  if (hit.kind === "stormking") {
    /*
      Boss hat bewusst Schadensbegrenzung,
      damit er nicht in wenigen Sekunden fällt.
    */
    hit.hp =
      Math.max(
        0,
        hit.hp -
          Math.min(
            weapon.damage,
            20
          )
      );

    return;
  }

  if (hit.kind === "zombie") {
    hit.hp -= weapon.damage;

    if (hit.hp <= 0) {
      hit.dead = true;
    }

    return;
  }

  applyDamage(
    lobby,
    hit,
    weapon.damage,
    "arcadeWeapon"
  );
}

/* ----------------------------------------------------------
   Zombies
---------------------------------------------------------- */

function spawnZombieWave(lobby, world, count) {
  const map = getMap(lobby);

  for (let i = 0; i < count; i += 1) {
    const strong =
      Math.random() < 0.18;

    world.zombies.push({
      id: id("zombie_"),
      kind: "zombie",
      variant:
        strong
          ? "brute"
          : Math.random() < 0.35
            ? "runner"
            : "walker",

      x:
        map.width -
        randomRange(180, 600),

      y:
        randomRange(
          180,
          map.height - 180
        ),

      radius:
        strong ? 24 : 19,

      hp:
        strong ? 150 : 65,

      maxHp:
        strong ? 150 : 65,

      dead: false,

      path: [],
      pathIndex: 0,

      nextThinkAt: 0
    });
  }
}

function updateZombie(lobby, zombie, now) {
  if (zombie.dead) return;

  const map = getMap(lobby);

  const targets =
    livingTargets(lobby);

  let target = null;
  let best = Infinity;

  for (const candidate of targets) {
    const d = distance(zombie, candidate);

    if (d < best) {
      best = d;
      target = candidate;
    }
  }

  if (!target) return;

  if (now >= zombie.nextThinkAt) {
    zombie.path =
      findPath(
        map,
        zombie.x,
        zombie.y,
        target.x,
        target.y
      );

    zombie.pathIndex = 0;

    zombie.nextThinkAt =
      now + 800;
  }

  let point =
    zombie.path[
      zombie.pathIndex
    ];

  if (point) {
    if (
      Math.hypot(
        point.x - zombie.x,
        point.y - zombie.y
      ) < 42
    ) {
      zombie.pathIndex += 1;

      point =
        zombie.path[
          zombie.pathIndex
        ];
    }
  }

  if (point) {
    const direction =
      normalize(
        point.x - zombie.x,
        point.y - zombie.y
      );

    const speed =
      zombie.variant === "runner"
        ? 125
        : zombie.variant === "brute"
          ? 72
          : 88;

    moveEntity(
      map,
      lobby.world,
      zombie,
      direction.x * speed * DT,
      direction.y * speed * DT
    );
  }

  if (
    distance(zombie, target) < 38
  ) {
    applyDamage(
      lobby,
      target,
      zombie.variant === "brute"
        ? 34
        : 20,
      "zombie"
    );
  }
}

/* ----------------------------------------------------------
   SCP
---------------------------------------------------------- */

function updateScp(lobby, scp, now) {
  const map = getMap(lobby);

  const targets =
    livingTargets(lobby);

  if (scp.type === "scp999") {
    for (const target of targets) {
      if (
        distance(scp, target) < 100 &&
        target.hp < target.maxHp &&
        !lobby.options.modifiers?.includes(
          "no_healing"
        )
      ) {
        target.hp =
          Math.min(
            target.maxHp,
            target.hp +
              8 * DT
          );
      }
    }

    if (now >= scp.nextThinkAt) {
      scp.path =
        findPath(
          map,
          scp.x,
          scp.y,
          randomRange(200, map.width - 200),
          randomRange(200, map.height - 200)
        );

      scp.pathIndex = 0;
      scp.nextThinkAt = now + 4000;
    }

    followNpcPath(
      lobby,
      scp,
      90,
      false
    );

    return;
  }

  let target = null;
  let best = Infinity;

  for (const candidate of targets) {
    const d =
      distance(scp, candidate);

    if (d < best) {
      best = d;
      target = candidate;
    }
  }

  if (!target) return;

  if (scp.type === "scp173") {
    const watched =
      targets.some(
        (player) =>
          distance(player, scp) <
            750 &&
          lineOfSight(
            map,
            lobby.world,
            player,
            scp
          )
      );

    if (watched) {
      return;
    }
  }

  if (scp.type === "scp096") {
    const watched =
      targets.some((player) => {
        const direction =
          normalize(
            scp.x - player.x,
            scp.y - player.y
          );

        const facing =
          normalize(
            player.lastDirX || 1,
            player.lastDirY || 0
          );

        const dot =
          direction.x *
            facing.x +
          direction.y *
            facing.y;

        return (
          dot > 0.7 &&
          distance(player, scp) < 760 &&
          lineOfSight(
            map,
            lobby.world,
            player,
            scp
          )
        );
      });

    if (!watched) {
      return;
    }
  }

  if (now >= scp.nextThinkAt) {
    scp.path =
      findPath(
        map,
        scp.x,
        scp.y,
        target.x,
        target.y
      );

    scp.pathIndex = 0;

    scp.nextThinkAt =
      now + 420;
  }

  const speed =
    scp.type === "scp096"
      ? 245
      : scp.type === "scp173"
        ? 300
        : scp.type === "scp106"
          ? 140
          : 150;

  followNpcPath(
    lobby,
    scp,
    speed,
    scp.type === "scp106"
  );

  if (
    distance(scp, target) < 40
  ) {
    applyDamage(
      lobby,
      target,
      target.maxHp,
      scp.type
    );
  }
}

function followNpcPath(
  lobby,
  npc,
  speed,
  phaseWalls
) {
  const map = getMap(lobby);

  let target =
    npc.path[
      npc.pathIndex
    ];

  if (!target) return;

  if (
    Math.hypot(
      target.x - npc.x,
      target.y - npc.y
    ) < 42
  ) {
    npc.pathIndex += 1;

    target =
      npc.path[
        npc.pathIndex
      ];
  }

  if (!target) return;

  const direction =
    normalize(
      target.x - npc.x,
      target.y - npc.y
    );

  moveEntity(
    map,
    lobby.world,
    npc,
    direction.x * speed * DT,
    direction.y * speed * DT,
    phaseWalls
  );
}

/* ----------------------------------------------------------
   Sturmkönig
---------------------------------------------------------- */

function updateStormKing(lobby, now) {
  const boss = lobby.world.boss;

  if (!boss || boss.hp <= 0) {
    return;
  }

  const map = getMap(lobby);

  boss.phase =
    boss.hp <
      boss.maxHp * 0.33
      ? 3
      : boss.hp <
          boss.maxHp * 0.66
        ? 2
        : 1;

  if (now >= boss.nextMoveAt) {
    const target =
      livingTargets(lobby)[
        crypto.randomInt(
          0,
          Math.max(
            1,
            livingTargets(lobby).length
          )
        )
      ];

    if (target) {
      const direction =
        normalize(
          target.x - boss.x,
          target.y - boss.y
        );

      const speed =
        48 +
        boss.phase * 17;

      boss.x =
        clamp(
          boss.x +
            direction.x *
              speed,
          300,
          map.width - 300
        );

      boss.y =
        clamp(
          boss.y +
            direction.y *
              speed,
          300,
          map.height - 300
        );
    }

    boss.nextMoveAt =
      now +
      randomRange(850, 1500);
  }

  if (now >= boss.nextAttackAt) {
    const attacks = [
      "energy_beam",
      "shockwave",
      "grab_zone"
    ];

    boss.attack =
      attacks[
        crypto.randomInt(
          0,
          attacks.length
        )
      ];

    boss.attackUntil =
      now + 1800;

    boss.nextAttackAt =
      now +
      Math.max(
        2800,
        6200 -
          boss.phase * 900
      );

    broadcastLobby(lobby, {
      type: "bossAttack",
      attack: boss.attack,
      x: boss.x,
      y: boss.y
    });
  }

  if (
    boss.attack &&
    now <
      boss.attackUntil &&
    now >
      boss.attackUntil - 250
  ) {
    for (const target of livingTargets(lobby)) {
      const d =
        distance(
          boss,
          target
        );

      if (
        boss.attack ===
          "shockwave" &&
        d < 430
      ) {
        applyDamage(
          lobby,
          target,
          50,
          "stormking"
        );
      }

      if (
        boss.attack ===
          "grab_zone" &&
        d < 230
      ) {
        applyDamage(
          lobby,
          target,
          70,
          "stormking"
        );
      }
    }

    boss.attack = null;
  }
}

/* ----------------------------------------------------------
   Events
---------------------------------------------------------- */

function updateEvents(lobby, now) {
  const world = lobby.world;

  if (
    !lobby.options.randomEvents
  ) {
    return;
  }

  if (
    world.event &&
    now >= world.eventUntil
  ) {
    if (
      world.event ===
      "power_outage"
    ) {
      world.powerOn = true;
    }

    if (
      world.event === "fog"
    ) {
      world.fogAmount =
        lobby.mode === "fog"
          ? 0.58
          : 0;
    }

    if (
      world.event ===
      "locked_area"
    ) {
      for (const door of world.doors) {
        door.locked = false;
      }
    }

    world.event = null;
  }

  if (
    now <
      world.nextEventAt ||
    world.event
  ) {
    return;
  }

  const enabled =
    lobby.options.events?.length
      ? lobby.options.events
      : ROUND_EVENTS;

  const event =
    enabled[
      crypto.randomInt(
        0,
        enabled.length
      )
    ];

  world.event = event;
  world.eventUntil =
    now + 28000;

  world.nextEventAt =
    now +
    randomRange(
      70000,
      110000
    );

  if (event === "power_outage") {
    world.powerOn = false;
  }

  if (event === "fog") {
    world.fogAmount =
      Math.max(
        world.fogAmount,
        0.48
      );
  }

  if (event === "locked_area") {
    const candidates =
      world.doors.filter(
        () => Math.random() < 0.25
      );

    for (const door of candidates) {
      door.locked = true;
    }
  }

  if (event === "alarm") {
    const map = getMap(lobby);

    world.noise = {
      x: map.width / 2,
      y: map.height / 2,
      time: now
    };
  }

  broadcastLobby(lobby, {
    type: "event",
    event,
    until: world.eventUntil
  });
}

/* ----------------------------------------------------------
   Interaktionen
---------------------------------------------------------- */

function nearestInteraction(map, player) {
  let best = null;
  let bestDistance = PLAYER.interactRadius;

  for (const item of map.interactions) {
    const d =
      Math.hypot(
        item.x - player.x,
        item.y - player.y
      );

    if (d < bestDistance) {
      best = item;
      bestDistance = d;
    }
  }

  return best;
}

function nearestNpc(map, player) {
  let best = null;
  let bestDistance = PLAYER.interactRadius;

  for (const npc of map.npcs) {
    const d =
      Math.hypot(
        npc.x - player.x,
        npc.y - player.y
      );

    if (d < bestDistance) {
      best = npc;
      bestDistance = d;
    }
  }

  return best;
}

async function collectPet(client, lobby, player) {
  const pickup =
    lobby.world.petPickup;

  if (
    !pickup ||
    !pickup.active ||
    distance(player, pickup) > 120
  ) {
    return false;
  }

  pickup.active = false;

  player.selectedPet =
    pickup.petId;

  if (
    client.account?.profile
  ) {
    const profile =
      client.account.profile;

    if (
      !profile.pets.includes(
        pickup.petId
      )
    ) {
      profile.pets.push(
        pickup.petId
      );

      profile.stats.petsFound += 1;

      await saveProfile(
        client.account.id,
        profile
      );
    }
  }

  send(client.ws, {
    type: "toast",
    tone: "gold",
    text: "Secret-Begleiter gefunden!"
  });

  return true;
}

async function interact(client) {
  const lobby =
    LOBBIES.get(
      client.lobbyCode
    );

  const player =
    client.player;

  if (
    !lobby ||
    !player ||
    player.downed ||
    player.eliminated
  ) {
    return;
  }

  const world =
    lobby.world;

  const map =
    getMap(lobby);

  const now = Date.now();

  if (
    now -
      player.lastInteractAt <
    200
  ) {
    return;
  }

  player.lastInteractAt = now;

  if (player.vehicleId) {
    const vehicle =
      world.vehicles.get(
        player.vehicleId
      );

    if (vehicle) {
      player.x =
        vehicle.x + 80;
      player.y =
        vehicle.y;

      releaseVehicle(
        world,
        player
      );

      return;
    }
  }

  for (const vehicle of world.vehicles.values()) {
    if (
      !vehicle.driverId &&
      distance(player, vehicle) <
        125
    ) {
      enterVehicle(
        world,
        player,
        vehicle
      );

      return;
    }
  }

  if (player.hidden) {
    exitHideout(
      world,
      player
    );

    return;
  }

  for (const entity of [
    ...getLobbyPlayers(lobby),
    ...world.bots
  ]) {
    if (
      entity.id !== player.id &&
      entity.downed &&
      distance(player, entity) <
        105
    ) {
      if (
        revive(
          lobby,
          player,
          entity
        )
      ) {
        broadcastLobby(lobby, {
          type: "toast",
          tone: "good",
          text:
            `${player.name} hat ${entity.name} wiederbelebt.`
        });
      }

      return;
    }
  }

  if (
    await collectPet(
      client,
      lobby,
      player
    )
  ) {
    return;
  }

  if (
    world.cat &&
    world.cat.active &&
    !world.cat.ownerId &&
    distance(player, world.cat) <
      115
  ) {
    if (player.fish > 0) {
      player.fish -= 1;
      player.catTotem = true;

      world.cat.ownerId =
        player.id;

      send(client.ws, {
        type: "toast",
        tone: "gold",
        text:
          "Die Katze folgt dir und kann dich einmal retten."
      });
    } else {
      send(client.ws, {
        type: "toast",
        text:
          "Die Katze hätte gern einen Fisch."
      });
    }

    return;
  }

  const hideout =
    nearestFreeHideout(
      world,
      player,
      PLAYER.interactRadius
    );

  if (
    hideout &&
    Math.hypot(
      hideout.entranceX -
        player.x,
      hideout.entranceY -
        player.y
    ) <
      PLAYER.interactRadius
  ) {
    enterHideout(
      world,
      player,
      hideout
    );

    return;
  }

  const npc =
    nearestNpc(
      map,
      player
    );

  if (npc?.trader) {
    send(client.ws, {
      type: "openShop",
      vendor: npc.name
    });

    return;
  }

  const action =
    nearestInteraction(
      map,
      player
    );

  if (!action) return;

  switch (action.type) {
    case "vending": {
      const roll =
        crypto.randomInt(0, 3);

      if (roll === 0) {
        player.speedBoostUntil =
          now + 10000;

        send(client.ws, {
          type: "toast",
          tone: "good",
          text: "Speed-Drink erhalten."
        });
      } else if (roll === 1) {
        player.protectedUntil =
          now + 5500;

        send(client.ws, {
          type: "toast",
          tone: "good",
          text:
            "Kurzer Schutz-Drink erhalten."
        });
      } else {
        player.fish += 1;

        send(client.ws, {
          type: "toast",
          tone: "gold",
          text:
            "Ein Fisch kam aus dem Automaten."
        });
      }

      break;
    }

    case "bell":
      world.noise = {
        x: action.x,
        y: action.y,
        time: now
      };

      broadcastLobby(lobby, {
        type: "toast",
        tone: "warning",
        text:
          `${player.name} hat eine Glocke geläutet.`
      });
      break;

    case "power":
      world.powerOn =
        !world.powerOn;
      break;

    case "piano":
      send(client.ws, {
        type: "openPiano"
      });
      break;

    default:
      break;
  }
}

/* ----------------------------------------------------------
   Bot-Commands
---------------------------------------------------------- */

function commandBots(lobby, player, text) {
  const command =
    text.trim().toLowerCase();

  const bots =
    lobby.world.bots;

  if (
    command === "/bots follow" ||
    command === "/bots folge"
  ) {
    for (const bot of bots) {
      bot.command = "follow";
      bot.commandTarget = player;
      bot.nextThinkAt = 0;
    }

    return "Bots folgen dir.";
  }

  if (
    command === "/bots hold" ||
    command === "/bots warten"
  ) {
    for (const bot of bots) {
      bot.command = "hold";
      bot.path = [];
    }

    return "Bots halten ihre Position.";
  }

  if (
    command === "/bots free" ||
    command === "/bots frei"
  ) {
    for (const bot of bots) {
      bot.command = null;
      bot.commandTarget = null;
      bot.nextThinkAt = 0;
    }

    return "Bots spielen wieder selbstständig.";
  }

  if (
    command === "/bots hide" ||
    command === "/bots verstecken"
  ) {
    for (const bot of bots) {
      const hideout =
        nearestFreeHideout(
          lobby.world,
          bot,
          900
        );

      if (hideout) {
        bot.command = "follow";

        bot.commandTarget = {
          x: hideout.entranceX,
          y: hideout.entranceY
        };

        bot.nextThinkAt = 0;
      }
    }

    return "Bots suchen Verstecke.";
  }

  if (
    command === "/bots regroup" ||
    command === "/bots sammeln"
  ) {
    for (const bot of bots) {
      bot.command = "follow";

      bot.commandTarget = {
        x:
          player.x +
          randomRange(-180, 180),
        y:
          player.y +
          randomRange(-180, 180)
      };

      bot.nextThinkAt = 0;
    }

    return "Bots sammeln sich bei dir.";
  }

  if (
    command === "/bots revive"
  ) {
    for (const bot of bots) {
      const target =
        getLobbyPlayers(lobby).find(
          (candidate) =>
            candidate.downed
        );

      if (target) {
        bot.command = "follow";
        bot.commandTarget = target;
        bot.nextThinkAt = 0;
      }
    }

    return "Bots suchen verletzte Teammitglieder.";
  }

  return null;
}

/* ----------------------------------------------------------
   Neon Boroughs
---------------------------------------------------------- */

function handleGangCommand(lobby, player, text) {
  if (lobby.mode !== "neon") {
    return null;
  }

  const parts =
    text.trim().split(/\s+/);

  if (parts[0] !== "/gang") {
    return null;
  }

  lobby.world.gangs ||= new Map();

  if (parts[1] === "create") {
    const name =
      safeText(
        parts.slice(2).join(" "),
        22
      ) || "Crew";

    lobby.world.gangs.set(
      player.id,
      {
        ownerId: player.id,
        name,
        members: new Set([
          player.id
        ]),
        territory: 0,
        credits: 0
      }
    );

    return `Crew "${name}" gegründet.`;
  }

  if (parts[1] === "claim") {
    const gang =
      [...lobby.world.gangs.values()]
        .find(
          (entry) =>
            entry.members.has(player.id)
        );

    if (gang) {
      gang.territory += 1;
      gang.credits += 50;

      return "Gebiet für deine Crew markiert.";
    }
  }

  return "Commands: /gang create NAME, /gang claim";
}

/* ----------------------------------------------------------
   Minigames
---------------------------------------------------------- */

function tickMinigame(lobby, now) {
  const state =
    lobby.world.minigame;

  if (!state) return;

  if (
    state.id === "color_floor" &&
    now >= state.nextStageAt
  ) {
    state.targetColor =
      ["red", "blue", "green", "yellow"][
        crypto.randomInt(0, 4)
      ];

    state.nextStageAt =
      now + 6500;

    broadcastLobby(lobby, {
      type: "minigame",
      state
    });
  }

  if (
    state.id === "simon" &&
    now >= state.nextStageAt
  ) {
    state.simonSequence.push(
      crypto.randomInt(0, 4)
    );

    if (
      state.simonSequence.length > 12
    ) {
      state.simonSequence =
        [crypto.randomInt(0, 4)];
    }

    state.nextStageAt =
      now + 6500;

    broadcastLobby(lobby, {
      type: "minigame",
      state
    });
  }
}

/* ----------------------------------------------------------
   Round Voting
---------------------------------------------------------- */

function beginMapVote(lobby, now) {
  const allMaps =
    MAP_SPECS.map(
      (entry) => entry.id
    );

  const picked = [];

  while (
    picked.length < 3 &&
    picked.length < allMaps.length
  ) {
    const mapId =
      allMaps[
        crypto.randomInt(
          0,
          allMaps.length
        )
      ];

    if (!picked.includes(mapId)) {
      picked.push(mapId);
    }
  }

  lobby.world.phase =
    "voting";

  lobby.world.voteCandidates =
    picked;

  lobby.world.votes.clear();

  lobby.world.votingEndsAt =
    now + 22000;

  for (const bot of lobby.world.bots) {
    const choice =
      picked[
        crypto.randomInt(
          0,
          picked.length
        )
      ];

    lobby.world.votes.set(
      bot.id,
      choice
    );
  }

  broadcastLobby(lobby, {
    type: "mapVote",
    candidates: picked,
    endsAt:
      lobby.world.votingEndsAt
  });
}

function finishMapVote(lobby) {
  const counts = new Map();

  for (const mapId of lobby.world.votes.values()) {
    counts.set(
      mapId,
      (counts.get(mapId) || 0) + 1
    );
  }

  let winner =
    lobby.world.voteCandidates[0];

  let best = -1;

  for (const candidate of lobby.world.voteCandidates) {
    const count =
      counts.get(candidate) || 0;

    if (count > best) {
      best = count;
      winner = candidate;
    }
  }

  lobby.mapId = winner;

  lobby.world = createWorld(lobby);

  const map = getMap(lobby);

  for (const clientId of lobby.members) {
    const client =
      CLIENTS.get(clientId);

    if (!client) continue;

    client.player =
      newPlayer(
        client,
        map,
        lobby
      );

    send(client.ws, {
      type: "roundReset",
      map,
      lobby:
        publicLobby(lobby)
    });
  }
}

/* ----------------------------------------------------------
   Welt-Tick
---------------------------------------------------------- */

function updateWorld(lobby, now) {
  const world =
    lobby.world;

  if (!world) return;

  if (world.phase === "voting") {
    if (now >= world.votingEndsAt) {
      finishMapVote(lobby);
    }

    return;
  }

  updateDoors(lobby);
  updateEvents(lobby, now);

  for (const player of getLobbyPlayers(lobby)) {
    updatePlayer(
      lobby,
      player,
      now
    );
  }

  for (const bot of world.bots) {
    updateBot(
      lobby,
      bot,
      now
    );
  }

  for (const monster of world.monsters) {
    updateMonster(
      lobby,
      monster,
      now
    );
  }

  for (const scp of world.scps) {
    updateScp(
      lobby,
      scp,
      now
    );
  }

  for (const zombie of world.zombies) {
    updateZombie(
      lobby,
      zombie,
      now
    );
  }

  if (
    lobby.mode === "zombie" &&
    now >= world.nextZombieWaveAt
  ) {
    world.zombieWave += 1;

    spawnZombieWave(
      lobby,
      world,
      7 +
        world.zombieWave * 3
    );

    world.nextZombieWaveAt =
      now + 32000;

    broadcastLobby(lobby, {
      type: "toast",
      tone: "warning",
      text:
        `Zombie-Welle ${world.zombieWave}`
    });
  }

  if (
    lobby.mode === "stormking"
  ) {
    updateStormKing(
      lobby,
      now
    );
  }

  if (
    lobby.mode === "minigame"
  ) {
    tickMinigame(
      lobby,
      now
    );
  }

  updateCat(lobby);
  updateNpcAnimals(lobby, now);

  if (
    lobby.mode === "build"
  ) {
    world.buildTime +=
      DT / (20 * 60);

    if (world.buildTime > 1) {
      world.buildTime -= 1;
    }
  }

  if (
    now >= world.roundEndsAt &&
    lobby.mode !== "build" &&
    lobby.mode !== "neon"
  ) {
    beginMapVote(
      lobby,
      now
    );
  }

  if (
    world.boss &&
    world.boss.hp <= 0 &&
    world.phase === "playing"
  ) {
    broadcastLobby(lobby, {
      type: "toast",
      tone: "gold",
      text:
        "Der Sturmkönig wurde besiegt! Challenge-Skin freigeschaltet."
    });

    world.roundEndsAt =
      Math.min(
        world.roundEndsAt,
        now + 10000
      );
  }
}

function updateCat(lobby) {
  const cat =
    lobby.world.cat;

  if (
    !cat ||
    !cat.active ||
    !cat.ownerId
  ) {
    return;
  }

  const owner =
    entityById(
      lobby,
      cat.ownerId
    );

  if (!owner) {
    cat.ownerId = null;
    return;
  }

  const d =
    distance(cat, owner);

  if (d > 55) {
    const direction =
      normalize(
        owner.x - cat.x,
        owner.y - cat.y
      );

    cat.x +=
      direction.x *
      Math.min(
        6,
        d - 55
      );

    cat.y +=
      direction.y *
      Math.min(
        6,
        d - 55
      );
  }
}

function updateNpcAnimals(lobby, now) {
  const map =
    getMap(lobby);

  if (!map.npcs?.length) {
    return;
  }

  for (const npc of map.npcs) {
    if (
      npc.type !== "animal"
    ) {
      continue;
    }

    npc._nextMoveAt ||=
      now +
      randomRange(2500, 6000);

    npc._targetX ||= npc.x;
    npc._targetY ||= npc.y;

    if (now >= npc._nextMoveAt) {
      npc._targetX =
        npc.x +
        randomRange(-120, 120);

      npc._targetY =
        npc.y +
        randomRange(-120, 120);

      npc._nextMoveAt =
        now +
        randomRange(2500, 6000);
    }

    const direction =
      normalize(
        npc._targetX - npc.x,
        npc._targetY - npc.y
      );

    npc.x +=
      direction.x * 0.35;

    npc.y +=
      direction.y * 0.35;
  }
}

/* ----------------------------------------------------------
   Snapshots
---------------------------------------------------------- */

function jumpHeight(entity, now) {
  if (!entity.airborne) return 0;

  const t =
    clamp(
      (now -
        entity.jumpStartedAt) /
        PLAYER.jumpDuration,
      0,
      1
    );

  return (
    Math.sin(t * Math.PI) *
    15
  );
}

function serializeEntity(entity, now) {
  return {
    id: entity.id,
    accountId:
      entity.accountId || null,
    name: entity.name,
    skin: entity.skin,
    bot: Boolean(entity.bot),
    personality:
      entity.personality || null,

    x:
      Math.round(
        entity.x * 10
      ) / 10,

    y:
      Math.round(
        entity.y * 10
      ) / 10,

    hp:
      Math.round(entity.hp),
    maxHp:
      Math.round(entity.maxHp),

    downed:
      Boolean(entity.downed),

    eliminated:
      Boolean(entity.eliminated),

    hidden:
      Boolean(entity.hidden),

    jumpHeight:
      Math.round(
        jumpHeight(entity, now) *
          10
      ) / 10,

    protected:
      (entity.protectedUntil || 0) >
      now,

    fish:
      entity.fish || 0,

    catTotem:
      Boolean(entity.catTotem),

    pet:
      entity.selectedPet || null,

    weapon:
      entity.selectedWeapon || null,

    team:
      entity.team,

    vehicleId:
      entity.vehicleId || null,

    propForm:
      entity.propForm || null
  };
}

function snapshot(lobby, now) {
  const world =
    lobby.world;

  return {
    type: "state",

    now,

    mode:
      lobby.mode,

    phase:
      world.phase,

    players:
      getLobbyPlayers(lobby).map(
        (entity) =>
          serializeEntity(
            entity,
            now
          )
      ),

    bots:
      world.bots.map(
        (entity) =>
          serializeEntity(
            entity,
            now
          )
      ),

    monsters:
      world.monsters.map(
        (monster) => ({
          id: monster.id,
          kind: "monster",
          form: monster.form,
          fogType:
            monster.fogType ||
            null,
          x:
            Math.round(
              monster.x * 10
            ) / 10,
          y:
            Math.round(
              monster.y * 10
            ) / 10,
          sprinting:
            now <
            monster.sprintUntil
        })
      ),

    scps:
      world.scps.map(
        (scp) => ({
          id: scp.id,
          type: scp.type,
          x: scp.x,
          y: scp.y
        })
      ),

    zombies:
      world.zombies
        .filter(
          (zombie) =>
            !zombie.dead
        )
        .map(
          (zombie) => ({
            id: zombie.id,
            variant:
              zombie.variant,
            x: zombie.x,
            y: zombie.y,
            hp: zombie.hp,
            maxHp:
              zombie.maxHp
          })
        ),

    boss:
      world.boss
        ? {
            ...world.boss
          }
        : null,

    doors:
      world.doors.map(
        (door) => ({
          id: door.id,
          amount:
            Math.round(
              door.amount * 100
            ) / 100,
          locked:
            door.locked
        })
      ),

    vehicles:
      [...world.vehicles.values()].map(
        (vehicle) => ({
          id: vehicle.id,
          type: vehicle.type,
          x: vehicle.x,
          y: vehicle.y,
          driverId:
            vehicle.driverId
        })
      ),

    buildBlocks:
      lobby.mode === "build"
        ? [...world.buildBlocks.values()]
        : [],

    world: {
      powerOn:
        world.powerOn,
      fogAmount:
        world.fogAmount,
      event:
        world.event,
      eventUntil:
        world.eventUntil,
      roundEndsAt:
        world.roundEndsAt,
      zombieWave:
        world.zombieWave,
      buildTime:
        world.buildTime,

      cat:
        world.cat
          ? {
              ...world.cat
            }
          : null,

      petPickup:
        world.petPickup?.active
          ? world.petPickup
          : null,

      ctf:
        world.ctf,

      minigame:
        lobby.mode === "minigame"
          ? world.minigame
          : null
    }
  };
}

/* ----------------------------------------------------------
   Build mode
---------------------------------------------------------- */

function placeBlock(client, data) {
  const lobby =
    LOBBIES.get(
      client.lobbyCode
    );

  if (
    !lobby ||
    lobby.mode !== "build"
  ) {
    return;
  }

  const player =
    client.player;

  const block =
    BLOCKS.find(
      (entry) =>
        entry.id === data.blockId
    );

  if (!block) return;

  const x =
    Math.round(
      Number(data.x) / 45
    ) * 45;

  const y =
    Math.round(
      Number(data.y) / 45
    ) * 45;

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    Math.hypot(
      x - player.x,
      y - player.y
    ) > 380
  ) {
    return;
  }

  if (
    lobby.world.buildBlocks.size >
    10000
  ) {
    return;
  }

  const placedId =
    id("placed_");

  lobby.world.buildBlocks.set(
    placedId,
    {
      id: placedId,
      blockId: block.id,
      x,
      y,
      ownerId: player.id
    }
  );
}

function removeBlock(client, data) {
  const lobby =
    LOBBIES.get(
      client.lobbyCode
    );

  if (
    !lobby ||
    lobby.mode !== "build"
  ) {
    return;
  }

  const player =
    client.player;

  const x = Number(data.x);
  const y = Number(data.y);

  let best = null;
  let bestDistance = 75;

  for (
    const block of
    lobby.world.buildBlocks.values()
  ) {
    const d =
      Math.hypot(
        block.x - x,
        block.y - y
      );

    if (d < bestDistance) {
      bestDistance = d;
      best = block;
    }
  }

  if (
    best &&
    distance(player, best) <
      420
  ) {
    lobby.world.buildBlocks.delete(
      best.id
    );
  }
}

/* ----------------------------------------------------------
   WebSocket
---------------------------------------------------------- */

function makeClient(ws) {
  return {
    id: id("client_"),
    ws,
    displayName: "Ducky",
    skin: "skin_1",
    account: null,
    lobbyCode: null,
    player: null,
    voiceReady: false,
    alive: true
  };
}

async function attachAccount(client, token) {
  if (!db || !token) return;

  const result = await db.query(
    `
      SELECT u.id, u.username, u.display_name, u.profile
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.expires_at > NOW()
    `,
    [hashToken(token)]
  );

  const row =
    result.rows[0];

  if (!row) return;

  client.account = {
    id: Number(row.id),
    username: row.username,
    displayName:
      row.display_name,
    profile:
      normalizeProfile(
        row.profile
      )
  };

  client.displayName =
    row.display_name;

  client.skin =
    client.account.profile.selectedSkin;
}

function voicePeers(lobby) {
  return [...lobby.members]
    .map(
      (idValue) =>
        CLIENTS.get(idValue)
    )
    .filter(
      (client) =>
        client?.voiceReady
    )
    .map(
      (client) => ({
        id: client.id,
        name:
          client.player?.name ||
          client.displayName
      })
    );
}

function updateVoicePeers(lobby) {
  broadcastLobby(lobby, {
    type: "voicePeers",
    peers: voicePeers(lobby)
  });
}

const server = http.createServer(
  async (req, res) => {
    try {
      const url = new URL(
        req.url,
        `http://${req.headers.host || "localhost"}`
      );

      const pathname =
        url.pathname;

      if (
        pathname.startsWith(
          "/api/"
        )
      ) {
        const handled =
          await handleApi(
            req,
            res,
            pathname
          );

        if (!handled) {
          json(res, 404, {
            error:
              "API-Endpunkt nicht gefunden."
          });
        }

        return;
      }

      let target =
        pathname === "/"
          ? "/index.html"
          : pathname;

      target =
        decodeURIComponent(target);

      const normalized =
        path.normalize(target)
          .replace(/^(\.\.[/\\])+/, "");

      const filePath =
        path.join(
          publicDir,
          normalized
        );

      if (
        !filePath.startsWith(
          publicDir
        )
      ) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      fs.stat(
        filePath,
        (error, stat) => {
          if (
            error ||
            !stat.isFile()
          ) {
            res.writeHead(404);
            res.end("Not found");
            return;
          }

          const ext =
            path.extname(filePath);

          const type =
            {
              ".html":
                "text/html; charset=utf-8",
              ".css":
                "text/css; charset=utf-8",
              ".js":
                "text/javascript; charset=utf-8",
              ".json":
                "application/json; charset=utf-8",
              ".webmanifest":
                "application/manifest+json"
            }[ext] ||
            "application/octet-stream";

          res.writeHead(200, {
            "Content-Type": type,
            "Cache-Control":
              ext === ".html"
                ? "no-cache"
                : "public, max-age=300"
          });

          fs.createReadStream(
            filePath
          ).pipe(res);
        }
      );
    } catch (error) {
      console.error(error);

      if (!res.headersSent) {
        json(res, 500, {
          error:
            "Serverfehler."
        });
      }
    }
  }
);

const wss =
  new WebSocketServer({
    server
  });

wss.on(
  "connection",
  (ws) => {
    const client =
      makeClient(ws);

    CLIENTS.set(
      client.id,
      client
    );

    send(ws, {
      type: "welcome",
      clientId:
        client.id
    });

    ws.on(
      "pong",
      () => {
        client.alive = true;
      }
    );

    ws.on(
      "message",
      async (raw) => {
        let data;

        try {
          data =
            JSON.parse(
              raw.toString()
            );
        } catch {
          return;
        }

        try {
          switch (data.type) {
            case "hello":
              client.displayName =
                safeName(
                  data.name
                );

              client.skin =
                safeId(
                  data.skin
                ) ||
                "skin_1";

              await attachAccount(
                client,
                data.token
              );

              break;

            case "createLobby":
              createLobby(
                client,
                data
              );
              break;

            case "joinLobby":
              joinLobby(
                client,
                data.code
              );
              break;

            case "leaveLobby":
              leaveLobby(
                client
              );

              send(ws, {
                type: "leftLobby"
              });

              break;

            case "input":
              if (
                client.player
              ) {
                client.player.inputX =
                  clamp(
                    Number(data.x) ||
                      0,
                    -1,
                    1
                  );

                client.player.inputY =
                  clamp(
                    Number(data.y) ||
                      0,
                    -1,
                    1
                  );

                client.player.propMoving =
                  Math.hypot(
                    client.player.inputX,
                    client.player.inputY
                  ) > 0.15;
              }
              break;

            case "jumpHeld":
              if (
                client.player
              ) {
                client.player.jumpHeld =
                  Boolean(data.held);
              }
              break;

            case "interact":
              await interact(
                client
              );
              break;

            case "fire":
              if (
                client.player &&
                client.lobbyCode
              ) {
                const lobby =
                  LOBBIES.get(
                    client.lobbyCode
                  );

                if (
                  lobby &&
                  [
                    "battle_royale_ffa",
                    "battle_royale_team",
                    "ctf",
                    "zombie",
                    "stormking"
                  ].includes(
                    lobby.mode
                  )
                ) {
                  fireWeapon(
                    lobby,
                    client.player,
                    Number(data.dx) || 0,
                    Number(data.dy) || 0
                  );
                }
              }
              break;

            case "chat": {
              const lobby =
                LOBBIES.get(
                  client.lobbyCode
                );

              if (
                !lobby ||
                !client.player
              ) {
                break;
              }

              const text =
                safeText(
                  data.text,
                  220
                );

              if (!text) break;

              const botResult =
                commandBots(
                  lobby,
                  client.player,
                  text
                );

              if (botResult) {
                send(ws, {
                  type: "chat",
                  from: "SYSTEM",
                  system: true,
                  text: botResult
                });

                break;
              }

              const gangResult =
                handleGangCommand(
                  lobby,
                  client.player,
                  text
                );

              if (gangResult) {
                send(ws, {
                  type: "chat",
                  from: "SYSTEM",
                  system: true,
                  text: gangResult
                });

                break;
              }

              broadcastLobby(
                lobby,
                {
                  type: "chat",
                  from:
                    client.player.name,
                  accountId:
                    client.player.accountId,
                  text
                }
              );

              break;
            }

            case "voteMap": {
              const lobby =
                LOBBIES.get(
                  client.lobbyCode
                );

              if (
                lobby?.world.phase ===
                  "voting" &&
                lobby.world.voteCandidates.includes(
                  data.mapId
                )
              ) {
                lobby.world.votes.set(
                  client.id,
                  data.mapId
                );
              }

              break;
            }

            case "buildPlace":
              placeBlock(
                client,
                data
              );
              break;

            case "buildRemove":
              removeBlock(
                client,
                data
              );
              break;

            case "voiceReady": {
              const lobby =
                LOBBIES.get(
                  client.lobbyCode
                );

              if (!lobby) break;

              client.voiceReady =
                Boolean(data.ready);

              updateVoicePeers(
                lobby
              );

              break;
            }

            case "voiceSignal": {
              const target =
                CLIENTS.get(
                  data.target
                );

              if (
                target &&
                target.lobbyCode ===
                  client.lobbyCode
              ) {
                send(
                  target.ws,
                  {
                    type:
                      "voiceSignal",
                    from:
                      client.id,
                    signal:
                      data.signal
                  }
                );
              }

              break;
            }

            default:
              break;
          }
        } catch (error) {
          console.error(
            "WS message error:",
            error
          );
        }
      }
    );

    ws.on(
      "close",
      () => {
        const lobby =
          LOBBIES.get(
            client.lobbyCode
          );

        leaveLobby(
          client
        );

        CLIENTS.delete(
          client.id
        );

        if (lobby) {
          updateVoicePeers(
            lobby
          );
        }
      }
    );
  }
);

setInterval(
  () => {
    const now =
      Date.now();

    for (const lobby of LOBBIES.values()) {
      if (!lobby.members.size) {
        continue;
      }

      updateWorld(
        lobby,
        now
      );
    }
  },
  1000 / PHYSICS_HZ
);

setInterval(
  () => {
    const now =
      Date.now();

    for (const lobby of LOBBIES.values()) {
      if (!lobby.members.size) {
        continue;
      }

      broadcastLobby(
        lobby,
        snapshot(
          lobby,
          now
        )
      );
    }
  },
  1000 / NETWORK_HZ
);

setInterval(
  () => {
    for (const client of CLIENTS.values()) {
      if (
        client.alive === false
      ) {
        client.ws.terminate();
        continue;
      }

      client.alive = false;

      if (
        client.ws.readyState ===
          WebSocket.OPEN
      ) {
        client.ws.ping();
      }
    }
  },
  25000
);

initDb()
  .then(() => {
    server.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `DuckyMaps 2D läuft auf Port ${PORT}`
        );
      }
    );
  })
  .catch((error) => {
    console.error(
      "Database startup failed:",
      error
    );

    process.exit(1);
  });
