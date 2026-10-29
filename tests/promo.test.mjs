// Pruebas de las promociones de Premium. Ejecutar con: npm run test:unit
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  markSeen,
  pickPromo,
  recordAccept,
  recordDismiss,
  recordShown,
} from '../src/utils/promo.js';

const DAY = 24 * 60 * 60 * 1000;
const start = new Date(2026, 9, 1, 10).getTime();
const ctx = { sessionsCount: 5, streak: 2, subjectName: 'Cálculo' };
const veteran = markSeen({}, start); // usuario que abrió la app el 1 de octubre

describe('pickPromo', () => {
  test('nada el primer día ni antes de la 2.ª sesión', () => {
    assert.equal(pickPromo(markSeen({}, start), 'session_completed', ctx, start + 1000), null);
    assert.equal(pickPromo(veteran, 'session_completed', { ...ctx, sessionsCount: 1 }, start + 2 * DAY), null);
  });

  test('nunca a Premium ni con el Pomodoro corriendo', () => {
    const t = start + 2 * DAY;
    assert.equal(pickPromo(veteran, 'session_completed', { ...ctx, isPremium: true }, t), null);
    assert.equal(pickPromo(veteran, 'session_completed', { ...ctx, isRunning: true }, t), null);
  });

  test('muestra una promo del evento y rellena el texto', () => {
    const promo = pickPromo(veteran, 'session_completed', ctx, start + 2 * DAY);
    assert.ok(['longer_session', 'goals'].includes(promo.id));
    const goals = pickPromo(
      recordShown(veteran, { id: 'longer_session', event: 'session_completed' }, ctx, start + 2 * DAY),
      'session_completed',
      ctx,
      start + 3 * DAY,
    );
    assert.equal(goals.title, 'Ponle una meta a Cálculo');
  });

  test('máximo una al día', () => {
    const t = start + 2 * DAY;
    const shown = recordShown(veteran, pickPromo(veteran, 'stats_opened', ctx, t), ctx, t);
    assert.equal(pickPromo(shown, 'ranking_opened', ctx, t + 60 * 1000), null);
    assert.ok(pickPromo(shown, 'ranking_opened', ctx, t + DAY));
  });

  test('la misma promo no se repite en 7 días', () => {
    const t = start + 2 * DAY;
    const shown = recordShown(veteran, pickPromo(veteran, 'ranking_opened', ctx, t), ctx, t);
    assert.equal(pickPromo(shown, 'ranking_opened', ctx, t + 3 * DAY), null);
    assert.ok(pickPromo(shown, 'ranking_opened', ctx, t + 8 * DAY));
  });

  test('máximo 3 por semana', () => {
    let state = veteran;
    let t = start + 2 * DAY;
    for (const event of ['stats_opened', 'ranking_opened', 'reminder_limit']) {
      state = recordShown(state, pickPromo(state, event, ctx, t), ctx, t);
      t += DAY;
    }
    assert.equal(pickPromo(state, 'app_open', ctx, t), null);
  });

  test('3 rechazos seguidos pausan 14 días', () => {
    let state = veteran;
    for (let i = 0; i < 3; i += 1) state = recordDismiss(state, start + 2 * DAY);
    assert.equal(pickPromo(state, 'app_open', ctx, start + 5 * DAY), null);
    assert.ok(pickPromo(state, 'app_open', ctx, start + 17 * DAY));
  });

  test('aceptar reinicia la cuenta de rechazos', () => {
    let state = recordDismiss(recordDismiss(veteran, start), start);
    state = recordDismiss(recordAccept(state), start);
    assert.equal(state.dismissStreak, 1);
    assert.equal(state.pausedUntil, null);
  });

  test('cada hito de racha se celebra una sola vez', () => {
    const t = start + 2 * DAY;
    const events = ['streak_milestone', 'session_completed'];
    const milestone = pickPromo(veteran, events, { ...ctx, streak: 7 }, t);
    assert.equal(milestone.id, 'shield');
    assert.equal(milestone.title, '¡7 días de racha!');
    const state = recordShown(veteran, milestone, { ...ctx, streak: 7 }, t);
    const later = pickPromo(state, events, { ...ctx, streak: 7 }, t + 10 * DAY);
    assert.notEqual(later?.id, 'shield');
    assert.equal(pickPromo(veteran, 'streak_milestone', { ...ctx, streak: 5 }, t), null);
  });
});
