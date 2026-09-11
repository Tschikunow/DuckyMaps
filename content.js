"use strict";

const crypto = require("crypto");

function hashSeed(text) {
  const hash = crypto
    .createHash("sha256")
    .update(String(text))
    .digest();

  return hash.readUInt32LE(0);
}

function seededRandom(seed) {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;

    let t = value;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const RARITIES = [
  { id: "common", name: "Gewöhnlich", color: "#9da3aa", weight: 44 },
  { id: "uncommon", name: "Ungewöhnlich", color: "#59c779", weight: 26 },
  { id: "rare", name: "Selten", color: "#4e91ff", weight: 16 },
  { id: "epic", name: "Episch", color: "#a766ff", weight: 9 },
  { id: "legendary", name: "Legendär", color: "#ffb443", weight: 4 },
  { id: "secret", name: "Secret", color: "#ff4f8d", weight: 1 }
];

function rarityByIndex(index) {
  if (index % 53 === 0) return RARITIES[5];
  if (index % 17 === 0) return RARITIES[4];
  if (index % 7 === 0) return RARITIES[3];
  if (index % 4 === 0) return RARITIES[2];
  if (index % 2 === 0) return RARITIES[1];
  return RARITIES[0];
}

/* ----------------------------------------------------------
   250+ Spieler-Skins
---------------------------------------------------------- */

const SKIN_PREFIXES = [
  "Ruby", "Mint", "Neon", "Midnight", "Solar", "Arctic", "Pixel",
  "Velvet", "Chrome", "Lemon", "Coral", "Violet", "Ocean", "Storm",
  "Taiga", "Marble", "Copper", "Jade", "Phantom", "Nova", "Retro",
  "Royal", "Concrete", "Lunar", "Circuit", "Cloud", "Ember", "Frost"
];

const SKIN_SUFFIXES = [
  "Duck", "Runner", "Scout", "Pilot", "Unit", "Nomad", "Ranger",
  "Echo", "Drifter", "Courier", "Explorer", "Artist", "Ghost",
  "Worker", "Traveler", "Knight", "Wanderer", "Diver", "Builder",
  "Agent"
];

const SKIN_COLORS = [
  ["#d34b52", "#f4c768"],
  ["#58bd98", "#e3f3cb"],
  ["#527bcf", "#efd15d"],
  ["#915bc1", "#efb1df"],
  ["#e57a55", "#ffd982"],
  ["#57a6c4", "#d8eff4"],
  ["#89969e", "#56e1e6"],
  ["#e4c243", "#e77d3f"],
  ["#343f61", "#e2c578"],
  ["#b75b76", "#efd7ba"],
  ["#58775a", "#efce7c"],
  ["#303844", "#d0e1ef"]
];

const PLAYER_SKINS = [];

for (let i = 0; i < 260; i += 1) {
  const rarity = rarityByIndex(i);
  const palette = SKIN_COLORS[i % SKIN_COLORS.length];

  PLAYER_SKINS.push({
    id: `skin_${i + 1}`,
    name:
      `${SKIN_PREFIXES[i % SKIN_PREFIXES.length]} ` +
      `${SKIN_SUFFIXES[Math.floor(i / SKIN_PREFIXES.length) % SKIN_SUFFIXES.length]}`,
    primary: palette[0],
    accent: palette[1],
    detail: SKIN_COLORS[(i + 5) % SKIN_COLORS.length][0],
    pattern: i % 8,
    rarity: rarity.id,
    rarityName: rarity.name,
    rarityColor: rarity.color,
    secret: rarity.id === "secret",
    challenge:
      i >= 230
        ? `challenge_${(i - 230) % 18}`
        : null
  });
}

/* ----------------------------------------------------------
   Pets
---------------------------------------------------------- */

const PET_NAMES = [
  ["cat", "Katze", "🐈"],
  ["dog", "Hund", "🐕"],
  ["dino", "Baby-Dinosaurier", "🦖"],
  ["duck", "Ente", "🦆"],
  ["dragon", "Mini-Drache", "🐉"],
  ["eagle", "Adler", "🦅"],
  ["turtle", "Schildkröte", "🐢"],
  ["chicken", "Huhn", "🐔"],
  ["wolf", "Wolf", "🐺"],
  ["suitcase", "Laufender Koffer", "🧳"],
  ["cactus", "Tanzender Kaktus", "🌵"],
  ["banana", "Laufende Banane", "🍌"],
  ["octopus", "Baby-Oktopus", "🐙"],
  ["fox", "Fuchs", "🦊"],
  ["frog", "Frosch", "🐸"],
  ["penguin", "Pinguin", "🐧"],
  ["seal", "Robbe", "🦭"],
  ["raccoon", "Waschbär", "🦝"],
  ["owl", "Eule", "🦉"],
  ["bee", "Riesenbiene", "🐝"],
  ["hamster", "Hamster", "🐹"],
  ["rabbit", "Hase", "🐰"],
  ["parrot", "Papagei", "🦜"],
  ["goat", "Mini-Ziege", "🐐"],
  ["cow", "Mini-Kuh", "🐄"],
  ["snail", "Leuchtschnecke", "🐌"],
  ["robot", "Pocket Bot", "🤖"],
  ["mushroom", "Laufender Pilz", "🍄"],
  ["cloud", "Wolkengeist", "☁️"],
  ["star", "Sternchen", "⭐"],
  ["moon", "Mondling", "🌙"],
  ["crab", "Krabbe", "🦀"],
  ["axolotl", "Axolotl", "🫧"],
  ["fish", "Schwebender Fisch", "🐟"],
  ["slime", "Mint-Slime", "🟢"],
  ["orb", "Orbit-Kugel", "🔵"]
];

const PETS = PET_NAMES.map((entry, index) => {
  const rarity = rarityByIndex(index + 3);

  return {
    id: entry[0],
    name: entry[1],
    icon: entry[2],
    rarity: rarity.id,
    rarityName: rarity.name,
    rarityColor: rarity.color,
    purchasable: false,
    description: "Kann zufällig während einer Runde gefunden werden."
  };
});

/* ----------------------------------------------------------
   Monsterformen
---------------------------------------------------------- */

const MONSTER_FORMS = [
  ["shadow", "Schattenläufer", "orb"],
  ["nightmare_snail", "Albtraumschnecke", "snail"],
  ["spider", "Gruselige Spinne", "spider"],
  ["wolf", "Horror-Werwolf", "wolf"],
  ["tall_man", "Unheimlicher Mann", "humanoid"],
  ["twisted_spider", "Verdrehte Spinne", "twistedSpider"],
  ["tentacle", "Tentakelwesen", "tentacle"],
  ["ghost", "Gruseliger Geist", "ghost"],
  ["crawler", "Kriecher", "crawler"],
  ["mask", "Maskenträger", "humanoid"],
  ["eye", "Das Auge", "eye"],
  ["antler", "Geweihwesen", "antler"],
  ["smoke", "Rauchkörper", "ghost"],
  ["clockwork", "Uhrwerk-Kreatur", "machine"],
  ["stone", "Steingolem", "golem"],
  ["mire", "Sumpfwesen", "crawler"],
  ["crystal", "Kristallbestie", "golem"],
  ["deep", "Tiefenwesen", "tentacle"],
  ["frost", "Frostgeist", "ghost"],
  ["hollow", "Hohlkörper", "humanoid"],
  ["static", "Störsignal", "orb"],
  ["moth", "Mottenwesen", "winged"],
  ["crow", "Krähenkönig", "winged"],
  ["void", "Leerenläufer", "orb"]
].map((entry, index) => {
  const rarity =
    index > 19
      ? RARITIES[5]
      : index > 13
        ? RARITIES[4]
        : index > 7
          ? RARITIES[3]
          : RARITIES[2];

  return {
    id: entry[0],
    name: entry[1],
    shape: entry[2],
    rarity: rarity.id,
    rarityName: rarity.name,
    rarityColor: rarity.color
  };
});

/* ----------------------------------------------------------
   Fiktive Arcade-Waffen
---------------------------------------------------------- */

const WEAPON_PREFIX = [
  "Pulse", "Nova", "Arc", "Prism", "Ion", "Echo", "Volt", "Frost",
  "Solar", "Lunar", "Comet", "Orbit", "Plasma", "Photon", "Glitch"
];

const WEAPON_SUFFIX = [
  "Carbine", "Blaster", "Repeater", "Caster", "Launcher", "Bow",
  "Tagger", "Cannon", "Emitter", "Sprayer", "Rifle", "Burst",
  "Disc", "Wand", "Driver"
];

const WEAPONS = [];

for (let i = 0; i < 60; i += 1) {
  const rarity = rarityByIndex(i + 9);

  WEAPONS.push({
    id: `weapon_${i + 1}`,
    name:
      `${WEAPON_PREFIX[i % WEAPON_PREFIX.length]} ` +
      `${WEAPON_SUFFIX[Math.floor(i / WEAPON_PREFIX.length) % WEAPON_SUFFIX.length]}`,
    category:
      ["pulse", "burst", "orb", "beam", "scatter"][i % 5],
    color:
      ["#68b8ff", "#f27777", "#ad76ff", "#61df9b", "#ffcc62"][i % 5],
    damage: 13 + (i % 7) * 2,
    cooldown: 170 + (i % 6) * 45,
    range: 520 + (i % 5) * 85,
    rarity: rarity.id,
    rarityName: rarity.name,
    rarityColor: rarity.color,
    price: 250 + i * 35
  });
}

/* ----------------------------------------------------------
   Musik: 60 eigene prozedurale Tracks
---------------------------------------------------------- */

const GENRES = [
  "Dark Electro Swing",
  "Boom Bap Swing",
  "Lo-Fi",
  "Dark Jazz",
  "Ambient",
  "Industrial",
  "Synthwave",
  "Hotel Lounge",
  "Trip Hop",
  "Space Ambient",
  "Cave Drone",
  "Night Drive"
];

const TRACK_WORD_A = [
  "Velvet", "Midnight", "Concrete", "Neon", "Dust", "Blue",
  "Obsidian", "Silver", "Quiet", "Broken", "Lunar", "Red"
];

const TRACK_WORD_B = [
  "Steps", "Lobby", "Swing", "Rain", "Signal", "Alley", "Tape",
  "Echo", "Static", "Train", "Room", "Harbor"
];

const TRACKS = [];

for (let i = 0; i < 60; i += 1) {
  TRACKS.push({
    id: `track_${i + 1}`,
    name:
      `${TRACK_WORD_A[i % TRACK_WORD_A.length]} ` +
      `${TRACK_WORD_B[(i * 5) % TRACK_WORD_B.length]}`,
    genre: GENRES[i % GENRES.length],
    bpm: 78 + (i * 7) % 48,
    root: 45 + (i * 3) % 18,
    seed: hashSeed(`duckymaps-track-${i}`)
  });
}

/* ----------------------------------------------------------
   200 Bauobjekte
---------------------------------------------------------- */

const BLOCK_BASE = [
  "Beton", "Ziegel", "Holz", "Marmor", "Glas", "Metall",
  "Sandstein", "Basalt", "Kristall", "Neon", "Erde", "Gras",
  "Schnee", "Eis", "Keramik", "Teppich", "Dunkelholz", "Kupfer",
  "Laborwand", "Industriewand"
];

const BLOCKS = [];

for (let i = 0; i < 200; i += 1) {
  const base = BLOCK_BASE[i % BLOCK_BASE.length];

  BLOCKS.push({
    id: `block_${i + 1}`,
    name: `${base} ${Math.floor(i / BLOCK_BASE.length) + 1}`,
    color: [
      "#969b9b", "#a86d59", "#8a684a", "#ddd8cd", "#9ed5da",
      "#657078", "#c89d64", "#484b50", "#769ed0", "#ec4d89",
      "#785c40", "#5f804f", "#e6ecec", "#b6dce8", "#d8d0bd",
      "#8a5962", "#5b4434", "#a87148", "#d7dcdd", "#777f84"
    ][i % 20],
    family:
      i % 10 === 0
        ? "light"
        : i % 7 === 0
          ? "furniture"
          : "block",
    solid: true
  });
}

/* ----------------------------------------------------------
   15 Minigames
---------------------------------------------------------- */

const MINIGAMES = [
  { id: "tic_tac_toe", name: "Tic Tac Toe", type: "board" },
  { id: "falling_blocks", name: "Falling Blocks", type: "arcade" },
  { id: "simon", name: "Simon Says", type: "memory" },
  { id: "color_floor", name: "Geh auf die Farbe", type: "reaction" },
  { id: "durak", name: "Durak", type: "cards" },
  { id: "memory_tiles", name: "Memory Tiles", type: "memory" },
  { id: "freeze_go", name: "Freeze & Go", type: "reaction" },
  { id: "coin_rush", name: "Coin Rush", type: "collect" },
  { id: "hot_orb", name: "Hot Orb", type: "party" },
  { id: "duck_race", name: "Duck Race", type: "race" },
  { id: "light_switch", name: "Light Switch", type: "reaction" },
  { id: "pattern_run", name: "Pattern Run", type: "memory" },
  { id: "king_tile", name: "King of the Tile", type: "zone" },
  { id: "target_dash", name: "Target Dash", type: "race" },
  { id: "maze_sprint", name: "Maze Sprint", type: "race" }
];

/* ----------------------------------------------------------
   Map-Helfer
---------------------------------------------------------- */

function makeBaseMap(spec) {
  return {
    id: spec.id,
    name: spec.name,
    subtitle: spec.subtitle || "",
    width: spec.width || 4600,
    height: spec.height || 3400,
    dark: Boolean(spec.dark),
    theme: spec.theme || "concrete",
    musicTags: spec.musicTags || ["Dark Electro Swing"],
    zones: [],
    walls: [],
    doors: [],
    props: [],
    hideouts: [],
    interactions: [],
    water: [],
    vehicles: [],
    npcs: [],
    spawns: [],
    monsterSpawn: {
      x: (spec.width || 4600) - 440,
      y: (spec.height || 3400) - 440
    },
    catSpawn: null,
    allowVehicles: Boolean(spec.vehicle),
    modeHint: spec.modeHint || null
  };
}

function zone(id, name, x, y, w, h, floor, color) {
  return { id, name, x, y, w, h, floor, color };
}

function wall(x, y, w, h, material = "wall") {
  return { x, y, w, h, material };
}

function door(id, x, y, w, h, axis = "horizontal") {
  return { id, x, y, w, h, axis };
}

function prop(id, type, x, y, w, h, solid = true, extra = {}) {
  return {
    id,
    type,
    x,
    y,
    w,
    h,
    solid,
    ...extra
  };
}

function interaction(id, type, x, y, label, extra = {}) {
  return {
    id,
    type,
    x,
    y,
    radius: 135,
    label,
    ...extra
  };
}

function addRoom(map, room, doorSide = "south") {
  const {
    id,
    name,
    x,
    y,
    w,
    h,
    type,
    floor = "tile",
    color = "#d5d5d0"
  } = room;

  map.zones.push(
    zone(id, name, x, y, w, h, floor, color)
  );

  const thickness = 20;
  const gap = 92;

  if (doorSide === "south" || doorSide === "north") {
    const gapX = x + w / 2 - gap / 2;
    const wallY = doorSide === "south" ? y + h - thickness : y;

    map.walls.push(
      wall(x, wallY, gapX - x, thickness, "interior"),
      wall(
        gapX + gap,
        wallY,
        x + w - (gapX + gap),
        thickness,
        "interior"
      )
    );

    map.doors.push(
      door(
        `${id}_door`,
        gapX,
        wallY,
        gap,
        thickness,
        "horizontal"
      )
    );

    map.walls.push(
      wall(x, y, thickness, h, "interior"),
      wall(x + w - thickness, y, thickness, h, "interior"),
      wall(
        x,
        doorSide === "north" ? y + h - thickness : y,
        w,
        thickness,
        "interior"
      )
    );
  } else {
    const gapY = y + h / 2 - gap / 2;
    const wallX = doorSide === "east" ? x + w - thickness : x;

    map.walls.push(
      wall(wallX, y, thickness, gapY - y, "interior"),
      wall(
        wallX,
        gapY + gap,
        thickness,
        y + h - (gapY + gap),
        "interior"
      )
    );

    map.doors.push(
      door(
        `${id}_door`,
        wallX,
        gapY,
        thickness,
        gap,
        "vertical"
      )
    );

    map.walls.push(
      wall(x, y, w, thickness, "interior"),
      wall(x, y + h - thickness, w, thickness, "interior"),
      wall(
        doorSide === "east" ? x : x + w - thickness,
        y,
        thickness,
        h,
        "interior"
      )
    );
  }

  decorateRoom(map, room, type);
}

function decorateRoom(map, room, type) {
  const {
    id, x, y, w, h
  } = room;

  const cx = x + w / 2;
  const cy = y + h / 2;

  const safeX = x + 80;
  const safeY = y + 80;

  const addLocker = (suffix, px, py) => {
    const lockerId = `${id}_locker_${suffix}`;

    map.props.push(
      prop(lockerId, "locker", px, py, 68, 104, true)
    );

    map.hideouts.push({
      id: `${lockerId}_hide`,
      type: "locker",
      x: px,
      y: py,
      w: 68,
      h: 104,
      entranceX: px - 46,
      entranceY: py + 52,
      hideX: px + 34,
      hideY: py + 52,
      label: "Im Spind verstecken"
    });
  };

  switch (type) {
    case "concertHall":
      map.props.push(
        prop(`${id}_stage`, "stage", x + w - 360, y + 120, 260, h - 240, true),
        prop(`${id}_speaker1`, "speaker", x + w - 430, y + 170, 60, 80, true),
        prop(`${id}_speaker2`, "speaker", x + w - 430, y + h - 250, 60, 80, true),
        prop(`${id}_piano`, "piano", x + w - 300, cy - 60, 150, 80, true)
      );

      map.interactions.push(
        interaction(`${id}_piano_action`, "piano", x + w - 230, cy, "Musikboard öffnen")
      );

      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          const tx = x + 160 + col * 180;
          const ty = y + 170 + row * 190;

          map.props.push(
            prop(`${id}_table_${row}_${col}`, "table", tx, ty, 90, 90, true),
            prop(`${id}_chair_a_${row}_${col}`, "chair", tx - 35, ty - 48, 36, 36, true),
            prop(`${id}_chair_b_${row}_${col}`, "chair", tx + 90, ty + 48, 36, 36, true)
          );
        }
      }
      break;

    case "kitchen":
      map.props.push(
        prop(`${id}_counter1`, "counter", safeX, safeY, w - 160, 65, true),
        prop(`${id}_counter2`, "counter", safeX, y + h - 145, w - 160, 65, true),
        prop(`${id}_fridge`, "fridge", x + w - 145, cy - 70, 70, 120, true),
        prop(`${id}_sink`, "sink", safeX + 100, safeY, 85, 65, true),
        prop(`${id}_oven`, "oven", safeX + 220, y + h - 145, 85, 65, true)
      );
      break;

    case "toilet":
      for (let i = 0; i < 4; i += 1) {
        map.props.push(
          prop(`${id}_stall_${i}`, "toiletStall", x + 80 + i * 110, y + 90, 80, 105, true)
        );
      }

      map.props.push(
        prop(`${id}_sink1`, "sink", x + 120, y + h - 140, 85, 55, true),
        prop(`${id}_sink2`, "sink", x + 245, y + h - 140, 85, 55, true)
      );
      break;

    case "storage":
      for (let i = 0; i < 4; i += 1) {
        map.props.push(
          prop(
            `${id}_shelf_${i}`,
            "shelf",
            x + 80,
            y + 80 + i * 105,
            Math.max(120, w - 160),
            46,
            true
          )
        );
      }

      addLocker("a", x + w - 150, y + h - 160);
      break;

    case "backstage":
      map.props.push(
        prop(`${id}_sofa`, "sofa", safeX, safeY, 190, 70, true),
        prop(`${id}_mirror`, "mirror", x + w - 250, safeY, 170, 55, true),
        prop(`${id}_case1`, "case", safeX, y + h - 150, 90, 65, true),
        prop(`${id}_case2`, "case", safeX + 120, y + h - 150, 90, 65, true)
      );

      addLocker("a", x + w - 180, y + h - 160);
      addLocker("b", x + w - 100, y + h - 160);
      break;

    case "office":
    case "security":
      for (let i = 0; i < 3; i += 1) {
        map.props.push(
          prop(`${id}_desk_${i}`, "desk", x + 90 + i * 150, y + 110, 120, 65, true),
          prop(`${id}_pc_${i}`, "computer", x + 120 + i * 150, y + 95, 48, 38, true)
        );
      }

      addLocker("a", x + w - 140, y + h - 160);
      break;

    case "hotelLobby":
      map.props.push(
        prop(`${id}_reception`, "reception", cx - 170, y + 90, 340, 75, true),
        prop(`${id}_sofa1`, "sofa", x + 100, cy, 190, 70, true),
        prop(`${id}_sofa2`, "sofa", x + w - 290, cy, 190, 70, true),
        prop(`${id}_piano`, "piano", cx - 80, y + h - 165, 160, 80, true),
        prop(`${id}_plant1`, "plant", x + 80, y + h - 120, 55, 55, true),
        prop(`${id}_plant2`, "plant", x + w - 135, y + h - 120, 55, 55, true)
      );

      map.interactions.push(
        interaction(`${id}_piano_action`, "piano", cx, y + h - 120, "Musikboard öffnen")
      );
      break;

    case "guestroom":
      map.props.push(
        prop(`${id}_bed`, "bed", safeX, safeY, 185, 95, true),
        prop(`${id}_desk`, "desk", x + w - 220, safeY, 130, 65, true),
        prop(`${id}_wardrobe`, "cabinet", x + w - 150, y + h - 170, 75, 120, true)
      );

      map.hideouts.push({
        id: `${id}_wardrobe_hide`,
        type: "cabinet",
        x: x + w - 150,
        y: y + h - 170,
        w: 75,
        h: 120,
        entranceX: x + w - 190,
        entranceY: y + h - 110,
        hideX: x + w - 112,
        hideY: y + h - 110,
        label: "Im Schrank verstecken"
      });
      break;

    case "market":
    case "shop":
      for (let i = 0; i < 4; i += 1) {
        map.props.push(
          prop(`${id}_shelf_${i}`, "shopShelf", x + 100, y + 100 + i * 100, w - 260, 45, true)
        );
      }

      map.props.push(
        prop(`${id}_register`, "register", x + w - 170, y + 100, 90, 55, true),
        prop(`${id}_vending`, "vending", x + w - 165, y + h - 190, 80, 125, true)
      );

      map.interactions.push(
        interaction(`${id}_vending_action`, "vending", x + w - 125, y + h - 125, "Getränkeautomat")
      );

      map.npcs.push({
        id: `${id}_trader`,
        type: "villager",
        x: x + w - 220,
        y: cy,
        name: "Händler",
        trader: true
      });
      break;

    case "lab":
      for (let i = 0; i < 3; i += 1) {
        map.props.push(
          prop(`${id}_lab_${i}`, "labTable", x + 95 + i * 160, y + 110, 125, 65, true)
        );
      }

      map.props.push(
        prop(`${id}_server`, "serverRack", x + w - 155, y + h - 180, 70, 125, true)
      );

      addLocker("a", x + 80, y + h - 170);
      break;

    case "server":
      for (let i = 0; i < 5; i += 1) {
        map.props.push(
          prop(`${id}_rack_${i}`, "serverRack", x + 90 + i * 100, y + 100, 65, h - 200, true)
        );
      }
      break;

    case "maintenance":
      map.props.push(
        prop(`${id}_generator`, "generator", safeX, safeY, 170, 100, true),
        prop(`${id}_toolcart`, "toolCart", safeX + 230, safeY, 90, 70, true),
        prop(`${id}_power`, "powerBox", x + w - 150, y + 95, 65, 85, true)
      );

      map.interactions.push(
        interaction(`${id}_power_action`, "power", x + w - 115, y + 135, "Strom umschalten")
      );

      addLocker("a", x + w - 150, y + h - 165);
      break;

    case "church":
      for (let row = 0; row < 4; row += 1) {
        map.props.push(
          prop(`${id}_pew_l_${row}`, "pew", x + 90, y + 100 + row * 110, w * 0.32, 45, true),
          prop(`${id}_pew_r_${row}`, "pew", x + w * 0.58, y + 100 + row * 110, w * 0.32, 45, true)
        );
      }

      map.props.push(
        prop(`${id}_altar`, "altar", cx - 80, y + 70, 160, 70, true)
      );
      break;

    case "barn":
      map.props.push(
        prop(`${id}_hay1`, "hay", x + 90, y + 100, 110, 90, true),
        prop(`${id}_hay2`, "hay", x + 230, y + 100, 110, 90, true),
        prop(`${id}_trough`, "trough", x + w - 260, y + 100, 170, 65, true),
        prop(`${id}_stall1`, "animalStall", x + 100, y + h - 190, 180, 110, true),
        prop(`${id}_stall2`, "animalStall", x + 320, y + h - 190, 180, 110, true)
      );

      map.npcs.push(
        {
          id: `${id}_cow`,
          type: "animal",
          animal: "cow",
          x: x + 190,
          y: y + h - 135
        },
        {
          id: `${id}_chicken`,
          type: "animal",
          animal: "chicken",
          x: x + 410,
          y: y + h - 130
        }
      );
      break;

    case "lounge":
      map.props.push(
        prop(`${id}_sofa1`, "sofa", x + 90, y + 90, 190, 70, true),
        prop(`${id}_sofa2`, "sofa", x + w - 280, y + 90, 190, 70, true),
        prop(`${id}_table`, "coffeeTable", cx - 65, cy, 130, 75, true),
        prop(`${id}_plant`, "plant", x + w - 140, y + h - 140, 55, 55, true)
      );
      break;

    default:
      map.props.push(
        prop(`${id}_bench1`, "bench", x + 100, y + 100, 160, 55, true),
        prop(`${id}_bench2`, "bench", x + w - 260, y + h - 150, 160, 55, true)
      );
      break;
  }
}

