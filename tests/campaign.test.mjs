import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';
import { Script, runInNewContext } from 'node:vm';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const html = read('../index.html');
const scripts = Array.from(html.matchAll(/<script src="\.\/([^"?]+)(?:\?[^"]*)?"><\/script>/g), match => match[1]);
const source = scripts.slice(0, scripts.indexOf('campaign.js')+1).map(path => read('../'+path)).join('\n');
const game = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const {
  ferroSurfaces, worlds, levels, readCampaignProgress, saveCampaignProgress,
  calculateLevelScore, readLevelRecords, saveLevelRecord
} = runInNewContext(source + `
  ({ferroSurfaces, worlds, levels, readCampaignProgress, saveCampaignProgress,
    calculateLevelScore, readLevelRecords, saveLevelRecord})
`);

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
}

test('the game loads the campaign before parsing its entry script', () => {
  assert.match(html, /<script src="\.\/campaign\.js"><\/script>(?:\s*<script src="[^"]+"><\/script>)*\s*<script>/);
  assert.doesNotThrow(() => new Script(source + '\n' + game));
});

test('each map connects distinct, orthogonally adjacent rooms', () => {
  assert.equal(new Set(levels.map(level => level.name)).size, levels.length);
  for (const { name, route, arenas, terraces } of levels) {
    assert.equal(new Set(route).size, route.length, name);
    assert.equal(terraces.length, 4, name);
    assert.ok(arenas.every(room => route.includes(room)), name);
    route.forEach((room, index) => {
      assert.ok(Number.isInteger(room) && room >= 0 && room < 16, name);
      if (index === 0) return;
      const previous = route[index - 1];
      const distance = Math.abs(room % 4 - previous % 4)
        + Math.abs(Math.floor(room / 4) - Math.floor(previous / 4));
      assert.equal(distance, 1, name);
    });
  }
});

test('all campaign enemy and weapon sprite files exist', () => {
  const { typesByWorld, spawns } = runInNewContext(source + [
    read('../assets/enemies/catalog.js'),
    read('../assets/levels/arena.js'),
    '({typesByWorld, spawns: ferroArena.layout(37, types).spawns})'
  ].join('\n'));
  const files = new Set(['weapons.webp']);
  for (const { theme, roster, boss } of levels) {
    for (const slot of [...roster, boss]) {
      const type = typesByWorld[theme][slot];
      assert.equal(type?.slot, slot);
      if (type.atlas) {
        files.add('enemies/360/' + type.atlas + '.webp');
        assert.equal(spawns.filter(spawn => spawn.type === type).length, 2);
      }
    }
  }
  const art = read('../assets/enemies/sprites.js');
  for (const [, prefix] of art.matchAll(/'([a-z-]+)-sprites\.png'/g)) {
    for (const pose of ['sprites', 'walk', 'jump', 'shoot']) files.add(`enemies/${prefix}-${pose}.png`);
  }
  for (const file of files) {
    assert.ok(statSync(new URL('../assets/' + file, import.meta.url)).size > 0, file);
  }
});

test('the four arena rooms each have two exits and every enemy has two distinct spawns', () => {
  const { grid, spawns, start, types, cores, roomAt } = runInNewContext(source + [
    read('../assets/enemies/catalog.js'),
    read('../assets/levels/arena.js'),
    '({...ferroArena.layout(37, types), types, roomAt:ferroArena.roomAt})'
  ].join('\n'));
  assert.equal(spawns.length, types.length * 2);
  assert.equal(new Set(spawns.map(({x, y}) => x + ':' + y)).size, spawns.length);
  assert.equal(grid[Math.floor(start[1])][Math.floor(start[0])], 0);
  for (const type of types) {
    const copies = spawns.filter(spawn => spawn.type === type);
    assert.equal(copies.length, 2, type.name);
    assert.equal(Math.abs(copies[0].room - copies[1].room), 2, type.name);
    for (const {x, y} of copies) assert.equal(grid[Math.floor(y)][Math.floor(x)], 0, type.name);
  }
  assert.equal(cores.length, 4);
  for (const [room, [cx, cy]] of cores.entries()) {
    const x = Math.floor(cx), y = Math.floor(cy);
    assert.equal(roomAt(cx, cy), room);
    assert.equal(grid[y][x], 0);
    const exits = [[x-7,y], [x+7,y], [x,y-7], [x,y+7]];
    assert.equal(exits.filter(([exitX, exitY]) => grid[exitY][exitX] === 0).length, 2);
  }
});

test('directional sprites address eight views in each authored movement', () => {
  const spriteSource = read('../assets/enemies/sprites.js').replace(
    'prepare,viewFor,', 'prepare,viewFor,atlasRow,'
  );
  const {viewFor, atlasRow} = runInNewContext(spriteSource + '\nferroEnemySprites');
  for (let pose = 0; pose < 3; pose++) {
    const movement = ['walk', 'jump', 'shoot'][pose];
    for (let view = 0; view < 8; view++) {
      const bearing = view * Math.PI / 4;
      assert.equal(viewFor(0, bearing), view);
      assert.equal(viewFor(2 * Math.PI, bearing), view);
      assert.equal(atlasRow(view, movement), pose * 8 + (8 - view) % 8);
    }
  }
  assert.equal(viewFor(0, Math.PI, 3), 4);
  assert.equal(viewFor(0, -Math.PI, 5), 4);
  assert.equal(viewFor(0, Math.PI * 24 / 180, 0), 0);
  assert.equal(viewFor(0, Math.PI * 27 / 180, 0), 1);
});

test('directional atlases load once on demand and a partial world is not ready for the arena', async () => {
  const downloads = [];
  class FakeImage {
    naturalWidth = 96 * 12;
    naturalHeight = 96 * 24;
    set src(path) {
      downloads.push(path);
      queueMicrotask(() => this.onload());
    }
  }
  const scoped = runInNewContext(
    'const typesByWorld = [[{slot: 0, atlas: "first"}, {slot: 1, atlas: "second"}]];\n' +
    read('../assets/enemies/sprites.js') + '\nferroEnemySprites',
    { Image: FakeImage }
  );
  await Promise.all([scoped.prepare(0, [0]), scoped.prepare(0, [0])]);
  assert.equal(scoped.ready(0, [0]), true);
  assert.equal(scoped.ready(0, [1]), false);
  assert.equal(scoped.ready(0), false);
  assert.deepEqual(downloads, ['./assets/enemies/360/first.webp']);
  await scoped.prepare(0);
  assert.equal(scoped.ready(0), true);
  assert.deepEqual(downloads, ['./assets/enemies/360/first.webp', './assets/enemies/360/second.webp']);
});

test('a directional preview in a mixed world does not download its legacy sheets', async () => {
  const downloads = [];
  class FakeImage {
    naturalWidth = 96 * 12;
    naturalHeight = 96 * 24;
    set src(path) {
      downloads.push(path);
      queueMicrotask(() => this.onload());
    }
  }
  const scoped = runInNewContext(
    'const typesByWorld = [[{slot: 0}, {slot: 1, atlas: "directional"}]];\n' +
    read('../assets/enemies/sprites.js') + '\nferroEnemySprites',
    { Image: FakeImage }
  );
  await scoped.prepare(0, [1]);
  assert.deepEqual(downloads, ['./assets/enemies/360/directional.webp']);
  assert.equal(scoped.ready(0, [1]), true);
  assert.equal(scoped.ready(0, [0]), false);
  assert.equal(scoped.ready(0), false);
});

test('progress persists across reads and replay preserves the highest unlock', () => {
  const storage = memoryStorage();
  assert.equal(readCampaignProgress(storage), 0);
  assert.equal(saveCampaignProgress(storage, 0, 0), 1);
  assert.equal(saveCampaignProgress(storage, 1, 1), 2);
  assert.equal(saveCampaignProgress(storage, 0, 0), 2);
  assert.equal(readCampaignProgress(storage), 2);
  assert.equal(saveCampaignProgress(undefined, 0, 0), 1);
});

test('score includes bounded time, accuracy and damage bonuses', () => {
  const run = { normal: 1, special: 1, shots: 2, hits: 1, seconds: 20 };
  assert.equal(calculateLevelScore({ ...run, damageTaken: 0 }), 8050);
  assert.equal(calculateLevelScore({ ...run, damageTaken: 1 }), 5550);
  assert.equal(calculateLevelScore({ ...run, shots: 0, hits: 0, seconds: 200, damageTaken: 1 }), 4850);
});

test('a personal record prefers points, then faster time, and survives reload', () => {
  const storage = memoryStorage();
  let records = readLevelRecords(storage);
  for (const result of [
    { points: 5000, seconds: 50 },
    { points: 4999, seconds: 10 },
    { points: 5000, seconds: 40 },
    { points: 5000, seconds: 45 }
  ]) records = saveLevelRecord(storage, records, 0, result);
  assert.equal(readLevelRecords(storage)[0].points, 5000);
  assert.equal(readLevelRecords(storage)[0].seconds, 40);
});

test('the campaign has five themed worlds with five authored routes apiece', () => {
  assert.equal(worlds.length, 5);
  assert.equal(new Set(ferroSurfaces.map(surface => surface.material)).size, 5);
  assert.equal(levels.length, 25);
  assert.equal(new Set(levels.map(level => level.route.join(','))).size, 25);
  for (let index = 0; index < worlds.length; index++) {
    const stages = levels.filter(level => level.theme === index);
    assert.equal(stages.length, 5);
    assert.ok(stages.every((level, stage) => level.stage === stage && level.bossHealth > 0));
  }
  const storage = memoryStorage();
  assert.equal(saveCampaignProgress(storage, 4, 4), 5);
  assert.equal(saveCampaignProgress(storage, 24, 24), 24);
});

test('each world uses a 640 by 128 PNG atlas with five tiles', () => {
  assert.equal(new Set(ferroSurfaces.map(surface => surface.atlas)).size, 5);
  for (const { atlas } of ferroSurfaces) {
    const bytes = readFileSync(new URL('../' + atlas.slice(2), import.meta.url));
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16), 640);
    assert.equal(bytes.readUInt32BE(20), 128);
    assert.ok(html.includes('loadSurfaceTextures();'));
  }
});
