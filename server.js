"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const {
  WebSocketServer,
  WebSocket
} = require("ws");

const {
  MAPS
} = require("./maps");


const PORT =
  Number(process.env.PORT) ||
  3000;


const TICK_RATE = 30;

const TICK_MS =
  1000 / TICK_RATE;


const PLAYER = {
  radius: 18,

  maxHp: 100,

  baseSpeed: 175,

  groundAcceleration: 1300,

  groundBrake: 1600,

  airAcceleration: 260,

  airBrake: 35,

  jumpBaseLaunch: 285,

  jumpChainBonus: 24,

  jumpMaxLaunch: 355,

  jumpDuration: 430,

  jumpBuffer: 180,

  bunnyhopWindow: 500,

  bunnyhopMaxChain: 4,

  speedPotionMultiplier: 1.3,

  speedPotionDuration: 10000,

  healPotionAmount: 35,

  doorDistance: 145,

  interactDistance: 135,

  vendingCooldown: 2500
};


const publicDir =
  path.join(
    __dirname,
    "public"
  );


const players =
  new Map();


const mapStates =
  {};


// ============================================================
// MAP STATES
// ============================================================

for (
  const [
    mapId,
    map
  ] of Object.entries(MAPS)
) {
  mapStates[mapId] = {
    doors: {},

    lightsOn: true,

    powerOn: true,

    alarmOn: false,

    interactables: {},

    noise: null
  };


  for (
    const door
    of map.doors
  ) {
    mapStates[
      mapId
    ].doors[
      door.id
    ] = {
      open: false,
      amount: 0
    };
  }


  for (
    const item
    of map.interactables
  ) {
    mapStates[
      mapId
    ].interactables[
      item.id
    ] = {
      active: false,
      count: 0,
      lastUsedAt: 0
    };
  }
}


// ============================================================
// HELPERS
// ============================================================

function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );
}


function moveToward(current, target, amount) {
  if (
    Math.abs(
      target -
      current
    ) <= amount
  ) {
    return target;
  }


  return (
    current +
    Math.sign(
      target -
      current
    ) *
    amount
  );
}


function normalize(x, y) {
  const length =
    Math.hypot(
      x,
      y
    );


  if (
    length <
    0.0001
  ) {
    return {
      x: 0,
      y: 1
    };
  }


  return {
    x: x / length,
    y: y / length
  };
}


function sanitizeName(value) {
  if (
    typeof value !==
    "string"
  ) {
    return "Spieler";
  }


  return (
    value
      .replace(
        /[<>]/g,
        ""
      )
      .trim()
      .slice(
        0,
        20
      ) ||
    "Spieler"
  );
}


function randomSpawn(map) {
  return map.spawnPoints[
    Math.floor(
      Math.random() *
      map.spawnPoints.length
    )
  ];
}


// ============================================================
// PLAYER
// ============================================================

function createPlayer() {
  return {
    id:
      crypto.randomUUID(),

    name:
      "Spieler",

    mapId:
      null,

    x: 0,
    y: 0,

    vx: 0,
    vy: 0,

    inputX: 0,
    inputY: 0,

    lastDirX: 0,
    lastDirY: 1,

    airborne: false,

    jumpStartedAt: 0,

    jumpEndsAt: 0,

    landedAt: 0,

    jumpQueuedUntil: 0,

    bunnyhopChain: 0,

    hidden: false,

    hiddenAt: null,

    hp:
      PLAYER.maxHp,

    speedBoostUntil: 0,

    fish: 0,

    coins: 0,

    activeTime: 0,

    lastInteraction: 0,

    visitedCheckpoints:
      new Set()
  };
}


// ============================================================
// FUTURE MONSTER AI
//
// Wenn später Monster eingebaut werden, müssen sie Spieler,
// die hier false zurückgeben, nicht verfolgen.
// ============================================================