function buildIndoor(spec) {
  const map = makeBaseMap(spec);
  const rng = seededRandom(hashSeed(spec.id));

  map.zones.push(
    zone(
      `${spec.id}_corridors`,
      "",
      100,
      100,
      map.width - 200,
      map.height - 200,
      spec.corridorFloor || "tile",
      spec.corridorColor || "#c7c9c8"
    )
  );

  const cols = spec.cols || 4;
  const rows = Math.ceil(spec.rooms.length / cols);

  const margin = 170;
  const gap = 95;

  const cellW =
    (map.width - margin * 2 - gap * (cols - 1)) / cols;

  const cellH =
    (map.height - margin * 2 - gap * (rows - 1)) / rows;

  spec.rooms.forEach((entry, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    const insetX = 8 + rng() * 24;
    const insetY = 8 + rng() * 24;

    const room = {
      id: `${spec.id}_room_${index}`,
      name: entry[0],
      type: entry[1],
      x: margin + col * (cellW + gap) + insetX,
      y: margin + row * (cellH + gap) + insetY,
      w: cellW - 18 - rng() * 20,
      h: cellH - 18 - rng() * 20,
      floor: entry[2] || spec.roomFloor || "tile",
      color: entry[3] || spec.roomColor || "#d5d5d0"
    };

    let side;

    if (row === 0) {
      side = "south";
    } else if (row === rows - 1) {
      side = "north";
    } else {
      side = col % 2 === 0 ? "east" : "west";
    }

    addRoom(map, room, side);
  });

  map.spawns = [
    { x: map.width * 0.47, y: map.height * 0.5 },
    { x: map.width * 0.52, y: map.height * 0.5 },
    { x: map.width * 0.5, y: map.height * 0.55 },
    { x: map.width * 0.45, y: map.height * 0.55 }
  ];

  map.catSpawn = {
    x: map.width * 0.52,
    y: map.height * 0.62
  };

  if (spec.vehicle) {
    map.vehicles.push(
      {
        id: `${spec.id}_vehicle_1`,
        type: spec.vehicle,
        x: map.width * 0.45,
        y: map.height - 260
      },
      {
        id: `${spec.id}_vehicle_2`,
        type: spec.vehicle,
        x: map.width * 0.55,
        y: map.height - 260
      }
    );
  }

  map.interactions.push(
    interaction(
      `${spec.id}_bell`,
      "bell",
      map.width * 0.5,
      map.height * 0.45,
      "Glocke läuten"
    )
  );

  map.props.push(
    prop(
      `${spec.id}_bell_prop`,
      "bell",
      map.width * 0.5 - 32,
      map.height * 0.45 - 32,
      64,
      64,
      true
    )
  );

  return map;
}

