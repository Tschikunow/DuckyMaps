"use strict";


// ============================================================
// DUCKYMAPS V4 CLIENT
// ============================================================

const $ =
  id =>
    document.getElementById(id);


// ============================================================
// CANVAS
// ============================================================

const canvas =
  $("gameCanvas");

const ctx =
  canvas.getContext("2d");


const minimapCanvas =
  $("minimapCanvas");

const minimapCtx =
  minimapCanvas.getContext("2d");


let screenWidth = 0;

let screenHeight = 0;

let dpr = 1;


// ============================================================
// UI
// ============================================================

const introScreen =
  $("introScreen");

const mainMenu =
  $("mainMenu");

const mapsMenu =
  $("mapsMenu");

const settingsMenu =
  $("settingsMenu");

const mapIntro =
  $("mapIntro");

const gameHud =
  $("gameHud");

const pauseMenu =
  $("pauseMenu");


const playButton =
  $("playButton");

const mapsButton =
  $("mapsButton");

const settingsButton =
  $("settingsButton");

const mapsBackButton =
  $("mapsBackButton");

const settingsBackButton =
  $("settingsBackButton");

const saveSettingsButton =
  $("saveSettingsButton");


const pauseButton =
  $("pauseButton");

const continueButton =
  $("continueButton");

const pauseSettingsButton =
  $("pauseSettingsButton");

const exitButton =
  $("exitButton");


const jumpButton =
  $("jumpButton");

const actionButton =
  $("actionButton");


const onlineCount =
  $("onlineCount");

const hudPlayers =
  $("hudPlayers");

const connectionText =
  $("connectionText");

const connectionDot =
  $("connectionDot");


const hudMapName =
  $("hudMapName");

const playMapName =
  $("playMapName");

const introMapName =
  $("introMapName");

const introMapSubtitle =
  $("introMapSubtitle");


const profileName =
  $("profileName");

const profileCoins =
  $("profileCoins");

const coinCount =
  $("coinCount");


const playerListPanel =
  $("playerListPanel");

const playerList =
  $("playerList");


const minimapPanel =
  $("minimapPanel");


const speedHud =
  $("speedHud");

const speedValue =
  $("speedValue");


const notifications =
  $("notifications");


// ============================================================
// SETTINGS ELEMENTS
// ============================================================

const nameInput =
  $("nameInput");

const themeSelect =
  $("themeSelect");

const minimapToggle =
  $("minimapToggle");

const playerListToggle =
  $("playerListToggle");

const zoomSlider =
  $("zoomSlider");

const zoomValue =
  $("zoomValue");

const musicToggle =
  $("musicToggle");

const musicVolume =
  $("musicVolume");

const musicVolumeValue =
  $("musicVolumeValue");

const soundToggle =
  $("soundToggle");


// ============================================================
// MOBILE
// ============================================================

const moveZone =
  $("moveZone");

const joystickElement =
  $("joystick");

const joystickStick =
  $("joystickStick");


// ============================================================
// SETTINGS
// ============================================================

const defaultSettings = {
  name: "Spieler",

  theme: "dark",

  minimap: true,

  playerList: true,

  zoom: 100,

  music: true,

  musicVolume: 30,

  sounds: true
};


function loadSettings() {
  try {
    return {
      ...defaultSettings,

      ...JSON.parse(
        localStorage.getItem(
          "duckymaps-settings"
        ) || "{}"
      )
    };
  } catch {
    return {
      ...defaultSettings
    };
  }
}


let settings =
  loadSettings();


let selectedMap =
  localStorage.getItem(
    "duckymaps-map"
  ) || "industry";


const mapNames = {
  industry: "Industrie",

  harbor: "Hafen",

  labs: "Labs"
};


// ============================================================
// GAME STATE
// ============================================================

let socket = null;

let reconnectTimer = null;

let myId = null;

let onlinePlayers = 0;


let currentMap = null;

let currentDoorStates = {};


let playing = false;

let paused = false;

let settingsFromPause = false;


let serverPlayers = [];

const renderPlayers =
  new Map();


let coins = 0;


// ============================================================
// CAMERA
// ============================================================

const camera = {
  x: 0,

  y: 0
};


let lastFrameTime =
  performance.now();


// ============================================================
// INPUT
// ============================================================

const keys =
  new Set();


const input = {
  x: 0,

  y: 0
};


const joystick = {
  active: false,

  pointerId: null,

  centerX: 0,

  centerY: 0,

  x: 0,

  y: 0
};


// ============================================================
// AUDIO
// ============================================================

let audioContext = null;

let musicGain = null;

let musicOscillators = [];


// ============================================================
// DEVICE
// ============================================================

function isTouchDevice() {
  return (
    window.matchMedia(
      "(pointer: coarse)"
    ).matches
  );
}


// ============================================================
// RESIZE
// ============================================================

