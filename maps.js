"use strict";

// ============================================================
// DUCKYMAPS V4.9
// DETAILED MAPS / HIDEOUTS / SURVIVAL INTERACTIONS
// ============================================================

function furniture(type, x, y, w, h, solid = true, extra = {}) {
  return {
    type,
    x,
    y,
    w,
    h,
    solid,
    ...extra
  };
}

function decoration(type, x, y, w, h, extra = {}) {
  return {
    type,
    x,
    y,
    w,
    h,
    ...extra
  };
}

function interaction(id, type, x, y, label, extra = {}) {
  return {
    id,
    type,
    x,
    y,
    label,
    radius: 130,
    ...extra
  };
}

function addRow(list, type, x, y, count, spacing, w, h, solid = true) {
  for (let i = 0; i < count; i++) {
    list.push(
      furniture(
        type,
        x + i * spacing,
        y,
        w,
        h,
        solid
      )
    );
  }
}

function addColumn(list, type, x, y, count, spacing, w, h, solid = true) {
  for (let i = 0; i < count; i++) {
    list.push(
      furniture(
        type,
        x,
        y + i * spacing,
        w,
        h,
        solid
      )
    );
  }
}


// ============================================================
// INDUSTRY
// ============================================================

const industryFurniture = [
  furniture("machine", 280, 270, 150, 95),
  furniture("machine", 650, 270, 155, 95),
  furniture("machine", 650, 460, 155, 95),
  furniture("generator", 315, 430, 135, 78),
  furniture("compressor", 810, 285, 85, 90),

  furniture("workbench", 340, 1350, 270, 82),
  furniture("workbench", 750, 1440, 260, 82),
  furniture("toolcart", 480, 530, 85, 58),
  furniture("toolcart", 575, 530, 85, 58),

  furniture("conveyor", 1210, 610, 420, 70),
  furniture("conveyor", 1220, 715, 410, 70),

  furniture("fan", 1520, 350, 90, 90),
  furniture("fan", 1680, 350, 90, 90),

  furniture("desk", 1910, 1300, 180, 74),
  furniture("desk", 2330, 1460, 180, 74),
  furniture("computer", 1945, 1310, 95, 45, false),
  furniture("computer", 2365, 1470, 95, 45, false),

  furniture("locker", 1940, 1440, 68, 110),
  furniture("locker", 2025, 1440, 68, 110),
  furniture("locker", 2110, 1440, 68, 110),

  furniture("locker", 260, 760, 68, 110),
  furniture("locker", 345, 760, 68, 110),
  furniture("locker", 430, 760, 68, 110),

  furniture("hideCabinet", 2530, 1280, 78, 120),
  furniture("hideCabinet", 2620, 1280, 78, 120),

  furniture("vent", 845, 815, 115, 52, false),
  furniture("vent", 1740, 750, 115, 52, false),
  furniture("vent", 1070, 1590, 115, 52, false),
  furniture("vent", 2440, 620, 115, 52, false),

  furniture("vending", 2210, 1280, 78, 115),
  furniture("vending", 980, 1250, 78, 115),

  furniture("bell", 1440, 1090, 50, 50, false),
  furniture("alarm", 925, 1050, 55, 55, false),

  furniture("powerbox", 1110, 880, 58, 82),
  furniture("powerbox", 1580, 1140, 58, 82),

  furniture("coffee", 2440, 1300, 62, 58),
  furniture("trash", 2515, 1510, 52, 52),

  furniture("barrel", 1310, 390, 54, 54),
  furniture("barrel", 1380, 390, 54, 54),
  furniture("barrel", 1450, 390, 54, 54),

  furniture("crate", 1215, 535, 62, 62),
  furniture("crate", 1300, 535, 62, 62),
  furniture("crate", 1385, 535, 62, 62),

  furniture("warningCone", 1240, 840, 36, 36),
  furniture("warningCone", 1300, 890, 36, 36),
  furniture("warningCone", 1360, 840, 36, 36),

  furniture("pipeStack", 2820, 320, 95, 140),
  furniture("pipeStack", 2820, 510, 95, 140),

  furniture("electricalCabinet", 1500, 1470, 75, 115),
  furniture("electricalCabinet", 1600, 1470, 75, 115)
];

