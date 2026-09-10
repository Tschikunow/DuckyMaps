"use strict";

// ============================================================
// DUCKYMAPS V4.9 CLIENT
// SURVIVAL / HP / POTIONS / FISH / HIDEOUTS
// ============================================================

const $ =
  id =>
    document.getElementById(
      id
    );


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


const introScreen = $("introScreen");
const mainMenu = $("mainMenu");
const mapsMenu = $("mapsMenu");
const settingsMenu = $("settingsMenu");
const mapIntro = $("mapIntro");
const gameHud = $("gameHud");
const pauseMenu = $("pauseMenu");

const playButton = $("playButton");
const mapsButton = $("mapsButton");
const settingsButton = $("settingsButton");
const mapsBackButton = $("mapsBackButton");
const settingsBackButton = $("settingsBackButton");
const saveSettingsButton = $("saveSettingsButton");

const pauseButton = $("pauseButton");
const continueButton = $("continueButton");
const pauseSettingsButton = $("pauseSettingsButton");
const exitButton = $("exitButton");

const jumpButton = $("jumpButton");
const actionButton = $("actionButton");

const onlineCount = $("onlineCount");
const hudPlayers = $("hudPlayers");
const connectionText = $("connectionText");
const connectionDot = $("connectionDot");

const hudMapName = $("hudMapName");
const playMapName = $("playMapName");
const introMapName = $("introMapName");
const introMapSubtitle = $("introMapSubtitle");

const profileName = $("profileName");
const profileCoins = $("profileCoins");
const coinCount = $("coinCount");

const playerListPanel = $("playerListPanel");
const playerList = $("playerList");
const minimapPanel = $("minimapPanel");

const speedHud = $("speedHud");
const speedValue = $("speedValue");

const notifications = $("notifications");

const nameInput = $("nameInput");
const themeSelect = $("themeSelect");
const minimapToggle = $("minimapToggle");
const playerListToggle = $("playerListToggle");
const zoomSlider = $("zoomSlider");
const zoomValue = $("zoomValue");
const musicToggle = $("musicToggle");
const musicVolume = $("musicVolume");
const musicVolumeValue = $("musicVolumeValue");
const soundToggle = $("soundToggle");

const moveZone = $("moveZone");
const joystickElement = $("joystick");
const joystickStick = $("joystickStick");


// ============================================================
// SURVIVAL HUD
// Wird dynamisch erstellt.
// index.html muss nicht geändert werden.
// ============================================================

const survivalHud =
  document.createElement(
    "div"
  );


survivalHud.id =
  "survivalHud";


survivalHud.innerHTML = `
  <div id="statusBadges">
    <span id="hideBadge">VERSTECKT</span>
    <span id="speedBadge">⚡ SPEED</span>
  </div>

  <div id="fishHud">
    <span class="fishIcon">🐟</span>
    <span id="fishCount">0</span>
  </div>

  <div id="hpLabel">
    <span>HP</span>
    <strong id="hpText">100 / 100</strong>
  </div>

  <div id="hpTrack">
    <div id="hpFill"></div>
  </div>
`;


document.body.appendChild(
  survivalHud
);


const hudStyle =
  document.createElement(
    "style"
  );


