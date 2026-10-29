// Pruebas de los ciclos del Pomodoro. Ejecutar con: npm run test:unit
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SETTINGS,
  cycleDots,
  initialCycle,
  nextPhase,
  phaseSeconds,
  sanitizeSettings,
  skipBreak,
} from '../src/utils/pomodoro.js';

describe('ciclos', () => {
  test('enfoque → corto ×3 y largo en el 4.º', () => {
    let s = initialCycle();
    const phases = [];
    for (let i = 0; i < 8; i += 1) {
      s = nextPhase(s);
      phases.push(s.phase);
    }
    assert.deepEqual(phases, [
      'shortBreak', 'focus', 'shortBreak', 'focus', 'shortBreak', 'focus', 'longBreak', 'focus',
    ]);
    assert.equal(s.done, 0);
  });

  test('saltar el descanso vuelve a enfoque sin perder la cuenta', () => {
    const s = skipBreak(nextPhase(initialCycle()));
    assert.deepEqual(s, { phase: 'focus', done: 1 });
    assert.deepEqual(skipBreak(initialCycle()), initialCycle());
  });

  test('puntos de la tanda', () => {
    assert.deepEqual(cycleDots({ phase: 'focus', done: 2 }), [true, true, false, false]);
  });

  test('respeta cyclesBeforeLong', () => {
    const settings = { ...DEFAULT_SETTINGS, cyclesBeforeLong: 2 };
    let s = nextPhase(initialCycle(), settings);
    s = nextPhase(nextPhase(s, settings), settings);
    assert.equal(s.phase, 'longBreak');
  });
});

describe('duraciones y ajustes', () => {
  test('segundos por fase', () => {
    assert.equal(phaseSeconds('focus', DEFAULT_SETTINGS, 50), 3000);
    assert.equal(phaseSeconds('shortBreak'), 300);
    assert.equal(phaseSeconds('longBreak'), 900);
  });

  test('sanitizeSettings corrige valores inválidos', () => {
    assert.deepEqual(sanitizeSettings({ shortBreak: 0, longBreak: 20, cyclesBeforeLong: 'x', autoStart: 1 }), {
      shortBreak: 5,
      longBreak: 20,
      cyclesBeforeLong: 4,
      autoStart: false,
    });
  });
});
