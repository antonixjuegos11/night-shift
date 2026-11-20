// Tiles, mobiliario, estanterías, suciedad y luces. Todo dibujado por código (pixel art).
import { mk, rng, shade } from './pixel.js';

const speckle = (d, seed, n, cols, w = 16, h = 16) => {
  const R = rng(seed);
  for (let i = 0; i < n; i++) d.p(cols[Math.floor(R() * cols.length)], Math.floor(R() * w), Math.floor(R() * h));
};

// ---------------------------------------------------------------- suelos y muros
export function tileStore(variant) {
  const d = mk(16, 16), base = variant ? '#cdb78f' : '#dccaa6';
  d.r(base, 0, 0, 16, 16); d.r(shade(base, -26), 15, 0, 1, 16); d.r(shade(base, -26), 0, 15, 16, 1);
  d.r(shade(base, 12), 0, 0, 14, 1); d.r(shade(base, 8), 0, 1, 1, 14);
  speckle(d, 11 + variant * 7, 9, [shade(base, -14), shade(base, 10)], 14, 14);
  return d.c;
}
export function tileBack() {
  const d = mk(16, 16); d.r('#8c8a8e', 0, 0, 16, 16);
  speckle(d, 5, 26, ['#7b797e', '#9b999d', '#6f6d73']);
  d.r('#767479', 0, 15, 16, 1); d.r('#767479', 15, 0, 1, 16); d.r('#6a686e', 3, 6, 4, 1); d.r('#6a686e', 6, 7, 3, 1);
  return d.c;
}
export function tileOffice() {
  const d = mk(16, 16);
  [['#8a5a3a', 0], ['#7d5033', 4], ['#8f6140', 8], ['#7a4f33', 12]].forEach(([c, y], i) => {
    d.r(c, 0, y, 16, 4); d.r('#5a3924', 0, y + 3, 16, 1); d.r(shade(c, 16), 0, y, 16, 1);
    d.r('#5a3924', (i * 5 + 3) % 16, y, 1, 3);
  });
  d.p('#5a3924', 8, 5); d.p('#5a3924', 9, 5); d.p('#5a3924', 4, 13);
  return d.c;
}
export function tileBath() {
  const d = mk(16, 16); d.r('#a9c8d2', 0, 0, 16, 16);
  d.r('#7fa3b0', 7, 0, 1, 16); d.r('#7fa3b0', 15, 0, 1, 16); d.r('#7fa3b0', 0, 7, 16, 1); d.r('#7fa3b0', 0, 15, 16, 1);
  d.r('#c9e0e6', 0, 0, 6, 1); d.r('#c9e0e6', 8, 8, 6, 1); d.r('#c9e0e6', 0, 8, 1, 6); d.r('#c9e0e6', 8, 0, 1, 6);
  return d.c;
}
export function tileDock() {
  const d = mk(16, 16); d.r('#74747c', 0, 0, 16, 16);
  speckle(d, 21, 22, ['#686870', '#82828a', '#5e5e66']); d.r('#62626a', 0, 15, 16, 1); d.r('#62626a', 15, 0, 1, 16);
  return d.c;
}
export function tileHazard() {
  const d = mk(16, 16); d.r('#1d1b1f', 0, 0, 16, 16);
  d.g.fillStyle = '#e3b81f';
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (((x + y) % 8) < 4) d.g.fillRect(x, y, 1, 1);
  return d.c;
}
export function tileSidewalk() {
  const d = mk(16, 16); d.r('#5f5d68', 0, 0, 16, 16); d.r('#514f5a', 0, 15, 16, 1); d.r('#514f5a', 15, 0, 1, 16);
  speckle(d, 8, 12, ['#6b6975', '#57555f']); return d.c;
}
export function tileStreet() {
  const d = mk(16, 16); d.r('#24242c', 0, 0, 16, 16); speckle(d, 3, 24, ['#2d2d36', '#1c1c23', '#35353f']); return d.c;
}
export function wallFace() {
  const d = mk(16, 16);
  d.r('#8d6a52', 0, 0, 16, 16); d.r('#a07b60', 0, 0, 16, 2); d.r('#7a5a45', 0, 2, 16, 1);
  speckle(d, 17, 14, ['#82604a', '#977256'], 16, 11);
  d.r('#3a2b25', 0, 11, 16, 4); d.r('#4a392f', 0, 11, 16, 1); d.r('#1b1418', 0, 15, 16, 1);
  return d.c;
}
export function wallTop() {
  const d = mk(16, 16); d.r('#2a2029', 0, 0, 16, 16); d.r('#3a2f39', 0, 0, 16, 1); d.r('#1d151c', 0, 15, 16, 1);
  speckle(d, 4, 8, ['#33283a', '#241b24']); return d.c;
}

