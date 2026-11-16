import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';
import { Script, runInNewContext } from 'node:vm';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const html = read('../index.html');
const scripts = Array.from(html.matchAll(/<script src="\.\/([^"]+)"><\/script>/g), match => match[1]);
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
  const ids = new Set(levels.flatMap(level => [...level.roster, level.boss]));
  const files = [...ids].map(id => `enemy-${String(id + 1).padStart(2, '0')}.webp`);
  for (const file of [...files, 'weapons.webp']) {
    assert.ok(statSync(new URL('../assets/' + file, import.meta.url)).size > 0, file);
  }
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
