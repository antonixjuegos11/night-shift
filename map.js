import { MAP_W, MAP_H } from '../config.js';

// Tipos de suelo/tile
export const T = { WALL: 1, STORE: 2, BACK: 3, OFFICE: 4, BATH: 5, DOCK: 6, STREET: 7, SIDEWALK: 8, HAZARD: 9 };

const GONDOLA_X = [8, 13, 18, 23]; // 4 góndolas -> pasillos de estanterías entre ellas
const GONDOLA_Y = 13;              // 4 huecos de 2 tiles de alto por cara

// Construye todo el layout del supermercado a partir de coordenadas en tiles.
export function buildMap() {
  const grid = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(T.STREET));
  const fill = (x0, y0, x1, y1, t) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y][x] = t;
  };
  fill(0, 0, MAP_W - 1, 27, T.SIDEWALK);
  fill(1, 1, 38, 26, T.WALL);
  fill(2, 11, 37, 25, T.STORE);
  fill(2, 2, 13, 9, T.BACK);      // almacén
  fill(15, 2, 21, 9, T.OFFICE);   // oficina
  fill(23, 2, 28, 9, T.BATH);     // baño
  fill(30, 2, 37, 9, T.DOCK);     // zona de carga
  fill(37, 3, 37, 8, T.HAZARD);
  fill(7, 10, 8, 10, T.BACK);     // puertas interiores
  fill(17, 10, 18, 10, T.OFFICE);
  fill(25, 10, 26, 10, T.BATH);
  fill(33, 10, 34, 10, T.DOCK);
  fill(18, 26, 19, 26, T.STORE);  // entrada principal (puerta automática)

  const shelfSlots = [];
  GONDOLA_X.forEach((gx, g) => {
    for (let i = 0; i < 4; i++) {
      const ty = GONDOLA_Y + i * 2;
      shelfSlots.push({ id: `G${g}L${i}`, kind: 'shelf', cold: false, tx: gx, ty, tw: 1, th: 2, face: 'W', stand: { x: gx - 1, y: ty } });
      shelfSlots.push({ id: `G${g}R${i}`, kind: 'shelf', cold: false, tx: gx + 1, ty, tw: 1, th: 2, face: 'E', stand: { x: gx + 2, y: ty } });
    }
  });
  const fridges = [{ id: 'F0', tx: 2, ty: 12 }, { id: 'F1', tx: 2, ty: 16 }];
  fridges.forEach((f) => {
    for (let i = 0; i < 3; i++) {
      shelfSlots.push({ id: `${f.id}${i}`, kind: 'fridge', cold: true, tx: f.tx, ty: f.ty + i, tw: 2, th: 1, face: 'E', stand: { x: 4, y: f.ty + i } });
    }
  });

  const rackSlots = [];
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 8; i++) rackSlots.push({ id: `R${row * 8 + i}`, tx: 2 + i, ty: row === 0 ? 2 : 5 });
  }

  const registers = [
    { id: 'C0', tx: 27, ty: 22, tw: 3, spot: { x: 28, y: 23 } },
    { id: 'C1', tx: 32, ty: 22, tw: 3, spot: { x: 33, y: 23 } },
  ];

  const deliverySpots = [];
  for (const ty of [4, 6]) for (const tx of [31, 33, 35]) deliverySpots.push({ x: tx, y: ty });

  // props: key = textura; solid = bloquea al jugador y clientes
  const props = [
    { key: 'mat', tx: 18, ty: 25, solid: false, floor: true },
    { key: 'register', tx: 27, ty: 22, solid: true },
    { key: 'register', tx: 32, ty: 22, solid: true },
    { key: 'plant', tx: 3, ty: 24, solid: true },
    { key: 'plant', tx: 36, ty: 24, solid: true },
    { key: 'plant', tx: 36, ty: 11, solid: true },
    { key: 'bin', tx: 25, ty: 24, solid: true },
    { key: 'poster', tx: 10, ty: 10, solid: false, wall: true },
    { key: 'poster2', tx: 20, ty: 10, solid: false, wall: true },
    { key: 'clock', tx: 22, ty: 10, solid: false, wall: true },
    { key: 'poster', tx: 31, ty: 10, solid: false, wall: true },
    // almacén
    { key: 'crates', tx: 11, ty: 7, solid: true },
    // oficina
    { key: 'rug', tx: 16, ty: 5, solid: false, floor: true },
    { key: 'desk', tx: 17, ty: 3, solid: true },
    { key: 'chair', tx: 18, ty: 2, solid: false },
    { key: 'cabinet', tx: 21, ty: 2, solid: true },
    { key: 'plant', tx: 15, ty: 2, solid: true },
    // baño
    { key: 'toilet', tx: 23, ty: 2, solid: true },
    { key: 'toilet', tx: 25, ty: 2, solid: true },
    { key: 'sink', tx: 27, ty: 2, solid: true },
    { key: 'sink', tx: 28, ty: 2, solid: true },
    { key: 'bin', tx: 28, ty: 8, solid: true },
    { key: 'bucket', tx: 23, ty: 8, solid: true },
    // zona de carga
    { key: 'shutter', tx: 38, ty: 4, solid: false, wall: true },
    ...deliverySpots.map((s) => ({ key: 'pallet', tx: s.x, ty: s.y, solid: false, floor: true })),
    // exterior
    { key: 'streetlamp', tx: 11, ty: 27, solid: true },
    { key: 'streetlamp', tx: 27, ty: 27, solid: true },
  ];

  // lámparas de techo: x,y en px, radio, intensidad, tono (0 cálido, 1 frío)
  const lamps = [];
  for (const x of [5, 11, 17, 23, 29, 35]) for (const y of [12, 18, 23]) lamps.push({ x: x * 16 + 8, y: y * 16, r: 78, a: 0.9, tone: 0 });
  lamps.push({ x: 5 * 16, y: 4 * 16, r: 80, a: 0.75, tone: 1 }, { x: 11 * 16, y: 7 * 16, r: 80, a: 0.75, tone: 1 });
  lamps.push({ x: 18 * 16 + 8, y: 5 * 16, r: 70, a: 0.95, tone: 0 }); // oficina cálida
  lamps.push({ x: 25 * 16 + 8, y: 5 * 16, r: 70, a: 0.8, tone: 1 });
  lamps.push({ x: 33 * 16, y: 5 * 16, r: 85, a: 0.8, tone: 1 });
  lamps.push({ x: 18 * 16 + 8, y: 27 * 16, r: 90, a: 0.55, tone: 0 }); // luz que sale por la puerta
  lamps.push({ x: 11 * 16 + 8, y: 27 * 16 - 8, r: 60, a: 0.5, tone: 0 }, { x: 27 * 16 + 8, y: 27 * 16 - 8, r: 60, a: 0.5, tone: 0 });

  return {
    grid, shelfSlots, rackSlots, registers, deliverySpots, props, lamps,
    computer: { tx: 17, ty: 3, tw: 3, th: 1 },
    door: { tx: 18, ty: 26, tw: 2 },
    playerSpawn: { x: 21 * 16, y: 23 * 16 },
    streetSpawn: { x: 18, y: 28 },
    zones: {
      store: { x0: 2, y0: 11, x1: 37, y1: 25 },
      bath: { x0: 23, y0: 2, x1: 28, y1: 9 },
      dock: { x0: 31, y0: 3, x1: 36, y1: 8 },
    },
  };
}

