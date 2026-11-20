// Copia Phaser desde node_modules a lib/ para poder jugar sin conexión.
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '..', 'node_modules', 'phaser', 'dist', 'phaser.min.js');
const dst = path.join(__dirname, '..', 'lib', 'phaser.min.js');
if (!fs.existsSync(src)) { console.error('Falta Phaser. Ejecuta primero: npm install'); process.exit(1); }
fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.copyFileSync(src, dst);
console.log('OK: lib/phaser.min.js listo.');
