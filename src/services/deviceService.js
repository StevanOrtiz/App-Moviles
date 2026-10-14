import { Platform } from 'react-native';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getCachedPushToken, saveCachedPushToken } from '../utils/storage';

// users/{uid}/devices/{deviceId}  →  token de push de cada dispositivo del usuario.
// Un backend (por ejemplo Cloud Functions) lee estos tokens para enviarle avisos.
const deviceId = (token) => token.replace(/[^A-Za-z0-9]/g, '');
const deviceRef = (uid, token) => doc(db, 'users', uid, 'devices', deviceId(token));

export async function saveDeviceToken(uid, token) {
  await saveCachedPushToken(uid, token);
  await setDoc(deviceRef(uid, token), {
    token,
    platform: Platform.OS,
    updatedAt: serverTimestamp(),
  });
}

// Se llama antes de cerrar sesión para no seguir avisándole a este dispositivo
export async function removeDeviceToken(uid) {
  const token = await getCachedPushToken(uid);
  if (!token) return;
  await deleteDoc(deviceRef(uid, token));
  await saveCachedPushToken(uid, null);
}
