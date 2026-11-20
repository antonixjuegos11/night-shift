// Bus de eventos global para desacoplar escenas (juego <-> interfaz).
// Eventos: notify, prompt, hands, money, objectives, clock, shiftEnd, toggleInventory,
//          openOrders, closeOrders, pauseChanged
export const bus = new Phaser.Events.EventEmitter();

// Suscribe un listener y lo retira solo cuando la escena se apaga (evita duplicados al reiniciar).
export function listen(scene, event, fn) {
  bus.on(event, fn);
  scene.events.once('shutdown', () => bus.off(event, fn));
}