hudStyle.textContent = `
  #survivalHud {
    position: fixed;
    right: max(18px, env(safe-area-inset-right));
    bottom: max(20px, env(safe-area-inset-bottom));
    width: min(260px, calc(100vw - 40px));
    z-index: 120;
    color: white;
    font-family: system-ui, sans-serif;
    pointer-events: none;
    display: none;
  }

  #survivalHud.active {
    display: block;
  }

  #hpLabel {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: .08em;
    text-shadow: 0 2px 5px rgba(0,0,0,.7);
  }

  #hpTrack {
    height: 15px;
    border-radius: 999px;
    overflow: hidden;
    background: rgba(10,12,14,.75);
    border: 2px solid rgba(255,255,255,.75);
    box-shadow: 0 4px 14px rgba(0,0,0,.3);
  }

  #hpFill {
    width: 100%;
    height: 100%;
    background:
      linear-gradient(
        90deg,
        #dc3345,
        #f0525f
      );
    transition:
      width .2s ease,
      background .2s ease;
  }

  #fishHud {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 5px;
    margin-bottom: 7px;
    font-weight: 900;
    font-size: 15px;
    text-shadow: 0 2px 5px rgba(0,0,0,.7);
  }

  #statusBadges {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    min-height: 25px;
    margin-bottom: 5px;
  }

  #hideBadge,
  #speedBadge {
    display: none;
    padding: 5px 8px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: .06em;
  }

  #hideBadge.active {
    display: inline-block;
    background: rgba(42,48,55,.9);
    border: 1px solid rgba(255,255,255,.35);
  }

  #speedBadge.active {
    display: inline-block;
    background: rgba(43,151,84,.92);
    border: 1px solid rgba(145,255,178,.65);
  }

  @media (max-width: 600px) {
    #survivalHud {
      width: 180px;
      right: max(14px, env(safe-area-inset-right));
      bottom: max(128px, calc(env(safe-area-inset-bottom) + 110px));
    }

    #hpTrack {
      height: 13px;
    }

    #hpLabel {
      font-size: 10px;
    }
  }
`;


document.head.appendChild(
  hudStyle
);


const hpText =
  $("hpText");

const hpFill =
  $("hpFill");

const fishCount =
  $("fishCount");

const hideBadge =
  $("hideBadge");

const speedBadge =
  $("speedBadge");


let myHp = 100;
let myMaxHp = 100;
let myFish = 0;


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
  ) ||
  "industry";


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

let currentMap = null;

let serverPlayers = [];

let currentDoorStates = {};

let worldState = {
  lightsOn: true,
  powerOn: true,
  alarmOn: false,
  interactables: {},
  noise: null
};


let playing = false;
let paused = false;
let settingsFromPause = false;

let coins = 0;


const renderPlayers =
  new Map();


const camera = {
  x: 0,
  y: 0
};


let lastFrameTime =
  performance.now();


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
// AUTO JUMP
// ============================================================

let jumpHeld = false;

let jumpPointerId = null;

let lastJumpRequest = 0;

const AUTO_JUMP_INTERVAL =
  70;


// ============================================================
// AUDIO
// ============================================================

let audioContext = null;
let musicGain = null;


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


  for (
    const frequency
    of [
      73,
      110,
      146
    ]
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
        ? volume *
          0.22
        : 0,

      audioContext.currentTime,

      0.12
    );
}


function shortTone(
  frequency,
  duration,
  volume
) {
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
    audioContext
      .createOscillator();


  const gain =
    audioContext
      .createGain();


  oscillator.frequency.value =
    frequency;


  gain.gain.setValueAtTime(
    volume,
    audioContext.currentTime
  );


  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime +
      duration
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
      duration
  );
}


function uiSound() {
  shortTone(
    430,
    0.06,
    0.025
  );
}


function jumpSound() {
  shortTone(
    210,
    0.09,
    0.035
  );
}


function bellSound() {
  shortTone(
    760,
    0.22,
    0.06
  );
}


