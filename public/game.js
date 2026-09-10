"use strict";

// ============================================================
// DuckyMaps – Multiplayer Game Client
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const connectionDot = document.getElementById("connectionDot");
const connectionText = document.getElementById("connectionText");
const playerCount = document.getElementById("playerCount");

const nameInput = document.getElementById("nameInput");
const nameButton = document.getElementById("nameButton");

const joystickElement = document.getElementById("joystick");
const stickElement = document.getElementById("stick");

// ------------------------------------------------------------
// Bildschirm
// ------------------------------------------------------------

let width = 0;
let height = 0;
let dpr = 1;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);

  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resize);
resize();

// ------------------------------------------------------------
// Multiplayer
// ------------------------------------------------------------

let socket = null;
let reconnectTimer = null;

let myId = null;

let world = {
  width: 2400,
  height: 1400
};

let players = [];

// ------------------------------------------------------------
// Eingabe
// ------------------------------------------------------------

const keys = new Set();

const input = {
  x: 0,
  y: 0
};

const joystick = {
  active: false,
  pointerId: null,
  x: 0,
  y: 0
};

// ------------------------------------------------------------
// Verbindung
// ------------------------------------------------------------

function connect() {
  if (socket) {
    try {
      socket.close();
    } catch {
      // Verbindung kann bereits geschlossen sein.
    }
  }

  clearTimeout(reconnectTimer);

  const protocol =
    location.protocol === "https:"
      ? "wss:"
      : "ws:";

  socket = new WebSocket(
    `${protocol}//${location.host}`
  );

  socket.addEventListener("open", () => {
    setConnectionStatus(true);
    sendName();
  });

  socket.addEventListener("message", (event) => {
    handleServerMessage(event.data);
  });

  socket.addEventListener("close", () => {
    setConnectionStatus(false);
    scheduleReconnect();
  });

  socket.addEventListener("error", () => {
    setConnectionStatus(false);
  });
}

function scheduleReconnect() {
  clearTimeout(reconnectTimer);

  reconnectTimer = setTimeout(() => {
    connect();
  }, 1500);
}

function setConnectionStatus(connected) {
  if (connected) {
    connectionText.textContent = "Online";
    connectionDot.style.color = "#45ff9a";
    connectionDot.style.background = "#45ff9a";
  } else {
    connectionText.textContent = "Verbindung...";
    connectionDot.style.color = "#ffbf3c";
    connectionDot.style.background = "#ffbf3c";
  }
}

function handleServerMessage(rawMessage) {
  try {
    const message = JSON.parse(rawMessage);

    if (!message || typeof message.type !== "string") {
      return;
    }

    if (message.type === "welcome") {
      myId = message.playerId;

      if (message.world) {
        world = message.world;
      }

      return;
    }

    if (message.type === "state") {
      if (message.world) {
        world = message.world;
      }

      players = Array.isArray(message.players)
        ? message.players
        : [];

      playerCount.textContent =
        String(players.length);
    }
  } catch {
    // Ungültige Nachrichten ignorieren.
  }
}

// ------------------------------------------------------------
// Spielernamen
// ------------------------------------------------------------

function sendName() {
  if (
    !socket ||
    socket.readyState !== WebSocket.OPEN
  ) {
    return;
  }

  socket.send(
    JSON.stringify({
      type: "setName",
      name: nameInput.value
    })
  );
}

nameButton.addEventListener("click", sendName);

nameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendName();
    nameInput.blur();
  }
});

