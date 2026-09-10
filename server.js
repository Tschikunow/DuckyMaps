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
  Number(process.env.PORT) || 3000;


const PLAYER = {
  radius: 18,

  baseSpeed: 260,

  acceleration: 1500,

  airAcceleration: 600,

  bunnyhopStep: 0.08,

  maxBunnyhop: 0.40,

  jumpDuration: 430,

  bunnyhopWindow: 320,

  doorDistance: 115
};


const TICK_RATE = 30;

const TICK_MS =
  1000 / TICK_RATE;


const publicDir =
  path.join(__dirname, "public");


const players =
  new Map();


const doorStates = {};


// ============================================================
// DOOR STATES
// ============================================================

for (
  const [mapId, map]
  of Object.entries(MAPS)
) {
  doorStates[mapId] = {};

  for (
    const door
    of map.doors
  ) {
    doorStates[mapId][door.id] = {
      open: false,
      amount: 0
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
    Math.min(max, value)
  );
}


function moveToward(
  current,
  target,
  maxDelta
) {
  if (
    Math.abs(target - current)
    <= maxDelta
  ) {
    return target;
  }

  return current +
    Math.sign(target - current)
    * maxDelta;
}


function sanitizeName(value) {
  if (
    typeof value !== "string"
  ) {
    return "Spieler";
  }

  const clean =
    value
      .replace(/[<>]/g, "")
      .trim()
      .slice(0, 20);

  return clean || "Spieler";
}


function randomSpawn(map) {
  const list =
    map.spawnPoints;

  return list[
    Math.floor(
      Math.random() * list.length
    )
  ];
}


// ============================================================
// PLAYER
// ============================================================

function createPlayer() {
  return {
    id: crypto.randomUUID(),

    name: "Spieler",

    mapId: null,

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

    hasJumped: false,

    bunnyhop: 0,

    queuedJump: false,

    coins: 0,

    activeTime: 0,

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
    MAPS[player.mapId];

  if (!map) {
    return false;
  }


  if (
    x < PLAYER.radius ||
    y < PLAYER.radius ||
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
    const object
    of map.furniture
  ) {
    if (
      object.solid &&
      circleHitsRect(
        x,
        y,
        PLAYER.radius,
        object
      )
    ) {
      return true;
    }
  }


  for (
    const door
    of map.doors
  ) {
    const state =
      doorStates[
        player.mapId
      ][door.id];

    if (
      state &&
      state.amount < 0.65 &&
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
// MAP JOIN
// ============================================================

function joinMap(
  socket,
  player,
  mapId
) {
  const map =
    MAPS[mapId];

  if (!map) {
    return;
  }


  const oldMap =
    player.mapId;


  player.mapId =
    mapId;


  const spawn =
    randomSpawn(map);


  player.x =
    spawn.x;

  player.y =
    spawn.y;


  player.vx = 0;
  player.vy = 0;

  player.bunnyhop = 0;

  player.airborne = false;

  player.queuedJump = false;


  socket.send(
    JSON.stringify({
      type: "map",
      map
    })
  );


  socket.send(
    JSON.stringify({
      type: "rewardState",
      coins: player.coins
    })
  );


  if (oldMap) {
    broadcastMap(oldMap);
  }


  broadcastMap(mapId);
}


// ============================================================
// NETWORK
// ============================================================

function sendGlobalStatus() {
  const message =
    JSON.stringify({
      type: "status",

      online:
        players.size
    });


  for (
    const socket
    of players.keys()
  ) {
    if (
      socket.readyState ===
      WebSocket.OPEN
    ) {
      socket.send(message);
    }
  }
}


function createMapState(
  mapId
) {
  const now =
    Date.now();


  const mapPlayers =
    [];


  for (
    const player
    of players.values()
  ) {
    if (
      player.mapId !== mapId
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
        ) * 24;
    }


    mapPlayers.push({
      id: player.id,

      name: player.name,

      x: player.x,
      y: player.y,

      vx: player.vx,
      vy: player.vy,

      jumpHeight,

      bunnyhop:
        player.bunnyhop,

      coins:
        player.coins
    });
  }


  return {
    type: "state",

    mapId,

    players:
      mapPlayers,

    doors:
      doorStates[mapId]
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
    const [socket, player]
    of players.entries()
  ) {
    if (
      player.mapId === mapId &&
      socket.readyState ===
        WebSocket.OPEN
    ) {
      socket.send(data);
    }
  }
}


function sendReward(
  socket,
  player,
  amount,
  reason
) {
  player.coins +=
    amount;


  if (
    socket.readyState ===
    WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "reward",

        amount,

        reason,

        coins:
          player.coins
      })
    );
  }
}


// ============================================================
// DOORS
// ============================================================

function updateDoors(dt) {
  for (
    const [mapId, map]
    of Object.entries(MAPS)
  ) {
    const mapPlayers =
      [...players.values()]
        .filter(
          player =>
            player.mapId ===
            mapId
        );


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
        of mapPlayers
      ) {
        const distance =
          Math.hypot(
            player.x -
              centerX,
            player.y -
              centerY
          );


        if (
          distance <=
          PLAYER.doorDistance
        ) {
          shouldOpen =
            true;

          break;
        }
      }


      const state =
        doorStates[
          mapId
        ][door.id];


      state.open =
        shouldOpen;


      const target =
        shouldOpen
          ? 1
          : 0;


      const speed =
        3.8 * dt;


      state.amount =
        moveToward(
          state.amount,
          target,
          speed
        );
    }
  }
}