addColumn(industryFurniture, "shelf", 1970, 270, 3, 115, 90, 90);
addColumn(industryFurniture, "shelf", 2190, 270, 3, 115, 90, 90);
addColumn(industryFurniture, "shelf", 2500, 270, 3, 115, 90, 90);

addRow(industryFurniture, "crate", 270, 560, 5, 75, 60, 60);
addRow(industryFurniture, "pallet", 1270, 1100, 6, 94, 78, 55);
addRow(industryFurniture, "chair", 1890, 1400, 4, 95, 45, 45);

const industryDecorations = [
  decoration("yellowStripe", 1050, 760, 620, 18),
  decoration("yellowStripe", 1050, 1030, 620, 18),
  decoration("roadArrow", 1430, 870, 120, 180),

  decoration("oil", 870, 1110, 115, 70),
  decoration("oil", 1510, 480, 95, 55),
  decoration("oil", 520, 970, 75, 42),

  decoration("cable", 1120, 1260, 480, 18),
  decoration("cable", 1590, 1210, 18, 300),

  decoration("pipe", 220, 745, 690, 18),
  decoration("pipe", 1880, 760, 820, 18),

  decoration("warningBox", 1040, 730, 220, 80),
  decoration("warningBox", 1530, 1020, 220, 80),
  decoration("floorPlate", 1220, 250, 500, 260),

  decoration("sign", 330, 220, 190, 55, {
    text: "LAGER A"
  }),

  decoration("sign", 2120, 220, 220, 55, {
    text: "MASCHINEN"
  }),

  decoration("sign", 520, 1270, 190, 55, {
    text: "WERKSTATT"
  }),

  decoration("sign", 1920, 1260, 210, 48, {
    text: "PERSONAL"
  })
];

const industryInteractions = [
  interaction(
    "industry-power",
    "power",
    1140,
    920,
    "Hauptstrom"
  ),

  interaction(
    "industry-light",
    "light",
    1605,
    1180,
    "Hallenschalter"
  ),

  interaction(
    "industry-vent-1",
    "hide",
    900,
    840,
    "Lüftungsschacht"
  ),

  interaction(
    "industry-vent-2",
    "hide",
    1795,
    775,
    "Lüftungsschacht"
  ),

  interaction(
    "industry-vent-3",
    "hide",
    1125,
    1615,
    "Lüftungsschacht"
  ),

  interaction(
    "industry-vent-4",
    "hide",
    2495,
    645,
    "Lüftungsschacht"
  ),

  interaction(
    "industry-locker-1",
    "hide",
    1975,
    1495,
    "Spind"
  ),

  interaction(
    "industry-locker-2",
    "hide",
    2060,
    1495,
    "Spind"
  ),

  interaction(
    "industry-locker-3",
    "hide",
    2145,
    1495,
    "Spind"
  ),

  interaction(
    "industry-locker-4",
    "hide",
    295,
    815,
    "Spind"
  ),

  interaction(
    "industry-locker-5",
    "hide",
    380,
    815,
    "Spind"
  ),

  interaction(
    "industry-cabinet-1",
    "hide",
    2570,
    1340,
    "Schrank"
  ),

  interaction(
    "industry-cabinet-2",
    "hide",
    2660,
    1340,
    "Schrank"
  ),

  interaction(
    "industry-vending-1",
    "vending",
    2250,
    1340,
    "Getränkeautomat"
  ),

  interaction(
    "industry-vending-2",
    "vending",
    1020,
    1310,
    "Getränkeautomat"
  ),

  interaction(
    "industry-bell",
    "bell",
    1465,
    1115,
    "Glocke"
  ),

  interaction(
    "industry-alarm",
    "alarm",
    950,
    1075,
    "Warnsirene"
  ),

  interaction(
    "industry-generator",
    "generator",
    380,
    470,
    "Generator"
  ),

  interaction(
    "industry-conveyor",
    "conveyor",
    1420,
    645,
    "Förderband"
  ),

  interaction(
    "industry-fan",
    "fan",
    1565,
    395,
    "Ventilator"
  )
];


