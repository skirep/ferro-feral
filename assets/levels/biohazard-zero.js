// Biohazard Zero
// Room IDs use a 4 × 4 grid, row by row from 0 to 15.
// secret = [room, side] where -1 is west and 1 is east.
ferroWorldLevels.push([
 {
  name: "Hospital de Quarantena",
  route: [0, 1, 5, 9, 10, 14, 13, 12, 8, 4],
  roster: [3, 4, 5, 7, 3, 4],
  arenas: [14, 8],
  boss: 4,
  bossName: "Metge de la Quarantena",
  terraces: [0.24, -0.25, -0.46, 0.05],
  secret: [5, 1],
  outdoors: false,
  bossHealth: 185
 },
 {
  name: "Dipòsits de Contenció",
  route: [0, 4, 8, 9, 13, 14, 15, 11, 7, 3],
  roster: [4, 5, 7, 3, 4, 5, 7],
  arenas: [14, 7],
  boss: 7,
  bossName: "Subjecte de Contenció",
  terraces: [0.24, -0.16999999999999998, -0.38, 0.13],
  secret: [8, 1],
  outdoors: false,
  bossHealth: 245
 },
 {
  name: "Col·lector de Residus",
  route: [0, 1, 2, 6, 10, 11, 15, 14, 13, 9, 8, 4],
  roster: [5, 7, 3, 4, 5, 7, 3, 4],
  arenas: [15, 8],
  boss: 4,
  bossName: "La Massa del Col·lector",
  terraces: [0.24, -0.25, -0.46, 0.05],
  secret: [2, -1],
  outdoors: false,
  bossHealth: 280
 },
 {
  name: "Viver de Teixit Viu",
  route: [0, 4, 5, 9, 10, 6, 2, 3, 7, 11, 15],
  roster: [7, 3, 4, 5, 7, 3, 4, 5, 7],
  arenas: [6, 11],
  boss: 7,
  bossName: "Matriu del Viver",
  terraces: [0.24, -0.16999999999999998, -0.38, 0.13],
  secret: [5, 1],
  outdoors: true,
  bossHealth: 325
 },
 {
  name: "Cambra de la Soca Zero",
  route: [0, 1, 5, 9, 8, 12, 13, 14, 15, 11, 7, 3],
  roster: [3, 4, 5, 7, 3, 4, 5, 7, 3, 4],
  arenas: [13, 7],
  boss: 5,
  bossName: "Soca Zero",
  terraces: [0.24, -0.25, -0.46, 0.05],
  secret: [5, 1],
  outdoors: false,
  bossHealth: 400
 }
]);
