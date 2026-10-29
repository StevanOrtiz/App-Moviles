// Pruebas de la racha y el escudo Premium. Ejecutar con: npm run test:unit
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { getBestStreak, getCurrentStreak, shieldUsedThisMonth } from '../src/utils/streak.js';

const days = (...dates) => dates.map((date, i) => ({ id: String(i), date, duration: 25 }));
const now = new Date(2026, 9, 28, 12); // 28 oct 2026

describe('racha sin escudo', () => {
  test('cuenta días seguidos hasta hoy', () => {
    assert.equal(getCurrentStreak(days('2026-10-26', '2026-10-27', '2026-10-28'), { now }), 3);
  });

  test('sigue viva si estudió ayer', () => {
    assert.equal(getCurrentStreak(days('2026-10-26', '2026-10-27'), { now }), 2);
  });

  test('un día perdido la rompe', () => {
    assert.equal(getCurrentStreak(days('2026-10-24', '2026-10-25', '2026-10-27', '2026-10-28'), { now }), 2);
    assert.equal(getCurrentStreak(days('2026-10-25', '2026-10-26'), { now }), 0);
  });
});

describe('escudo de racha (Premium)', () => {
  test('perdona un día perdido en el mes', () => {
    const s = days('2026-10-24', '2026-10-25', '2026-10-27', '2026-10-28');
    assert.equal(getCurrentStreak(s, { shields: true, now }), 4);
    assert.equal(shieldUsedThisMonth(s, now), true);
  });

  test('mantiene viva la racha si ayer no estudió', () => {
    assert.equal(getCurrentStreak(days('2026-10-25', '2026-10-26'), { shields: true, now }), 2);
  });

  test('solo un día por mes: el segundo hueco del mismo mes rompe', () => {
    const s = days('2026-10-20', '2026-10-22', '2026-10-23', '2026-10-25', '2026-10-26', '2026-10-27');
    assert.equal(getCurrentStreak(s, { shields: true, now }), 5);
  });

  test('meses distintos tienen escudos distintos', () => {
    const s = days('2026-09-28', '2026-09-30', '2026-10-01', '2026-10-03', '2026-10-04');
    const end = new Date(2026, 9, 4);
    assert.equal(getCurrentStreak(s, { shields: true, now: end }), 5);
  });

  test('dos días perdidos seguidos no se perdonan', () => {
    assert.equal(getCurrentStreak(days('2026-10-24', '2026-10-27', '2026-10-28'), { shields: true, now }), 2);
  });

  test('sin usar el escudo no aparece como usado', () => {
    assert.equal(shieldUsedThisMonth(days('2026-10-27', '2026-10-28'), now), false);
  });

  test('la mejor racha también usa el escudo', () => {
    const s = days('2026-10-01', '2026-10-02', '2026-10-04', '2026-10-05');
    assert.equal(getBestStreak(s), 2);
    assert.equal(getBestStreak(s, { shields: true }), 4);
  });

  test('la racha nunca supera el número de días estudiados', () => {
    const s = days('2026-10-24', '2026-10-26', '2026-10-28');
    assert.ok(getCurrentStreak(s, { shields: true, now }) <= s.length);
  });
});
