"use strict";

const $ = (selector) =>
  document.querySelector(selector);

const $$ = (selector) =>
  [...document.querySelectorAll(selector)];

const canvas = $("#gameCanvas");
const ctx = canvas.getContext("2d", {
  alpha: false
});

const minimap = $("#minimap");
const minimapCtx =
  minimap.getContext("2d");

const mainMenu = $("#mainMenu");
const panelOverlay = $("#panelOverlay");
const gameScreen = $("#gameScreen");
const pauseMenu = $("#pauseMenu");
const pianoOverlay = $("#pianoOverlay");
const voteOverlay = $("#voteOverlay");
const joinOverlay = $("#joinOverlay");

const networkStatus = $("#networkStatus");
const accountBadge = $("#accountBadge");

const mapGrid = $("#mapGrid");
const lockerGrid = $("#lockerGrid");
const shopGrid = $("#shopGrid");
const battlePassGrid = $("#battlePassGrid");
const bestiaryGrid = $("#bestiaryGrid");

const selectedMapTitle =
  $("#selectedMapTitle");

const selectedMapDescription =
  $("#selectedMapDescription");

const selectedModeLabel =
  $("#selectedModeLabel");

const selectedBotsLabel =
  $("#selectedBotsLabel");

const modeSelect = $("#modeSelect");
const minigameSelect = $("#minigameSelect");
const botCount = $("#botCount");
const botCountValue = $("#botCountValue");
const monsterSelect = $("#monsterSelect");

const bhopToggle = $("#bhopToggle");
const eventsToggle = $("#eventsToggle");
const privateToggle = $("#privateToggle");
const splitToggle = $("#splitToggle");

const displayName = $("#displayName");
const musicSelect = $("#musicSelect");
const musicVolume = $("#musicVolume");
const musicEnabled = $("#musicEnabled");
const minimapEnabled = $("#minimapEnabled");
const chatEnabled = $("#chatEnabled");
const voiceEnabled = $("#voiceEnabled");
const themeSelect = $("#themeSelect");

const gameModeText = $("#gameModeText");
const gameMapText = $("#gameMapText");
const serverCodeText = $("#serverCodeText");

const hpText = $("#hpText");
const hpFill = $("#hpFill");
const fishHud = $("#fishHud");
const statusHud = $("#statusHud");
const petHud = $("#petHud");
const bossHud = $("#bossHud");
const bossBar = $("#bossBar");

const downedOverlay = $("#downedOverlay");

const notifications = $("#notifications");

const interactionPrompt =
  $("#interactionPrompt");

const chat = $("#chat");
const chatLog = $("#chatLog");
const chatForm = $("#chatForm");
const chatInput = $("#chatInput");

const buildToolbar = $("#buildToolbar");
const buildBlockSelect = $("#buildBlockSelect");
const saveBuildButton = $("#saveBuildButton");

const weaponHud = $("#weaponHud");
const weaponName = $("#weaponName");

const voteChoices = $("#voteChoices");

const gameDarkness = $("#gameDarkness");

const joystick = $("#joystick");
const stick = $("#stick");
const touchJump = $("#touchJump");
const touchInteract = $("#touchInteract");

let CATALOG = null;

let token =
  localStorage.getItem(
    "duckymaps_token"
  ) || "";

let account = null;
let social = {
  friends: [],
  groups: []
};

let ws = null;
let wsClientId = null;

let splitWs = null;
let splitPlayerId = null;

let currentLobby = null;
let currentMap = null;

let inGame = false;
let paused = false;

let selectedMap =
  localStorage.getItem(
    "duckymaps_map"
  ) || "concert";

let selectedSkin =
  localStorage.getItem(
    "duckymaps_skin"
  ) || "skin_1";

let selectedWeapon =
  localStorage.getItem(
    "duckymaps_weapon"
  ) || "weapon_1";

let lockerTab = "skins";

let snapshot = {
  players: [],
  bots: [],
  monsters: [],
  scps: [],
  zombies: [],
  vehicles: [],
  buildBlocks: [],
  world: {},
  boss: null
};

const renderEntities =
  new Map();

const renderSpecial =
  new Map();

const input = {
  up: false,
  down: false,
  left: false,
  right: false,
  joyX: 0,
  joyY: 0
};

const splitInput = {
  up: false,
  down: false,
  left: false,
  right: false
};

let lastInput = {
  x: 99,
  y: 99
};

let lastSplitInput = {
  x: 99,
  y: 99
};

let jumpHeld = false;
let splitJumpHeld = false;

let joystickPointer = null;

let lastFrame =
  performance.now();

let clickWorld = {
  x: 0,
  y: 0
};

let spatialIndex = null;

const effects = [];

const cameras = {
  main: {
    x: 0,
    y: 0,
    zoom: 0.9
  },

  split: {
    x: 0,
    y: 0,
    zoom: 0.9
  }
};

const SETTINGS = {
  name:
    localStorage.getItem(
      "duckymaps_name"
    ) || "Ducky",

  bots:
    Number(
      localStorage.getItem(
        "duckymaps_bots"
      )
    ) || 7,

  music:
    localStorage.getItem(
      "duckymaps_music"
    ) !== "false",

  volume:
    Number(
      localStorage.getItem(
        "duckymaps_volume"
      )
    ) || 32,

  minimap:
    localStorage.getItem(
      "duckymaps_minimap"
    ) !== "false",

  chat:
    localStorage.getItem(
      "duckymaps_chat"
    ) !== "false",

  voice:
    false,

  theme:
    localStorage.getItem(
      "duckymaps_theme"
    ) || "red"
};

displayName.value =
  SETTINGS.name;

botCount.value =
  SETTINGS.bots;

botCountValue.textContent =
  SETTINGS.bots;

selectedBotsLabel.textContent =
  SETTINGS.bots;

musicEnabled.checked =
  SETTINGS.music;

musicVolume.value =
  SETTINGS.volume;

minimapEnabled.checked =
  SETTINGS.minimap;

chatEnabled.checked =
  SETTINGS.chat;

themeSelect.value =
  SETTINGS.theme;

applyTheme();

/* ----------------------------------------------------------
   API
---------------------------------------------------------- */

