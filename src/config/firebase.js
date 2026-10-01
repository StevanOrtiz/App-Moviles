import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApp, getApps } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

// Evita inicializar dos veces con Fast Refresh
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// En iOS/Android la sesión se guarda en AsyncStorage para que sobreviva al cerrar la app.
// getReactNativePersistence solo existe en el bundle "react-native" de firebase/auth.
function createAuth() {
  if (Platform.OS === 'web') return FirebaseAuth.getAuth(app);
  try {
    return FirebaseAuth.initializeAuth(app, {
      persistence: FirebaseAuth.getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    // initializeAuth lanza error si ya fue llamado (Fast Refresh)
    return FirebaseAuth.getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app);

// Google Analytics (firebase/analytics) solo funciona en navegador.
// En iOS/Android se omite; para analítica nativa se requiere @react-native-firebase.
export async function initAnalytics() {
  if (Platform.OS !== 'web') return null;
  const { getAnalytics, isSupported } = await import('firebase/analytics');
  return (await isSupported()) ? getAnalytics(app) : null;
}
