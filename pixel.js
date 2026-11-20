// Utilidades de pixel art + personajes, iconos de producto y cajas.
// No depende de Phaser: devuelve <canvas>, que BootScene registra como texturas.

export function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return {
    c, g,
    r(col, x, y, ww, hh) { g.fillStyle = col; g.fillRect(x, y, ww, hh); },
    p(col, x, y) { g.fillStyle = col; g.fillRect(x, y, 1, 1); },
  };
}

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, v + amt));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

// ---------------------------------------------------------------- personajes
export const OWNER_PAL = { skin: '#e8b88a', hair: '#3a2a20', shirt: '#e9e6dc', apron: '#2f6b4f', pants: '#38405f', shoes: '#26211f' };
export const CUSTOMER_PALS = [
  { skin: '#f0c9a0', hair: '#c9a24a', shirt: '#c0504d', pants: '#44546a', shoes: '#2a2a2e' },
  { skin: '#b9825a', hair: '#1e1612', shirt: '#4b8bbe', pants: '#3b3b44', shoes: '#e4e4e4' },
  { skin: '#e8b88a', hair: '#7a3b22', shirt: '#6aa84f', pants: '#5a4a3a', shoes: '#2a2a2e' },
  { skin: '#8d5a3b', hair: '#101010', shirt: '#e0a030', pants: '#2c3e50', shoes: '#3a2a20' },
  { skin: '#f3d3b0', hair: '#b0b0b8', shirt: '#9b6bb5', pants: '#56606e', shoes: '#4a3a30' },
  { skin: '#d9a47a', hair: '#4a2c1a', shirt: '#3fa9a0', pants: '#7a6a52', shoes: '#262626' },
];

const EYE = '#1d1620';