async function api(
  url,
  options = {}
) {
  const headers = {
    "Content-Type":
      "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  const response =
    await fetch(
      url,
      {
        ...options,
        headers
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
      "Anfrage fehlgeschlagen."
    );
  }

  return data;
}

async function loadCatalog() {
  CATALOG =
    await api("/api/catalog");

  fillCatalogControls();
  renderMaps();
  renderLocker();
  renderShop();
  renderBattlePass();
  renderBestiary();
  updateSelectedMapCard();
}

async function loadAccount() {
  if (!token) {
    updateAccountUi();
    return;
  }

  try {
    const data =
      await api("/api/me");

    account = data.user;

    selectedSkin =
      account.profile.selectedSkin ||
      selectedSkin;

    selectedWeapon =
      account.profile.selectedWeapon ||
      selectedWeapon;

    await loadSocial();
  } catch {
    token = "";
    account = null;

    localStorage.removeItem(
      "duckymaps_token"
    );
  }

  updateAccountUi();
}

async function loadSocial() {
  if (!account) {
    social = {
      friends: [],
      groups: []
    };

    renderSocial();

    return;
  }

  try {
    social =
      await api("/api/social");
  } catch {
    social = {
      friends: [],
      groups: []
    };
  }

  renderSocial();
}

function friendIds() {
  return new Set(
    social.friends
      .filter(
        (friend) =>
          friend.status ===
          "accepted"
      )
      .map(
        (friend) =>
          friend.id
      )
  );
}

/* ----------------------------------------------------------
   UI
---------------------------------------------------------- */

function show(element) {
  element.classList.remove(
    "hidden"
  );
}

function hide(element) {
  element.classList.add(
    "hidden"
  );
}

function openPanel(id) {
  $$(".menu-panel").forEach(
    (panel) =>
      panel.classList.add(
        "hidden"
      )
  );

  const panel =
    document.getElementById(id);

  if (panel) {
    show(panel);
    show(panelOverlay);
  }
}

$$("[data-panel]").forEach(
  (button) => {
    button.addEventListener(
      "click",
      () =>
        openPanel(
          button.dataset.panel
        )
    );
  }
);

$("#closePanel").addEventListener(
  "click",
  () => {
    saveSettings();
    hide(panelOverlay);
  }
);

$("#quickPlay").addEventListener(
  "click",
  () => {
    createGame();
  }
);

$("#createServer").addEventListener(
  "click",
  () => {
    openPanel("playPanel");
  }
);

$("#joinServer").addEventListener(
  "click",
  () => {
    show(joinOverlay);
  }
);

$("#joinCancel").addEventListener(
  "click",
  () => hide(joinOverlay)
);

$("#joinServerConfirm").addEventListener(
  "click",
  () => {
    const code =
      $("#serverCodeInput")
        .value
        .trim()
        .toUpperCase();

    if (!code) return;

    send({
      type: "joinLobby",
      code
    });

    hide(joinOverlay);
  }
);

botCount.addEventListener(
  "input",
  () => {
    botCountValue.textContent =
      botCount.value;

    selectedBotsLabel.textContent =
      botCount.value;
  }
);

modeSelect.addEventListener(
  "change",
  updateModeLabel
);

function updateModeLabel() {
  const option =
    modeSelect.selectedOptions[0];

  selectedModeLabel.textContent =
    option?.textContent ||
    "Monster Hunt";
}

function saveSettings() {
  SETTINGS.name =
    displayName.value.trim() ||
    "Ducky";

  SETTINGS.bots =
    Number(botCount.value);

  SETTINGS.music =
    musicEnabled.checked;

  SETTINGS.volume =
    Number(musicVolume.value);

  SETTINGS.minimap =
    minimapEnabled.checked;

  SETTINGS.chat =
    chatEnabled.checked;

  SETTINGS.theme =
    themeSelect.value;

  localStorage.setItem(
    "duckymaps_name",
    SETTINGS.name
  );

  localStorage.setItem(
    "duckymaps_bots",
    String(SETTINGS.bots)
  );

  localStorage.setItem(
    "duckymaps_music",
    String(SETTINGS.music)
  );

  localStorage.setItem(
    "duckymaps_volume",
    String(SETTINGS.volume)
  );

  localStorage.setItem(
    "duckymaps_minimap",
    String(SETTINGS.minimap)
  );

  localStorage.setItem(
    "duckymaps_chat",
    String(SETTINGS.chat)
  );

  localStorage.setItem(
    "duckymaps_theme",
    SETTINGS.theme
  );

  applyTheme();
  audio.updateVolume();

  $("#minimapWrap")
    .classList.toggle(
      "hidden",
      !SETTINGS.minimap
    );

  chat.classList.toggle(
    "hidden",
    !SETTINGS.chat
  );
}

function applyTheme() {
  document.body.classList.remove(
    "theme-blue",
    "theme-violet",
    "theme-green",
    "theme-mono"
  );

  if (
    SETTINGS.theme !== "red"
  ) {
    document.body.classList.add(
      `theme-${SETTINGS.theme}`
    );
  }
}

function rarityHtml(item) {
  return `
    <div class="rarity">
      <span
        class="rarity-dot"
        style="background:${item.rarityColor || "#999"}"
      ></span>

      ${escapeHtml(item.rarityName || item.rarity || "")}
    </div>
  `;
}

function skinPreview(skin) {
  return `
    <div class="item-preview">
      <div
        class="skin-shape"
        style="
          --color:${skin.primary};
          --accent-color:${skin.accent};
        "
      ></div>
    </div>
  `;
}

function petPreview(pet) {
  return `
    <div class="item-preview">
      <div class="pet-shape">
        ${pet.icon}
      </div>
    </div>
  `;
}

function weaponPreview(weapon) {
  return `
    <div class="item-preview">
      <div
        class="weapon-shape"
        style="--weapon-color:${weapon.color}"
      ></div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

function fillCatalogControls() {
  monsterSelect.innerHTML =
    CATALOG.monsterForms
      .map(
        (form) =>
          `<option value="${form.id}">${escapeHtml(form.name)}</option>`
      )
      .join("");

  minigameSelect.innerHTML =
    CATALOG.minigames
      .map(
        (game) =>
          `<option value="${game.id}">${escapeHtml(game.name)}</option>`
      )
      .join("");

  musicSelect.innerHTML =
    CATALOG.tracks
      .map(
        (track) =>
          `<option value="${track.id}">${escapeHtml(track.name)} — ${escapeHtml(track.genre)}</option>`
      )
      .join("");

  buildBlockSelect.innerHTML =
    CATALOG.blocks
      .map(
        (block) =>
          `<option value="${block.id}">${escapeHtml(block.name)}</option>`
      )
      .join("");

  const storedTrack =
    localStorage.getItem(
      "duckymaps_track"
    );

  if (
    CATALOG.tracks.some(
      (track) =>
        track.id === storedTrack
    )
  ) {
    musicSelect.value =
      storedTrack;
  }
}

function renderMaps() {
  mapGrid.innerHTML = "";

  for (const map of CATALOG.maps) {
    const button =
      document.createElement(
        "button"
      );

    button.className =
      "item-card";

    button.innerHTML = `
      <div
        class="item-preview"
        style="
          background:
            linear-gradient(
              145deg,
              ${map.dark ? "#24262c" : "#c9cdcc"},
              ${map.dark ? "#111317" : "#8e9899"}
            )
        "
      >
        <strong>
          ${escapeHtml(map.name)}
        </strong>
      </div>

      <div class="item-info">
        <strong>
          ${escapeHtml(map.name)}
        </strong>

        <div class="rarity">
          ${escapeHtml(map.subtitle)}
        </div>
      </div>
    `;

    if (
      map.id === selectedMap
    ) {
      button.style.outline =
        "2px solid var(--accent)";
    }

    button.addEventListener(
      "click",
      () => {
        selectedMap =
          map.id;

        localStorage.setItem(
          "duckymaps_map",
          selectedMap
        );

        renderMaps();
        updateSelectedMapCard();
      }
    );

    mapGrid.appendChild(
      button
    );
  }
}

function updateSelectedMapCard() {
  if (!CATALOG) return;

  const map =
    CATALOG.maps.find(
      (entry) =>
        entry.id === selectedMap
    ) || CATALOG.maps[0];

  selectedMapTitle.textContent =
    map.name;

  selectedMapDescription.textContent =
    map.subtitle;
}

function ownedSkins() {
  return account
    ? account.profile.ownedSkins
    : ["skin_1","skin_2","skin_3"];
}

function ownedWeapons() {
  return account
    ? account.profile.ownedWeapons
    : ["weapon_1"];
}

function ownedPets() {
  return account
    ? account.profile.pets
    : [];
}

function renderLocker() {
  if (!CATALOG) return;

  lockerGrid.innerHTML = "";

  if (lockerTab === "skins") {
    for (const skin of CATALOG.skins) {
      const owned =
        ownedSkins().includes(
          skin.id
        );

      const card =
        document.createElement(
          "button"
        );

      card.className =
        "item-card";

      card.innerHTML =
        skinPreview(skin) +
        `
          <div class="item-info">
            <strong>
              ${escapeHtml(skin.name)}
            </strong>

            ${rarityHtml(skin)}

            <div class="rarity">
              ${owned ? "Im Spind" : skin.secret ? "Secret" : "Nicht freigeschaltet"}
            </div>
          </div>
        `;

      if (owned) {
        card.addEventListener(
          "click",
          async () => {
            selectedSkin =
              skin.id;

            localStorage.setItem(
              "duckymaps_skin",
              selectedSkin
            );

            if (account) {
              const result =
                await api(
                  "/api/profile/equip",
                  {
                    method: "POST",
                    body:
                      JSON.stringify({
                        skin:
                          selectedSkin
                      })
                  }
                );

              account.profile =
                result.profile;
            }

            toast(
              `${skin.name} ausgerüstet.`,
              "good"
            );
          }
        );
      }

      lockerGrid.appendChild(
        card
      );
    }
  }

  if (lockerTab === "pets") {
    for (const pet of CATALOG.pets) {
      const owned =
        ownedPets().includes(
          pet.id
        );

      const card =
        document.createElement(
          "button"
        );

      card.className =
        "item-card";

      card.innerHTML =
        petPreview(pet) +
        `
          <div class="item-info">
            <strong>
              ${escapeHtml(pet.name)}
            </strong>

            ${rarityHtml(pet)}

            <div class="rarity">
              ${owned ? "Gefunden" : "Secret-Fund auf einer Map"}
            </div>
          </div>
        `;

      if (owned && account) {
        card.addEventListener(
          "click",
          async () => {
            const result =
              await api(
                "/api/profile/equip",
                {
                  method: "POST",
                  body:
                    JSON.stringify({
                      pet: pet.id
                    })
                }
              );

            account.profile =
              result.profile;

            toast(
              `${pet.name} begleitet dich.`,
              "good"
            );
          }
        );
      }

      lockerGrid.appendChild(
        card
      );
    }
  }

  if (lockerTab === "weapons") {
    for (const weapon of CATALOG.weapons) {
      const owned =
        ownedWeapons().includes(
          weapon.id
        );

      const card =
        document.createElement(
          "button"
        );

      card.className =
        "item-card";

      card.innerHTML =
        weaponPreview(weapon) +
        `
          <div class="item-info">
            <strong>
              ${escapeHtml(weapon.name)}
            </strong>

            ${rarityHtml(weapon)}

            <div class="rarity">
              ${owned ? "Im Inventar" : `${weapon.price} Coins`}
            </div>
          </div>
        `;

      if (owned) {
        card.addEventListener(
          "click",
          async () => {
            selectedWeapon =
              weapon.id;

            localStorage.setItem(
              "duckymaps_weapon",
              selectedWeapon
            );

            if (account) {
              const result =
                await api(
                  "/api/profile/equip",
                  {
                    method: "POST",
                    body:
                      JSON.stringify({
                        weapon:
                          selectedWeapon
                      })
                  }
                );

              account.profile =
                result.profile;
            }

            toast(
              `${weapon.name} ausgerüstet.`,
              "good"
            );
          }
        );
      }

      lockerGrid.appendChild(
        card
      );
    }
  }
}

$$("[data-locker-tab]").forEach(
  (button) => {
    button.addEventListener(
      "click",
      () => {
        lockerTab =
          button.dataset.lockerTab;

        renderLocker();
      }
    );
  }
);

function renderShop() {
  if (!CATALOG) return;

  shopGrid.innerHTML = "";

  const items = [
    ...CATALOG.skins
      .filter(
        (skin) =>
          !skin.secret &&
          !skin.challenge
      )
      .slice(0, 80),

    ...CATALOG.weapons
  ];

  for (const item of items) {
    const isWeapon =
      item.id.startsWith(
        "weapon_"
      );

    const card =
      document.createElement(
        "button"
      );

    card.className =
      "item-card";

    card.innerHTML =
      (
        isWeapon
          ? weaponPreview(item)
          : skinPreview(item)
      ) +
      `
        <div class="item-info">
          <strong>
            ${escapeHtml(item.name)}
          </strong>

          ${rarityHtml(item)}

          <div class="rarity">
            ${
              isWeapon
                ? `${item.price} Coins`
                : "Skin"
            }
          </div>
        </div>
      `;

    card.addEventListener(
      "click",
      async () => {
        if (!account) {
          toast(
            "Für Käufe bitte einloggen.",
            "warning"
          );

          return;
        }

        try {
          const result =
            await api(
              "/api/shop/buy",
              {
                method: "POST",
                body:
                  JSON.stringify({
                    itemId:
                      item.id
                  })
              }
            );

          account.profile =
            result.profile;

          updateAccountUi();
          renderLocker();

          toast(
            `${item.name} gekauft.`,
            "good"
          );
        } catch (error) {
          toast(
            error.message,
            "warning"
          );
        }
      }
    );

    shopGrid.appendChild(
      card
    );
  }
}

function renderBattlePass() {
  battlePassGrid.innerHTML = "";

  for (const tier of CATALOG.battlePass) {
    const div =
      document.createElement(
        "div"
      );

    div.className =
      "pass-tier";

    let reward;

    if (tier.reward.type === "coins") {
      reward =
        `${tier.reward.amount} Coins`;
    } else {
      const collection =
        tier.reward.type === "skin"
          ? CATALOG.skins
          : tier.reward.type === "pet"
            ? CATALOG.pets
            : CATALOG.weapons;

      const item =
        collection.find(
          (entry) =>
            entry.id ===
            tier.reward.id
        );

      reward =
        item?.name ||
        tier.reward.id;
    }

    div.innerHTML = `
      <small>
        STUFE ${tier.tier}
      </small>

      <strong>
        ${escapeHtml(reward)}
      </strong>

      <div class="rarity">
        ${tier.xp} XP
      </div>
    `;

    battlePassGrid.appendChild(
      div
    );
  }
}

function renderBestiary() {
  bestiaryGrid.innerHTML = "";

  for (const creature of CATALOG.bestiary) {
    const card =
      document.createElement(
        "div"
      );

    card.className =
      "item-card";

    card.innerHTML = `
      <div class="item-preview">
        <div class="monster-shape"></div>
      </div>

      <div class="item-info">
        <strong>
          ${escapeHtml(creature.name)}
        </strong>

        ${rarityHtml(creature)}
      </div>
    `;

    bestiaryGrid.appendChild(
      card
    );
  }
}

function updateAccountUi() {
  if (account) {
    accountBadge.textContent =
      account.displayName;

    hide($("#loggedOutAccount"));
    show($("#loggedInAccount"));

    $("#accountName").textContent =
      `${account.displayName} (@${account.username})`;

    $("#accountStats").textContent =
      `${account.profile.coins} Coins • ${account.profile.xp} XP • ${account.profile.pets.length} Pets`;
  } else {
    accountBadge.textContent =
      "Gast";

    show($("#loggedOutAccount"));
    hide($("#loggedInAccount"));
  }

  renderLocker();
}

$("#loginForm").addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    try {
      const result =
        await api(
          "/api/login",
          {
            method: "POST",
            body:
              JSON.stringify({
                username:
                  $("#loginUsername").value,
                password:
                  $("#loginPassword").value
              })
          }
        );

      token = result.token;
      account = result.user;

      localStorage.setItem(
        "duckymaps_token",
        token
      );

      await loadSocial();

      updateAccountUi();

      toast(
        "Eingeloggt.",
        "good"
      );
    } catch (error) {
      toast(
        error.message,
        "warning"
      );
    }
  }
);

$("#registerForm").addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    try {
      const result =
        await api(
          "/api/register",
          {
            method: "POST",
            body:
              JSON.stringify({
                username:
                  $("#registerUsername").value,
                displayName:
                  $("#registerDisplayName").value,
                password:
                  $("#registerPassword").value
              })
          }
        );

      token = result.token;
      account = result.user;

      localStorage.setItem(
        "duckymaps_token",
        token
      );

      await loadSocial();

      updateAccountUi();

      toast(
        "Account erstellt.",
        "good"
      );
    } catch (error) {
      toast(
        error.message,
        "warning"
      );
    }
  }
);

$("#logoutButton").addEventListener(
  "click",
  () => {
    token = "";
    account = null;

    localStorage.removeItem(
      "duckymaps_token"
    );

    updateAccountUi();
    renderSocial();
  }
);

$("#friendForm").addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    if (!account) {
      toast(
        "Bitte zuerst einloggen.",
        "warning"
      );

      return;
    }

    try {
      await api(
        "/api/friends/request",
        {
          method: "POST",
          body:
            JSON.stringify({
              username:
                $("#friendUsername").value
            })
        }
      );

      await loadSocial();

      toast(
        "Freundschaftsanfrage gesendet.",
        "good"
      );
    } catch (error) {
      toast(
        error.message,
        "warning"
      );
    }
  }
);

$("#groupForm").addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    if (!account) {
      toast(
        "Bitte zuerst einloggen.",
        "warning"
      );

      return;
    }

    try {
      await api(
        "/api/groups/create",
        {
          method: "POST",
          body:
            JSON.stringify({
              name:
                $("#groupName").value
            })
        }
      );

      await loadSocial();

      toast(
        "Gruppe erstellt.",
        "good"
      );
    } catch (error) {
      toast(
        error.message,
        "warning"
      );
    }
  }
);

function renderSocial() {
  const friends =
    $("#friendsList");

  const groups =
    $("#groupsList");

  friends.innerHTML = "";
  groups.innerHTML = "";

  for (const friend of social.friends) {
    const row =
      document.createElement(
        "div"
      );

    row.className =
      "item-info";

    row.innerHTML = `
      <strong>
        ${escapeHtml(friend.displayName)}
      </strong>

      <div class="rarity">
        @${escapeHtml(friend.username)}
        •
        ${escapeHtml(friend.status)}
      </div>
    `;

    if (
      friend.status === "pending" &&
      friend.requestedBy !== account?.id
    ) {
      const accept =
        document.createElement(
          "button"
        );

      accept.textContent =
        "Annehmen";

      accept.addEventListener(
        "click",
        async () => {
          await api(
            "/api/friends/accept",
            {
              method: "POST",
              body:
                JSON.stringify({
                  userId:
                    friend.id
                })
            }
          );

          await loadSocial();
        }
      );

      row.appendChild(
        accept
      );
    }

    friends.appendChild(
      row
    );
  }

  for (const group of social.groups) {
    const row =
      document.createElement(
        "div"
      );

    row.className =
      "item-info";

    row.innerHTML = `
      <strong>
        ${escapeHtml(group.name)}
      </strong>
    `;

    groups.appendChild(
      row
    );
  }
}

/* ----------------------------------------------------------
   WebSocket
---------------------------------------------------------- */

function connect() {
  const protocol =
    location.protocol === "https:"
      ? "wss:"
      : "ws:";

  ws =
    new WebSocket(
      `${protocol}//${location.host}`
    );

  ws.addEventListener(
    "open",
    () => {
      networkStatus.textContent =
        "Online";

      send({
        type: "hello",
        name:
          account?.displayName ||
          SETTINGS.name,
        skin:
          account?.profile.selectedSkin ||
          selectedSkin,
        token
      });
    }
  );

  ws.addEventListener(
    "close",
    () => {
      networkStatus.textContent =
        "Verbindung verloren …";

      setTimeout(
        connect,
        1500
      );
    }
  );

  ws.addEventListener(
    "message",
    (event) => {
      let data;

      try {
        data =
          JSON.parse(
            event.data
          );
      } catch {
        return;
      }

      handleMessage(data);
    }
  );
}

