// Neon Apocalypse
// Room IDs use a 4 × 4 grid, row by row from 0 to 15.
// Roster IDs 0–14 are fighters. Boss IDs 15–19 follow stage order.
// secret = [room, side] where -1 is west and 1 is east.
ferroWorldLevels.push([
 {
  name: "Avinguda dels Hologrames",
  route: [0, 1, 2, 3, 7, 6, 5, 9, 10, 14, 15],
  roster: [0, 1, 2, 3, 4],
  arenas: [6, 14],
  boss: 15,
  bossName: "Sentinella d’Asfalt",
  terraces: [0, 0.31, 0.66, 0.88],
  secret: [2, -1],
  outdoors: true,
  bossHealth: 145
 },
 {
  name: "Estació Metro-09",
  route: [0, 4, 8, 12, 13, 14, 15, 11, 10, 9, 5, 6, 7],
  roster: [3, 4, 5, 0, 1, 2],
  arenas: [15, 6],
  boss: 16,
  bossName: "Inspector de la Línia Morta",
  terraces: [0, 0.39, 0.74, 0.96],
  secret: [8, 1],
  outdoors: false,
  bossHealth: 205
 },
 {
  name: "Laboratori Paral·laxi",
  route: [0, 1, 2, 6, 5, 9, 13, 12, 8, 4],
  roster: [6, 7, 8, 3, 4, 5, 6],
  arenas: [9, 8],
  boss: 17,
  bossName: "Prototip Paral·laxi",
  terraces: [0, 0.31, 0.66, 0.88],
  secret: [2, -1],
  outdoors: false,
  bossHealth: 240
 },
 {
  name: "Refineria d’Arcs",
  route: [0, 4, 5, 6, 7, 3, 2, 1],
  roster: [9, 10, 11, 6, 7, 8, 9, 10],
  arenas: [7, 2],
  boss: 18,
  bossName: "El Forn de Plasma",
  terraces: [0, 0.39, 0.74, 0.96],
  secret: [5, 1],
  outdoors: false,
  bossHealth: 285
 },
 {
  name: "Passarel·les de la Torre Zero",
  route: [0, 1, 2, 6, 5, 9, 10, 14, 15, 11],
  roster: [12, 13, 14, 9, 10, 11, 12, 13, 14],
  arenas: [9, 15],
  boss: 19,
  bossName: "ARES, la IA Militar",
  terraces: [0, 0.31, 0.66, 0.88],
  secret: [2, -1],
  outdoors: true,
  bossHealth: 360
 }
]);
