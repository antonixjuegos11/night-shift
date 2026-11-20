import { SaveSystem } from '../systems/SaveSystem.js';
import { txt, panel, button, COL, FONT } from '../ui/theme.js';

const CONTROLS = [
  ['W A S D', 'Mover al personaje'],
  ['E', 'Interactuar (mantén E para repetir / limpiar)'],
  ['Q', 'Soltar la caja en el suelo / devolver productos'],
  ['R', 'Abrir una caja (cúter)'],
  ['I', 'Abrir / cerrar inventario'],
  ['P  o  ESC', 'Pausa (único momento en que se para el reloj)'],
  ['Ratón', 'Menús, velocidad del reloj y pedidos'],
];

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.cameras.main.setBackgroundColor('#07060c');
    this.drawBackdrop();
    txt(this, 640, 118, 'NIGHT', 74, '#ffd9a0', { shadow: { offsetX: 0, offsetY: 0, color: '#ff9a3c', blur: 24, fill: true } }).setOrigin(0.5);
    const shift = txt(this, 640, 198, 'SHIFT', 74, '#ff9a3c', { shadow: { offsetX: 0, offsetY: 0, color: '#ff5a1c', blur: 28, fill: true } }).setOrigin(0.5);
    this.tweens.add({ targets: shift, alpha: { from: 1, to: 0.78 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    txt(this, 640, 262, 'Supermercado 24h · Simulación top-down', 12, COL.dim).setOrigin(0.5);

    this.buttons = [];
    this.layer = null;
    this.buildButtons();
    this.input.keyboard.on('keydown-ENTER', () => this.activate());
    this.input.keyboard.on('keydown-UP', () => this.move(-1));
    this.input.keyboard.on('keydown-DOWN', () => this.move(1));
    this.input.keyboard.on('keydown-W', () => this.move(-1));
    this.input.keyboard.on('keydown-S', () => this.move(1));
    txt(this, 640, 700, 'Prototipo v0.1 · Chrome / Edge · Guardado automático en el navegador', 10, '#6f6478').setOrigin(0.5);
  }

  drawBackdrop() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x0a0816, 0x0a0816, 0x1d1230, 0x1d1230, 1).fillRect(0, 0, 1280, 720);
    const R = new Phaser.Math.RandomDataGenerator(['nightshift']);
    for (let i = 0; i < 90; i++) {
      const s = this.add.rectangle(R.between(0, 1280), R.between(0, 330), 2, 2, 0xffffff, R.realInRange(0.3, 0.9));
      this.tweens.add({ targets: s, alpha: 0.1, duration: R.between(900, 2600), yoyo: true, repeat: -1, delay: R.between(0, 2000) });
    }
    // fachada del súper (silueta con ventanas cálidas)
    g.fillStyle(0x15101c, 1).fillRect(0, 470, 1280, 250);
    g.fillStyle(0x221a2b, 1).fillRect(190, 420, 900, 210);
    g.fillStyle(0x2e2338, 1).fillRect(190, 420, 900, 14);
    for (let i = 0; i < 6; i++) {
      g.fillStyle(0xffc27a, 0.92).fillRect(230 + i * 140, 480, 110, 100);
      g.fillStyle(0xfff0c8, 0.35).fillRect(236 + i * 140, 486, 40, 88);
      g.fillStyle(0x221a2b, 1).fillRect(230 + i * 140, 528, 110, 4);
    }
    g.fillStyle(0x0d0a12, 1).fillRect(0, 630, 1280, 90);
    g.fillStyle(0x3a3140, 1).fillRect(0, 630, 1280, 4);
    this.add.image(120, 640, 'streetlamp').setOrigin(0.5, 1).setScale(9);
    this.add.image(1160, 640, 'streetlamp').setOrigin(0.5, 1).setScale(9);
    this.add.image(640, 630, 'glow_warm').setScale(9).setAlpha(0.28).setBlendMode(Phaser.BlendModes.ADD);
  }

  buildButtons() {
    this.buttons.forEach((b) => b.destroy());
    const has = SaveSystem.hasSave();
    const defs = [
      { label: 'NUEVA PARTIDA', on: () => this.newGame(), show: true },
      { label: 'CONTINUAR', on: () => this.scene.start('Game', { load: true }), show: true, enabled: has },
      { label: 'CONTROLES', on: () => this.showControls(), show: true },
      { label: 'BORRAR PARTIDA', on: () => this.confirm('¿Borrar la partida guardada?', () => { SaveSystem.clear(); this.buildButtons(); }), show: has },
    ].filter((d) => d.show);
    this.buttons = defs.map((d, i) => {
      const b = button(this, 640, 350 + i * 66, 380, 50, d.label, d.on, 15);
      if (d.enabled === false) b.setEnabled(false);
      return b;
    });
    this.sel = this.buttons.findIndex((b) => b.enabled);
    this.paintSel();
  }

  paintSel() { this.buttons.forEach((b, i) => b.focus(i === this.sel)); }
  move(d) {
    if (this.layer) return;
    for (let k = 1; k <= this.buttons.length; k++) {
      const n = (this.sel + d * k + this.buttons.length * 4) % this.buttons.length;
      if (this.buttons[n].enabled) { this.sel = n; break; }
    }
    this.paintSel();
  }
  activate() { if (!this.layer && this.buttons[this.sel]) this.buttons[this.sel].click(); }

  newGame() {
    if (SaveSystem.hasSave()) this.confirm('Ya hay una partida guardada.\n¿Empezar de nuevo y sobrescribirla?', () => { SaveSystem.clear(); this.scene.start('Game', { load: false }); });
    else this.scene.start('Game', { load: false });
  }

  openLayer(w, h) {
    const items = [];
    const veil = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.65).setInteractive().setDepth(50);
    items.push(veil, panel(this, 640 - w / 2, 360 - h / 2, w, h, 0.97).setDepth(51));
    this.layer = { items, add: (o) => { o.setDepth(52); items.push(o); return o; }, close: () => { items.forEach((o) => o.destroy()); this.layer = null; } };
    return this.layer;
  }

  confirm(msg, onYes) {
    const L = this.openLayer(620, 240);
    L.add(txt(this, 640, 310, msg, 13, COL.text, { align: 'center', lineSpacing: 10 }).setOrigin(0.5));
    const yes = button(this, 540, 410, 200, 46, 'SÍ', () => { L.close(); onYes(); }, 14);
    const no = button(this, 740, 410, 200, 46, 'NO', () => L.close(), 14);
    [yes, no].forEach((b) => { b.setDepth(53); L.items.push(b.bg, b.t); });
  }

  showControls() {
    const L = this.openLayer(860, 470);
    L.add(txt(this, 640, 165, 'CONTROLES', 20, COL.accent).setOrigin(0.5));
    CONTROLS.forEach(([k, d], i) => {
      L.add(txt(this, 250, 225 + i * 40, k, 13, '#ffd9a0'));
      L.add(txt(this, 440, 225 + i * 40, d, 11, COL.text));
    });
    const b = button(this, 640, 545, 220, 46, 'CERRAR', () => L.close(), 14).setDepth(53);
    L.items.push(b.bg, b.t);
  }
}