function potionSound() {
  shortTone(
    540,
    0.13,
    0.04
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
// MENUS
// ============================================================

playButton.addEventListener(
  "click",
  () => {
    ensureAudio();
    startGame();
    uiSound();
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


  stopAutoJump();


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
    openSettings(
      false
    );
  }
);


pauseSettingsButton.addEventListener(
  "click",
  () => {
    openSettings(
      true
    );
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


  stopAutoJump();


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


  survivalHud.classList.add(
    "active"
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
  if (!playing) {
    return;
  }


  paused = true;

  stopAutoJump();


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


    stopAutoJump();


    keys.clear();


    input.x = 0;
    input.y = 0;


    survivalHud.classList.remove(
      "active"
    );


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


      if (
        playing
      ) {
        socket.send(
          JSON.stringify({
            type:
              "joinMap",

            mapId:
              selectedMap
          })
        );
      }
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
      stopAutoJump();


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
      onlineCount.textContent =
        `${
          Number(
            message.online
          ) || 0
        } SPIELER ONLINE`;

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

      updatePlayerStatus();

      return;
    }


    if (
      message.type ===
      "playerState"
    ) {
      setCoins(
        message.coins
      );


      myHp =
        Number(
          message.hp
        ) || 100;


      myMaxHp =
        Number(
          message.maxHp
        ) || 100;


      myFish =
        Number(
          message.fish
        ) || 0;


      updateSurvivalHud();

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
      if (
        message.text.includes(
          "DING"
        )
      ) {
        bellSound();
      }


      showNotification(
        message.text
      );

      return;
    }


    if (
      message.type ===
      "vendingLoot"
    ) {
      if (
        Number.isFinite(
          Number(
            message.hp
          )
        )
      ) {
        myHp =
          Number(
            message.hp
          );
      }


      if (
        Number.isFinite(
          Number(
            message.maxHp
          )
        )
      ) {
        myMaxHp =
          Number(
            message.maxHp
          );
      }


      if (
        Number.isFinite(
          Number(
            message.fish
          )
        )
      ) {
        myFish =
          Number(
            message.fish
          );
      }


      updateSurvivalHud();

      potionSound();


      if (
        message.loot ===
        "heal"
      ) {
        showLootNotification(
          "🧪",
          message.text
        );
      }


      if (
        message.loot ===
        "speed"
      ) {
        showLootNotification(
          "🍾",
          message.text
        );
      }


      if (
        message.loot ===
        "fish"
      ) {
        showLootNotification(
          "🐟",
          message.text
        );
      }
    }

  } catch {
    // Ignore invalid message.
  }
}


// ============================================================
// HUD
// ============================================================

function updatePlayerStatus() {
  const me =
    serverPlayers.find(
      player =>
        player.id ===
        myId
    );


  if (!me) {
    return;
  }


  myHp =
    Number(
      me.hp
    ) || 0;


  myMaxHp =
    Number(
      me.maxHp
    ) || 100;


  myFish =
    Number(
      me.fish
    ) || 0;


  hideBadge.classList.toggle(
    "active",
    Boolean(
      me.hidden
    )
  );


  speedBadge.classList.toggle(
    "active",
    Boolean(
      me.speedBoosted
    )
  );


  const actualSpeed =
    Math.hypot(
      me.vx || 0,
      me.vy || 0
    );


  const percent =
    Math.round(
      actualSpeed /
      175 *
      100
    );


  speedValue.textContent =
    `${percent}%`;


  speedHud.classList.toggle(
    "hidden",
    percent < 110
  );


  updateSurvivalHud();
}


function updateSurvivalHud() {
  hpText.textContent =
    `${myHp} / ${myMaxHp}`;


  fishCount.textContent =
    String(
      myFish
    );


  const percent =
    Math.max(
      0,
      Math.min(
        100,
        myHp /
        myMaxHp *
        100
      )
    );


  hpFill.style.width =
    `${percent}%`;


  if (
    percent >
    60
  ) {
    hpFill.style.background =
      "linear-gradient(90deg,#d93646,#ef5360)";
  } else if (
    percent >
    30
  ) {
    hpFill.style.background =
      "linear-gradient(90deg,#e28c30,#efb344)";
  } else {
    hpFill.style.background =
      "linear-gradient(90deg,#a71f2d,#e12d3f)";
  }
}


function showLootNotification(
  icon,
  text
) {
  const element =
    document.createElement(
      "div"
    );


  element.className =
    "notification reward";


  element.textContent =
    `${icon} ${text}`;


  notifications.appendChild(
    element
  );


  setTimeout(
    () => {
      element.remove();
    },

    3000
  );
}


// ============================================================
// PLAYER DATA
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


function setCoins(
  value
) {
  coins =
    Number(
      value
    ) || 0;


  coinCount.textContent =
    String(
      coins
    );


  profileCoins.textContent =
    String(
      coins
    );
}


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
// NETWORK SMOOTHING
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

        x:
          player.x,

        y:
          player.y,

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


    const prediction =
      0.035;


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


    Object.assign(
      renderPlayer,
      {
        name:
          player.name,

        vx:
          player.vx || 0,

        vy:
          player.vy || 0,

        hidden:
          Boolean(
            player.hidden
          ),

        hp:
          player.hp,

        maxHp:
          player.maxHp,

        fish:
          player.fish,

        speedBoosted:
          Boolean(
            player.speedBoosted
          ),

        bunnyhopChain:
          player.bunnyhopChain ||
          0
      }
    );
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
      -17 *
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
      player.id ===
      myId
        ? "playerDot me"
        : "playerDot";


    const name =
      document.createElement(
        "span"
      );


    name.textContent =
      player.id ===
      myId
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
      key ===
      " "
    ) {
      if (
        !jumpHeld
      ) {
        startAutoJump();
      }


      keys.add(
        key
      );

      return;
    }


    if (
      key ===
        "e" &&
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
    const key =
      event.key.toLowerCase();


    keys.delete(
      key
    );


    if (
      key ===
      " "
    ) {
      stopAutoJump();
    }
  }
);


