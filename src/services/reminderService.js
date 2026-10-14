import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// users/{uid}/reminders/{id}
//   title, hour (0-23), minute (0-59), days (1-7, 1 = domingo), enabled, createdAt, updatedAt
export const MAX_REMINDERS = 10;

const remindersRef = (uid) => collection(db, 'users', uid, 'reminders');
const reminderRef = (uid, id) => doc(db, 'users', uid, 'reminders', id);

function toReminder(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    title: data.title,
    hour: data.hour,
    minute: data.minute,
    days: data.days || [],
    enabled: data.enabled !== false,
  };
}

// Ordena por hora del día
export function sortReminders(list) {
  return [...list].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
}

// onChange(reminders, { fromCache, hasPendingWrites })
export function subscribeToReminders(uid, onChange, onError) {
  return onSnapshot(
    remindersRef(uid),
    (snapshot) =>
      onChange(sortReminders(snapshot.docs.map(toReminder)), {
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      }),
    onError,
  );
}

export function addReminder(uid, { title, hour, minute, days }) {
  return addDoc(remindersRef(uid), {
    title: title.trim(),
    hour,
    minute,
    days: [...days].sort((a, b) => a - b),
    enabled: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function updateReminder(uid, id, changes) {
  const data = { ...changes, updatedAt: serverTimestamp() };
  if (data.title !== undefined) data.title = data.title.trim();
  if (data.days) data.days = [...data.days].sort((a, b) => a - b);
  return updateDoc(reminderRef(uid, id), data);
}

export function deleteReminder(uid, id) {
  return deleteDoc(reminderRef(uid, id));
}