function send(payload) {
  if (
    ws?.readyState ===
    WebSocket.OPEN
  ) {
    ws.send(
      JSON.stringify(payload)
    );
  }
}

function handleMessage(data) {
  switch (data.type) {
    case "welcome":
      wsClientId =
        data.clientId;
      break;

    case "lobbyJoined":
      enterGame(
        data
      );
      break;

    case "roundReset":
      currentMap =
        data.map;

      currentLobby =
        data.lobby;

      buildSpatialIndex();
      resetRenderEntities();

      gameMapText.textContent =
        currentMap.name;

      toast(
        `Neue Runde: ${currentMap.name}`,
        "good"
      );

      hide(voteOverlay);
      break;

    case "state":
      snapshot = data;
      ingestSnapshot(data);
      updateWorldUi();
      break;

    case "lobbyInfo":
      currentLobby =
        data.lobby;
      break;

    case "chat":
      addChat(data);
      break;

    case "toast":
      toast(
        data.text,
        data.tone
      );
      break;

    case "shot":
    case "beam":
      effects.push({
        type: "beam",
        fromX:
          data.fromX,
        fromY:
          data.fromY,
        toX:
          data.toX,
        toY:
          data.toY,
        color:
          data.color ||
          "#ed6371",
        until:
          performance.now() +
          350
      });
      break;

    case "monsterSprint":
      toast(
        "Die Kreatur sprintet!",
        "danger"
      );
      break;

    case "event":
      showEvent(data.event);
      break;

    case "openPiano":
      show(pianoOverlay);
      audio.ensure();
      break;

    case "openShop":
      hide(gameScreen);
      show(mainMenu);
      openPanel("shopPanel");
      break;

    case "mapVote":
      renderMapVote(
        data.candidates
      );
      break;

    case "bossAttack":
      effects.push({
        type:
          data.attack,
        x: data.x,
        y: data.y,
        until:
          performance.now() +
          1800
      });
      break;

    case "voicePeers":
      voice.updatePeers(
        data.peers
      );
      break;

    case "voiceSignal":
      voice.handleSignal(
        data.from,
        data.signal
      );
      break;

    case "error":
      toast(
        data.message,
        "warning"
      );
      break;

    default:
      break;
  }
}

function createGame() {
  saveSettings();
  audio.ensure();

  hide(panelOverlay);

  const modifiers =
    $$(".modifier:checked")
      .map(
        (box) =>
          box.value
      );

  send({
    type: "createLobby",

    mapId: selectedMap,
    mode: modeSelect.value,
    botCount:
      Number(botCount.value),

    bhop:
      bhopToggle.checked,

    monsterForm:
      monsterSelect.value,

    randomEvents:
      eventsToggle.checked,

    private:
      privateToggle.checked,

    modifiers,

    minigameId:
      minigameSelect.value
  });
}

function enterGame(data) {
  currentLobby =
    data.lobby;

  currentMap =
    data.map;

  wsClientId =
    data.playerId;

  buildSpatialIndex();

  resetRenderEntities();

  inGame = true;
  paused = false;

  gameMapText.textContent =
    currentMap.name;

  gameModeText.textContent =
    currentLobby.mode
      .replaceAll("_"," ")
      .toUpperCase();

  serverCodeText.textContent =
    currentLobby.code;

  hide(mainMenu);
  hide(panelOverlay);
  hide(joinOverlay);

  show(gameScreen);

  saveSettings();

  updateModeSpecificUi();

  if (
    splitToggle.checked &&
    matchMedia(
      "(pointer:fine)"
    ).matches
  ) {
    startSplitClient();
  }

  if (
    voiceEnabled.checked
  ) {
    voice.enable();
  }
}

function leaveGame() {
  send({
    type: "leaveLobby"
  });

  stopSplitClient();

  voice.disable();

  inGame = false;
  currentLobby = null;
  currentMap = null;

  hide(gameScreen);
  hide(pauseMenu);

  show(mainMenu);
}

/* ----------------------------------------------------------
   Split-screen
---------------------------------------------------------- */

function startSplitClient() {
  if (
    splitWs ||
    !currentLobby
  ) {
    return;
  }

  const protocol =
    location.protocol === "https:"
      ? "wss:"
      : "ws:";

  splitWs =
    new WebSocket(
      `${protocol}//${location.host}`
    );

  splitWs.addEventListener(
    "open",
    () => {
      splitWs.send(
        JSON.stringify({
          type: "hello",
          name:
            `${SETTINGS.name} 2`,
          skin: "skin_2"
        })
      );

      splitWs.send(
        JSON.stringify({
          type: "joinLobby",
          code:
            currentLobby.code
        })
      );
    }
  );

  splitWs.addEventListener(
    "message",
    (event) => {
      let data;

      try {
        data =
          JSON.parse(
            event.data
          );
      } catch {
        return;
      }

      if (
        data.type ===
        "lobbyJoined"
      ) {
        splitPlayerId =
          data.playerId;
      }
    }
  );
}

function splitSend(payload) {
  if (
    splitWs?.readyState ===
    WebSocket.OPEN
  ) {
    splitWs.send(
      JSON.stringify(payload)
    );
  }
}

function stopSplitClient() {
  if (splitWs) {
    splitWs.close();
  }

  splitWs = null;
  splitPlayerId = null;
}

/* ----------------------------------------------------------
   Snapshot smoothing
---------------------------------------------------------- */

function resetRenderEntities() {
  renderEntities.clear();
  renderSpecial.clear();
}

function ingestSnapshot(state) {
  const entities = [
    ...state.players,
    ...state.bots
  ];

  const seen =
    new Set();

  for (const entity of entities) {
    seen.add(
      entity.id
    );

    let render =
      renderEntities.get(
        entity.id
      );

    if (!render) {
      render = {
        ...entity,
        renderX: entity.x,
        renderY: entity.y,
        targetX: entity.x,
        targetY: entity.y
      };

      renderEntities.set(
        entity.id,
        render
      );
    } else {
      const oldX =
        render.renderX;

      const oldY =
        render.renderY;

      Object.assign(
        render,
        entity
      );

      render.renderX =
        oldX;

      render.renderY =
        oldY;

      render.targetX =
        entity.x;

      render.targetY =
        entity.y;
    }
  }

  for (
    const id of
    renderEntities.keys()
  ) {
    if (!seen.has(id)) {
      renderEntities.delete(id);
    }
  }

  const specials = [
    ...state.monsters.map(
      (entry) => ({
        ...entry,
        specialType: "monster"
      })
    ),

    ...state.scps.map(
      (entry) => ({
        ...entry,
        specialType: "scp"
      })
    ),

    ...state.zombies.map(
      (entry) => ({
        ...entry,
        specialType: "zombie"
      })
    )
  ];

  const specialSeen =
    new Set();

  for (const entity of specials) {
    specialSeen.add(
      entity.id
    );

    let render =
      renderSpecial.get(
        entity.id
      );

    if (!render) {
      render = {
        ...entity,
        renderX: entity.x,
        renderY: entity.y,
        targetX: entity.x,
        targetY: entity.y
      };

      renderSpecial.set(
        entity.id,
        render
      );
    } else {
      const x =
        render.renderX;

      const y =
        render.renderY;

      Object.assign(
        render,
        entity
      );

      render.renderX = x;
      render.renderY = y;
      render.targetX =
        entity.x;
      render.targetY =
        entity.y;
    }
  }

  for (
    const id of
    renderSpecial.keys()
  ) {
    if (
      !specialSeen.has(id)
    ) {
      renderSpecial.delete(id);
    }
  }
}

function smooth(dt) {
  const factor =
    1 -
    Math.pow(
      .002,
      dt
    );

  for (
    const entity of
    renderEntities.values()
  ) {
    entity.renderX +=
      (
        entity.targetX -
        entity.renderX
      ) *
      factor;

    entity.renderY +=
      (
        entity.targetY -
        entity.renderY
      ) *
      factor;
  }

  for (
    const entity of
    renderSpecial.values()
  ) {
    entity.renderX +=
      (
        entity.targetX -
        entity.renderX
      ) *
      factor;

    entity.renderY +=
      (
        entity.targetY -
        entity.renderY
      ) *
      factor;
  }
}

function me() {
  return renderEntities.get(
    wsClientId
  );
}

function secondMe() {
  return splitPlayerId
    ? renderEntities.get(
        splitPlayerId
      )
    : null;
}

/* ----------------------------------------------------------
   Spatial Index
---------------------------------------------------------- */

const CHUNK = 520;

function buildSpatialIndex() {
  if (!currentMap) {
    spatialIndex = null;
    return;
  }

  const chunks =
    new Map();

  function add(type, object) {
    const minX =
      Math.floor(
        object.x / CHUNK
      );

    const minY =
      Math.floor(
        object.y / CHUNK
      );

    const maxX =
      Math.floor(
        (object.x +
          (object.w || 1)) /
          CHUNK
      );

    const maxY =
      Math.floor(
        (object.y +
          (object.h || 1)) /
          CHUNK
      );

    for (
      let cy = minY;
      cy <= maxY;
      cy += 1
    ) {
      for (
        let cx = minX;
        cx <= maxX;
        cx += 1
      ) {
        const key =
          `${cx},${cy}`;

        if (!chunks.has(key)) {
          chunks.set(
            key,
            {
              walls: [],
              props: []
            }
          );
        }

        chunks.get(key)[type]
          .push(object);
      }
    }
  }

  for (
    const wall of
    currentMap.walls
  ) {
    add("walls", wall);
  }

  for (
    const prop of
    currentMap.props
  ) {
    add("props", prop);
  }

  spatialIndex = chunks;
}

