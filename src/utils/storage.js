import AsyncStorage from '@react-native-async-storage/async-storage';

// Caché local del dispositivo. La fuente de verdad es Firestore; aquí solo se guarda
// una copia por usuario (para abrir la app sin red) y la cola de sesiones pendientes.
const KEYS = {
  ONBOARDING: 'onboardingCompleted',
  RANKING: 'ranking:cache',
  profile: (uid) => `profile:${uid}`,
  sessions: (uid) => `sessions:${uid}`,
  outbox: (uid) => `outbox:${uid}`,
  reminders: (uid) => `reminders:${uid}`,
  reminderList: (uid) => `reminderList:${uid}`,
  pushToken: (uid) => `pushToken:${uid}`,
  // Claves de la versión sin cuenta (solo para migrar)
  LEGACY_USER: 'user',
  LEGACY_SESSIONS: 'sessions',
};

async function readJson(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

async function writeJson(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('No se pudo guardar la información.');
  }
}

export const getOnboarding = () => readJson(KEYS.ONBOARDING, false);
export const saveOnboarding = (value) => writeJson(KEYS.ONBOARDING, value);

export const getCachedProfile = (uid) => readJson(KEYS.profile(uid), null);
export const saveCachedProfile = (uid, profile) => writeJson(KEYS.profile(uid), profile);

export const getCachedSessions = (uid) => readJson(KEYS.sessions(uid), []);
export const saveCachedSessions = (uid, sessions) => writeJson(KEYS.sessions(uid), sessions);

export const getOutbox = (uid) => readJson(KEYS.outbox(uid), []);
export const saveOutbox = (uid, items) => writeJson(KEYS.outbox(uid), items);

// Preferencia de recordatorios: { enabled: boolean, pushToken: string | null }
export const getReminderPrefs = (uid) =>
  readJson(KEYS.reminders(uid), { enabled: false, pushToken: null });
export const saveReminderPrefs = (uid, prefs) => writeJson(KEYS.reminders(uid), prefs);

// Copia local de los recordatorios de estudio (la fuente de verdad es Firestore)
export const getCachedReminders = (uid) => readJson(KEYS.reminderList(uid), null);
export const saveCachedReminders = (uid, reminders) => writeJson(KEYS.reminderList(uid), reminders);

// Token de push de este dispositivo (para quitarlo de Firestore al cerrar sesión)
export const getCachedPushToken = (uid) => readJson(KEYS.pushToken(uid), null);
export const saveCachedPushToken = (uid, token) => writeJson(KEYS.pushToken(uid), token);

// Una copia por filtro: `ranking:cache` (todas las materias) o `ranking:cache:{materia}`
const rankingKey = (subjectId) => (subjectId ? `${KEYS.RANKING}:${subjectId}` : KEYS.RANKING);
export const getCachedRanking = (subjectId = null) => readJson(rankingKey(subjectId), null);
export const saveCachedRanking = (ranking, subjectId = null) =>
  writeJson(rankingKey(subjectId), ranking);

export async function clearUserCache(uid) {
  try {
    await AsyncStorage.multiRemove([
      KEYS.profile(uid),
      KEYS.sessions(uid),
      KEYS.outbox(uid),
      KEYS.reminders(uid),
      KEYS.reminderList(uid),
      KEYS.pushToken(uid),
    ]);
  } catch (e) {
    // sin efecto: la caché se reescribe en el próximo inicio de sesión
  }
}

// Datos guardados por la versión anterior de la app (antes de tener cuentas)
export async function getLegacyData() {
  const [user, sessions] = await Promise.all([
    readJson(KEYS.LEGACY_USER, null),
    readJson(KEYS.LEGACY_SESSIONS, []),
  ]);
  return { user, sessions };
}

export async function clearLegacyData() {
  try {
    await AsyncStorage.multiRemove([KEYS.LEGACY_USER, KEYS.LEGACY_SESSIONS]);
  } catch (e) {
    // se volverá a intentar en el próximo inicio
  }
}