function resize() {
  dpr =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );


  screenWidth =
    window.innerWidth;


  screenHeight =
    window.innerHeight;


  canvas.width =
    Math.floor(
      screenWidth * dpr
    );


  canvas.height =
    Math.floor(
      screenHeight * dpr
    );


  canvas.style.width =
    `${screenWidth}px`;


  canvas.style.height =
    `${screenHeight}px`;


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
// SETTINGS UI
// ============================================================

function refreshSettingsUI() {
  nameInput.value =
    settings.name;


  themeSelect.value =
    settings.theme;


  minimapToggle.checked =
    settings.minimap;


  playerListToggle.checked =
    settings.playerList;


  zoomSlider.value =
    settings.zoom;


  zoomValue.textContent =
    `${settings.zoom}%`;


  musicToggle.checked =
    settings.music;


  musicVolume.value =
    settings.musicVolume;


  musicVolumeValue.textContent =
    `${settings.musicVolume}%`;


  soundToggle.checked =
    settings.sounds;


  applySettings();
}


function applySettings() {
  document.body.dataset.theme =
    settings.theme;


  minimapPanel.classList.toggle(
    "hidden",
    !settings.minimap
  );


  playerListPanel.classList.toggle(
    "hidden",
    !settings.playerList
  );


  profileName.textContent =
    settings.name;


  applyMusic();
}


function saveSettings() {
  settings.name =
    nameInput.value
      .trim()
      .slice(0, 20)
      ||
      "Spieler";


  settings.theme =
    themeSelect.value;


  settings.minimap =
    minimapToggle.checked;


  settings.playerList =
    playerListToggle.checked;


  settings.zoom =
    Number(
      zoomSlider.value
    );


  settings.music =
    musicToggle.checked;


  settings.musicVolume =
    Number(
      musicVolume.value
    );


  settings.sounds =
    soundToggle.checked;


  localStorage.setItem(
    "duckymaps-settings",

    JSON.stringify(
      settings
    )
  );


  applySettings();

  sendName();

  uiSound();


  settingsMenu.classList.add(
    "hidden"
  );


  if (
    settingsFromPause
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


zoomSlider.addEventListener(
  "input",
  () => {
    zoomValue.textContent =
      `${zoomSlider.value}%`;
  }
);


musicVolume.addEventListener(
  "input",
  () => {
    musicVolumeValue.textContent =
      `${musicVolume.value}%`;


    settings.musicVolume =
      Number(
        musicVolume.value
      );


    applyMusic();
  }
);


themeSelect.addEventListener(
  "change",
  () => {
    document.body.dataset.theme =
      themeSelect.value;
  }
);


saveSettingsButton.addEventListener(
  "click",
  saveSettings
);


refreshSettingsUI();


// ============================================================
// AUDIO
// ============================================================

function ensureAudio() {
  if (
    audioContext
  ) {
    if (
      audioContext.state ===
      "suspended"
    ) {
      audioContext.resume();
    }

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


  const frequencies =
    [73, 110, 146];


  for (
    const frequency
    of frequencies
  ) {
    const oscillator =
      audioContext.createOscillator();


    const gain =
      audioContext.createGain();


    oscillator.type =
      "sine";


    oscillator.frequency.value =
      frequency;


    gain.gain.value =
      0.012;


    oscillator.connect(
      gain
    );


    gain.connect(
      musicGain
    );


    oscillator.start();


    musicOscillators.push(
      oscillator
    );
  }


  applyMusic();
}


function applyMusic() {
  if (
    !audioContext ||
    !musicGain
  ) {
    return;
  }


  const enabled =
    musicToggle.checked;


  const volume =
    Number(
      musicVolume.value
    ) / 100;


  musicGain.gain
    .setTargetAtTime(
      enabled
        ? volume * .22
        : 0,

      audioContext.currentTime,

      .12
    );
}


function uiSound() {
  if (
    !settings.sounds
  ) {
    return;
  }


  ensureAudio();


  if (!audioContext) {
    return;
  }


  const oscillator =
    audioContext.createOscillator();


  const gain =
    audioContext.createGain();


  oscillator.type =
    "sine";


  oscillator.frequency.value =
    440;


  gain.gain.setValueAtTime(
    .035,
    audioContext.currentTime
  );


  gain.gain.exponentialRampToValueAtTime(
    .001,

    audioContext.currentTime +
      .07
  );


  oscillator.connect(
    gain
  );


  gain.connect(
    audioContext.destination
  );


  oscillator.start();


  oscillator.stop(
    audioContext.currentTime +
      .08
  );
}


// ============================================================
// INTRO
// ============================================================

setTimeout(
  () => {
    introScreen.classList.add(
      "fade"
    );


    setTimeout(
      () => {
        introScreen.classList.add(
          "hidden"
        );
      },
      650
    );
  },
  1200
);


// ============================================================
// MAP SELECTION
// ============================================================

function updateSelectedMap() {
  if (
    !mapNames[selectedMap]
  ) {
    selectedMap =
      "industry";
  }


  playMapName.textContent =
    mapNames[selectedMap];


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


          updateSelectedMap();

          uiSound();
        }
      );
    }
  );


