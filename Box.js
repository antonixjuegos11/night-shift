// Caja de producto. El modelo (state.boxes[i]) manda; el sprite solo lo refleja.
export class Box {
  constructor(scene, model) {
    this.scene = scene;
    this.m = model;
    this.sprite = scene.add.image(0, 0, 'boxc_' + model.p).setOrigin(0);
    this.refresh();
  }

  refresh() {
    const m = this.m, s = this.sprite;
    s.setTexture((m.open ? 'boxo_' : 'boxc_') + m.p);
    if (m.loc === 'floor') s.setVisible(true).setPosition(m.tx * 16 + 1, m.ty * 16 + 2).setDepth(m.ty * 16 + 10);
    else if (m.loc === 'rack') {
      const r = this.scene.rackById.get(m.slot);
      s.setVisible(true).setPosition(r.tx * 16 + 1, r.ty * 16 + 2).setDepth(r.ty * 16 + 12);
    } else s.setVisible(false);
  }

  destroy() { this.sprite.destroy(); }
}
