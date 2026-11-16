// Biohazard Zero
// Room IDs use a 4 × 4 grid, row by row from 0 to 15.
// Roster IDs 0–14 are fighters. Boss IDs 15–19 follow stage order.
// secret = [room, side] where -1 is west and 1 is east.
ferroWorldLevels.push([
 {
  name: "Hospital de Quarantena",
  route: [0, 1, 5, 9, 10, 14, 13, 12, 8, 4],
  roster: [0, 1, 2, 3, 4, 5],
  arenas: [14, 8],
  boss: 15,
  bossName: "Metge de la Quarantena",
  terraces: [0.24, -0.25, -0.46, 0.05],
  secret: [5, 1],
  outdoors: false,
  bossHealth: 185
 },
 {
  name: "Dipòsits de Contenció",
  route: [0, 4, 8, 9, 13, 14, 15, 11, 7, 3],
  roster: [3, 4, 5, 0, 1, 2, 3],
  arenas: [14, 7],
  boss: 16,
  bossName: "Subjecte de Contenció",
  terraces: [0.24, -0.16999999999999998, -0.38, 0.13],
  secret: [8, 1],
  outdoors: false,
  bossHealth: 245
 },
 {
  name: "Col·lector de Residus",
  route: [0, 1, 2, 6, 10, 11, 15, 14, 13, 9, 8, 4],
  roster: [6, 7, 8, 3, 4, 5, 6, 7],
  arenas: [15, 8],
  boss: 17,
  bossName: "La Massa del Col·lector",
  terraces: [0.24, -0.25, -0.46, 0.05],
  secret: [2, -1],
  outdoors: false,
  bossHealth: 280
 },
 {
  name: "Viver de Teixit Viu",
  route: [0, 4, 5, 9, 10, 6, 2, 3, 7, 11, 15],
  roster: [9, 10, 11, 6, 7, 8, 9, 10, 11],
  arenas: [6, 11],
  boss: 18,
  bossName: "Matriu del Viver",
  terraces: [0.24, -0.16999999999999998, -0.38, 0.13],
  secret: [5, 1],
  outdoors: true,
  bossHealth: 325
 },
 {
  name: "Cambra de la Soca Zero",
  route: [0, 1, 5, 9, 8, 12, 13, 14, 15, 11, 7, 3],
  roster: [12, 13, 14, 9, 10, 11, 12, 13, 14, 9],
  arenas: [13, 7],
  boss: 19,
  bossName: "Soca Zero",
  terraces: [0.24, -0.25, -0.46, 0.05],
  secret: [5, 1],
  outdoors: false,
  bossHealth: 400
 }
]);
