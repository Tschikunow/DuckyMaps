"use strict";

const http =
  require("node:http");

const fs =
  require("node:fs");

const path =
  require("node:path");

const crypto =
  require("node:crypto");

const {
  WebSocketServer,
  WebSocket
} = require("ws");

const {
  MAPS
} = require("./maps");


// ============================================================
// CONFIG
// ============================================================

const PORT =
  Number(process.env.PORT) ||
  3000;


const TICK_RATE = 30;

const TICK_MS =
  1000 / TICK_RATE;


const PLAYER = {
  radius: 18,

  // Normales Laufen absichtlich langsamer.
  baseSpeed: 185,

  acceleration: 1200,

  airAcceleration: 720,

  // Bunnyhop kann bis ungefähr 2x Speed gehen.
  bunnyhopGain: 0.18,

  bunnyhopMax: 1.0,

  bunnyhopDecay: 0.025,

  bunnyhopWindow: 520,

  jumpDuration: 430,

  jumpBuffer: 180,

  doorDistance: 145,

  interactDistance: 120
};


const publicDir =
  path.join(
    __dirname,
    "public"
  );


const players =
  new Map();


const mapStates = {};


// ============================================================
// MAP STATES
// ============================================================

for (
  const [mapId, map]
  of Object.entries(MAPS)
) {
  mapStates[mapId] = {
    doors: {},

    lightsOn: true,

    powerOn: true,

    interactables: {}
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
      active: false
    };
  }
}


// ============================================================
// HELPERS
// ============================================================

function clamp(
  value,
  min,
  max
) {
  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );
}


function moveToward(
  current,
  target,
  amount
) {
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


function sanitizeName(
  value
) {
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
      .slice(0, 20)
      ||
      "Spieler"
  );
}


function randomSpawn(
  map
) {
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

    airborne: false,

    jumpStartedAt: 0,

    jumpEndsAt: 0,

    landedAt: 0,

    jumpQueuedUntil: 0,

    bunnyhop: 0,

    hidden: false,

    hiddenAt:
      null,

    coins: 0,

    activeTime: 0,

    lastInteraction: 0,

    visitedCheckpoints:
      new Set()
  };
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
      rect.x + rect.w
    );


  const nearestY =
    clamp(
      y,
      rect.y,
      rect.y + rect.h
    );


  const dx =
    x - nearestX;

  const dy =
    y - nearestY;


  return (
    dx * dx +
    dy * dy
  ) < radius * radius;
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


    // Ab etwa 55 % Öffnung kann man hindurch.
    if (
      doorState.amount < 0.55 &&
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
// NETWORK HELPERS
// ============================================================

function send(
  socket,
  message
) {
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
    type:
      "status",

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


function createMapState(
  mapId
) {
  const now =
    Date.now();


  const resultPlayers =
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
        30;
    }


    resultPlayers.push({
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

      bunnyhop:
        player.bunnyhop,

      hidden:
        player.hidden,

      coins:
        player.coins
    });
  }


  const mapState =
    mapStates[
      mapId
    ];


  return {
    type:
      "state",

    mapId,

    players:
      resultPlayers,

    doors:
      mapState.doors,

    worldState: {
      lightsOn:
        mapState.lightsOn,

      powerOn:
        mapState.powerOn,

      interactables:
        mapState.interactables
    }
  };
}


function broadcastMap(
  mapId
) {
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
// JOIN MAP
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

  player.bunnyhop = 0;

  player.hidden =
    false;


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
        "rewardState",

      coins:
        player.coins
    }
  );


  if (
    oldMap &&
    oldMap !== mapId
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
// AUTOMATIC DOORS
// ============================================================

function updateDoors(
  dt
) {
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
        door.w / 2;


      const centerY =
        door.y +
        door.h / 2;


      let shouldOpen =
        false;


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

          2.8 * dt
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
    player.jumpQueuedUntil <
      now
  ) {
    return;
  }


  player.jumpQueuedUntil =
    0;


  const moving =
    Math.hypot(
      player.inputX,
      player.inputY
    ) > 0.15;


  const quickHop =
    (
      player.landedAt ===
      0
    ) ||
    (
      now -
      player.landedAt <=
      PLAYER.bunnyhopWindow
    );


  if (
    moving &&
    quickHop
  ) {
    player.bunnyhop =
      Math.min(
        PLAYER.bunnyhopMax,

        player.bunnyhop +
        PLAYER.bunnyhopGain
      );
  }


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
        .add(key);


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


  let nearestDistance =
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
        nearestDistance
    ) {
      nearest =
        item;


      nearestDistance =
        distance;
    }
  }


  return nearest;
}


