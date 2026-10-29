// Ciclos del Pomodoro: enfoque → descanso corto → enfoque … → descanso largo cada N enfoques.
// Solo las fases de enfoque crean sesiones y suman minutos; los descansos no cuentan.

export const DEFAULT_SETTINGS = {
  shortBreak: 5, // minutos
  longBreak: 15,
  cyclesBeforeLong: 4,
  autoStart: false, // empezar la siguiente fase sola
};

export const PHASE_LABELS = {
  focus: 'Enfoque',
  shortBreak: 'Descanso corto',
  longBreak: 'Descanso largo',
};

// done = enfoques terminados en la tanda actual (vuelve a 0 después del descanso largo)
export const initialCycle = () => ({ phase: 'focus', done: 0 });

export const isBreak = (phase) => phase === 'shortBreak' || phase === 'longBreak';

export function nextPhase(state, settings = DEFAULT_SETTINGS) {
  if (state.phase === 'focus') {
    const done = state.done + 1;
    return { phase: done >= settings.cyclesBeforeLong ? 'longBreak' : 'shortBreak', done };
  }
  if (state.phase === 'longBreak') return { phase: 'focus', done: 0 };
  return { phase: 'focus', done: state.done };
}

// Saltar el descanso: vuelve a enfoque sin perder la cuenta (o reinicia la tanda si era largo)
export const skipBreak = (state) => (isBreak(state.phase) ? nextPhase(state) : state);

// Duración en segundos
export function phaseSeconds(phase, settings = DEFAULT_SETTINGS, focusMinutes = 25) {
  if (phase === 'shortBreak') return settings.shortBreak * 60;
  if (phase === 'longBreak') return settings.longBreak * 60;
  return focusMinutes * 60;
}

// Puntos de la tanda: true = enfoque ya hecho
export function cycleDots(state, settings = DEFAULT_SETTINGS) {
  return Array.from({ length: settings.cyclesBeforeLong }, (_, i) => i < state.done);
}

// Ajustes guardados → ajustes válidos
export function sanitizeSettings(raw = {}) {
  const clamp = (v, min, max, fallback) =>
    Number.isInteger(v) && v >= min && v <= max ? v : fallback;
  return {
    shortBreak: clamp(raw.shortBreak, 1, 30, DEFAULT_SETTINGS.shortBreak),
    longBreak: clamp(raw.longBreak, 5, 60, DEFAULT_SETTINGS.longBreak),
    cyclesBeforeLong: clamp(raw.cyclesBeforeLong, 2, 8, DEFAULT_SETTINGS.cyclesBeforeLong),
    autoStart: raw.autoStart === true,
  };
}
