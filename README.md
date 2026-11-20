# NIGHT SHIFT — prototipo v0.1

Simulador 2D top-down de un supermercado nocturno (Phaser 3 + JavaScript). Todo el pixel art se genera por código (`src/art`), sin imágenes externas.

## Ejecutar

**Opción A (recomendada, Node 18+):**
```
npm install        # descarga Phaser
npm start          # sirve el juego en http://localhost:8080
```
En Windows también vale hacer doble clic en `start.bat` (instala, arranca y abre el navegador). En Linux/macOS: `./start.sh`.
Opcional: `npm run setup` copia Phaser a `lib/` para jugar sin conexión.

**Opción B (sin Node):** servir la carpeta por HTTP, p. ej. `python -m http.server 8080`, y abrir http://localhost:8080. Si no hay `lib/phaser.min.js`, `index.html` carga Phaser 3.90 desde la CDN de jsDelivr (hace falta internet).

> No abras `index.html` con doble clic (`file://`): los módulos ES necesitan HTTP.
> Probado para Chrome y Edge de PC. La fuente pixel (Press Start 2P) viene de Google Fonts; sin internet se usa monospace.

## Controles
| Tecla | Acción |
|---|---|
| W A S D | Mover |
| E | Interactuar (mantén E para repetir o limpiar) |
| Q | Soltar la caja delante / guardarla en un hueco de almacén / devolver productos a su caja |
| R | Abrir una caja (cúter) |
| I | Inventario (el reloj sigue) |
| P / ESC | Pausa (único momento en que se para el reloj) |
| Ratón | Velocidad del reloj (x1/x2/x4), pedidos, menús |

## Cómo se juega
1. 21:30 empieza la preparación; la tienda abre a las 22:00 y cierra a las 06:00 (1 minuto de juego = 1 s real a x1).
2. **Muelle de carga** (arriba a la derecha): coge una caja (E), ábrela (R) y coge los productos de uno en uno (E, mantenlo pulsado).
3. **Reponer**: lleva los productos a una estantería (E). Los frescos (leche, yogur, refresco, zumo) solo van en las **neveras**; el resto, en los estantes. 8 unidades por hueco.
4. **Almacén**: guarda cajas cerradas en los racks (E o Q).
5. **Clientes**: cogen productos, hacen cola y esperan en caja; ponte detrás del mostrador y pulsa E para **cobrar**. Si no hay stock o esperan demasiado, se van.
6. **Limpieza**: aparecen manchas y basura; mantén E sobre ellas.
7. **Oficina**: E en el ordenador para hacer **pedidos** (llegan 30 min después al muelle). El reloj no se detiene mientras eliges.
8. Al llegar las 06:00 se muestra el resumen del turno y puedes empezar la siguiente noche. Guardado automático cada 30 s, al salir y desde la pausa.

## Estructura
```
index.html, style.css      Página y estilos
server.js                  Servidor estático sin dependencias
src/main.js                Configuración de Phaser
src/config.js              Constantes ajustables (tiempo, capacidades, velocidad...)
src/data/                  Datos: products.js (10 productos), map.js (layout y colisiones)
src/art/                   Generación procedural de pixel art (textures.js, pixel.js, world.js)
src/scenes/                BootScene, MenuScene, GameScene, UIScene (HUD)
src/systems/               TimeSystem, SaveSystem, CustomerSystem, InteractionSystem,
                           Actions, Pathfinding, GameState, EventBus
src/entities/              Player, Customer, Box, ShelfSlot
src/ui/                    Tema y paneles (inventario, pedidos)
scripts/                   test-logic.mjs y smoke-mock.mjs (pruebas), setup.js
```
El estado del juego es un objeto serializable (`GameState`); los sprites solo lo reflejan. Los sistemas se comunican por `EventBus`. Añadir un producto = una línea en `products.js`; añadir un sistema = un módulo nuevo en `systems/` llamado desde `GameScene.update`.

## Pruebas
`npm test` ejecuta (sin navegador):
- `test-logic.mjs`: mapa, accesibilidad de todos los puntos de interacción, rutas de clientes, reloj, estado inicial.
- `smoke-mock.mjs`: simula `GameScene` con un doble de Phaser durante un turno completo (clientes, cobros, cajas, pedidos, guardado).

## Pendiente para próximas fases
Empleados contratables (el bucle de actualización ya admite sistemas autónomos), más productos y clientes, mejoras de tienda, eventos nocturnos, audio.
