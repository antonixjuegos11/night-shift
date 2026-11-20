import { MAP_W, MAP_H, ZOOM, TIME, AUTOSAVE_SECONDS, ORDER_DELAY_MIN, MAX_DIRT } from '../config.js';
import { PRODUCT_BY_ID, formatMoney } from '../data/products.js';
import { buildMap, buildCollisionRects, buildBlockedGrid, T, PROP_FOOT } from '../data/map.js';
import { newState, nextShiftState, nextBoxId, syncBoxCounter, OBJECTIVE_DEFS } from '../systems/GameState.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { CustomerSystem } from '../systems/CustomerSystem.js';
import { InteractionSystem } from '../systems/InteractionSystem.js';
import { bus, listen } from '../systems/EventBus.js';
import { Player } from '../entities/Player.js';
import { Box } from '../entities/Box.js';
import { ShelfSlot } from '../entities/ShelfSlot.js';

const FLOOR_KEY = {
  [T.STORE]: null, [T.BACK]: 'floor_back', [T.OFFICE]: 'floor_office', [T.BATH]: 'floor_bath', [T.DOCK]: 'floor_dock',
  [T.HAZARD]: 'floor_hazard', [T.STREET]: 'floor_street', [T.SIDEWALK]: 'floor_sidewalk',
};

