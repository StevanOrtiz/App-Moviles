// Pruebas del recordatorio de racha. Ejecutar con: npm run test:unit
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { nextReminderDate, reminderContent } from '../src/utils/reminder.js';

const at = (y, m, d, h, min = 0) => new Date(y, m - 1, d, h, min);

describe('nextReminderDate', () => {
  test('antes de las 8 PM y sin estudiar: suena hoy a las 8 PM', () => {
    const next = nextReminderDate([], at(2026, 10, 14, 10));
    assert.deepEqual(next, at(2026, 10, 14, 20));
  });

  test('después de las 8 PM: suena mañana', () => {
    const next = nextReminderDate([], at(2026, 10, 14, 21));
    assert.deepEqual(next, at(2026, 10, 15, 20));
  });

  test('ya estudió hoy: suena mañana', () => {
    const sessions = [{ date: '2026-10-14' }];
    const next = nextReminderDate(sessions, at(2026, 10, 14, 10));
    assert.deepEqual(next, at(2026, 10, 15, 20));
  });

  test('estudió ayer pero no hoy: suena hoy', () => {
    const sessions = [{ date: '2026-10-13' }];
    const next = nextReminderDate(sessions, at(2026, 10, 14, 9));
    assert.deepEqual(next, at(2026, 10, 14, 20));
  });

  test('cambio de mes', () => {
    const next = nextReminderDate([{ date: '2026-10-31' }], at(2026, 10, 31, 8));
    assert.deepEqual(next, at(2026, 11, 1, 20));
  });
});

describe('reminderContent', () => {
  test('con racha menciona los días', () => {
    assert.match(reminderContent(12).body, /12 días/);
    assert.match(reminderContent(1).body, /1 día /);
  });

  test('sin racha invita a empezar', () => {
    assert.match(reminderContent(0).body, /Empieza/);
  });
});
