import { MAP_W, MAP_H } from '../config.js';
import { PRODUCT_BY_ID } from '../data/products.js';
import { Customer } from '../entities/Customer.js';
import { findPath } from './Pathfinding.js';

const MAX_CUSTOMERS = 6;
const MAX_QUEUE = 3;
const PATIENCE = 75; // segundos de simulación esperando en caja
const INSIDE = { x: 18, y: 25 };
const EXIT = { x: 18, y: 28 };

// Decide qué hacen los clientes: entrar, coger productos, hacer cola, pagar y marcharse.
export class CustomerSystem {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
    this.spawnT = 8;
    this.regs = scene.map.registers.map((def) => ({ def, queue: [] }));
  }

  tileOf(c) { return { x: Math.floor(c.sprite.x / 16), y: Math.floor((c.sprite.y - 2) / 16) }; }

  route(c, goal) {
    const p = findPath(this.scene.blocked, MAP_W, MAP_H, this.tileOf(c), goal);
    if (!p) return false;
    c.path = p.map((t) => ({ x: t.x * 16 + 8, y: t.y * 16 + 14 }));
    return true;
  }

  update(dt, canSpawn) {
    if (canSpawn && this.list.length < MAX_CUSTOMERS) {
      this.spawnT -= dt;
      if (this.spawnT <= 0) { this.spawn(); this.spawnT = 16 + Math.random() * 26; }
    }
    this.list.forEach((c) => this.step(c, dt));
    this.list = this.list.filter((c) => { if (c.dead) { c.destroy(); return false; } return true; });
  }

  spawn() {
    const key = 'cust' + Phaser.Math.Between(0, 5);
    const c = new Customer(this.scene, key, EXIT.x + Phaser.Math.Between(0, 1), EXIT.y + 1);
    this.list.push(c);
    if (!this.route(c, INSIDE)) c.dead = true;
  }

  pickWishlist() {
    const slots = [...this.scene.slots.values()].filter((s) => s.qty() > 0);
    Phaser.Utils.Array.Shuffle(slots);
    const want = Phaser.Math.Between(1, 3), out = [], seen = new Set();
    for (const s of slots) {
      if (out.length >= want) break;
      if (seen.has(s.product())) continue;
      seen.add(s.product()); out.push(s.def.id);
    }
    return out;
  }

  step(c, dt) {
    c.move(dt);
    if (c.path.length) return;
    switch (c.state) {
      case 'entering':
        c.wish = this.pickWishlist();
        if (!c.wish.length) { this.scene.stats.lost++; this.scene.notify('Un cliente se ha ido: no hay productos en las estanterías.', 'warn'); return this.leave(c); }
        c.state = 'shop'; break;
      case 'shop': this.nextItem(c); break;
      case 'toSlot':
        c.face(c.target.def.face === 'W' ? 'right' : 'left');
        c.state = 'browse'; c.timer = 1 + Math.random() * 1.2; break;
      case 'browse':
        c.timer -= dt;
        if (c.timer <= 0) {
          const s = c.target, n = Math.min(s.qty(), Phaser.Math.Between(1, 2));
          if (n > 0) { c.basket.push({ p: s.product(), n }); s.set(s.product(), s.qty() - n); }
          c.state = 'shop';
        }
        break;
      case 'toQueue': c.state = 'waiting'; c.patience = PATIENCE; c.face('up'); break;
      case 'waiting':
        c.patience -= dt;
        if (c.patience <= 0) { this.scene.stats.lost++; this.scene.notify('Un cliente se cansó de esperar en caja y se fue.', 'warn'); this.leave(c); }
        break;
      case 'leaving': c.dead = true; break;
      default: break;
    }
  }

  nextItem(c) {
    while (c.wish.length) {
      const slot = this.scene.slots.get(c.wish.shift());
      if (slot.qty() > 0 && this.route(c, slot.def.stand)) { c.target = slot; c.state = 'toSlot'; return; }
    }
    if (!c.basket.length) { this.scene.stats.lost++; return this.leave(c); }
    this.goToQueue(c);
  }

  goToQueue(c) {
    const reg = [...this.regs].sort((a, b) => a.queue.length - b.queue.length)[0];
    if (reg.queue.length >= MAX_QUEUE) { this.scene.stats.lost++; this.scene.notify('Cola demasiado larga: un cliente se marcha.', 'warn'); return this.leave(c); }
    reg.queue.push(c); c.reg = reg;
    this.queueTo(c);
  }

  queueTo(c) {
    const i = c.reg.queue.indexOf(c), s = c.reg.def.spot;
    c.state = 'toQueue';
    if (!this.route(c, { x: s.x, y: s.y + i })) this.leave(c);
  }

  leave(c) {
    if (c.reg) { const q = c.reg.queue, r = c.reg; q.splice(q.indexOf(c), 1); c.reg = null; q.forEach((o) => this.queueTo(o)); void r; }
    c.state = 'leaving';
    if (!this.route(c, EXIT)) c.dead = true;
  }

  // Cliente listo para pagar en la caja idx (el primero de la cola y ya parado)
  waitingAt(idx) {
    const c = this.regs[idx].queue[0];
    return c && c.state === 'waiting' && !c.path.length ? c : null;
  }

  total(c) { return c.basket.reduce((t, b) => t + PRODUCT_BY_ID[b.p].sell * b.n, 0); }

  // El jugador cobra. Devuelve { total, units } o null.
  serve(idx) {
    const c = this.waitingAt(idx);
    if (!c) return null;
    const total = this.total(c), units = c.basket.reduce((t, b) => t + b.n, 0);
    const tile = this.tileOf(c);
    this.leave(c);
    if (Math.random() < 0.3) this.scene.spawnDirt(tile.x, tile.y + 1, 'trash');
    return { total, units };
  }

  dismissAll() { [...this.list].forEach((c) => { if (c.state !== 'leaving') this.leave(c); }); }
  clear() { this.list.forEach((c) => c.destroy()); this.list = []; this.regs.forEach((r) => { r.queue = []; }); }
  anyNear(x, y, d) { return this.list.some((c) => Math.hypot(c.sprite.x - x, c.sprite.y - 8 - y) < d); }
}
