"use strict";


// ============================================================
// DUCKY MAPS V3
// CLIENT
// ============================================================


const canvas =
  document.getElementById("gameCanvas");

const ctx =
  canvas.getContext("2d");


const minimapCanvas =
  document.getElementById("minimapCanvas");

const minimapCtx =
  minimapCanvas.getContext("2d");


// ============================================================
// MENÜ ELEMENTE
// ============================================================

const introScreen =
  document.getElementById("introScreen");

const mainMenu =
  document.getElementById("mainMenu");

const mapsMenu =
  document.getElementById("mapsMenu");

const settingsMenu =
  document.getElementById("settingsMenu");

const mapIntro =
  document.getElementById("mapIntro");

const pauseMenu =
  document.getElementById("pauseMenu");

const gameHud =
  document.getElementById("gameHud");


const playButton =
  document.getElementById("playButton");

const mapsButton =
  document.getElementById("mapsButton");

const settingsButton =
  document.getElementById("settingsButton");

const settingsBackButton =
  document.getElementById("settingsBackButton");

const saveSettingsButton =
  document.getElementById("saveSettingsButton");

const pauseButton =
  document.getElementById("pauseButton");

const continueButton =
  document.getElementById("continueButton");

const pauseSettingsButton =
  document.getElementById("pauseSettingsButton");

const exitButton =
  document.getElementById("exitButton");


const selectedMapLabel =
  document.getElementById("selectedMapLabel");

const hudMapName =
  document.getElementById("hudMapName");

const mapIntroTitle =
  document.getElementById("mapIntroTitle");

const mapIntroPlayers =
  document.getElementById("mapIntroPlayers");

const menuPlayerCount =
  document.getElementById("menuPlayerCount");

const hudPlayerCount =
  document.getElementById("hudPlayerCount");


const playerList =
  document.getElementById("playerList");

const notifications =
  document.getElementById("notifications");


// ============================================================
// SETTINGS
// ============================================================

const settingsNameInput =
  document.getElementById("settingsNameInput");

const musicEnabled =
  document.getElementById("musicEnabled");

const musicStyle =
  document.getElementById("musicStyle");

const musicVolume =
  document.getElementById("musicVolume");

const musicVolumeValue =
  document.getElementById("musicVolumeValue");

const sfxEnabled =
  document.getElementById("sfxEnabled");

const sfxVolume =
  document.getElementById("sfxVolume");

const sfxVolumeValue =
  document.getElementById("sfxVolumeValue");


// ============================================================
// JOYSTICK
// ============================================================

const joystickElement =
  document.getElementById("joystick");

const joystickStick =
  document.getElementById("joystickStick");


// ============================================================
// STATE
// ============================================================

let width = 0;
let height = 0;
let dpr = 1;

let socket = null;
let reconnectTimer = null;

let myId = null;

let players = [];

let previousPlayers =
  new Map();

let receivedFirstState =
  false;

let gameRunning =
  false;

let paused =
  false;

let settingsOpenedFromPause =
  false;


let world = {
  width: 2400,
  height: 1400
};


const camera = {
  x: world.width / 2,
  y: world.height / 2
};


const input = {
  x: 0,
  y: 0
};


const keys =
  new Set();


const joystick = {
  active: false,
  pointerId: null,
  x: 0,
  y: 0
};


// ============================================================
// MAPS
// ============================================================

const maps = {

  industry: {
    title: "INDUSTRIE",
    menuName: "Industrie",

    background: "#bbb9b2",
    floor: "#aaa8a2",
    road: "#4b4d50",
    wall: "#5a5b5e",
    accent: "#d3d0c9"
  },

  harbor: {
    title: "HAFEN",
    menuName: "Hafen",

    background: "#7e9298",
    floor: "#8f9998",
    road: "#41474a",
    wall: "#5a6264",
    accent: "#39748b"
  },

  labs: {
    title: "LABS",
    menuName: "Labs",

    background: "#d6d9dc",
    floor: "#c7cbce",
    road: "#858b90",
    wall: "#707980",
    accent: "#6f5caa"
  }

};


let selectedMap =
  localStorage.getItem(
    "duckymaps-map"
  ) || "industry";


if (!maps[selectedMap]) {
  selectedMap = "industry";
}


// ============================================================
// SETTINGS DATA
// ============================================================