function isPlayerVisibleToAI(player) {
  return (
    !player.hidden &&
    player.hp > 0 &&
    Boolean(player.mapId)
  );
}


// ============================================================
// COLLISION
// ============================================================

function circleHitsRect(
  x,
  y,
  radius,
  rect
) {
  const nearestX =
    clamp(
      x,
      rect.x,
      rect.x +
      rect.w
    );


  const nearestY =
    clamp(
      y,
      rect.y,
      rect.y +
      rect.h
    );


  const dx =
    x -
    nearestX;


  const dy =
    y -
    nearestY;


  return (
    dx * dx +
    dy * dy
  ) <
  radius * radius;
}


function isBlocked(
  player,
  x,
  y
) {
  const map =
    MAPS[
      player.mapId
    ];


  if (!map) {
    return false;
  }


  if (
    x <
      PLAYER.radius ||

    y <
      PLAYER.radius ||

    x >
      map.width -
      PLAYER.radius ||

    y >
      map.height -
      PLAYER.radius
  ) {
    return true;
  }


  if (
    map.water &&
    circleHitsRect(
      x,
      y,
      PLAYER.radius,
      map.water
    )
  ) {
    return true;
  }


  for (
    const wall
    of map.walls
  ) {
    if (
      circleHitsRect(
        x,
        y,
        PLAYER.radius,
        wall
      )
    ) {
      return true;
    }
  }


  for (
    const item
    of map.furniture
  ) {
    if (
      item.solid &&
      circleHitsRect(
        x,
        y,
        PLAYER.radius,
        item
      )
    ) {
      return true;
    }
  }


  const state =
    mapStates[
      player.mapId
    ];


  for (
    const door
    of map.doors
  ) {
    const doorState =
      state.doors[
        door.id
      ];


    if (
      doorState.amount <
        0.58 &&

      circleHitsRect(
        x,
        y,
        PLAYER.radius,
        door
      )
    ) {
      return true;
    }
  }


  return false;
}


// ============================================================
// NETWORK
// ============================================================

function send(socket, message) {
  if (
    socket.readyState !==
    WebSocket.OPEN
  ) {
    return;
  }


  socket.send(
    JSON.stringify(
      message
    )
  );
}


function sendGlobalStatus() {
  const message = {
    type: "status",

    online:
      players.size
  };


  for (
    const socket
    of players.keys()
  ) {
    send(
      socket,
      message
    );
  }
}


function createMapState(mapId) {
  const now =
    Date.now();


  const state =
    mapStates[
      mapId
    ];


  const outputPlayers =
    [];


  for (
    const player
    of players.values()
  ) {
    if (
      player.mapId !==
      mapId
    ) {
      continue;
    }


    let jumpHeight = 0;


    if (
      player.airborne
    ) {
      const progress =
        clamp(
          (
            now -
            player.jumpStartedAt
          ) /
          PLAYER.jumpDuration,

          0,
          1
        );


      jumpHeight =
        Math.sin(
          progress *
          Math.PI
        ) *
        31;
    }


    outputPlayers.push({
      id:
        player.id,

      name:
        player.name,

      x:
        player.x,

      y:
        player.y,

      vx:
        player.vx,

      vy:
        player.vy,

      jumpHeight,

      airborne:
        player.airborne,

      bunnyhopChain:
        player.bunnyhopChain,

      hidden:
        player.hidden,

      hp:
        player.hp,

      maxHp:
        PLAYER.maxHp,

      fish:
        player.fish,

      speedBoosted:
        player.speedBoostUntil >
        now,

      coins:
        player.coins
    });
  }


  return {
    type:
      "state",

    mapId,

    players:
      outputPlayers,

    doors:
      state.doors,

    worldState: {
      lightsOn:
        state.lightsOn,

      powerOn:
        state.powerOn,

      alarmOn:
        state.alarmOn,

      interactables:
        state.interactables,

      noise:
        state.noise
    }
  };
}


