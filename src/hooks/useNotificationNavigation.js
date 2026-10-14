import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { navigationRef } from '../navigation/navigationRef';
import { NOTIFICATIONS_SUPPORTED, NOTIFICATION_SCREENS } from '../services/notificationService';

// Notificaciones ya atendidas en esta sesión (para no navegar dos veces por la misma)
const handled = new Set();

function openScreen(response) {
  const request = response?.notification?.request;
  const screen = request?.content?.data?.screen;
  if (!request) return;
  // Un recordatorio repetitivo conserva su identificador: la fecha distingue cada aviso
  const key = `${request.identifier}:${response.notification.date}`;
  if (handled.has(key)) return;
  if (!NOTIFICATION_SCREENS.includes(screen) || !navigationRef.isReady()) return;
  handled.add(key);
  navigationRef.navigate(screen);
}

// Abre la pantalla indicada en `data.screen` cuando el usuario toca una notificación:
//   - app abierta o en segundo plano → listener de respuesta
//   - app cerrada → getLastNotificationResponseAsync
// `enabled` debe ser true solo cuando ya está montada la navegación principal.
export default function useNotificationNavigation(enabled) {
  useEffect(() => {
    if (!enabled || !NOTIFICATIONS_SUPPORTED) return undefined;

    let active = true;
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (active && response) openScreen(response);
    });
    const subscription = Notifications.addNotificationResponseReceivedListener(openScreen);

    return () => {
      active = false;
      subscription.remove();
    };
  }, [enabled]);
}