// ---------------------------------------------------------------- estanterías y racks
export function shelfTex() {
  const d = mk(16, 32);
  d.r('#2b2830', 0, 0, 16, 32); d.r('#8a6a48', 1, 1, 14, 30);
  for (const y of [8, 15, 22, 29]) { d.r('#5a4430', 1, y, 14, 1); d.r('#b08a5e', 1, y + 1 > 30 ? y : y + 1, 14, 1); }
  d.r('#9c7a54', 1, 1, 14, 1); d.r('#4a4752', 0, 0, 16, 1); d.r('#3d3a45', 0, 31, 16, 1);
  return d.c;
}
export function fridgeTex() {
  const d = mk(32, 48);
  d.r('#9aa7b2', 0, 0, 32, 48); d.r('#dfe6ea', 1, 1, 30, 46);
  d.r('#16293a', 2, 3, 28, 43);
  for (const y of [14, 30]) { d.r('#6e8798', 2, y, 28, 1); d.r('#27455c', 2, y + 1, 28, 1); }
  d.r('#2a5878', 2, 3, 28, 1);
  for (let i = 0; i < 10; i++) d.r('rgba(255,255,255,0.10)', 4 + i * 2, 4 + (i % 3), 1, 40);
  d.r('#bfe9ff', 2, 3, 28, 1); d.r('#6ad1ff', 12, 1, 8, 1);
  d.r('#9aa7b2', 29, 18, 2, 12); d.r('#dfe6ea', 29, 19, 1, 10);
  d.r('#8693a0', 0, 47, 32, 1);
  return d.c;
}
export function rackTex() {
  const d = mk(16, 16);
  d.r('#4e535c', 0, 0, 16, 16); d.r('#6b717b', 1, 1, 14, 14);
  d.r('#c8742a', 0, 3, 16, 2); d.r('#c8742a', 0, 11, 16, 2); d.r('#e39447', 0, 3, 16, 1); d.r('#e39447', 0, 11, 16, 1);
  d.r('#2f333a', 0, 0, 2, 16); d.r('#2f333a', 14, 0, 2, 16); d.r('#8f959e', 0, 0, 1, 16);
  return d.c;
}

