"use strict";

// ============================================================
// DUCKYMAPS V2
// Multiplayer Client
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const minimap = document.getElementById("minimap");
const minimapCtx = minimap.getContext("2d");

const connectionDot =
  document.getElementById("connectionDot");

const connectionText =
  document.getElementById("connectionText");

const playerCount =
  document.getElementById("playerCount");

const playerList =
  document.getElementById("playerList");

const notifications =
  document.getElementById("notifications");

const nameInput =
  document.getElementById("nameInput");

const nameButton =
  document.getElementById("nameButton");

const joystickElement =
  document.getElementById("joystick");

const stickElement =
  document.getElementById("stick");


// ============================================================
// BILDSCHIRM
// ============================================================

let width = 0;
let height = 0;
let dpr = 1;

function resize() {
  dpr = Math.min(
    window.devicePixelRatio || 1,
    2
  );

  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width =
    Math.floor(width * dpr);

  canvas.height =
    Math.floor(height * dpr);

  canvas.style.width =
    `${width}px`;

  canvas.style.height =
    `${height}px`;

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );
}

window.addEventListener(
  "resize",
  resize
);

resize();


// ============================================================
// SPIELDATEN
// ============================================================

let socket = null;

let reconnectTimer = null;

let myId = null;

let players = [];

let previousPlayers =
  new Map();

let world = {
  width: 2400,
  height: 1400
};


// ============================================================
// KAMERA
// ============================================================

const camera = {
  x: world.width / 2,
  y: world.height / 2
};


// ============================================================
// EINGABE
// ============================================================

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


// ============================================================
// NAME SPEICHERN
// ============================================================

const savedName =
  localStorage.getItem(
    "duckymaps-name"
  );

if (savedName) {
  nameInput.value =
    savedName;
}


// ============================================================
// SPIELERFARBEN
// ============================================================

const playerColors = [
  "#00eaff",
  "#8b5cff",
  "#ff4fa3",
  "#35ff8a",
  "#ffce3a",
  "#ff7548",
  "#4f7cff",
  "#00ffa6"
];

function hashString(text) {
  let hash = 0;

  for (
    let i = 0;
    i < text.length;
    i++
  ) {
    hash =
      (hash * 31 +
        text.charCodeAt(i)) |
      0;
  }

  return Math.abs(hash);
}

function getPlayerColor(player) {
  if (player.id === myId) {
    return "#00eaff";
  }

  const index =
    hashString(player.id) %
    playerColors.length;

  return playerColors[index];
}


// ============================================================
// WEBSOCKET VERBINDUNG
// ============================================================

function connect() {

  clearTimeout(
    reconnectTimer
  );

  const protocol =
    location.protocol === "https:"
      ? "wss:"
      : "ws:";

  socket =
    new WebSocket(
      `${protocol}//${location.host}`
    );

  socket.addEventListener(
    "open",
    () => {

      setConnectionStatus(true);

      setTimeout(
        sendName,
        100
      );
    }
  );

  socket.addEventListener(
    "message",
    (event) => {

      handleServerMessage(
        event.data
      );
    }
  );

  socket.addEventListener(
    "close",
    () => {

      setConnectionStatus(false);

      scheduleReconnect();
    }
  );

  socket.addEventListener(
    "error",
    () => {

      setConnectionStatus(false);
    }
  );
}


function scheduleReconnect() {

  clearTimeout(
    reconnectTimer
  );

  reconnectTimer =
    setTimeout(
      connect,
      1500
    );
}


// ============================================================
// VERBINDUNGSSTATUS
// ============================================================

function setConnectionStatus(
  connected
) {

  if (connected) {

    connectionText.textContent =
      "ONLINE";

    connectionDot.style.background =
      "#45ff9a";

    connectionDot.style.color =
      "#45ff9a";

  } else {

    connectionText.textContent =
      "VERBINDE...";

    connectionDot.style.background =
      "#ffbf3c";

    connectionDot.style.color =
      "#ffbf3c";
  }
}


// ============================================================
// SERVER-NACHRICHTEN
// ============================================================

function handleServerMessage(
  rawMessage
) {

  try {

    const message =
      JSON.parse(rawMessage);

    if (
      !message ||
      typeof message.type !==
        "string"
    ) {
      return;
    }


    if (
      message.type === "welcome"
    ) {

      myId =
        message.playerId;

      if (message.world) {

        world =
          message.world;
      }

      return;
    }


    if (
      message.type === "state"
    ) {

      if (message.world) {

        world =
          message.world;
      }

      const newPlayers =
        Array.isArray(
          message.players
        )
          ? message.players
          : [];

      detectPlayerChanges(
        newPlayers
      );

      players =
        newPlayers;

      playerCount.textContent =
        String(
          players.length
        );

      updatePlayerList();
    }

  } catch {

    // Ungültige Nachricht
  }
}