function nearbyStatic(camera, viewport) {
  if (!spatialIndex) {
    return {
      walls: [],
      props: []
    };
  }

  const worldW =
    viewport.w /
    camera.zoom;

  const worldH =
    viewport.h /
    camera.zoom;

  const minX =
    Math.floor(
      (
        camera.x -
        worldW / 2 -
        100
      ) / CHUNK
    );

  const maxX =
    Math.floor(
      (
        camera.x +
        worldW / 2 +
        100
      ) / CHUNK
    );

  const minY =
    Math.floor(
      (
        camera.y -
        worldH / 2 -
        100
      ) / CHUNK
    );

  const maxY =
    Math.floor(
      (
        camera.y +
        worldH / 2 +
        100
      ) / CHUNK
    );

  const walls =
    new Set();

  const props =
    new Set();

  for (
    let y = minY;
    y <= maxY;
    y += 1
  ) {
    for (
      let x = minX;
      x <= maxX;
      x += 1
    ) {
      const chunk =
        spatialIndex.get(
          `${x},${y}`
        );

      if (!chunk) continue;

      chunk.walls.forEach(
        (entry) =>
          walls.add(entry)
      );

      chunk.props.forEach(
        (entry) =>
          props.add(entry)
      );
    }
  }

  return {
    walls: [...walls],
    props: [...props]
  };
}

/* ----------------------------------------------------------
   Renderer
---------------------------------------------------------- */

function resize() {
  const dpr =
    Math.min(
      devicePixelRatio || 1,
      innerWidth < 700
        ? 1.4
        : 2
    );

  canvas.width =
    Math.floor(
      innerWidth * dpr
    );

  canvas.height =
    Math.floor(
      innerHeight * dpr
    );

  canvas.style.width =
    `${innerWidth}px`;

  canvas.style.height =
    `${innerHeight}px`;

  ctx.setTransform(
    dpr,0,0,dpr,0,0
  );
}

window.addEventListener(
  "resize",
  resize
);

resize();

function viewportWorldToScreen(
  x,
  y,
  camera,
  viewport
) {
  return {
    x:
      viewport.x +
      viewport.w / 2 +
      (x - camera.x) *
        camera.zoom,

    y:
      viewport.y +
      viewport.h / 2 +
      (y - camera.y) *
        camera.zoom
  };
}

function floorColor(zone) {
  return zone.color ||
    "#bbb";
}

function drawZone(
  zone,
  camera,
  viewport
) {
  const p =
    viewportWorldToScreen(
      zone.x,
      zone.y,
      camera,
      viewport
    );

  const w =
    zone.w * camera.zoom;

  const h =
    zone.h * camera.zoom;

  ctx.fillStyle =
    floorColor(zone);

  ctx.fillRect(
    p.x,
    p.y,
    w,
    h
  );

  if (
    ["tile","stone","garage","backroomsCarpet"].includes(
      zone.floor
    )
  ) {
    const size =
      zone.floor ===
        "backroomsCarpet"
        ? 72
        : 50;

    ctx.strokeStyle =
      zone.floor ===
        "backroomsCarpet"
        ? "rgba(96,85,46,.10)"
        : "rgba(50,55,56,.14)";

    ctx.lineWidth = 1;

    const startX =
      Math.floor(
        zone.x / size
      ) * size;

    const startY =
      Math.floor(
        zone.y / size
      ) * size;

    for (
      let x = startX;
      x <
        zone.x +
          zone.w;
      x += size
    ) {
      const a =
        viewportWorldToScreen(
          x,
          zone.y,
          camera,
          viewport
        );

      const b =
        viewportWorldToScreen(
          x,
          zone.y +
            zone.h,
          camera,
          viewport
        );

      ctx.beginPath();
      ctx.moveTo(a.x,a.y);
      ctx.lineTo(b.x,b.y);
      ctx.stroke();
    }

    for (
      let y = startY;
      y <
        zone.y +
          zone.h;
      y += size
    ) {
      const a =
        viewportWorldToScreen(
          zone.x,
          y,
          camera,
          viewport
        );

      const b =
        viewportWorldToScreen(
          zone.x +
            zone.w,
          y,
          camera,
          viewport
        );

      ctx.beginPath();
      ctx.moveTo(a.x,a.y);
      ctx.lineTo(b.x,b.y);
      ctx.stroke();
    }
  }

  if (
    zone.floor === "wood"
  ) {
    ctx.strokeStyle =
      "rgba(70,45,29,.16)";

    for (
      let y = zone.y;
      y <
        zone.y +
          zone.h;
      y += 34
    ) {
      const a =
        viewportWorldToScreen(
          zone.x,
          y,
          camera,
          viewport
        );

      const b =
        viewportWorldToScreen(
          zone.x +
            zone.w,
          y,
          camera,
          viewport
        );

      ctx.beginPath();
      ctx.moveTo(a.x,a.y);
      ctx.lineTo(b.x,b.y);
      ctx.stroke();
    }
  }

  if (
    camera.zoom > .62 &&
    zone.name
  ) {
    const label =
      viewportWorldToScreen(
        zone.x +
          zone.w / 2,
        zone.y + 38,
        camera,
        viewport
      );

    ctx.fillStyle =
      "rgba(28,31,33,.48)";

    ctx.font =
      `800 ${Math.max(
        9,
        13 * camera.zoom
      )}px system-ui`;

    ctx.textAlign =
      "center";

    ctx.fillText(
      zone.name,
      label.x,
      label.y
    );
  }
}

function drawWater(
  water,
  camera,
  viewport,
  time
) {
  const p =
    viewportWorldToScreen(
      water.x,
      water.y,
      camera,
      viewport
    );

  ctx.fillStyle =
    water.color;

  ctx.fillRect(
    p.x,
    p.y,
    water.w *
      camera.zoom,
    water.h *
      camera.zoom
  );

  ctx.strokeStyle =
    "rgba(215,245,245,.16)";

  for (
    let y =
      water.y + 30;
    y <
      water.y +
        water.h;
    y += 65
  ) {
    const wave =
      Math.sin(
        time * .002 +
        y * .02
      ) * 18;

    const a =
      viewportWorldToScreen(
        water.x +
          15 +
          wave,
        y,
        camera,
        viewport
      );

    const b =
      viewportWorldToScreen(
        water.x +
          water.w -
          15 +
          wave,
        y,
        camera,
        viewport
      );

    ctx.beginPath();
    ctx.moveTo(a.x,a.y);
    ctx.lineTo(b.x,b.y);
    ctx.stroke();
  }
}

function drawWall(
  wall,
  camera,
  viewport
) {
  const p =
    viewportWorldToScreen(
      wall.x,
      wall.y,
      camera,
      viewport
    );

  const w =
    wall.w *
    camera.zoom;

  const h =
    wall.h *
    camera.zoom;

  ctx.fillStyle =
    "rgba(0,0,0,.19)";

  ctx.fillRect(
    p.x + 4,
    p.y + 6,
    w,
    h
  );

  let color =
    "#e0e1de";

  if (
    wall.material ===
      "backrooms"
  ) {
    color = "#d6c66c";
  } else if (
    currentMap.theme ===
      "monastery"
  ) {
    color = "#aaa89c";
  } else if (
    currentMap.theme ===
      "snow"
  ) {
    color = "#bbc0c0";
  }

  ctx.fillStyle =
    color;

  ctx.fillRect(
    p.x,p.y,w,h
  );

  ctx.strokeStyle =
    "rgba(60,64,66,.35)";

  ctx.strokeRect(
    p.x,p.y,w,h
  );
}

const PROP_COLORS = {
  stage:"#956846",
  speaker:"#22272a",
  piano:"#24201e",
  table:"#8d6a4e",
  chair:"#6e523f",
  counter:"#aca18f",
  fridge:"#d5dddd",
  sink:"#bac4c5",
  oven:"#474d50",
  toiletStall:"#c4d3d4",
  shelf:"#686c69",
  locker:"#778589",
  sofa:"#72777a",
  mirror:"#aa9683",
  case:"#4f5356",
  desk:"#7b6a58",
  computer:"#313a3f",
  reception:"#aa9f95",
  plant:"#5c845c",
  cabinet:"#785a40",
  shopShelf:"#858b86",
  register:"#464d50",
  vending:"#40474b",
  labTable:"#8a9899",
  serverRack:"#272e31",
  generator:"#606966",
  toolCart:"#99594e",
  powerBox:"#6b7573",
  pew:"#74593f",
  altar:"#91806d",
  hay:"#b99d57",
  trough:"#655744",
  animalStall:"#7a5c41",
  lounge:"#777",
  bench:"#795e44",
  tree:"#3d6345",
  snowPine:"#66817b",
  desertRock:"#92745b",
  runeStone:"#514a53",
  deadRock:"#5a5554",
  rune:"#8c5aa4"
};

function drawProp(
  prop,
  camera,
  viewport
) {
  const p =
    viewportWorldToScreen(
      prop.x,
      prop.y,
      camera,
      viewport
    );

  const w =
    prop.w *
    camera.zoom;

  const h =
    prop.h *
    camera.zoom;

  ctx.fillStyle =
    "rgba(0,0,0,.18)";

  ctx.fillRect(
    p.x + 4,
    p.y + 5,
    w,
    h
  );

  ctx.fillStyle =
    PROP_COLORS[
      prop.type
    ] || "#747b7d";

  ctx.fillRect(
    p.x,
    p.y,
    w,
    h
  );

  if (
    prop.type === "vending"
  ) {
    ctx.fillStyle =
      "#262d30";

    ctx.fillRect(
      p.x + w*.17,
      p.y + h*.1,
      w*.63,
      h*.55
    );

    ctx.fillStyle =
      "#61b86e";

    for (
      let row = 0;
      row < 3;
      row += 1
    ) {
      for (
        let col = 0;
        col < 3;
        col += 1
      ) {
        ctx.fillRect(
          p.x +
            w*.25 +
            col*w*.16,
          p.y +
            h*.18 +
            row*h*.14,
          Math.max(
            3,
            5*camera.zoom
          ),
          Math.max(
            7,
            13*camera.zoom
          )
        );
      }
    }
  }

  if (
    prop.type === "piano"
  ) {
    ctx.fillStyle =
      "#efeee8";

    for (
      let i = 0;
      i < 14;
      i += 1
    ) {
      ctx.fillRect(
        p.x +
          w*.15 +
          i*w*.05,
        p.y +
          h*.16,
        w*.045,
        h*.28
      );
    }
  }

  if (
    prop.type === "locker" ||
    prop.type === "cabinet"
  ) {
    ctx.strokeStyle =
      "rgba(20,25,28,.45)";

    ctx.beginPath();
    ctx.moveTo(
      p.x+w/2,p.y
    );
    ctx.lineTo(
      p.x+w/2,p.y+h
    );
    ctx.stroke();
  }

  if (
    prop.type === "tree" ||
    prop.type === "snowPine"
  ) {
    ctx.fillStyle =
      prop.type ===
        "snowPine"
        ? "#d9e1df"
        : "#31533a";

    ctx.beginPath();

    ctx.arc(
      p.x+w/2,
      p.y+h/2,
      Math.min(w,h)*.36,
      0,
      Math.PI*2
    );

    ctx.fill();
  }
}

function doorState(id) {
  return snapshot.doors?.find(
    (entry) =>
      entry.id === id
  );
}

function drawDoor(
  door,
  camera,
  viewport
) {
  const state =
    doorState(door.id);

  const amount =
    state?.amount || 0;

  const center =
    viewportWorldToScreen(
      door.x +
        door.w/2,
      door.y +
        door.h/2,
      camera,
      viewport
    );

  const length =
    (
      door.axis === "vertical"
        ? door.h
        : door.w
    ) *
    camera.zoom;

  ctx.save();

  ctx.translate(
    center.x,
    center.y
  );

  ctx.rotate(
    amount *
    Math.PI/2
  );

  ctx.fillStyle =
    state?.locked
      ? "#6d2b2e"
      : "#79512f";

  ctx.fillRect(
    -length/2,
    -6*camera.zoom,
    length,
    12*camera.zoom
  );

  ctx.restore();
}

function getSkin(id) {
  return (
    CATALOG?.skins.find(
      (skin) =>
        skin.id === id
    ) ||
    CATALOG?.skins[0]
  );
}

function isFriendEntity(entity) {
  return (
    entity.accountId &&
    friendIds().has(
      entity.accountId
    )
  );
}