function buildOutdoor(spec) {
  const map = makeBaseMap(spec);
  const rng = seededRandom(hashSeed(spec.id));

  map.zones.push(
    zone(
      `${spec.id}_outside`,
      spec.outsideName || "",
      0,
      0,
      map.width,
      map.height,
      spec.ground || "grass",
      spec.groundColor || "#60735a"
    )
  );

  const treeType =
    spec.theme === "snow"
      ? "snowPine"
      : spec.theme === "desert"
        ? "desertRock"
        : "tree";

  const obstacleCount =
    spec.obstacleCount || 90;

  for (let i = 0; i < obstacleCount; i += 1) {
    const x = 80 + rng() * (map.width - 160);
    const y = 80 + rng() * (map.height - 160);

    if (
      x > map.width * 0.3 &&
      x < map.width * 0.7 &&
      y > map.height * 0.3 &&
      y < map.height * 0.7
    ) {
      continue;
    }

    map.props.push(
      prop(
        `${spec.id}_nature_${i}`,
        treeType,
        x,
        y,
        55 + rng() * 45,
        55 + rng() * 45,
        true
      )
    );
  }

  const buildingCols = 3;
  const buildingRows = Math.ceil(spec.rooms.length / buildingCols);

  const bw = 850;
  const bh = 600;

  spec.rooms.forEach((entry, index) => {
    const col = index % buildingCols;
    const row = Math.floor(index / buildingCols);

    const x = 450 + col * 1250 + (row % 2) * 90;
    const y = 450 + row * 900;

    addRoom(
      map,
      {
        id: `${spec.id}_building_${index}`,
        name: entry[0],
        type: entry[1],
        x,
        y,
        w: bw,
        h: bh,
        floor: entry[2] || "wood",
        color: entry[3] || "#9f896f"
      },
      row % 2 === 0 ? "south" : "north"
    );
  });

  if (spec.waterRight) {
    const lakeX = map.width * 0.72;

    map.water.push({
      id: `${spec.id}_lake`,
      x: lakeX,
      y: 0,
      w: map.width - lakeX,
      h: map.height,
      color: "#4d8192"
    });

    map.vehicles.push(
      {
        id: `${spec.id}_boat_1`,
        type: "boat",
        x: lakeX + 260,
        y: map.height * 0.38
      },
      {
        id: `${spec.id}_boat_2`,
        type: "boat",
        x: lakeX + 420,
        y: map.height * 0.58
      }
    );
  } else if (spec.vehicle) {
    map.vehicles.push(
      {
        id: `${spec.id}_vehicle_1`,
        type: spec.vehicle,
        x: map.width * 0.42,
        y: map.height * 0.56
      },
      {
        id: `${spec.id}_vehicle_2`,
        type: spec.vehicle,
        x: map.width * 0.55,
        y: map.height * 0.56
      }
    );
  }

  map.spawns = [
    { x: 260, y: 260 },
    { x: 400, y: 260 },
    { x: 260, y: 420 },
    { x: 420, y: 420 }
  ];

  map.monsterSpawn = {
    x: map.width - 350,
    y: map.height - 350
  };

  map.catSpawn = {
    x: map.width * 0.5,
    y: map.height * 0.5
  };

  return map;
}