// ============================================================
// JOIN / LEAVE ERKENNEN
// ============================================================

let receivedFirstState = false;

function detectPlayerChanges(
  newPlayers
) {

  const newMap =
    new Map();

  for (
    const player
    of newPlayers
  ) {

    newMap.set(
      player.id,
      player
    );
  }


  if (receivedFirstState) {

    for (
      const player
      of newPlayers
    ) {

      if (
        !previousPlayers.has(
          player.id
        ) &&
        player.id !== myId
      ) {

        showNotification(
          `${player.name || "Spieler"} ist beigetreten`,
          "join"
        );
      }
    }


    for (
      const [
        id,
        player
      ]
      of previousPlayers
    ) {

      if (
        !newMap.has(id) &&
        id !== myId
      ) {

        showNotification(
          `${player.name || "Spieler"} hat das Spiel verlassen`,
          "leave"
        );
      }
    }
  }


  previousPlayers =
    newMap;

  receivedFirstState =
    true;
}


// ============================================================
// MELDUNGEN
// ============================================================

function showNotification(
  text,
  type
) {

  const element =
    document.createElement(
      "div"
    );

  element.className =
    `notification ${type}`;

  element.textContent =
    text;

  notifications.appendChild(
    element
  );


  setTimeout(
    () => {

      element.style.opacity =
        "0";

      element.style.transform =
        "translateY(-8px)";

      element.style.transition =
        "0.3s";

    },
    2800
  );


  setTimeout(
    () => {

      element.remove();

    },
    3200
  );
}


// ============================================================
// SPIELERLISTE
// ============================================================

function updatePlayerList() {

  playerList.innerHTML =
    "";

  const sorted =
    [...players].sort(
      (a, b) => {

        if (a.id === myId) {
          return -1;
        }

        if (b.id === myId) {
          return 1;
        }

        return (
          (a.name || "")
            .localeCompare(
              b.name || ""
            )
        );
      }
    );


  for (
    const player
    of sorted
  ) {

    const item =
      document.createElement(
        "div"
      );

    item.className =
      "playerListItem";


    const dot =
      document.createElement(
        "span"
      );

    dot.className =
      "playerListDot";

    const color =
      getPlayerColor(player);

    dot.style.background =
      color;

    dot.style.color =
      color;


    const name =
      document.createElement(
        "span"
      );

    name.className =
      "playerListName";

    if (
      player.id === myId
    ) {

      name.classList.add(
        "playerListMe"
      );

      name.textContent =
        `${player.name || "Spieler"} (Du)`;

    } else {

      name.textContent =
        player.name ||
        "Spieler";
    }


    item.appendChild(dot);
    item.appendChild(name);

    playerList.appendChild(
      item
    );
  }
}


// ============================================================
// NAME SENDEN
// ============================================================

function sendName() {

  const name =
    nameInput.value
      .trim()
      .slice(0, 20);


  if (name) {

    localStorage.setItem(
      "duckymaps-name",
      name
    );
  }


  if (
    !socket ||
    socket.readyState !==
      WebSocket.OPEN
  ) {

    return;
  }


  socket.send(
    JSON.stringify({
      type: "setName",
      name
    })
  );
}


nameButton.addEventListener(
  "click",
  () => {

    sendName();

    nameInput.blur();
  }
);


nameInput.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter"
    ) {

      sendName();

      nameInput.blur();
    }
  }
);


// ============================================================
// TASTATUR
// ============================================================

window.addEventListener(
  "keydown",
  (event) => {

    if (
      document.activeElement ===
      nameInput
    ) {
      return;
    }

    const key =
      event.key.toLowerCase();

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
        "d"
      ].includes(key)
    ) {

      event.preventDefault();
    }
  }
);


window.addEventListener(
  "keyup",
  (event) => {

    keys.delete(
      event.key.toLowerCase()
    );
  }
);


window.addEventListener(
  "blur",
  () => {

    keys.clear();

    input.x = 0;
    input.y = 0;
  }
);


// ============================================================
// EINGABE BERECHNEN
// ============================================================

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


  if (joystick.active) {

    x = joystick.x;
    y = joystick.y;
  }


  const length =
    Math.hypot(x, y);


  if (length > 1) {

    x /= length;
    y /= length;
  }


  input.x = x;
  input.y = y;
}


// ============================================================
// INPUT SENDEN
// ============================================================

