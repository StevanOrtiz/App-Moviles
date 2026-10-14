// Lógica pura del recordatorio de racha (sin dependencias nativas, para poder probarla).
export const REMINDER_HOUR = 20; // 8:00 PM

function toISO(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// Próximo momento en que debe sonar el recordatorio:
// - hoy a las 8 PM si todavía no estudió hoy y aún no son las 8 PM;
// - si no, mañana a las 8 PM (ya estudió hoy, o ya pasó la hora).
export function nextReminderDate(sessions, now = new Date()) {
  const today = toISO(now);
  const studiedToday = (sessions || []).some((s) => s.date === today);

  const at = new Date(now);
  at.setHours(REMINDER_HOUR, 0, 0, 0);
  if (studiedToday || at <= now) at.setDate(at.getDate() + 1);
  return at;
}

export function reminderContent(streak) {
  if (streak > 0) {
    return {
      title: '🔥 ¡No pierdas tu racha!',
      body: `Llevas ${streak} ${streak === 1 ? 'día' : 'días'} seguidos. Un Pomodoro de 25 minutos y listo.`,
    };
  }
  return {
    title: '⏱ Hora de estudiar',
    body: 'Empieza hoy tu racha con un Pomodoro de 25 minutos.',
  };
}