function drawChar(d, dir, f, pal) {
  const walk = f >= 2, ph = f - 2;
  const hd = (f === 1 || (walk && ph % 2 === 1)) ? 1 : 0; // cabeceo
  const lift = walk ? (ph === 1 ? 'a' : ph === 3 ? 'b' : '') : '';
  const armA = walk ? (ph === 1 ? 1 : ph === 3 ? -1 : 0) : (f === 1 ? 1 : 0);
  const skinD = shade(pal.skin, -28), shirtD = shade(pal.shirt, -34), pantsD = shade(pal.pants, -22);
  d.r('rgba(0,0,0,0.28)', 3, 22, 10, 2); // sombra

  if (dir === 'down' || dir === 'up') {
    const legs = (x, side) => {
      const l = lift === side ? 1 : 0;
      d.r(pal.pants, x, 17, 3, 5 - l); d.r(pantsD, x + 2, 17, 1, 5 - l);
      d.r(pal.shoes, x, 22 - l, 3, 2);
    };
    legs(5, 'a'); legs(8, 'b');
    // brazos (detrás del torso para up)
    const arms = () => {
      d.r(pal.shirt, 2, 10 + armA, 2, 5); d.r(shirtD, 2, 10 + armA, 1, 5); d.r(pal.skin, 2, 15 + armA, 2, 2);
      d.r(pal.shirt, 12, 10 - armA, 2, 5); d.r(shirtD, 13, 10 - armA, 1, 5); d.r(pal.skin, 12, 15 - armA, 2, 2);
    };
    arms();
    d.r(pal.shirt, 4, 10, 8, 7); d.r(shirtD, 4, 16, 8, 1);
    if (dir === 'down') {
      if (pal.apron) {
        d.r(pal.apron, 5, 11, 6, 6); d.r(shade(pal.apron, 22), 5, 11, 6, 1);
        d.r(shade(pal.apron, -25), 5, 16, 6, 1); d.r(shade(pal.apron, 30), 6, 13, 2, 2);
        d.r(pal.apron, 5, 10, 1, 1); d.r(pal.apron, 10, 10, 1, 1);
      } else { d.r(shade(pal.shirt, 22), 5, 11, 6, 1); d.r(shirtD, 7, 12, 2, 4); }
      d.r(pal.skin, 7, 10, 2, 1);
      d.r(pal.skin, 4, 3 + hd, 8, 7); d.r(skinD, 4, 9 + hd, 8, 1);
      d.r(pal.hair, 4, 2 + hd, 8, 3); d.r(pal.hair, 3, 3 + hd, 1, 4); d.r(pal.hair, 12, 3 + hd, 1, 4);
      d.r(shade(pal.hair, 30), 6, 2 + hd, 3, 1);
      d.p(EYE, 6, 6 + hd); d.p(EYE, 9, 6 + hd); d.p('#d98f7a', 7, 8 + hd); d.p('#d98f7a', 8, 8 + hd);
    } else {
      if (pal.apron) { d.r(pal.apron, 4, 13, 8, 1); d.r(pal.apron, 7, 14, 2, 3); }
      d.r(pal.skin, 7, 10, 2, 1);
      d.r(pal.skin, 4, 8 + hd, 8, 2);
      d.r(pal.hair, 4, 2 + hd, 8, 7); d.r(pal.hair, 3, 3 + hd, 1, 5); d.r(pal.hair, 12, 3 + hd, 1, 5);
      d.r(shade(pal.hair, 24), 6, 3 + hd, 4, 1); d.r(shade(pal.hair, -20), 4, 8 + hd, 8, 1);
    }
  } else { // 'right' (la izquierda se obtiene espejando)
    const front = ph === 1 ? 2 : ph === 3 ? -2 : 0;
    const leg = (x, shoeX) => { d.r(pal.pants, x, 17, 3, 5); d.r(pantsD, x, 17, 1, 5); d.r(pal.shoes, shoeX, 22, 4, 2); };
    if (walk && front !== 0) { leg(6 - front, 6 - front); leg(7 + front, 7 + front); } else { leg(6, 6); leg(8, 8); }
    d.r(pal.shirt, 5, 10, 6, 7); d.r(shirtD, 5, 16, 6, 1);
    if (pal.apron) { d.r(pal.apron, 8, 11, 3, 6); d.r(shade(pal.apron, 22), 8, 11, 3, 1); d.r(pal.apron, 5, 13, 3, 1); }
    d.r(pal.skin, 6, 3 + hd, 6, 7); d.r(skinD, 6, 9 + hd, 6, 1);
    d.r(pal.hair, 5, 2 + hd, 7, 3); d.r(pal.hair, 5, 4 + hd, 3, 4); d.r(shade(pal.hair, 30), 7, 2 + hd, 3, 1);
    d.p(EYE, 10, 6 + hd); d.p('#d98f7a', 11, 8 + hd); d.p(skinD, 12, 6 + hd);
    const ax = walk ? (ph === 1 ? 2 : ph === 3 ? -2 : 0) : 0;
    d.r(pal.shirt, 6 + ax, 10, 3, 5); d.r(shirtD, 6 + ax, 10, 1, 5); d.r(pal.skin, 6 + ax, 15, 3, 2);
  }
}

// Hoja 96x96: columnas = idle0, idle1, walk0..3; filas = down, up, left, right.
export const CHAR_DIRS = ['down', 'up', 'left', 'right'];
export function makeCharSheet(pal) {
  const sheet = mk(16 * 6, 24 * 4);
  CHAR_DIRS.forEach((dir, row) => {
    for (let f = 0; f < 6; f++) {
      const t = mk(16, 24);
      drawChar(t, dir === 'left' ? 'right' : dir, f, pal);
      const x = f * 16, y = row * 24;
      if (dir === 'left') {
        sheet.g.save(); sheet.g.translate(x + 16, y); sheet.g.scale(-1, 1); sheet.g.drawImage(t.c, 0, 0); sheet.g.restore();
      } else sheet.g.drawImage(t.c, x, y);
    }
  });
  return sheet.c;
}

// ---------------------------------------------------------------- productos
const O = '#241c26';
function outlined(d, x, y, w, h, fill) { d.r(O, x, y, w, h); d.r(fill, x + 1, y + 1, w - 2, h - 2); }