const defaultSettings = {

  name: "Spieler",

  musicEnabled: true,

  musicStyle: "ambient",

  musicVolume: 35,

  sfxEnabled: true,

  sfxVolume: 65

};


let settings =
  loadSettings();


// ============================================================
// AUDIO
// ============================================================

let audioContext = null;

let musicGain = null;

let musicNodes = [];


// ============================================================
// RESIZE
// ============================================================

function resizeCanvas() {

  dpr =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );


  width =
    window.innerWidth;

  height =
    window.innerHeight;


  canvas.width =
    Math.floor(
      width * dpr
    );

  canvas.height =
    Math.floor(
      height * dpr
    );


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
  resizeCanvas
);


resizeCanvas();


// ============================================================
// SETTINGS LADEN
// ============================================================

function loadSettings() {

  try {

    const saved =
      JSON.parse(
        localStorage.getItem(
          "duckymaps-settings"
        )
      );


    return {
      ...defaultSettings,
      ...(saved || {})
    };

  } catch {

    return {
      ...defaultSettings
    };
  }
}


function saveSettings() {

  settings.name =
    settingsNameInput.value
      .trim()
      .slice(0, 20)
      ||
      "Spieler";


  settings.musicEnabled =
    musicEnabled.checked;


  settings.musicStyle =
    musicStyle.value;


  settings.musicVolume =
    Number(
      musicVolume.value
    );


  settings.sfxEnabled =
    sfxEnabled.checked;


  settings.sfxVolume =
    Number(
      sfxVolume.value
    );


  localStorage.setItem(
    "duckymaps-settings",
    JSON.stringify(settings)
  );


  sendName();


  applyMusicSettings();


  playUiSound();


  if (
    settingsOpenedFromPause
  ) {

    settingsMenu.classList.add(
      "hidden"
    );

    pauseMenu.classList.remove(
      "hidden"
    );

  } else {

    settingsMenu.classList.add(
      "hidden"
    );

    mainMenu.classList.remove(
      "hidden"
    );
  }
}


// ============================================================
// SETTINGS UI
// ============================================================

function updateSettingsUI() {

  settingsNameInput.value =
    settings.name;


  musicEnabled.checked =
    settings.musicEnabled;


  musicStyle.value =
    settings.musicStyle;


  musicVolume.value =
    settings.musicVolume;


  musicVolumeValue.textContent =
    `${settings.musicVolume}%`;


  sfxEnabled.checked =
    settings.sfxEnabled;


  sfxVolume.value =
    settings.sfxVolume;


  sfxVolumeValue.textContent =
    `${settings.sfxVolume}%`;
}


musicVolume.addEventListener(
  "input",
  () => {

    musicVolumeValue.textContent =
      `${musicVolume.value}%`;

    settings.musicVolume =
      Number(
        musicVolume.value
      );

    applyMusicSettings();
  }
);


sfxVolume.addEventListener(
  "input",
  () => {

    sfxVolumeValue.textContent =
      `${sfxVolume.value}%`;
  }
);


musicEnabled.addEventListener(
  "change",
  () => {

    settings.musicEnabled =
      musicEnabled.checked;

    applyMusicSettings();
  }
);


musicStyle.addEventListener(
  "change",
  () => {

    settings.musicStyle =
      musicStyle.value;

    restartMusic();
  }
);


updateSettingsUI();


// ============================================================
// AUDIO ENGINE
// ============================================================

function ensureAudio() {

  if (audioContext) {
    return;
  }


  const AudioContext =
    window.AudioContext ||
    window.webkitAudioContext;


  if (!AudioContext) {
    return;
  }


  audioContext =
    new AudioContext();


  musicGain =
    audioContext.createGain();


  musicGain.connect(
    audioContext.destination
  );


  startMusic();
}


function startMusic() {

  if (!audioContext) {
    return;
  }


  stopMusic();


  const style =
    settings.musicStyle;


  const frequencies =
    style === "pulse"
      ? [82, 123, 164]
      : style === "minimal"
      ? [110, 165]
      : [73, 110, 146];


  frequencies.forEach(
    (frequency, index) => {

      const osc =
        audioContext.createOscillator();

      const gain =
        audioContext.createGain();


      osc.type =
        style === "pulse"
          ? "triangle"
          : "sine";


      osc.frequency.value =
        frequency;


      gain.gain.value =
        0.018 /
        (index + 1);


      osc.connect(gain);

      gain.connect(musicGain);


      osc.start();


      musicNodes.push({
        osc,
        gain
      });
    }
  );


  applyMusicSettings();
}