function drawEntity(
  entity,
  camera,
  viewport,
  hiddenLayer
) {
  if (
    Boolean(entity.hidden) !==
    hiddenLayer
  ) {
    return;
  }

  const p =
    viewportWorldToScreen(
      entity.renderX,
      entity.renderY,
      camera,
      viewport
    );

  if (
    p.x <
      viewport.x - 70 ||
    p.x >
      viewport.x +
        viewport.w +
        70 ||
    p.y <
      viewport.y - 70 ||
    p.y >
      viewport.y +
        viewport.h +
        70
  ) {
    return;
  }

  if (
    entity.propForm &&
    currentLobby.mode ===
      "prophunt"
  ) {
    ctx.fillStyle =
      PROP_COLORS[
        entity.propForm
      ] || "#777";

    ctx.fillRect(
      p.x - 20,
      p.y - 20,
      40,
      40
    );

    return;
  }

  const skin =
    getSkin(entity.skin);

  const radius =
    18 *
    camera.zoom;

  const jump =
    (entity.jumpHeight || 0) *
    camera.zoom;

  ctx.save();

  ctx.translate(
    p.x,
    p.y - jump
  );

  ctx.fillStyle =
    "rgba(0,0,0,.2)";

  ctx.beginPath();

  ctx.ellipse(
    3,
    radius*.8+jump,
    radius*.9,
    radius*.4,
    0,
    0,
    Math.PI*2
  );

  ctx.fill();

  if (entity.downed) {
    ctx.rotate(-.7);
  }

  ctx.fillStyle =
    skin?.primary ||
    "#c64a4f";

  ctx.strokeStyle =
    entity.protected
      ? "#84dfff"
      : "rgba(255,255,255,.82)";

  ctx.lineWidth =
    entity.protected
      ? 4
      : 3;

  ctx.beginPath();

  ctx.arc(
    0,0,radius,
    0,Math.PI*2
  );

  ctx.fill();
  ctx.stroke();

  ctx.fillStyle =
    "#202328";

  ctx.beginPath();

  ctx.arc(
    radius*.25,
    -radius*.22,
    Math.max(
      2,
      radius*.11
    ),
    0,
    Math.PI*2
  );

  ctx.fill();

  ctx.fillStyle =
    skin?.accent ||
    "#f2c362";

  ctx.fillRect(
    radius*.55,
    -radius*.15,
    radius*.8,
    radius*.38
  );

  if (entity.bot) {
    ctx.fillStyle =
      "#56bdd0";

    ctx.fillRect(
      -radius*.6,
      radius*.75,
      radius*1.2,
      3
    );
  }

  ctx.restore();

  if (hiddenLayer) return;

  ctx.textAlign =
    "center";

  ctx.font =
    `800 ${Math.max(
      10,
      11*camera.zoom
    )}px system-ui`;

  ctx.lineWidth = 4;

  ctx.strokeStyle =
    "rgba(245,245,245,.75)";

  ctx.strokeText(
    entity.name,
    p.x,
    p.y -
      jump -
      radius -
      10
  );

  ctx.fillStyle =
    isFriendEntity(entity)
      ? "#f2c95f"
      : entity.bot
        ? "#25333b"
        : "#20262b";

  ctx.fillText(
    entity.name,
    p.x,
    p.y -
      jump -
      radius -
      10
  );

  if (entity.pet) {
    drawPetFollower(
      entity,
      camera,
      viewport
    );
  }
}

function drawPetFollower(
  entity,
  camera,
  viewport
) {
  const pet =
    CATALOG.pets.find(
      (item) =>
        item.id === entity.pet
    );

  if (!pet) return;

  const p =
    viewportWorldToScreen(
      entity.renderX - 38,
      entity.renderY + 28,
      camera,
      viewport
    );

  ctx.font =
    `${Math.max(
      16,
      20*camera.zoom
    )}px sans-serif`;

  ctx.textAlign =
    "center";

  ctx.fillText(
    pet.icon,
    p.x,
    p.y
  );
}

function drawSpecial(
  entity,
  camera,
  viewport,
  time
) {
  const p =
    viewportWorldToScreen(
      entity.renderX,
      entity.renderY,
      camera,
      viewport
    );

  if (
    entity.specialType ===
      "zombie"
  ) {
    const radius =
      (
        entity.variant === "brute"
          ? 24
          : 19
      ) *
      camera.zoom;

    ctx.fillStyle =
      entity.variant === "brute"
        ? "#4a7745"
        : "#679760";

    ctx.strokeStyle =
      "#344a34";

    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.arc(
      p.x,p.y,radius,
      0,Math.PI*2
    );

    ctx.fill();
    ctx.stroke();

    ctx.fillStyle =
      "#554b48";

    ctx.fillRect(
      p.x-radius*.8,
      p.y+radius*.45,
      radius*1.6,
      radius*.55
    );

    return;
  }

  if (
    entity.specialType ===
      "scp"
  ) {
    if (
      entity.type ===
        "scp999"
    ) {
      ctx.fillStyle =
        "#eaa64d";

      ctx.beginPath();

      ctx.arc(
        p.x,p.y,
        23*camera.zoom,
        0,Math.PI*2
      );

      ctx.fill();

      return;
    }

    const color =
      {
        scp096:"#d7d3cd",
        scp173:"#a89a7a",
        scp049:"#26292b",
        scp106:"#443d39"
      }[entity.type] ||
      "#777";

    ctx.fillStyle =
      color;

    ctx.fillRect(
      p.x-18*camera.zoom,
      p.y-24*camera.zoom,
      36*camera.zoom,
      48*camera.zoom
    );

    return;
  }

  drawMonster(
    entity,
    camera,
    viewport,
    time
  );
}

function drawMonster(
  entity,
  camera,
  viewport,
  time
) {
  const p =
    viewportWorldToScreen(
      entity.renderX,
      entity.renderY,
      camera,
      viewport
    );

  const form =
    CATALOG.monsterForms.find(
      (entry) =>
        entry.id === entity.form
    );

  const radius =
    27 *
    camera.zoom *
    (
      1 +
      Math.sin(
        time*.006
      )*.04
    );

  ctx.save();

  ctx.translate(
    p.x,p.y
  );

  ctx.fillStyle =
    "#211820";

  ctx.strokeStyle =
    entity.sprinting
      ? "#ef5d67"
      : "#925064";

  ctx.lineWidth =
    entity.sprinting
      ? 5
      : 3;

  if (
    form?.shape === "spider" ||
    form?.shape === "twistedSpider"
  ) {
    for (
      let i = 0;
      i < 8;
      i += 1
    ) {
      const angle =
        i/8*Math.PI*2;

      ctx.beginPath();

      ctx.moveTo(0,0);

      ctx.lineTo(
        Math.cos(angle)*
          radius*1.5,
        Math.sin(angle)*
          radius*1.5
      );

      ctx.stroke();
    }
  }

  if (
    form?.shape === "tentacle"
  ) {
    for (
      let i = 0;
      i < 5;
      i += 1
    ) {
      const angle =
        i/5*Math.PI*2 +
        time*.001;

      ctx.beginPath();

      ctx.moveTo(0,0);

      ctx.quadraticCurveTo(
        Math.cos(angle)*
          radius,
        Math.sin(angle)*
          radius,
        Math.cos(angle+.5)*
          radius*1.8,
        Math.sin(angle+.5)*
          radius*1.8
      );

      ctx.stroke();
    }
  }

  ctx.beginPath();

  ctx.arc(
    0,0,radius,
    0,Math.PI*2
  );

  ctx.fill();
  ctx.stroke();

  ctx.fillStyle =
    "#ef626c";

  ctx.beginPath();

  ctx.arc(
    -radius*.25,
    -radius*.18,
    radius*.1,
    0,Math.PI*2
  );

  ctx.arc(
    radius*.25,
    -radius*.18,
    radius*.1,
    0,Math.PI*2
  );

  ctx.fill();

  ctx.restore();
}

function drawVehicle(
  vehicle,
  camera,
  viewport
) {
  const p =
    viewportWorldToScreen(
      vehicle.x,
      vehicle.y,
      camera,
      viewport
    );

  ctx.fillStyle =
    vehicle.type === "boat"
      ? "#956d4d"
      : "#596d79";

  ctx.fillRect(
    p.x-32*camera.zoom,
    p.y-18*camera.zoom,
    64*camera.zoom,
    36*camera.zoom
  );

  if (
    vehicle.type === "boat"
  ) {
    ctx.fillStyle =
      "#ded8ca";

    ctx.fillRect(
      p.x-18*camera.zoom,
      p.y-11*camera.zoom,
      36*camera.zoom,
      10*camera.zoom
    );
  }
}

function drawCat(
  camera,
  viewport
) {
  const cat =
    snapshot.world?.cat;

  if (
    !cat ||
    !cat.active
  ) {
    return;
  }

  const p =
    viewportWorldToScreen(
      cat.x,
      cat.y,
      camera,
      viewport
    );

  ctx.font =
    `${Math.max(
      18,
      22*camera.zoom
    )}px sans-serif`;

  ctx.textAlign =
    "center";

  ctx.fillText(
    "🐈",
    p.x,p.y
  );
}

function drawPetPickup(
  camera,
  viewport
) {
  const pickup =
    snapshot.world
      ?.petPickup;

  if (!pickup) return;

  const pet =
    CATALOG.pets.find(
      (entry) =>
        entry.id ===
        pickup.petId
    );

  if (!pet) return;

  const p =
    viewportWorldToScreen(
      pickup.x,
      pickup.y,
      camera,
      viewport
    );

  ctx.font =
    `${Math.max(
      22,
      28*camera.zoom
    )}px sans-serif`;

  ctx.textAlign =
    "center";

  ctx.fillText(
    pet.icon,
    p.x,p.y
  );

  ctx.fillStyle =
    "#f4d269";

  ctx.font =
    `800 ${Math.max(
      8,
      10*camera.zoom
    )}px system-ui`;

  ctx.fillText(
    "SECRET",
    p.x,
    p.y-25
  );
}

function drawBoss(
  camera,
  viewport,
  time
) {
  const boss =
    snapshot.boss;

  if (!boss) return;

  const p =
    viewportWorldToScreen(
      boss.x,
      boss.y,
      camera,
      viewport
    );

  const radius =
    80 *
    camera.zoom;

  const gradient =
    ctx.createRadialGradient(
      p.x-radius*.2,
      p.y-radius*.2,
      radius*.1,
      p.x,p.y,radius
    );

  gradient.addColorStop(
    0,
    "#c77add"
  );

  gradient.addColorStop(
    .4,
    "#5a3971"
  );

  gradient.addColorStop(
    1,
    "#25192e"
  );

  ctx.fillStyle =
    gradient;

  ctx.strokeStyle =
    "#d68cec";

  ctx.lineWidth = 5;

  ctx.beginPath();

  ctx.arc(
    p.x,p.y,radius,
    0,Math.PI*2
  );

  ctx.fill();
  ctx.stroke();

  for (
    let i = 0;
    i < 8;
    i += 1
  ) {
    const angle =
      i/8*Math.PI*2 +
      time*.0004;

    ctx.strokeStyle =
      "rgba(196,112,220,.45)";

    ctx.beginPath();

    ctx.moveTo(
      p.x,p.y
    );

    ctx.lineTo(
      p.x +
        Math.cos(angle)*
        radius*1.6,
      p.y +
        Math.sin(angle)*
        radius*1.6
    );

    ctx.stroke();
  }
}

function drawBuildBlocks(
  camera,
  viewport
) {
  if (
    currentLobby.mode !==
      "build"
  ) {
    return;
  }

  for (
    const placed of
    snapshot.buildBlocks
  ) {
    const block =
      CATALOG.blocks.find(
        (entry) =>
          entry.id ===
          placed.blockId
      );

    if (!block) continue;

    const p =
      viewportWorldToScreen(
        placed.x-22,
        placed.y-22,
        camera,
        viewport
      );

    ctx.fillStyle =
      block.color;

    ctx.fillRect(
      p.x,
      p.y,
      44*camera.zoom,
      44*camera.zoom
    );

    ctx.strokeStyle =
      "rgba(0,0,0,.25)";

    ctx.strokeRect(
      p.x,
      p.y,
      44*camera.zoom,
      44*camera.zoom
    );
  }
}