// ------------------------------------------------------------
// Tastatur
// ------------------------------------------------------------

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  keys.add(key);

  if (
    [
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
      "w",
      "a",
      "s",
      "d",
      " "
    ].includes(key)
  ) {
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

// ------------------------------------------------------------
// Bewegung
// ------------------------------------------------------------

function updateInput() {
  let x = 0;
  let y = 0;

  if (
    keys.has("a") ||
    keys.has("arrowleft")
  ) {
    x -= 1;
  }

  if (
    keys.has("d") ||
    keys.has("arrowright")
  ) {
    x += 1;
  }

  if (
    keys.has("w") ||
    keys.has("arrowup")
  ) {
    y -= 1;
  }

  if (
    keys.has("s") ||
    keys.has("arrowdown")
  ) {
    y += 1;
  }

  // Touch-Joystick überschreibt Tastaturbewegung.
  if (joystick.active) {
    x = joystick.x;
    y = joystick.y;
  }

  const length = Math.hypot(x, y);

  if (length > 1) {
    x /= length;
    y /= length;
  }

  input.x = x;
  input.y = y;
}

function sendInput() {
  updateInput();

  if (
    !socket ||
    socket.readyState !== WebSocket.OPEN
  ) {
    return;
  }

  socket.send(
    JSON.stringify({
      type: "input",
      x: input.x,
      y: input.y
    })
  );
}

// 20 Eingaben pro Sekunde an den Server.
setInterval(sendInput, 50);

// ------------------------------------------------------------
// Spieler
// ------------------------------------------------------------

function getMyPlayer() {
  return players.find(
    (player) => player.id === myId
  );
}

// ------------------------------------------------------------
// Kamera
// ------------------------------------------------------------

function getCamera() {
  const me = getMyPlayer();

  if (!me) {
    return {
      x: world.width / 2,
      y: world.height / 2
    };
  }

  return {
    x: me.x,
    y: me.y
  };
}

function worldToScreen(x, y, camera) {
  return {
    x: x - camera.x + width / 2,
    y: y - camera.y + height / 2
  };
}

// ------------------------------------------------------------
// Hintergrund
// ------------------------------------------------------------

function drawBackground(camera) {
  ctx.fillStyle = "#050711";
  ctx.fillRect(0, 0, width, height);

  const gridSize = 80;

  const offsetX =
    ((-camera.x + width / 2) % gridSize + gridSize) %
    gridSize;

  const offsetY =
    ((-camera.y + height / 2) % gridSize + gridSize) %
    gridSize;

  ctx.strokeStyle = "rgba(80, 150, 255, 0.07)";
  ctx.lineWidth = 1;

  for (
    let x = offsetX;
    x < width;
    x += gridSize
  ) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (
    let y = offsetY;
    y < height;
    y += gridSize
  ) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const glow = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.75
  );

  glow.addColorStop(
    0,
    "rgba(0, 200, 255, 0.07)"
  );

  glow.addColorStop(
    1,
    "rgba(0, 0, 0, 0)"
  );

  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

// ------------------------------------------------------------
// Weltgrenze
// ------------------------------------------------------------

function drawWorldBorder(camera) {
  const topLeft = worldToScreen(
    0,
    0,
    camera
  );

  ctx.save();

  ctx.strokeStyle = "#238cff";
  ctx.lineWidth = 3;
  ctx.shadowBlur = 18;
  ctx.shadowColor = "#238cff";

  ctx.strokeRect(
    topLeft.x,
    topLeft.y,
    world.width,
    world.height
  );

  ctx.restore();
}

// ------------------------------------------------------------
// Spieler zeichnen
// ------------------------------------------------------------

function drawPlayer(player, camera) {
  const screen = worldToScreen(
    player.x,
    player.y,
    camera
  );

  const localPlayer =
    player.id === myId;

  const radius = localPlayer
    ? 22
    : 20;

  ctx.save();

  ctx.translate(
    screen.x,
    screen.y
  );

  ctx.shadowBlur = localPlayer
    ? 30
    : 20;

  ctx.shadowColor = localPlayer
    ? "#00eaff"
    : "#8b5cff";

  ctx.fillStyle = localPlayer
    ? "#00eaff"
    : "#8b5cff";

  ctx.beginPath();
  ctx.arc(
    0,
    0,
    radius,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Highlight
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#ffffff";

  ctx.beginPath();
  ctx.arc(
    -6,
    -6,
    5,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Name
  ctx.font = "bold 14px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";

  ctx.fillStyle = "#ffffff";

  ctx.fillText(
    player.name || "Spieler",
    0,
    -30
  );

  ctx.restore();
}

// ------------------------------------------------------------
// Touch-Joystick
// ------------------------------------------------------------

function updateJoystick(clientX, clientY) {
  const rect =
    joystickElement.getBoundingClientRect();

  const centerX =
    rect.left + rect.width / 2;

  const centerY =
    rect.top + rect.height / 2;

  let dx = clientX - centerX;
  let dy = clientY - centerY;

  const max =
    rect.width / 2 - 30;

  const length =
    Math.hypot(dx, dy);

  if (length > max) {
    dx = (dx / length) * max;
    dy = (dy / length) * max;
  }

  joystick.x =
    dx / max;

  joystick.y =
    dy / max;

  stickElement.style.transform =
    `translate(${dx}px, ${dy}px)`;
}

function resetJoystick() {
  joystick.active = false;
  joystick.pointerId = null;

  joystick.x = 0;
  joystick.y = 0;

  stickElement.style.transform =
    "translate(0, 0)";
}

joystickElement.addEventListener(
  "pointerdown",
  (event) => {
    joystick.active = true;
    joystick.pointerId = event.pointerId;

    joystickElement.setPointerCapture(
      event.pointerId
    );

    updateJoystick(
      event.clientX,
      event.clientY
    );
  }
);

joystickElement.addEventListener(
  "pointermove",
  (event) => {
    if (!joystick.active) {
      return;
    }

    updateJoystick(
      event.clientX,
      event.clientY
    );
  }
);

joystickElement.addEventListener(
  "pointerup",
  resetJoystick
);

joystickElement.addEventListener(
  "pointercancel",
  resetJoystick
);

// ------------------------------------------------------------
// Render-Schleife
// ------------------------------------------------------------

function render() {
  const camera = getCamera();

  drawBackground(camera);
  drawWorldBorder(camera);

  for (const player of players) {
    drawPlayer(
      player,
      camera
    );
  }
}

function animationLoop() {
  render();
  requestAnimationFrame(animationLoop);
}

// ------------------------------------------------------------
// Start
// ------------------------------------------------------------

setConnectionStatus(false);
connect();
animationLoop();
