"use strict";

// ============================================================
// DUCKYMAPS V4.5
// MAPS, MÖBEL, TÜREN & INTERAKTIONEN
// ============================================================

function addRow(
  array,
  type,
  startX,
  startY,
  count,
  spacing,
  w,
  h,
  solid = true
) {
  for (let i = 0; i < count; i++) {
    array.push({
      type,
      x: startX + i * spacing,
      y: startY,
      w,
      h,
      solid
    });
  }
}


function addColumn(
  array,
  type,
  startX,
  startY,
  count,
  spacing,
  w,
  h,
  solid = true
) {
  for (let i = 0; i < count; i++) {
    array.push({
      type,
      x: startX,
      y: startY + i * spacing,
      w,
      h,
      solid
    });
  }
}


// ============================================================
// INDUSTRIE
// ============================================================

const industryFurniture = [
  {
    type: "machine",
    x: 290,
    y: 290,
    w: 150,
    h: 90,
    solid: true
  },
  {
    type: "machine",
    x: 640,
    y: 280,
    w: 160,
    h: 90,
    solid: true
  },
  {
    type: "machine",
    x: 640,
    y: 470,
    w: 160,
    h: 90,
    solid: true
  },

  {
    type: "workbench",
    x: 340,
    y: 1360,
    w: 270,
    h: 80,
    solid: true
  },
  {
    type: "workbench",
    x: 750,
    y: 1450,
    w: 260,
    h: 80,
    solid: true
  },

  {
    type: "desk",
    x: 1920,
    y: 1310,
    w: 180,
    h: 75,
    solid: true
  },
  {
    type: "desk",
    x: 2340,
    y: 1470,
    w: 180,
    h: 75,
    solid: true
  },

  {
    type: "locker",
    x: 1940,
    y: 1450,
    w: 72,
    h: 105,
    solid: true
  },

  {
    type: "locker",
    x: 2040,
    y: 1450,
    w: 72,
    h: 105,
    solid: true
  },

  {
    type: "powerbox",
    x: 1110,
    y: 900,
    w: 55,
    h: 80,
    solid: true
  },

  {
    type: "vent",
    x: 850,
    y: 820,
    w: 110,
    h: 52,
    solid: false
  },

  {
    type: "toolcart",
    x: 530,
    y: 1510,
    w: 90,
    h: 65,
    solid: true
  },

  {
    type: "barrel",
    x: 1320,
    y: 390,
    w: 55,
    h: 55,
    solid: true
  },

  {
    type: "barrel",
    x: 1390,
    y: 390,
    w: 55,
    h: 55,
    solid: true
  },

  {
    type: "barrel",
    x: 1460,
    y: 390,
    w: 55,
    h: 55,
    solid: true
  }
];

addColumn(
  industryFurniture,
  "shelf",
  1970,
  270,
  3,
  115,
  90,
  90
);

addColumn(
  industryFurniture,
  "shelf",
  2190,
  270,
  3,
  115,
  90,
  90
);

addColumn(
  industryFurniture,
  "shelf",
  2500,
  270,
  3,
  115,
  90,
  90
);

addRow(
  industryFurniture,
  "crate",
  270,
  510,
  4,
  78,
  62,
  62
);

addRow(
  industryFurniture,
  "crate",
  1290,
  520,
  5,
  72,
  58,
  58
);

addRow(
  industryFurniture,
  "pallet",
  1280,
  1110,
  5,
  95,
  80,
  58
);

addRow(
  industryFurniture,
  "chair",
  1900,
  1410,
  4,
  100,
  48,
  48
);


// ============================================================
// HAFEN
// ============================================================

const harborFurniture = [
  {
    type: "container-red",
    x: 1230,
    y: 790,
    w: 270,
    h: 95,
    solid: true
  },
  {
    type: "container-blue",
    x: 1550,
    y: 800,
    w: 270,
    h: 95,
    solid: true
  },
  {
    type: "container-yellow",
    x: 1880,
    y: 780,
    w: 270,
    h: 95,
    solid: true
  },

  {
    type: "container-blue",
    x: 1250,
    y: 980,
    w: 270,
    h: 95,
    solid: true
  },
  {
    type: "container-red",
    x: 1600,
    y: 1030,
    w: 270,
    h: 95,
    solid: true
  },
  {
    type: "container-yellow",
    x: 1950,
    y: 1010,
    w: 270,
    h: 95,
    solid: true
  },

  {
    type: "forklift",
    x: 650,
    y: 1010,
    w: 130,
    h: 85,
    solid: true
  },
  {
    type: "forklift",
    x: 2020,
    y: 1310,
    w: 130,
    h: 85,
    solid: true
  },

  {
    type: "desk",
    x: 1570,
    y: 350,
    w: 190,
    h: 75,
    solid: true
  },
  {
    type: "desk",
    x: 1780,
    y: 475,
    w: 170,
    h: 75,
    solid: true
  },

  {
    type: "locker",
    x: 1515,
    y: 500,
    w: 65,
    h: 100,
    solid: true
  },

  {
    type: "radio",
    x: 1870,
    y: 360,
    w: 65,
    h: 45,
    solid: false
  },

  {
    type: "powerbox",
    x: 2180,
    y: 1220,
    w: 55,
    h: 80,
    solid: true
  },

  {
    type: "vent",
    x: 960,
    y: 560,
    w: 100,
    h: 48,
    solid: false
  }
];

