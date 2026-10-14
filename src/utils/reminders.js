// Días de la semana en el orden en que se muestran (lunes primero).
// `n` es el número que usa expo-notifications: 1 = domingo ... 7 = sábado.
export const WEEK_DAYS = [
  { n: 2, short: 'L', name: 'Lun' },
  { n: 3, short: 'M', name: 'Mar' },
  { n: 4, short: 'X', name: 'Mié' },
  { n: 5, short: 'J', name: 'Jue' },
  { n: 6, short: 'V', name: 'Vie' },
  { n: 7, short: 'S', name: 'Sáb' },
  { n: 1, short: 'D', name: 'Dom' },
];

export const ALL_DAYS = WEEK_DAYS.map((d) => d.n);

// 7, 30 → "7:30 AM"
export function formatReminderTime(hour, minute) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}

// [1..7] → "Todos los días", [2,3,4,5,6] → "Lun · Mar · Mié · Jue · Vie"
export function describeDays(days) {
  const set = new Set(days);
  if (set.size === 7) return 'Todos los días';
  return WEEK_DAYS.filter((d) => set.has(d.n))
    .map((d) => d.name)
    .join(' · ');
}
