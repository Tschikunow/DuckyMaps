"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { WebSocketServer, WebSocket } = require("ws");

const PORT = Number(process.env.PORT) || 3000;

const WORLD = {
  width: 2400,
  height: 1400
};

const PLAYER = {
  radius: 22,
  speed: 300
};

const TICK_RATE = 20;
const TICK_MS = 1000 / TICK_RATE;

const publicDir = path.join(__dirname, "public");

// Hier werden alle verbundenen Spieler gespeichert.
const players = new Map();

function randomPosition() {
  return {
    x: 200 + Math.random() * (WORLD.width - 400),
    y: 200 + Math.random() * (WORLD.height - 400)
  };
}

function createPlayer() {
  const position = randomPosition();

  return {
    id: crypto.randomUUID(),
    name: "Spieler",
    x: position.x,
    y: position.y,
    input: {
      x: 0,
      y: 0
    }
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sanitizeName(value) {
  if (typeof value !== "string") {
    return "Spieler";
  }

  const clean = value
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 20);

  return clean || "Spieler";
}

function broadcast(message) {
  const data = JSON.stringify(message);

  for (const socket of players.keys()) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(data);
    }
  }
}

function createSnapshot() {
  return {
    type: "state",

    world: WORLD,

    players: [...players.values()].map((player) => ({
      id: player.id,
      name: player.name,
      x: player.x,
      y: player.y
    }))
  };
}

function removePlayer(socket) {
  if (!players.has(socket)) {
    return;
  }

  players.delete(socket);

  console.log(`Spieler getrennt. Online: ${players.size}`);

  broadcast(createSnapshot());
}

function updateWorld() {
  const dt = 1 / TICK_RATE;

  for (const player of players.values()) {
    let x = player.input.x;
    let y = player.input.y;

    const length = Math.hypot(x, y);

    if (length > 1) {
      x /= length;
      y /= length;
    }

    player.x += x * PLAYER.speed * dt;
    player.y += y * PLAYER.speed * dt;

    player.x = clamp(
      player.x,
      PLAYER.radius,
      WORLD.width - PLAYER.radius
    );

    player.y = clamp(
      player.y,
      PLAYER.radius,
      WORLD.height - PLAYER.radius
    );
  }

  broadcast(createSnapshot());
}


// --------------------------------------------------
// WEBSEITE AUS DEM PUBLIC-ORDNER AUSLIEFERN
// --------------------------------------------------

const server = http.createServer((req, res) => {
  try {
    let requestPath = decodeURIComponent(
      (req.url || "/").split("?")[0]
    );

    if (requestPath === "/") {
      requestPath = "/index.html";
    }

    const filePath = path.normalize(
      path.join(publicDir, requestPath)
    );

    if (!filePath.startsWith(publicDir)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const stat = fs.statSync(filePath);

    if (!stat.isFile()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();

    const mimeTypes = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
      ".webp": "image/webp",
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav"
    };

    res.writeHead(200, {
      "Content-Type":
        mimeTypes[extension] ||
        "application/octet-stream",

      "Cache-Control": "no-cache"
    });

    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error(error);

    if (!res.headersSent) {
      res.writeHead(500);
    }

    res.end("Internal server error");
  }
});


// --------------------------------------------------
// WEBSOCKET / MULTIPLAYER
// --------------------------------------------------

const webSocketServer = new WebSocketServer({
  server,
  maxPayload: 4096
});

webSocketServer.on("connection", (socket) => {
  // Der Server merkt sich, ob diese Verbindung noch lebt.
  socket.isAlive = true;

  socket.on("pong", () => {
    socket.isAlive = true;
  });

  const player = createPlayer();

  players.set(socket, player);

  console.log(`Spieler verbunden. Online: ${players.size}`);

  socket.send(
    JSON.stringify({
      type: "welcome",
      playerId: player.id,
      world: WORLD
    })
  );

  broadcast(createSnapshot());

  socket.on("message", (raw) => {
    try {
      const message = JSON.parse(raw.toString());

      if (!message || typeof message.type !== "string") {
        return;
      }

      if (message.type === "input") {
        let x = Number(message.x);
        let y = Number(message.y);

        if (!Number.isFinite(x)) {
          x = 0;
        }

        if (!Number.isFinite(y)) {
          y = 0;
        }

        player.input.x = clamp(x, -1, 1);
        player.input.y = clamp(y, -1, 1);
      }

      if (message.type === "setName") {
        player.name = sanitizeName(message.name);

        broadcast(createSnapshot());
      }
    } catch {
      // Ungültige Nachrichten werden ignoriert.
    }
  });

  socket.on("close", () => {
    removePlayer(socket);
  });

  socket.on("error", () => {
    removePlayer(socket);
  });
});


// --------------------------------------------------
// GEISTERSPIELER-FIX
// --------------------------------------------------

// Alle 15 Sekunden wird geprüft,
// ob die Browser-Verbindungen noch wirklich existieren.
const heartbeatInterval = setInterval(() => {
  for (const socket of webSocketServer.clients) {
    if (socket.isAlive === false) {
      console.log("Tote Verbindung entfernt.");

      removePlayer(socket);

      socket.terminate();

      continue;
    }

    socket.isAlive = false;

    try {
      socket.ping();
    } catch {
      removePlayer(socket);
      socket.terminate();
    }
  }
}, 15000);


// --------------------------------------------------
// SPIEL-SERVER STARTEN
// --------------------------------------------------

const gameInterval = setInterval(
  updateWorld,
  TICK_MS
);

webSocketServer.on("close", () => {
  clearInterval(heartbeatInterval);
  clearInterval(gameInterval);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`DuckyMaps läuft auf Port ${PORT}`);
});