// ---------------------------------------------------------------- mobiliario
export function registerTex() {
  const d = mk(48, 24);
  d.r('#2b2128', 0, 8, 48, 16); d.r('#6d5340', 1, 9, 46, 14); d.r('#8a6a52', 1, 9, 46, 2); d.r('#4d392c', 1, 21, 46, 2);
  d.r('#2e2e34', 3, 12, 22, 7); d.r('#444450', 4, 13, 20, 1); // cinta
  for (let x = 6; x < 24; x += 4) d.r('#3a3a44', x, 14, 1, 4);
  d.r('#1c1c22', 30, 0, 12, 10); d.r('#0d3a2a', 31, 1, 10, 6); d.r('#38e08a', 32, 2, 6, 1); d.r('#38e08a', 32, 4, 4, 1);
  d.r('#3a3a44', 33, 10, 8, 2); d.r('#cfd3d8', 28, 10, 3, 1);
  d.r('#2a2a30', 31, 13, 14, 6); d.r('#4a4a54', 32, 14, 12, 2); d.r('#c8b25a', 36, 17, 4, 1);
  d.r('#e8e8e8', 44, 9, 3, 4); d.r('#c2c2c2', 44, 12, 3, 1);
  return d.c;
}
export function plantTex() {
  const d = mk(16, 24);
  d.r('#1d3a22', 3, 2, 10, 4); d.r('#2f6b36', 2, 4, 12, 8); d.r('#3f8a45', 4, 3, 8, 5); d.r('#56a85a', 6, 4, 3, 2);
  d.r('#2f6b36', 1, 8, 4, 4); d.r('#2f6b36', 11, 8, 4, 4); d.r('#1d3a22', 4, 11, 8, 3);
  d.r('#8a4a2a', 4, 14, 8, 9); d.r('#a85e36', 4, 14, 8, 2); d.r('#6a371e', 4, 21, 8, 2); d.r('#c27447', 5, 17, 1, 3);
  d.r('#2b1a10', 4, 23, 8, 1);
  return d.c;
}
export function binTex() {
  const d = mk(16, 16);
  d.r('rgba(0,0,0,0.3)', 3, 13, 11, 3); d.r('#2f3a3a', 3, 3, 10, 11); d.r('#4d6060', 4, 4, 8, 9);
  d.r('#667c7c', 3, 2, 10, 3); d.r('#8aa0a0', 4, 2, 8, 1); d.r('#2f3a3a', 6, 1, 4, 1);
  d.r('#3a4a4a', 5, 7, 1, 5); d.r('#3a4a4a', 8, 7, 1, 5); d.r('#3a4a4a', 11, 7, 1, 5);
  return d.c;
}
export function posterTex(kind) {
  const d = mk(16, 16);
  if (kind === 1) { d.r('#f2e6c4', 3, 1, 10, 12); d.r('#c0392b', 3, 1, 10, 3); d.r('#ffffff', 5, 2, 6, 1); d.r('#2b2b2b', 5, 6, 6, 1); d.r('#2b2b2b', 5, 8, 4, 1); d.r('#c0392b', 5, 10, 3, 2); }
  else { d.r('#d6ecf2', 3, 1, 10, 12); d.r('#2f7ea8', 3, 1, 10, 3); d.r('#ffffff', 5, 2, 6, 1); d.r('#3fa05a', 5, 6, 3, 5); d.r('#e8a030', 9, 7, 3, 4); }
  d.r('#00000030', 3, 13, 10, 1);
  return d.c;
}
export function clockTex() {
  const d = mk(16, 16);
  d.r('#2b2028', 4, 2, 8, 8); d.r('#2b2028', 3, 3, 10, 6); d.r('#f0e8d8', 4, 3, 8, 6); d.r('#f0e8d8', 5, 2, 6, 8);
  d.r('#2b2028', 8, 4, 1, 3); d.r('#2b2028', 8, 6, 3, 1); d.p('#c0392b', 8, 6);
  return d.c;
}
export function matTex() {
  const d = mk(32, 16);
  d.r('#2a1c1c', 0, 2, 32, 12); d.r('#6b2a2a', 1, 3, 30, 10); d.r('#8c3a3a', 3, 5, 26, 6);
  for (let x = 5; x < 28; x += 3) d.r('#6b2a2a', x, 5, 1, 6);
  return d.c;
}
export function cratesTex() {
  const d = mk(32, 32);
  const crate = (x, y, c) => { d.r('#2b1d12', x, y, 15, 14); d.r(c, x + 1, y + 1, 13, 12); d.r(shade(c, 22), x + 1, y + 1, 13, 1); d.r(shade(c, -30), x + 1, y + 6, 13, 1); d.r(shade(c, -30), x + 6, y + 1, 1, 12); };
  crate(1, 17, '#b8884e'); crate(16, 17, '#b8884e'); crate(8, 4, '#c79a5c');
  d.r('#e0e0e0', 5, 22, 5, 3); d.r('#e0e0e0', 21, 22, 5, 3);
  return d.c;
}
export function rugTex() {
  const d = mk(80, 48);
  d.r('#3a1a22', 0, 0, 80, 48); d.r('#7a2e3a', 2, 2, 76, 44); d.r('#c9a24a', 4, 4, 72, 1); d.r('#c9a24a', 4, 43, 72, 1);
  d.r('#5a2230', 8, 8, 64, 32);
  for (let x = 12; x < 68; x += 8) { d.r('#c9a24a', x, 22, 4, 4); d.r('#7a2e3a', x + 1, 23, 2, 2); }
  d.r('rgba(0,0,0,0.0)', 0, 0, 1, 1);
  return d.c;
}
export function deskTex() {
  const d = mk(48, 24);
  d.r('#2b1c14', 0, 8, 48, 16); d.r('#7a5236', 1, 9, 46, 13); d.r('#9a6c46', 1, 9, 46, 2); d.r('#4d3222', 1, 20, 46, 2);
  d.r('#1c1c22', 17, 0, 14, 10); d.r('#2a5a8a', 18, 1, 12, 7); d.r('#7ac0ff', 19, 2, 6, 1); d.r('#7ac0ff', 19, 4, 9, 1); d.r('#cfd3d8', 22, 9, 4, 2);
  d.r('#3a3a44', 18, 13, 12, 4); d.r('#5a5a66', 19, 14, 10, 1); d.r('#5a5a66', 19, 15, 10, 1);
  d.r('#e8e0c8', 3, 11, 8, 6); d.r('#c8c0a8', 4, 13, 6, 1);
  d.r('#2f3a2a', 38, 4, 2, 8); d.r('#e8c46a', 36, 2, 6, 3); d.r('#fff2b0', 37, 3, 4, 1);
  d.r('#f0f0f0', 34, 14, 3, 4); d.r('#7a5236', 37, 15, 1, 2);
  return d.c;
}
export function chairTex() {
  const d = mk(16, 16);
  d.r('rgba(0,0,0,0.3)', 3, 12, 11, 3); d.r('#2a2f3a', 3, 2, 10, 4); d.r('#454d5e', 4, 3, 8, 2);
  d.r('#2a2f3a', 3, 6, 10, 8); d.r('#586278', 4, 7, 8, 6); d.r('#6a7690', 4, 7, 8, 1);
  return d.c;
}
export function cabinetTex() {
  const d = mk(16, 32);
  d.r('#2a2d33', 0, 2, 16, 30); d.r('#8a929c', 1, 3, 14, 28); d.r('#a6aeb8', 1, 3, 14, 1);
  for (const y of [5, 13, 21]) { d.r('#6b727c', 2, y, 12, 7); d.r('#9aa2ac', 2, y, 12, 1); d.r('#2a2d33', 6, y + 3, 4, 1); d.r('#d0d5db', 6, y + 2, 4, 1); }
  d.r('#2a2d33', 0, 31, 16, 1);
  return d.c;
}
export function toiletTex() {
  const d = mk(16, 16);
  d.r('#bfc6cc', 3, 1, 10, 4); d.r('#f0f4f6', 4, 2, 8, 2); d.r('#8a9298', 7, 2, 2, 1);
  d.r('#bfc6cc', 4, 5, 8, 9); d.r('#f6f8fa', 5, 6, 6, 7); d.r('#6a7a86', 6, 8, 4, 4); d.r('#4b5a66', 7, 9, 2, 2);
  d.r('#8a9298', 4, 14, 8, 1);
  return d.c;
}
export function sinkTex() {
  const d = mk(16, 24);
  d.r('#2b2028', 1, 0, 14, 9); d.r('#9ac0d0', 2, 1, 12, 7); d.r('#c6e4ee', 2, 1, 12, 1); d.r('#e8f6fa', 3, 2, 3, 1);
  d.r('#bfc6cc', 1, 11, 14, 11); d.r('#f6f8fa', 2, 12, 12, 9); d.r('#8fa0aa', 4, 14, 8, 5); d.r('#6e808c', 5, 15, 6, 3);
  d.r('#9aa2ac', 7, 11, 2, 3); d.r('#7a828c', 6, 11, 4, 1); d.r('#8a9298', 1, 22, 14, 1);
  return d.c;
}
export function bucketTex() {
  const d = mk(16, 16);
  d.r('rgba(0,0,0,0.3)', 2, 13, 12, 3); d.r('#a87d12', 3, 5, 10, 9); d.r('#e3b81f', 4, 6, 8, 7); d.r('#f5d54a', 4, 6, 8, 1);
  d.r('#3a6ea8', 5, 7, 6, 3); d.r('#8a6a3a', 11, 0, 2, 8); d.r('#cfcfcf', 10, 0, 4, 2);
  return d.c;
}
export function shutterTex() {
  const d = mk(16, 64);
  d.r('#2a2a2f', 0, 0, 16, 64);
  for (let y = 1; y < 63; y += 3) { d.r('#8d9199', 1, y, 14, 2); d.r('#b3b8c0', 1, y, 14, 1); }
  d.r('#e3b81f', 0, 0, 16, 2); d.r('#e3b81f', 0, 62, 16, 2); d.r('#1d1b1f', 6, 30, 4, 4);
  return d.c;
}
export function palletTex() {
  const d = mk(16, 16);
  d.r('#3a2a18', 1, 1, 14, 14); for (const y of [1, 6, 11]) { d.r('#a77b45', 1, y, 14, 4); d.r('#c79a5c', 1, y, 14, 1); d.r('#6a4a28', 1, y + 3, 14, 1); }
  return d.c;
}
export function streetlampTex() {
  const d = mk(16, 32);
  d.r('#1d1b22', 7, 8, 2, 24); d.r('#2f2d38', 6, 28, 4, 4); d.r('#1d1b22', 4, 3, 8, 5); d.r('#ffd68a', 5, 6, 6, 2); d.r('#fff3c8', 6, 7, 4, 1); d.r('#2f2d38', 5, 2, 6, 2);
  return d.c;
}
export function doorTex() {
  const d = mk(16, 16);
  d.r('#9aa7b2', 0, 0, 16, 16); d.r('rgba(120,190,230,0.55)', 1, 1, 14, 14);
  d.r('#dfe6ea', 0, 0, 16, 1); d.r('#dfe6ea', 0, 15, 16, 1); d.r('rgba(255,255,255,0.35)', 3, 3, 2, 9); d.r('rgba(255,255,255,0.25)', 7, 3, 1, 9);
  return d.c;
}