function stopMusic() {

  for (
    const node
    of musicNodes
  ) {

    try {
      node.osc.stop();
    } catch {}
  }


  musicNodes = [];
}


function restartMusic() {

  if (!audioContext) {
    return;
  }


  startMusic();
}


function applyMusicSettings() {

  if (!musicGain) {
    return;
  }


  const enabled =
    musicEnabled.checked;


  const volume =
    Number(
      musicVolume.value
    ) / 100;


  musicGain.gain.setTargetAtTime(
    enabled
      ? volume * 0.35
      : 0,

    audioContext.currentTime,

    0.15
  );
}


function playUiSound() {

  if (
    !settings.sfxEnabled
  ) {
    return;
  }


  ensureAudio();


  if (!audioContext) {
    return;
  }


  const osc =
    audioContext.createOscillator();


  const gain =
    audioContext.createGain();


  osc.type =
    "sine";


  osc.frequency.setValueAtTime(
    360,
    audioContext.currentTime
  );


  osc.frequency.exponentialRampToValueAtTime(
    520,
    audioContext.currentTime +
      0.07
  );


  gain.gain.setValueAtTime(
    settings.sfxVolume /
      100 *
      0.06,

    audioContext.currentTime
  );


  gain.gain.exponentialRampToValueAtTime(
    0.001,

    audioContext.currentTime +
      0.10
  );


  osc.connect(gain);

  gain.connect(
    audioContext.destination
  );


  osc.start();

  osc.stop(
    audioContext.currentTime +
      0.11
  );
}


// ============================================================
// INTRO
// ============================================================

setTimeout(
  () => {

    introScreen.classList.add(
      "fadeOut"
    );

    setTimeout(
      () => {

        introScreen.classList.add(
          "hidden"
        );

      },
      700
    );

  },
  1500
);


// ============================================================
// MENÜ NAVIGATION
// ============================================================

playButton.addEventListener(
  "click",
  () => {

    ensureAudio();

    playUiSound();

    startGame();
  }
);


mapsButton.addEventListener(
  "click",
  () => {

    playUiSound();

    mainMenu.classList.add(
      "hidden"
    );

    mapsMenu.classList.remove(
      "hidden"
    );
  }
);


settingsButton.addEventListener(
  "click",
  () => {

    openSettings(false);
  }
);


document
  .querySelector(
    '[data-close-screen="maps"]'
  )
  .addEventListener(
    "click",
    () => {

      playUiSound();

      mapsMenu.classList.add(
        "hidden"
      );

      mainMenu.classList.remove(
        "hidden"
      );
    }
  );


settingsBackButton.addEventListener(
  "click",
  () => {

    playUiSound();


    settingsMenu.classList.add(
      "hidden"
    );


    if (
      settingsOpenedFromPause
    ) {

      pauseMenu.classList.remove(
        "hidden"
      );

    } else {

      mainMenu.classList.remove(
        "hidden"
      );
    }
  }
);


saveSettingsButton.addEventListener(
  "click",
  saveSettings
);


// ============================================================
// MAP AUSWAHL
// ============================================================

function updateMapSelectionUI() {

  document
    .querySelectorAll(
      ".mapCard"
    )
    .forEach(
      card => {

        card.classList.toggle(
          "selected",
          card.dataset.map ===
            selectedMap
        );
      }
    );


  selectedMapLabel.textContent =
    maps[selectedMap].menuName;


  hudMapName.textContent =
    maps[selectedMap].title;
}


document
  .querySelectorAll(
    ".mapCard"
  )
  .forEach(
    card => {

      card.addEventListener(
        "click",
        () => {

          selectedMap =
            card.dataset.map;


          localStorage.setItem(
            "duckymaps-map",
            selectedMap
          );


          updateMapSelectionUI();


          playUiSound();
        }
      );
    }
  );


updateMapSelectionUI();


// ============================================================
// SETTINGS ÖFFNEN
// ============================================================

function openSettings(
  fromPause
) {

  playUiSound();


  settingsOpenedFromPause =
    fromPause;


  updateSettingsUI();


  mainMenu.classList.add(
    "hidden"
  );


  pauseMenu.classList.add(
    "hidden"
  );


  settingsMenu.classList.remove(
    "hidden"
  );
}