// ============================================================
// HARBOR
// ============================================================

const harborFurniture = [
  furniture("container-red", 1220, 780, 275, 95),
  furniture("container-blue", 1540, 800, 275, 95),
  furniture("container-yellow", 1870, 780, 275, 95),

  furniture("container-blue", 1240, 970, 275, 95),
  furniture("container-red", 1590, 1020, 275, 95),
  furniture("container-yellow", 1940, 1000, 275, 95),

  furniture("container-blue", 1180, 1170, 275, 95),
  furniture("container-red", 1510, 1190, 275, 95),

  furniture("forklift", 630, 1010, 135, 88),
  furniture("forklift", 2010, 1320, 135, 88),

  furniture("desk", 1560, 350, 190, 75),
  furniture("desk", 1780, 470, 170, 75),
  furniture("computer", 1600, 360, 100, 45, false),

  furniture("locker", 1515, 500, 68, 105),
  furniture("locker", 1600, 500, 68, 105),
  furniture("locker", 1685, 500, 68, 105),

  furniture("hideCabinet", 820, 520, 75, 115),
  furniture("hideCabinet", 905, 520, 75, 115),

  furniture("vent", 955, 550, 110, 50, false),
  furniture("vent", 390, 1580, 110, 50, false),

  furniture("vending", 1870, 520, 78, 115),
  furniture("vending", 650, 1360, 78, 115),

  furniture("bell", 2210, 610, 50, 50, false),
  furniture("radio", 1870, 365, 65, 45, false),

  furniture("powerbox", 2175, 1210, 58, 82),
  furniture("cranePanel", 2080, 620, 80, 70),

  furniture("rope", 2160, 470, 90, 55, false),
  furniture("rope", 2160, 850, 90, 55, false),
  furniture("lifeRing", 2300, 520, 52, 52, false),

  furniture("bollard", 2260, 250, 44, 44),
  furniture("bollard", 2260, 500, 44, 44),
  furniture("bollard", 2260, 750, 44, 44),
  furniture("bollard", 2260, 1000, 44, 44),
  furniture("bollard", 2260, 1250, 44, 44),
  furniture("bollard", 2260, 1500, 44, 44),

  furniture("bench", 2000, 1500, 170, 55),
  furniture("bench", 1050, 1450, 170, 55),

  furniture("trash", 1710, 540, 50, 50),
  furniture("trash", 930, 1390, 50, 50),

  furniture("barrel", 400, 1460, 55, 55),
  furniture("barrel", 470, 1460, 55, 55),
  furniture("barrel", 540, 1460, 55, 55),
  furniture("barrel", 610, 1460, 55, 55),

  furniture("crate", 330, 470, 65, 65),
  furniture("crate", 410, 470, 65, 65),
  furniture("crate", 490, 470, 65, 65),

  furniture("pallet", 300, 310, 90, 72),
  furniture("pallet", 415, 310, 90, 72),
  furniture("pallet", 530, 310, 90, 72)
];

const harborDecorations = [
  decoration("dockLine", 2100, 0, 18, 1900),
  decoration("dockLine", 2180, 0, 18, 1900),

  decoration("roadStripe", 1050, 730, 1100, 20),
  decoration("roadStripe", 1050, 1140, 1100, 20),

  decoration("waterWave", 2500, 180, 600, 10),
  decoration("waterWave", 2500, 350, 600, 10),
  decoration("waterWave", 2500, 520, 600, 10),
  decoration("waterWave", 2500, 690, 600, 10),
  decoration("waterWave", 2500, 860, 600, 10),
  decoration("waterWave", 2500, 1030, 600, 10),
  decoration("waterWave", 2500, 1200, 600, 10),
  decoration("waterWave", 2500, 1370, 600, 10),

  decoration("oil", 1840, 1320, 110, 60),

  decoration("sign", 380, 230, 230, 55, {
    text: "HAFENLAGER"
  }),

  decoration("sign", 1520, 290, 250, 55, {
    text: "PORT OFFICE"
  }),

  decoration("sign", 1270, 720, 270, 55, {
    text: "CONTAINER YARD"
  }),

  decoration("hazardStripe", 2230, 160, 165, 70),
  decoration("hazardStripe", 2230, 1640, 165, 70)
];

