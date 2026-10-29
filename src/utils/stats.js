// Cálculos de estadísticas a partir de las sesiones. Funciones puras (sin React ni Firebase).
import { resolveSubjectId } from '../data/subjects.js';
// `sessions`: [{ id, date: "YYYY-MM-DD", duration, time: "10:30 AM", subjectId? }]

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toISO(date) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function totalMinutes(sessions) {
  return sessions.reduce((sum, s) => sum + s.duration, 0);
}

// Minutos y sesiones por materia, de mayor a menor. `subjectId: null` agrupa las sesiones sin materia.
export function statsBySubject(sessions) {
  const total = totalMinutes(sessions);
  const map = new Map();
  sessions.forEach((s) => {
    const key = resolveSubjectId(s.subjectId);
    const current = map.get(key) || { subjectId: key, minutes: 0, sessions: 0 };
    current.minutes += s.duration;
    current.sessions += 1;
    map.set(key, current);
  });
  return [...map.values()]
    .map((item) => ({ ...item, share: total > 0 ? item.minutes / total : 0 }))
    .sort((a, b) => b.minutes - a.minutes);
}

// Materia más estudiada (ignora "sin materia"); null si no hay ninguna
export function topSubject(sessions) {
  return statsBySubject(sessions).find((item) => item.subjectId) || null;
}

// Minutos por día de los últimos `days` días, terminando en `now`
export function minutesPerDay(sessions, days = 7, now = new Date()) {
  const byDate = new Map();
  sessions.forEach((s) => byDate.set(s.date, (byDate.get(s.date) || 0) + s.duration));
  const result = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const date = toISO(d);
    result.push({ date, label: DAY_LABELS[d.getDay()], minutes: byDate.get(date) || 0 });
  }
  return result;
}

// Promedio de minutos por día en que estudió
export function averagePerActiveDay(sessions) {
  const days = new Set(sessions.map((s) => s.date)).size;
  return days > 0 ? Math.round(totalMinutes(sessions) / days) : 0;
}

// Día con más minutos: { date, minutes } o null
export function bestDay(sessions) {
  const byDate = new Map();
  sessions.forEach((s) => byDate.set(s.date, (byDate.get(s.date) || 0) + s.duration));
  let best = null;
  byDate.forEach((minutes, date) => {
    if (!best || minutes > best.minutes) best = { date, minutes };
  });
  return best;
}

// "10:30 AM" -> 10, "12:05 AM" -> 0, "1:00 PM" -> 13; null si no se entiende
export function parseHour(time) {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time || '');
  if (!match) return null;
  const hour = Number(match[1]) % 12;
  return match[3].toUpperCase() === 'PM' ? hour + 12 : hour;
}

// Hora del día (0-23) en la que más estudia: { hour, minutes } o null
export function bestHour(sessions) {
  const byHour = new Map();
  sessions.forEach((s) => {
    const hour = parseHour(s.time);
    if (hour !== null) byHour.set(hour, (byHour.get(hour) || 0) + s.duration);
  });
  let best = null;
  byHour.forEach((minutes, hour) => {
    if (!best || minutes > best.minutes) best = { hour, minutes };
  });
  return best;
}

// Día de la semana con más minutos: { name, minutes } o null
export function bestWeekday(sessions) {
  const totals = Array(7).fill(0);
  sessions.forEach((s) => {
    totals[parseDate(s.date).getDay()] += s.duration;
  });
  const max = Math.max(...totals);
  if (max === 0) return null;
  const index = totals.indexOf(max);
  return { name: DAY_NAMES[index], minutes: max };
}

// Mapa de constancia: `weeks` columnas (semanas, lunes a domingo) con nivel 0-4 por día.
// Los días futuros salen con `future: true`.
export function heatmap(sessions, weeks = 12, now = new Date()) {
  const byDate = new Map();
  sessions.forEach((s) => byDate.set(s.date, (byDate.get(s.date) || 0) + s.duration));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const mondayOffset = (today.getDay() + 6) % 7;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset - (weeks - 1) * 7);

  const level = (minutes) => (minutes === 0 ? 0 : minutes < 25 ? 1 : minutes < 50 ? 2 : minutes < 100 ? 3 : 4);

  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d);
      const iso = toISO(date);
      return { date: iso, level: level(byDate.get(iso) || 0), future: date > today };
    }),
  );
}

// Comparación de los últimos 7 días con los 7 anteriores: porcentaje de cambio, o null sin base
export function weekOverWeek(sessions, now = new Date()) {
  const days = minutesPerDay(sessions, 14, now);
  const previous = days.slice(0, 7).reduce((sum, d) => sum + d.minutes, 0);
  const current = days.slice(7).reduce((sum, d) => sum + d.minutes, 0);
  return {
    current,
    previous,
    change: previous > 0 ? Math.round(((current - previous) / previous) * 100) : null,
  };
}

// Lunes de la semana de `now`, como "YYYY-MM-DD"
export function weekStartISO(now = new Date()) {
  const offset = (now.getDay() + 6) % 7;
  return toISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset));
}

// Progreso de las metas semanales (lunes a hoy): [{ subjectId, goal, minutes, progress (0-1), done }]
// `goals`: { [subjectId]: minutos por semana }
export function weeklyGoalProgress(sessions, goals = {}, now = new Date()) {
  const start = weekStartISO(now);
  const end = toISO(now);
  const minutes = new Map();
  sessions.forEach((s) => {
    const id = resolveSubjectId(s.subjectId);
    if (id && s.date >= start && s.date <= end) minutes.set(id, (minutes.get(id) || 0) + s.duration);
  });
  return Object.entries(goals)
    .filter(([, goal]) => goal > 0)
    .map(([subjectId, goal]) => {
      const done = minutes.get(subjectId) || 0;
      return { subjectId, goal, minutes: done, progress: Math.min(1, done / goal), done: done >= goal };
    })
    .sort((a, b) => b.progress - a.progress);
}

// Resumen de los últimos 7 días para compartir
export function weeklyReport(sessions, now = new Date()) {
  const days = minutesPerDay(sessions, 7, now);
  const from = days[0].date;
  const to = days[6].date;
  const week = sessions.filter((s) => s.date >= from && s.date <= to);
  const top = topSubject(week);
  const { change } = weekOverWeek(sessions, now);
  return {
    from,
    to,
    minutes: totalMinutes(week),
    sessions: week.length,
    activeDays: days.filter((d) => d.minutes > 0).length,
    topSubjectId: top ? top.subjectId : null,
    topSubjectMinutes: top ? top.minutes : 0,
    change,
  };
}
