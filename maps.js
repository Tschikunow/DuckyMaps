"use strict";

// ============================================================
// DUCKYMAPS V4
// ZENTRALE MAP-DATEN
// ============================================================

const MAPS = {
  industry: {
    id: "industry",
    title: "INDUSTRIE",
    subtitle: "Lagerhallen & Maschinenpark",

    width: 3000,
    height: 1900,

    colors: {
      ground: "#b9b6ad",
      grid: "rgba(60,55,48,0.09)",
      wall: "#4d5052",
      wallTop: "#727679",
      door: "#db4049"
    },

    spawnPoints: [
      { x: 420, y: 950 },
      { x: 700, y: 950 },
      { x: 1400, y: 950 },
      { x: 2250, y: 950 },
      { x: 2600, y: 950 }
    ],

    walls: [
      // Lagerhalle links
      { x: 180, y: 170, w: 760, h: 34 },
      { x: 180, y: 170, w: 34, h: 540 },
      { x: 906, y: 170, w: 34, h: 540 },

      { x: 180, y: 676, w: 280, h: 34 },
      { x: 620, y: 676, w: 320, h: 34 },

      // Lagerhalle rechts
      { x: 1840, y: 170, w: 900, h: 34 },
      { x: 1840, y: 170, w: 34, h: 540 },
      { x: 2706, y: 170, w: 34, h: 540 },

      { x: 1840, y: 676, w: 350, h: 34 },
      { x: 2350, y: 676, w: 390, h: 34 },

      // Untere Werkstatt
      { x: 250, y: 1220, w: 950, h: 34 },
      { x: 250, y: 1220, w: 34, h: 470 },
      { x: 1166, y: 1220, w: 34, h: 470 },

      { x: 250, y: 1656, w: 380, h: 34 },
      { x: 800, y: 1656, w: 400, h: 34 },

      // Unteres Büro
      { x: 1810, y: 1210, w: 900, h: 34 },
      { x: 1810, y: 1210, w: 34, h: 480 },
      { x: 2676, y: 1210, w: 34, h: 480 },

      { x: 1810, y: 1656, w: 330, h: 34 },
      { x: 2300, y: 1656, w: 410, h: 34 },

      // Kleine Innenwände
      { x: 520, y: 350, w: 34, h: 220 },
      { x: 2070, y: 350, w: 330, h: 34 },

      { x: 2050, y: 1370, w: 34, h: 190 },
      { x: 2260, y: 1370, w: 280, h: 34 }
    ],

    doors: [
      {
        id: "industry-door-1",
        x: 460,
        y: 666,
        w: 160,
        h: 45,
        direction: "horizontal"
      },

      {
        id: "industry-door-2",
        x: 2190,
        y: 666,
        w: 160,
        h: 45,
        direction: "horizontal"
      },

      {
        id: "industry-door-3",
        x: 630,
        y: 1646,
        w: 170,
        h: 45,
        direction: "horizontal"
      },

      {
        id: "industry-door-4",
        x: 2140,
        y: 1646,
        w: 160,
        h: 45,
        direction: "horizontal"
      }
    ],

    furniture: [
      {
        type: "machine",
        x: 300,
        y: 300,
        w: 150,
        h: 90,
        solid: true
      },

      {
        type: "machine",
        x: 670,
        y: 290,
        w: 150,
        h: 90,
        solid: true
      },

      {
        type: "machine",
        x: 670,
        y: 470,
        w: 150,
        h: 90,
        solid: true
      },

      {
        type: "crate",
        x: 270,
        y: 500,
        w: 65,
        h: 65,
        solid: true
      },

      {
        type: "crate",
        x: 345,
        y: 500,
        w: 65,
        h: 65,
        solid: true
      },

      {
        type: "crate",
        x: 270,
        y: 575,
        w: 65,
        h: 65,
        solid: true
      },

      {
        type: "shelf",
        x: 1980,
        y: 280,
        w: 95,
        h: 300,
        solid: true
      },

      {
        type: "shelf",
        x: 2170,
        y: 280,
        w: 95,
        h: 300,
        solid: true
      },

      {
        type: "shelf",
        x: 2480,
        y: 280,
        w: 95,
        h: 300,
        solid: true
      },

      {
        type: "workbench",
        x: 390,
        y: 1350,
        w: 280,
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
        x: 1950,
        y: 1320,
        w: 180,
        h: 80,
        solid: true
      },

      {
        type: "desk",
        x: 2350,
        y: 1480,
        w: 180,
        h: 80,
        solid: true
      },

      {
        type: "chair",
        x: 2000,
        y: 1420,
        w: 55,
        h: 55,
        solid: true
      },

      {
        type: "chair",
        x: 2400,
        y: 1400,
        w: 55,
        h: 55,
        solid: true
      }
    ],

    checkpoints: [
      {
        id: "warehouse",
        name: "Lagerhalle",
        x: 600,
        y: 430,
        radius: 110
      },

      {
        id: "machines",
        name: "Maschinenpark",
        x: 2240,
        y: 430,
        radius: 110
      },

      {
        id: "workshop",
        name: "Werkstatt",
        x: 700,
        y: 1450,
        radius: 110
      }
    ]
  },


  // ==========================================================
  // HAFEN
  // ==========================================================

  harbor: {
    id: "harbor",
    title: "HAFEN",
    subtitle: "Containerterminal",

    width: 3200,
    height: 1900,

    colors: {
      ground: "#9da4a1",
      grid: "rgba(40,55,55,0.08)",
      wall: "#51595c",
      wallTop: "#747f82",
      door: "#3988ac"
    },

    spawnPoints: [
      { x: 400, y: 900 },
      { x: 750, y: 900 },
      { x: 1400, y: 900 },
      { x: 1800, y: 900 }
    ],

    water: {
      x: 2440,
      y: 0,
      w: 760,
      h: 1900
    },

    walls: [
      // Lagerhaus
      { x: 180, y: 180, w: 900, h: 34 },
      { x: 180, y: 180, w: 34, h: 520 },
      { x: 1046, y: 180, w: 34, h: 520 },

      { x: 180, y: 666, w: 340, h: 34 },
      { x: 700, y: 666, w: 380, h: 34 },

      // Hafenbüro
      { x: 1450, y: 250, w: 600, h: 34 },
      { x: 1450, y: 250, w: 34, h: 400 },
      { x: 2016, y: 250, w: 34, h: 400 },

      { x: 1450, y: 616, w: 210, h: 34 },
      { x: 1820, y: 616, w: 230, h: 34 },

      // Unteres Lager
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
        y: 656,
        w: 180,
        h: 45,
        direction: "horizontal"
      },

      {
        id: "harbor-door-2",
        x: 1660,
        y: 606,
        w: 160,
        h: 45,
        direction: "horizontal"
      },

      {
        id: "harbor-door-3",
        x: 730,
        y: 1676,
        w: 170,
        h: 45,
        direction: "horizontal"
      }
    ],

    furniture: [
      {
        type: "container-red",
        x: 1250,
        y: 800,
        w: 260,
        h: 95,
        solid: true
      },

      {
        type: "container-blue",
        x: 1570,
        y: 820,
        w: 260,
        h: 95,
        solid: true
      },

      {
        type: "container-yellow",
        x: 1900,
        y: 790,
        w: 260,
        h: 95,
        solid: true
      },

      {
        type: "container-blue",
        x: 1270,
        y: 980,
        w: 260,
        h: 95,
        solid: true
      },

      {
        type: "container-red",
        x: 1620,
        y: 1030,
        w: 260,
        h: 95,
        solid: true
      },

      {
        type: "pallet",
        x: 330,
        y: 320,
        w: 90,
        h: 90,
        solid: true
      },

      {
        type: "pallet",
        x: 470,
        y: 320,
        w: 90,
        h: 90,
        solid: true
      },

      {
        type: "crate",
        x: 750,
        y: 480,
        w: 70,
        h: 70,
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
        x: 1770,
        y: 470,
        w: 170,
        h: 75,
        solid: true
      },

      {
        type: "forklift",
        x: 650,
        y: 1020,
        w: 130,
        h: 85,
        solid: true
      },

      {
        type: "forklift",
        x: 2050,
        y: 1320,
        w: 130,
        h: 85,
        solid: true
      },

      {
        type: "bollard",
        x: 2250,
        y: 300,
        w: 40,
        h: 40,
        solid: true
      },

      {
        type: "bollard",
        x: 2250,
        y: 600,
        w: 40,
        h: 40,
        solid: true
      },

      {
        type: "bollard",
        x: 2250,
        y: 1200,
        w: 40,
        h: 40,
        solid: true
      }
    ],

    checkpoints: [
      {
        id: "warehouse",
        name: "Hafenlager",
        x: 650,
        y: 430,
        radius: 110
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


  // ==========================================================
  // LABS
  // ==========================================================

  labs: {
    id: "labs",
    title: "LABS",
    subtitle: "Ducky Research Complex",

    width: 2900,
    height: 1850,

    colors: {
      ground: "#d6d9dc",
      grid: "rgba(70,80,90,0.075)",
      wall: "#626d75",
      wallTop: "#929da5",
      door: "#755de0"
    },

    spawnPoints: [
      { x: 1450, y: 920 },
      { x: 1320, y: 920 },
      { x: 1580, y: 920 }
    ],

    walls: [
      // Nordwest Labor
      { x: 180, y: 160, w: 980, h: 32 },
      { x: 180, y: 160, w: 32, h: 560 },
      { x: 1128, y: 160, w: 32, h: 560 },

      { x: 180, y: 688, w: 390, h: 32 },
      { x: 750, y: 688, w: 410, h: 32 },

      // Nordost
      { x: 1740, y: 160, w: 980, h: 32 },
      { x: 1740, y: 160, w: 32, h: 560 },
      { x: 2688, y: 160, w: 32, h: 560 },

      { x: 1740, y: 688, w: 390, h: 32 },
      { x: 2210, y: 688, w: 510, h: 32 },

      // Südwest
      { x: 180, y: 1130, w: 980, h: 32 },
      { x: 180, y: 1130, w: 32, h: 540 },
      { x: 1128, y: 1130, w: 32, h: 540 },

      { x: 180, y: 1638, w: 400, h: 32 },
      { x: 760, y: 1638, w: 400, h: 32 },

      // Südost
      { x: 1740, y: 1130, w: 980, h: 32 },
      { x: 1740, y: 1130, w: 32, h: 540 },
      { x: 2688, y: 1130, w: 32, h: 540 },

      { x: 1740, y: 1638, w: 410, h: 32 },
      { x: 2330, y: 1638, w: 390, h: 32 },

      // Innenwände
      { x: 600, y: 300, w: 32, h: 270 },
      { x: 1950, y: 320, w: 500, h: 32 },

      { x: 450, y: 1300, w: 500, h: 32 },
      { x: 2100, y: 1280, w: 32, h: 220 }
    ],

    doors: [
      {
        id: "labs-door-1",
        x: 570,
        y: 678,
        w: 180,
        h: 43,
        direction: "horizontal"
      },

      {
        id: "labs-door-2",
        x: 2030,
        y: 678,
        w: 180,
        h: 43,
        direction: "horizontal"
      },

      {
        id: "labs-door-3",
        x: 580,
        y: 1628,
        w: 180,
        h: 43,
        direction: "horizontal"
      },

      {
        id: "labs-door-4",
        x: 2150,
        y: 1628,
        w: 180,
        h: 43,
        direction: "horizontal"
      }
    ],

    furniture: [
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
        y: 470,
        w: 170,
        h: 70,
        solid: true
      },

      {
        type: "serverrack",
        x: 1880,
        y: 280,
        w: 90,
        h: 240,
        solid: true
      },

      {
        type: "serverrack",
        x: 2500,
        y: 280,
        w: 90,
        h: 240,
        solid: true
      },

      {
        type: "labtable",
        x: 2150,
        y: 430,
        w: 230,
        h: 75,
        solid: true
      },

      {
        type: "scanner",
        x: 330,
        y: 1400,
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
        type: "serverrack",
        x: 2400,
        y: 1320,
        w: 90,
        h: 230,
        solid: true
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
