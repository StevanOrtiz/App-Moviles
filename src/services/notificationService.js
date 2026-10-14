import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { getCurrentStreak } from '../utils/streak';
import { nextReminderDate, reminderContent } from '../utils/reminder';

// Las notificaciones solo existen en Android e iOS (en web no se programan).
export const NOTIFICATIONS_SUPPORTED = Platform.OS === 'android' || Platform.OS === 'ios';

export const CHANNEL_ID = 'default';
const REMINDER_PREFIX = 'reminder_';
const POMODORO_ALARM_ID = 'pomodoro_alarm';
const STREAK_REMINDER_ID = 'streak_reminder';

// Pantallas a las que una notificación puede llevar al tocarla
export const NOTIFICATION_SCREENS = ['Inicio', 'Recordatorios'];

// Se configura una sola vez al abrir la app (App.js).
// Con la app abierta se muestra el aviso, salvo el del Pomodoro: ahí la app ya
// muestra su propia ventana de "Sesión completada".
export function configureNotifications() {
  if (!NOTIFICATIONS_SUPPORTED) return;
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const show = notification.request.content.data?.kind !== 'pomodoro';
      return {
        shouldPlaySound: show,
        shouldSetBadge: false,
        shouldShowBanner: show,
        shouldShowList: show,
      };
    },
  });
}

// Android 8+: cada notificación pertenece a un canal. Debe existir antes de pedir el permiso.
async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Recordatorios de estudio',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#65D889',
  });
}

// { status: 'undetermined' | 'granted' | 'denied' | 'unsupported', canAskAgain }
export async function getPermission() {
  if (!NOTIFICATIONS_SUPPORTED) return { status: 'unsupported', canAskAgain: false };
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  return { status, canAskAgain };
}

// Pide el permiso solo si hace falta. Si el sistema ya no deja preguntar
// (canAskAgain === false) la pantalla ofrece ir a Ajustes.
export async function requestPermission() {
  if (!NOTIFICATIONS_SUPPORTED) return { status: 'unsupported', canAskAgain: false };
  await ensureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted' || !current.canAskAgain) {
    return { status: current.status, canAskAgain: current.canAskAgain };
  }
  const next = await Notifications.requestPermissionsAsync();
  return { status: next.status, canAskAgain: next.canAskAgain };
}

// Expo Push Token del dispositivo (null si no se puede obtener).
// Las push remotas exigen un celular físico, un development build y el projectId de EAS.
export async function registerForPushToken() {
  if (!NOTIFICATIONS_SUPPORTED || !Device.isDevice) return null;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;
    await ensureAndroidChannel();
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('Push remotas desactivadas: falta extra.eas.projectId (ejecuta "eas init").');
      return null;
    }
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (e) {
    // Expo Go en Android (SDK 53+) no soporta push remotas
    console.warn('No se pudo obtener el token de push:', e.message);
    return null;
  }
}

// ---------- Recordatorios de estudio (notificaciones locales repetitivas) ----------

// Los días son números 1-7 con 1 = domingo (convención de expo-notifications).
function reminderRequests(reminder) {
  const content = {
    title: reminder.title,
    body: '¡Es hora de estudiar! Mantén tu racha 🔥',
    sound: 'default',
    data: { kind: 'reminder', reminderId: reminder.id, screen: 'Inicio' },
  };
  const { hour, minute } = reminder;
  const everyDay = new Set(reminder.days).size === 7;

  if (everyDay) {
    return [
      {
        identifier: `${REMINDER_PREFIX}${reminder.id}_all`,
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: CHANNEL_ID,
        },
      },
    ];
  }
  return reminder.days.map((weekday) => ({
    identifier: `${REMINDER_PREFIX}${reminder.id}_${weekday}`,
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  }));
}

async function cancelReminderNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(REMINDER_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

// Una sola sincronización a la vez para que dos cambios seguidos no se pisen
let queue = Promise.resolve();

function enqueue(task) {
  queue = queue.then(task).catch((e) => console.warn('Notificaciones:', e.message));
  return queue;
}

// Deja programadas exactamente las notificaciones de los recordatorios activos.
export function syncReminderNotifications(reminders) {
  if (!NOTIFICATIONS_SUPPORTED) return Promise.resolve();
  return enqueue(async () => {
    await cancelReminderNotifications();
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    await ensureAndroidChannel();
    for (const reminder of reminders.filter((r) => r.enabled)) {
      for (const request of reminderRequests(reminder)) {
        await Notifications.scheduleNotificationAsync(request);
      }
    }
  });
}

export function cancelAllReminderNotifications() {
  if (!NOTIFICATIONS_SUPPORTED) return Promise.resolve();
  return enqueue(cancelReminderNotifications);
}

// ---------- Recordatorio de racha (8:00 PM si aún no estudió hoy) ----------

export async function hasPermission() {
  const { status } = await getPermission();
  return status === 'granted';
}

// Un solo recordatorio de racha pendiente: se reprograma cada vez que cambian las sesiones.
// Solo toca su propia notificación; los recordatorios de estudio y la alarma siguen intactos.
export function scheduleStreakReminder(sessions) {
  if (!NOTIFICATIONS_SUPPORTED) return Promise.resolve();
  return enqueue(async () => {
    await Notifications.cancelScheduledNotificationAsync(STREAK_REMINDER_ID).catch(() => {});
    if (!(await hasPermission())) return;
    await ensureAndroidChannel();
    const { title, body } = reminderContent(getCurrentStreak(sessions));
    await Notifications.scheduleNotificationAsync({
      identifier: STREAK_REMINDER_ID,
      content: { title, body, sound: 'default', data: { kind: 'streak', screen: 'Inicio' } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nextReminderDate(sessions),
        channelId: CHANNEL_ID,
      },
    });
  });
}

export function cancelStreakReminder() {
  if (!NOTIFICATIONS_SUPPORTED) return Promise.resolve();
  return enqueue(() =>
    Notifications.cancelScheduledNotificationAsync(STREAK_REMINDER_ID).catch(() => {}),
  );
}

// ---------- Alarma del Pomodoro ----------

// Avisa cuando termina el Pomodoro aunque la app esté en segundo plano.
export async function schedulePomodoroAlarm(seconds) {
  if (!NOTIFICATIONS_SUPPORTED || seconds < 1) return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    await Notifications.scheduleNotificationAsync({
      identifier: POMODORO_ALARM_ID,
      content: {
        title: '¡Pomodoro terminado! 🎉',
        body: 'Completaste tu sesión de estudio. Tu racha sigue viva.',
        sound: 'default',
        data: { kind: 'pomodoro', screen: 'Inicio' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.ceil(seconds),
        channelId: CHANNEL_ID,
      },
    });
  } catch (e) {
    console.warn('No se pudo programar la alarma del Pomodoro:', e.message);
  }
}

export async function cancelPomodoroAlarm() {
  if (!NOTIFICATIONS_SUPPORTED) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(POMODORO_ALARM_ID);
  } catch (e) {
    // no había alarma programada
  }
}

// Notificación inmediata para comprobar que todo funciona
export async function sendTestNotification() {
  if (!NOTIFICATIONS_SUPPORTED) return;
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'UniStreak 🔥',
      body: '¡Las notificaciones funcionan! Toca para abrir el inicio.',
      sound: 'default',
      data: { kind: 'test', screen: 'Inicio' },
    },
    trigger: null,
  });
}
