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

const monthKey = (d) => `${d.getFullYear()}-${d.getMonth()}`;

// ¿Se puede unir `earlier` con `later` en la misma racha?
// Con escudo (Premium) se perdona un solo día perdido por mes calendario.
function bridger(shields, used) {
  return (later, earlier) => {
    const gap = diffInDays(later, earlier);
    if (gap <= 1) return true;
    if (!shields || gap !== 2) return false;
    const missed = new Date(earlier.getFullYear(), earlier.getMonth(), earlier.getDate() + 1);
    const key = monthKey(missed);
    if (used.has(key)) return false;
    used.add(key);
    return true;
  };
}

// Racha actual y meses en que se usó el escudo
function walkCurrent(sessions, { shields = false, now = new Date() } = {}) {
  const used = new Set();
  if (!sessions || sessions.length === 0) return { streak: 0, used };

  const dates = getUniqueSortedDates(sessions);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const canBridge = bridger(shields, used);

  // Si la última sesión fue antes de ayer (y no hay escudo), la racha se rompió
  if (!canBridge(today, dates[dates.length - 1])) return { streak: 0, used: new Set() };

  let streak = 1;
  for (let i = dates.length - 1; i > 0; i--) {
    if (!canBridge(dates[i], dates[i - 1])) break;
    streak++;
  }
  return { streak, used };
}

// Días estudiados seguidos hasta hoy (o hasta ayer si hoy todavía no se ha estudiado).
// Los días perdonados por el escudo unen la racha pero no suman.
export function getCurrentStreak(sessions, options) {
  return walkCurrent(sessions, options).streak;
}

// true si la racha actual ya gastó el escudo de este mes
export function shieldUsedThisMonth(sessions, now = new Date()) {
  return walkCurrent(sessions, { shields: true, now }).used.has(monthKey(now));
}

// Racha más larga en todo el historial
export function getBestStreak(sessions, { shields = false } = {}) {
  if (!sessions || sessions.length === 0) return 0;

  const dates = getUniqueSortedDates(sessions);

  let best = 1;
  let current = 1;
  let used = new Set();
  for (let i = 1; i < dates.length; i++) {
    if (bridger(shields, used)(dates[i], dates[i - 1])) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 1;
      used = new Set();
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