function buildBackrooms(spec) {
  const map = makeBaseMap(spec);
  const cols = 14;
  const rows = 10;
  const cell = 290;
  const ox = 180;
  const oy = 180;

  map.width = cols * cell + ox * 2;
  map.height = rows * cell + oy * 2;

  map.zones.push(
    zone(
      "backrooms_floor",
      "LEVEL 0",
      0,
      0,
      map.width,
      map.height,
      "backroomsCarpet",
      "#b6aa75"
    )
  );

  const visited = Array.from(
    { length: rows },
    () => Array(cols).fill(false)
  );

  const edges = new Set();

  function edgeKey(a, b) {
    const first = `${a.x},${a.y}`;
    const second = `${b.x},${b.y}`;

    return first < second
      ? `${first}|${second}`
      : `${second}|${first}`;
  }

  const stack = [{ x: 0, y: 0 }];
  visited[0][0] = true;

  const rng = seededRandom(hashSeed(spec.id));

  while (stack.length) {
    const current = stack[stack.length - 1];

    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 }
    ].filter(
      (n) =>
        n.x >= 0 &&
        n.y >= 0 &&
        n.x < cols &&
        n.y < rows &&
        !visited[n.y][n.x]
    );

    if (!neighbors.length) {
      stack.pop();
      continue;
    }

    const next =
      neighbors[Math.floor(rng() * neighbors.length)];

    edges.add(edgeKey(current, next));

    visited[next.y][next.x] = true;
    stack.push(next);
  }

  const thickness = 18;

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const px = ox + x * cell;
      const py = oy + y * cell;

      if (y === 0) {
        map.walls.push(
          wall(px, py, cell, thickness, "backrooms")
        );
      }

      if (x === 0) {
        map.walls.push(
          wall(px, py, thickness, cell, "backrooms")
        );
      }

      if (
        x === cols - 1 ||
        !edges.has(
          edgeKey(
            { x, y },
            { x: x + 1, y }
          )
        )
      ) {
        map.walls.push(
          wall(px + cell - thickness, py, thickness, cell, "backrooms")
        );
      }

      if (
        y === rows - 1 ||
        !edges.has(
          edgeKey(
            { x, y },
            { x, y: y + 1 }
          )
        )
      ) {
        map.walls.push(
          wall(px, py + cell - thickness, cell, thickness, "backrooms")
        );
      }
    }
  }

  /* Absichtlich keine Möbel in Level 0. */

  map.spawns = [
    { x: ox + cell * 0.5, y: oy + cell * 0.5 },
    { x: ox + cell * 0.7, y: oy + cell * 0.5 }
  ];

  map.monsterSpawn = {
    x: ox + cell * 13.5,
    y: oy + cell * 9.5
  };

  map.catSpawn = null;

  return map;
}