function broadcastMap(mapId) {
  if (!mapId) {
    return;
  }


  const data =
    JSON.stringify(
      createMapState(
        mapId
      )
    );


  for (
    const [
      socket,
      player
    ]
    of players.entries()
  ) {
    if (
      player.mapId ===
        mapId &&

      socket.readyState ===
        WebSocket.OPEN
    ) {
      socket.send(
        data
      );
    }
  }
}


// ============================================================
// REWARD
// ============================================================

function reward(
  socket,
  player,
  amount,
  reason
) {
  player.coins +=
    amount;


  send(
    socket,
    {
      type:
        "reward",

      amount,

      reason,

      coins:
        player.coins
    }
  );
}


// ============================================================
// JOIN
// ============================================================

function joinMap(
  socket,
  player,
  mapId
) {
  const map =
    MAPS[
      mapId
    ];


  if (!map) {
    return;
  }


  const oldMap =
    player.mapId;


  player.mapId =
    mapId;


  const spawn =
    randomSpawn(
      map
    );


  player.x =
    spawn.x;

  player.y =
    spawn.y;


  player.vx = 0;
  player.vy = 0;

  player.inputX = 0;
  player.inputY = 0;

  player.airborne =
    false;

  player.bunnyhopChain =
    0;

  player.hidden =
    false;

  player.hiddenAt =
    null;

  player.hp =
    PLAYER.maxHp;


  send(
    socket,
    {
      type:
        "map",

      map
    }
  );


  send(
    socket,
    {
      type:
        "playerState",

      hp:
        player.hp,

      maxHp:
        PLAYER.maxHp,

      fish:
        player.fish,

      coins:
        player.coins
    }
  );


  if (
    oldMap &&
    oldMap !==
    mapId
  ) {
    broadcastMap(
      oldMap
    );
  }


  broadcastMap(
    mapId
  );
}


// ============================================================
// DOORS
// ============================================================

function updateDoors(dt) {
  for (
    const [
      mapId,
      map
    ]
    of Object.entries(
      MAPS
    )
  ) {
    const state =
      mapStates[
        mapId
      ];


    for (
      const door
      of map.doors
    ) {
      const centerX =
        door.x +
        door.w /
        2;


      const centerY =
        door.y +
        door.h /
        2;


      let shouldOpen =
        false;


      for (
        const player
        of players.values()
      ) {
        if (
          player.mapId !==
          mapId ||
          player.hidden
        ) {
          continue;
        }


        const distance =
          Math.hypot(
            player.x -
              centerX,

            player.y -
              centerY
          );


        if (
          distance <
          PLAYER.doorDistance
        ) {
          shouldOpen =
            true;

          break;
        }
      }


      const doorState =
        state.doors[
          door.id
        ];


      doorState.open =
        shouldOpen;


      doorState.amount =
        moveToward(
          doorState.amount,

          shouldOpen
            ? 1
            : 0,

          2.7 *
          dt
        );
    }
  }
}


// ============================================================
// BUNNYHOP
// ============================================================

