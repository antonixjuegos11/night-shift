// Prueba de humo con un DOBLE de Phaser (no es Phaser real): ejecuta create()/update() de GameScene,
// clientes y acciones del jugador para detectar errores de referencias, flujo y estado.
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';

const chain = () => new Proxy(function () {}, {
  get: (t, p) => (p === Symbol.toPrimitive ? () => 0 : p === 'then' ? undefined : p === 'length' ? 0 : chain()),
  apply: () => chain(), construct: () => chain(),
});
class Fake {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; this.body = chain(); this.anims = chain(); this.width = 10; this.height = 10; }
  setOrigin() { return this; } setDepth() { return this; } setVisible() { return this; } setTexture() { return this; }
  setPosition(x, y) { this.x = x; this.y = y; return this; } setScale() { return this; } setAlpha() { return this; }
  setBlendMode() { return this; } setCollideWorldBounds() { return this; } setY(y) { this.y = y; return this; } setText() { return this; }
  setColor() { return this; } setSize() { return this; } setStrokeStyle() { return this; } setInteractive() { return this; } destroy() {}
}
const kb = (names) => Object.fromEntries(names.split(',').map((n) => [n, { isDown: false }]));
global.document = { createElement: () => ({ getContext: () => chain(), width: 0, height: 0 }) };
global.window = { addEventListener() {}, removeEventListener() {} };
const store = {}; global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
global.Phaser = {
  Scene: class { constructor(key) { this.key = key; this.events = new EventEmitter(); this.events.once = this.events.once.bind(this.events); } },
  Events: { EventEmitter },
  Math: { Between: (a, b) => a + Math.floor(Math.random() * (b - a + 1)) },
  Utils: { Array: { Shuffle: (a) => a.sort(() => Math.random() - 0.5) } },
  BlendModes: { ADD: 1 },
  Input: { Keyboard: { JustDown: (k) => { const v = !!k.just; k.just = false; return v; } } },
};
const { GameScene } = await import('../src/scenes/GameScene.js');
const { bus } = await import('../src/systems/EventBus.js');
const A = await import('../src/systems/Actions.js');

const g = new GameScene();
g.init({ load: false });
const keys = kb('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,Q,R,P,ESC,I');
g.add = { image: (x, y) => new Fake(x, y), sprite: (x, y) => new Fake(x, y), zone: (x, y) => new Fake(x, y), rectangle: () => new Fake(), text: () => new Fake(), graphics: () => chain(), container: () => chain() };
g.physics = { add: { sprite: (x, y) => new Fake(x, y), existing() {}, collider() {}, staticGroup: () => ({ add() {} }) }, world: { setBounds() {}, pause() {}, resume() {} } };
g.physics.add.staticGroup = () => ({ add() {} });
g.cameras = { main: chain() }; g.tweens = chain(); g.textures = { exists: () => false, remove() {}, addCanvas() {} };
g.input = { keyboard: { addKeys: () => keys } }; g.anims = chain();
g.time = { delayedCall() {}, addEvent: () => ({ remove() {} }) };
const launched = []; g.scene = { isActive: () => false, stop() {}, launch: (k) => launched.push(k), start() {}, get: () => g };
g.sys = { isActive: () => true };

const notes = []; bus.on('notify', (t) => notes.push(t));
g.create();
assert.deepEqual(launched, ['UI']);
assert.equal(g.slots.size, 38); assert.equal(g.boxes.length, 9); assert.equal(g.dirts.length, 3);
console.log('  ok - create(): mundo, estantes, cajas, suciedad iniciales');