function buildFog(spec) {
  const map = buildOutdoor({
    ...spec,
    width: 5600,
    height: 4200,
    ground: "grass",
    groundColor: "#48594c",
    obstacleCount: 150,
    vehicle: "car"
  });

  map.dark = true;
  map.modeHint = "fog";

  map.zones.push(
    zone("fog_fields", "FELDER", 2600, 2600, 1600, 1200, "field", "#6f704b"),
    zone("fog_town", "KLEINSTADT", 650, 550, 2100, 1700, "road", "#5d6263"),
    zone("fog_farm", "BAUERNHOF", 3500, 550, 1500, 1500, "dirt", "#64563d")
  );

  return map;
}

function buildRunewaste(spec) {
  const map = makeBaseMap({
    ...spec,
    width: 5000,
    height: 3700,
    dark: true
  });

  map.zones.push(
    zone("dead_ground", "RUNENÖDE", 0, 0, map.width, map.height, "ash", "#494543")
  );

  const rng = seededRandom(hashSeed(spec.id));

  for (let i = 0; i < 90; i += 1) {
    map.props.push(
      prop(
        `ruin_${i}`,
        i % 4 === 0 ? "runeStone" : "deadRock",
        150 + rng() * (map.width - 300),
        150 + rng() * (map.height - 300),
        40 + rng() * 100,
        40 + rng() * 100,
        true
      )
    );
  }

  for (let i = 0; i < 18; i += 1) {
    const angle = (Math.PI * 2 * i) / 18;

    map.props.push(
      prop(
        `center_rune_${i}`,
        "rune",
        map.width / 2 + Math.cos(angle) * 500,
        map.height / 2 + Math.sin(angle) * 500,
        55,
        55,
        false
      )
    );
  }

  map.spawns = [
    { x: 500, y: map.height / 2 - 200 },
    { x: 500, y: map.height / 2 },
    { x: 500, y: map.height / 2 + 200 }
  ];

  map.monsterSpawn = {
    x: map.width / 2,
    y: map.height / 2
  };

  return map;
}

/* ----------------------------------------------------------
   50 Maps
---------------------------------------------------------- */

