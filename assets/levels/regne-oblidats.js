// El Regne dels Oblidats
// Room IDs use a 4 × 4 grid, row by row from 0 to 15.
// secret = [room, side] where -1 is west and 1 is east.
ferroWorldLevels.push([
 {
  name: "Aldea sense Campanes",
  route: [0, 4, 5, 1, 2, 6, 7, 11, 15, 14, 10, 9],
  roster: [0, 2, 3, 6, 0, 2],
  arenas: [7, 10],
  boss: 2,
  bossName: "Campaner Maleït",
  terraces: [0, 0.34, -0.35, 0.48],
  secret: [5, 1],
  outdoors: true,
  bossHealth: 165
 },
 {
  name: "Bosc de les Branques Cegues",
  route: [0, 1, 5, 4, 8, 12, 13, 9, 10, 11, 15, 14],
  roster: [2, 3, 6, 0, 2, 3, 6],
  arenas: [13, 15],
  boss: 6,
  bossName: "Caçador de les Branques",
  terraces: [0, 0.42000000000000004, -0.26999999999999996, 0.5599999999999999],
  secret: [5, 1],
  outdoors: true,
  bossHealth: 225
 },
 {
  name: "Catacumbes de l’Encenser",
  route: [0, 4, 8, 9, 10, 14, 15, 11, 7, 6, 2, 1],
  roster: [3, 6, 0, 2, 3, 6, 0, 2],
  arenas: [15, 2],
  boss: 2,
  bossName: "Prior de les Cendres",
  terraces: [0, 0.34, -0.35, 0.48],
  secret: [8, 1],
  outdoors: false,
  bossHealth: 260
 },
 {
  name: "Temple del Sol Enterrat",
  route: [0, 1, 2, 3, 7, 11, 10, 14, 15],
  roster: [6, 0, 2, 3, 6, 0, 2, 3, 6],
  arenas: [7, 14],
  boss: 6,
  bossName: "Custodi de l’Altar",
  terraces: [0, 0.42000000000000004, -0.26999999999999996, 0.5599999999999999],
  secret: [2, -1],
  outdoors: false,
  bossHealth: 305
 },
 {
  name: "Castell de les Corones Buides",
  route: [0, 4, 8, 12, 13, 14, 10, 11, 7, 6, 5, 1, 2, 3],
  roster: [0, 2, 3, 6, 0, 2, 3, 6, 0, 2],
  arenas: [11, 2],
  boss: 6,
  bossName: "El Rei Immortal",
  terraces: [0, 0.34, -0.35, 0.48],
  secret: [8, 1],
  outdoors: true,
  bossHealth: 380
 }
]);