export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) { this.wantLoad = !!(data && data.load); }

  get stats() { return this.state.stats; }

  create() {
    const saved = this.wantLoad ? SaveSystem.load() : null;
    this.state = saved || newState();
    this.isNew = !saved;
    syncBoxCounter(this.state.boxes);
    this.map = buildMap();
    this.paused = false; this.frozen = false; this.modal = false;
    this.dirtT = 25; this.saveT = 0; this.lastMinute = -1; this.doorOpen = false;
    this.timeSys = new TimeSystem(this.state);

    this.drawWorld();
    this.buildFurniture();

    const rects = buildCollisionRects(this.map);
    this.blocked = buildBlockedGrid(rects);
    this.solids = this.physics.add.staticGroup();
    rects.forEach((r) => {
      const z = this.add.zone(r.x * 16 + r.w * 8, r.y * 16 + r.h * 8, r.w * 16, r.h * 16);
      this.physics.add.existing(z, true);
      this.solids.add(z);
    });
    this.physics.world.setBounds(0, 0, MAP_W * 16, MAP_H * 16);

    const sp = this.state.player || { ...this.map.playerSpawn, dir: 'up' };
    this.player = new Player(this, sp.x, sp.y, sp.dir);
    this.physics.add.collider(this.player.sprite, this.solids);
    this.customers = new CustomerSystem(this);
    this.interaction = new InteractionSystem(this);

    const cam = this.cameras.main;
    cam.setZoom(ZOOM).setBounds(0, 0, MAP_W * 16, MAP_H * 16).setRoundPixels(true);
    cam.startFollow(this.player.sprite, true, 0.14, 0.14, 0, 12);
    cam.centerOn(this.player.sprite.x, this.player.sprite.y - 12);

    this.buildLighting();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,Q,R,P,ESC,I');
    this.bindBus();

    if (this.isNew && this.state.dirt.length === 0) { this.spawnDirt(12, 15, 'spill'); this.spawnDirt(30, 19, 'trash'); this.spawnDirt(26, 6, 'crumbs'); }
    this.handsChanged();
    if (this.scene.isActive('UI')) this.scene.stop('UI');
    this.scene.launch('UI');

    this._unload = () => { if (this.sys && this.sys.isActive()) this.saveGame(true); };
    window.addEventListener('beforeunload', this._unload);
    this.events.once('shutdown', () => window.removeEventListener('beforeunload', this._unload));

    this.time.delayedCall(700, () => {
      if (this.isNew) {
        this.notify('Bienvenido a NIGHT SHIFT. Abres a las 22:00.', 'info');
        this.notify('Reparte las cajas del muelle: ábrelas (R) y repón los estantes.', 'info');
      } else this.notify('Partida cargada.', 'good');
      if (this.timeSys.isShiftOver()) this.onClose();
    });
  }

  // ------------------------------------------------------------ construcción del mundo
  drawWorld() {
    const { grid } = this.map;
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
      const t = grid[y][x];
      let key;
      if (t === T.WALL) key = grid[y + 1] && grid[y + 1][x] !== T.WALL ? 'wall_face' : 'wall_top';
      else if (t === T.STORE) key = 'floor_store' + ((x + y) % 2);
      else key = FLOOR_KEY[t];
      this.add.image(x * 16, y * 16, key).setOrigin(0).setDepth(0);
    }
  }

  buildFurniture() {
    this.map.props.forEach((p) => {
      const f = PROP_FOOT[p.key];
      this.add.image(p.tx * 16, (p.ty + f.h) * 16, p.key).setOrigin(0, 1).setDepth(p.floor ? 1 : p.wall ? 2 : (p.ty + f.h) * 16);
    });
    // puerta automática (dos hojas)
    const d = this.map.door;
    this.doorL = this.add.image(d.tx * 16, d.ty * 16, 'door').setOrigin(0).setDepth(3);
    this.doorR = this.add.image((d.tx + 1) * 16, d.ty * 16, 'door').setOrigin(0).setDepth(3);
    // neveras (el marco se dibuja una vez por nevera; los huecos son ShelfSlot)
    [12, 16].forEach((ty) => this.add.image(2 * 16, ty * 16, 'fridge').setOrigin(0).setDepth((ty + 3) * 16 - 3));
    this.slots = new Map();
    this.map.shelfSlots.forEach((def) => this.slots.set(def.id, new ShelfSlot(this, def)));
    this.rackById = new Map();
    this.map.rackSlots.forEach((r) => {
      this.rackById.set(r.id, r);
      this.add.image(r.tx * 16, r.ty * 16, 'rack').setOrigin(0).setDepth(r.ty * 16 + 8);
    });
    this.boxes = this.state.boxes.map((m) => new Box(this, m));
    this.dirts = [];
    this.state.dirt.forEach((m) => this.makeDirtSprite(m));
  }

  buildLighting() {
    const W = MAP_W * 16, H = MAP_H * 16;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(10,8,22,0.80)'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'destination-out';
    this.map.lamps.forEach((l) => {
      const gr = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      gr.addColorStop(0, `rgba(0,0,0,${l.a})`); gr.addColorStop(0.55, `rgba(0,0,0,${l.a * 0.55})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    });
    if (this.textures.exists('lightmap')) this.textures.remove('lightmap');
    this.textures.addCanvas('lightmap', c);
    this.add.image(0, 0, 'lightmap').setOrigin(0).setDepth(9000);
    this.map.lamps.forEach((l, i) => {
      const glow = this.add.image(l.x, l.y, l.tone ? 'glow_cool' : 'glow_warm').setBlendMode(Phaser.BlendModes.ADD)
        .setScale((l.r * 2) / 128).setAlpha(l.tone ? 0.10 : 0.20).setDepth(9001);
      if (i % 7 === 3) this.tweens.add({ targets: glow, alpha: glow.alpha * 0.7, duration: 900 + i * 40, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    });
  }

  bindBus() {
    listen(this, 'setSpeed', (n) => this.timeSys.setSpeed(n));
    listen(this, 'setPause', (v) => this.setPaused(v));
    listen(this, 'saveGame', () => this.saveGame(false));
    listen(this, 'quitToMenu', () => this.quitToMenu());
    listen(this, 'nextShift', () => this.startNextShift());
    listen(this, 'placeOrder', (list, cb) => { const ok = this.placeOrder(list); if (cb) cb(ok); });
    listen(this, 'modal', (v) => { this.modal = v; this.player.stop(); });
  }

  // ------------------------------------------------------------ API para sistemas / UI
  notify(text, kind = 'info') { bus.emit('notify', text, kind); }
  handsChanged() {
    const h = this.state.hands;
    this.player.showHands(h, h.kind === 'box' ? this.state.boxes.find((b) => b.id === h.id) : null);
    bus.emit('hands', h);
  }
  moneyChanged() { bus.emit('money', this.state.money); }

  addProgress(id, n) {
    const o = this.state.objectives.find((x) => x.id === id), def = OBJECTIVE_DEFS.find((x) => x.id === id);
    if (!o || o.done) return;
    o.progress += n;
    if (o.progress >= def.target) {
      o.done = true; this.state.money += def.reward;
      this.notify(`Objetivo cumplido: ${def.label} (+${formatMoney(def.reward)})`, 'good');
      this.moneyChanged();
    }
    bus.emit('objectives');
  }

  removeBox(box) {
    this.boxes = this.boxes.filter((b) => b !== box);
    this.state.boxes = this.state.boxes.filter((m) => m !== box.m);
    if (this.state.hands.kind === 'box' && this.state.hands.id === box.m.id) this.state.hands = { kind: 'none' };
    box.destroy();
    this.handsChanged();
  }

  makeDirtSprite(m) {
    const sprite = this.add.image(m.tx * 16, m.ty * 16, 'dirt_' + m.kind).setOrigin(0).setDepth(1.5);
    this.dirts.push({ m, sprite });
  }
  spawnDirt(tx, ty, kind) {
    if (this.dirts.length >= MAX_DIRT || tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
    if (this.blocked[ty][tx] || this.dirts.some((d) => d.m.tx === tx && d.m.ty === ty)) return false;
    const m = { tx, ty, kind };
    this.state.dirt.push(m); this.makeDirtSprite(m);
    return true;
  }
  removeDirt(d) {
    d.sprite.destroy();
    this.dirts = this.dirts.filter((x) => x !== d);
    this.state.dirt = this.state.dirt.filter((m) => m !== d.m);
  }

  placeOrder(list) {
    const items = list.filter((l) => l.count > 0);
    const cost = items.reduce((t, l) => t + PRODUCT_BY_ID[l.p].buy * PRODUCT_BY_ID[l.p].boxUnits * l.count, 0);
    if (!items.length) { this.notify('El pedido está vacío.', 'warn'); return false; }
    if (cost > this.state.money) { this.notify('No tienes dinero suficiente para el pedido.', 'bad'); return false; }
    this.state.money -= cost; this.state.stats.spent += cost;
    const arrive = this.state.clock + ORDER_DELAY_MIN;
    let boxes = 0;
    items.forEach((l) => { for (let i = 0; i < l.count; i++) { this.state.deliveries.push({ p: l.p, arrive }); boxes++; } });
    this.moneyChanged();
    this.notify(`Pedido: ${boxes} cajas (-${formatMoney(cost)}). Llegan a las ${TimeSystem.format(arrive)}.`, 'good');
    return true;
  }

  updateDeliveries() {
    const due = this.state.deliveries.filter((d) => d.arrive <= this.state.clock);
    if (!due.length) return;
    const z = this.map.zones.dock, occupied = (x, y) => this.boxes.some((b) => b.m.loc === 'floor' && b.m.tx === x && b.m.ty === y);
    const spots = [...this.map.deliverySpots];
    for (let y = z.y0; y <= z.y1; y++) for (let x = z.x0; x <= z.x1; x++) spots.push({ x, y });
    let arrived = 0;
    due.forEach((d) => {
      const s = spots.find((p) => !occupied(p.x, p.y));
      if (!s) return;
      const m = { id: nextBoxId(), p: d.p, qty: PRODUCT_BY_ID[d.p].boxUnits, open: false, loc: 'floor', tx: s.x, ty: s.y };
      this.state.boxes.push(m); this.boxes.push(new Box(this, m));
      this.state.deliveries.splice(this.state.deliveries.indexOf(d), 1);
      arrived++;
    });
    if (arrived) this.notify(`Ha llegado mercancía al muelle de carga (${arrived} cajas).`, 'good');
  }

  // ------------------------------------------------------------ turno, pausa y guardado
  onOpen() { this.notify('¡El supermercado abre! Llegan los primeros clientes.', 'good'); }

  onClose() {
    this.customers.dismissAll();
    this.frozen = true; this.player.stop(); this.player.sprite.anims.play(`owner_idle_${this.player.dir}`, true);
    const s = this.state.stats;
    this.saveGame(true);
    bus.emit('shiftEnd', {
      shift: this.state.shift, revenue: s.revenue, spent: s.spent, served: s.served, lost: s.lost,
      restocked: s.restocked, cleaned: s.cleaned, money: this.state.money,
      done: this.state.objectives.filter((o) => o.done).length, total: this.state.objectives.length,
    });
  }

  startNextShift() {
    nextShiftState(this.state);
    this.timeSys = new TimeSystem(this.state);
    this.customers.clear();
    this.frozen = false; this.lastMinute = -1;
    this.saveGame(true);
    bus.emit('objectives'); bus.emit('clock'); this.moneyChanged();
    this.notify(`Noche ${this.state.shift}: tienes media hora para preparar la tienda.`, 'info');
  }

  setPaused(v) {
    if (this.frozen || v === this.paused) return;
    this.paused = v;
    if (v) { this.physics.world.pause(); this.anims.pauseAll(); this.tweens.pauseAll(); this.player.stop(); }
    else { this.physics.world.resume(); this.anims.resumeAll(); this.tweens.resumeAll(); }
    bus.emit('pauseChanged', v);
  }

  saveGame(silent) {
    const p = this.player;
    this.state.player = { x: p.sprite.x, y: p.sprite.y, dir: p.dir };
    const ok = SaveSystem.save(this.state);
    if (!silent) this.notify(ok ? 'Partida guardada.' : 'No se pudo guardar (almacenamiento bloqueado).', ok ? 'good' : 'bad');
    return ok;
  }

  quitToMenu() {
    this.saveGame(true);
    if (this.paused) { this.anims.resumeAll(); }
    this.scene.stop('UI');
    this.scene.start('Menu');
  }

  // ------------------------------------------------------------ bucle
  update(time, delta) {
    const dt = Math.min(delta, 100) / 1000;
    const K = Phaser.Input.Keyboard;
    if (K.JustDown(this.keys.P)) this.setPaused(!this.paused);
    if (K.JustDown(this.keys.ESC)) { if (this.modal) bus.emit('closeModal'); else this.setPaused(!this.paused); }
    if (K.JustDown(this.keys.I)) bus.emit('toggleInventory');
    if (this.paused || this.frozen) return;

    // El reloj corre SIEMPRE aquí (con inventario/menús abiertos); solo la pausa lo detiene.
    this.timeSys.update(dt).forEach((e) => (e === 'open' ? this.onOpen() : this.onClose()));
    if (this.frozen) return;
    const sim = dt * this.timeSys.speed;

    this.player.update(this.keys, this.modal);
    if (this.modal) { if (this.interaction.sig) { this.interaction.sig = ''; bus.emit('prompt', null); } }
    else this.interaction.update(dt, this.keys);

    const canSpawn = this.timeSys.isOpen() && this.state.clock < TIME.CLOSE - 20;
    this.customers.update(sim, canSpawn);
    this.updateDoor();
    this.updateDeliveries();
    this.dirtT -= sim;
    if (this.dirtT <= 0) { this.dirtT = 35 + Math.random() * 45; this.randomDirt(); }

    this.saveT += dt;
    if (this.saveT >= AUTOSAVE_SECONDS) { this.saveT = 0; this.saveGame(true); }
    if (this.state.clock !== this.lastMinute) { this.lastMinute = this.state.clock; bus.emit('clock'); }
  }

  randomDirt() {
    const kinds = ['spill', 'trash', 'crumbs'];
    for (let i = 0; i < 20; i++) {
      const z = Math.random() < 0.8 ? this.map.zones.store : this.map.zones.bath;
      const tx = Phaser.Math.Between(z.x0, z.x1), ty = Phaser.Math.Between(z.y0, z.y1);
      if (this.spawnDirt(tx, ty, kinds[Phaser.Math.Between(0, 2)])) return;
    }
  }

  updateDoor() {
    const cx = (this.map.door.tx + 1) * 16, cy = this.map.door.ty * 16 + 8, f = this.player.feet;
    const want = Math.hypot(f.x - cx, f.y - cy) < 34 || this.customers.anyNear(cx, cy, 34);
    if (want === this.doorOpen) return;
    this.doorOpen = want;
    const d = this.map.door, off = want ? 14 : 0;
    this.tweens.add({ targets: this.doorL, x: d.tx * 16 - off, duration: 260, ease: 'Sine.inOut' });
    this.tweens.add({ targets: this.doorR, x: (d.tx + 1) * 16 + off, duration: 260, ease: 'Sine.inOut' });
  }
}