const harborInteractions = [
  interaction("harbor-radio", "radio", 1900, 390, "Hafenfunk"),

  interaction("harbor-power", "power", 2205, 1250, "Stromkasten"),

  interaction("harbor-vent-1", "hide", 1005, 575, "Lüftungsschacht"),
  interaction("harbor-vent-2", "hide", 445, 1605, "Lüftungsschacht"),

  interaction("harbor-locker-1", "hide", 1550, 555, "Metallschrank"),
  interaction("harbor-locker-2", "hide", 1635, 555, "Metallschrank"),
  interaction("harbor-locker-3", "hide", 1720, 555, "Metallschrank"),

  interaction("harbor-cabinet-1", "hide", 855, 580, "Lagerschrank"),
  interaction("harbor-cabinet-2", "hide", 940, 580, "Lagerschrank"),

  interaction("harbor-vending-1", "vending", 1910, 580, "Getränkeautomat"),
  interaction("harbor-vending-2", "vending", 690, 1420, "Getränkeautomat"),

  interaction("harbor-bell", "bell", 2235, 635, "Schiffsglocke"),

  interaction("harbor-crane", "crane", 2120, 655, "Kransteuerung"),

  interaction("harbor-siren", "alarm", 1100, 1260, "Hafensirene"),

  interaction("harbor-light", "light", 1450, 850, "Flutlicht")
];


// ============================================================
// LABS
// ============================================================

const labsFurniture = [
  furniture("labtable", 300, 280, 220, 76),
  furniture("labtable", 720, 320, 220, 76),
  furniture("labtable", 760, 1420, 220, 76),

  furniture("computer", 730, 475, 170, 70),
  furniture("computer", 1870, 1260, 170, 70),

  furniture("microscope", 350, 300, 60, 50, false),
  furniture("microscope", 790, 340, 60, 50, false),

  furniture("sampleRack", 470, 480, 120, 55),

  furniture("scanner", 330, 1390, 180, 110),

  furniture("terminal", 1410, 500, 90, 70),
  furniture("terminal", 1410, 1240, 90, 70),

  furniture("locker", 2440, 1420, 68, 108),
  furniture("locker", 2530, 1420, 68, 108),
  furniture("locker", 2620, 1420, 68, 108),

  furniture("hideCabinet", 960, 1390, 75, 118),
  furniture("hideCabinet", 1045, 1390, 75, 118),

  furniture("vent", 1590, 875, 115, 52, false),
  furniture("vent", 1060, 610, 115, 52, false),
  furniture("vent", 2330, 610, 115, 52, false),
  furniture("vent", 1640, 1510, 115, 52, false),

  furniture("vending", 1260, 1010, 80, 118),
  furniture("vending", 1830, 1510, 80, 118),

  furniture("bell", 1530, 1020, 52, 52, false),

  furniture("powerbox", 1160, 920, 55, 80),

  furniture("serverrack", 1870, 265, 88, 95),
  furniture("serverrack", 1870, 380, 88, 95),
  furniture("serverrack", 1870, 495, 88, 95),

  furniture("serverrack", 2480, 265, 88, 95),
  furniture("serverrack", 2480, 380, 88, 95),
  furniture("serverrack", 2480, 495, 88, 95),

  furniture("serverrack", 2150, 265, 88, 95),
  furniture("serverrack", 2250, 265, 88, 95),

  furniture("chair", 300, 450, 48, 48),
  furniture("chair", 420, 450, 48, 48),
  furniture("chair", 540, 450, 48, 48),

  furniture("chair", 1850, 1470, 48, 48),
  furniture("chair", 1970, 1470, 48, 48),

  furniture("cabinet", 950, 220, 60, 110),
  furniture("cabinet", 1025, 220, 60, 110),

  furniture("chemicalCabinet", 2150, 470, 75, 105),
  furniture("chemicalCabinet", 2240, 470, 75, 105),

  furniture("coffee", 1350, 1020, 60, 58),

  furniture("plant", 1690, 980, 60, 60),
  furniture("plant", 2710, 870, 60, 60),

  furniture("trash", 1030, 610, 48, 48),
  furniture("trash", 2050, 1500, 48, 48),

  furniture("emergency", 1690, 780, 45, 65, false),

  furniture("medicalCart", 520, 1500, 90, 60),
  furniture("medicalCart", 650, 1500, 90, 60)
];