addRow(
  harborFurniture,
  "pallet",
  300,
  310,
  5,
  115,
  90,
  72
);

addRow(
  harborFurniture,
  "crate",
  330,
  470,
  5,
  82,
  65,
  65
);

addColumn(
  harborFurniture,
  "bollard",
  2260,
  250,
  6,
  245,
  42,
  42
);

addRow(
  harborFurniture,
  "barrel",
  400,
  1460,
  7,
  72,
  55,
  55
);


// ============================================================
// LABS
// ============================================================

const labsFurniture = [
  {
    type: "labtable",
    x: 300,
    y: 280,
    w: 220,
    h: 75,
    solid: true
  },
  {
    type: "labtable",
    x: 720,
    y: 320,
    w: 220,
    h: 75,
    solid: true
  },

  {
    type: "computer",
    x: 730,
    y: 475,
    w: 170,
    h: 70,
    solid: true
  },

  {
    type: "scanner",
    x: 330,
    y: 1390,
    w: 180,
    h: 110,
    solid: true
  },

  {
    type: "labtable",
    x: 760,
    y: 1420,
    w: 220,
    h: 75,
    solid: true
  },

  {
    type: "computer",
    x: 1870,
    y: 1260,
    w: 170,
    h: 70,
    solid: true
  },

  {
    type: "terminal",
    x: 1420,
    y: 500,
    w: 90,
    h: 70,
    solid: true
  },

  {
    type: "terminal",
    x: 1410,
    y: 1240,
    w: 90,
    h: 70,
    solid: true
  },

  {
    type: "locker",
    x: 2450,
    y: 1430,
    w: 68,
    h: 105,
    solid: true
  },

  {
    type: "locker",
    x: 2540,
    y: 1430,
    w: 68,
    h: 105,
    solid: true
  },

  {
    type: "powerbox",
    x: 1160,
    y: 930,
    w: 52,
    h: 78,
    solid: true
  },

  {
    type: "vent",
    x: 1600,
    y: 880,
    w: 110,
    h: 50,
    solid: false
  }
];

addColumn(
  labsFurniture,
  "serverrack",
  1870,
  265,
  3,
  115,
  88,
  95
);

addColumn(
  labsFurniture,
  "serverrack",
  2480,
  265,
  3,
  115,
  88,
  95
);

addRow(
  labsFurniture,
  "chair",
  300,
  450,
  4,
  120,
  48,
  48
);

addRow(
  labsFurniture,
  "chair",
  1850,
  1470,
  4,
  120,
  48,
  48
);


// ============================================================
// MAPS
// ============================================================