function drawEffects(
  camera,
  viewport,
  time
) {
  for (
    let i =
      effects.length-1;
    i >= 0;
    i -= 1
  ) {
    const effect =
      effects[i];

    if (
      time > effect.until
    ) {
      effects.splice(i,1);
      continue;
    }

    if (
      effect.type === "beam"
    ) {
      const a =
        viewportWorldToScreen(
          effect.fromX,
          effect.fromY,
          camera,
          viewport
        );

      const b =
        viewportWorldToScreen(
          effect.toX,
          effect.toY,
          camera,
          viewport
        );

      ctx.save();

      ctx.strokeStyle =
        effect.color;

      ctx.lineWidth = 7;

      ctx.shadowColor =
        effect.color;

      ctx.shadowBlur = 18;

      ctx.globalAlpha =
        clamp01(
          (
            effect.until-time
          )/350
        );

      ctx.beginPath();

      ctx.moveTo(a.x,a.y);
      ctx.lineTo(b.x,b.y);
      ctx.stroke();

      ctx.restore();
    }

    if (
      effect.type ===
        "shockwave"
    ) {
      const p =
        viewportWorldToScreen(
          effect.x,
          effect.y,
          camera,
          viewport
        );

      const progress =
        1 -
        clamp01(
          (
            effect.until-time
          )/1800
        );

      ctx.strokeStyle =
        `rgba(187,102,211,${1-progress})`;

      ctx.lineWidth = 8;

      ctx.beginPath();

      ctx.arc(
        p.x,p.y,
        progress*
          430*
          camera.zoom,
        0,Math.PI*2
      );

      ctx.stroke();
    }
  }
}

function clamp01(value) {
  return Math.max(
    0,
    Math.min(1,value)
  );
}

function drawView(
  viewport,
  focusId,
  camera,
  time
) {
  const focus =
    renderEntities.get(
      focusId
    );

  if (focus) {
    const targetZoom =
      innerWidth < 700
        ? .74
        : .92;

    camera.zoom +=
      (
        targetZoom -
        camera.zoom
      )*.04;

    camera.x +=
      (
        focus.renderX -
        camera.x
      )*.12;

    camera.y +=
      (
        focus.renderY -
        camera.y
      )*.12;
  }

  ctx.save();

  ctx.beginPath();

  ctx.rect(
    viewport.x,
    viewport.y,
    viewport.w,
    viewport.h
  );

  ctx.clip();

  ctx.fillStyle =
    "#777";

  ctx.fillRect(
    viewport.x,
    viewport.y,
    viewport.w,
    viewport.h
  );

  for (
    const zone of
    currentMap.zones
  ) {
    drawZone(
      zone,
      camera,
      viewport
    );
  }

  for (
    const water of
    currentMap.water
  ) {
    drawWater(
      water,
      camera,
      viewport,
      time
    );
  }

  const staticObjects =
    nearbyStatic(
      camera,
      viewport
    );

  /*
    Physisches Verstecken:
    versteckte Figur zuerst, Möbel danach.
  */
  for (
    const entity of
    renderEntities.values()
  ) {
    if (entity.hidden) {
      drawEntity(
        entity,
        camera,
        viewport,
        true
      );
    }
  }

  for (
    const wall of
    staticObjects.walls
  ) {
    drawWall(
      wall,
      camera,
      viewport
    );
  }

  for (
    const prop of
    staticObjects.props
  ) {
    drawProp(
      prop,
      camera,
      viewport
    );
  }

  for (
    const door of
    currentMap.doors
  ) {
    drawDoor(
      door,
      camera,
      viewport
    );
  }

  drawBuildBlocks(
    camera,
    viewport
  );

  for (
    const vehicle of
    snapshot.vehicles || []
  ) {
    drawVehicle(
      vehicle,
      camera,
      viewport
    );
  }

  drawCat(
    camera,
    viewport
  );

  drawPetPickup(
    camera,
    viewport
  );

  for (
    const entity of
    renderEntities.values()
  ) {
    if (!entity.hidden) {
      drawEntity(
        entity,
        camera,
        viewport,
        false
      );
    }
  }

  for (
    const entity of
    renderSpecial.values()
  ) {
    drawSpecial(
      entity,
      camera,
      viewport,
      time
    );
  }

  drawBoss(
    camera,
    viewport,
    time
  );

  drawEffects(
    camera,
    viewport,
    time
  );

  drawLighting(
    viewport,
    focus,
    time
  );

  ctx.restore();
}

function drawLighting(
  viewport,
  focus,
  time
) {
  if (
    !currentMap.dark &&
    snapshot.world?.powerOn !==
      false &&
    snapshot.world?.fogAmount <
      .1
  ) {
    return;
  }

  const dark =
    currentMap.dark
      ? .45
      : snapshot.world?.powerOn ===
          false
        ? .5
        : 0;

  if (dark > 0) {
    ctx.fillStyle =
      `rgba(6,9,12,${dark})`;

    ctx.fillRect(
      viewport.x,
      viewport.y,
      viewport.w,
      viewport.h
    );
  }

  /*
    Taschenlampenlicht:
    Kein destination-out auf dem Map-Canvas.
    Dadurch werden Wände nicht zerstört.
  */
  if (
    focus &&
    (
      currentMap.id === "taiga" ||
      currentMap.dark
    )
  ) {
    const p = {
      x:
        viewport.x +
        viewport.w/2,
      y:
        viewport.y +
        viewport.h/2
    };

    const gradient =
      ctx.createRadialGradient(
        p.x,p.y,20,
        p.x,p.y,
        280
      );

    gradient.addColorStop(
      0,
      "rgba(255,244,210,.16)"
    );

    gradient.addColorStop(
      .55,
      "rgba(255,244,210,.08)"
    );

    gradient.addColorStop(
      1,
      "rgba(255,244,210,0)"
    );

    ctx.fillStyle =
      gradient;

    ctx.fillRect(
      viewport.x,
      viewport.y,
      viewport.w,
      viewport.h
    );
  }

  const fog =
    snapshot.world?.fogAmount ||
    0;

  if (fog > 0) {
    ctx.fillStyle =
      `rgba(174,184,182,${fog*.24})`;

    ctx.fillRect(
      viewport.x,
      viewport.y,
      viewport.w,
      viewport.h
    );
  }
}

function drawFrame(time) {
  if (
    !inGame ||
    !currentMap
  ) {
    return;
  }

  const split =
    Boolean(
      splitPlayerId &&
      secondMe()
    );

  if (!split) {
    drawView(
      {
        x:0,
        y:0,
        w:innerWidth,
        h:innerHeight
      },
      wsClientId,
      cameras.main,
      time
    );
  } else {
    const half =
      innerWidth/2;

    drawView(
      {
        x:0,
        y:0,
        w:half,
        h:innerHeight
      },
      wsClientId,
      cameras.main,
      time
    );

    drawView(
      {
        x:half,
        y:0,
        w:half,
        h:innerHeight
      },
      splitPlayerId,
      cameras.split,
      time
    );

    ctx.strokeStyle =
      "rgba(255,255,255,.4)";

    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(half,0);
    ctx.lineTo(
      half,
      innerHeight
    );
    ctx.stroke();
  }
}

/* ----------------------------------------------------------
   Minimap
---------------------------------------------------------- */

function drawMinimap() {
  if (
    !currentMap ||
    !SETTINGS.minimap
  ) {
    return;
  }

  const w =
    minimap.width;

  const h =
    minimap.height;

  minimapCtx.fillStyle =
    "#171a1e";

  minimapCtx.fillRect(
    0,0,w,h
  );

  const scale =
    Math.min(
      w/currentMap.width,
      h/currentMap.height
    );

  const ox =
    (
      w-
      currentMap.width*scale
    )/2;

  const oy =
    (
      h-
      currentMap.height*scale
    )/2;

  for (
    const zone of
    currentMap.zones
  ) {
    minimapCtx.fillStyle =
      zone.color;

    minimapCtx.fillRect(
      ox+zone.x*scale,
      oy+zone.y*scale,
      zone.w*scale,
      zone.h*scale
    );
  }

  for (
    const entity of
    renderEntities.values()
  ) {
    if (
      entity.hidden ||
      entity.downed ||
      entity.eliminated
    ) {
      continue;
    }

    minimapCtx.fillStyle =
      entity.id === wsClientId
        ? "#fff"
        : entity.bot
          ? "#6aa8e2"
          : isFriendEntity(entity)
            ? "#f0cc62"
            : "#e9bd72";

    minimapCtx.beginPath();

    minimapCtx.arc(
      ox+
        entity.renderX*scale,
      oy+
        entity.renderY*scale,
      entity.id ===
        wsClientId
        ? 4
        : 2.5,
      0,
      Math.PI*2
    );

    minimapCtx.fill();
  }

  for (
    const monster of
    snapshot.monsters || []
  ) {
    minimapCtx.fillStyle =
      "#d64b59";

    minimapCtx.beginPath();

    minimapCtx.arc(
      ox+
        monster.x*scale,
      oy+
        monster.y*scale,
      3,
      0,
      Math.PI*2
    );

    minimapCtx.fill();
  }
}

/* ----------------------------------------------------------
   HUD
---------------------------------------------------------- */

function updateWorldUi() {
  const player =
    me();

  if (!player) return;

  hpText.textContent =
    Math.round(player.hp);

  hpFill.style.width =
    `${
      clamp01(
        player.hp /
        Math.max(
          1,
          player.maxHp
        )
      )*100
    }%`;

  fishHud.textContent =
    player.fish || 0;

  const pet =
    player.pet
      ? CATALOG.pets.find(
          (entry) =>
            entry.id ===
            player.pet
        )
      : null;

  petHud.textContent =
    player.catTotem
      ? "🐈"
      : pet?.icon || "";

  downedOverlay.classList.toggle(
    "hidden",
    !player.downed
  );

  statusHud.textContent =
    player.hidden
      ? "VERSTECKT"
      : player.downed
        ? "BRAUCHT HILFE"
        : player.eliminated
          ? "AUSGESCHIEDEN"
          : player.protected
            ? "GESCHÜTZT"
            : "AKTIV";

  if (snapshot.boss) {
    show(bossHud);

    bossBar.style.width =
      `${
        clamp01(
          snapshot.boss.hp /
          snapshot.boss.maxHp
        )*100
      }%`;
  } else {
    hide(bossHud);
  }

  updateInteractionPrompt();
}

function modeUsesWeapons() {
  return [
    "battle_royale_ffa",
    "battle_royale_team",
    "ctf",
    "zombie",
    "stormking"
  ].includes(
    currentLobby?.mode
  );
}

function updateModeSpecificUi() {
  const uses =
    modeUsesWeapons();

  weaponHud.classList.toggle(
    "hidden",
    !uses
  );

  buildToolbar.classList.toggle(
    "hidden",
    currentLobby?.mode !==
      "build"
  );

  const weapon =
    CATALOG.weapons.find(
      (entry) =>
        entry.id ===
        selectedWeapon
    );

  weaponName.textContent =
    weapon?.name ||
    "Pulse Carbine";
}

function nearestInteractive() {
  const player =
    me();

  if (
    !player ||
    !currentMap
  ) {
    return null;
  }

  if (player.hidden) {
    return "Versteck verlassen";
  }

  if (player.vehicleId) {
    return "Fahrzeug verlassen";
  }

  for (
    const vehicle of
    snapshot.vehicles || []
  ) {
    if (
      !vehicle.driverId &&
      Math.hypot(
        vehicle.x -
          player.renderX,
        vehicle.y -
          player.renderY
      ) < 130
    ) {
      return vehicle.type ===
        "boat"
        ? "Boot benutzen"
        : "Fahrzeug benutzen";
    }
  }

  const petPickup =
    snapshot.world
      ?.petPickup;

  if (
    petPickup &&
    Math.hypot(
      petPickup.x -
        player.renderX,
      petPickup.y -
        player.renderY
    ) < 130
  ) {
    return "Secret-Begleiter aufnehmen";
  }

  const catState =
    snapshot.world?.cat;

  if (
    catState?.active &&
    !catState.ownerId &&
    Math.hypot(
      catState.x -
        player.renderX,
      catState.y -
        player.renderY
    ) < 120
  ) {
    return "Katze füttern";
  }

  for (
    const entity of
    renderEntities.values()
  ) {
    if (
      entity.id !==
        player.id &&
      entity.downed &&
      Math.hypot(
        entity.renderX -
          player.renderX,
        entity.renderY -
          player.renderY
      ) < 110
    ) {
      return `${entity.name} wiederbeleben`;
    }
  }

  for (
    const hideout of
    currentMap.hideouts
  ) {
    if (
      Math.hypot(
        hideout.entranceX -
          player.renderX,
        hideout.entranceY -
          player.renderY
      ) < 145
    ) {
      return hideout.label;
    }
  }

  for (
    const action of
    currentMap.interactions
  ) {
    if (
      Math.hypot(
        action.x -
          player.renderX,
        action.y -
          player.renderY
      ) <
      (action.radius || 135)
    ) {
      return action.label;
    }
  }

  for (
    const npc of
    currentMap.npcs
  ) {
    if (
      npc.trader &&
      Math.hypot(
        npc.x -
          player.renderX,
        npc.y -
          player.renderY
      ) < 145
    ) {
      return "Mit Händler sprechen";
    }
  }

  return null;
}