const MAP_SPECS = [
  {
    id: "concert",
    name: "Konzerthalle",
    subtitle: "Helle Veranstaltungshalle mit Bühne, Backstage, Küche und WC.",
    kind: "indoor",
    theme: "bright",
    musicTags: ["Dark Electro Swing", "Boom Bap Swing"],
    rooms: [
      ["Große Halle", "concertHall", "wood", "#bc936b"],
      ["Backstage", "backstage"],
      ["Stuhl- & Tischlager", "storage"],
      ["Küche", "kitchen"],
      ["WC / Waschräume", "toilet"],
      ["Foyer", "hotelLobby"],
      ["Greenroom", "lounge"],
      ["Technik", "maintenance"],
      ["Garderobe", "storage"],
      ["Büro", "office"],
      ["Bar", "shop"],
      ["Ladebereich", "storage"]
    ]
  },
  {
    id: "taiga",
    name: "Taiga",
    subtitle: "Großer kalter Taigawald mit Holzhaus, Schuppen und Bach.",
    kind: "outdoor",
    dark: true,
    theme: "forest",
    vehicle: "offroad",
    rooms: [
      ["Holzhaus", "lounge"],
      ["Küche", "kitchen"],
      ["Försterschuppen", "storage"],
      ["Werkstatt", "maintenance"],
      ["Waldladen", "shop"],
      ["Jägerhütte", "lounge"]
    ]
  },
  {
    id: "construct",
    name: "Construct",
    subtitle: "Eigene 2D-Sandbox aus Beton, Hallen, Rampen und Testbereichen.",
    kind: "indoor",
    theme: "concrete",
    vehicle: "buggy",
    rooms: [
      ["Sandbox", "storage"],
      ["Werkhalle", "maintenance"],
      ["Testlabor", "lab"],
      ["Control", "security"],
      ["Prop-Lager", "storage"],
      ["Musikraum", "concertHall"],
      ["Maschinenraum", "maintenance"],
      ["Testkammer", "lab"]
    ]
  },
  {
    id: "garage",
    name: "Tiefgarage",
    subtitle: "Unterirdisches Parkhaus mit Shop, Aufzug, Security und Technik.",
    kind: "indoor",
    theme: "garage",
    vehicle: "car",
    rooms: [
      ["Parkdeck A", "storage"],
      ["24H Shop", "shop"],
      ["Security", "security"],
      ["Aufzugslobby", "hotelLobby"],
      ["Technikgang", "maintenance"],
      ["Lager", "storage"],
      ["Parkdeck B", "storage"],
      ["Wartung", "maintenance"]
    ]
  },
  {
    id: "pool",
    name: "Hallenbad",
    subtitle: "Großes Hallenbad mit Becken, Umkleiden, Technik und Café.",
    kind: "indoor",
    theme: "pool",
    rooms: [
      ["Schwimmhalle", "lounge"],
      ["Umkleide", "storage"],
      ["Duschen", "toilet"],
      ["Technik", "maintenance"],
      ["Café", "shop"],
      ["Personalraum", "office"],
      ["Sauna", "lounge"],
      ["Lager", "storage"]
    ]
  },
  {
    id: "rail_depot",
    name: "Bahndepot",
    subtitle: "Werkhallen, Gleise, Leitstand und alte Waggons.",
    kind: "indoor",
    theme: "industrial",
    vehicle: "cart",
    rooms: [
      ["Werkhalle", "maintenance"],
      ["Leitstand", "security"],
      ["Ersatzteillager", "storage"],
      ["Personalraum", "lounge"],
      ["Waschhalle", "maintenance"],
      ["Büro", "office"],
      ["Kantine", "kitchen"],
      ["Signalraum", "server"]
    ]
  },
  {
    id: "backrooms0",
    name: "Backrooms - Level 0",
    subtitle: "Gelbe liminale Korridore, Teppich und Leuchtstofflicht. Ohne Möbel.",
    kind: "backrooms",
    theme: "backrooms",
    musicTags: ["Ambient", "Dark Jazz"]
  },
  {
    id: "eastblock",
    name: "Plattenbauviertel",
    subtitle: "Verschneites brutalistisches Wohnviertel mit Kellern und Läden.",
    kind: "outdoor",
    theme: "snow",
    vehicle: "car",
    rooms: [
      ["Block A", "lounge"],
      ["Block B", "lounge"],
      ["Keller", "storage"],
      ["Kiosk", "shop"],
      ["Garage", "maintenance"],
      ["Hausverwaltung", "office"],
      ["Treppenhaus", "storage"],
      ["Waschkeller", "maintenance"]
    ]
  },
  {
    id: "villa_bellavista",
    name: "Villa Bellavista",
    subtitle: "Eine zusammenhängende Luxusvilla mit großem Garten und Pool.",
    kind: "indoor",
    theme: "villa",
    rooms: [
      ["Eingangshalle", "hotelLobby"],
      ["Wohnzimmer", "lounge"],
      ["Esszimmer", "lounge"],
      ["Küche", "kitchen"],
      ["Bibliothek", "office"],
      ["Mastersuite", "guestroom"],
      ["Gästezimmer", "guestroom"],
      ["Bad", "toilet"],
      ["Garage", "storage"],
      ["Pool-Lounge", "lounge"],
      ["Fitnessraum", "lounge"],
      ["Weinkeller", "storage"]
    ]
  },
  {
    id: "mall",
    name: "Einkaufszentrum",
    subtitle: "Läden, Markt, Kassen, Food-Bereich, Lager und viele Händler.",
    kind: "indoor",
    theme: "mall",
    rooms: [
      ["Markthalle", "market"],
      ["Modegeschäft", "shop"],
      ["Item-Shop", "shop"],
      ["Food Court", "kitchen"],
      ["Supermarkt", "market"],
      ["Lager", "storage"],
      ["Security", "security"],
      ["Technik", "maintenance"],
      ["Spielwaren", "shop"],
      ["Café", "shop"],
      ["Personal", "office"],
      ["Atrium", "hotelLobby"]
    ]
  },
  {
    id: "hotel_meridian",
    name: "Hotel Meridian - 1964",
    subtitle: "Elegantes amerikanisch inspiriertes 1960er-Hotel.",
    kind: "indoor",
    theme: "hotel60",
    rooms: [
      ["Grand Lobby", "hotelLobby"],
      ["Ballsaal", "concertHall"],
      ["Restaurant", "lounge"],
      ["Hotelküche", "kitchen"],
      ["Suite 601", "guestroom"],
      ["Suite 602", "guestroom"],
      ["Suite 603", "guestroom"],
      ["Service", "storage"],
      ["Lounge", "lounge"],
      ["Bar", "shop"],
      ["Management", "office"],
      ["Wäscherei", "maintenance"]
    ]
  },
  {
    id: "farm",
    name: "Bauernhof",
    subtitle: "Bauernhaus, Stall, Tiere, Scheune, Felder und Werkstatt.",
    kind: "outdoor",
    theme: "farm",
    vehicle: "tractor",
    rooms: [
      ["Bauernhaus", "lounge"],
      ["Bauernküche", "kitchen"],
      ["Großer Stall", "barn"],
      ["Scheune", "storage"],
      ["Werkstatt", "maintenance"],
      ["Hofladen", "shop"]
    ]
  },
  {
    id: "hotel_obsidian",
    name: "Hotel Obsidian - Level 5",
    subtitle: "Dunkles liminales Hotel mit Ballsaal und Servicegängen.",
    kind: "indoor",
    dark: true,
    theme: "obsidianHotel",
    rooms: [
      ["Obsidian Lobby", "hotelLobby"],
      ["Ballsaal", "concertHall"],
      ["Zimmer 501", "guestroom"],
      ["Zimmer 502", "guestroom"],
      ["Zimmer 503", "guestroom"],
      ["Küche", "kitchen"],
      ["Servicegang", "storage"],
      ["Heizraum", "maintenance"],
      ["Lounge", "lounge"],
      ["Archiv", "storage"],
      ["Büro", "office"],
      ["Speisesaal", "lounge"]
    ]
  },
  {
    id: "cellar_maze",
    name: "Kellerlabyrinth",
    subtitle: "Enge Keller, Rohre, Lagerräume und unheimliche Wartungsgänge.",
    kind: "indoor",
    dark: true,
    theme: "horror",
    modeHint: "horror",
    rooms: [
      ["Heizkeller", "maintenance"],
      ["Altes Lager", "storage"],
      ["Sicherung", "maintenance"],
      ["Waschkeller", "storage"],
      ["Pumpenraum", "maintenance"],
      ["Archiv", "storage"],
      ["Tunnel A", "storage"],
      ["Tunnel B", "storage"],
      ["Wartung", "maintenance"],
      ["Verschlossener Raum", "storage"],
      ["Kesselraum", "maintenance"],
      ["Geheimraum", "storage"]
    ]
  },
  {
    id: "scp_facility",
    name: "SCP-Anlage",
    subtitle: "Büros, Labore, Zellen, Sicherheitsschleusen und Kontrollräume.",
    kind: "indoor",
    theme: "facility",
    modeHint: "scp",
    rooms: [
      ["Eingang", "security"],
      ["Bürotrakt", "office"],
      ["Labor A", "lab"],
      ["Labor B", "lab"],
      ["Sicherheitszentrale", "security"],
      ["Server Core", "server"],
      ["Zelltrakt A", "storage"],
      ["Zelltrakt B", "storage"],
      ["Medizin", "lab"],
      ["Wartung", "maintenance"],
      ["Archiv", "storage"],
      ["Kantine", "kitchen"]
    ]
  },
  {
    id: "runewaste",
    name: "Runenöde",
    subtitle: "Tote Bosslandschaft mit Ruinen und uralten Runen.",
    kind: "runewaste",
    dark: true,
    theme: "dead",
    modeHint: "stormking"
  },
  {
    id: "battle_island",
    name: "Battle Island",
    subtitle: "Große Arena-Insel für Battle Royale und Teamkämpfe.",
    kind: "outdoor",
    theme: "island",
    vehicle: "buggy",
    rooms: [
      ["Hafenlager", "storage"],
      ["Kontrollturm", "security"],
      ["Werkstatt", "maintenance"],
      ["Markt", "shop"],
      ["Bunker", "storage"],
      ["Villa", "lounge"]
    ]
  },
  {
    id: "crystal_caves",
    name: "Kristallhöhlen",
    subtitle: "Großes Höhlensystem mit Kristallen, Minenstation und Seen.",
    kind: "indoor",
    dark: true,
    theme: "cave",
    rooms: [
      ["Kristallkammer", "storage"],
      ["Minenlager", "storage"],
      ["Bohrstation", "maintenance"],
      ["Forschung", "lab"],
      ["Unterirdischer See", "lounge"],
      ["Generator", "maintenance"],
      ["Camp", "lounge"],
      ["Tunnelstation", "storage"]
    ]
  },
  {
    id: "borealis",
    name: "Eisbrecher Borealis",
    subtitle: "Verlassener Eisbrecher mit Decks, Maschinenraum und Kabinen.",
    kind: "indoor",
    theme: "ship",
    rooms: [
      ["Brücke", "security"],
      ["Maschinenraum", "maintenance"],
      ["Kabine A", "guestroom"],
      ["Kabine B", "guestroom"],
      ["Messe", "kitchen"],
      ["Laderaum", "storage"],
      ["Funkraum", "server"],
      ["Werkstatt", "maintenance"]
    ]
  },
  {
    id: "station_abyss",
    name: "Station Abyss",
    subtitle: "Tiefsee-Forschungsstation mit Laboren und Beobachtungskuppel.",
    kind: "indoor",
    dark: true,
    theme: "deepsea",
    rooms: [
      ["Observation", "lounge"],
      ["Labor A", "lab"],
      ["Labor B", "lab"],
      ["Schleuse", "storage"],
      ["Pumpen", "maintenance"],
      ["Crewraum", "guestroom"],
      ["Kontrolle", "security"],
      ["Server", "server"]
    ]
  },
  {
    id: "volcano",
    name: "Vulkanobservatorium",
    subtitle: "Forschungsbasis an einem aktiven Vulkan.",
    kind: "indoor",
    theme: "volcano",
    rooms: [
      ["Observatorium", "lab"],
      ["Kontrollraum", "security"],
      ["Geologielabor", "lab"],
      ["Werkstatt", "maintenance"],
      ["Crewraum", "guestroom"],
      ["Lager", "storage"],
      ["Generator", "maintenance"],
      ["Kantine", "kitchen"]
    ]
  },
  {
    id: "orbital_shipyard",
    name: "Orbitalwerft",
    subtitle: "Große Weltraumwerft mit Hangars, Kontrollräumen und Werkstätten.",
    kind: "indoor",
    theme: "space",
    rooms: [
      ["Hangar A", "storage"],
      ["Hangar B", "storage"],
      ["Kontrolle", "security"],
      ["Werkstatt", "maintenance"],
      ["Crew Lounge", "lounge"],
      ["Server", "server"],
      ["Docking", "storage"],
      ["Labor", "lab"]
    ]
  },
  {
    id: "sunken_monastery",
    name: "Versunkenes Kloster",
    subtitle: "Altes Kloster mit Kapelle, Bibliothek, Krypta und überfluteten Gängen.",
    kind: "indoor",
    dark: true,
    theme: "monastery",
    rooms: [
      ["Kapelle", "church"],
      ["Bibliothek", "office"],
      ["Krypta", "storage"],
      ["Speisesaal", "lounge"],
      ["Klosterküche", "kitchen"],
      ["Archiv", "storage"],
      ["Schlafsaal", "guestroom"],
      ["Werkraum", "maintenance"],
      ["Innenhof", "lounge"],
      ["Turmzimmer", "office"],
      ["Sakristei", "storage"],
      ["Überfluteter Gang", "storage"]
    ]
  },
  {
    id: "neon_boroughs",
    name: "Neon Boroughs",
    subtitle: "Organisierte Stadtviertel mit Crews, Banken, Läden und Unternehmen.",
    kind: "outdoor",
    dark: true,
    theme: "neon",
    vehicle: "car",
    modeHint: "neon",
    rooms: [
      ["Bank", "security"],
      ["Arcade", "shop"],
      ["Crew-HQ Rot", "office"],
      ["Crew-HQ Blau", "office"],
      ["Werkstatt", "maintenance"],
      ["Markt", "market"],
      ["Wohnblock", "lounge"],
      ["Club", "concertHall"],
      ["Lagerhaus", "storage"]
    ]
  },
  {
    id: "crowfield",
    name: "Krähenfeld",
    subtitle: "Großes Korn- und Krähenfeld mit Scheune und verlassenem Haus.",
    kind: "outdoor",
    dark: true,
    theme: "field",
    rooms: [
      ["Scheune", "barn"],
      ["Altes Haus", "lounge"],
      ["Werkzeugschuppen", "storage"],
      ["Pumpenhaus", "maintenance"]
    ]
  },
  {
    id: "beach_town",
    name: "Strandstadt",
    subtitle: "Strandpromenade, kleine Läden, Apartments und Hafen.",
    kind: "outdoor",
    theme: "beach",
    vehicle: "car",
    rooms: [
      ["Café", "shop"],
      ["Surfshop", "shop"],
      ["Apartment", "guestroom"],
      ["Hafenbüro", "office"],
      ["Markt", "market"],
      ["Lager", "storage"]
    ]
  },
  {
    id: "trading_village",
    name: "Handelsdorf",
    subtitle: "Lebendiges Dorf mit Händlern und eigenständigen NPC-Bewohnern.",
    kind: "outdoor",
    theme: "village",
    rooms: [
      ["Markthalle", "market"],
      ["Tränkeladen", "shop"],
      ["Schmuckladen", "shop"],
      ["Dorfhaus A", "lounge"],
      ["Dorfhaus B", "lounge"],
      ["Rathaus", "office"]
    ]
  },
  {
    id: "cave_system",
    name: "Höhlensystem",
    subtitle: "Verzweigte natürliche Höhlen mit Camps und Tiefenstation.",
    kind: "indoor",
    dark: true,
    theme: "cave",
    rooms: [
      ["Große Höhle", "storage"],
      ["Camp", "lounge"],
      ["Tiefe Kammer", "storage"],
      ["Forschung", "lab"],
      ["Generator", "maintenance"],
      ["Kristallraum", "storage"]
    ]
  },
  {
    id: "corn_maze",
    name: "Kornlabyrinth",
    subtitle: "Enge Feldwege, Scheune, Silo und versteckte Lichtung.",
    kind: "outdoor",
    theme: "field",
    rooms: [
      ["Scheune", "barn"],
      ["Silo-Lager", "storage"],
      ["Bauernhaus", "lounge"],
      ["Werkstatt", "maintenance"]
    ]
  },
  {
    id: "abandoned_ship",
    name: "Verlassenes Frachtschiff",
    subtitle: "Rostige Decks, Container, Maschinenraum und Mannschaftsquartiere.",
    kind: "indoor",
    dark: true,
    theme: "ship",
    rooms: [
      ["Brücke", "security"],
      ["Laderaum", "storage"],
      ["Maschinenraum", "maintenance"],
      ["Crew A", "guestroom"],
      ["Crew B", "guestroom"],
      ["Kombüse", "kitchen"],
      ["Funk", "server"],
      ["Werkstatt", "maintenance"]
    ]
  },
  {
    id: "mountain_bunker",
    name: "Bergbunker",
    subtitle: "Betonbunker tief im Berg mit Technik, Lager und Kontrollzentrum.",
    kind: "indoor",
    dark: true,
    theme: "bunker",
    rooms: [
      ["Kontrolle", "security"],
      ["Lager A", "storage"],
      ["Lager B", "storage"],
      ["Generator", "maintenance"],
      ["Funkraum", "server"],
      ["Crewraum", "guestroom"],
      ["Werkstatt", "maintenance"],
      ["Archiv", "storage"]
    ]
  },
  {
    id: "metro",
    name: "Metrostation",
    subtitle: "Bahnsteige, Servicegänge, Kiosk und Technikräume.",
    kind: "indoor",
    theme: "metro",
    rooms: [
      ["Bahnsteig A", "storage"],
      ["Bahnsteig B", "storage"],
      ["Kiosk", "shop"],
      ["Kontrolle", "security"],
      ["Tunneltechnik", "maintenance"],
      ["Personal", "office"],
      ["Lager", "storage"],
      ["Stellwerk", "server"]
    ]
  },
  {
    id: "museum",
    name: "Museum",
    subtitle: "Ausstellungshallen, Archiv, Restaurierung und großer Eingangsbereich.",
    kind: "indoor",
    theme: "museum",
    rooms: [
      ["Atrium", "hotelLobby"],
      ["Galerie A", "lounge"],
      ["Galerie B", "lounge"],
      ["Archiv", "storage"],
      ["Restaurierung", "lab"],
      ["Security", "security"],
      ["Café", "shop"],
      ["Lager", "storage"]
    ]
  },
  {
    id: "dam",
    name: "Staudamm",
    subtitle: "Massive Anlage mit Turbinen, Kontrollräumen und Wartungstunneln.",
    kind: "indoor",
    theme: "industrial",
    rooms: [
      ["Turbinenhalle", "maintenance"],
      ["Kontrolle", "security"],
      ["Wartung A", "maintenance"],
      ["Wartung B", "maintenance"],
      ["Lager", "storage"],
      ["Personal", "office"],
      ["Pumpen", "maintenance"],
      ["Tunnel", "storage"]
    ]
  },
  {
    id: "swamp",
    name: "Nebelsumpf",
    subtitle: "Sumpf, Stege, Hütten und eine alte Pumpstation.",
    kind: "outdoor",
    dark: true,
    theme: "swamp",
    rooms: [
      ["Sumpfhütte", "lounge"],
      ["Pumpstation", "maintenance"],
      ["Lagerhütte", "storage"],
      ["Fischerhütte", "shop"]
    ]
  },
  {
    id: "desert_motel",
    name: "Wüstenmotel",
    subtitle: "Straßenmotel mit Diner, Zimmern und Tankstellenwerkstatt.",
    kind: "outdoor",
    theme: "desert",
    vehicle: "car",
    rooms: [
      ["Diner", "kitchen"],
      ["Rezeption", "hotelLobby"],
      ["Zimmer 1", "guestroom"],
      ["Zimmer 2", "guestroom"],
      ["Werkstatt", "maintenance"],
      ["Shop", "shop"]
    ]
  },
  {
    id: "factory",
    name: "Großfabrik",
    subtitle: "Produktionshallen, Fördertechnik, Lager und Büros.",
    kind: "indoor",
    theme: "industrial",
    rooms: [
      ["Produktion A", "maintenance"],
      ["Produktion B", "maintenance"],
      ["Lager A", "storage"],
      ["Lager B", "storage"],
      ["Kontrolle", "security"],
      ["Büro", "office"],
      ["Kantine", "kitchen"],
      ["Server", "server"]
    ]
  },
  {
    id: "aquarium",
    name: "Großaquarium",
    subtitle: "Aquarientunnel, Technikräume, Café und Forschung.",
    kind: "indoor",
    theme: "aquarium",
    rooms: [
      ["Haupthalle", "lounge"],
      ["Aquarientunnel", "lounge"],
      ["Forschung", "lab"],
      ["Pumpen", "maintenance"],
      ["Café", "shop"],
      ["Lager", "storage"],
      ["Security", "security"],
      ["Quarantäne", "lab"]
    ]
  },
  {
    id: "greenhouse",
    name: "Gewächshauskomplex",
    subtitle: "Glashäuser, Labore, Bewässerung und tropische Pflanzen.",
    kind: "indoor",
    theme: "greenhouse",
    rooms: [
      ["Tropenhaus", "lounge"],
      ["Wüstenhaus", "lounge"],
      ["Labor", "lab"],
      ["Bewässerung", "maintenance"],
      ["Lager", "storage"],
      ["Café", "shop"],
      ["Büro", "office"],
      ["Technik", "maintenance"]
    ]
  },
  {
    id: "rooftops",
    name: "Dachviertel",
    subtitle: "Dächer, Treppenhäuser, kleine Apartments und Neon-Reklamen.",
    kind: "outdoor",
    dark: true,
    theme: "city",
    rooms: [
      ["Apartment A", "guestroom"],
      ["Apartment B", "guestroom"],
      ["Dachcafé", "shop"],
      ["Technik", "maintenance"],
      ["Lager", "storage"],
      ["Studio", "office"]
    ]
  },
  {
    id: "lighthouse_island",
    name: "Leuchtturminsel",
    subtitle: "Felsige Insel mit Leuchtturm, Wohnhaus und Bootsschuppen.",
    kind: "outdoor",
    theme: "coast",
    rooms: [
      ["Leuchtturm", "maintenance"],
      ["Wärterhaus", "lounge"],
      ["Bootsschuppen", "storage"],
      ["Funkraum", "server"]
    ]
  },
  {
    id: "desert_harbor",
    name: "Wüstenhafen",
    subtitle: "Trockener Hafen mit riesigem See auf der kompletten rechten Seite.",
    kind: "outdoor",
    theme: "desert",
    waterRight: true,
    rooms: [
      ["Hafenbüro", "office"],
      ["Markt", "market"],
      ["Lager", "storage"],
      ["Werkstatt", "maintenance"],
      ["Funkstation", "server"]
    ]
  },
  {
    id: "fog_valley",
    name: "The Fog Is Coming",
    subtitle: "Gigantische Nachtmap mit Stadt, Wald, Feldern und Bauernhof.",
    kind: "fog",
    dark: true,
    theme: "fog",
    rooms: [
      ["Farmhaus", "lounge"],
      ["Scheune", "barn"],
      ["Stadtladen", "shop"],
      ["Haus A", "guestroom"],
      ["Haus B", "guestroom"],
      ["Werkstatt", "maintenance"],
      ["Polizeibüro", "security"],
      ["Kirche", "church"]
    ]
  },
  {
    id: "space_station",
    name: "Raumstation Helios",
    subtitle: "Große Station mit Wohnmodulen, Labor und Andockringen.",
    kind: "indoor",
    theme: "space",
    rooms: [
      ["Andockring", "storage"],
      ["Brücke", "security"],
      ["Labor", "lab"],
      ["Hydroponik", "greenhouse"],
      ["Crew A", "guestroom"],
      ["Crew B", "guestroom"],
      ["Reaktor", "maintenance"],
      ["Server", "server"]
    ]
  },
  {
    id: "lunar_colony",
    name: "Mondkolonie",
    subtitle: "Kuppeln, Labore, Garage und Wohnmodule auf dem Mond.",
    kind: "indoor",
    theme: "lunar",
    rooms: [
      ["Zentralkuppel", "hotelLobby"],
      ["Labor", "lab"],
      ["Garage", "storage"],
      ["Crew A", "guestroom"],
      ["Crew B", "guestroom"],
      ["Reaktor", "maintenance"],
      ["Kontrolle", "security"],
      ["Hydroponik", "lounge"]
    ]
  },
  {
    id: "jungle_temple",
    name: "Dschungeltempel",
    subtitle: "Überwachsener Tempel mit Kammern, Brücken und Expedition-Camp.",
    kind: "outdoor",
    theme: "jungle",
    rooms: [
      ["Tempelhalle", "church"],
      ["Expedition", "lounge"],
      ["Artefaktkammer", "storage"],
      ["Forschung", "lab"],
      ["Lager", "storage"]
    ]
  },
  {
    id: "arctic_base",
    name: "Arktisbasis",
    subtitle: "Verschneite Forschungsstation mit Hangar und Laboren.",
    kind: "outdoor",
    theme: "snow",
    vehicle: "snowcar",
    rooms: [
      ["Labor", "lab"],
      ["Hangar", "storage"],
      ["Crew", "guestroom"],
      ["Kontrolle", "security"],
      ["Generator", "maintenance"],
      ["Lager", "storage"]
    ]
  },
  {
    id: "sewers",
    name: "Kanalsystem",
    subtitle: "Abwasserkanäle, Pumpstationen und versteckte Wartungsräume.",
    kind: "indoor",
    dark: true,
    theme: "sewer",
    rooms: [
      ["Pumpstation", "maintenance"],
      ["Tunnel A", "storage"],
      ["Tunnel B", "storage"],
      ["Kontrolle", "security"],
      ["Wartung", "maintenance"],
      ["Lager", "storage"],
      ["Schleuse", "maintenance"],
      ["Geheimraum", "storage"]
    ]
  },
  {
    id: "old_cinema",
    name: "Altes Kino",
    subtitle: "Großer Kinosaal, Lobby, Projektion, Lager und Snackbar.",
    kind: "indoor",
    dark: true,
    theme: "cinema",
    rooms: [
      ["Kinosaal", "concertHall"],
      ["Lobby", "hotelLobby"],
      ["Snackbar", "shop"],
      ["Projektion", "maintenance"],
      ["Lager", "storage"],
      ["Büro", "office"],
      ["WC", "toilet"],
      ["Backstage", "backstage"]
    ]
  },
  {
    id: "sky_city",
    name: "Sky City",
    subtitle: "Schwebendes futuristisches Viertel mit Gärten und Transit.",
    kind: "indoor",
    theme: "future",
    rooms: [
      ["Transit", "hotelLobby"],
      ["Markt", "market"],
      ["Garten", "lounge"],
      ["Labor", "lab"],
      ["Apartment", "guestroom"],
      ["Kontrolle", "security"],
      ["Technik", "maintenance"],
      ["Lounge", "lounge"]
    ]
  }
];