export function productIcon(p) {
  const d = mk(12, 12), a = p.c1, b = p.c2;
  switch (p.shape) {
    case 'carton': outlined(d, 3, 3, 6, 8, a); d.r(b, 4, 6, 4, 3); d.r(O, 4, 1, 4, 2); d.r(a, 5, 2, 2, 1); d.r('#ffffff', 4, 4, 1, 1); break;
    case 'cup': d.r(O, 3, 2, 6, 3); d.r(b, 4, 3, 4, 1); d.r(O, 3, 4, 6, 1); d.r(O, 3, 5, 6, 5); d.r(a, 4, 5, 4, 4); d.r(O, 4, 10, 4, 1); d.r(b, 4, 6, 4, 2); break;
    case 'can': outlined(d, 3, 2, 6, 9, a); d.r('#aab2bd', 3, 2, 6, 1); d.r(b, 4, 5, 4, 3); d.r('#ffffff', 4, 3, 1, 7); break;
    case 'bottle': d.r(O, 5, 0, 2, 3); d.r(b, 5, 0, 2, 1); outlined(d, 3, 3, 6, 8, a); d.r(b, 4, 6, 4, 3); d.r('#ffffff', 4, 4, 1, 2); break;
    case 'bag': outlined(d, 2, 2, 8, 9, a); d.r(O, 2, 2, 8, 1); d.r(b, 3, 3, 6, 1); d.r(b, 4, 5, 4, 4); d.r('#ffffff', 4, 5, 1, 1); break;
    case 'box': outlined(d, 2, 1, 8, 10, a); d.r(b, 3, 3, 6, 4); d.r('#ffffff', 4, 8, 4, 1); d.r(shade(a, -40), 9, 2, 1, 8); break;
    case 'roll': outlined(d, 1, 3, 10, 7, a); d.r(b, 1, 6, 10, 2); d.r('#dcdcdc', 2, 4, 3, 1); d.r(O, 5, 4, 2, 1); break;
    default: outlined(d, 2, 2, 8, 8, a);
  }
  return d.c;
}

// Reduce 2x por votación (conserva silueta y color dominante) para iconos en estantes.
export function downscale2(src) {
  const w = src.width >> 1, h = src.height >> 1;
  const out = mk(w, h);
  const sd = src.getContext('2d').getImageData(0, 0, src.width, src.height).data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const cols = [];
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const k = ((y * 2 + j) * src.width + (x * 2 + i)) * 4;
      if (sd[k + 3] > 100) cols.push([sd[k], sd[k + 1], sd[k + 2]]);
    }
    if (cols.length >= 2) {
      // preferimos el color más claro (evita que el contorno oscuro se coma todo)
      cols.sort((u, v) => (v[0] + v[1] + v[2]) - (u[0] + u[1] + u[2]));
      const c = cols[0];
      out.p(`rgb(${c[0]},${c[1]},${c[2]})`, x, y);
    }
  }
  return out.c;
}

// ---------------------------------------------------------------- cajas
const CB = { base: '#b98a52', edge: '#7d5a30', light: '#d6aa6c', dark: '#9a6f3c' };
export function boxClosed(p) {
  const d = mk(14, 12);
  d.r(CB.edge, 0, 0, 14, 12); d.r(CB.base, 1, 1, 12, 10);
  d.r(CB.light, 1, 1, 12, 1); d.r(CB.dark, 1, 10, 12, 1);
  d.r(CB.light, 6, 0, 2, 12); d.r(shade(CB.light, 14), 6, 0, 2, 1);
  d.r('#f2ead8', 9, 5, 3, 4); d.r(p.c2, 9, 5, 3, 1); d.r(p.c1, 10, 7, 1, 1);
  return d.c;
}
export function boxOpen(p) {
  const d = mk(14, 12);
  d.r(CB.edge, 0, 0, 14, 12); d.r('#4b3320', 1, 1, 12, 10);
  d.r(p.c1, 2, 3, 4, 4); d.r(p.c2, 2, 3, 4, 1); d.r(p.c1, 7, 3, 4, 4); d.r(p.c2, 7, 3, 4, 1);
  d.r(p.c1, 2, 7, 4, 3); d.r(p.c2, 7, 7, 4, 3);
  d.r(CB.light, 0, 0, 14, 2); d.r(CB.base, 0, 10, 14, 2); d.r(CB.edge, 0, 1, 14, 1);
  return d.c;
}