function attemptJump(
  player,
  now
) {
  if (
    player.airborne ||
    player.hidden ||
    player.hp <= 0
  ) {
    return;
  }


  if (
    player.jumpQueuedUntil <
    now
  ) {
    return;
  }


  player.jumpQueuedUntil =
    0;


  const inputLength =
    Math.hypot(
      player.inputX,
      player.inputY
    );


  let direction;


  if (
    inputLength >
    0.12
  ) {
    direction =
      normalize(
        player.inputX,
        player.inputY
      );


    player.lastDirX =
      direction.x;

    player.lastDirY =
      direction.y;
  } else {
    direction =
      normalize(
        player.lastDirX,
        player.lastDirY
      );
  }


  const chained =
    player.landedAt >
      0 &&

    now -
      player.landedAt <=
      PLAYER.bunnyhopWindow;


  if (
    chained
  ) {
    player.bunnyhopChain =
      Math.min(
        PLAYER.bunnyhopMaxChain,

        player.bunnyhopChain +
          1
      );
  } else {
    player.bunnyhopChain =
      0;
  }


  let launchSpeed =
    Math.min(
      PLAYER.jumpMaxLaunch,

      PLAYER.jumpBaseLaunch +
      player.bunnyhopChain *
      PLAYER.jumpChainBonus
    );


  if (
    player.speedBoostUntil >
    now
  ) {
    launchSpeed *=
      PLAYER.speedPotionMultiplier;
  }


  player.vx =
    direction.x *
    launchSpeed;


  player.vy =
    direction.y *
    launchSpeed;


  player.airborne =
    true;


  player.jumpStartedAt =
    now;


  player.jumpEndsAt =
    now +
    PLAYER.jumpDuration;
}


// ============================================================
// CHECKPOINTS
// ============================================================

function checkCheckpoints(
  socket,
  player,
  map
) {
  for (
    const checkpoint
    of map.checkpoints
  ) {
    const key =
      `${map.id}:${checkpoint.id}`;


    if (
      player.visitedCheckpoints
        .has(key)
    ) {
      continue;
    }


    if (
      Math.hypot(
        player.x -
          checkpoint.x,

        player.y -
          checkpoint.y
      ) <=
      checkpoint.radius
    ) {
      player.visitedCheckpoints
        .add(
          key
        );


      reward(
        socket,
        player,
        5,
        `${checkpoint.name} entdeckt`
      );
    }
  }
}


// ============================================================
// INTERACTION
// ============================================================

function findNearestInteraction(
  player
) {
  const map =
    MAPS[
      player.mapId
    ];


  if (!map) {
    return null;
  }


  let nearest =
    null;


  let bestDistance =
    Infinity;


  for (
    const item
    of map.interactables
  ) {
    const distance =
      Math.hypot(
        player.x -
          item.x,

        player.y -
          item.y
      );


    if (
      distance <=
        PLAYER.interactDistance &&

      distance <
        bestDistance
    ) {
      nearest =
        item;


      bestDistance =
        distance;
    }
  }


  return nearest;
}


// ============================================================
// VENDING MACHINE
// 1 / 3 HEAL
// 1 / 3 SPEED
// 1 / 3 FISH
// ============================================================

function useVendingMachine(
  socket,
  player,
  item,
  itemState
) {
  const now =
    Date.now();


  if (
    now -
    itemState.lastUsedAt <
    PLAYER.vendingCooldown
  ) {
    send(
      socket,
      {
        type:
          "interactionMessage",

        text:
          "Der Automat braucht kurz."
      }
    );

    return;
  }


  itemState.lastUsedAt =
    now;


  const roll =
    crypto.randomInt(
      0,
      3
    );


  if (
    roll === 0
  ) {
    const before =
      player.hp;


    player.hp =
      Math.min(
        PLAYER.maxHp,

        player.hp +
        PLAYER.healPotionAmount
      );


    const healed =
      player.hp -
      before;


    send(
      socket,
      {
        type:
          "vendingLoot",

        loot:
          "heal",

        hp:
          player.hp,

        maxHp:
          PLAYER.maxHp,

        text:
          healed > 0
            ? `Grüner Heiltrank: +${healed} HP`
            : "Grüner Heiltrank – HP bereits voll."
      }
    );

    return;
  }


  if (
    roll === 1
  ) {
    player.speedBoostUntil =
      now +
      PLAYER.speedPotionDuration;


    send(
      socket,
      {
        type:
          "vendingLoot",

        loot:
          "speed",

        duration:
          PLAYER.speedPotionDuration,

        hp:
          player.hp,

        maxHp:
          PLAYER.maxHp,

        text:
          "Grüner Geschwindigkeitstrank: 10 Sekunden schneller!"
      }
    );

    return;
  }


  player.fish +=
    1;


  send(
    socket,
    {
      type:
        "vendingLoot",

      loot:
        "fish",

      fish:
        player.fish,

      hp:
        player.hp,

      maxHp:
        PLAYER.maxHp,

      text:
        `Fisch erhalten. Du hast jetzt ${player.fish}.`
    }
  );
}