function updateInteractionPrompt() {
  const text =
    nearestInteractive();

  if (!text) {
    hide(interactionPrompt);
    return;
  }

  interactionPrompt.querySelector(
    "span"
  ).textContent =
    text;

  show(interactionPrompt);
}

/* ----------------------------------------------------------
   Chat
---------------------------------------------------------- */

chatForm.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    const text =
      chatInput.value.trim();

    if (!text) return;

    send({
      type: "chat",
      text
    });

    chatInput.value = "";
    chatInput.blur();
  }
);

function addChat(data) {
  const div =
    document.createElement(
      "div"
    );

  div.className =
    "chat-line";

  if (data.bot) {
    div.classList.add("bot");
  }

  if (data.system) {
    div.classList.add("system");
  }

  if (
    data.accountId &&
    friendIds().has(
      data.accountId
    )
  ) {
    div.classList.add("friend");
  }

  div.innerHTML = `
    <strong>
      ${escapeHtml(data.from || "SYSTEM")}
    </strong>:
    ${escapeHtml(data.text || "")}
  `;

  chatLog.appendChild(
    div
  );

  while (
    chatLog.children.length >
    50
  ) {
    chatLog.firstChild.remove();
  }

  chatLog.scrollTop =
    chatLog.scrollHeight;
}

$("#chatToggle").addEventListener(
  "click",
  () => {
    chat.classList.toggle(
      "collapsed"
    );
  }
);

function toast(
  text,
  tone = ""
) {
  const div =
    document.createElement(
      "div"
    );

  div.className =
    `toast ${tone}`;

  div.textContent =
    text;

  notifications.appendChild(
    div
  );

  setTimeout(
    () => div.remove(),
    3300
  );
}

function showEvent(event) {
  const names = {
    power_outage:
      "Stromausfall",
    fog:
      "Nebel zieht auf",
    locked_area:
      "Bereiche wurden verriegelt",
    alarm:
      "Alarm",
    flood:
      "Überschwemmung",
    npc_event:
      "Ungewöhnliches NPC-Ereignis",
    secret_room:
      "Ein Geheimraum wurde geöffnet"
  };

  toast(
    names[event] || event,
    "warning"
  );
}

/* ----------------------------------------------------------
   Input
---------------------------------------------------------- */

function normalizedInput(state) {
  let x =
    (
      state.right ? 1 : 0
    ) -
    (
      state.left ? 1 : 0
    );

  let y =
    (
      state.down ? 1 : 0
    ) -
    (
      state.up ? 1 : 0
    );

  if (
    state === input &&
    (
      Math.abs(
        state.joyX
      ) > .05 ||
      Math.abs(
        state.joyY
      ) > .05
    )
  ) {
    x = state.joyX;
    y = state.joyY;
  }

  const length =
    Math.hypot(x,y);

  if (length > 1) {
    x /= length;
    y /= length;
  }

  return {x,y};
}

function sendInputs() {
  if (
    !inGame ||
    paused
  ) {
    return;
  }

  const primary =
    normalizedInput(input);

  if (
    Math.abs(
      primary.x -
      lastInput.x
    ) > .001 ||
    Math.abs(
      primary.y -
      lastInput.y
    ) > .001
  ) {
    lastInput =
      primary;

    send({
      type: "input",
      x: primary.x,
      y: primary.y
    });
  }

  if (
    splitWs &&
    splitPlayerId
  ) {
    const second =
      normalizedInput(
        splitInput
      );

    if (
      Math.abs(
        second.x -
        lastSplitInput.x
      ) > .001 ||
      Math.abs(
        second.y -
        lastSplitInput.y
      ) > .001
    ) {
      lastSplitInput =
        second;

      splitSend({
        type: "input",
        x: second.x,
        y: second.y
      });
    }
  }
}

setInterval(
  sendInputs,
  1000/30
);

window.addEventListener(
  "keydown",
  (event) => {
    if (
      document.activeElement ===
        chatInput ||
      ["INPUT","SELECT"].includes(
        document.activeElement
          ?.tagName
      )
    ) {
      return;
    }

    switch (event.code) {
      case "KeyW":
        input.up = true;
        break;

      case "KeyS":
        input.down = true;
        break;

      case "KeyA":
        input.left = true;
        break;

      case "KeyD":
        input.right = true;
        break;

      case "Space":
        event.preventDefault();

        if (!jumpHeld) {
          jumpHeld = true;

          send({
            type: "jumpHeld",
            held: true
          });
        }
        break;

      case "KeyE":
        send({
          type: "interact"
        });
        break;

      case "ArrowUp":
        splitInput.up = true;
        break;

      case "ArrowDown":
        splitInput.down = true;
        break;

      case "ArrowLeft":
        splitInput.left = true;
        break;

      case "ArrowRight":
        splitInput.right = true;
        break;

      case "Numpad0":
      case "ShiftRight":
        if (!splitJumpHeld) {
          splitJumpHeld = true;

          splitSend({
            type: "jumpHeld",
            held: true
          });
        }
        break;

      case "Enter":
        if (inGame) {
          chatInput.focus();
        }
        break;

      case "Escape":
        if (inGame) {
          togglePause();
        }
        break;

      default:
        break;
    }
  }
);

window.addEventListener(
  "keyup",
  (event) => {
    switch (event.code) {
      case "KeyW":
        input.up = false;
        break;

      case "KeyS":
        input.down = false;
        break;

      case "KeyA":
        input.left = false;
        break;

      case "KeyD":
        input.right = false;
        break;

      case "Space":
        jumpHeld = false;

        send({
          type: "jumpHeld",
          held: false
        });
        break;

      case "ArrowUp":
        splitInput.up = false;
        break;

      case "ArrowDown":
        splitInput.down = false;
        break;

      case "ArrowLeft":
        splitInput.left = false;
        break;

      case "ArrowRight":
        splitInput.right = false;
        break;

      case "Numpad0":
      case "ShiftRight":
        splitJumpHeld = false;

        splitSend({
          type: "jumpHeld",
          held: false
        });
        break;

      default:
        break;
    }
  }
);

/* Mobile joystick */

joystick.addEventListener(
  "pointerdown",
  (event) => {
    joystickPointer =
      event.pointerId;

    joystick.setPointerCapture(
      event.pointerId
    );

    updateJoystick(event);
  }
);

joystick.addEventListener(
  "pointermove",
  (event) => {
    if (
      event.pointerId ===
        joystickPointer
    ) {
      updateJoystick(event);
    }
  }
);

joystick.addEventListener(
  "pointerup",
  resetJoystick
);

joystick.addEventListener(
  "pointercancel",
  resetJoystick
);