// ---------------------------------------------------------------- suciedad
export function dirtTex(kind) {
  const d = mk(16, 16);
  if (kind === 'spill') { d.r('#3a6a9a', 4, 6, 9, 5); d.r('#3a6a9a', 6, 4, 5, 9); d.r('#6ea8d8', 6, 6, 4, 3); d.r('#a8d4f2', 7, 6, 2, 1); d.r('#2c557f', 5, 10, 6, 1); }
  else if (kind === 'trash') { d.r('#e8e0c8', 4, 6, 6, 5); d.r('#c8c0a8', 5, 8, 4, 2); d.r('#c0392b', 9, 9, 4, 3); d.r('#f0e8d0', 3, 4, 3, 2); d.r('#8a8a8a', 10, 5, 2, 2); }
  else { d.r('#8a6a3a', 5, 6, 2, 2); d.r('#a98258', 8, 8, 2, 2); d.r('#6a4a28', 6, 10, 2, 1); d.r('#c9a46a', 10, 5, 1, 1); d.r('#a98258', 4, 9, 1, 1); d.r('#8a6a3a', 11, 10, 2, 1); }
  return d.c;
}

// ---------------------------------------------------------------- luces
export function lightTex(size = 128) {
  const d = mk(size, size), g = d.g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  d.g.fillStyle = g; d.g.fillRect(0, 0, size, size);
  return d.c;
}
export function glowTex(color, size = 128) {
  const d = mk(size, size), g = d.g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, color + 'cc'); g.addColorStop(0.5, color + '44'); g.addColorStop(1, color + '00');
  d.g.fillStyle = g; d.g.fillRect(0, 0, size, size);
  return d.c;
}