const MAPS = {};

for (const spec of MAP_SPECS) {
  let map;

  if (spec.kind === "backrooms") {
    map = buildBackrooms(spec);
  } else if (spec.kind === "outdoor") {
    map = buildOutdoor(spec);
  } else if (spec.kind === "fog") {
    map = buildFog(spec);
  } else if (spec.kind === "runewaste") {
    map = buildRunewaste(spec);
  } else {
    map = buildIndoor(spec);
  }

  MAPS[map.id] = map;
}

/* Baumodus: zusätzliche riesige Map, nicht Teil der 50 normalen Maps. */

const BUILD_WORLD = {
  id: "build_world",
  name: "Build World",
  subtitle: "Gigantische Bauwelt mit Tag/Nacht-Zyklus.",
  width: 12000,
  height: 12000,
  dark: false,
  theme: "build",
  musicTags: ["Lo-Fi", "Ambient"],
  zones: [
    zone("build_grass", "", 0, 0, 6000, 6000, "grass", "#63825a"),
    zone("build_snow", "", 6000, 0, 6000, 6000, "snow", "#dce5e6"),
    zone("build_desert", "", 0, 6000, 6000, 6000, "sand", "#be9d68"),
    zone("build_forest", "", 6000, 6000, 6000, 6000, "forest", "#4c6650")
  ],
  walls: [],
  doors: [],
  props: [],
  hideouts: [],
  interactions: [],
  water: [
    {
      id: "build_lake",
      x: 4700,
      y: 4700,
      w: 2600,
      h: 2600,
      color: "#4c8197"
    }
  ],
  vehicles: [],
  npcs: [],
  spawns: [
    { x: 5800, y: 4400 },
    { x: 6200, y: 4400 },
    { x: 5800, y: 7800 },
    { x: 6200, y: 7800 }
  ],
  monsterSpawn: null,
  catSpawn: null,
  buildOnly: true
};