// ============================================================
// GAME START
// ============================================================

function startGame() {

  gameRunning =
    true;


  paused =
    false;


  mainMenu.classList.add(
    "hidden"
  );


  mapsMenu.classList.add(
    "hidden"
  );


  settingsMenu.classList.add(
    "hidden"
  );


  mapIntroTitle.textContent =
    maps[selectedMap].title;


  mapIntroPlayers.textContent =
    `${players.length || 1} SPIELER ONLINE`;


  mapIntro.classList.remove(
    "hidden"
  );


  setTimeout(
    () => {

      mapIntro.classList.add(
        "hidden"
      );


      gameHud.classList.remove(
        "hidden"
      );

    },
    1300
  );


  sendName();
}


// ============================================================
// PAUSE
// ============================================================

pauseButton.addEventListener(
  "click",
  () => {

    paused = true;

    playUiSound();

    pauseMenu.classList.remove(
      "hidden"
    );
  }
);


continueButton.addEventListener(
  "click",
  () => {

    paused = false;

    playUiSound();

    pauseMenu.classList.add(
      "hidden"
    );
  }
);


pauseSettingsButton.addEventListener(
  "click",
  () => {

    openSettings(true);
  }
);


exitButton.addEventListener(
  "click",
  () => {

    gameRunning =
      false;

    paused =
      false;


    keys.clear();


    input.x = 0;
    input.y = 0;


    playUiSound();


    pauseMenu.classList.add(
      "hidden"
    );


    gameHud.classList.add(
      "hidden"
    );


    mainMenu.classList.remove(
      "hidden"
    );
  }
);


// ============================================================
// WEBSOCKET
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

      sendName();
    }
  );


  socket.addEventListener(
    "message",
    event => {

      handleServerMessage(
        event.data
      );
    }
  );


  socket.addEventListener(
    "close",
    () => {

      reconnectTimer =
        setTimeout(
          connect,
          1500
        );
    }
  );
}


// ============================================================
// SERVER MESSAGE
// ============================================================

function handleServerMessage(
  raw
) {

  try {

    const message =
      JSON.parse(raw);


    if (
      message.type === "welcome"
    ) {

      myId =
        message.playerId;


      if (message.world) {
        world =
          message.world;
      }


      sendName();

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


      updatePlayerUI();
    }

  } catch {}
}


// ============================================================
// NAME
// ============================================================

function sendName() {

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
      name:
        settings.name ||
        "Spieler"
    })
  );
}


