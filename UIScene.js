import { TIME } from '../config.js';
import { PRODUCT_BY_ID, formatMoney } from '../data/products.js';
import { OBJECTIVE_DEFS } from '../systems/GameState.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { bus, listen } from '../systems/EventBus.js';
import { txt, panel, button, COL, FONT } from '../ui/theme.js';
import { buildInventory, buildOrders } from '../ui/panels.js';

const KIND_COLOR = { info: COL.text, good: COL.good, warn: COL.warn, bad: COL.bad };

// HUD: hora, dinero, objetivos, manos, notificaciones, aviso de interacción, pausa y resumen.
export class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    this.gs = this.scene.get('Game');
    this.notes = [];
    this.inv = null; this.orders = null; this.pauseLayer = null; this.summaryLayer = null;
    this.buildHud();
    listen(this, 'notify', (t, k) => this.addNote(t, k));
    listen(this, 'clock', () => this.refreshClock());
    listen(this, 'money', () => this.refreshMoney());
    listen(this, 'objectives', () => this.refreshObjectives());
    listen(this, 'hands', () => this.refreshHands());
    listen(this, 'prompt', (p) => this.showPrompt(p));
    listen(this, 'toggleInventory', () => this.toggleInventory());
    listen(this, 'openOrders', () => this.openOrders());
    listen(this, 'closeModal', () => this.closeOrders());
    listen(this, 'pauseChanged', (v) => (v ? this.openPause() : this.closePause()));
    listen(this, 'shiftEnd', (s) => this.openSummary(s));
    this.refreshAll();
  }

  // ------------------------------------------------------------------ HUD fijo
  buildHud() {
    panel(this, 16, 16, 270, 118); panel(this, 16, 142, 270, 46);
    this.clockT = txt(this, 34, 28, '21:30', 34, '#ffd9a0');
    this.stateT = txt(this, 34, 74, '', 10, COL.dim);
    this.speedBtns = TIME.SPEEDS.map((sp, i) => {
      const b = button(this, 64 + i * 78, 112, 66, 24, `x${sp}`, () => { bus.emit('setSpeed', sp); this.paintSpeed(sp); }, 11);
      b.sp = sp; return b;
    });
    this.moneyT = txt(this, 34, 154, '', 18, COL.good);

    panel(this, 884, 16, 380, 170);
    txt(this, 902, 28, 'OBJETIVOS DEL TURNO', 11, COL.accent);
    this.objT = OBJECTIVE_DEFS.map((d, i) => txt(this, 902, 62 + i * 28, '', 11));
    this.noteLayer = this.add.container(0, 0);

    panel(this, 16, 634, 360, 70);
    txt(this, 30, 642, 'EN MANOS', 8, COL.dim);
    this.handIcon = this.add.image(54, 678, 'icon_milk').setScale(3).setVisible(false);
    this.handT = txt(this, 90, 664, '', 11);

    this.promptBg = this.add.rectangle(640, 596, 10, 34, 0x14101a, 0.88).setStrokeStyle(2, COL.border).setVisible(false);
    this.promptT = txt(this, 640, 596, '', 13).setOrigin(0.5).setVisible(false);
    this.promptBar = this.add.graphics();
    txt(this, 1264, 704, 'WASD mover · E interactuar · Q soltar · R abrir caja · I inventario · P pausa', 9, '#8a7e92').setOrigin(1, 1);
  }

  refreshAll() {
    this.refreshClock(); this.refreshMoney(); this.refreshObjectives(); this.refreshHands();
    this.paintSpeed(this.gs.timeSys.speed);
  }

  refreshClock() {
    const s = this.gs.state, c = s.clock;
    this.clockT.setText(TimeSystem.format(c));
    const st = c < TIME.OPEN ? 'PREPARACIÓN' : c < TIME.CLOSE ? 'ABIERTO' : 'CERRADO';
    this.stateT.setText(`NOCHE ${s.shift} · ${st}`).setColor(st === 'ABIERTO' ? COL.good : st === 'CERRADO' ? COL.bad : COL.warn);
  }

  paintSpeed(sp) { this.speedBtns.forEach((b) => b.t.setColor(b.sp === sp ? '#ffd166' : '#8a7e92')); }
  refreshMoney() { this.moneyT.setText(formatMoney(this.gs.state.money)); }

  refreshObjectives() {
    OBJECTIVE_DEFS.forEach((d, i) => {
      const o = this.gs.state.objectives.find((x) => x.id === d.id);
      const prog = Math.min(d.target, Math.floor(o.progress));
      this.objT[i].setText(`${o.done ? '[x]' : '[ ]'} ${d.label} ${prog}/${d.target}`).setColor(o.done ? COL.good : COL.text);
    });
  }

  refreshHands() {
    const s = this.gs.state, h = s.hands;
    if (h.kind === 'none') { this.handIcon.setVisible(false); this.handT.setText('Manos vacías').setColor(COL.dim); }
    else if (h.kind === 'box') {
      const b = s.boxes.find((x) => x.id === h.id);
      this.handIcon.setTexture('boxc_' + b.p).setVisible(true);
      this.handT.setText(`Caja de ${PRODUCT_BY_ID[b.p].name}\n${b.qty} uds · cerrada`).setColor(COL.text);
    } else {
      this.handIcon.setTexture('icon_' + h.p).setVisible(true);
      this.handT.setText(`${PRODUCT_BY_ID[h.p].name}\n${h.qty} uds en las manos`).setColor(COL.text);
    }
  }

  // ------------------------------------------------------------------ notificaciones y aviso
  addNote(text, kind = 'info') {
    const t = txt(this, 1264, 0, text, 10, KIND_COLOR[kind] || COL.text, {
      wordWrap: { width: 400 }, align: 'right', backgroundColor: '#14101ad9', padding: { x: 8, y: 6 },
    }).setOrigin(1, 0);
    this.noteLayer.add(t);
    this.notes.push(t);
    while (this.notes.length > 5) this.dropNote(this.notes[0], true);
    this.layoutNotes();
    this.time.delayedCall(5200, () => this.tweens.add({ targets: t, alpha: 0, duration: 500, onComplete: () => this.dropNote(t, true) }));
  }
  dropNote(t, relayout) {
    const i = this.notes.indexOf(t);
    if (i < 0) return;
    this.notes.splice(i, 1); t.destroy();
    if (relayout) this.layoutNotes();
  }
  layoutNotes() { let y = 198; this.notes.forEach((n) => { n.setY(y); y += n.height + 6; }); }

  showPrompt(p) {
    this.promptBar.clear();
    const on = !!p;
    this.promptBg.setVisible(on); this.promptT.setVisible(on);
    if (!on) return;
    this.promptT.setText(p.text).setColor(p.ok ? COL.text : '#9a8f9f');
    this.promptBg.setSize(this.promptT.width + 36, 38).setStrokeStyle(2, p.ok ? COL.border : 0x5a4f60);
    if (p.progress > 0) {
      const w = this.promptT.width + 36;
      this.promptBar.fillStyle(0x2d2236, 1).fillRect(640 - w / 2, 620, w, 8);
      this.promptBar.fillStyle(0x7ee08a, 1).fillRect(640 - w / 2, 620, w * p.progress, 8);
    }
  }

  // ------------------------------------------------------------------ inventario / pedidos
  toggleInventory() {
    if (this.inv) { this.inv.destroy(); this.inv = null; } else this.inv = buildInventory(this, this.gs);
  }
  openOrders() {
    if (this.orders || this.gs.paused) return;
    bus.emit('modal', true);
    this.orders = buildOrders(this, this.gs, () => this.closeOrders());
  }
  closeOrders() {
    if (!this.orders) return;
    this.orders.destroy(); this.orders = null;
    bus.emit('modal', false);
  }

  // ------------------------------------------------------------------ pausa y fin de turno
  layer(w, h, title) {
    const objs = [this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7).setInteractive().setDepth(100), panel(this, 640 - w / 2, 360 - h / 2, w, h, 0.98).setDepth(101)];
    const add = (o) => { o.setDepth(102); objs.push(o); return o; };
    add(txt(this, 640, 360 - h / 2 + 30, title, 22, COL.accent)).setOrigin(0.5, 0);
    return { objs, add, btn: (x, y, bw, label, fn) => { const b = button(this, x, y, bw, 46, label, fn, 13).setDepth(102); objs.push(b.bg, b.t); return b; }, destroy: () => objs.forEach((o) => o.destroy()) };
  }

  openPause() {
    if (this.pauseLayer) return;
    const L = this.layer(560, 480, 'PAUSA');
    L.add(txt(this, 640, 262, 'El reloj está detenido', 10, COL.warn)).setOrigin(0.5, 0);
    L.btn(640, 335, 380, 'REANUDAR', () => bus.emit('setPause', false));
    L.btn(640, 395, 380, 'GUARDAR PARTIDA', () => bus.emit('saveGame'));
    L.btn(640, 455, 380, 'SALIR AL MENÚ', () => bus.emit('quitToMenu'));
    L.add(txt(this, 640, 515, 'WASD mover · E interactuar · Q soltar\nR abrir caja · I inventario · P/ESC pausa', 9, COL.dim, { align: 'center', lineSpacing: 8 })).setOrigin(0.5, 0);
    this.pauseLayer = L;
  }
  closePause() { if (this.pauseLayer) { this.pauseLayer.destroy(); this.pauseLayer = null; } }

  openSummary(s) {
    if (this.summaryLayer) return;
    if (this.orders) this.closeOrders();
    const L = this.layer(660, 520, `NOCHE ${s.shift} TERMINADA`);
    const profit = s.revenue - s.spent;
    const rows = [
      ['Ventas', formatMoney(s.revenue)], ['Gastos en pedidos', formatMoney(s.spent)],
      ['Beneficio', formatMoney(profit)], ['Clientes atendidos', String(s.served)], ['Clientes perdidos', String(s.lost)],
      ['Productos repuestos', String(s.restocked)], ['Suciedad limpiada', String(s.cleaned)],
      ['Objetivos cumplidos', `${s.done}/${s.total}`], ['Dinero total', formatMoney(s.money)],
    ];
    rows.forEach(([k, v], i) => {
      L.add(txt(this, 340, 250 + i * 31, k, 12, COL.text));
      L.add(txt(this, 940, 250 + i * 31, v, 12, i === 2 ? (profit >= 0 ? COL.good : COL.bad) : '#ffd9a0')).setOrigin(1, 0);
    });
    L.btn(500, 570, 270, 'SIGUIENTE NOCHE', () => { L.destroy(); this.summaryLayer = null; bus.emit('nextShift'); });
    L.btn(790, 570, 250, 'MENÚ PRINCIPAL', () => bus.emit('quitToMenu'));
    this.summaryLayer = L;
  }
}