// ============================================================
// JUMP + BUNNYHOP
// ============================================================

function tryJump(
  player,
  now
) {
  if (
    !player.queuedJump ||
    player.airborne
  ) {
    return;
  }


  player.queuedJump =
    false;


  if (
    player.hasJumped &&
    now -
      player.landedAt <=
        PLAYER.bunnyhopWindow
  ) {
    player.bunnyhop =
      Math.min(
        PLAYER.maxBunnyhop,

        player.bunnyhop +
        PLAYER.bunnyhopStep
      );
  } else if (
    player.hasJumped
  ) {
    player.bunnyhop = 0;
  }


  player.hasJumped =
    true;

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


    const distance =
      Math.hypot(
        player.x -
          checkpoint.x,

        player.y -
          checkpoint.y
      );


    if (
      distance <=
      checkpoint.radius
    ) {
      player.visitedCheckpoints
        .add(key);


      sendReward(
        socket,
        player,
        5,
        `${checkpoint.name} entdeckt`
      );
    }
  }
}


// ============================================================
// GAME LOOP
// ============================================================

function updateWorld() {
  const dt =
    1 / TICK_RATE;


  const now =
    Date.now();


  updateDoors(dt);


  for (
    const [socket, player]
    of players.entries()
  ) {
    if (!player.mapId) {
      continue;
    }


    const map =
      MAPS[player.mapId];


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


    tryJump(
      player,
      now
    );


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


    const speed =
      PLAYER.baseSpeed *
      (
        1 +
        player.bunnyhop
      );


    const targetVX =
      inputX * speed;

    const targetVY =
      inputY * speed;


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


    if (
      inputLength < 0.05
    ) {
      const brake =
        player.airborne
          ? 250
          : 1800;


      player.vx =
        moveToward(
          player.vx,
          0,
          brake * dt
        );


      player.vy =
        moveToward(
          player.vy,
          0,
          brake * dt
        );
    }


    const nextX =
      player.x +
      player.vx * dt;


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


    const nextY =
      player.y +
      player.vy * dt;


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


    if (
      !player.airborne &&
      now -
        player.landedAt >
        900
    ) {
      player.bunnyhop =
        Math.max(
          0,
          player.bunnyhop -
          0.018
        );
    }


    if (
      inputLength > 0.15
    ) {
      player.activeTime +=
        TICK_MS;


      if (
        player.activeTime >=
        30000
      ) {
        player.activeTime -=
          30000;


        sendReward(
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
    of Object.keys(MAPS)
  ) {
    broadcastMap(
      mapId
    );
  }
}


// ============================================================
// STATIC WEBSITE
// ============================================================

const server =
  http.createServer(
    (req, res) => {
      try {
        let requestPath =
          decodeURIComponent(
            (
              req.url || "/"
            ).split("?")[0]
          );


        if (
          requestPath === "/"
        ) {
          requestPath =
            "/index.html";
        }


        const relativePath =
          requestPath.replace(
            /^\/+/,
            ""
          );


        const filePath =
          path.join(
            publicDir,
            relativePath
          );


        if (
          !filePath.startsWith(
            publicDir
          )
        ) {
          res.writeHead(403);

          res.end(
            "Forbidden"
          );

          return;
        }


        if (
          !fs.existsSync(
            filePath
          )
        ) {
          res.writeHead(404);

          res.end(
            "Not found"
          );

          return;
        }


        const stat =
          fs.statSync(
            filePath
          );


        if (
          !stat.isFile()
        ) {
          res.writeHead(404);

          res.end(
            "Not found"
          );

          return;
        }


        const extension =
          path
            .extname(filePath)
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
          .pipe(res);

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


    socket.send(
      JSON.stringify({
        type:
          "welcome",

        playerId:
          player.id
      })
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


            if (
              player.mapId
            ) {
              broadcastMap(
                player.mapId
              );
            }

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
              !Number.isFinite(x)
            ) {
              x = 0;
            }


            if (
              !Number.isFinite(y)
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
            player.queuedJump =
              true;
          }

        } catch {
          // Ungültige Nachricht ignorieren.
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


    socket.on(
      "error",
      () => {
        // close übernimmt das Aufräumen.
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
      `DuckyMaps V4 läuft auf Port ${PORT}`
    );
  }
);