window.addEventListener(
  "blur",
  () => {
    keys.clear();

    stopAutoJump();
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
  1000 / 30
);


// ============================================================
// AUTO BUNNYHOP
// ============================================================

function sendJumpRequest(
  sound = false
) {
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


  lastJumpRequest =
    performance.now();


  if (
    sound
  ) {
    jumpSound();
  }
}


function startAutoJump() {
  if (
    !playing ||
    paused
  ) {
    return;
  }


  jumpHeld =
    true;


  sendJumpRequest(
    true
  );
}


function stopAutoJump() {
  jumpHeld =
    false;


  jumpPointerId =
    null;
}


function updateAutoJump(
  time
) {
  if (
    !jumpHeld ||
    !playing ||
    paused
  ) {
    return;
  }


  if (
    time -
    lastJumpRequest >=
    AUTO_JUMP_INTERVAL
  ) {
    sendJumpRequest(
      false
    );
  }
}


jumpButton.addEventListener(
  "pointerdown",
  event => {
    event.preventDefault();


    jumpPointerId =
      event.pointerId;


    try {
      jumpButton.setPointerCapture(
        event.pointerId
      );
    } catch {}


    startAutoJump();
  }
);


jumpButton.addEventListener(
  "pointerup",
  stopAutoJump
);


jumpButton.addEventListener(
  "pointercancel",
  stopAutoJump
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


  uiSound();
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
// CAMERA / ZOOM
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
      -11 *
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


  ctx.lineWidth =
    1;


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
  }
}


// ============================================================
// DECORATIONS
// ============================================================

