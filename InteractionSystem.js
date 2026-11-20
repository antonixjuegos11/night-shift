import { PRODUCT_BY_ID, formatMoney } from '../data/products.js';
import { bus } from './EventBus.js';
import * as A from './Actions.js';

const CLEAN_TIME = 1.2;   // segundos manteniendo E
const REPEAT = 0.14;      // repetición al mantener E

const dist = (p, r) => Math.hypot(Math.max(r.x - p.x, 0, p.x - (r.x + r.w)), Math.max(r.y - p.y, 0, p.y - (r.y + r.h)));
const tileRect = (tx, ty) => ({ x: tx * 16, y: ty * 16, w: 16, h: 16 });

// Busca el objeto al que mira el jugador y resuelve E / Q / R según lo que lleve en las manos.
export class InteractionSystem {
  constructor(scene) {
    this.scene = scene;
    this.target = null;
    this.rep = 0;
    this.clean = 0;
    this.lastKey = '';
  }

  candidates() {
    const s = this.scene, out = [];
    s.boxes.forEach((b) => { if (b.m.loc === 'floor') out.push({ kind: 'floorBox', rect: tileRect(b.m.tx, b.m.ty), ref: b }); });
    s.map.rackSlots.forEach((r) => out.push({ kind: 'rack', rect: tileRect(r.tx, r.ty), ref: r }));
    s.slots.forEach((sl) => out.push({ kind: 'shelf', rect: sl.rect, ref: sl }));
    s.map.registers.forEach((r, i) => out.push({ kind: 'register', rect: { x: r.tx * 16, y: r.ty * 16, w: r.tw * 16, h: 16 }, ref: i }));
    const c = s.map.computer;
    out.push({ kind: 'computer', rect: { x: c.tx * 16, y: c.ty * 16, w: c.tw * 16, h: 16 }, ref: c });
    s.dirts.forEach((d) => out.push({ kind: 'dirt', rect: { x: d.m.tx * 16 + 2, y: d.m.ty * 16 + 2, w: 12, h: 12 }, ref: d }));
    return out;
  }

  best() {
    const p = this.scene.player.probe(10), f = this.scene.player.feet;
    let best = null, bd = 7;
    this.candidates().forEach((c) => {
      let d = dist(p, c.rect);
      if (c.kind === 'dirt') d = Math.min(d, dist(f, c.rect) + 3);
      if (d < bd) { bd = d; best = c; }
    });
    return best;
  }

  // Qué se puede hacer con este objetivo ahora mismo
  describe(t) {
    const s = this.scene, h = s.state.hands;
    switch (t.kind) {
      case 'floorBox': {
        const m = t.ref.m, name = PRODUCT_BY_ID[m.p].name;
        if (!m.open) return h.kind === 'none'
          ? { text: `[E] Recoger caja de ${name}   [R] Abrir`, ok: true }
          : { text: `Caja de ${name}`, ok: false, why: 'Tienes las manos ocupadas.' };
        if (h.kind === 'none' || (h.kind === 'items' && h.p === m.p)) return { text: `[E] Coger ${name} (${m.qty} en caja)`, ok: true, hold: true };
        return { text: `Caja abierta de ${name}`, ok: false, why: 'Tienes las manos ocupadas con otra cosa.' };
      }
      case 'rack': {
        const b = A.rackBox(s, t.ref.id);
        if (b) return h.kind === 'none' ? { text: `[E] Coger caja de ${PRODUCT_BY_ID[b.m.p].name}`, ok: true } : { text: 'Estante ocupado', ok: false, why: 'Hueco de almacén ocupado.' };
        return h.kind === 'box' ? { text: '[E] Guardar caja en el almacén', ok: true } : { text: 'Hueco de almacén libre', ok: false, why: 'Aquí se guardan cajas cerradas.' };
      }
      case 'shelf': {
        const sl = t.ref, p = sl.product(), name = p ? PRODUCT_BY_ID[p].name : 'vacío';
        if (h.kind === 'items') {
          const chk = A.slotCheck(s, sl);
          return chk.ok ? { text: `[E] Reponer ${PRODUCT_BY_ID[h.p].name} (${sl.qty()}/8)`, ok: true, hold: true } : { text: `Estante: ${name}`, ok: false, why: chk.why };
        }
        if (h.kind === 'box') return { text: `Estante: ${name}`, ok: false, why: 'Abre la caja (R) y coge los productos con E.' };
        return sl.qty() > 0 ? { text: `[E] Retirar ${name} (${sl.qty()})`, ok: true, hold: true } : { text: 'Estante vacío', ok: false, why: 'Trae productos de una caja abierta.' };
      }
      case 'register': {
        const c = s.customers.waitingAt(t.ref);
        return c ? { text: `[E] Cobrar ${formatMoney(s.customers.total(c))}`, ok: true } : { text: 'Caja registradora (sin clientes)', ok: false, why: 'No hay ningún cliente esperando aquí.' };
      }
      case 'computer': return { text: '[E] Usar el ordenador (pedidos)', ok: true };
      case 'dirt': return h.kind === 'none'
        ? { text: 'Mantén [E] para limpiar', ok: true, hold: true, clean: true }
        : { text: 'Suciedad', ok: false, why: 'Deja lo que llevas para limpiar.' };
      default: return null;
    }
  }

