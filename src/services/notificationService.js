import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getCurrentStreak } from '../utils/streak';
import { nextReminderDate, reminderContent } from '../utils/reminder';

const CHANNEL_ID = 'recordatorios';

// expo-notifications no funciona en web
export const notificationsSupported = Platform.OS !== 'web';

// Cómo se muestra una notificación cuando la app está abierta
export async function configureNotifications() {
  if (!notificationsSupported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Recordatorios de racha',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#65D889',
    });
  }
}

export async function hasPermission() {
  if (!notificationsSupported) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// Pide el permiso solo cuando el usuario activa los recordatorios (no al abrir la app)
export async function requestPermission() {
  if (!notificationsSupported) return false;
  if (await hasPermission()) return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Un solo recordatorio pendiente a la vez: cada vez que cambian las sesiones se reprograma.
export async function scheduleStreakReminder(sessions) {
  if (!notificationsSupported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const { title, body } = reminderContent(getCurrentStreak(sessions));
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextReminderDate(sessions),
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelReminders() {
  if (!notificationsSupported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ---------- Push remoto (token del dispositivo en Firestore) ----------

const deviceRef = (uid, token) =>
  doc(db, 'users', uid, 'devices', token.replace(/[^A-Za-z0-9]/g, ''));

function getProjectId() {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
}

// Guarda el token de push en users/{uid}/devices/{id} para poder enviarle notificaciones remotas.
// Devuelve el token, o null si este entorno no puede obtener uno (simulador, Expo Go en Android,
// o proyecto sin projectId de EAS).
export async function registerPushToken(uid) {
  if (!notificationsSupported || !Device.isDevice) return null;
  const projectId = getProjectId();
  if (!projectId) return null;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await setDoc(deviceRef(uid, token), {
      token,
      platform: Platform.OS,
      updatedAt: serverTimestamp(),
    });
    return token;
  } catch (e) {
    console.warn('No se pudo registrar el token de push:', e.message);
    return null;
  }
}

export async function unregisterPushToken(uid, token) {
  if (!token) return;
  try {
    await deleteDoc(deviceRef(uid, token));
  } catch (e) {
    console.warn('No se pudo borrar el token de push:', e.message);
  }
}