updateSelectedMap();


// ============================================================
// MENU
// ============================================================

playButton.addEventListener(
  "click",
  () => {
    ensureAudio();

    uiSound();

    startGame();
  }
);


mapsButton.addEventListener(
  "click",
  () => {
    uiSound();

    mainMenu.classList.add(
      "hidden"
    );

    mapsMenu.classList.remove(
      "hidden"
    );
  }
);


mapsBackButton.addEventListener(
  "click",
  () => {
    uiSound();

    mapsMenu.classList.add(
      "hidden"
    );

    mainMenu.classList.remove(
      "hidden"
    );
  }
);


function openSettings(
  fromPause
) {
  settingsFromPause =
    fromPause;


  refreshSettingsUI();


  mainMenu.classList.add(
    "hidden"
  );


  pauseMenu.classList.add(
    "hidden"
  );


  settingsMenu.classList.remove(
    "hidden"
  );


  uiSound();
}


settingsButton.addEventListener(
  "click",
  () => {
    openSettings(false);
  }
);


pauseSettingsButton.addEventListener(
  "click",
  () => {
    openSettings(true);
  }
);


settingsBackButton.addEventListener(
  "click",
  () => {
    settingsMenu.classList.add(
      "hidden"
    );


    if (
      settingsFromPause
    ) {
      pauseMenu.classList.remove(
        "hidden"
      );
    } else {
      mainMenu.classList.remove(
        "hidden"
      );
    }


    applySettings();

    uiSound();
  }
);


// ============================================================
// START GAME
// ============================================================

function startGame() {
  if (
    !socket ||
    socket.readyState !==
      WebSocket.OPEN
  ) {
    showNotification(
      "Server wird noch verbunden."
    );

    return;
  }


  playing = true;

  paused = false;


  currentMap = null;

  serverPlayers = [];

  renderPlayers.clear();


  mainMenu.classList.add(
    "hidden"
  );


  mapsMenu.classList.add(
    "hidden"
  );


  mapIntro.classList.remove(
    "hidden"
  );


  sendName();


  socket.send(
    JSON.stringify({
      type: "joinMap",

      mapId:
        selectedMap
    })
  );
}


// ============================================================
// PAUSE
// ============================================================

function openPause() {
  if (!playing) {
    return;
  }


  paused = true;


  pauseMenu.classList.remove(
    "hidden"
  );


  uiSound();
}


function closePause() {
  paused = false;


  pauseMenu.classList.add(
    "hidden"
  );


  uiSound();
}


pauseButton.addEventListener(
  "click",
  openPause
);


continueButton.addEventListener(
  "click",
  closePause
);


exitButton.addEventListener(
  "click",
  () => {
    playing = false;

    paused = false;


    keys.clear();


    input.x = 0;
    input.y = 0;


    if (
      socket &&
      socket.readyState ===
        WebSocket.OPEN
    ) {
      socket.send(
        JSON.stringify({
          type:
            "leaveMap"
        })
      );
    }


    pauseMenu.classList.add(
      "hidden"
    );


    gameHud.classList.add(
      "hidden"
    );


    mapIntro.classList.add(
      "hidden"
    );


    mainMenu.classList.remove(
      "hidden"
    );


    uiSound();
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
    location.protocol ===
      "https:"
      ? "wss:"
      : "ws:";


  socket =
    new WebSocket(
      `${protocol}//${location.host}`
    );


  connectionText.textContent =
    "Verbinden...";


  connectionDot.style.background =
    "#ffbd3e";


  socket.addEventListener(
    "open",
    () => {
      connectionText.textContent =
        "ONLINE";


      connectionDot.style.background =
        "#4de586";


      connectionDot.style.color =
        "#4de586";


      sendName();
    }
  );


  socket.addEventListener(
    "message",
    event => {
      handleMessage(
        event.data
      );
    }
  );


  socket.addEventListener(
    "close",
    () => {
      connectionText.textContent =
        "NEU VERBINDEN...";


      connectionDot.style.background =
        "#ffbd3e";


      reconnectTimer =
        setTimeout(
          connect,
          1500
        );
    }
  );
}


// ============================================================
// NETWORK MESSAGE
// ============================================================

function handleMessage(raw) {
  try {
    const message =
      JSON.parse(raw);


    if (
      message.type ===
      "welcome"
    ) {
      myId =
        message.playerId;

      sendName();

      return;
    }


    if (
      message.type ===
      "status"
    ) {
      onlinePlayers =
        Number(
          message.online
        ) || 0;


      onlineCount.textContent =
        `${onlinePlayers} SPIELER ONLINE`;

      return;
    }


    if (
      message.type ===
      "map"
    ) {
      currentMap =
        message.map;


      camera.x =
        currentMap.width / 2;


      camera.y =
        currentMap.height / 2;


      hudMapName.textContent =
        currentMap.title;


      introMapName.textContent =
        currentMap.title;


      introMapSubtitle.textContent =
        currentMap.subtitle;


      setTimeout(
        () => {
          mapIntro.classList.add(
            "hidden"
          );


          gameHud.classList.remove(
            "hidden"
          );
        },
        900
      );

      return;
    }


    if (
      message.type ===
      "state"
    ) {
      if (
        currentMap &&
        message.mapId !==
          currentMap.id
      ) {
        return;
      }


      serverPlayers =
        Array.isArray(
          message.players
        )
          ? message.players
          : [];


      currentDoorStates =
        message.doors || {};


      updateRenderTargets();

      updatePlayerList();

      updateSpeed();

      return;
    }


    if (
      message.type ===
      "rewardState"
    ) {
      setCoins(
        message.coins
      );

      return;
    }


    if (
      message.type ===
      "reward"
    ) {
      setCoins(
        message.coins
      );


      showNotification(
        `+${message.amount} Coin · ${message.reason}`,

        true
      );
    }

  } catch {
    // ungültige Daten ignorieren
  }
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
      type:
        "setName",

      name:
        settings.name
    })
  );
}