function updateJoystick(event) {
  const rect =
    joystick.getBoundingClientRect();

  const cx =
    rect.left +
    rect.width/2;

  const cy =
    rect.top +
    rect.height/2;

  let dx =
    event.clientX-cx;

  let dy =
    event.clientY-cy;

  const max =
    rect.width*.34;

  const d =
    Math.hypot(dx,dy);

  if (d > max) {
    dx =
      dx/d*max;

    dy =
      dy/d*max;
  }

  input.joyX =
    dx/max;

  input.joyY =
    dy/max;

  stick.style.transform =
    `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
}

function resetJoystick() {
  joystickPointer = null;

  input.joyX = 0;
  input.joyY = 0;

  stick.style.transform =
    "translate(-50%,-50%)";
}

touchJump.addEventListener(
  "pointerdown",
  (event) => {
    event.preventDefault();

    touchJump.setPointerCapture(
      event.pointerId
    );

    jumpHeld = true;

    send({
      type: "jumpHeld",
      held: true
    });
  }
);

touchJump.addEventListener(
  "pointerup",
  () => {
    jumpHeld = false;

    send({
      type: "jumpHeld",
      held: false
    });
  }
);

touchJump.addEventListener(
  "pointercancel",
  () => {
    jumpHeld = false;

    send({
      type: "jumpHeld",
      held: false
    });
  }
);

touchInteract.addEventListener(
  "pointerdown",
  (event) => {
    event.preventDefault();

    send({
      type: "interact"
    });
  }
);

/* ----------------------------------------------------------
   Fire / Build touch
---------------------------------------------------------- */

function screenToWorld(
  sx,
  sy,
  camera,
  viewport
) {
  return {
    x:
      camera.x +
      (
        sx -
        (
          viewport.x +
          viewport.w/2
        )
      ) /
      camera.zoom,

    y:
      camera.y +
      (
        sy -
        (
          viewport.y +
          viewport.h/2
        )
      ) /
      camera.zoom
  };
}

let lastBuildTap = {
  time: 0,
  x: 0,
  y: 0
};

canvas.addEventListener(
  "pointerdown",
  (event) => {
    if (
      !inGame ||
      paused
    ) {
      return;
    }

    const player =
      me();

    if (!player) return;

    const viewport = {
      x:0,
      y:0,
      w:
        splitPlayerId
          ? innerWidth/2
          : innerWidth,
      h:innerHeight
    };

    const world =
      screenToWorld(
        event.clientX,
        event.clientY,
        cameras.main,
        viewport
      );

    clickWorld = world;

    if (
      currentLobby.mode ===
        "build"
    ) {
      const now =
        performance.now();

      const doubleTap =
        now -
          lastBuildTap.time <
          280 &&
        Math.hypot(
          world.x -
            lastBuildTap.x,
          world.y -
            lastBuildTap.y
        ) < 90;

      if (doubleTap) {
        send({
          type:
            "buildRemove",
          x: world.x,
          y: world.y
        });

        lastBuildTap.time = 0;
      } else {
        send({
          type:
            "buildPlace",
          blockId:
            buildBlockSelect.value,
          x: world.x,
          y: world.y
        });

        lastBuildTap = {
          time: now,
          x: world.x,
          y: world.y
        };
      }

      return;
    }

    if (
      modeUsesWeapons()
    ) {
      const direction =
        normalize2(
          world.x -
            player.renderX,
          world.y -
            player.renderY
        );

      send({
        type: "fire",
        dx: direction.x,
        dy: direction.y
      });
    }
  }
);

function normalize2(x,y) {
  const length =
    Math.hypot(x,y);

  if (length < .001) {
    return {
      x:0,
      y:0
    };
  }

  return {
    x:x/length,
    y:y/length
  };
}

saveBuildButton.addEventListener(
  "click",
  async () => {
    if (!account) {
      toast(
        "Zum Speichern bitte einloggen.",
        "warning"
      );

      return;
    }

    const name =
      prompt(
        "Name deiner Map:"
      ) || "Meine Map";

    try {
      await api(
        "/api/build/save",
        {
          method: "POST",
          body:
            JSON.stringify({
              name,
              blocks:
                snapshot.buildBlocks
            })
        }
      );

      toast(
        "Bauwelt gespeichert.",
        "good"
      );
    } catch (error) {
      toast(
        error.message,
        "warning"
      );
    }
  }
);

/* ----------------------------------------------------------
   Pause
---------------------------------------------------------- */

function togglePause(force) {
  paused =
    typeof force === "boolean"
      ? force
      : !paused;

  pauseMenu.classList.toggle(
    "hidden",
    !paused
  );

  if (paused) {
    send({
      type: "input",
      x:0,
      y:0
    });

    send({
      type: "jumpHeld",
      held:false
    });
  }
}

$("#pauseButton").addEventListener(
  "click",
  () => togglePause()
);

$("#resumeButton").addEventListener(
  "click",
  () => togglePause(false)
);

$("#leaveGameButton").addEventListener(
  "click",
  leaveGame
);

$("#inGameSettingsButton").addEventListener(
  "click",
  () => {
    openPanel("settingsPanel");
  }
);

$("#inGameSocialButton").addEventListener(
  "click",
  () => {
    openPanel("socialPanel");
  }
);

/* ----------------------------------------------------------
   Map Vote
---------------------------------------------------------- */

function renderMapVote(candidates) {
  voteChoices.innerHTML = "";

  for (const mapId of candidates) {
    const map =
      CATALOG.maps.find(
        (entry) =>
          entry.id === mapId
      );

    const button =
      document.createElement(
        "button"
      );

    button.innerHTML = `
      <strong>
        ${escapeHtml(map?.name || mapId)}
      </strong>

      <br>

      <small>
        ${escapeHtml(map?.subtitle || "")}
      </small>
    `;

    button.addEventListener(
      "click",
      () => {
        send({
          type: "voteMap",
          mapId
        });

        toast(
          `Stimme: ${map?.name || mapId}`,
          "good"
        );
      }
    );

    voteChoices.appendChild(
      button
    );
  }

  show(voteOverlay);
}

/* ----------------------------------------------------------
   Piano
---------------------------------------------------------- */

const NOTES = [
  130.81,138.59,146.83,155.56,
  164.81,174.61,185.00,196.00,
  207.65,220.00,233.08,246.94,
  261.63,277.18,293.66,311.13,
  329.63,349.23,369.99,392.00,
  415.30,440.00,466.16,493.88,
  523.25,554.37,587.33,622.25,
  659.25,698.46,739.99,783.99,
  830.61,880.00,932.33,987.77
];

function buildPiano() {
  const container =
    $("#pianoKeys");

  container.innerHTML = "";

  NOTES.forEach(
    (frequency,index) => {
      const black =
        [1,3,6,8,10].includes(
          index%12
        );

      const key =
        document.createElement(
          "button"
        );

      key.className =
        `piano-key ${black ? "black" : ""}`;

      key.addEventListener(
        "pointerdown",
        () =>
          audio.note(
            frequency,
            .48,
            .18
          )
      );

      container.appendChild(
        key
      );
    }
  );
}

$("#closePiano").addEventListener(
  "click",
  () => hide(pianoOverlay)
);

$$("[data-drum]").forEach(
  (button) => {
    button.addEventListener(
      "pointerdown",
      () => {
        audio.drum(
          button.dataset.drum
        );
      }
    );
  }
);

/* ----------------------------------------------------------
   Music
---------------------------------------------------------- */

const audio = {
  context:null,
  master:null,
  timer:null,
  step:0,
  nextTime:0,

  ensure() {
    if (!SETTINGS.music) {
      return;
    }

    if (!this.context) {
      this.context =
        new (
          window.AudioContext ||
          window.webkitAudioContext
        )();

      this.master =
        this.context.createGain();

      this.master.connect(
        this.context.destination
      );
    }

    if (
      this.context.state ===
        "suspended"
    ) {
      this.context.resume();
    }

    this.updateVolume();

    if (!this.timer) {
      this.nextTime =
        this.context.currentTime;

      this.timer =
        setInterval(
          () => this.schedule(),
          25
        );
    }
  },

  updateVolume() {
    if (!this.master) return;

    this.master.gain.value =
      SETTINGS.music
        ? SETTINGS.volume /
          100 *
          .28
        : 0;
  },

  selectedTrack() {
    if (!CATALOG) return null;

    return (
      CATALOG.tracks.find(
        (track) =>
          track.id ===
          musicSelect.value
      ) ||
      CATALOG.tracks[0]
    );
  },

  schedule() {
    if (
      !this.context ||
      !SETTINGS.music
    ) {
      return;
    }

    const track =
      this.selectedTrack();

    if (!track) return;

    while (
      this.nextTime <
      this.context.currentTime +
        .12
    ) {
      this.playStep(
        track,
        this.step,
        this.nextTime
      );

      this.step =
        (this.step+1)%16;

      const beat =
        60 /
        track.bpm /
        4;

      const swing =
        this.step%2
          ? beat*.15
          : -beat*.045;

      this.nextTime +=
        beat+swing;
    }
  },

  osc(
    type,
    frequency,
    time,
    duration,
    volume
  ) {
    const osc =
      this.context.createOscillator();

    const gain =
      this.context.createGain();

    osc.type = type;

    osc.frequency.setValueAtTime(
      frequency,
      time
    );

    gain.gain.setValueAtTime(
      .0001,
      time
    );

    gain.gain.exponentialRampToValueAtTime(
      Math.max(
        .0001,
        volume
      ),
      time+.008
    );

    gain.gain.exponentialRampToValueAtTime(
      .0001,
      time+duration
    );

    osc.connect(gain);
    gain.connect(this.master);

    osc.start(time);
    osc.stop(
      time+duration+.03
    );
  },

  noise(
    time,
    duration,
    volume
  ) {
    const length =
      Math.floor(
        this.context.sampleRate *
        duration
      );

    const buffer =
      this.context.createBuffer(
        1,
        length,
        this.context.sampleRate
      );

    const data =
      buffer.getChannelData(0);

    for (
      let i=0;
      i<length;
      i+=1
    ) {
      data[i] =
        Math.random()*2-1;
    }

    const source =
      this.context.createBufferSource();

    const gain =
      this.context.createGain();

    source.buffer =
      buffer;

    gain.gain.setValueAtTime(
      volume,
      time
    );

    gain.gain.exponentialRampToValueAtTime(
      .0001,
      time+duration
    );

    source.connect(gain);
    gain.connect(this.master);

    source.start(time);
  },

  playStep(
    track,
    step,
    time
  ) {
    const root =
      55 *
      Math.pow(
        2,
        (track.root-45)/12
      );

    if (
      step === 0 ||
      step === 8
    ) {
      this.osc(
        "sine",
        55,
        time,
        .13,
        .24
      );
    }

    if (
      step === 4 ||
      step === 12
    ) {
      this.noise(
        time,
        .09,
        .11
      );
    }

    if (step%2===0) {
      this.noise(
        time,
        .022,
        .018
      );
    }

    if (step%4===0) {
      const sequence =
        [1,.84,.75,.94];

      this.osc(
        "triangle",
        root*
          sequence[
            step/4
          ],
        time,
        .22,
        .1
      );
    }

    if (
      [3,7,11,15].includes(
        step
      )
    ) {
      const chordRoot =
        root*2.2;

      this.osc(
        "triangle",
        chordRoot,
        time,
        .1,
        .025
      );

      this.osc(
        "triangle",
        chordRoot*1.19,
        time,
        .1,
        .018
      );

      this.osc(
        "triangle",
        chordRoot*1.5,
        time,
        .1,
        .016
      );
    }
  },

  note(
    frequency,
    duration,
    volume
  ) {
    this.ensure();

    if (!this.context) {
      return;
    }

    this.osc(
      "triangle",
      frequency,
      this.context.currentTime,
      duration,
      volume
    );
  },

  drum(type) {
    this.ensure();

    if (!this.context) return;

    const now =
      this.context.currentTime;

    if (type==="kick") {
      this.osc(
        "sine",
        58,
        now,
        .16,
        .28
      );
    } else if (
      type==="snare"
    ) {
      this.noise(
        now,
        .11,
        .2
      );
    } else if (
      type==="hat"
    ) {
      this.noise(
        now,
        .03,
        .08
      );
    } else {
      this.osc(
        "sine",
        110,
        now,
        .13,
        .16
      );
    }
  }
};

musicSelect.addEventListener(
  "change",
  () => {
    localStorage.setItem(
      "duckymaps_track",
      musicSelect.value
    );

    audio.step = 0;
  }
);

musicEnabled.addEventListener(
  "change",
  saveSettings
);

musicVolume.addEventListener(
  "input",
  saveSettings
);

/* ----------------------------------------------------------
   Voice Chat
---------------------------------------------------------- */

const voice = {
  stream:null,
  peers:new Map(),

  async enable() {
    if (this.stream) {
      send({
        type:"voiceReady",
        ready:true
      });

      return;
    }

    try {
      this.stream =
        await navigator.mediaDevices
          .getUserMedia({
            audio:true,
            video:false
          });

      send({
        type:"voiceReady",
        ready:true
      });
    } catch {
      voiceEnabled.checked =
        false;

      toast(
        "Mikrofonzugriff wurde nicht erlaubt.",
        "warning"
      );
    }
  },

  disable() {
    send({
      type:"voiceReady",
      ready:false
    });

    for (
      const peer of
      this.peers.values()
    ) {
      peer.pc.close();
      peer.audio.remove();
    }

    this.peers.clear();

    if (this.stream) {
      for (
        const track of
        this.stream.getTracks()
      ) {
        track.stop();
      }
    }

    this.stream = null;
  },

  async updatePeers(peers) {
    if (!this.stream) return;

    const wanted =
      new Set(
        peers
          .filter(
            (peer) =>
              peer.id !==
              wsClientId
          )
          .map(
            (peer) =>
              peer.id
          )
      );

    for (
      const [
        id,
        peer
      ] of this.peers
    ) {
      if (!wanted.has(id)) {
        peer.pc.close();
        peer.audio.remove();
        this.peers.delete(id);
      }
    }

    for (const peer of peers) {
      if (
        peer.id === wsClientId ||
        this.peers.has(peer.id)
      ) {
        continue;
      }

      const shouldOffer =
        wsClientId <
        peer.id;

      await this.createPeer(
        peer.id,
        shouldOffer
      );
    }
  },

  async createPeer(
    peerId,
    offer
  ) {
    const pc =
      new RTCPeerConnection({
        iceServers:[
          {
            urls:
              "stun:stun.l.google.com:19302"
          }
        ]
      });

    for (
      const track of
      this.stream.getTracks()
    ) {
      pc.addTrack(
        track,
        this.stream
      );
    }

    const audio =
      document.createElement(
        "audio"
      );

    audio.autoplay = true;
    audio.playsInline = true;

    document.body.appendChild(
      audio
    );

    pc.ontrack =
      (event) => {
        audio.srcObject =
          event.streams[0];
      };

    pc.onicecandidate =
      (event) => {
        if (
          event.candidate
        ) {
          send({
            type:
              "voiceSignal",
            target:
              peerId,
            signal:{
              candidate:
                event.candidate
            }
          });
        }
      };

    this.peers.set(
      peerId,
      {pc,audio}
    );

    if (offer) {
      const description =
        await pc.createOffer();

      await pc.setLocalDescription(
        description
      );

      send({
        type:"voiceSignal",
        target:peerId,
        signal:{
          description
        }
      });
    }
  },

  async handleSignal(
    from,
    signal
  ) {
    if (!this.stream) {
      return;
    }

    if (
      !this.peers.has(from)
    ) {
      await this.createPeer(
        from,
        false
      );
    }

    const peer =
      this.peers.get(from);

    if (
      signal.description
    ) {
      await peer.pc
        .setRemoteDescription(
          signal.description
        );

      if (
        signal.description.type ===
        "offer"
      ) {
        const answer =
          await peer.pc
            .createAnswer();

        await peer.pc
          .setLocalDescription(
            answer
          );

        send({
          type:"voiceSignal",
          target:from,
          signal:{
            description:
              answer
          }
        });
      }
    }

    if (
      signal.candidate
    ) {
      try {
        await peer.pc
          .addIceCandidate(
            signal.candidate
          );
      } catch {}
    }
  }
};

voiceEnabled.addEventListener(
  "change",
  () => {
    if (
      voiceEnabled.checked &&
      inGame
    ) {
      voice.enable();
    } else {
      voice.disable();
    }
  }
);

/* ----------------------------------------------------------
   Loop
---------------------------------------------------------- */

function loop(time) {
  const dt =
    Math.min(
      .05,
      (
        time -
        lastFrame
      )/1000
    );

  lastFrame = time;

  if (
    inGame &&
    currentMap
  ) {
    smooth(dt);

    drawFrame(time);
    drawMinimap();
  }

  requestAnimationFrame(
    loop
  );
}

/* ----------------------------------------------------------
   PWA
---------------------------------------------------------- */

if (
  "serviceWorker" in navigator
) {
  navigator.serviceWorker
    .register("/sw.js")
    .catch(() => {});
}

/* ----------------------------------------------------------
   Start
---------------------------------------------------------- */

(async () => {
  try {
    await loadCatalog();
    await loadAccount();

    buildPiano();
    saveSettings();
    updateModeLabel();

    connect();

    requestAnimationFrame(
      loop
    );
  } catch (error) {
    console.error(error);

    toast(
      "DuckyMaps konnte nicht vollständig geladen werden.",
      "warning"
    );
  }
})();
