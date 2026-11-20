import { generateAll } from '../art/index.js';
import { CHAR_DIRS } from '../art/pixel.js';
import { txt } from '../ui/theme.js';

// Genera el pixel art por código y lo registra como texturas/animaciones de Phaser.
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    txt(this, 640, 360, 'Cargando...', 14).setOrigin(0.5);
    const { tex, sheets } = generateAll();
    Object.entries(tex).forEach(([k, c]) => this.textures.addCanvas(k, c));
    Object.entries(sheets).forEach(([k, c]) => {
      const t = this.textures.addCanvas(k, c);
      CHAR_DIRS.forEach((dir, row) => { for (let f = 0; f < 6; f++) t.add(`${dir}_${f}`, 0, f * 16, row * 24, 16, 24); });
      CHAR_DIRS.forEach((dir) => {
        this.anims.create({ key: `${k}_idle_${dir}`, frames: [0, 1].map((f) => ({ key: k, frame: `${dir}_${f}` })), frameRate: 2, repeat: -1 });
        this.anims.create({ key: `${k}_walk_${dir}`, frames: [2, 3, 4, 5].map((f) => ({ key: k, frame: `${dir}_${f}` })), frameRate: 8, repeat: -1 });
      });
    });
    this.scene.start('Menu');
  }
}
