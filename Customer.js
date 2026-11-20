const SPEED = 38;

// Cliente: sprite + ruta de puntos en píxeles. La lógica de decisiones está en CustomerSystem.
export class Customer {
  constructor(scene, sheetKey, tx, ty) {
    this.scene = scene;
    this.key = sheetKey;
    this.sprite = scene.add.sprite(tx * 16 + 8, ty * 16 + 14, sheetKey, 'down_0').setOrigin(0.5, 1);
    this.dir = 'up';
    this.path = [];
    this.state = 'entering';
    this.wish = [];
    this.basket = [];
    this.timer = 0;
    this.patience = 0;
    this.reg = null;
    this.target = null;
  }

  // Avanza por la ruta; actualiza animación y profundidad.
  move(dt) {
    const s = this.sprite;
    if (this.path.length) {
      const p = this.path[0];
      const dx = p.x - s.x, dy = p.y - s.y, dist = Math.hypot(dx, dy), step = SPEED * dt;
      if (dist <= step) { s.setPosition(p.x, p.y); this.path.shift(); }
      else { s.x += (dx / dist) * step; s.y += (dy / dist) * step; }
      if (Math.abs(dx) > Math.abs(dy)) this.dir = dx < 0 ? 'left' : 'right'; else if (dy !== 0) this.dir = dy < 0 ? 'up' : 'down';
      s.anims.play(`${this.key}_walk_${this.dir}`, true);
    } else s.anims.play(`${this.key}_idle_${this.dir}`, true);
    s.setDepth(s.y);
  }

  face(dir) { this.dir = dir; this.sprite.anims.play(`${this.key}_idle_${dir}`, true); }
  destroy() { this.sprite.destroy(); }
}
