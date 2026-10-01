import {
  collection,
  doc,
  getDocsFromServer,
  increment,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { findUniversity } from '../data/universities';

export const userRef = (uid) => doc(db, 'users', uid);
export const universityRef = (id) => doc(db, 'universities', id);

// Suma o resta un estudiante a la universidad (la crea si todavía no existe)
function changeStudents(batch, universityId, delta) {
  const university = findUniversity(universityId);
  batch.set(
    universityRef(universityId),
    {
      name: university ? university.name : universityId,
      students: increment(delta),
      totalMinutes: increment(0),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

// Convierte el documento de Firestore en un objeto plano (serializable para la caché)
function toProfile(snapshot) {
  const data = snapshot.data();
  return {
    uid: snapshot.id,
    name: data.name,
    universityId: data.universityId,
    universityName: data.universityName,
    totalMinutes: data.totalMinutes || 0,
    sessions: data.sessions || 0,
    currentStreak: data.currentStreak || 0,
    bestStreak: data.bestStreak || 0,
    lastSessionDate: data.lastSessionDate || null,
  };
}

// onChange(profile | null, { fromCache })
export function subscribeToProfile(uid, onChange, onError) {
  return onSnapshot(
    userRef(uid),
    (snapshot) =>
      onChange(snapshot.exists() ? toProfile(snapshot) : null, {
        fromCache: snapshot.metadata.fromCache,
      }),
    onError,
  );
}

export async function createProfile(uid, { name, universityId }) {
  const university = findUniversity(universityId);
  const batch = writeBatch(db);
  batch.set(userRef(uid), {
    name: name.trim(),
    universityId,
    universityName: university.name,
    totalMinutes: 0,
    sessions: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastSessionDate: null,
    lastSessionId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  changeStudents(batch, universityId, 1);
  await batch.commit();
}

export async function updateProfile(uid, currentProfile, { name, universityId }) {
  const university = findUniversity(universityId);
  const batch = writeBatch(db);
  batch.update(userRef(uid), {
    name: name.trim(),
    universityId,
    universityName: university.name,
    updatedAt: serverTimestamp(),
  });
  // Los minutos ya estudiados se quedan en la universidad anterior
  if (currentProfile.universityId !== universityId) {
    changeStudents(batch, currentProfile.universityId, -1);
    changeStudents(batch, universityId, 1);
  }
  await batch.commit();
}

// Borra todo lo del usuario en Firestore (antes de eliminar la cuenta de Auth)
export async function deleteUserData(uid, profile) {
  const sessions = await getDocsFromServer(collection(db, 'users', uid, 'sessions'));
  const docs = sessions.docs.map((d) => d.ref);

  // Un batch admite hasta 500 operaciones
  for (let i = 0; i < docs.length; i += 450) {
    const batch = writeBatch(db);
    docs.slice(i, i + 450).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  const batch = writeBatch(db);
  batch.delete(userRef(uid));
  if (profile?.universityId) changeStudents(batch, profile.universityId, -1);
  await batch.commit();
}