// ============================================================
// JOIN / LEAVE
// ============================================================

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


  if (
    receivedFirstState &&
    gameRunning
  ) {

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
          `${player.name || "Spieler"} ist beigetreten`
        );
      }
    }


    for (
      const [id, player]
      of previousPlayers
    ) {

      if (
        !newMap.has(id) &&
        id !== myId
      ) {

        showNotification(
          `${player.name || "Spieler"} hat das Spiel verlassen`
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
// SPIELER UI
// ============================================================

function updatePlayerUI() {

  const count =
    players.length;


  menuPlayerCount.textContent =
    `${count} ${
      count === 1
        ? "SPIELER"
        : "SPIELER"
    } ONLINE`;


  hudPlayerCount.textContent =
    `${count} ${
      count === 1
        ? "SPIELER"
        : "SPIELER"
    }`;


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


    dot.style.background =
      player.id === myId
        ? "#e6333c"
        : "#65d898";


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
        `${player.name} (Du)`;

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
// NOTIFICATION
// ============================================================

function showNotification(
  text
) {

  const element =
    document.createElement(
      "div"
    );


  element.className =
    "notification";


  element.textContent =
    text;


  notifications.appendChild(
    element
  );


  setTimeout(
    () => {

      element.remove();

    },
    2800
  );
}


// ============================================================
// INPUT
// ============================================================

window.addEventListener(
  "keydown",
  event => {

    if (
      document.activeElement ===
      settingsNameInput
    ) {
      return;
    }


    if (
      event.key === "Escape" &&
      gameRunning
    ) {

      if (
        pauseMenu.classList.contains(
          "hidden"
        )
      ) {

        paused = true;

        pauseMenu.classList.remove(
          "hidden"
        );

      } else {

        paused = false;

        pauseMenu.classList.add(
          "hidden"
        );
      }

      return;
    }


    keys.add(
      event.key.toLowerCase()
    );
  }
);


window.addEventListener(
  "keyup",
  event => {

    keys.delete(
      event.key.toLowerCase()
    );
  }
);


function calculateInput() {

  if (
    !gameRunning ||
    paused
  ) {

    input.x = 0;
    input.y = 0;

    return;
  }


  let x = 0;
  let y = 0;


  if (
    keys.has("a") ||
    keys.has("arrowleft")
  ) {
    x--;
  }


  if (
    keys.has("d") ||
    keys.has("arrowright")
  ) {
    x++;
  }


  if (
    keys.has("w") ||
    keys.has("arrowup")
  ) {
    y--;
  }


  if (
    keys.has("s") ||
    keys.has("arrowdown")
  ) {
    y++;
  }


  if (
    joystick.active
  ) {

    x = joystick.x;
    y = joystick.y;
  }


  const length =
    Math.hypot(x, y);


  if (
    length > 1
  ) {

    x /= length;
    y /= length;
  }


  input.x = x;
  input.y = y;
}


// ============================================================
// SEND INPUT
// ============================================================

function sendInput() {

  calculateInput();


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
// JOYSTICK
// ============================================================

function updateJoystick(
  clientX,
  clientY
) {

  const rect =
    joystickElement
      .getBoundingClientRect();


  const cx =
    rect.left +
    rect.width / 2;


  const cy =
    rect.top +
    rect.height / 2;


  let dx =
    clientX - cx;


  let dy =
    clientY - cy;


  const max =
    rect.width / 2 -
    26;


  const length =
    Math.hypot(
      dx,
      dy
    );


  if (
    length > max
  ) {

    dx =
      dx / length * max;

    dy =
      dy / length * max;
  }


  joystick.x =
    dx / max;


  joystick.y =
    dy / max;


  joystickStick.style.transform =
    `translate(${dx}px, ${dy}px)`;
}


function resetJoystick() {

  joystick.active =
    false;


  joystick.pointerId =
    null;


  joystick.x = 0;
  joystick.y = 0;


  joystickStick.style.transform =
    "translate(0,0)";
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


// ============================================================
// GAME HELPERS
// ============================================================

function getMyPlayer() {

  return players.find(
    player =>
      player.id === myId
  );
}


function updateCamera() {

  const me =
    getMyPlayer();


  if (!me) {
    return;
  }


  camera.x +=
    (me.x - camera.x)
    * 0.13;


  camera.y +=
    (me.y - camera.y)
    * 0.13;
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
// MAP DRAWING
// ============================================================

function drawMap() {

  const map =
    maps[selectedMap];


  ctx.fillStyle =
    map.background;


  ctx.fillRect(
    0,
    0,
    width,
    height
  );


  drawWorldFloor(
    map
  );


  if (
    selectedMap ===
    "industry"
  ) {

    drawIndustryMap(map);
  }


  if (
    selectedMap ===
    "harbor"
  ) {

    drawHarborMap(map);
  }


  if (
    selectedMap ===
    "labs"
  ) {

    drawLabsMap(map);
  }


  drawWorldBorder();
}


// ============================================================
// FLOOR
// ============================================================

function drawWorldFloor(
  map
) {

  const topLeft =
    worldToScreen(
      0,
      0
    );


  ctx.fillStyle =
    map.floor;


  ctx.fillRect(
    topLeft.x,
    topLeft.y,
    world.width,
    world.height
  );


  const grid = 80;


  ctx.strokeStyle =
    "rgba(0,0,0,.045)";


  ctx.lineWidth = 1;


  for (
    let x = 0;
    x <= world.width;
    x += grid
  ) {

    const p =
      worldToScreen(
        x,
        0
      );


    ctx.beginPath();

    ctx.moveTo(
      p.x,
      topLeft.y
    );

    ctx.lineTo(
      p.x,
      topLeft.y +
      world.height
    );

    ctx.stroke();
  }


  for (
    let y = 0;
    y <= world.height;
    y += grid
  ) {

    const p =
      worldToScreen(
        0,
        y
      );


    ctx.beginPath();

    ctx.moveTo(
      topLeft.x,
      p.y
    );

    ctx.lineTo(
      topLeft.x +
      world.width,
      p.y
    );

    ctx.stroke();
  }
}


// ============================================================
// INDUSTRY
// ============================================================

function drawIndustryMap(
  map
) {

  drawRoad(
    0,
    610,
    2400,
    170,
    map.road
  );


  drawRoad(
    1070,
    0,
    170,
    1400,
    map.road
  );


  drawBuilding(
    180,
    150,
    650,
    350,
    "#77756f"
  );


  drawBuilding(
    1450,
    170,
    620,
    390,
    "#85827b"
  );


  drawBuilding(
    250,
    900,
    660,
    300,
    "#74736f"
  );


  drawBuilding(
    1440,
    900,
    650,
    310,
    "#85827d"
  );


  drawCrates(
    930,
    240
  );


  drawCrates(
    1270,
    980
  );
}


// ============================================================
// HARBOR
// ============================================================

function drawHarborMap(
  map
) {

  const water =
    worldToScreen(
      1600,
      0
    );


  ctx.fillStyle =
    "#39768c";


  ctx.fillRect(
    water.x,
    water.y,
    800,
    1400
  );


  drawRoad(
    0,
    560,
    1600,
    170,
    map.road
  );


  drawBuilding(
    180,
    180,
    550,
    270,
    "#687275"
  );


  drawBuilding(
    830,
    860,
    560,
    320,
    "#646c6f"
  );


  drawContainer(
    250,
    820,
    "#c83d42"
  );


  drawContainer(
    480,
    920,
    "#c88233"
  );


  drawContainer(
    850,
    270,
    "#3d6f9a"
  );


  drawContainer(
    1090,
    350,
    "#8e8435"
  );
}


// ============================================================
// LABS
// ============================================================

function drawLabsMap(
  map
) {

  drawRoad(
    0,
    625,
    2400,
    120,
    "#92989c"
  );


  drawRoad(
    1140,
    0,
    120,
    1400,
    "#92989c"
  );


  drawBuilding(
    180,
    160,
    780,
    370,
    "#e5e7e8"
  );


  drawBuilding(
    1450,
    150,
    720,
    420,
    "#e5e7e8"
  );


  drawBuilding(
    250,
    870,
    720,
    330,
    "#e5e7e8"
  );


  drawBuilding(
    1450,
    875,
    710,
    320,
    "#e5e7e8"
  );


  const center =
    worldToScreen(
      1200,
      700
    );


  ctx.fillStyle =
    "#6f5caa";


  ctx.beginPath();

  ctx.arc(
    center.x,
    center.y,
    70,
    0,
    Math.PI * 2
  );

  ctx.fill();
}


// ============================================================
// MAP OBJECTS
// ============================================================

function drawRoad(
  x,
  y,
  w,
  h,
  color
) {

  const p =
    worldToScreen(
      x,
      y
    );


  ctx.fillStyle =
    color;


  ctx.fillRect(
    p.x,
    p.y,
    w,
    h
  );


  ctx.strokeStyle =
    "rgba(255,255,255,.2)";


  ctx.lineWidth = 2;


  ctx.setLineDash(
    [20, 22]
  );


  ctx.beginPath();


  if (w > h) {

    ctx.moveTo(
      p.x,
      p.y +
      h / 2
    );

    ctx.lineTo(
      p.x + w,
      p.y + h / 2
    );

  } else {

    ctx.moveTo(
      p.x + w / 2,
      p.y
    );

    ctx.lineTo(
      p.x + w / 2,
      p.y + h
    );
  }


  ctx.stroke();


  ctx.setLineDash([]);
}


function drawBuilding(
  x,
  y,
  w,
  h,
  color
) {

  const p =
    worldToScreen(
      x,
      y
    );


  ctx.fillStyle =
    "rgba(0,0,0,.18)";


  ctx.fillRect(
    p.x + 13,
    p.y + 16,
    w,
    h
  );


  ctx.fillStyle =
    color;


  ctx.fillRect(
    p.x,
    p.y,
    w,
    h
  );


  ctx.strokeStyle =
    "rgba(0,0,0,.25)";


  ctx.lineWidth = 8;


  ctx.strokeRect(
    p.x,
    p.y,
    w,
    h
  );


  ctx.fillStyle =
    "rgba(255,255,255,.10)";


  ctx.fillRect(
    p.x + 30,
    p.y + 30,
    w - 60,
    18
  );
}


function drawCrates(
  x,
  y
) {

  for (
    let row = 0;
    row < 2;
    row++
  ) {

    for (
      let col = 0;
      col < 3;
      col++
    ) {

      const p =
        worldToScreen(
          x + col * 52,
          y + row * 52
        );


      ctx.fillStyle =
        "#8b683f";


      ctx.fillRect(
        p.x,
        p.y,
        42,
        42
      );


      ctx.strokeStyle =
        "#6b4c2e";


      ctx.lineWidth = 3;


      ctx.strokeRect(
        p.x,
        p.y,
        42,
        42
      );
    }
  }
}


function drawContainer(
  x,
  y,
  color
) {

  const p =
    worldToScreen(
      x,
      y
    );


  ctx.fillStyle =
    "rgba(0,0,0,.2)";


  ctx.fillRect(
    p.x + 9,
    p.y + 10,
    180,
    75
  );


  ctx.fillStyle =
    color;


  ctx.fillRect(
    p.x,
    p.y,
    180,
    75
  );


  ctx.strokeStyle =
    "rgba(0,0,0,.25)";


  for (
    let i = 15;
    i < 180;
    i += 22
  ) {

    ctx.beginPath();

    ctx.moveTo(
      p.x + i,
      p.y
    );

    ctx.lineTo(
      p.x + i,
      p.y + 75
    );

    ctx.stroke();
  }
}


// ============================================================
// BORDER
// ============================================================

function drawWorldBorder() {

  const p =
    worldToScreen(
      0,
      0
    );


  ctx.strokeStyle =
    "rgba(0,0,0,.35)";


  ctx.lineWidth = 5;


  ctx.strokeRect(
    p.x,
    p.y,
    world.width,
    world.height
  );
}


// ============================================================
// PLAYER
// ============================================================

function drawPlayer(
  player
) {

  const p =
    worldToScreen(
      player.x,
      player.y
    );


  const mine =
    player.id === myId;


  ctx.save();


  ctx.translate(
    p.x,
    p.y
  );


  ctx.fillStyle =
    "rgba(0,0,0,.22)";


  ctx.beginPath();

  ctx.ellipse(
    5,
    18,
    21,
    9,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  ctx.fillStyle =
    mine
      ? "#e6333c"
      : "#45484d";


  ctx.beginPath();

  ctx.arc(
    0,
    0,
    mine
      ? 20
      : 18,
    0,
    Math.PI * 2
  );

  ctx.fill();


  ctx.strokeStyle =
    mine
      ? "#ffffff"
      : "rgba(255,255,255,.55)";


  ctx.lineWidth =
    mine
      ? 3
      : 2;


  ctx.stroke();


  ctx.font =
    mine
      ? "800 13px system-ui"
      : "700 12px system-ui";


  ctx.textAlign =
    "center";


  ctx.textBaseline =
    "bottom";


  ctx.strokeStyle =
    "rgba(0,0,0,.7)";


  ctx.lineWidth = 4;


  ctx.strokeText(
    player.name ||
      "Spieler",

    0,

    -28
  );


  ctx.fillStyle =
    "#fff";


  ctx.fillText(
    player.name ||
      "Spieler",

    0,

    -28
  );


  ctx.restore();
}


// ============================================================
// MINIMAP
// ============================================================

function drawMinimap() {

  const w =
    minimapCanvas.width;


  const h =
    minimapCanvas.height;


  minimapCtx.clearRect(
    0,
    0,
    w,
    h
  );


  minimapCtx.fillStyle =
    "#25272a";


  minimapCtx.fillRect(
    0,
    0,
    w,
    h
  );


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
        ? 5
        : 3,
      0,
      Math.PI * 2
    );


    minimapCtx.fillStyle =
      player.id === myId
        ? "#e6333c"
        : "#ffffff";


    minimapCtx.fill();
  }


  minimapCtx.strokeStyle =
    "rgba(255,255,255,.25)";


  minimapCtx.lineWidth =
    2;


  minimapCtx.strokeRect(
    1,
    1,
    w - 2,
    h - 2
  );
}


// ============================================================
// RENDER
// ============================================================

function render() {

  updateCamera();


  drawMap();


  for (
    const player
    of players
  ) {

    drawPlayer(
      player
    );
  }


  drawMinimap();


  requestAnimationFrame(
    render
  );
}


// ============================================================
// START
// ============================================================

connect();

render();