const MAPS = {
  industry: {
    id: "industry",

    title: "INDUSTRIE",

    subtitle:
      "Ducky Industrial District",

    width: 3000,
    height: 1900,

    colors: {
      ground: "#adaaa3",
      grid:
        "rgba(55,50,45,0.08)",

      wall: "#4e5153",
      wallTop: "#777b7d"
    },

    spawnPoints: [
      { x: 430, y: 950 },
      { x: 720, y: 950 },
      { x: 1450, y: 950 },
      { x: 2250, y: 950 }
    ],

    walls: [
      // Lagerhalle
      { x: 180, y: 170, w: 760, h: 34 },
      { x: 180, y: 170, w: 34, h: 540 },
      { x: 906, y: 170, w: 34, h: 540 },

      { x: 180, y: 676, w: 280, h: 34 },
      { x: 620, y: 676, w: 320, h: 34 },

      // Maschinenhalle
      { x: 1840, y: 170, w: 900, h: 34 },
      { x: 1840, y: 170, w: 34, h: 540 },
      { x: 2706, y: 170, w: 34, h: 540 },

      { x: 1840, y: 676, w: 350, h: 34 },
      { x: 2350, y: 676, w: 390, h: 34 },

      // Werkstatt
      { x: 250, y: 1220, w: 950, h: 34 },
      { x: 250, y: 1220, w: 34, h: 470 },
      { x: 1166, y: 1220, w: 34, h: 470 },

      { x: 250, y: 1656, w: 380, h: 34 },
      { x: 800, y: 1656, w: 400, h: 34 },

      // Büro
      { x: 1810, y: 1210, w: 900, h: 34 },
      { x: 1810, y: 1210, w: 34, h: 480 },
      { x: 2676, y: 1210, w: 34, h: 480 },

      { x: 1810, y: 1656, w: 330, h: 34 },
      { x: 2300, y: 1656, w: 410, h: 34 },

      // Innenwände
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
        h: 16,
        hinge: "left"
      },

      {
        id: "industry-door-2",
        x: 2190,
        y: 676,
        w: 160,
        h: 16,
        hinge: "right"
      },

      {
        id: "industry-door-3",
        x: 630,
        y: 1656,
        w: 170,
        h: 16,
        hinge: "left"
      },

      {
        id: "industry-door-4",
        x: 2140,
        y: 1656,
        w: 160,
        h: 16,
        hinge: "right"
      }
    ],

    furniture:
      industryFurniture,

    interactables: [
      {
        id: "industry-power",
        type: "power",
        x: 1135,
        y: 940,
        radius: 105,
        label: "Stromkasten"
      },

      {
        id: "industry-vent",
        type: "vent",
        x: 900,
        y: 845,
        radius: 100,
        label: "Lüftungsschacht"
      },

      {
        id: "industry-locker",
        type: "hide",
        x: 1975,
        y: 1500,
        radius: 100,
        label: "Spind"
      }
    ],

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

    subtitle:
      "Ducky Harbor Terminal",

    width: 3200,
    height: 1900,

    colors: {
      ground: "#999f9c",
      grid:
        "rgba(35,45,45,0.08)",

      wall: "#50585b",
      wallTop: "#778184"
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

      // Kaimauer
      { x: 2405, y: 0, w: 35, h: 1900 }
    ],

    doors: [
      {
        id: "harbor-door-1",
        x: 520,
        y: 666,
        w: 180,
        h: 16,
        hinge: "left"
      },

      {
        id: "harbor-door-2",
        x: 1660,
        y: 616,
        w: 160,
        h: 16,
        hinge: "right"
      },

      {
        id: "harbor-door-3",
        x: 730,
        y: 1686,
        w: 170,
        h: 16,
        hinge: "left"
      }
    ],

    furniture:
      harborFurniture,

    interactables: [
      {
        id: "harbor-radio",
        type: "radio",
        x: 1900,
        y: 380,
        radius: 100,
        label: "Hafenfunk"
      },

      {
        id: "harbor-power",
        type: "power",
        x: 2205,
        y: 1260,
        radius: 105,
        label: "Stromkasten"
      },

      {
        id: "harbor-vent",
        type: "vent",
        x: 1000,
        y: 585,
        radius: 100,
        label: "Lüftung"
      },

      {
        id: "harbor-locker",
        type: "hide",
        x: 1550,
        y: 550,
        radius: 100,
        label: "Metallschrank"
      }
    ],

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

    subtitle:
      "Ducky Research Complex",

    width: 2900,
    height: 1850,

    colors: {
      ground: "#d4d7da",
      grid:
        "rgba(70,80,90,0.07)",

      wall: "#626d75",
      wallTop: "#98a3ab"
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
        h: 16,
        hinge: "left"
      },

      {
        id: "labs-door-2",
        x: 2030,
        y: 688,
        w: 180,
        h: 16,
        hinge: "right"
      },

      {
        id: "labs-door-3",
        x: 580,
        y: 1638,
        w: 180,
        h: 16,
        hinge: "left"
      },

      {
        id: "labs-door-4",
        x: 2150,
        y: 1638,
        w: 180,
        h: 16,
        hinge: "right"
      }
    ],

    furniture:
      labsFurniture,

    interactables: [
      {
        id: "labs-terminal-a",
        type: "terminal",
        x: 1460,
        y: 535,
        radius: 100,
        label: "Forschungsterminal"
      },

      {
        id: "labs-terminal-b",
        type: "terminal",
        x: 1450,
        y: 1275,
        radius: 100,
        label: "Systemterminal"
      },

      {
        id: "labs-power",
        type: "power",
        x: 1185,
        y: 965,
        radius: 100,
        label: "Hauptstrom"
      },

      {
        id: "labs-vent",
        type: "vent",
        x: 1650,
        y: 905,
        radius: 100,
        label: "Lüftungsschacht"
      },

      {
        id: "labs-locker",
        type: "hide",
        x: 2485,
        y: 1480,
        radius: 105,
        label: "Laborschrank"
      }
    ],

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
