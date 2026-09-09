// Convierte "YYYY-MM-DD" a un Date a medianoche local
function parseDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function diffInDays(a, b) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);
}

function getUniqueSortedDates(sessions) {
  const uniqueDates = [...new Set(sessions.map((s) => s.date))];
  return uniqueDates.map(parseDate).sort((a, b) => a - b);
}

// Días consecutivos hasta hoy (o hasta ayer si hoy todavía no se ha estudiado)
export function getCurrentStreak(sessions) {
  if (!sessions || sessions.length === 0) return 0;

  const dates = getUniqueSortedDates(sessions);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDate = dates[dates.length - 1];
  const daysSinceLast = diffInDays(today, lastDate);

  // Si la última sesión fue hace más de 1 día, la racha se rompió
  if (daysSinceLast > 1) return 0;

  let streak = 1;
  for (let i = dates.length - 1; i > 0; i--) {
    const gap = diffInDays(dates[i], dates[i - 1]);
    if (gap === 1) {
      streak++;
    } else if (gap === 0) {
      continue;
    } else {
      break;
    }
  }
  return streak;
}

// Racha consecutiva más larga en todo el historial
export function getBestStreak(sessions) {
  if (!sessions || sessions.length === 0) return 0;

  const dates = getUniqueSortedDates(sessions);

  let best = 1;
  let current = 1;
  for (let i = 1; i < dates.length; i++) {
    const gap = diffInDays(dates[i], dates[i - 1]);
    if (gap === 1) {
      current++;
      best = Math.max(best, current);
    } else if (gap > 1) {
      current = 1;
    }
  }
  return best;
}

// Array de 7 días (Lunes a Domingo de la semana actual) con { label, completed }
export function getWeekIndicator(sessions) {
  const dateSet = new Set((sessions || []).map((s) => s.date));
  const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const today = new Date();
  const jsDay = today.getDay(); // 0 = domingo
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const result = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    result.push({ label: labels[i], completed: dateSet.has(iso) });
  }
  return result;
}
