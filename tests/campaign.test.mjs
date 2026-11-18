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
  assert.ok(scripts.indexOf('assets/levels/ship.js') < scripts.indexOf('campaign.js'));
  assert.match(html, /<script src="\.\/campaign\.js(?:\?[^\"]+)?"><\/script>(?:\s*<script src="[^"]+"><\/script>)*\s*<script>/);
  assert.doesNotThrow(() => new Script(source + '\n' + game));
});

test('all ship decks have walkable rooms, real windows and mandatory jump gaps', () => {
  const ship = runInNewContext(source + '\nferroShip');
  const directions=[[1,0],[-1,0],[0,1],[0,-1]];
  for(const chapter of levels.filter(level=>level.theme<5)){
    const {deck,grid,heights,gaps,pits,objects,windows}=ship.layout(chapter);
    assert.ok(gaps.length>0,chapter.name);
    assert.ok(deck.some(room=>(room.rx*2+1)*(room.ry*2+1)>=81),chapter.name);
    assert.ok(objects.flatMap(row=>Array.from(row)).filter(Boolean).length>=8,chapter.name);
    const start=deck[0],goal=deck.at(-1);
    const crosses=(allowJump)=>{
      const seen=new Set([start.y*ship.mapSize+start.x]);
      const queue=[[start.x,start.y]];
      for(const [x,y] of queue){
        if(x===goal.x&&y===goal.y)return true;
        for(const [dx,dy] of directions){
          let nx=x+dx,ny=y+dy;
          if(allowJump&&pits[ny]?.[nx]){nx+=dx;ny+=dy}
          const key=ny*ship.mapSize+nx;
          if(grid[ny]?.[nx]!==0||pits[ny]?.[nx]||objects[ny]?.[nx]||seen.has(key))continue;
          if(Math.abs(heights[ny][nx]-heights[y][x])>.24)continue;
          seen.add(key);queue.push([nx,ny]);
        }
      }
      return false;
    };
    assert.equal(crosses(false),false,chapter.name);
    assert.equal(crosses(true),true,chapter.name);
    assert.ok(windows.some(row=>row.some(Boolean)),chapter.name);
    for(const {x,y,dx,dy,lane} of gaps){
      for(let k=-lane;k<=lane;k++){
        const gx=x+dy*k,gy=y+dx*k;
        assert.equal(pits[gy][gx],1,chapter.name);
        assert.equal(grid[gy-dy][gx-dx],0,chapter.name);
        assert.equal(heights[gy-dy][gx-dx],heights[gy+dy][gx+dx],chapter.name);
      }
    }
  }
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
  const files = new Set(['weapons.webp', 'heavy-weapons.webp', 'props/crate.webp', 'props/barrel.webp', 'sputnik/wildlife.webp']);
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

test('the campaign has six themed worlds with five authored routes apiece', () => {
  assert.equal(worlds.length, 6);
  assert.equal(new Set(ferroSurfaces.map(surface => surface.material)).size, 5);
  assert.equal(levels.length, 30);
  assert.equal(new Set(levels.map(level => level.route.join(','))).size, 30);
  for (let index = 0; index < worlds.length; index++) {
    const stages = levels.filter(level => level.theme === index);
    assert.equal(stages.length, 5);
    assert.ok(stages.every((level, stage) => level.stage === stage && level.bossHealth > 0));
  }
  const storage = memoryStorage();
  assert.equal(saveCampaignProgress(storage, 4, 4), 5);
  assert.equal(saveCampaignProgress(storage, 29, 29), 29);
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

test('all six detailed wall atlases contain three 256 by 256 wall panels', () => {
  const atlases = runInNewContext(source + '\nferroWallAtlases');
  assert.equal(atlases.length, 6);
  for (const atlas of atlases) {
    const bytes = readFileSync(new URL('../' + atlas.slice(2), import.meta.url));
    assert.equal(bytes.toString('ascii', 8, 16), 'WEBPVP8 ');
    assert.equal(bytes.readUInt16LE(26) & 0x3fff, 768);
    assert.equal(bytes.readUInt16LE(28) & 0x3fff, 256);
  }
});

test('arena props push, rebound off walls and can be hit at firing height', () => {
  const props = runInNewContext(read('../assets/props.js') + '\nferroProps');
  const [crate,barrel] = props.spawn([[5,5]]);
  const open = () => false;
  const player = {x:crate.x-crate.radius-.16,y:crate.y,z:0};
  const original = crate.x;
  const initialYaw = crate.yaw;
  props.tick([crate],open,player,[player.x-.03,player.y],.02);
  assert.ok(crate.x>original);
  props.push(crate,1,0,9,3);
  const wall = x => x>crate.x+crate.radius+.005;
  props.tick([crate],wall,{x:0,y:0,z:0},[0,0],.02);
  assert.ok(crate.vx<0);
  assert.ok(crate.z>0);
  assert.notEqual(crate.yaw,initialYaw);
  for(let i=0;i<45;i++)props.tick([crate],open,{x:0,y:0,z:0},[0,0],.025);
  assert.equal(crate.z,0);
  assert.equal(props.along([barrel],barrel.x-1,barrel.y,.49,1,0,2).prop,barrel);
  assert.equal(props.along([barrel],barrel.x-1,barrel.y,1,1,0,2),null);
});

test('arena props use eight distinct view cells and leave short-lived physical fragments', () => {
  const props = runInNewContext(read('../assets/props.js') + '\nferroProps');
  for(const kind of ['crate','barrel']){
    const cells = Array.from({length:8},(_,view)=>props.frame(kind,view));
    assert.equal(new Set(cells.map(cell=>cell.frameX+':'+cell.frameY)).size,8);
    assert.deepEqual([cells[0].frameX,cells[0].frameY],[0,0]);
    assert.deepEqual([cells[4].frameX,cells[4].frameY],[0,160]);
  }
  const [crate,barrel] = props.spawn([[5,5]]);
  const fragments = [];
  props.shatter(fragments,crate,1,0);
  props.shatter(fragments,barrel,1,0);
  assert.equal(fragments.length,21);
  const first = fragments[0],before = first.z;
  props.tickFragments(fragments,()=>false,.05);
  assert.ok(first.z>before);
  for(let i=0;i<90;i++)props.tickFragments(fragments,()=>false,.05);
  assert.equal(fragments.length,0);
});

test('arena enemy counts follow living enemies across rooms', () => {
  const arena = runInNewContext(read('../assets/levels/arena.js') + '\nferroArena');
  const enemy = {x:9,y:9,hp:50};
  const defeated = {x:9,y:9,hp:0};
  assert.deepEqual(Array.from(arena.aliveByRoom([enemy,defeated])),[1,0,0,0]);
  enemy.x=27;
  assert.deepEqual(Array.from(arena.aliveByRoom([enemy,defeated])),[0,1,0,0]);
});

test('the seven viewmodels animate at rest and the two charged weapons keep their own roles', () => {
  const {guns,weaponMotion,blastDamage,specialArsenal} = runInNewContext(
    read('../assets/combat.js') + '\n({guns,weaponMotion,blastDamage,specialArsenal})'
  );
  for(let id=0;id<guns.length;id++){
    const resting=weaponMotion(id,1,0,1,0,true);
    assert.ok(resting.width<=480*.30);
    assert.notDeepEqual(resting,weaponMotion(id,1.4,0,1,0,true));
    assert.ok(weaponMotion(id,1,0,1,.105,true).y>resting.y);
  }
  assert.ok(guns[5].projectile.speed>guns[6].projectile.speed);
  assert.ok(guns[6].projectile.radius>guns[5].projectile.radius);
  assert.ok(guns[6].projectile.charge>0);
  assert.ok(blastDamage(0,3,100)>blastDamage(1,3,100));
  assert.equal(blastDamage(3,3,100),0);
  assert.deepEqual(Array.from(specialArsenal(5)),[]);
  assert.deepEqual(Array.from(specialArsenal(10)),[5]);
  assert.deepEqual(Array.from(specialArsenal(11)),[5,6]);
});

test('player shots start at the animated muzzle and explosive shots join the aiming axis', () => {
  const {weaponMotion,weaponViewmodel,muzzleInWorld,boltTrailPoint} = runInNewContext(
    read('../assets/combat.js')+'\n({weaponMotion,weaponViewmodel,muzzleInWorld,boltTrailPoint})'
  );
  const player={x:4,y:7,a:1.24},eye=.84,plane=.69;
  const ca=Math.cos(player.a),sa=Math.sin(player.a);
  for(const [w,h] of [[416,234],[704,396]]){
    const focal=w*270/576;
    for(let id=0;id<7;id++){
      const model=weaponViewmodel(id,weaponMotion(id,2,7,.8,.105,true),id>=5);
      const muzzle=muzzleInWorld(model.screenMuzzle,player,eye,plane,h,focal);
      const dx=muzzle[0]-player.x,dy=muzzle[1]-player.y,depth=dx*ca+dy*sa;
      const x=w/2+w/2*(-dx*sa+dy*ca)/(depth*plane);
      const y=h/2+(eye-muzzle[2])*focal/depth;
      assert.ok(Math.abs(x*480/w-model.screenMuzzle[0])<1e-9);
      assert.ok(Math.abs(y*270/h-model.screenMuzzle[1])<1e-9);
      const bolt={origin:[player.x,player.y],dx:ca,dy:sa,altitude:eye-.02,muzzle,traveled:.3};
      assert.deepEqual(boltTrailPoint(bolt,.3),muzzle);
      bolt.traveled=2;
      assert.deepEqual(Array.from(boltTrailPoint(bolt)),[player.x+ca*2,player.y+sa*2,bolt.altitude]);
    }
  }
});

test('the island connects every stage from entrance to exit and the central wreck', () => {
  const { island, size } = runInNewContext(source + '\n({island:ferroSputnik,size:ferroShip.mapSize})');
  for (const chapter of levels.filter(level => level.theme === island.theme)) {
    const { grid, rooms, plants, wreck, secret, terrain } = island.layout(chapter, size);
    const start = rooms[chapter.route[0]];
    const queue = [start];
    const seen = new Set([start.join(',')]);
    for (const [x,y] of queue) {
      for (const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]) {
        const next = [x+dx,y+dy];
        const key = next.join(',');
        if (seen.has(key) || grid[next[1]]?.[next[0]] !== 0) continue;
        seen.add(key);
        queue.push(next);
      }
    }
    assert.ok(chapter.route.every(room => seen.has(rooms[room].join(','))), chapter.name);
    assert.ok(seen.has(secret.map(Math.floor).join(',')), chapter.name);
    const [x,y] = rooms[chapter.route.at(-1)];
    assert.ok(seen.has([x+2,y].join(',')), chapter.name);
    assert.ok(seen.has([Math.floor(wreck.x)-1,Math.floor(wreck.y)].join(',')),chapter.name);
    assert.equal(grid[Math.floor(wreck.y)][Math.floor(wreck.x)],2,chapter.name);
    assert.equal(terrain[rooms[10][1]][rooms[10][0]],2,chapter.name);
    assert.ok([0,1,2,3,4].every(kind => plants.some(plant => plant.kind===kind)),chapter.name);
  }
});

test('island fighters select visible rivals ahead of the player and can be hit by enemy shots', () => {
  const { island, arena, fighters } = runInNewContext(source + [
    read('../assets/enemies/catalog.js'),
    read('../assets/levels/arena.js'),
    '({island:ferroSputnik,arena:ferroArena,fighters:sputnikFighters})'
  ].join('\n'));
  const scout = { x:0,y:0,hp:44,type:fighters[0] };
  const ally = { x:1,y:0,hp:44,type:fighters[0] };
  const rival = { x:4,y:0,hp:58,type:fighters[1] };
  const player = { x:2,y:0,hp:100 };
  const foes = [scout,ally,rival];
  assert.equal(arena.target(scout,player,foes,()=>true,island.opponents),rival);
  assert.equal(arena.target(scout,player,foes,(_,target)=>target!==rival,island.opponents),player);
  assert.equal(arena.shotTarget({x:4,y:0,owner:scout,altitude:.48},foes,()=>.48),rival);
  assert.equal(arena.shotTarget({x:0,y:0,owner:scout,altitude:.48},foes,()=>.48),null);
});

test('unlocking island stages preserves the five existing worlds', () => {
  const { readWorldProgress, completeWorldStage, levelAvailable } = runInNewContext(
    source + '\n({readWorldProgress,completeWorldStage,levelAvailable})'
  );
  const storage = memoryStorage();
  saveCampaignProgress(storage, 23, 23);
  const previous = readWorldProgress(storage);
  assert.ok(levelAvailable(previous,25));
  assert.ok(!levelAvailable(previous,26));
  const next = completeWorldStage(storage,previous,25);
  assert.ok(levelAvailable(next,26));
  assert.deepEqual([...next.slice(0,5)],[...previous.slice(0,5)]);
  assert.deepEqual(readWorldProgress(storage),next);
});

test('each island stage places the sun differently and casts moving shadows away from it', () => {
  const { island, sunlight, size } = runInNewContext(source + '\n({island:ferroSputnik,sunlight:ferroSputnikSun,size:ferroShip.mapSize})');
  const suns = island.stages.map(chapter => island.layout(chapter,size).sun);
  assert.equal(new Set(suns.map(sun=>sun.azimuth)).size,5);
  assert.equal(new Set(suns.map(sun=>sun.elevation)).size,5);
  for(const sun of suns){
    const width=size*12;
    const field={width,staticShade:new Uint8Array(width*width),dynamic:new Uint8Array(width*width),updated:-Infinity};
    const actor={x:20.5,y:20.5,hp:50,dead:0};
    sunlight.update(field,{sun},[],[actor],0,()=>0);
    const extension=.92*.5*sun.reach;
    assert.ok(sunlight.transmission(field,actor.x-sun.x*extension,actor.y-sun.y*extension)<.85);
    assert.equal(sunlight.transmission(field,actor.x+sun.x*extension,actor.y+sun.y*extension),1);
    sunlight.update(field,{sun},[],[actor],1,()=>.45);
    const airborne=(.92*.5+.45)*sun.reach;
    assert.ok(sunlight.transmission(field,actor.x-sun.x*airborne,actor.y-sun.y*airborne)<.85);
  }
});

test('island wildlife includes roaming land species and a flying flock', () => {
  const { island, wildlife, size } = runInNewContext(source + '\n({island:ferroSputnik,wildlife:ferroSputnikWildlife,size:ferroShip.mapSize})');
  for(const chapter of island.stages){
    const map=island.layout(chapter,size);
    const animals=wildlife.spawn(map);
    const start=animals.map(({x,y})=>[x,y]);
    assert.equal(new Set(animals.map(animal=>animal.kind)).size,4);
    const [x,y]=map.airAnchors[0];
    const player={x,y};
    const move=(animal,dx,dy)=>{
      if(map.grid[Math.floor(animal.y+dy)]?.[Math.floor(animal.x+dx)]===0){
        animal.x+=dx;animal.y+=dy;
      }
    };
    const excursion=animals.map(()=>0);
    for(let i=0;i<140;i++){
      wildlife.update(animals,map.grid,player,.035,i<20,move);
      animals.forEach((animal,index)=>{
        excursion[index]=Math.max(excursion[index],Math.hypot(animal.x-start[index][0],animal.y-start[index][1]));
      });
    }
    for(const [i,animal] of animals.entries()){
      assert.ok(excursion[i]>.20);

      if(animal.kind===2)assert.ok(animal.altitude>1);
      else assert.equal(map.grid[Math.floor(animal.y)][Math.floor(animal.x)],0);
    }
  }
});

test('photo mode tracks a detached camera and clamps pitch and altitude', () => {
  const photo = runInNewContext(source + '\nferroPhoto');
  const player = {x:10,y:12,z:.25,a:Math.PI/2};
  const camera = photo.start(player,player.z+.50);
  const move = (view,dx,dy) => { view.x+=dx; view.y+=dy; };
  photo.moveCamera(camera,1,0,1,.5,move,()=>.25,1.5,false);
  assert.equal(camera.x,10);
  assert.equal(camera.y,13.4);
  assert.equal(camera.z,1.34);
  assert.equal(player.y,12);
  assert.equal(player.z,.25);
  photo.aim(camera,.5,5);
  assert.equal(camera.pitch,.52);
  assert.equal(camera.a,Math.PI/2+.5);
  photo.moveCamera(camera,0,0,-1,1,move,()=>.25,1.5,false);
  assert.equal(camera.z,.43);
});

test('the running spring responds to consecutive strides and settles at rest', () => {
  const motion = runInNewContext(read('../assets/enemies/character-motion.js') + '\nferroCharacterMotion');
  const runner = {run:true,travel:0,jump:0,wind:0};
  let high = 0, low = 0;
  for(let i=0;i<120;i++){
    runner.travel=i*.23;
    motion.spring(runner,1/60);
    high=Math.max(high,runner.torso);low=Math.min(low,runner.torso);
  }
  assert.ok(high>.30&&low<-.30);
  runner.run=false;
  for(let i=0;i<100;i++)motion.spring(runner,1/30);
  assert.ok(Math.abs(runner.torso)<.001);
  assert.equal(motion.cell,224);
  assert.equal(new Set(motion.poses).size,9);
});

test('island daylight responds to both surface orientation and shade', () => {
  const sun = runInNewContext(source + '\nferroSputnikSun');
  const texel=127|(127<<8)|(127<<16);
  const sample=(shade,normal)=>sun.surface(texel,shade,normal,1,sun.mist,[0,0,0],0,.2)&255;
  assert.ok(sample(1,1)>sample(1,-1));
  assert.ok(sample(1,-1)>sample(.50,-1));
});

test('viewport and photo dimensions track portrait, landscape and ultrawide screens', () => {
  const view=runInNewContext(source+'\nferroViewport');
  for(const [width,height] of [[360,800],[1920,1080],[2560,1080],[1024,768]]){
    const game=view.size(576,width,height),photo=view.size(1920,width,height);
    assert.equal(Math.max(game.width,game.height),576);
    assert.equal(Math.max(photo.width,photo.height),1920);
    assert.ok(Math.abs(game.width-game.height*width/height)<1.5);
    assert.ok(Math.abs(photo.width-photo.height*width/height)<1.5);
    const ui=view.ui(game.width,game.height);
    const muzzle=view.muzzle([240,270],ui);
    assert.ok(Math.abs(muzzle[0]-240)<1e-8);
    assert.ok(Math.abs(muzzle[1]-270)<1e-8);
  }
  assert.equal(view.projection(576,324).plane,.69);
  assert.equal(view.projection(576,324).focal,270);
});
