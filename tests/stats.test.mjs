// Pruebas de las estadísticas. Ejecutar con: npm run test:unit
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  averagePerActiveDay,
  bestDay,
  bestHour,
  bestWeekday,
  heatmap,
  minutesPerDay,
  parseHour,
  statsBySubject,
  topSubject,
  weekOverWeek,
} from '../src/utils/stats.js';

const s = (date, duration, time = '10:30 AM', subjectId) => ({
  id: `${date}-${time}-${duration}`,
  date,
  duration,
  time,
  ...(subjectId ? { subjectId } : {}),
});

const sessions = [
  s('2026-10-26', 25, '10:30 AM', 'calculo'),
  s('2026-10-26', 25, '8:00 PM', 'calculo'),
  s('2026-10-27', 50, '8:15 PM', 'fisica'),
  s('2026-10-28', 25, '12:05 AM'),
];
const now = new Date(2026, 9, 28, 12);

describe('statsBySubject', () => {
  test('agrupa, ordena y calcula porcentajes', () => {
    const result = statsBySubject(sessions);
    assert.deepEqual(
      result.map((r) => [r.subjectId, r.minutes, r.sessions]),
      [
        ['calculo', 50, 2],
        ['fisica', 50, 1],
        [null, 25, 1],
      ],
    );
    assert.equal(Math.round(result[0].share * 100), 40);
  });

  test('sin sesiones devuelve lista vacía', () => {
    assert.deepEqual(statsBySubject([]), []);
  });

  test('topSubject ignora las sesiones sin materia', () => {
    assert.equal(topSubject(sessions).subjectId, 'calculo');
    assert.equal(topSubject([s('2026-10-28', 25)]), null);
  });
});

describe('tiempo', () => {
  test('parseHour entiende AM/PM y medianoche', () => {
    assert.equal(parseHour('10:30 AM'), 10);
    assert.equal(parseHour('12:05 AM'), 0);
    assert.equal(parseHour('12:00 PM'), 12);
    assert.equal(parseHour('1:00 PM'), 13);
    assert.equal(parseHour('basura'), null);
  });

  test('bestHour suma minutos por hora', () => {
    assert.deepEqual(bestHour(sessions), { hour: 20, minutes: 75 });
    assert.equal(bestHour([]), null);
  });

  test('minutesPerDay devuelve los últimos N días con ceros', () => {
    const days = minutesPerDay(sessions, 4, now);
    assert.deepEqual(days.map((d) => d.minutes), [0, 50, 50, 25]);
    assert.equal(days[3].date, '2026-10-28');
  });

  test('promedio por día activo y mejor día', () => {
    assert.equal(averagePerActiveDay(sessions), 42);
    assert.deepEqual(bestDay(sessions), { date: '2026-10-26', minutes: 50 });
    assert.equal(averagePerActiveDay([]), 0);
  });

  test('bestWeekday', () => {
    assert.equal(bestWeekday(sessions).minutes, 50);
    assert.equal(bestWeekday([]), null);
  });

  test('weekOverWeek compara con la semana anterior', () => {
    const data = [s('2026-10-20', 50), s('2026-10-27', 100)];
    assert.deepEqual(weekOverWeek(data, now), { current: 100, previous: 50, change: 100 });
    assert.equal(weekOverWeek([s('2026-10-27', 25)], now).change, null);
  });
});

describe('heatmap', () => {
  test('12 semanas x 7 días, hoy con nivel y futuro marcado', () => {
    const map = heatmap(sessions, 12, now);
    assert.equal(map.length, 12);
    assert.ok(map.every((week) => week.length === 7));
    const lastWeek = map[11];
    assert.equal(lastWeek[0].date, '2026-10-26');
    assert.equal(lastWeek[0].level, 3);
    assert.equal(lastWeek[2].date, '2026-10-28');
    assert.equal(lastWeek[3].future, true);
  });
});
