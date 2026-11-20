import { PLAYER_SPEED } from '../config.js';
import { FONT } from '../ui/theme.js';

const VEC = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };

// Propietario: movimiento WASD, animaciones, colisión (cuerpo en los pies) y objeto transportado.
export class Player {
  constructor(scene, x, y, dir = 'down') {
    this.scene = scene;
    this.dir = dir;
    this.moving = false;
    this.sprite = scene.physics.add.sprite(x, y, 'owner', `${dir}_0`).setOrigin(0.5, 1);
    this.sprite.body.setSize(8, 6).setOffset(4, 17);
    this.sprite.setCollideWorldBounds(true);
    this.carry = scene.add.image(0, 0, 'boxc_milk').setOrigin(0.5, 1).setVisible(false);
    this.itemIcon = scene.add.image(0, 0, 'icon_milk').setOrigin(0.5, 1).setVisible(false).setDepth(8999);
    this.itemText = scene.add.text(0, 0, '', { fontFamily: FONT, fontSize: '8px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 })
      .setOrigin(0, 0.5).setVisible(false).setDepth(8999);
    this.sprite.anims.play(`owner_idle_${dir}`);
  }

  get feet() { return { x: this.sprite.x, y: this.sprite.y - 4 }; }
  vec() { return VEC[this.dir]; }
  probe(dist = 10) { const f = this.feet, v = VEC[this.dir]; return { x: f.x + v[0] * dist, y: f.y + v[1] * dist }; }

  update(keys, locked) {
    let vx = 0, vy = 0;
    if (!locked) {
      if (keys.A.isDown || keys.LEFT.isDown) vx -= 1;
      if (keys.D.isDown || keys.RIGHT.isDown) vx += 1;
      if (keys.W.isDown || keys.UP.isDown) vy -= 1;
      if (keys.S.isDown || keys.DOWN.isDown) vy += 1;
    }
    this.moving = vx !== 0 || vy !== 0;
    if (this.moving) {
      const len = Math.hypot(vx, vy);
      this.sprite.body.setVelocity((vx / len) * PLAYER_SPEED, (vy / len) * PLAYER_SPEED);
      this.dir = vx !== 0 ? (vx < 0 ? 'left' : 'right') : (vy < 0 ? 'up' : 'down');
    } else this.sprite.body.setVelocity(0, 0);
    this.sprite.anims.play(`owner_${this.moving ? 'walk' : 'idle'}_${this.dir}`, true);
    this.sprite.setDepth(this.sprite.y);
    this.placeCarry();
  }

  stop() { this.sprite.body.setVelocity(0, 0); }

  placeCarry() {
    const s = this.sprite, d = this.dir;
    const off = { down: [0, -4, 1], up: [0, -14, -0.5], left: [-6, -6, 0.5], right: [6, -6, 0.5] }[d];
    this.carry.setPosition(s.x + off[0], s.y + off[1]).setDepth(s.y + off[2]);
    this.itemIcon.setPosition(s.x - 4, s.y - 25);
    this.itemText.setPosition(s.x + 3, s.y - 29);
  }

  // Refleja lo que lleva en las manos (hands = state.hands, box = modelo de la caja si hay)
  showHands(hands, boxModel) {
    this.carry.setVisible(hands.kind === 'box');
    if (hands.kind === 'box' && boxModel) this.carry.setTexture((boxModel.open ? 'boxo_' : 'boxc_') + boxModel.p);
    const items = hands.kind === 'items';
    this.itemIcon.setVisible(items); this.itemText.setVisible(items);
    if (items) { this.itemIcon.setTexture('icon_' + hands.p); this.itemText.setText('x' + hands.qty); }
    this.placeCarry();
  }
}
