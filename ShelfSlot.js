import { SLOT_CAP } from '../config.js';

// Un hueco de estantería o de nevera. Los datos viven en state.shelves[id] = {p, qty}.
export class ShelfSlot {
  constructor(scene, def) {
    this.scene = scene;
    this.def = def;
    this.rect = { x: def.tx * 16, y: def.ty * 16, w: def.tw * 16, h: def.th * 16 };
    this.baseDepth = (def.kind === 'shelf' ? (def.ty + def.th) * 16 : (def.ty + 3) * 16) - 2;
    if (def.kind === 'shelf') scene.add.image(this.rect.x, this.rect.y, 'shelf').setOrigin(0).setDepth(this.baseDepth);
    this.icons = [];
    for (let i = 0; i < SLOT_CAP; i++) this.icons.push(scene.add.image(0, 0, 'mini_milk').setOrigin(0).setVisible(false).setDepth(this.baseDepth + 1));
    this.refresh();
  }

  get data() { return this.scene.state.shelves[this.def.id] || null; }
  qty() { return this.data ? this.data.qty : 0; }
  product() { return this.data ? this.data.p : null; }

  set(p, qty) {
    if (qty <= 0) delete this.scene.state.shelves[this.def.id];
    else this.scene.state.shelves[this.def.id] = { p, qty };
    this.refresh();
  }

  refresh() {
    const d = this.data, r = this.rect;
    this.icons.forEach((ic, i) => {
      if (!d || i >= d.qty) { ic.setVisible(false); return; }
      const x = this.def.kind === 'shelf' ? r.x + 2 + (i % 2) * 6 : r.x + 2 + (i % 4) * 7;
      const y = this.def.kind === 'shelf' ? r.y + 2 + Math.floor(i / 2) * 7 : r.y + 2 + Math.floor(i / 4) * 7;
      ic.setTexture('mini_' + d.p).setPosition(x, y).setVisible(true);
    });
  }
}