// ============================================================
// COINS
// ============================================================

function setCoins(value) {
  coins =
    Number(value) || 0;


  coinCount.textContent =
    String(coins);


  profileCoins.textContent =
    String(coins);
}


// ============================================================
// NOTIFICATION
// ============================================================

function showNotification(
  text,
  reward = false
) {
  const element =
    document.createElement(
      "div"
    );


  element.className =
    reward
      ? "notification reward"
      : "notification";


  element.textContent =
    text;


  notifications.appendChild(
    element
  );


  setTimeout(
    () => {
      element.remove();
    },
    2700
  );
}


// ============================================================
// SMOOTH NETWORK PLAYERS
// ============================================================

function updateRenderTargets() {
  const ids =
    new Set();


  for (
    const player
    of serverPlayers
  ) {
    ids.add(
      player.id
    );


    let renderPlayer =
      renderPlayers.get(
        player.id
      );


    if (!renderPlayer) {
      renderPlayer = {
        ...player,

        targetX:
          player.x,

        targetY:
          player.y,

        targetJump:
          player.jumpHeight || 0
      };


      renderPlayers.set(
        player.id,
        renderPlayer
      );
    }


    renderPlayer.targetX =
      player.x;


    renderPlayer.targetY =
      player.y;


    renderPlayer.targetJump =
      player.jumpHeight || 0;


    renderPlayer.name =
      player.name;


    renderPlayer.bunnyhop =
      player.bunnyhop || 0;


    renderPlayer.coins =
      player.coins || 0;
  }


  for (
    const id
    of renderPlayers.keys()
  ) {
    if (
      !ids.has(id)
    ) {
      renderPlayers.delete(
        id
      );
    }
  }
}


function smoothPlayers(dt) {
  const positionFactor =
    1 -
    Math.exp(
      -14 * dt
    );


  const jumpFactor =
    1 -
    Math.exp(
      -18 * dt
    );


  for (
    const player
    of renderPlayers.values()
  ) {
    player.x +=
      (
        player.targetX -
        player.x
      ) *
      positionFactor;


    player.y +=
      (
        player.targetY -
        player.y
      ) *
      positionFactor;


    player.jumpHeight =
      (
        player.jumpHeight || 0
      ) +
      (
        player.targetJump -
        (
          player.jumpHeight || 0
        )
      ) *
      jumpFactor;
  }
}


// ============================================================
// PLAYER LIST
// ============================================================

function updatePlayerList() {
  hudPlayers.textContent =
    `${serverPlayers.length} SPIELER`;


  playerList.innerHTML =
    "";


  const sorted =
    [...serverPlayers]
      .sort(
        (a, b) => {
          if (
            a.id === myId
          ) {
            return -1;
          }


          if (
            b.id === myId
          ) {
            return 1;
          }


          return (
            a.name || ""
          ).localeCompare(
            b.name || ""
          );
        }
      );


  for (
    const player
    of sorted
  ) {
    const line =
      document.createElement(
        "div"
      );


    line.className =
      "playerLine";


    const dot =
      document.createElement(
        "span"
      );


    dot.className =
      player.id === myId
        ? "playerDot me"
        : "playerDot";


    const name =
      document.createElement(
        "span"
      );


    name.textContent =
      player.id === myId
        ? `${player.name} (Du)`
        : player.name;


    line.appendChild(
      dot
    );


    line.appendChild(
      name
    );


    playerList.appendChild(
      line
    );
  }
}


// ============================================================
// SPEED HUD
// ============================================================

