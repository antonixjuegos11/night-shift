import { SAVE_KEY, SAVE_VERSION } from '../config.js';

// Guardado en localStorage. Todo va dentro de try/catch (modo privado, cuota, etc.).
export const SaveSystem = {
  hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  },
  save(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, version: SAVE_VERSION, savedAt: Date.now() }));
      return true;
    } catch (e) { console.warn('No se pudo guardar', e); return false; }
  },
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data && data.version === SAVE_VERSION ? data : null;
    } catch (e) { return null; }
  },
  clear() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* nada */ }
  },
};