// Huella en tiles de cada prop. La textura se ancla abajo-izquierda de la huella
// y puede sobresalir hacia arriba (plantas, mesas, farolas...).
export const PROP_FOOT = {
  mat: { w: 2, h: 1 }, register: { w: 3, h: 1 }, plant: { w: 1, h: 1 }, bin: { w: 1, h: 1 },
  poster: { w: 1, h: 1 }, poster2: { w: 1, h: 1 }, clock: { w: 1, h: 1 }, crates: { w: 2, h: 2 },
  rug: { w: 5, h: 3 }, desk: { w: 3, h: 1 }, chair: { w: 1, h: 1 }, cabinet: { w: 1, h: 2 },
  toilet: { w: 1, h: 1 }, sink: { w: 1, h: 1 }, bucket: { w: 1, h: 1 }, shutter: { w: 1, h: 4 },
  pallet: { w: 1, h: 1 }, streetlamp: { w: 1, h: 1 },
};

// Rectángulos de colisión (en tiles) a partir de muros, props sólidos, estanterías y racks.
export function buildCollisionRects(map, propSize = (k) => PROP_FOOT[k]) {
  const rects = [];
  const { grid } = map;
  for (let y = 0; y < MAP_H; y++) {
    let x = 0;
    while (x < MAP_W) {
      if (grid[y][x] === T.WALL) {
        const x0 = x;
        while (x < MAP_W && grid[y][x] === T.WALL) x++;
        rects.push({ x: x0, y, w: x - x0, h: 1 });
      } else x++;
    }
  }
  map.props.forEach((p) => {
    if (!p.solid) return;
    const s = propSize(p.key);
    rects.push({ x: p.tx, y: p.ty, w: s.w, h: s.h });
  });
  map.shelfSlots.forEach((s) => rects.push({ x: s.tx, y: s.ty, w: s.tw, h: s.th }));
  map.rackSlots.forEach((r) => rects.push({ x: r.tx, y: r.ty, w: 1, h: 1 }));
  return rects;
}

// Rejilla de bloqueo (true = no transitable) para clientes.
export function buildBlockedGrid(rects) {
  const b = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));
  rects.forEach((r) => {
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (b[y] && x < MAP_W) b[y][x] = true;
  });
  return b;
}
