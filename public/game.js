"use strict";

// ============================================================
// DUCKYMAPS V4.5 CLIENT
// ============================================================

const $ =
  id =>
    document.getElementById(
      id
    );


// ============================================================
// CANVAS
// ============================================================

const canvas =
  $("gameCanvas");

const ctx =
  canvas.getContext(
    "2d"
  );


const minimapCanvas =
  $("minimapCanvas");

const minimapCtx =
  minimapCanvas.getContext(
    "2d"
  );


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


const moveZone =
  $("moveZone");

const joystickElement =
  $("joystick");

const joystickStick =
  $("joystickStick");


// Desktop-Hinweis aktualisieren.
const desktopHint =
  document.querySelector(
    ".desktopHint"
  );


if (
  desktopHint
) {
  desktopHint.textContent =
    "WASD · LEERTASTE SPRINGEN · E INTERAGIEREN";
}


// ============================================================
// SETTINGS
// ============================================================

const defaultSettings = {
  name:
    "Spieler",

  theme:
    "dark",

  minimap:
    true,

  playerList:
    true,

  zoom:
    100,

  music:
    true,

  musicVolume:
    30,

  sounds:
    true
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
  ) ||
  "industry";


const mapNames = {
  industry:
    "Industrie",

  harbor:
    "Hafen",

  labs:
    "Labs"
};


// ============================================================
// GAME STATE
// ============================================================

let socket = null;

let reconnectTimer =
  null;

let myId = null;

let onlinePlayers = 0;

let currentMap = null;

let serverPlayers = [];

let currentDoorStates = {};

let worldState = {
  lightsOn: true,

  powerOn: true,

  interactables: {}
};


let playing = false;

let paused = false;

let settingsFromPause =
  false;

let coins = 0;


const renderPlayers =
  new Map();


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

let audioContext =
  null;

let musicGain =
  null;


// ============================================================
// RESIZE
// ============================================================