const labsDecorations = [
  decoration("glassFloor", 1230, 760, 450, 320),
  decoration("labLine", 1420, 150, 18, 1540),

  decoration("cable", 1850, 630, 650, 16),
  decoration("cable", 2260, 630, 16, 400),

  decoration("warningBox", 1090, 860, 180, 120),
  decoration("floorPlate", 1820, 220, 760, 420),

  decoration("sign", 320, 205, 250, 55, {
    text: "RESEARCH A"
  }),

  decoration("sign", 2000, 205, 260, 55, {
    text: "SERVER CORE"
  }),

  decoration("sign", 360, 1175, 250, 55, {
    text: "ANALYSIS"
  }),

  decoration("sign", 1960, 1175, 270, 55, {
    text: "SECURITY LAB"
  }),

  decoration("sign", 1250, 950, 270, 45, {
    text: "SAFE CORRIDOR"
  })
];

const labsInteractions = [
  interaction("labs-terminal-1", "terminal", 1450, 535, "Forschungsterminal"),
  interaction("labs-terminal-2", "terminal", 1450, 1275, "Systemterminal"),

  interaction("labs-power", "power", 1185, 960, "Hauptstrom"),

  interaction("labs-vent-1", "hide", 1645, 900, "Lüftungsschacht"),
  interaction("labs-vent-2", "hide", 1115, 635, "Lüftungsschacht"),
  interaction("labs-vent-3", "hide", 2385, 635, "Lüftungsschacht"),
  interaction("labs-vent-4", "hide", 1695, 1535, "Lüftungsschacht"),

  interaction("labs-locker-1", "hide", 2475, 1475, "Laborschrank"),
  interaction("labs-locker-2", "hide", 2565, 1475, "Laborschrank"),
  interaction("labs-locker-3", "hide", 2655, 1475, "Laborschrank"),

  interaction("labs-cabinet-1", "hide", 995, 1445, "Schrank"),
  interaction("labs-cabinet-2", "hide", 1080, 1445, "Schrank"),

  interaction("labs-vending-1", "vending", 1300, 1070, "Getränkeautomat"),
  interaction("labs-vending-2", "vending", 1870, 1570, "Getränkeautomat"),

  interaction("labs-bell", "bell", 1555, 1045, "Testglocke"),

  interaction("labs-scanner", "scanner", 420, 1445, "Körperscanner"),

  interaction("labs-emergency", "alarm", 1710, 810, "Notfallschalter"),

  interaction("labs-samples", "samples", 530, 505, "Probenregal"),

  interaction("labs-server", "server", 2520, 420, "Serverkonsole"),

  interaction("labs-light", "light", 1330, 700, "Laborbeleuchtung")
];


// ============================================================
// MAPS
// ============================================================

