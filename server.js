// Servidor estático mínimo SIN dependencias (solo Node). Uso: node server.js [puerto]
// Los módulos ES (import/export) no funcionan abriendo index.html con doble clic (file://),
// por eso hace falta servir la carpeta por HTTP.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.argv[2] || process.env.PORT || 8080);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};
// Si lib/phaser.min.js no existe pero hay node_modules, se sirve desde ahí.
const PHASER_FALLBACK = path.join(ROOT, 'node_modules', 'phaser', 'dist', 'phaser.min.js');

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  let file = path.normalize(path.join(ROOT, urlPath));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  if (urlPath === '/lib/phaser.min.js' && !fs.existsSync(file) && fs.existsSync(PHASER_FALLBACK)) file = PHASER_FALLBACK;
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('404 ' + urlPath); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`\n  NIGHT SHIFT en marcha -> http://localhost:${PORT}\n  (Ctrl+C para parar)\n`);
});
