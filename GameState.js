import { TIME, START_MONEY } from '../config.js';

// Modelo de datos puro (serializable). Las escenas lo leen/escriben y los sprites lo reflejan.
export const OBJECTIVE_DEFS = [
  { id: 'restock', label: 'Reponer estantes', target: 24, reward: 20 },
  { id: 'serve',   label: 'Atender clientes',               target: 8,  reward: 25 },
  { id: 'clean',   label: 'Limpiar suciedad',               target: 3,  reward: 15 },
  { id: 'sales',   label: 'Vender (€)',                     target: 60, reward: 30 },
];

export function newObjectives() {
  return OBJECTIVE_DEFS.map((d) => ({ id: d.id, progress: 0, done: false }));
}

let boxCounter = 1;
export function nextBoxId() { return 'b' + boxCounter++; }
export function syncBoxCounter(boxes) {
  boxCounter = boxes.reduce((m, b) => Math.max(m, parseInt(b.id.slice(1), 10) || 0), 0) + 1;
}

export function newState() {
  return {
    shift: 1,
    clock: TIME.PREP_START,
    money: START_MONEY,
    stats: { served: 0, lost: 0, revenue: 0, spent: 0, restocked: 0, cleaned: 0 },
    objectives: newObjectives(),
    // cajas: loc = 'floor' (tx,ty) | 'rack' (slot) | 'hand'
    boxes: [
      { id: 'b1', p: 'milk',   qty: 12, open: false, loc: 'rack', slot: 'R0' },
      { id: 'b2', p: 'cola',   qty: 12, open: false, loc: 'rack', slot: 'R1' },
      { id: 'b3', p: 'bread',  qty: 8,  open: false, loc: 'rack', slot: 'R2' },
      { id: 'b4', p: 'cereal', qty: 10, open: false, loc: 'rack', slot: 'R8' },
      { id: 'b5', p: 'pasta',  qty: 12, open: false, loc: 'rack', slot: 'R9' },
      { id: 'b6', p: 'chips',  qty: 10, open: false, loc: 'rack', slot: 'R10' },
      { id: 'b7', p: 'yogurt', qty: 12, open: false, loc: 'floor', tx: 31, ty: 4 },
      { id: 'b8', p: 'cookies', qty: 12, open: false, loc: 'floor', tx: 33, ty: 4 },
      { id: 'b9', p: 'tp',     qty: 12, open: false, loc: 'floor', tx: 35, ty: 4 },
    ],
    // estanterías: id -> { p: productId, qty }
    shelves: {
      G0L0: { p: 'pasta', qty: 3 }, G0R0: { p: 'cereal', qty: 2 }, G1L0: { p: 'chips', qty: 4 },
      G1R0: { p: 'cookies', qty: 3 }, G2L0: { p: 'bread', qty: 2 }, G2R0: { p: 'tp', qty: 3 },
      F00: { p: 'cola', qty: 4 }, F01: { p: 'milk', qty: 3 }, F10: { p: 'juice', qty: 3 },
    },
    dirt: [],        // { tx, ty, kind }
    deliveries: [],  // { p, arrive } (arrive = clock en el que llega)
    hands: { kind: 'none' }, // none | box {id} | items {p, qty}
    player: null,    // { x, y, dir }
  };
}

// Reinicia para la siguiente noche conservando dinero, cajas y estanterías.
export function nextShiftState(state) {
  state.shift += 1;
  state.clock = TIME.PREP_START;
  state.stats = { served: 0, lost: 0, revenue: 0, spent: 0, restocked: 0, cleaned: 0 };
  state.objectives = newObjectives();
  return state;
}