const MAPS = {
  industry: {
    id: "industry",

    title: "INDUSTRIE",

    subtitle: "Ducky Industrial District",

    width: 3000,
    height: 1900,

    colors: {
      ground: "#aaa69d",
      grid: "rgba(45,42,38,.08)",
      wall: "#505355",
      wallTop: "#7b7f81"
    },

    spawnPoints: [
      { x: 430, y: 950 },
      { x: 720, y: 950 },
      { x: 1450, y: 950 },
      { x: 2250, y: 950 }
    ],

    walls: [
      { x: 180, y: 170, w: 760, h: 34 },
      { x: 180, y: 170, w: 34, h: 540 },
      { x: 906, y: 170, w: 34, h: 540 },
      { x: 180, y: 676, w: 280, h: 34 },
      { x: 620, y: 676, w: 320, h: 34 },

      { x: 1840, y: 170, w: 900, h: 34 },
      { x: 1840, y: 170, w: 34, h: 540 },
      { x: 2706, y: 170, w: 34, h: 540 },
      { x: 1840, y: 676, w: 350, h: 34 },
      { x: 2350, y: 676, w: 390, h: 34 },

      { x: 250, y: 1220, w: 950, h: 34 },
      { x: 250, y: 1220, w: 34, h: 470 },
      { x: 1166, y: 1220, w: 34, h: 470 },
      { x: 250, y: 1656, w: 380, h: 34 },
      { x: 800, y: 1656, w: 400, h: 34 },

      { x: 1810, y: 1210, w: 900, h: 34 },
      { x: 1810, y: 1210, w: 34, h: 480 },
      { x: 2676, y: 1210, w: 34, h: 480 },
      { x: 1810, y: 1656, w: 330, h: 34 },
      { x: 2300, y: 1656, w: 410, h: 34 },

      { x: 520, y: 350, w: 34, h: 220 },
      { x: 2070, y: 350, w: 330, h: 34 },
      { x: 2050, y: 1370, w: 34, h: 190 },
      { x: 2260, y: 1370, w: 280, h: 34 }
    ],

    doors: [
      {
        id: "industry-door-1",
        x: 460,
        y: 676,
        w: 160,
        h: 18,
        hinge: "left"
      },

      {
        id: "industry-door-2",
        x: 2190,
        y: 676,
        w: 160,
        h: 18,
        hinge: "right"
      },

      {
        id: "industry-door-3",
        x: 630,
        y: 1656,
        w: 170,
        h: 18,
        hinge: "left"
      },

      {
        id: "industry-door-4",
        x: 2140,
        y: 1656,
        w: 160,
        h: 18,
        hinge: "right"
      }
    ],

    furniture: industryFurniture,
    decorations: industryDecorations,
    interactables: industryInteractions,

    checkpoints: [
      {
        id: "warehouse",
        name: "Lagerhalle",
        x: 600,
        y: 430,
        radius: 115
      },

      {
        id: "machines",
        name: "Maschinenpark",
        x: 2250,
        y: 430,
        radius: 115
      },

      {
        id: "workshop",
        name: "Werkstatt",
        x: 700,
        y: 1450,
        radius: 115
      }
    ]
  },


  harbor: {
    id: "harbor",

    title: "HAFEN",

    subtitle: "Ducky Harbor Terminal",

    width: 3200,
    height: 1900,

    colors: {
      ground: "#969d99",
      grid: "rgba(40,50,48,.08)",
      wall: "#515a5d",
      wallTop: "#7a8588"
    },

    water: {
      x: 2440,
      y: 0,
      w: 760,
      h: 1900
    },

    spawnPoints: [
      { x: 400, y: 900 },
      { x: 750, y: 900 },
      { x: 1400, y: 900 },
      { x: 1800, y: 900 }
    ],

    walls: [
      { x: 180, y: 180, w: 900, h: 34 },
      { x: 180, y: 180, w: 34, h: 520 },
      { x: 1046, y: 180, w: 34, h: 520 },
      { x: 180, y: 666, w: 340, h: 34 },
      { x: 700, y: 666, w: 380, h: 34 },

      { x: 1450, y: 250, w: 600, h: 34 },
      { x: 1450, y: 250, w: 34, h: 400 },
      { x: 2016, y: 250, w: 34, h: 400 },
      { x: 1450, y: 616, w: 210, h: 34 },
      { x: 1820, y: 616, w: 230, h: 34 },

      { x: 300, y: 1290, w: 1100, h: 34 },
      { x: 300, y: 1290, w: 34, h: 430 },
      { x: 1366, y: 1290, w: 34, h: 430 },
      { x: 300, y: 1686, w: 430, h: 34 },
      { x: 900, y: 1686, w: 500, h: 34 },

      { x: 2405, y: 0, w: 35, h: 1900 }
    ],

    doors: [
      {
        id: "harbor-door-1",
        x: 520,
        y: 666,
        w: 180,
        h: 18,
        hinge: "left"
      },

      {
        id: "harbor-door-2",
        x: 1660,
        y: 616,
        w: 160,
        h: 18,
        hinge: "right"
      },

      {
        id: "harbor-door-3",
        x: 730,
        y: 1686,
        w: 170,
        h: 18,
        hinge: "left"
      }
    ],

    furniture: harborFurniture,
    decorations: harborDecorations,
    interactables: harborInteractions,

    checkpoints: [
      {
        id: "warehouse",
        name: "Hafenlager",
        x: 650,
        y: 430,
        radius: 115
      },

      {
        id: "terminal",
        name: "Containerterminal",
        x: 1650,
        y: 950,
        radius: 120
      },

      {
        id: "pier",
        name: "Kai",
        x: 2200,
        y: 1450,
        radius: 120
      }
    ]
  },


  labs: {
    id: "labs",

    title: "LABS",

    subtitle: "Ducky Research Complex",

    width: 2900,
    height: 1850,

    colors: {
      ground: "#d5d8da",
      grid: "rgba(65,75,85,.07)",
      wall: "#626d75",
      wallTop: "#9ba6ae"
    },

    spawnPoints: [
      { x: 1450, y: 920 },
      { x: 1320, y: 920 },
      { x: 1580, y: 920 }
    ],

    walls: [
      { x: 180, y: 160, w: 980, h: 32 },
      { x: 180, y: 160, w: 32, h: 560 },
      { x: 1128, y: 160, w: 32, h: 560 },
      { x: 180, y: 688, w: 390, h: 32 },
      { x: 750, y: 688, w: 410, h: 32 },

      { x: 1740, y: 160, w: 980, h: 32 },
      { x: 1740, y: 160, w: 32, h: 560 },
      { x: 2688, y: 160, w: 32, h: 560 },
      { x: 1740, y: 688, w: 390, h: 32 },
      { x: 2210, y: 688, w: 510, h: 32 },

      { x: 180, y: 1130, w: 980, h: 32 },
      { x: 180, y: 1130, w: 32, h: 540 },
      { x: 1128, y: 1130, w: 32, h: 540 },
      { x: 180, y: 1638, w: 400, h: 32 },
      { x: 760, y: 1638, w: 400, h: 32 },

      { x: 1740, y: 1130, w: 980, h: 32 },
      { x: 1740, y: 1130, w: 32, h: 540 },
      { x: 2688, y: 1130, w: 32, h: 540 },
      { x: 1740, y: 1638, w: 410, h: 32 },
      { x: 2330, y: 1638, w: 390, h: 32 },

      { x: 600, y: 300, w: 32, h: 270 },
      { x: 1950, y: 320, w: 500, h: 32 },
      { x: 450, y: 1300, w: 500, h: 32 },
      { x: 2100, y: 1280, w: 32, h: 220 }
    ],

    doors: [
      {
        id: "labs-door-1",
        x: 570,
        y: 688,
        w: 180,
        h: 18,
        hinge: "left"
      },

      {
        id: "labs-door-2",
        x: 2030,
        y: 688,
        w: 180,
        h: 18,
        hinge: "right"
      },

      {
        id: "labs-door-3",
        x: 580,
        y: 1638,
        w: 180,
        h: 18,
        hinge: "left"
      },

      {
        id: "labs-door-4",
        x: 2150,
        y: 1638,
        w: 180,
        h: 18,
        hinge: "right"
      }
    ],

    furniture: labsFurniture,
    decorations: labsDecorations,
    interactables: labsInteractions,

    checkpoints: [
      {
        id: "research",
        name: "Forschungslabor",
        x: 700,
        y: 450,
        radius: 110
      },

      {
        id: "server",
        name: "Serverraum",
        x: 2250,
        y: 450,
        radius: 110
      },

      {
        id: "scanner",
        name: "Analysezentrum",
        x: 650,
        y: 1430,
        radius: 110
      }
    ]
  }
};


module.exports = {
  MAPS
};