function drawDecorations() {
  if (
    !currentMap ||
    !currentMap.decorations
  ) {
    return;
  }


  const zoom =
    getZoom();


  for (
    const item
    of currentMap.decorations
  ) {
    const p =
      worldToScreen(
        item.x,
        item.y
      );


    if (
      item.type ===
        "yellowStripe" ||
      item.type ===
        "roadStripe"
    ) {
      ctx.fillStyle =
        "#d6b637";


      ctx.fillRect(
        p.x,
        p.y,
        item.w * zoom,
        item.h * zoom
      );
    }


    if (
      item.type ===
      "dockLine"
    ) {
      ctx.fillStyle =
        "#e9dd8a";


      ctx.fillRect(
        p.x,
        p.y,
        item.w * zoom,
        item.h * zoom
      );
    }


    if (
      item.type ===
      "waterWave"
    ) {
      ctx.fillStyle =
        "rgba(255,255,255,.12)";


      ctx.fillRect(
        p.x,
        p.y,
        item.w * zoom,
        2 * zoom
      );
    }


    if (
      item.type ===
      "oil"
    ) {
      ctx.fillStyle =
        "rgba(25,28,28,.24)";


      ctx.beginPath();


      ctx.ellipse(
        p.x +
          item.w *
          zoom /
          2,

        p.y +
          item.h *
          zoom /
          2,

        item.w *
          zoom /
          2,

        item.h *
          zoom /
          2,

        0.2,
        0,
        Math.PI * 2
      );


      ctx.fill();
    }


    if (
      item.type ===
        "cable" ||
      item.type ===
        "pipe"
    ) {
      ctx.fillStyle =
        item.type ===
        "pipe"
          ? "#596368"
          : "#292a2d";


      ctx.fillRect(
        p.x,
        p.y,
        item.w * zoom,
        item.h * zoom
      );
    }


    if (
      item.type ===
        "warningBox" ||
      item.type ===
        "hazardStripe"
    ) {
      ctx.fillStyle =
        "rgba(216,175,44,.2)";


      ctx.fillRect(
        p.x,
        p.y,
        item.w * zoom,
        item.h * zoom
      );


      ctx.strokeStyle =
        "#c5a331";


      ctx.strokeRect(
        p.x,
        p.y,
        item.w * zoom,
        item.h * zoom
      );
    }


    if (
      item.type ===
        "floorPlate" ||
      item.type ===
        "glassFloor"
    ) {
      ctx.fillStyle =
        item.type ===
        "glassFloor"
          ? "rgba(95,180,210,.12)"
          : "rgba(30,35,38,.08)";


      ctx.fillRect(
        p.x,
        p.y,
        item.w * zoom,
        item.h * zoom
      );
    }


    if (
      item.type ===
      "labLine"
    ) {
      ctx.fillStyle =
        "#735ed0";


      ctx.fillRect(
        p.x,
        p.y,
        item.w * zoom,
        item.h * zoom
      );
    }


    if (
      item.type ===
      "sign"
    ) {
      ctx.fillStyle =
        "rgba(20,22,25,.8)";


      ctx.fillRect(
        p.x,
        p.y,
        item.w * zoom,
        item.h * zoom
      );


      ctx.fillStyle =
        "#fff";


      ctx.font =
        `800 ${Math.max(
          8,
          12 * zoom
        )}px system-ui`;


      ctx.textAlign =
        "center";


      ctx.textBaseline =
        "middle";


      ctx.fillText(
        item.text || "",

        p.x +
          item.w *
          zoom /
          2,

        p.y +
          item.h *
          zoom /
          2
      );
    }
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
      "rgba(0,0,0,.2)";


    ctx.fillRect(
      p.x +
        8 * zoom,

      p.y +
        8 * zoom,

      wall.w * zoom,

      wall.h * zoom
    );


    ctx.fillStyle =
      currentMap.colors.wall;


    ctx.fillRect(
      p.x,
      p.y,

      wall.w * zoom,

      wall.h * zoom
    );


    ctx.fillStyle =
      currentMap.colors.wallTop;


    ctx.fillRect(
      p.x,
      p.y,

      wall.w * zoom,

      Math.min(
        8 * zoom,
        wall.h * zoom
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


    const width =
      door.w *
      zoom;


    const thickness =
      15 *
      zoom;


    const left =
      door.hinge !==
      "right";


    const hingeX =
      left
        ? p.x
        : p.x + width;


    const hingeY =
      p.y +
      thickness / 2;


    const angle =
      (
        left
          ? -1
          : 1
      ) *
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


    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        width,
        0
      );


    gradient.addColorStop(
      0,
      "#553014"
    );


    gradient.addColorStop(
      0.5,
      "#9c622e"
    );


    gradient.addColorStop(
      1,
      "#613817"
    );


    ctx.fillStyle =
      gradient;


    ctx.fillRect(
      left
        ? 0
        : -width,

      -thickness / 2,

      width,
      thickness
    );


    ctx.strokeStyle =
      "#3d210e";


    ctx.lineWidth =
      2 * zoom;


    ctx.strokeRect(
      left
        ? 0
        : -width,

      -thickness / 2,

      width,
      thickness
    );


    ctx.fillStyle =
      "#d6b36b";


    ctx.beginPath();


    ctx.arc(
      left
        ? width -
          14 * zoom
        : -width +
          14 * zoom,

      0,

      3.5 * zoom,

      0,
      Math.PI * 2
    );


    ctx.fill();


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
    machine: "#52595d",
    compressor: "#4e5d63",
    generator: "#3f4a50",
    crate: "#91663b",
    pallet: "#806044",
    shelf: "#555b5e",
    workbench: "#745537",
    desk: "#86705a",
    chair: "#404549",
    locker: "#68747b",
    hideCabinet: "#646f75",
    cabinet: "#59636a",
    chemicalCabinet: "#d5c33b",
    powerbox: "#596269",
    electricalCabinet: "#57656b",
    vent: "#737b80",
    toolcart: "#b3483d",
    barrel: "#455359",
    warningCone: "#e07b2f",
    coffee: "#4b3c31",
    trash: "#444c50",
    fan: "#586268",
    conveyor: "#596167",
    computer: "#45515a",
    terminal: "#3d4851",
    serverrack: "#303840",
    scanner: "#829099",
    microscope: "#d9dcde",
    sampleRack: "#8aa2ad",
    plant: "#3e7552",
    emergency: "#c83d40",
    medicalCart: "#ced7db",
    vending: "#39474a",
    bell: "#b8943d",
    alarm: "#b63a40",
    pipeStack: "#59646a",

    "container-red": "#b83e46",
    "container-blue": "#3e719b",
    "container-yellow": "#be8b38",

    forklift: "#c99b32",
    bollard: "#34383b",
    radio: "#34393d",
    rope: "#a58b58",
    lifeRing: "#da583f",
    cranePanel: "#4c5a62",
    bench: "#6f5b45",
    labtable: "#eef1f2"
  };


  return (
    colors[
      type
    ] ||
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
      "rgba(0,0,0,.16)";


    ctx.fillRect(
      p.x +
        6 * zoom,

      p.y +
        7 * zoom,

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
      "rgba(0,0,0,.2)";


    ctx.strokeRect(
      p.x,
      p.y,

      item.w * zoom,

      item.h * zoom
    );


    // ========================================================
    // VENDING MACHINE
    // Green glass bottles visible inside
    // ========================================================

    if (
      item.type ===
      "vending"
    ) {
      ctx.fillStyle =
        "#182225";


      ctx.fillRect(
        p.x +
          10 * zoom,

        p.y +
          10 * zoom,

        (
          item.w -
          20
        ) *
          zoom,

        58 * zoom
      );


      for (
        let row = 0;
        row < 2;
        row++
      ) {
        for (
          let column = 0;
          column < 3;
          column++
        ) {
          const bottleX =
            p.x +
            (
              18 +
              column *
              16
            ) *
            zoom;


          const bottleY =
            p.y +
            (
              18 +
              row *
              25
            ) *
            zoom;


          ctx.fillStyle =
            "rgba(65,220,105,.8)";


          ctx.fillRect(
            bottleX,
            bottleY +
              6 * zoom,

            8 * zoom,
            13 * zoom
          );


          ctx.fillStyle =
            "rgba(130,255,160,.9)";


          ctx.fillRect(
            bottleX +
              2 * zoom,

            bottleY,

            4 * zoom,
            7 * zoom
          );
        }
      }


      ctx.fillStyle =
        "#53db7e";


      ctx.fillRect(
        p.x +
          12 * zoom,

        p.y +
          78 * zoom,

        (
          item.w -
          24
        ) *
          zoom,

        8 * zoom
      );
    }


    if (
      item.type ===
      "locker" ||
      item.type ===
      "hideCabinet"
    ) {
      ctx.strokeStyle =
        "rgba(255,255,255,.18)";


      ctx.beginPath();


      ctx.moveTo(
        p.x +
          item.w *
          zoom /
          2,

        p.y
      );


      ctx.lineTo(
        p.x +
          item.w *
          zoom /
          2,

        p.y +
          item.h *
          zoom
      );


      ctx.stroke();


      ctx.fillStyle =
        "#30383c";


      ctx.beginPath();


      ctx.arc(
        p.x +
          item.w *
          zoom *
          0.75,

        p.y +
          item.h *
          zoom /
          2,

        2.5 * zoom,

        0,
        Math.PI * 2
      );


      ctx.fill();
    }


    if (
      item.type ===
      "vent"
    ) {
      ctx.strokeStyle =
        "#373d40";


      for (
        let y = 8;
        y < item.h;
        y += 10
      ) {
        ctx.beginPath();


        ctx.moveTo(
          p.x +
            8 * zoom,

          p.y +
            y * zoom
        );


        ctx.lineTo(
          p.x +
            (
              item.w -
              8
            ) *
            zoom,

          p.y +
            y * zoom
        );


        ctx.stroke();
      }
    }


    if (
      item.type.startsWith(
        "container"
      )
    ) {
      ctx.strokeStyle =
        "rgba(0,0,0,.25)";


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
          12 * zoom,

        p.y +
          10 * zoom,

        Math.max(
          20,
          item.w - 24
        ) *
          zoom,

        Math.min(
          25,
          item.h - 18
        ) *
          zoom
      );
    }


    if (
      item.type ===
      "serverrack"
    ) {
      ctx.fillStyle =
        worldState.powerOn
          ? "#57e39c"
          : "#3c3333";


      for (
        let y = 15;
        y < item.h;
        y += 22
      ) {
        ctx.fillRect(
          p.x +
            10 * zoom,

          p.y +
            y * zoom,

          8 * zoom,

          3 * zoom
        );
      }
    }


    if (
      item.type ===
      "bell"
    ) {
      ctx.fillStyle =
        "#d7b34f";


      ctx.beginPath();


      ctx.arc(
        p.x +
          item.w *
          zoom /
          2,

        p.y +
          item.h *
          zoom /
          2,

        15 * zoom,

        0,
        Math.PI * 2
      );


      ctx.fill();
    }
  }
}


// ============================================================
// INTERACTIONS
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


  let nearest =
    null;


  let bestDistance =
    Infinity;


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
      distance <
      bestDistance
    ) {
      nearest =
        item;

      bestDistance =
        distance;
    }
  }


  if (
    !nearest ||
    bestDistance >
    145
  ) {
    return;
  }


  const p =
    worldToScreen(
      nearest.x,
      nearest.y
    );


  const text =
    isTouchDevice()
      ? `AKTION · ${nearest.label}`
      : `E · ${nearest.label}`;


  ctx.font =
    "700 11px system-ui";


  ctx.textAlign =
    "center";


  ctx.textBaseline =
    "middle";


  const width =
    ctx.measureText(
      text
    ).width +
    20;


  ctx.fillStyle =
    "rgba(10,11,14,.88)";


  ctx.beginPath();


  ctx.roundRect(
    p.x -
      width / 2,

    p.y -
      48,

    width,

    28,

    8
  );


  ctx.fill();


  ctx.fillStyle =
    "#fff";


  ctx.fillText(
    text,
    p.x,
    p.y - 34
  );
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
      0.3;
  }


  ctx.fillStyle =
    "rgba(0,0,0,.24)";


  ctx.beginPath();


  ctx.ellipse(
    p.x,
    p.y +
      15 * zoom,

    18 * zoom,
    7 * zoom,

    0,
    0,
    Math.PI * 2
  );


  ctx.fill();


  ctx.fillStyle =
    me
      ? "#e33b46"
      : "#42484c";


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
      ? "#fff"
      : "rgba(255,255,255,.6)";


  ctx.lineWidth =
    me
      ? 2.5
      : 1.5;


  ctx.stroke();


  ctx.font =
    `700 ${Math.max(
      10,
      12 * zoom
    )}px system-ui`;


  ctx.textAlign =
    "center";


  ctx.strokeStyle =
    "rgba(0,0,0,.7)";


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
    "#fff";


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
// LIGHTING
// ============================================================

