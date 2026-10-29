// Promociones de Premium que no cansan. Funciones puras: el estado se guarda en AsyncStorage.
//
// Reglas:
//   - nunca a usuarios Premium ni con el Pomodoro corriendo
//   - nada el primer día de uso ni antes de la 2.ª sesión
//   - máximo 1 al día y 3 por semana
//   - la misma promo no se repite en 7 días (se elige la menos vista)
//   - 3 "Ahora no" seguidos → pausa de 14 días
//   - cada hito de racha se celebra una sola vez

const DAY = 24 * 60 * 60 * 1000;
export const MILESTONES = [3, 7, 14, 30, 60, 100];

export const PROMOS = [
  {
    id: 'shield',
    event: 'streak_milestone',
    emoji: '🛡️',
    title: '¡{streak} días de racha!',
    body: 'Protégela: con el Escudo de racha un día perdido al mes no la rompe.',
  },
  {
    id: 'longer_session',
    event: 'session_completed',
    emoji: '⏱️',
    title: '¿Y si la próxima es de 50?',
    body: 'Con Premium eliges sesiones de 15, 45, 50 o 60 minutos.',
  },
  {
    id: 'goals',
    event: 'session_completed',
    requires: 'subjectName',
    emoji: '🎯',
    title: 'Ponle una meta a {subjectName}',
    body: 'Define minutos por semana para cada materia y celebra cada logro.',
  },
  {
    id: 'stats_insights',
    event: 'stats_opened',
    emoji: '📊',
    title: 'Descubre tu mejor hora',
    body: 'Mira cuándo rindes más, tu mapa de constancia y cómo vas frente a la semana pasada.',
  },
  {
    id: 'ranking_crown',
    event: 'ranking_opened',
    emoji: '👑',
    title: 'Destaca en el ranking',
    body: 'Los miembros Premium llevan corona y marco dorado frente a todos.',
  },
  {
    id: 'reminders',
    event: 'reminder_limit',
    emoji: '🔔',
    title: '¿Necesitas más recordatorios?',
    body: 'Con Premium programas hasta 10 recordatorios de estudio.',
  },
  {
    id: 'custom_goals',
    event: 'custom_subjects',
    emoji: '✏️',
    title: 'Ya tienes tus propias materias',
    body: 'Con Premium les pones metas semanales y ves cuánto avanzas en cada una.',
  },
  {
    id: 'weekly_report',
    event: 'app_open',
    emoji: '📤',
    title: 'Tu semana en una tarjeta',
    body: 'Comparte tu informe semanal: minutos, días activos y tu materia top.',
  },
  {
    id: 'welcome_back',
    event: 'app_open',
    emoji: '✨',
    title: 'Estudia como los mejores',
    body: 'Estadísticas pro, escudo de racha, metas por materia y mucho más.',
  },
];

export const emptyPromoState = () => ({
  firstSeenAt: null,
  lastShownAt: null,
  history: [],
  dismissStreak: 0,
  pausedUntil: null,
  milestonesShown: [],
});

const sameDay = (a, b) => {
  const x = new Date(a);
  const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
};

const fill = (text, ctx) => text.replace(/\{(\w+)\}/g, (_, key) => String(ctx[key] ?? ''));

// Devuelve la promo a mostrar para `events` (uno o varios, en orden de prioridad) o null.
// ctx: { isPremium, isRunning, sessionsCount, streak, subjectName }
export function pickPromo(state, events, ctx = {}, now = Date.now()) {
  const s = { ...emptyPromoState(), ...state };
  if (ctx.isPremium || ctx.isRunning) return null;
  if (!s.firstSeenAt || now - s.firstSeenAt < DAY) return null;
  if ((ctx.sessionsCount || 0) < 2) return null;
  if (s.pausedUntil && now < s.pausedUntil) return null;
  if (s.lastShownAt && sameDay(s.lastShownAt, now)) return null;
  if (s.history.filter((h) => now - h.at < 7 * DAY).length >= 3) return null;

  const timesShown = (id) => s.history.filter((h) => h.id === id).length;
  const recentlyShown = (id) => s.history.some((h) => h.id === id && now - h.at < 7 * DAY);

  for (const event of [].concat(events)) {
    if (event === 'streak_milestone') {
      if (!MILESTONES.includes(ctx.streak) || s.milestonesShown.includes(ctx.streak)) continue;
    }
    const candidates = PROMOS.filter(
      (p) => p.event === event && (!p.requires || ctx[p.requires]) && !recentlyShown(p.id),
    ).sort((a, b) => timesShown(a.id) - timesShown(b.id));
    if (candidates.length > 0) {
      const promo = candidates[0];
      return { ...promo, title: fill(promo.title, ctx), body: fill(promo.body, ctx) };
    }
  }
  return null;
}

export function markSeen(state, now = Date.now()) {
  const s = { ...emptyPromoState(), ...state };
  return s.firstSeenAt ? s : { ...s, firstSeenAt: now };
}

export function recordShown(state, promo, ctx = {}, now = Date.now()) {
  const s = { ...emptyPromoState(), ...state };
  return {
    ...s,
    lastShownAt: now,
    history: [...s.history.filter((h) => now - h.at < 60 * DAY), { id: promo.id, at: now }],
    milestonesShown:
      promo.event === 'streak_milestone' ? [...s.milestonesShown, ctx.streak] : s.milestonesShown,
  };
}

export function recordDismiss(state, now = Date.now()) {
  const s = { ...emptyPromoState(), ...state };
  const dismissStreak = s.dismissStreak + 1;
  return dismissStreak >= 3
    ? { ...s, dismissStreak: 0, pausedUntil: now + 14 * DAY }
    : { ...s, dismissStreak };
}

export function recordAccept(state) {
  return { ...emptyPromoState(), ...state, dismissStreak: 0 };
}