function resize() {
  dpr =
    Math.min(
      window.devicePixelRatio ||
      1,

      2
    );


  screenWidth =
    window.innerWidth;


  screenHeight =
    window.innerHeight;


  canvas.width =
    Math.floor(
      screenWidth *
      dpr
    );


  canvas.height =
    Math.floor(
      screenHeight *
      dpr
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
// SETTINGS
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
      .slice(
        0,
        20
      ) ||
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


  if (
    !AudioContext
  ) {
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
    [
      73,
      110,
      146
    ];


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


  const volume =
    Number(
      musicVolume.value
    ) /
    100;


  musicGain.gain
    .setTargetAtTime(
      musicToggle.checked
        ? volume * 0.22
        : 0,

      audioContext.currentTime,

      0.12
    );
}


function uiSound() {
  if (
    !settings.sounds
  ) {
    return;
  }


  ensureAudio();


  if (
    !audioContext
  ) {
    return;
  }


  const oscillator =
    audioContext.createOscillator();


  const gain =
    audioContext.createGain();


  oscillator.frequency.value =
    430;


  gain.gain.setValueAtTime(
    0.025,

    audioContext.currentTime
  );


  gain.gain.exponentialRampToValueAtTime(
    0.001,

    audioContext.currentTime +
    0.06
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
    0.07
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
// MAP SELECT
// ============================================================

function updateSelectedMap() {
  if (
    !mapNames[
      selectedMap
    ]
  ) {
    selectedMap =
      "industry";
  }


  playMapName.textContent =
    mapNames[
      selectedMap
    ];


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
    mainMenu.classList.add(
      "hidden"
    );


    mapsMenu.classList.remove(
      "hidden"
    );


    uiSound();
  }
);


mapsBackButton.addEventListener(
  "click",
  () => {
    mapsMenu.classList.add(
      "hidden"
    );


    mainMenu.classList.remove(
      "hidden"
    );


    uiSound();
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
  () =>
    openSettings(
      false
    )
);


pauseSettingsButton.addEventListener(
  "click",
  () =>
    openSettings(
      true
    )
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


  currentMap =
    null;


  serverPlayers =
    [];


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
      type:
        "joinMap",

      mapId:
        selectedMap
    })
  );
}


// ============================================================
// PAUSE
// ============================================================

function openPause() {
  if (
    !playing
  ) {
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


function handleMessage(
  raw
) {
  try {
    const message =
      JSON.parse(
        raw
      );


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
        ) ||
        0;


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
        currentMap.width /
        2;


      camera.y =
        currentMap.height /
        2;


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

        850
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
        message.doors ||
        {};


      worldState =
        message.worldState ||
        worldState;


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

      return;
    }


    if (
      message.type ===
      "interactionMessage"
    ) {
      showNotification(
        message.text
      );
    }

  } catch {
    // Ungültige Nachricht.
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

function setCoins(
  value
) {
  coins =
    Number(
      value
    ) ||
    0;


  coinCount.textContent =
    String(
      coins
    );


  profileCoins.textContent =
    String(
      coins
    );
}


// ============================================================
// NOTIFICATIONS
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

    2500
  );
}


// ============================================================
// SMOOTH NETWORKING
// ============================================================

function updateRenderTargets() {
  const activeIds =
    new Set();


  for (
    const player
    of serverPlayers
  ) {
    activeIds.add(
      player.id
    );


    let renderPlayer =
      renderPlayers.get(
        player.id
      );


    if (
      !renderPlayer
    ) {
      renderPlayer = {
        ...player,

        targetX:
          player.x,

        targetY:
          player.y,

        targetJump:
          player.jumpHeight ||
          0,

        jumpHeight:
          player.jumpHeight ||
          0
      };


      renderPlayers.set(
        player.id,
        renderPlayer
      );
    }


    // Kleine Extrapolation:
    // reduziert das sichtbare Netzwerkzittern.
    const prediction =
      0.045;


    renderPlayer.targetX =
      player.x +
      (
        player.vx ||
        0
      ) *
      prediction;


    renderPlayer.targetY =
      player.y +
      (
        player.vy ||
        0
      ) *
      prediction;


    renderPlayer.targetJump =
      player.jumpHeight ||
      0;


    renderPlayer.vx =
      player.vx ||
      0;


    renderPlayer.vy =
      player.vy ||
      0;


    renderPlayer.name =
      player.name;


    renderPlayer.bunnyhop =
      player.bunnyhop ||
      0;


    renderPlayer.hidden =
      Boolean(
        player.hidden
      );


    renderPlayer.coins =
      player.coins ||
      0;
  }


  for (
    const id
    of renderPlayers.keys()
  ) {
    if (
      !activeIds.has(
        id
      )
    ) {
      renderPlayers.delete(
        id
      );
    }
  }
}


function smoothPlayers(
  dt
) {
  const positionFactor =
    1 -
    Math.exp(
      -16 *
      dt
    );


  const jumpFactor =
    1 -
    Math.exp(
      -20 *
      dt
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


    player.jumpHeight +=
      (
        player.targetJump -
        player.jumpHeight
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


  for (
    const player
    of serverPlayers
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
// SPEED
// ============================================================

function updateSpeed() {
  const me =
    serverPlayers.find(
      player =>
        player.id ===
        myId
    );


  if (!me) {
    return;
  }


  const percent =
    Math.round(
      100 +
      (
        me.bunnyhop ||
        0
      ) *
      100
    );


  speedValue.textContent =
    `${percent}%`;


  speedHud.classList.toggle(
    "hidden",

    percent <
    108
  );
}


// ============================================================
// KEYBOARD
// ============================================================

window.addEventListener(
  "keydown",
  event => {
    if (
      document.activeElement ===
      nameInput
    ) {
      return;
    }


    const key =
      event.key.toLowerCase();


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
      ].includes(
        key
      )
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
      !keys.has(
        " "
      )
    ) {
      requestJump();
    }


    if (
      key === "e" &&
      !keys.has(
        "e"
      )
    ) {
      requestInteraction();
    }


    keys.add(
      key
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


// ============================================================
// MOVEMENT
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
    length >
    1
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

  1000 /
  30
);


// ============================================================
// JUMP / BHOP
// ============================================================

function requestJump() {
  if (
    !playing ||
    paused ||
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


// ============================================================
// INTERACTION
// ============================================================

function requestInteraction() {
  if (
    !playing ||
    paused ||
    !socket ||
    socket.readyState !==
    WebSocket.OPEN
  ) {
    return;
  }


  socket.send(
    JSON.stringify({
      type:
        "interact"
    })
  );
}


actionButton.addEventListener(
  "pointerdown",
  event => {
    event.preventDefault();

    requestInteraction();
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


  const size =
    105;


  const x =
    Math.max(
      zone.left +
      15,

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
      zone.top +
      15,

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
    x +
    size / 2;


  joystick.centerY =
    y +
    size / 2;
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
    36;


  const distance =
    Math.hypot(
      dx,
      dy
    );


  if (
    distance >
    max
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
    dx /
    max;


  joystick.y =
    dy /
    max;


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


function updateCamera(
  dt
) {
  const me =
    getMyRenderPlayer();


  if (!me) {
    return;
  }


  const factor =
    1 -
    Math.exp(
      -10 *
      dt
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

function isTouchDevice() {
  return window.matchMedia(
    "(pointer: coarse)"
  ).matches;
}


function getZoom() {
  let zoom =
    settings.zoom /
    100;


  if (
    isTouchDevice() &&
    screenWidth <
    700
  ) {
    zoom *=
      0.82;
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
      screenWidth /
      2,

    y:
      (
        y -
        camera.y
      ) *
      zoom +
      screenHeight /
      2
  };
}


// ============================================================
// FLOOR
// ============================================================

function drawFloor() {
  if (
    !currentMap
  ) {
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
    64;


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


  const endX =
    camera.x +
    screenWidth /
    zoom /
    2;


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
    x <= endX;
    x += tile
  ) {
    const p =
      worldToScreen(
        x,
        0
      );


    ctx.beginPath();

    ctx.moveTo(
      p.x,
      0
    );

    ctx.lineTo(
      p.x,
      screenHeight
    );

    ctx.stroke();
  }


  for (
    let y = startY;
    y <= endY;
    y += tile
  ) {
    const p =
      worldToScreen(
        0,
        y
      );


    ctx.beginPath();

    ctx.moveTo(
      0,
      p.y
    );

    ctx.lineTo(
      screenWidth,
      p.y
    );

    ctx.stroke();
  }


  if (
    currentMap.water
  ) {
    const p =
      worldToScreen(
        currentMap.water.x,
        currentMap.water.y
      );


    ctx.fillStyle =
      "#347993";


    ctx.fillRect(
      p.x,
      p.y,

      currentMap.water.w *
      zoom,

      currentMap.water.h *
      zoom
    );


    ctx.strokeStyle =
      "rgba(255,255,255,.10)";


    for (
      let y = 25;
      y < currentMap.water.h;
      y += 50
    ) {
      ctx.beginPath();


      ctx.moveTo(
        p.x +
        20,

        p.y +
        y *
        zoom
      );


      ctx.lineTo(
        p.x +
        currentMap.water.w *
        zoom -
        20,

        p.y +
        y *
        zoom
      );


      ctx.stroke();
    }
  }
}


// ============================================================
// RECT
// ============================================================

function drawRect(
  item,
  color
) {
  const p =
    worldToScreen(
      item.x,
      item.y
    );


  const zoom =
    getZoom();


  ctx.fillStyle =
    color;


  ctx.fillRect(
    p.x,
    p.y,

    item.w *
    zoom,

    item.h *
    zoom
  );
}


// ============================================================
// WALLS
// ============================================================

function drawWalls() {
  if (
    !currentMap
  ) {
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
      "rgba(0,0,0,.20)";


    ctx.fillRect(
      p.x +
      8 *
      zoom,

      p.y +
      8 *
      zoom,

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
        8 *
        zoom,

        wall.h *
        zoom
      )
    );
  }
}


// ============================================================
// REAL SWINGING DOORS
// ============================================================

function drawDoors() {
  if (
    !currentMap
  ) {
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
      ) ||
      0;


    const p =
      worldToScreen(
        door.x,
        door.y
      );


    const doorWidth =
      door.w *
      zoom;


    const doorThickness =
      14 *
      zoom;


    const hingeLeft =
      door.hinge !==
      "right";


    const hingeX =
      hingeLeft
        ? p.x
        : p.x +
          doorWidth;


    const hingeY =
      p.y +
      doorThickness /
      2;


    const direction =
      hingeLeft
        ? -1
        : 1;


    const angle =
      direction *
      amount *
      Math.PI /
      2;


    ctx.save();


    ctx.translate(
      hingeX,
      hingeY
    );


    ctx.rotate(
      angle
    );


    // Schatten
    ctx.fillStyle =
      "rgba(0,0,0,.25)";


    ctx.fillRect(
      hingeLeft
        ? 5
        : -doorWidth -
          5,

      5,

      doorWidth,
      doorThickness
    );


    // Holz
    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        doorWidth,
        0
      );


    gradient.addColorStop(
      0,
      "#74451f"
    );


    gradient.addColorStop(
      0.5,
      "#a66c32"
    );


    gradient.addColorStop(
      1,
      "#633817"
    );


    ctx.fillStyle =
      gradient;


    ctx.fillRect(
      hingeLeft
        ? 0
        : -doorWidth,

      -doorThickness /
      2,

      doorWidth,
      doorThickness
    );


    ctx.strokeStyle =
      "#4b2911";


    ctx.lineWidth =
      2 *
      zoom;


    ctx.strokeRect(
      hingeLeft
        ? 0
        : -doorWidth,

      -doorThickness /
      2,

      doorWidth,
      doorThickness
    );


    // Türklinke
    ctx.fillStyle =
      "#d4b36e";


    const knobX =
      hingeLeft
        ? doorWidth -
          15 *
          zoom
        : -doorWidth +
          15 *
          zoom;


    ctx.beginPath();


    ctx.arc(
      knobX,
      0,

      3.5 *
      zoom,

      0,
      Math.PI *
      2
    );


    ctx.fill();


    ctx.restore();


    // Scharnier
    ctx.fillStyle =
      "#35322e";


    ctx.beginPath();


    ctx.arc(
      hingeX,
      hingeY,

      4 *
      zoom,

      0,
      Math.PI *
      2
    );


    ctx.fill();
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
      "#50575a",

    crate:
      "#90683f",

    pallet:
      "#806040",

    shelf:
      "#555b5e",

    workbench:
      "#725538",

    desk:
      "#866f59",

    chair:
      "#3f4448",

    locker:
      "#68737a",

    powerbox:
      "#596269",

    vent:
      "#737b80",

    toolcart:
      "#b4483d",

    barrel:
      "#48555a",

    radio:
      "#34393d",

    terminal:
      "#3d4851",

    "container-red":
      "#b83e46",

    "container-blue":
      "#3e719b",

    "container-yellow":
      "#be8b38",

    forklift:
      "#c99b32",

    bollard:
      "#34383b",

    labtable:
      "#eef1f2",

    computer:
      "#49545d",

    serverrack:
      "#303840",

    scanner:
      "#829099"
  };


  return (
    colors[
      type
    ] ||
    "#666"
  );
}


function drawFurniture() {
  if (
    !currentMap
  ) {
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
      "rgba(0,0,0,.16)";


    ctx.fillRect(
      p.x +
      6 *
      zoom,

      p.y +
      7 *
      zoom,

      item.w *
      zoom,

      item.h *
      zoom
    );


    ctx.fillStyle =
      furnitureColor(
        item.type
      );


    ctx.fillRect(
      p.x,
      p.y,

      item.w *
      zoom,

      item.h *
      zoom
    );


    ctx.strokeStyle =
      "rgba(0,0,0,.18)";


    ctx.lineWidth =
      1.5 *
      zoom;


    ctx.strokeRect(
      p.x,
      p.y,

      item.w *
      zoom,

      item.h *
      zoom
    );


    // Container-Linien
    if (
      item.type.startsWith(
        "container"
      )
    ) {
      ctx.strokeStyle =
        "rgba(0,0,0,.24)";


      for (
        let lineX = 20;
        lineX < item.w;
        lineX += 28
      ) {
        ctx.beginPath();


        ctx.moveTo(
          p.x +
          lineX *
          zoom,

          p.y
        );


        ctx.lineTo(
          p.x +
          lineX *
          zoom,

          p.y +
          item.h *
          zoom
        );


        ctx.stroke();
      }
    }


    // Server LEDs
    if (
      item.type ===
      "serverrack"
    ) {
      ctx.fillStyle =
        worldState.powerOn
          ? "#58e6a0"
          : "#462f2f";


      for (
        let y = 15;
        y <
        item.h;
        y += 24
      ) {
        ctx.fillRect(
          p.x +
          10 *
          zoom,

          p.y +
          y *
          zoom,

          8 *
          zoom,

          3 *
          zoom
        );
      }
    }


    // Computerbildschirm
    if (
      item.type ===
      "computer" ||
      item.type ===
      "terminal"
    ) {
      ctx.fillStyle =
        worldState.powerOn
          ? "#5fd2ff"
          : "#192023";


      ctx.fillRect(
        p.x +
        15 *
        zoom,

        p.y +
        12 *
        zoom,

        Math.max(
          20,
          item.w -
          30
        ) *
        zoom,

        Math.min(
          26,
          item.h -
          20
        ) *
        zoom
      );
    }


    // Vent
    if (
      item.type ===
      "vent"
    ) {
      ctx.strokeStyle =
        "#383d40";


      for (
        let lineY = 8;
        lineY <
        item.h;
        lineY += 10
      ) {
        ctx.beginPath();


        ctx.moveTo(
          p.x +
          8 *
          zoom,

          p.y +
          lineY *
          zoom
        );


        ctx.lineTo(
          p.x +
          (
            item.w -
            8
          ) *
          zoom,

          p.y +
          lineY *
          zoom
        );


        ctx.stroke();
      }
    }
  }
}


// ============================================================
// INTERACTION MARKERS
// ============================================================

function drawInteractables() {
  if (
    !currentMap
  ) {
    return;
  }


  const me =
    getMyRenderPlayer();


  if (!me) {
    return;
  }


  for (
    const item
    of currentMap.interactables
  ) {
    const distance =
      Math.hypot(
        me.x -
        item.x,

        me.y -
        item.y
      );


    if (
      distance >
      135
    ) {
      continue;
    }


    const p =
      worldToScreen(
        item.x,
        item.y
      );


    const alpha =
      Math.max(
        0.2,

        1 -
        distance /
        150
      );


    ctx.save();


    ctx.globalAlpha =
      alpha;


    ctx.font =
      "700 11px system-ui";


    ctx.textAlign =
      "center";


    ctx.textBaseline =
      "middle";


    const text =
      isTouchDevice()
        ? `AKTION · ${item.label}`
        : `E · ${item.label}`;


    const width =
      ctx.measureText(
        text
      ).width +
      20;


    ctx.fillStyle =
      "rgba(10,11,14,.80)";


    ctx.beginPath();


    ctx.roundRect(
      p.x -
      width /
      2,

      p.y -
      45,

      width,
      27,

      8
    );


    ctx.fill();


    ctx.fillStyle =
      "#ffffff";


    ctx.fillText(
      text,
      p.x,
      p.y -
      31
    );


    ctx.restore();
  }
}


// ============================================================
// CHECKPOINTS
// ============================================================

function drawCheckpoints() {
  if (
    !currentMap
  ) {
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
      "rgba(255,255,255,.10)";


    ctx.lineWidth =
      2;


    ctx.beginPath();


    ctx.arc(
      p.x,
      p.y,

      checkpoint.radius *
      zoom,

      0,
      Math.PI *
      2
    );


    ctx.stroke();
  }
}


// ============================================================
// PLAYER
// ============================================================

function drawPlayer(
  player
) {
  const me =
    player.id ===
    myId;


  if (
    player.hidden &&
    !me
  ) {
    return;
  }


  const p =
    worldToScreen(
      player.x,
      player.y
    );


  const zoom =
    getZoom();


  const jump =
    (
      player.jumpHeight ||
      0
    ) *
    zoom;


  const bodyY =
    p.y -
    jump;


  ctx.save();


  if (
    player.hidden &&
    me
  ) {
    ctx.globalAlpha =
      0.35;
  }


  // Schatten
  ctx.fillStyle =
    "rgba(0,0,0,.23)";


  ctx.beginPath();


  ctx.ellipse(
    p.x,
    p.y +
    15 *
    zoom,

    18 *
    zoom,

    7 *
    zoom,

    0,
    0,
    Math.PI *
    2
  );


  ctx.fill();


  // Körper
  ctx.fillStyle =
    me
      ? "#e33b46"
      : "#42484c";


  ctx.beginPath();


  ctx.arc(
    p.x,
    bodyY,

    18 *
    zoom,

    0,
    Math.PI *
    2
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


  // Highlight
  ctx.fillStyle =
    "rgba(255,255,255,.88)";


  ctx.beginPath();


  ctx.arc(
    p.x -
    6 *
    zoom,

    bodyY -
    6 *
    zoom,

    4 *
    zoom,

    0,
    Math.PI *
    2
  );


  ctx.fill();


  // Name
  ctx.font =
    `700 ${Math.max(
      10,
      12 *
      zoom
    )}px system-ui`;


  ctx.textAlign =
    "center";


  ctx.textBaseline =
    "bottom";


  ctx.strokeStyle =
    "rgba(0,0,0,.70)";


  ctx.lineWidth =
    4;


  ctx.strokeText(
    player.name ||
    "Spieler",

    p.x,

    bodyY -
    26 *
    zoom
  );


  ctx.fillStyle =
    "#ffffff";


  ctx.fillText(
    player.name ||
    "Spieler",

    p.x,

    bodyY -
    26 *
    zoom
  );


  ctx.restore();
}


// ============================================================
// LIGHTING
// ============================================================

function drawLighting() {
  if (
    !playing ||
    !currentMap ||
    worldState.lightsOn
  ) {
    return;
  }


  ctx.save();


  ctx.fillStyle =
    "rgba(4,7,10,.67)";


  ctx.fillRect(
    0,
    0,
    screenWidth,
    screenHeight
  );


  const me =
    getMyRenderPlayer();


  if (
    me
  ) {
    const p =
      worldToScreen(
        me.x,
        me.y
      );


    ctx.globalCompositeOperation =
      "destination-out";


    const gradient =
      ctx.createRadialGradient(
        p.x,
        p.y,

        20,

        p.x,
        p.y,

        180
      );


    gradient.addColorStop(
      0,
      "rgba(0,0,0,.95)"
    );


    gradient.addColorStop(
      1,
      "rgba(0,0,0,0)"
    );


    ctx.fillStyle =
      gradient;


    ctx.beginPath();


    ctx.arc(
      p.x,
      p.y,
      180,
      0,
      Math.PI *
      2
    );


    ctx.fill();
  }


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


  if (
    currentMap.water
  ) {
    minimapCtx.fillStyle =
      "#34758f";


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


  minimapCtx.fillStyle =
    "#777c80";


  for (
    const wall
    of currentMap.walls
  ) {
    minimapCtx.fillRect(
      wall.x *
      scaleX,

      wall.y *
      scaleY,

      wall.w *
      scaleX,

      wall.h *
      scaleY
    );
  }


  for (
    const player
    of renderPlayers.values()
  ) {
    if (
      player.hidden &&
      player.id !==
      myId
    ) {
      continue;
    }


    minimapCtx.beginPath();


    minimapCtx.arc(
      player.x *
      scaleX,

      player.y *
      scaleY,

      player.id ===
      myId
        ? 5
        : 3,

      0,
      Math.PI *
      2
    );


    minimapCtx.fillStyle =
      player.id ===
      myId
        ? "#ee3f4a"
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

    width -
    2,

    height -
    2
  );
}


// ============================================================
// WORLD BORDER
// ============================================================

function drawWorldBorder() {
  if (
    !currentMap
  ) {
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
    "rgba(0,0,0,.35)";


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
// RENDER
// ============================================================

function render(
  time
) {
  const dt =
    Math.min(
      (
        time -
        lastFrameTime
      ) /
      1000,

      0.05
    );


  lastFrameTime =
    time;


  smoothPlayers(
    dt
  );


  updateCamera(
    dt
  );


  drawFloor();

  drawCheckpoints();

  drawWalls();

  drawDoors();

  drawFurniture();


  const sorted =
    [
      ...renderPlayers.values()
    ].sort(
      (
        a,
        b
      ) =>
        a.y -
        b.y
    );


  for (
    const player
    of sorted
  ) {
    drawPlayer(
      player
    );
  }


  drawInteractables();

  drawWorldBorder();

  drawLighting();

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