  use(t) {
    const s = this.scene;
    switch (t.kind) {
      case 'floorBox': t.ref.m.open ? A.takeProduct(s, t.ref) : A.pickBox(s, t.ref); break;
      case 'rack': s.state.hands.kind === 'box' ? A.storeBox(s, t.ref) : A.takeFromRack(s, t.ref); break;
      case 'shelf': s.state.hands.kind === 'items' ? A.putProducts(s, t.ref) : A.takeFromShelf(s, t.ref); break;
      case 'register': A.chargeRegister(s, t.ref); break;
      case 'computer': bus.emit('openOrders'); break;
      default: break;
    }
  }

  update(dt, keys) {
    const s = this.scene, h = s.state.hands;
    const t = this.best();
    const d = t ? this.describe(t) : null;
    const key = t ? `${t.kind}:${t.rect.x}:${t.rect.y}` : '';
    if (key !== this.lastKey) { this.clean = 0; this.rep = 0; this.lastKey = key; }

    const E = keys.E;
    if (d) {
      if (Phaser.Input.Keyboard.JustDown(E)) {
        if (!d.ok) s.notify(d.why, 'warn');
        else if (!d.clean) this.use(t);
      } else if (E.isDown && d.ok) {
        if (d.clean) {
          this.clean += dt;
          if (this.clean >= CLEAN_TIME) { this.clean = 0; A.cleanDirt(s, t.ref); }
        } else if (d.hold) {
          this.rep += dt;
          if (this.rep >= REPEAT) { this.rep = 0; this.use(t); }
        }
      } else { this.clean = 0; this.rep = 0; }
    } else Phaser.Input.Keyboard.JustDown(E); // consume

    if (Phaser.Input.Keyboard.JustDown(keys.Q)) this.onQ(t);
    if (Phaser.Input.Keyboard.JustDown(keys.R)) this.onR(t);

    let prompt = d ? { text: d.text, ok: d.ok, progress: d.clean ? this.clean / CLEAN_TIME : 0 } : null;
    if (!prompt && h.kind === 'box') prompt = { text: '[Q] Soltar caja   [R] Soltar y abrir', ok: true, progress: 0 };
    if (!prompt && h.kind === 'items') prompt = { text: 'Llévalos a una estantería y pulsa [E]', ok: true, progress: 0 };
    const sig = prompt ? `${prompt.text}|${prompt.ok}|${Math.round(prompt.progress * 20)}` : '';
    if (sig !== this.sig) { this.sig = sig; bus.emit('prompt', prompt); }
  }

  onQ(t) {
    const s = this.scene, h = s.state.hands;
    if (h.kind === 'box') {
      if (t && t.kind === 'rack' && !A.rackBox(s, t.ref.id)) A.storeBox(s, t.ref);
      else A.dropBox(s, false);
    } else if (h.kind === 'items') {
      if (t && t.kind === 'floorBox' && t.ref.m.open && A.returnToBox(s, t.ref)) s.notify('Productos devueltos a la caja.', 'info');
      else s.notify('Deja los productos en una estantería (E) o devuélvelos a su caja abierta (Q).', 'info');
    }
  }

  onR(t) {
    const s = this.scene, h = s.state.hands;
    if (h.kind === 'box') A.dropBox(s, true);
    else if (h.kind === 'none' && t && t.kind === 'floorBox' && !t.ref.m.open) A.openBox(s, t.ref);
    else s.notify('No hay ninguna caja que abrir.', 'info');
  }
}