function sendInput() {

  updateInput();


  if (
    !socket ||
    socket.readyState !==
      WebSocket.OPEN
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


setInterval(
  sendInput,
  50
);


// ============================================================
// SPIELER
// ============================================================

function getMyPlayer() {

  return players.find(
    player =>
      player.id === myId
  );
}


// ============================================================
// KAMERA
// ============================================================

function updateCamera() {

  const me =
    getMyPlayer();


  if (!me) {
    return;
  }


  camera.x +=
    (me.x - camera.x) *
    0.12;

  camera.y +=
    (me.y - camera.y) *
    0.12;
}


function worldToScreen(
  x,
  y
) {

  return {

    x:
      x -
      camera.x +
      width / 2,

    y:
      y -
      camera.y +
      height / 2
  };
}


// ============================================================
// HINTERGRUND
// ============================================================

function drawBackground() {

  ctx.fillStyle =
    "#050711";

  ctx.fillRect(
    0,
    0,
    width,
    height
  );


  const gridSize = 80;

  const offsetX =
    (
      (
        -camera.x +
        width / 2
      ) %
        gridSize +
      gridSize
    ) %
    gridSize;

  const offsetY =
    (
      (
        -camera.y +
        height / 2
      ) %
        gridSize +
      gridSize
    ) %
    gridSize;


  ctx.strokeStyle =
    "rgba(70,150,255,0.065)";

  ctx.lineWidth = 1;


  for (
    let x = offsetX;
    x < width;
    x += gridSize
  ) {

    ctx.beginPath();

    ctx.moveTo(
      x,
      0
    );

    ctx.lineTo(
      x,
      height
    );

    ctx.stroke();
  }


  for (
    let y = offsetY;
    y < height;
    y += gridSize
  ) {

    ctx.beginPath();

    ctx.moveTo(
      0,
      y
    );

    ctx.lineTo(
      width,
      y
    );

    ctx.stroke();
  }


  const glow =
    ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,

      width / 2,
      height / 2,

      Math.max(
        width,
        height
      ) * 0.7
    );


  glow.addColorStop(
    0,
    "rgba(0,190,255,0.08)"
  );

  glow.addColorStop(
    1,
    "rgba(0,0,0,0)"
  );


  ctx.fillStyle =
    glow;

  ctx.fillRect(
    0,
    0,
    width,
    height
  );
}


// ============================================================
// DEKORATION DER MAP
// ============================================================

function drawMapDecorations() {

  const objects = [
    {
      x: 350,
      y: 300,
      radius: 110,
      color:
        "rgba(0,120,255,0.08)"
    },

    {
      x: 1900,
      y: 400,
      radius: 160,
      color:
        "rgba(130,60,255,0.07)"
    },

    {
      x: 1200,
      y: 1050,
      radius: 180,
      color:
        "rgba(0,255,170,0.055)"
    }
  ];


  for (
    const object
    of objects
  ) {

    const pos =
      worldToScreen(
        object.x,
        object.y
      );


    ctx.beginPath();

    ctx.arc(
      pos.x,
      pos.y,
      object.radius,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      object.color;

    ctx.fill();
  }


  drawRoad(
    0,
    world.height / 2 - 45,
    world.width,
    90
  );


  drawRoad(
    world.width / 2 - 45,
    0,
    90,
    world.height
  );
}


function drawRoad(
  x,
  y,
  roadWidth,
  roadHeight
) {

  const pos =
    worldToScreen(
      x,
      y
    );


  ctx.fillStyle =
    "rgba(35,45,70,0.40)";

  ctx.fillRect(
    pos.x,
    pos.y,
    roadWidth,
    roadHeight
  );
}


// ============================================================
// WELTGRENZE
// ============================================================

function drawWorldBorder() {

  const topLeft =
    worldToScreen(
      0,
      0
    );


  ctx.save();


  ctx.strokeStyle =
    "#238cff";

  ctx.lineWidth = 3;

  ctx.shadowBlur = 18;

  ctx.shadowColor =
    "#238cff";


  ctx.strokeRect(
    topLeft.x,
    topLeft.y,
    world.width,
    world.height
  );


  ctx.restore();
}


// ============================================================
// SPIELER ZEICHNEN
// ============================================================

function drawPlayer(
  player
) {

  const screen =
    worldToScreen(
      player.x,
      player.y
    );


  const local =
    player.id === myId;


  const radius =
    local
      ? 23
      : 20;


  const color =
    getPlayerColor(
      player
    );


  ctx.save();


  ctx.translate(
    screen.x,
    screen.y
  );


  // Schatten
  ctx.beginPath();

  ctx.ellipse(
    0,
    radius + 8,
    radius * 0.9,
    radius * 0.34,
    0,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    "rgba(0,0,0,0.30)";

  ctx.fill();


  // Glow
  ctx.shadowBlur =
    local
      ? 32
      : 20;

  ctx.shadowColor =
    color;


  // Körper
  const gradient =
    ctx.createRadialGradient(
      -7,
      -8,
      2,
      0,
      0,
      radius
    );


  gradient.addColorStop(
    0,
    "#ffffff"
  );

  gradient.addColorStop(
    0.18,
    color
  );

  gradient.addColorStop(
    1,
    color
  );


  ctx.fillStyle =
    gradient;


  ctx.beginPath();

  ctx.arc(
    0,
    0,
    radius,
    0,
    Math.PI * 2
  );

  ctx.fill();


  ctx.shadowBlur = 0;


  // Innenring
  ctx.strokeStyle =
    local
      ? "rgba(255,255,255,0.8)"
      : "rgba(255,255,255,0.28)";

  ctx.lineWidth =
    local
      ? 2
      : 1;


  ctx.beginPath();

  ctx.arc(
    0,
    0,
    radius - 3,
    0,
    Math.PI * 2
  );

  ctx.stroke();


  // Name
  ctx.font =
    local
      ? "800 14px system-ui"
      : "700 13px system-ui";

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "bottom";


  // Text-Schatten
  ctx.strokeStyle =
    "rgba(0,0,0,0.75)";

  ctx.lineWidth = 4;


  ctx.strokeText(
    player.name ||
      "Spieler",
    0,
    -31
  );


  ctx.fillStyle =
    local
      ? "#6eefff"
      : "#ffffff";


  ctx.fillText(
    player.name ||
      "Spieler",
    0,
    -31
  );


  if (local) {

    ctx.font =
      "700 9px system-ui";

    ctx.fillStyle =
      "rgba(255,255,255,0.60)";

    ctx.fillText(
      "DU",
      0,
      -48
    );
  }


  ctx.restore();
}


// ============================================================
// MINIMAP
// ============================================================

function drawMinimap() {

  const w =
    minimap.width;

  const h =
    minimap.height;


  minimapCtx.clearRect(
    0,
    0,
    w,
    h
  );


  minimapCtx.fillStyle =
    "#070d1c";

  minimapCtx.fillRect(
    0,
    0,
    w,
    h
  );


  // Straßen
  minimapCtx.fillStyle =
    "rgba(60,75,110,0.55)";


  minimapCtx.fillRect(
    0,
    h / 2 - 4,
    w,
    8
  );


  minimapCtx.fillRect(
    w / 2 - 4,
    0,
    8,
    h
  );


  // Rand
  minimapCtx.strokeStyle =
    "rgba(50,170,255,0.8)";

  minimapCtx.lineWidth =
    2;

  minimapCtx.strokeRect(
    1,
    1,
    w - 2,
    h - 2
  );


  // Spieler
  for (
    const player
    of players
  ) {

    const x =
      player.x /
      world.width *
      w;

    const y =
      player.y /
      world.height *
      h;


    minimapCtx.beginPath();

    minimapCtx.arc(
      x,
      y,
      player.id === myId
        ? 4
        : 3,
      0,
      Math.PI * 2
    );


    minimapCtx.fillStyle =
      getPlayerColor(
        player
      );

    minimapCtx.fill();
  }
}


// ============================================================
// JOYSTICK
// ============================================================

function updateJoystick(
  clientX,
  clientY
) {

  const rect =
    joystickElement
      .getBoundingClientRect();


  const centerX =
    rect.left +
    rect.width / 2;


  const centerY =
    rect.top +
    rect.height / 2;


  let dx =
    clientX -
    centerX;


  let dy =
    clientY -
    centerY;


  const max =
    rect.width / 2 -
    30;


  const length =
    Math.hypot(
      dx,
      dy
    );


  if (
    length > max
  ) {

    dx =
      dx /
      length *
      max;

    dy =
      dy /
      length *
      max;
  }


  joystick.x =
    dx / max;

  joystick.y =
    dy / max;


  stickElement.style.transform =
    `translate(${dx}px, ${dy}px)`;
}


function resetJoystick() {

  joystick.active =
    false;

  joystick.pointerId =
    null;

  joystick.x = 0;
  joystick.y = 0;


  stickElement.style.transform =
    "translate(0, 0)";
}


joystickElement.addEventListener(
  "pointerdown",
  event => {

    joystick.active =
      true;

    joystick.pointerId =
      event.pointerId;


    joystickElement
      .setPointerCapture(
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
  event => {

    if (
      !joystick.active
    ) {
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


// ============================================================
// RENDER
// ============================================================

function render() {

  updateCamera();

  drawBackground();

  drawMapDecorations();

  drawWorldBorder();


  for (
    const player
    of players
  ) {

    drawPlayer(
      player
    );
  }


  drawMinimap();
}


function animationLoop() {

  render();

  requestAnimationFrame(
    animationLoop
  );
}


// ============================================================
// START
// ============================================================

setConnectionStatus(false);

connect();

animationLoop();