function interact(
  socket,
  player
) {
  if (
    !player.mapId
  ) {
    return;
  }


  const now =
    Date.now();


  if (
    now -
    player.lastInteraction <
    350
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
            ? "Strom eingeschaltet."
            : "Strom ausgeschaltet."
      }
    );
  }


  if (
    item.type ===
    "vent"
  ) {
    itemState.active =
      !itemState.active;


    send(
      socket,
      {
        type:
          "interactionMessage",

        text:
          itemState.active
            ? "Lüftung geöffnet."
            : "Lüftung geschlossen."
      }
    );
  }


  if (
    item.type ===
    "radio"
  ) {
    itemState.active =
      !itemState.active;


    send(
      socket,
      {
        type:
          "interactionMessage",

        text:
          itemState.active
            ? "Hafenfunk eingeschaltet."
            : "Hafenfunk ausgeschaltet."
      }
    );
  }


  if (
    item.type ===
    "terminal"
  ) {
    itemState.active =
      !itemState.active;


    send(
      socket,
      {
        type:
          "interactionMessage",

        text:
          itemState.active
            ? "Terminal aktiviert."
            : "Terminal gesperrt."
      }
    );
  }


  if (
    item.type ===
    "hide"
  ) {
    player.hidden =
      !player.hidden;


    player.vx = 0;
    player.vy = 0;


    if (
      player.hidden
    ) {
      player.hiddenAt =
        item.id;
    } else {
      player.hiddenAt =
        null;
    }


    send(
      socket,
      {
        type:
          "interactionMessage",

        text:
          player.hidden
            ? "Du versteckst dich."
            : "Du kommst aus dem Versteck."
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
    1 / TICK_RATE;


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


    // Landung
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


    // Jump Buffer
    attemptJump(
      player,
      now
    );


    // Während man versteckt ist:
    // keine Bewegung.
    if (
      player.hidden
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
      inputLength > 1
    ) {
      inputX /=
        inputLength;


      inputY /=
        inputLength;
    }


    // 0 Bunnyhop = 1x.
    // 1 Bunnyhop = 2x.
    const speedMultiplier =
      1 +
      player.bunnyhop;


    const targetSpeed =
      PLAYER.baseSpeed *
      speedMultiplier;


    const targetVX =
      inputX *
      targetSpeed;


    const targetVY =
      inputY *
      targetSpeed;


    const acceleration =
      player.airborne
        ? PLAYER.airAcceleration
        : PLAYER.acceleration;


    player.vx =
      moveToward(
        player.vx,
        targetVX,
        acceleration * dt
      );


    player.vy =
      moveToward(
        player.vy,
        targetVY,
        acceleration * dt
      );


    // Bodenbremsung.
    if (
      inputLength <
      0.05
    ) {
      const braking =
        player.airborne
          ? 220
          : 1500;


      player.vx =
        moveToward(
          player.vx,
          0,
          braking * dt
        );


      player.vy =
        moveToward(
          player.vy,
          0,
          braking * dt
        );
    }


    // X Kollisionsbewegung
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


      player.bunnyhop =
        Math.max(
          0,
          player.bunnyhop -
          0.12
        );
    }


    // Y Kollisionsbewegung
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


      player.bunnyhop =
        Math.max(
          0,
          player.bunnyhop -
          0.12
        );
    }


    // Wer nach der Landung nicht schnell
    // wieder springt, verliert Boost.
    if (
      !player.airborne &&
      player.landedAt > 0 &&
      now -
      player.landedAt >
      PLAYER.bunnyhopWindow
    ) {
      player.bunnyhop =
        Math.max(
          0,

          player.bunnyhop -
          PLAYER.bunnyhopDecay
      );
    }


    // Aktiv-Spielzeit.
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
    broadcastMap(
      mapId
    );
  }
}


// ============================================================
// STATIC FILE SERVER
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
          res.writeHead(
            403
          );

          res.end(
            "Forbidden"
          );

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
          res.writeHead(
            404
          );

          res.end(
            "Not found"
          );

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

    maxPayload:
      4096
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
          // Ungültige Nachrichten ignorieren.
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
      `DuckyMaps V4.5 läuft auf Port ${PORT}`
    );
  }
);
