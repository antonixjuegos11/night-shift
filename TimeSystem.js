import { TIME } from '../config.js';

// Reloj del turno. Avanza SIEMPRE que se llame a update() (también con menús abiertos);
// solo se detiene si la escena deja de llamarlo (pausa).
export class TimeSystem {
  constructor(state) {
    this.state = state; // { shift, clock }
    this.speed = 1;
    this.acc = 0;
    this.openedFlag = state.clock >= TIME.OPEN;
  }

  get clock() { return this.state.clock; }
  isOpen() { return this.state.clock >= TIME.OPEN && this.state.clock < TIME.CLOSE; }
  isShiftOver() { return this.state.clock >= TIME.CLOSE; }

  setSpeed(s) { this.speed = s; }

  // dt en segundos reales. Devuelve lista de eventos: 'open', 'close'
  update(dt) {
    const events = [];
    if (this.isShiftOver()) return events;
    this.acc += dt * this.speed;
    const step = TIME.SECONDS_PER_MINUTE;
    while (this.acc >= step && !this.isShiftOver()) {
      this.acc -= step;
      this.state.clock += 1;
      if (this.state.clock === TIME.OPEN) events.push('open');
      if (this.state.clock === TIME.CLOSE) events.push('close');
    }
    return events;
  }

  static format(clock) {
    const m = Math.floor(clock) % 1440;
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}
