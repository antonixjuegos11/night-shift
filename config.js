// Constantes globales del juego. Todo lo "ajustable" vive aquí.
export const TILE = 16;
export const MAP_W = 40;
export const MAP_H = 30;
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const ZOOM = 3;

export const SAVE_KEY = 'nightshift_save_v1';
export const SAVE_VERSION = 1;

// Reloj: minutos de juego desde las 00:00 del día en que empieza el turno.
// 21:30 preparación, 22:00 abre, 30:00 (= 06:00) cierra y termina el turno.
export const TIME = {
  PREP_START: 21 * 60 + 30,
  OPEN: 22 * 60,
  CLOSE: 30 * 60,
  SECONDS_PER_MINUTE: 1, // segundos reales por minuto de juego a velocidad x1
  SPEEDS: [1, 2, 4],
};

export const START_MONEY = 500;
export const SLOT_CAP = 8;      // unidades por hueco de estantería
export const HAND_CAP = 8;      // unidades que caben en las manos
export const PLAYER_SPEED = 88; // px/s
export const ORDER_DELAY_MIN = 30; // minutos de juego hasta que llega un pedido
export const MAX_DIRT = 6;
export const AUTOSAVE_SECONDS = 30;