// ---- flujo manual del jugador: coger caja del muelle, abrirla, llenar un estante y una nevera
const P = g.player; P.sprite.x = 31 * 16 + 8; P.sprite.y = 5 * 16 + 4; P.dir = 'up';
const dock = g.boxes.find((b) => b.m.id === 'b7'); // yogur (frío)
A.pickBox(g, dock); assert.equal(g.state.hands.kind, 'box');
P.sprite.x = 33 * 16 + 8; P.sprite.y = 8 * 16; P.dir = 'up';           // tile libre delante
assert.ok(A.dropBox(g, true)); assert.equal(g.state.hands.kind, 'none');
assert.equal(dock.m.loc, 'floor'); assert.ok(dock.m.open);
for (let i = 0; i < 6; i++) assert.ok(A.takeProduct(g, dock));
assert.deepEqual(g.state.hands, { kind: 'items', p: 'yogurt', qty: 6 }); assert.equal(dock.m.qty, 6);
const shelf = g.slots.get('G0L1'), fridge = g.slots.get('F02');
assert.equal(A.putProducts(g, shelf), false, 'frío en estante normal debe rechazarse');
assert.ok(A.putProducts(g, fridge)); assert.equal(fridge.qty(), 6); assert.equal(g.state.hands.kind, 'none');
assert.equal(g.state.objectives.find((o) => o.id === 'restock').progress, 6);
for (let i = 0; i < 6; i++) A.takeProduct(g, dock);
assert.ok(!g.boxes.includes(dock), 'caja vacía desaparece');
console.log('  ok - caja -> abrir -> productos en manos -> nevera (con rechazo de frío en estante)');

// ---- almacén: coger caja del rack y volver a guardarla
const rackBoxed = g.boxes.find((b) => b.m.loc === 'rack');
A.pickBox(g, rackBoxed); assert.equal(g.state.hands.kind, 'box');
A.storeBox(g, g.map.rackSlots.find((r) => r.id === 'R15')); assert.equal(rackBoxed.m.slot, 'R15');
console.log('  ok - guardar caja en el almacén');

// ---- simulación completa de un turno con clientes (jugador cobrando automáticamente)
const dt = 1 / 20; let sold = 0, ticks = 0, shiftEnd = null;
bus.on('shiftEnd', (s) => { shiftEnd = s; });
g.timeSys.setSpeed(4);
while (!g.frozen && ticks < 20 * 60 * 60) {
  ticks++;
  [0, 1].forEach((i) => { if (g.customers.waitingAt(i)) { A.chargeRegister(g, i); sold++; } });
  g.update(ticks * 50, 50);
  if (ticks % 400 === 0) { // reponer algo de vez en cuando para que haya stock
    const s = g.slots.get('G1L2'); if (s.qty() < 8) s.set('pasta', 8);
  }
}
assert.ok(g.frozen && shiftEnd, 'el turno termina a las 06:00');
assert.equal(g.state.clock, 30 * 60);
assert.ok(shiftEnd.served === sold && sold > 3, `clientes atendidos ${sold}`);
assert.ok(g.state.money > 500, 'hay ingresos');
console.log(`  ok - turno completo: ${sold} clientes cobrados, dinero ${g.state.money.toFixed(2)}, perdidos ${shiftEnd.lost}, suciedad ${g.dirts.length}`);

// ---- pedidos, entregas, siguiente noche y guardado
g.startNextShift();
assert.equal(g.state.shift, 2); assert.equal(g.state.clock, 21 * 60 + 30); assert.equal(g.frozen, false);
const before = g.state.money;
assert.equal(g.placeOrder([{ p: 'milk', count: 2 }]), true); assert.ok(g.state.money < before);
const cash = g.state.money; g.state.money = 10;
assert.equal(g.placeOrder([{ p: 'tp', count: 9 }, { p: 'cereal', count: 9 }, { p: 'juice', count: 9 }, { p: 'cola', count: 9 }, { p: 'pasta', count: 9 }, { p: 'chips', count: 9 }]), false, 'sin dinero suficiente'); g.state.money = cash;
const nBoxes = g.boxes.length; g.state.clock += 31; g.updateDeliveries();
assert.equal(g.boxes.length, nBoxes + 2); assert.equal(g.state.deliveries.length, 0);
assert.ok(g.saveGame(true)); const loaded = JSON.parse(store.nightshift_save_v1);
assert.equal(loaded.shift, 2); assert.equal(loaded.boxes.length, g.state.boxes.length);
console.log('  ok - pedido -> entrega en el muelle -> siguiente noche -> guardado');
console.log('\nSMOKE OK (notificaciones emitidas:', notes.length + ')');
