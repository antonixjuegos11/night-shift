// Tests de lógica pura (sin Phaser ni navegador): node scripts/test-logic.mjs
import assert from 'node:assert/strict';
import { buildMap, buildCollisionRects, buildBlockedGrid, T } from '../src/data/map.js';
import { findPath } from '../src/systems/Pathfinding.js';
import { TimeSystem } from '../src/systems/TimeSystem.js';
import { newState } from '../src/systems/GameState.js';
import { PRODUCTS, PRODUCT_BY_ID } from '../src/data/products.js';
import { TIME, MAP_W, MAP_H } from '../src/config.js';

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log('  ok -', name); };

const map = buildMap();
const rects = buildCollisionRects(map);
const blocked = buildBlockedGrid(rects);
const reach = (from, to) => findPath(blocked, MAP_W, MAP_H, from, to);
const spawn = { x: Math.floor(map.playerSpawn.x / 16), y: Math.floor(map.playerSpawn.y / 16) };

ok('10 productos con todos los campos', () => {
  assert.equal(PRODUCTS.length, 10);
  PRODUCTS.forEach((p) => { assert.ok(p.name && p.category && p.buy > 0 && p.sell > p.buy && p.boxUnits > 0); });
});
ok('escenario: 4 góndolas, 2 neveras, 2 cajas, racks, puerta', () => {
  assert.equal(map.shelfSlots.filter((s) => s.kind === 'shelf').length, 32);
  assert.equal(map.shelfSlots.filter((s) => s.kind === 'fridge').length, 6);
  assert.equal(map.registers.length, 2);
  assert.equal(map.rackSlots.length, 16);
  assert.ok(map.computer && map.door);
});
ok('el spawn del jugador no está bloqueado', () => assert.equal(blocked[spawn.y][spawn.x], false));
ok('todas las casillas de pie junto a estantes son transitables y alcanzables', () => {
  map.shelfSlots.forEach((s) => {
    assert.equal(blocked[s.stand.y][s.stand.x], false, 'stand bloqueado ' + s.id);
    assert.ok(reach(spawn, s.stand), 'inalcanzable ' + s.id);
  });
});
ok('puntos de cola de las cajas alcanzables desde la calle (clientes)', () => {
  map.registers.forEach((r) => {
    for (let i = 0; i < 3; i++) assert.ok(findPath(blocked, MAP_W, MAP_H, { x: 18, y: 28 }, { x: r.spot.x, y: r.spot.y + i }), 'cola ' + r.id + i);
  });
  assert.ok(reach(spawn, { x: 18, y: 28 }), 'salida a la calle');
});
ok('cajero: se llega al lado norte de cada caja', () => {
  map.registers.forEach((r) => assert.ok(reach(spawn, { x: r.tx + 1, y: r.ty - 1 })));
});
ok('oficina, baño, almacén y muelle alcanzables', () => {
  assert.ok(reach(spawn, { x: map.computer.tx + 1, y: map.computer.ty + 1 }), 'ordenador');
  assert.ok(reach(spawn, { x: 25, y: 8 }), 'baño');
  assert.ok(reach(spawn, { x: 7, y: 8 }), 'almacén');
  assert.ok(reach(spawn, { x: 34, y: 7 }), 'muelle');
});
ok('cada rack tiene un tile libre adyacente alcanzable', () => {
  map.rackSlots.forEach((r) => {
    const adj = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => ({ x: r.tx + dx, y: r.ty + dy }))
      .filter((p) => p.y >= 0 && !blocked[p.y][p.x] && reach(spawn, p));
    assert.ok(adj.length > 0, 'rack ' + r.id);
  });
});
ok('estado inicial coherente con el mapa', () => {
  const s = newState();
  const slotIds = new Set(map.shelfSlots.map((x) => x.id)), rackIds = new Set(map.rackSlots.map((x) => x.id));
  Object.keys(s.shelves).forEach((id) => assert.ok(slotIds.has(id), id));
  s.boxes.forEach((b) => {
    assert.ok(PRODUCT_BY_ID[b.p]);
    if (b.loc === 'rack') assert.ok(rackIds.has(b.slot));
    if (b.loc === 'floor') assert.equal(blocked[b.ty][b.tx], false);
  });
  // neveras solo con productos fríos, estantes solo ambiente
  Object.entries(s.shelves).forEach(([id, v]) => {
    const def = map.shelfSlots.find((x) => x.id === id);
    assert.equal(PRODUCT_BY_ID[v.p].cold, def.cold, 'frío/ambiente ' + id);
  });
});
ok('reloj: 21:30 -> abre 22:00 -> cierra 06:00 una sola vez', () => {
  const st = { clock: TIME.PREP_START, shift: 1 };
  const t = new TimeSystem(st);
  const ev = [];
  for (let i = 0; i < 600 * 2; i++) ev.push(...t.update(0.5));
  assert.deepEqual(ev, ['open', 'close']);
  assert.equal(TimeSystem.format(st.clock), '06:00');
  assert.ok(t.isShiftOver());
});
ok('reloj: la velocidad x4 es 4 veces más rápida', () => {
  const a = { clock: 1300 }, b = { clock: 1300 };
  const ta = new TimeSystem(a), tb = new TimeSystem(b); tb.setSpeed(4);
  ta.update(10); tb.update(10);
  assert.equal(a.clock, 1310); assert.equal(b.clock, 1340);
});
ok('formato de hora pasa de medianoche', () => assert.equal(TimeSystem.format(24 * 60 + 5), '00:05'));
console.log(`\n${n} grupos de tests OK`);
