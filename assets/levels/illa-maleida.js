// L’Illa Maleïda
// Room IDs use a 4 × 4 grid, row by row from 0 to 15.
// Roster IDs 0–14 and 20–25 are fighters. Boss IDs 15–19 follow stage order.
// secret = [room, side] where -1 is west and 1 is east.
ferroWorldLevels.push([
 {
  name: "Port dels Nàufrags",
  route: [0, 1, 2, 3, 7, 6, 5, 9, 10, 11, 15],
  roster: [0, 1, 2, 3, 20, 5],
  arenas: [2, 9],
  boss: 15,
  bossName: "Contramestre de la Boira",
  secret: [6, 1],
  terraces: [0, 0.42, 0.14, 0.68],
  outdoors: true,
  bossHealth: 125
 },
 {
  name: "Taverna de les Set Espelmes",
  route: [0, 4, 8, 12, 13, 9, 5, 6, 10, 14, 15, 11],
  roster: [3, 4, 5, 0, 1, 2, 21, 4],
  arenas: [8, 10],
  boss: 16,
  bossName: "Ombra del Taverner",
  secret: [8, 1],
  terraces: [0, -0.48, -0.19, 0.36],
  outdoors: false,
  bossHealth: 185
 },
 {
  name: "Selva del Lloro Mut",
  route: [0, 1, 5, 4, 8, 12, 13, 9, 10, 6, 7, 11, 15],
  roster: [6, 7, 8, 3, 4, 5, 22, 7],
  arenas: [5, 10],
  boss: 17,
  bossName: "Custodi de la Selva",
  secret: [10, 1],
  terraces: [0, 0.36, 0.74, 0.23],
  outdoors: true,
  bossHealth: 220
 },
 {
  name: "Coves del Cementiri",
  route: [0, 4, 5, 1, 2, 3, 7, 6, 10, 9, 13, 14, 15],
  roster: [9, 10, 11, 6, 7, 8, 23, 10, 11],
  arenas: [7, 13],
  boss: 18,
  bossName: "Guardià de les Tombes",
  secret: [6, -1],
  terraces: [0.28, -0.44, 0.15, 0.6],
  outdoors: false,
  bossHealth: 265
 },
 {
  name: "Fortalesa de la Marea Negra",
  route: [0, 1, 2, 3, 7, 11, 10, 6, 5, 4, 8, 9, 13, 14, 15],
  roster: [12, 13, 14, 9, 10, 11, 24, 13, 25, 9],
  arenas: [6, 13],
  boss: 19,
  bossName: "El Capità Maleït",
  secret: [10, 1],
  terraces: [0, 0.52, -0.12, 0.82],
  outdoors: true,
  bossHealth: 340
 }
]);