function updateSpeed() {
  const me =
    serverPlayers.find(
      player =>
        player.id === myId
    );


  if (!me) {
    return;
  }


  const percentage =
    Math.round(
      100 +
      (
        me.bunnyhop || 0
      ) * 100
    );


  speedValue.textContent =
    `${percentage}%`;


  speedHud.classList.toggle(
    "hidden",

    percentage <= 102
  );
}


// ============================================================
// KEYBOARD
// ============================================================

window.addEventListener(
  "keydown",
  event => {
    const key =
      event.key.toLowerCase();


    if (
      document.activeElement ===
      nameInput
    ) {
      return;
    }


    if (
      [
        "w",
        "a",
        "s",
        "d",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        " "
      ].includes(key)
    ) {
      event.preventDefault();
    }


    if (
      event.key ===
        "Escape" &&
      playing
    ) {
      if (
        pauseMenu.classList.contains(
          "hidden"
        )
      ) {
        openPause();
      } else {
        closePause();
      }

      return;
    }


    if (
      key === " " &&
      !keys.has(" ")
    ) {
      requestJump();
    }


    keys.add(key);
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


// ============================================================
// INPUT
// ============================================================

function calculateInput() {
  if (
    !playing ||
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
    keys.has(
      "arrowleft"
    )
  ) {
    x -= 1;
  }


  if (
    keys.has("d") ||
    keys.has(
      "arrowright"
    )
  ) {
    x += 1;
  }


  if (
    keys.has("w") ||
    keys.has(
      "arrowup"
    )
  ) {
    y -= 1;
  }


  if (
    keys.has("s") ||
    keys.has(
      "arrowdown"
    )
  ) {
    y += 1;
  }


  if (
    joystick.active
  ) {
    x =
      joystick.x;

    y =
      joystick.y;
  }


  const length =
    Math.hypot(
      x,
      y
    );


  if (
    length > 1
  ) {
    x /= length;

    y /= length;
  }


  input.x = x;

  input.y = y;
}


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
      type:
        "input",

      x:
        input.x,

      y:
        input.y
    })
  );
}


setInterval(
  sendInput,
  1000 / 30
);


// ============================================================
// JUMP / BUNNYHOP
// ============================================================

function requestJump() {
  if (
    !playing ||
    paused
  ) {
    return;
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
      type:
        "jump"
    })
  );
}


jumpButton.addEventListener(
  "pointerdown",
  event => {
    event.preventDefault();

    requestJump();
  }
);


actionButton.addEventListener(
  "pointerdown",
  event => {
    event.preventDefault();


    showNotification(
      "Aktion verfügbar, sobald du an einem interaktiven Objekt bist."
    );
  }
);


// ============================================================
// MOBILE JOYSTICK
// ============================================================

function positionJoystickBase(
  clientX,
  clientY
) {
  const zone =
    moveZone
      .getBoundingClientRect();


  const size = 105;


  const x =
    Math.max(
      zone.left + 15,

      Math.min(
        clientX -
          size / 2,

        zone.right -
          size -
          15
      )
    );


  const y =
    Math.max(
      zone.top + 15,

      Math.min(
        clientY -
          size / 2,

        zone.bottom -
          size -
          15
      )
    );


  joystickElement.style.left =
    `${x}px`;


  joystickElement.style.top =
    `${y}px`;


  joystickElement.style.bottom =
    "auto";


  joystick.centerX =
    x + size / 2;


  joystick.centerY =
    y + size / 2;
}