function interact(
  socket,
  player
) {
  if (
    !player.mapId ||
    player.hp <= 0
  ) {
    return;
  }


  const now =
    Date.now();


  if (
    now -
    player.lastInteraction <
    280
  ) {
    return;
  }


  player.lastInteraction =
    now;


  const item =
    findNearestInteraction(
      player
    );


  if (!item) {
    send(
      socket,
      {
        type:
          "interactionMessage",

        text:
          "Hier gibt es nichts zu benutzen."
      }
    );

    return;
  }


  const state =
    mapStates[
      player.mapId
    ];


  const itemState =
    state.interactables[
      item.id
    ];


  itemState.count +=
    1;


  // ========================================================
  // HIDING
  // ========================================================

  if (
    item.type ===
    "hide"
  ) {
    if (
      player.hidden &&
      player.hiddenAt !==
      item.id
    ) {
      player.hidden =
        false;

      player.hiddenAt =
        null;
    } else {
      player.hidden =
        !player.hidden;

      player.hiddenAt =
        player.hidden
          ? item.id
          : null;
    }


    player.vx = 0;
    player.vy = 0;


    send(
      socket,
      {
        type:
          "interactionMessage",

        text:
          player.hidden
            ? `${item.label}: Du bist versteckt.`
            : "Du kommst aus dem Versteck."
      }
    );


    broadcastMap(
      player.mapId
    );

    return;
  }


  // Aus Versteck raus, sobald etwas anderes benutzt wird.
  if (
    player.hidden
  ) {
    player.hidden =
      false;

    player.hiddenAt =
      null;
  }


  // ========================================================
  // VENDING
  // ========================================================

  if (
    item.type ===
    "vending"
  ) {
    useVendingMachine(
      socket,
      player,
      item,
      itemState
    );


    broadcastMap(
      player.mapId
    );

    return;
  }


  // ========================================================
  // BELL / NOISE
  // ========================================================

  if (
    item.type ===
    "bell"
  ) {
    state.noise = {
      type:
        "bell",

      x:
        item.x,

      y:
        item.y,

      time:
        now,

      strength:
        1
    };


    itemState.active =
      true;


    send(
      socket,
      {
        type:
          "interactionMessage",

        text:
          "DING! Die Glocke ist weit zu hören."
      }
    );


    broadcastMap(
      player.mapId
    );

    return;
  }


  // ========================================================
  // POWER
  // ========================================================

  if (
    item.type ===
    "power"
  ) {
    state.powerOn =
      !state.powerOn;


    state.lightsOn =
      state.powerOn;


    itemState.active =
      !state.powerOn;


    send(
      socket,
      {
        type:
          "interactionMessage",

        text:
          state.powerOn
            ? "Hauptstrom eingeschaltet."
            : "Hauptstrom ausgeschaltet."
      }
    );
  }


  // ========================================================
  // LIGHT
  // ========================================================

  if (
    item.type ===
    "light"
  ) {
    state.lightsOn =
      !state.lightsOn;


    itemState.active =
      !state.lightsOn;


    send(
      socket,
      {
        type:
          "interactionMessage",

        text:
          state.lightsOn
            ? "Beleuchtung eingeschaltet."
            : "Beleuchtung ausgeschaltet."
      }
    );
  }


  // ========================================================
  // ALARM
  // ========================================================

  if (
    item.type ===
    "alarm"
  ) {
    state.alarmOn =
      !state.alarmOn;


    itemState.active =
      state.alarmOn;


    if (
      state.alarmOn
    ) {
      state.noise = {
        type:
          "alarm",

        x:
          item.x,

        y:
          item.y,

        time:
          now,

        strength:
          1.6
      };
    }


    send(
      socket,
      {
        type:
          "interactionMessage",

        text:
          state.alarmOn
            ? "Alarm aktiviert."
            : "Alarm deaktiviert."
      }
    );
  }


  const simpleToggleMessages = {
    generator: [
      "Generator gestoppt.",
      "Generator gestartet."
    ],

    conveyor: [
      "Förderband gestoppt.",
      "Förderband gestartet."
    ],

    fan: [
      "Ventilator gestoppt.",
      "Ventilator gestartet."
    ],

    radio: [
      "Hafenfunk ausgeschaltet.",
      "Hafenfunk eingeschaltet."
    ],

    crane: [
      "Kransteuerung deaktiviert.",
      "Kransteuerung aktiviert."
    ],

    terminal: [
      "Terminal gesperrt.",
      "Terminal entsperrt."
    ],

    server: [
      "Serverdiagnose beendet.",
      "Serverdiagnose gestartet."
    ],

    samples: [
      "Probe zurückgestellt.",
      "Probe entnommen."
    ]
  };


  if (
    simpleToggleMessages[
      item.type
    ]
  ) {
    itemState.active =
      !itemState.active;


    send(
      socket,
      {
        type:
          "interactionMessage",

        text:
          simpleToggleMessages[
            item.type
          ][
            itemState.active
              ? 1
              : 0
          ]
      }
    );
  }


  if (
    item.type ===
    "scanner"
  ) {
    send(
      socket,
      {
        type:
          "interactionMessage",

        text:
          `Scanner: ${player.hp}/${PLAYER.maxHp} HP.`
      }
    );
  }


  broadcastMap(
    player.mapId
  );
}


