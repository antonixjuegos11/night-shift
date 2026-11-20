import { VIEW_W, VIEW_H } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';

// Espera a la fuente pixel (máx. 2 s) para que el texto salga nítido desde el primer frame.
async function start() {
  try {
    await Promise.race([
      document.fonts.load('12px "Press Start 2P"'),
      new Promise((r) => setTimeout(r, 2000)),
    ]);
  } catch (e) { /* fuente no disponible: se usa monospace */ }

  window.__game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: VIEW_W,
    height: VIEW_H,
    backgroundColor: '#07060c',
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: [BootScene, MenuScene, GameScene, UIScene],
  });
}
start();