function updateJoystick(
  clientX,
  clientY
) {
  let dx =
    clientX -
    joystick.centerX;


  let dy =
    clientY -
    joystick.centerY;


  const max =
    35;


  const distance =
    Math.hypot(
      dx,
      dy
    );


  if (
    distance > max
  ) {
    dx =
      dx /
      distance *
      max;


    dy =
      dy /
      distance *
      max;
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
    "translate(0, 0)";
}


moveZone.addEventListener(
  "pointerdown",
  event => {
    if (
      !playing ||
      paused
    ) {
      return;
    }


    joystick.active =
      true;


    joystick.pointerId =
      event.pointerId;


    moveZone.setPointerCapture(
      event.pointerId
    );


    positionJoystickBase(
      event.clientX,
      event.clientY
    );


    updateJoystick(
      event.clientX,
      event.clientY
    );
  }
);


moveZone.addEventListener(
  "pointermove",
  event => {
    if (
      !joystick.active ||
      event.pointerId !==
        joystick.pointerId
    ) {
      return;
    }


    updateJoystick(
      event.clientX,
      event.clientY
    );
  }
);


moveZone.addEventListener(
  "pointerup",
  resetJoystick
);


moveZone.addEventListener(
  "pointercancel",
  resetJoystick
);


// ============================================================
// CAMERA
// ============================================================

function getMyRenderPlayer() {
  return renderPlayers.get(
    myId
  );
}


function updateCamera(dt) {
  const me =
    getMyRenderPlayer();


  if (!me) {
    return;
  }


  const factor =
    1 -
    Math.exp(
      -8.5 * dt
    );


  camera.x +=
    (
      me.x -
      camera.x
    ) *
    factor;


  camera.y +=
    (
      me.y -
      camera.y
    ) *
    factor;
}


// ============================================================
// ZOOM
// ============================================================

function getZoom() {
  let zoom =
    settings.zoom /
    100;


  if (
    isTouchDevice() &&
    screenWidth < 700
  ) {
    zoom *= .82;
  }


  return zoom;
}


function worldToScreen(
  x,
  y
) {
  const zoom =
    getZoom();


  return {
    x:
      (
        x -
        camera.x
      ) *
      zoom +
      screenWidth / 2,

    y:
      (
        y -
        camera.y
      ) *
      zoom +
      screenHeight / 2
  };
}


// ============================================================
// RECT DRAW HELPER
// ============================================================

function drawWorldRect(
  rect,
  color
) {
  const position =
    worldToScreen(
      rect.x,
      rect.y
    );


  const zoom =
    getZoom();


  ctx.fillStyle =
    color;


  ctx.fillRect(
    position.x,
    position.y,
    rect.w * zoom,
    rect.h * zoom
  );
}


// ============================================================
// FLOOR
// ============================================================

function drawFloor() {
  if (!currentMap) {
    ctx.fillStyle =
      "#111217";

    ctx.fillRect(
      0,
      0,
      screenWidth,
      screenHeight
    );

    return;
  }


  ctx.fillStyle =
    currentMap.colors.ground;


  ctx.fillRect(
    0,
    0,
    screenWidth,
    screenHeight
  );


  const zoom =
    getZoom();


  const tile =
    80;


  const startX =
    Math.floor(
      (
        camera.x -
        screenWidth /
        zoom /
        2
      ) /
      tile
    ) *
    tile;


  const endX =
    camera.x +
    screenWidth /
    zoom /
    2;


  const startY =
    Math.floor(
      (
        camera.y -
        screenHeight /
        zoom /
        2
      ) /
      tile
    ) *
    tile;


  const endY =
    camera.y +
    screenHeight /
    zoom /
    2;


  ctx.strokeStyle =
    currentMap.colors.grid;


  ctx.lineWidth = 1;


  for (
    let x = startX;
    x < endX;
    x += tile
  ) {
    const a =
      worldToScreen(
        x,
        0
      );


    ctx.beginPath();

    ctx.moveTo(
      a.x,
      0
    );

    ctx.lineTo(
      a.x,
      screenHeight
    );

    ctx.stroke();
  }


  for (
    let y = startY;
    y < endY;
    y += tile
  ) {
    const a =
      worldToScreen(
        0,
        y
      );


    ctx.beginPath();

    ctx.moveTo(
      0,
      a.y
    );

    ctx.lineTo(
      screenWidth,
      a.y
    );

    ctx.stroke();
  }


  if (
    currentMap.water
  ) {
    drawWorldRect(
      currentMap.water,
      "#2f7590"
    );


    const water =
      worldToScreen(
        currentMap.water.x,
        currentMap.water.y
      );


    const gradient =
      ctx.createLinearGradient(
        water.x,
        0,
        water.x +
          currentMap.water.w *
          zoom,
        0
      );


    gradient.addColorStop(
      0,
      "rgba(255,255,255,.05)"
    );


    gradient.addColorStop(
      1,
      "rgba(0,30,50,.15)"
    );


    ctx.fillStyle =
      gradient;


    ctx.fillRect(
      water.x,
      water.y,
      currentMap.water.w *
        zoom,
      currentMap.water.h *
        zoom
    );
  }
}


// ============================================================
// WALLS
// ============================================================

function drawWalls() {
  if (!currentMap) {
    return;
  }


  const zoom =
    getZoom();


  for (
    const wall
    of currentMap.walls
  ) {
    const p =
      worldToScreen(
        wall.x,
        wall.y
      );


    ctx.fillStyle =
      "rgba(0,0,0,.16)";


    ctx.fillRect(
      p.x +
        7 * zoom,

      p.y +
        9 * zoom,

      wall.w *
        zoom,

      wall.h *
        zoom
    );


    ctx.fillStyle =
      currentMap.colors.wall;


    ctx.fillRect(
      p.x,
      p.y,

      wall.w *
        zoom,

      wall.h *
        zoom
    );


    ctx.fillStyle =
      currentMap.colors.wallTop;


    ctx.fillRect(
      p.x,
      p.y,

      wall.w *
        zoom,

      Math.min(
        wall.h * zoom,
        8 * zoom
      )
    );
  }
}


// ============================================================
// DOORS
// ============================================================

function drawDoors() {
  if (!currentMap) {
    return;
  }


  const zoom =
    getZoom();


  for (
    const door
    of currentMap.doors
  ) {
    const state =
      currentDoorStates[
        door.id
      ] || {
        amount: 0
      };


    const amount =
      Number(
        state.amount
      ) || 0;


    const p =
      worldToScreen(
        door.x,
        door.y
      );


    ctx.save();


    ctx.fillStyle =
      currentMap.colors.door;


    if (
      door.direction ===
      "horizontal"
    ) {
      const visible =
        door.w *
        (
          1 -
          amount
        );


      ctx.fillRect(
        p.x +
          (
            door.w -
            visible
          ) /
          2 *
          zoom,

        p.y,

        visible *
          zoom,

        door.h *
          zoom
      );
    } else {
      const visible =
        door.h *
        (
          1 -
          amount
        );


      ctx.fillRect(
        p.x,

        p.y +
          (
            door.h -
            visible
          ) /
          2 *
          zoom,

        door.w *
          zoom,

        visible *
          zoom
      );
    }


    ctx.restore();
  }
}


// ============================================================
// FURNITURE
// ============================================================

function furnitureColor(
  type
) {
  const colors = {
    machine:
      "#555b5e",

    crate:
      "#91683e",

    shelf:
      "#55585b",

    workbench:
      "#795b3b",

    desk:
      "#8b735c",

    chair:
      "#44474b",

    "container-red":
      "#bf4148",

    "container-blue":
      "#3d719c",

    "container-yellow":
      "#bd8c39",

    pallet:
      "#8a6948",

    forklift:
      "#d2a337",

    bollard:
      "#34383a",

    labtable:
      "#eef1f2",

    computer:
      "#4a555d",

    serverrack:
      "#303941",

    scanner:
      "#7e8d96"
  };


  return (
    colors[type] ||
    "#666"
  );
}


function drawFurniture() {
  if (!currentMap) {
    return;
  }


  const zoom =
    getZoom();


  for (
    const item
    of currentMap.furniture
  ) {
    const p =
      worldToScreen(
        item.x,
        item.y
      );


    ctx.fillStyle =
      "rgba(0,0,0,.15)";


    ctx.fillRect(
      p.x + 6 * zoom,
      p.y + 7 * zoom,

      item.w * zoom,
      item.h * zoom
    );


    ctx.fillStyle =
      furnitureColor(
        item.type
      );


    ctx.fillRect(
      p.x,
      p.y,

      item.w * zoom,
      item.h * zoom
    );


    ctx.strokeStyle =
      "rgba(0,0,0,.18)";


    ctx.lineWidth =
      2 * zoom;


    ctx.strokeRect(
      p.x,
      p.y,

      item.w * zoom,
      item.h * zoom
    );


    if (
      item.type ===
        "serverrack"
    ) {
      ctx.fillStyle =
        "#56d39a";


      for (
        let y = 18;
        y < item.h - 10;
        y += 26
      ) {
        ctx.fillRect(
          p.x +
            12 * zoom,

          p.y +
            y * zoom,

          8 * zoom,
          3 * zoom
        );
      }
    }


    if (
      item.type ===
        "computer"
    ) {
      ctx.fillStyle =
        "#6cd2ff";


      ctx.fillRect(
        p.x +
          20 * zoom,

        p.y +
          12 * zoom,

        (
          item.w -
          40
        ) * zoom,

        22 * zoom
      );
    }


    if (
      item.type.startsWith(
        "container"
      )
    ) {
      ctx.strokeStyle =
        "rgba(0,0,0,.22)";


      for (
        let x = 20;
        x < item.w;
        x += 28
      ) {
        ctx.beginPath();

        ctx.moveTo(
          p.x +
            x * zoom,
          p.y
        );

        ctx.lineTo(
          p.x +
            x * zoom,

          p.y +
            item.h *
            zoom
        );

        ctx.stroke();
      }
    }
  }
}


// ============================================================
// CHECKPOINTS
// ============================================================

function drawCheckpoints() {
  if (!currentMap) {
    return;
  }


  const zoom =
    getZoom();


  for (
    const checkpoint
    of currentMap.checkpoints
  ) {
    const p =
      worldToScreen(
        checkpoint.x,
        checkpoint.y
      );


    ctx.strokeStyle =
      "rgba(255,255,255,.13)";


    ctx.lineWidth =
      2;


    ctx.beginPath();


    ctx.arc(
      p.x,
      p.y,

      checkpoint.radius *
        zoom,

      0,
      Math.PI * 2
    );


    ctx.stroke();
  }
}


// ============================================================
// WORLD BORDER
// ============================================================

function drawWorldBorder() {
  if (!currentMap) {
    return;
  }


  const p =
    worldToScreen(
      0,
      0
    );


  const zoom =
    getZoom();


  ctx.strokeStyle =
    "rgba(0,0,0,.32)";


  ctx.lineWidth =
    5;


  ctx.strokeRect(
    p.x,
    p.y,

    currentMap.width *
      zoom,

    currentMap.height *
      zoom
  );
}


// ============================================================
// PLAYER
// ============================================================

function drawPlayer(player) {
  const p =
    worldToScreen(
      player.x,
      player.y
    );


  const zoom =
    getZoom();


  const jump =
    (
      player.jumpHeight || 0
    ) * zoom;


  const me =
    player.id === myId;


  ctx.save();


  // Schatten
  ctx.fillStyle =
    "rgba(0,0,0,.22)";


  ctx.beginPath();


  ctx.ellipse(
    p.x,
    p.y +
      15 * zoom,

    18 * zoom *
      (
        1 -
        Math.min(
          jump / 120,
          .3
        )
      ),

    7 * zoom,

    0,
    0,
    Math.PI * 2
  );


  ctx.fill();


  // Körper
  const bodyY =
    p.y - jump;


  ctx.fillStyle =
    me
      ? "#e53843"
      : "#41454a";


  ctx.beginPath();


  ctx.arc(
    p.x,
    bodyY,

    18 * zoom,

    0,
    Math.PI * 2
  );


  ctx.fill();


  ctx.strokeStyle =
    me
      ? "#ffffff"
      : "rgba(255,255,255,.62)";


  ctx.lineWidth =
    me
      ? 2.5
      : 1.7;


  ctx.stroke();


  // kleines Highlight
  ctx.fillStyle =
    "rgba(255,255,255,.85)";


  ctx.beginPath();


  ctx.arc(
    p.x -
      6 * zoom,

    bodyY -
      6 * zoom,

    4 * zoom,

    0,
    Math.PI * 2
  );


  ctx.fill();


  // Name
  ctx.font =
    `${me ? 750 : 650} ${
      Math.max(
        10,
        12 * zoom
      )
    }px system-ui`;


  ctx.textAlign =
    "center";


  ctx.textBaseline =
    "bottom";


  ctx.strokeStyle =
    "rgba(0,0,0,.68)";


  ctx.lineWidth =
    4;


  ctx.strokeText(
    player.name ||
      "Spieler",

    p.x,

    bodyY -
      26 * zoom
  );


  ctx.fillStyle =
    "white";


  ctx.fillText(
    player.name ||
      "Spieler",

    p.x,

    bodyY -
      26 * zoom
  );


  ctx.restore();
}


// ============================================================
// MINIMAP
// ============================================================

function drawMinimap() {
  if (
    !currentMap ||
    !settings.minimap
  ) {
    return;
  }


  const width =
    minimapCanvas.width;


  const height =
    minimapCanvas.height;


  minimapCtx.clearRect(
    0,
    0,
    width,
    height
  );


  minimapCtx.fillStyle =
    "#24262a";


  minimapCtx.fillRect(
    0,
    0,
    width,
    height
  );


  const scaleX =
    width /
    currentMap.width;


  const scaleY =
    height /
    currentMap.height;


  for (
    const wall
    of currentMap.walls
  ) {
    minimapCtx.fillStyle =
      "#777b80";


    minimapCtx.fillRect(
      wall.x * scaleX,

      wall.y * scaleY,

      wall.w * scaleX,

      wall.h * scaleY
    );
  }


  if (
    currentMap.water
  ) {
    minimapCtx.fillStyle =
      "#32738e";


    minimapCtx.fillRect(
      currentMap.water.x *
        scaleX,

      currentMap.water.y *
        scaleY,

      currentMap.water.w *
        scaleX,

      currentMap.water.h *
        scaleY
    );
  }


  for (
    const player
    of renderPlayers.values()
  ) {
    minimapCtx.beginPath();


    minimapCtx.arc(
      player.x *
        scaleX,

      player.y *
        scaleY,

      player.id === myId
        ? 5
        : 3,

      0,
      Math.PI * 2
    );


    minimapCtx.fillStyle =
      player.id === myId
        ? "#ed3f49"
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
    width - 2,
    height - 2
  );
}


// ============================================================
// RENDER LOOP
// ============================================================

function render(time) {
  const dt =
    Math.min(
      (
        time -
        lastFrameTime
      ) /
      1000,

      .05
    );


  lastFrameTime =
    time;


  smoothPlayers(dt);

  updateCamera(dt);


  drawFloor();

  drawCheckpoints();

  drawWalls();

  drawDoors();

  drawFurniture();


  const sortedPlayers =
    [...renderPlayers.values()]
      .sort(
        (a, b) =>
          a.y - b.y
      );


  for (
    const player
    of sortedPlayers
  ) {
    drawPlayer(
      player
    );
  }


  drawWorldBorder();

  drawMinimap();


  requestAnimationFrame(
    render
  );
}


// ============================================================
// START
// ============================================================

connect();

requestAnimationFrame(
  render
);