// ============================================================
// GAME LOOP
// ============================================================

function updateWorld() {
  const dt =
    1 /
    TICK_RATE;


  const now =
    Date.now();


  updateDoors(
    dt
  );


  for (
    const [
      socket,
      player
    ]
    of players.entries()
  ) {
    if (
      !player.mapId
    ) {
      continue;
    }


    const map =
      MAPS[
        player.mapId
      ];


    if (
      player.airborne &&
      now >=
      player.jumpEndsAt
    ) {
      player.airborne =
        false;

      player.landedAt =
        now;
    }


    attemptJump(
      player,
      now
    );


    if (
      player.hidden ||
      player.hp <= 0
    ) {
      player.vx = 0;
      player.vy = 0;

      continue;
    }


    let inputX =
      player.inputX;


    let inputY =
      player.inputY;


    const inputLength =
      Math.hypot(
        inputX,
        inputY
      );


    if (
      inputLength >
      1
    ) {
      inputX /=
        inputLength;

      inputY /=
        inputLength;
    }


    if (
      inputLength >
      0.12
    ) {
      const direction =
        normalize(
          inputX,
          inputY
        );


      player.lastDirX =
        direction.x;

      player.lastDirY =
        direction.y;
    }


    const speedBoost =
      player.speedBoostUntil >
      now
        ? PLAYER.speedPotionMultiplier
        : 1;


    // ========================================================
    // GROUND MOVEMENT
    // ========================================================

    if (
      !player.airborne
    ) {
      const targetSpeed =
        PLAYER.baseSpeed *
        speedBoost;


      const targetVX =
        inputX *
        targetSpeed;


      const targetVY =
        inputY *
        targetSpeed;


      player.vx =
        moveToward(
          player.vx,
          targetVX,
          PLAYER.groundAcceleration *
          dt
        );


      player.vy =
        moveToward(
          player.vy,
          targetVY,
          PLAYER.groundAcceleration *
          dt
        );


      if (
        inputLength <
        0.05
      ) {
        player.vx =
          moveToward(
            player.vx,
            0,
            PLAYER.groundBrake *
            dt
          );


        player.vy =
          moveToward(
            player.vy,
            0,
            PLAYER.groundBrake *
            dt
          );
      }


      if (
        player.landedAt >
          0 &&

        now -
          player.landedAt >
          PLAYER.bunnyhopWindow
      ) {
        player.bunnyhopChain =
          0;
      }
    }


    // ========================================================
    // AIR MOVEMENT
    // ========================================================

    if (
      player.airborne
    ) {
      let airSpeed =
        PLAYER.jumpMaxLaunch;


      if (
        player.speedBoostUntil >
        now
      ) {
        airSpeed *=
          PLAYER.speedPotionMultiplier;
      }


      if (
        inputLength >
        0.05
      ) {
        player.vx =
          moveToward(
            player.vx,
            inputX *
              airSpeed,

            PLAYER.airAcceleration *
              dt
          );


        player.vy =
          moveToward(
            player.vy,
            inputY *
              airSpeed,

            PLAYER.airAcceleration *
              dt
          );
      }
    }


    const nextX =
      player.x +
      player.vx *
      dt;


    if (
      !isBlocked(
        player,
        nextX,
        player.y
      )
    ) {
      player.x =
        nextX;
    } else {
      player.vx = 0;

      player.bunnyhopChain =
        0;
    }


    const nextY =
      player.y +
      player.vy *
      dt;


    if (
      !isBlocked(
        player,
        player.x,
        nextY
      )
    ) {
      player.y =
        nextY;
    } else {
      player.vy = 0;

      player.bunnyhopChain =
        0;
    }


    if (
      inputLength >
      0.15
    ) {
      player.activeTime +=
        TICK_MS;


      if (
        player.activeTime >=
        30000
      ) {
        player.activeTime -=
          30000;


        reward(
          socket,
          player,
          1,
          "30 Sekunden aktiv gespielt"
        );
      }
    }


    checkCheckpoints(
      socket,
      player,
      map
    );
  }


  for (
    const mapId
    of Object.keys(
      MAPS
    )
  ) {
    const noise =
      mapStates[
        mapId
      ].noise;


    if (
      noise &&
      now -
      noise.time >
      5000
    ) {
      mapStates[
        mapId
      ].noise =
        null;
    }


    broadcastMap(
      mapId
    );
  }
}