function drawLighting() {
  if (
    !playing ||
    !currentMap
  ) {
    return;
  }


  if (
    worldState.alarmOn
  ) {
    const pulse =
      (
        Math.sin(
          performance.now() /
          180
        ) +
        1
      ) /
      2;


    ctx.fillStyle =
      `rgba(190,20,25,${
        0.05 +
        pulse *
        0.08
      })`;


    ctx.fillRect(
      0,
      0,
      screenWidth,
      screenHeight
    );
  }


  if (
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
      Math.PI * 2
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
      wall.x * scaleX,
      wall.y * scaleY,
      wall.w * scaleX,
      wall.h * scaleY
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
      player.x * scaleX,
      player.y * scaleY,

      player.id ===
      myId
        ? 5
        : 3,

      0,
      Math.PI * 2
    );


    minimapCtx.fillStyle =
      player.id ===
      myId
        ? "#ee3f4a"
        : "#fff";


    minimapCtx.fill();
  }
}


// ============================================================
// CAMERA
// ============================================================

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
      -11 *
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


  updateAutoJump(
    time
  );


  smoothPlayers(
    dt
  );


  updateCamera(
    dt
  );


  drawFloor();
  drawDecorations();
  drawWalls();
  drawDoors();
  drawFurniture();


  const sortedPlayers =
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
    of sortedPlayers
  ) {
    drawPlayer(
      player
    );
  }


  drawInteractables();
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
