import { HAND_CAP, SLOT_CAP } from '../config.js';
import { PRODUCT_BY_ID, formatMoney } from '../data/products.js';

// Acciones del jugador sobre el mundo. Modifican el MODELO (state) y refrescan sprites.
export const boxAt = (s, tx, ty) => s.boxes.find((b) => b.m.loc === 'floor' && b.m.tx === tx && b.m.ty === ty);
export const rackBox = (s, id) => s.boxes.find((b) => b.m.loc === 'rack' && b.m.slot === id);
export const handBox = (s) => (s.state.hands.kind === 'box' ? s.boxes.find((b) => b.m.id === s.state.hands.id) : null);

export function setHands(s, hands) { s.state.hands = hands; s.handsChanged(); }

export function aheadTile(s) {
  const f = s.player.feet, v = s.player.vec();
  return { tx: Math.floor((f.x + v[0] * 12) / 16), ty: Math.floor((f.y + v[1] * 12) / 16) };
}

function freeTile(s, tx, ty) {
  return tx >= 0 && ty >= 0 && tx < 40 && ty < 30 && !s.blocked[ty][tx] && !boxAt(s, tx, ty);
}

export function pickBox(s, box) {
  box.m.loc = 'hand'; delete box.m.tx; delete box.m.ty; delete box.m.slot;
  box.refresh();
  setHands(s, { kind: 'box', id: box.m.id });
}

// Suelta la caja que lleva en el tile de delante (opcionalmente ya abierta)
export function dropBox(s, open = false) {
  const box = handBox(s);
  if (!box) return false;
  const { tx, ty } = aheadTile(s);
  if (!freeTile(s, tx, ty)) { s.notify('No hay sitio libre delante para dejar la caja.', 'warn'); return false; }
  box.m.loc = 'floor'; box.m.tx = tx; box.m.ty = ty;
  if (open) box.m.open = true;
  box.refresh();
  setHands(s, { kind: 'none' });
  if (open) s.notify(`Caja abierta: ${PRODUCT_BY_ID[box.m.p].name} x${box.m.qty}`, 'info');
  return true;
}

export function openBox(s, box) {
  box.m.open = true; box.refresh();
  s.notify(`Caja abierta: ${PRODUCT_BY_ID[box.m.p].name} x${box.m.qty}`, 'info');
}

export function storeBox(s, rack) {
  const box = handBox(s);
  if (!box || rackBox(s, rack.id)) return;
  if (box.m.open) { s.notify('Las cajas abiertas no se guardan en el almacén.', 'warn'); return; }
  box.m.loc = 'rack'; box.m.slot = rack.id; box.refresh();
  setHands(s, { kind: 'none' });
  s.notify('Caja guardada en el almacén.', 'good');
}

export function takeFromRack(s, rack) {
  const box = rackBox(s, rack.id);
  if (box && s.state.hands.kind === 'none') pickBox(s, box);
}

// Coge UN producto de una caja abierta del suelo
export function takeProduct(s, box) {
  const h = s.state.hands;
  if (h.kind === 'none') setHands(s, { kind: 'items', p: box.m.p, qty: 1 });
  else if (h.kind === 'items' && h.p === box.m.p && h.qty < HAND_CAP) setHands(s, { kind: 'items', p: h.p, qty: h.qty + 1 });
  else return false;
  box.m.qty -= 1;
  if (box.m.qty <= 0) {
    s.removeBox(box);
    s.notify('Caja vacía: se ha plegado.', 'info');
  }
  return true;
}

export function returnToBox(s, box) {
  const h = s.state.hands;
  if (h.kind !== 'items' || h.p !== box.m.p || !box.m.open) return false;
  box.m.qty += h.qty;
  setHands(s, { kind: 'none' });
  return true;
}

export function slotCheck(s, slot) {
  const h = s.state.hands;
  if (h.kind !== 'items') return { ok: false, why: 'Necesitas productos en las manos.' };
  const prod = PRODUCT_BY_ID[h.p];
  if (slot.def.cold !== prod.cold) return { ok: false, why: prod.cold ? 'Ese producto necesita nevera.' : 'Las neveras son solo para frescos.' };
  if (slot.qty() > 0 && slot.product() !== h.p) return { ok: false, why: 'Ese hueco tiene otro producto.' };
  if (slot.qty() >= SLOT_CAP) return { ok: false, why: 'Hueco lleno.' };
  return { ok: true };
}

export function putProducts(s, slot) {
  const h = s.state.hands;
  const chk = slotCheck(s, slot);
  if (!chk.ok) { s.notify(chk.why, 'warn'); return false; }
  const n = Math.min(SLOT_CAP - slot.qty(), h.qty);
  slot.set(h.p, slot.qty() + n);
  setHands(s, h.qty - n > 0 ? { kind: 'items', p: h.p, qty: h.qty - n } : { kind: 'none' });
  s.state.stats.restocked += n;
  s.addProgress('restock', n);
  return true;
}

export function takeFromShelf(s, slot) {
  const h = s.state.hands;
  if (slot.qty() <= 0) return false;
  if (h.kind === 'none') {
    const n = Math.min(HAND_CAP, slot.qty());
    setHands(s, { kind: 'items', p: slot.product(), qty: n });
    slot.set(slot.product(), slot.qty() - n);
  } else if (h.kind === 'items' && h.p === slot.product() && h.qty < HAND_CAP) {
    setHands(s, { kind: 'items', p: h.p, qty: h.qty + 1 });
    slot.set(h.p, slot.qty() - 1);
  } else return false;
  return true;
}

export function cleanDirt(s, d) {
  s.removeDirt(d);
  s.state.stats.cleaned += 1;
  s.addProgress('clean', 1);
  s.notify('Suciedad limpiada.', 'good');
}

export function chargeRegister(s, idx) {
  const res = s.customers.serve(idx);
  if (!res) { s.notify('Nadie esperando para pagar en esta caja.', 'info'); return; }
  s.state.money += res.total;
  s.state.stats.served += 1;
  s.state.stats.revenue += res.total;
  s.addProgress('serve', 1);
  s.addProgress('sales', res.total);
  s.notify(`Venta: ${res.units} productos · +${formatMoney(res.total)}`, 'good');
  s.moneyChanged();
}