// ============================================================
// STATIC SERVER
// ============================================================

const server =
  http.createServer(
    (
      req,
      res
    ) => {
      try {
        let requestPath =
          decodeURIComponent(
            (
              req.url ||
              "/"
            ).split("?")[0]
          );


        if (
          requestPath ===
          "/"
        ) {
          requestPath =
            "/index.html";
        }


        const cleanPath =
          requestPath.replace(
            /^\/+/,
            ""
          );


        const filePath =
          path.resolve(
            publicDir,
            cleanPath
          );


        const relative =
          path.relative(
            publicDir,
            filePath
          );


        if (
          relative.startsWith(
            ".."
          ) ||
          path.isAbsolute(
            relative
          )
        ) {
          res.writeHead(403);
          res.end("Forbidden");
          return;
        }


        if (
          !fs.existsSync(
            filePath
          ) ||
          !fs.statSync(
            filePath
          ).isFile()
        ) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }


        const extension =
          path
            .extname(
              filePath
            )
            .toLowerCase();


        const mimeTypes = {
          ".html":
            "text/html; charset=utf-8",

          ".css":
            "text/css; charset=utf-8",

          ".js":
            "text/javascript; charset=utf-8",

          ".json":
            "application/json; charset=utf-8",

          ".png":
            "image/png",

          ".jpg":
            "image/jpeg",

          ".jpeg":
            "image/jpeg",

          ".svg":
            "image/svg+xml",

          ".webp":
            "image/webp"
        };


        res.writeHead(
          200,
          {
            "Content-Type":
              mimeTypes[
                extension
              ] ||
              "application/octet-stream",

            "Cache-Control":
              "no-cache"
          }
        );


        fs
          .createReadStream(
            filePath
          )
          .pipe(
            res
          );

      } catch (
        error
      ) {
        console.error(
          error
        );


        if (
          !res.headersSent
        ) {
          res.writeHead(
            500
          );
        }


        res.end(
          "Internal server error"
        );
      }
    }
  );


