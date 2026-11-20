import { PRODUCTS, PRODUCT_BY_ID, formatMoney } from '../data/products.js';
import { ORDER_DELAY_MIN } from '../config.js';
import { txt, panel, button, COL } from './theme.js';
import { bus } from '../systems/EventBus.js';

const pad = (s, n) => String(s).padEnd(n).slice(0, n);
const padL = (s, n) => String(s).padStart(n);

// ------------------------------------------------------------------ inventario (no bloquea el juego)
export function buildInventory(scene, gs) {
  const D = 40, objs = [];
  const add = (o) => { o.setDepth(D + 1); objs.push(o); return o; };
  objs.push(panel(scene, 190, 96, 900, 520, 0.95).setDepth(D));
  add(txt(scene, 640, 118, 'INVENTARIO', 18, COL.accent)).setOrigin(0.5, 0);
  add(txt(scene, 640, 146, 'El reloj sigue corriendo · pulsa I para cerrar', 9, COL.dim)).setOrigin(0.5, 0);
  const hands = add(txt(scene, 220, 176, '', 12));
  const table = add(txt(scene, 220, 222, '', 12, COL.text, { lineSpacing: 14 }));
  const foot = add(txt(scene, 220, 520, '', 10, COL.dim, { lineSpacing: 8 }));
  const head = `${pad('PRODUCTO', 17)}${pad('CATEG.', 10)}${padL('COMPRA', 7)}${padL('VENTA', 7)}${padL('CAJA', 5)}${padL('ESTANT.', 8)}${padL('ALMAC.', 7)}`;

  function refresh() {
    const s = gs.state, h = s.hands;
    hands.setText(
      h.kind === 'none' ? 'EN MANOS: nada'
        : h.kind === 'box' ? (() => { const b = s.boxes.find((x) => x.id === h.id); return `EN MANOS: caja de ${PRODUCT_BY_ID[b.p].name} x${b.qty}`; })()
          : `EN MANOS: ${PRODUCT_BY_ID[h.p].name} x${h.qty}`,
    );
    const lines = [head];
    let onShelf = 0, inBoxes = 0;
    PRODUCTS.forEach((p) => {
      const shelf = Object.values(s.shelves).filter((x) => x.p === p.id).reduce((t, x) => t + x.qty, 0);
      const boxes = s.boxes.filter((b) => b.p === p.id && b.loc !== 'hand').reduce((t, b) => t + b.qty, 0);
      onShelf += shelf; inBoxes += boxes;
      lines.push(`${pad(p.name, 17)}${pad(p.category, 10)}${padL(p.buy.toFixed(2).replace('.', ','), 7)}${padL(p.sell.toFixed(2).replace('.', ','), 7)}${padL(p.boxUnits, 5)}${padL(shelf, 8)}${padL(boxes, 7)}`);
    });
    table.setText(lines.join('\n'));
    const pend = s.deliveries.length;
    foot.setText(`Total en estantes: ${onShelf} uds · En cajas (almacén y suelo): ${inBoxes} uds · Pedidos en camino: ${pend} cajas\nPrecios en €. CAJA = unidades por caja. ALMAC. = unidades en cajas cerradas/abiertas.`);
  }
  refresh();
  const timer = scene.time.addEvent({ delay: 400, loop: true, callback: refresh });
  return { refresh, destroy() { timer.remove(); objs.forEach((o) => o.destroy()); } };
}

// ------------------------------------------------------------------ pedidos (modal; el reloj sigue)
export function buildOrders(scene, gs, onClose) {
  const D = 60, objs = [], qty = {};
  PRODUCTS.forEach((p) => { qty[p.id] = 0; });
  const add = (o) => { o.setDepth(D + 1); objs.push(o); return o; };
  const addBtn = (b) => { b.setDepth(D + 1); objs.push(b); return b; };
  objs.push(scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.55).setInteractive().setDepth(D - 1));
  objs.push(panel(scene, 240, 40, 800, 640, 0.97).setDepth(D));
  add(txt(scene, 640, 62, 'PEDIDOS AL PROVEEDOR', 18, COL.accent)).setOrigin(0.5, 0);
  add(txt(scene, 640, 92, `Entrega en ${ORDER_DELAY_MIN} min de juego en el muelle de carga · el reloj no se detiene`, 9, COL.dim)).setOrigin(0.5, 0);
  add(txt(scene, 270, 124, 'PRODUCTO', 10, COL.dim)); add(txt(scene, 520, 124, 'UDS/CAJA', 10, COL.dim));
  add(txt(scene, 650, 124, 'PRECIO CAJA', 10, COL.dim)); add(txt(scene, 850, 124, 'CAJAS', 10, COL.dim));
  const qtyTxt = {}, total = add(txt(scene, 270, 560, '', 14, COL.warn)), money = add(txt(scene, 270, 590, '', 11, COL.good));

  function recalc() {
    const cost = PRODUCTS.reduce((t, p) => t + p.buy * p.boxUnits * qty[p.id], 0);
    const boxes = PRODUCTS.reduce((t, p) => t + qty[p.id], 0);
    total.setText(`Total: ${formatMoney(cost)}  (${boxes} cajas)`).setColor(cost > gs.state.money ? COL.bad : COL.warn);
    money.setText(`Dinero disponible: ${formatMoney(gs.state.money)}`);
    PRODUCTS.forEach((p) => qtyTxt[p.id].setText(String(qty[p.id])));
  }
  PRODUCTS.forEach((p, i) => {
    const y = 156 + i * 38;
    add(scene.add.image(262, y + 2, 'icon_' + p.id).setOrigin(0, 0.5).setScale(2));
    add(txt(scene, 296, y - 6, p.name, 11));
    add(txt(scene, 530, y - 6, String(p.boxUnits), 11, COL.dim));
    add(txt(scene, 650, y - 6, formatMoney(p.buy * p.boxUnits), 11, COL.text));
    qtyTxt[p.id] = add(txt(scene, 902, y - 6, '0', 11, COL.warn)).setOrigin(0.5, 0);
    addBtn(button(scene, 850, y, 30, 26, '-', () => { qty[p.id] = Math.max(0, qty[p.id] - 1); recalc(); }, 12));
    addBtn(button(scene, 950, y, 30, 26, '+', () => { qty[p.id] = Math.min(9, qty[p.id] + 1); recalc(); }, 12));
  });
  addBtn(button(scene, 800, 620, 200, 44, 'PEDIR', () => {
    bus.emit('placeOrder', PRODUCTS.map((p) => ({ p: p.id, count: qty[p.id] })), (ok) => { if (ok) onClose(); else recalc(); });
  }, 14));
  addBtn(button(scene, 960, 620, 150, 44, 'CERRAR', onClose, 14));
  recalc();
  const timer = scene.time.addEvent({ delay: 500, loop: true, callback: recalc });
  return { destroy() { timer.remove(); objs.forEach((o) => o.destroy()); } };
}
