// The Abyss
// Room IDs use a 4 × 4 grid, row by row from 0 to 15.
// Roster IDs 0–14 are fighters. Boss IDs 15–19 follow stage order.
// secret = [room, side] where -1 is west and 1 is east.
ferroWorldLevels.push([
 {
  name: "Camp de Llunes Trencades",
  route: [0, 1, 2, 3, 7, 6, 5, 9, 10, 11, 15, 14, 13],
  roster: [0, 1, 2, 3, 4, 5, 0],
  arenas: [5, 14],
  boss: 15,
  bossName: "El Cartògraf del Buit",
  terraces: [0, 0.48, 0.86, 0.28],
  secret: [2, -1],
  outdoors: true,
  bossHealth: 205
 },
 {
  name: "Temple de l’Estrella Cega",
  route: [0, 4, 5, 6, 10, 9, 13, 14, 15],
  roster: [3, 4, 5, 0, 1, 2, 3, 4],
  arenas: [10, 14],
  boss: 16,
  bossName: "Oracle de l’Estrella",
  terraces: [0, 0.5599999999999999, 0.94, 0.36000000000000004],
  secret: [5, 1],
  outdoors: false,
  bossHealth: 265
 },
 {
  name: "Ciutat sobre l’Abisme",
  route: [0, 1, 5, 4, 8, 12, 13, 14, 10, 11, 7, 3],
  roster: [6, 7, 8, 3, 4, 5, 6, 7, 8],
  arenas: [13, 7],
  boss: 17,
  bossName: "Custodi de la Passarel·la",
  terraces: [0, 0.48, 0.86, 0.28],
  secret: [5, 1],
  outdoors: true,
  bossHealth: 300
 },
 {
  name: "Fortalesa dels Ecos",
  route: [0, 4, 8, 9, 10, 6, 7, 3, 2, 1],
  roster: [9, 10, 11, 6, 7, 8, 9, 10, 11, 6],
  arenas: [6, 2],
  boss: 18,
  bossName: "La Veu de l’Eco",
  terraces: [0, 0.5599999999999999, 0.94, 0.36000000000000004],
  secret: [8, 1],
  outdoors: false,
  bossHealth: 345
 },
 {
  name: "El Llindar Fracturat",
  route: [0, 1, 2, 3, 7, 6, 5, 9, 13, 12, 8, 4],
  roster: [12, 13, 14, 9, 10, 11, 12, 13, 14, 9, 10],
  arenas: [5, 8],
  boss: 19,
  bossName: "L’Entitat del Llindar",
  terraces: [0, 0.48, 0.86, 0.28],
  secret: [2, -1],
  outdoors: true,
  bossHealth: 420
 }
]);