// ============================================================
// WEBSOCKET
// ============================================================

const webSocketServer =
  new WebSocketServer({
    server,

    maxPayload: 4096
  });


webSocketServer.on(
  "connection",
  socket => {
    socket.isAlive =
      true;


    socket.on(
      "pong",
      () => {
        socket.isAlive =
          true;
      }
    );


    const player =
      createPlayer();


    players.set(
      socket,
      player
    );


    send(
      socket,
      {
        type:
          "welcome",

        playerId:
          player.id
      }
    );


    sendGlobalStatus();


    socket.on(
      "message",
      raw => {
        try {
          const message =
            JSON.parse(
              raw.toString()
            );


          if (
            !message ||
            typeof message.type !==
            "string"
          ) {
            return;
          }


          if (
            message.type ===
            "setName"
          ) {
            player.name =
              sanitizeName(
                message.name
              );

            return;
          }


          if (
            message.type ===
            "joinMap"
          ) {
            if (
              typeof message.mapId ===
              "string"
            ) {
              joinMap(
                socket,
                player,
                message.mapId
              );
            }

            return;
          }


          if (
            message.type ===
            "leaveMap"
          ) {
            const oldMap =
              player.mapId;


            player.mapId =
              null;

            player.hidden =
              false;

            player.hiddenAt =
              null;

            player.vx = 0;
            player.vy = 0;


            if (
              oldMap
            ) {
              broadcastMap(
                oldMap
              );
            }

            return;
          }


          if (
            message.type ===
            "input"
          ) {
            let x =
              Number(
                message.x
              );


            let y =
              Number(
                message.y
              );


            if (
              !Number.isFinite(
                x
              )
            ) {
              x = 0;
            }


            if (
              !Number.isFinite(
                y
              )
            ) {
              y = 0;
            }


            player.inputX =
              clamp(
                x,
                -1,
                1
              );


            player.inputY =
              clamp(
                y,
                -1,
                1
              );

            return;
          }


          if (
            message.type ===
            "jump"
          ) {
            player.jumpQueuedUntil =
              Date.now() +
              PLAYER.jumpBuffer;


            attemptJump(
              player,
              Date.now()
            );

            return;
          }


          if (
            message.type ===
            "interact"
          ) {
            interact(
              socket,
              player
            );
          }

        } catch {
          // Ignore invalid packets.
        }
      }
    );


    socket.on(
      "close",
      () => {
        const oldMap =
          player.mapId;


        players.delete(
          socket
        );


        if (
          oldMap
        ) {
          broadcastMap(
            oldMap
          );
        }


        sendGlobalStatus();
      }
    );
  }
);


// ============================================================
// HEARTBEAT
// ============================================================

const heartbeatInterval =
  setInterval(
    () => {
      for (
        const socket
        of webSocketServer.clients
      ) {
        if (
          socket.isAlive ===
          false
        ) {
          socket.terminate();

          continue;
        }


        socket.isAlive =
          false;


        try {
          socket.ping();
        } catch {
          socket.terminate();
        }
      }
    },

    15000
  );


// ============================================================
// START
// ============================================================

const gameInterval =
  setInterval(
    updateWorld,
    TICK_MS
  );


webSocketServer.on(
  "close",
  () => {
    clearInterval(
      heartbeatInterval
    );


    clearInterval(
      gameInterval
    );
  }
);


server.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `DuckyMaps V4.9 läuft auf Port ${PORT}`
    );
  }
);