/* ----------------------------------------------------------
   Battle Pass
---------------------------------------------------------- */

const BATTLE_PASS = [];

for (let tier = 1; tier <= 60; tier += 1) {
  let reward;

  if (tier % 10 === 0) {
    reward = {
      type: "pet",
      id: PETS[(tier / 10 + 12) % PETS.length].id
    };
  } else if (tier % 4 === 0) {
    reward = {
      type: "skin",
      id: PLAYER_SKINS[(tier * 3 + 120) % PLAYER_SKINS.length].id
    };
  } else if (tier % 3 === 0) {
    reward = {
      type: "weapon",
      id: WEAPONS[(tier * 2) % WEAPONS.length].id
    };
  } else {
    reward = {
      type: "coins",
      amount: 100 + tier * 15
    };
  }

  BATTLE_PASS.push({
    tier,
    xp: tier * 500,
    reward
  });
}

const BESTIARY = [
  ...MONSTER_FORMS.map((monster) => ({
    id: monster.id,
    name: monster.name,
    type: "monster",
    rarity: monster.rarity,
    rarityName: monster.rarityName,
    rarityColor: monster.rarityColor,
    description: "Informationen werden durch Begegnungen und Challenges freigeschaltet."
  })),
  {
    id: "scp096",
    name: "SCP-096",
    type: "scp",
    rarity: "legendary",
    rarityName: "Legendär",
    rarityColor: "#ffb443"
  },
  {
    id: "scp173",
    name: "SCP-173",
    type: "scp",
    rarity: "legendary",
    rarityName: "Legendär",
    rarityColor: "#ffb443"
  },
  {
    id: "scp999",
    name: "SCP-999",
    type: "scp",
    rarity: "rare",
    rarityName: "Selten",
    rarityColor: "#4e91ff"
  },
  {
    id: "scp049",
    name: "SCP-049",
    type: "scp",
    rarity: "epic",
    rarityName: "Episch",
    rarityColor: "#a766ff"
  },
  {
    id: "scp106",
    name: "SCP-106",
    type: "scp",
    rarity: "legendary",
    rarityName: "Legendär",
    rarityColor: "#ffb443"
  },
  {
    id: "stormking",
    name: "Sturmkönig",
    type: "boss",
    rarity: "secret",
    rarityName: "Secret",
    rarityColor: "#ff4f8d"
  }
];

module.exports = {
  RARITIES,
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
};
