import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../config/firebase';

// Los correos de verificación y recuperación se envían en español
auth.languageCode = 'es';

export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function register(email, password) {
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
  // La verificación no bloquea el uso de la app; si falla el envío no se interrumpe el registro
  sendEmailVerification(user).catch(() => {});
  return user;
}

export async function signIn(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
  return user;
}

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email.trim());
}

export function logOut() {
  return signOut(auth);
}

// Firebase exige un inicio de sesión reciente para eliminar la cuenta
export async function reauthenticate(password) {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
  return user;
}

export function deleteCurrentUser() {
  return deleteUser(auth.currentUser);
}
