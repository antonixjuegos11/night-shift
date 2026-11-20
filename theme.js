// Tema visual compartido (fuente, colores y widgets simples de Phaser).
export const FONT = '"Press Start 2P", monospace';
export const COL = {
  bg: 0x1a141f, panel: 0x241b2b, border: 0xe3b05a, btn: 0x2d2236, btnHot: 0x4d3a2c,
  text: '#f6e7c8', dim: '#a79a86', good: '#7ee08a', bad: '#ff7a6b', warn: '#ffd166', accent: '#e3b05a',
};

export function txt(scene, x, y, s, size = 12, color = COL.text, extra = {}) {
  return scene.add.text(x, y, s, { fontFamily: FONT, fontSize: size + 'px', color, ...extra });
}

// Panel con borde pixelado
export function panel(scene, x, y, w, h, alpha = 0.88) {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.35).fillRect(x + 4, y + 4, w, h);
  g.fillStyle(COL.panel, alpha).fillRect(x, y, w, h);
  g.lineStyle(2, COL.border, 1).strokeRect(x + 1, y + 1, w - 2, h - 2);
  return g;
}

// Botón clicable real. Devuelve un objeto con setEnabled/setLabel/setVisible/destroy.
export function button(scene, x, y, w, h, label, onClick, size = 12) {
  const bg = scene.add.rectangle(x, y, w, h, COL.btn).setStrokeStyle(2, COL.border);
  const t = scene.add.text(x, y, label, { fontFamily: FONT, fontSize: size + 'px', color: COL.text }).setOrigin(0.5);
  const api = {
    bg, t, enabled: true,
    focus(f) { bg.setFillStyle(f && api.enabled ? COL.btnHot : COL.btn); },
    setEnabled(v) { api.enabled = v; t.setColor(v ? COL.text : '#6b6070'); bg.setStrokeStyle(2, v ? COL.border : 0x5a4f60); if (!v) bg.setFillStyle(COL.btn); },
    setLabel(s) { t.setText(s); },
    setVisible(v) { bg.setVisible(v); t.setVisible(v); if (bg.input) bg.input.enabled = v; },
    setDepth(d) { bg.setDepth(d); t.setDepth(d + 1); return api; },
    setScrollFactor(v) { bg.setScrollFactor(v); t.setScrollFactor(v); return api; },
    destroy() { bg.destroy(); t.destroy(); },
    click() { if (api.enabled) onClick(); },
  };
  bg.setInteractive({ useHandCursor: true })
    .on('pointerover', () => api.focus(true))
    .on('pointerout', () => api.focus(false))
    .on('pointerdown', () => api.click());
  return api;
}
