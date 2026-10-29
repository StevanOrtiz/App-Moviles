import {
  collection,
  doc,
  getDocsFromServer,
  increment,
  onSnapshot,
  serverTimestamp,
  updateDoc,
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
    subjectMinutes: data.subjectMinutes || {},
    premium: data.premium === true,
    // Timestamp -> milisegundos (el perfil se guarda en caché como JSON)
    premiumSince: data.premiumSince?.toMillis ? data.premiumSince.toMillis() : null,
    goals: data.goals || {},
    careerId: data.careerId || null,
    favoriteSubjects: data.favoriteSubjects || [],
    customSubjects: data.customSubjects || {},
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

export async function createProfile(uid, { name, universityId, careerId }) {
  const university = findUniversity(universityId);
  const batch = writeBatch(db);
  batch.set(userRef(uid), {
    name: name.trim(),
    universityId,
    universityName: university.name,
    ...(careerId ? { careerId } : {}),
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

export async function updateProfile(uid, currentProfile, { name, universityId, careerId }) {
  const university = findUniversity(universityId);
  const batch = writeBatch(db);
  batch.update(userRef(uid), {
    name: name.trim(),
    universityId,
    universityName: university.name,
    careerId: careerId || null,
    updatedAt: serverTimestamp(),
  });
  // Los minutos ya estudiados se quedan en la universidad anterior
  if (currentProfile.universityId !== universityId) {
    changeStudents(batch, currentProfile.universityId, -1);
    changeStudents(batch, universityId, 1);
  }
  await batch.commit();
}

// DEMO: Premium se activa con un botón. Cuando exista pasarela de pago, esto lo hará un backend.
export async function setPremium(uid, enabled) {
  await updateDoc(userRef(uid), {
    premium: enabled,
    premiumSince: enabled ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
}

// Metas semanales por materia: { [subjectId]: minutos } (Premium)
export async function setGoals(uid, goals) {
  await updateDoc(userRef(uid), { goals, updatedAt: serverTimestamp() });
}

// Materias favoritas y personalizadas del usuario
export async function setSubjectPrefs(uid, { favoriteSubjects, customSubjects }) {
  await updateDoc(userRef(uid), {
    ...(favoriteSubjects ? { favoriteSubjects } : {}),
    ...(customSubjects ? { customSubjects } : {}),
    updatedAt: serverTimestamp(),
  });
}

// Borra todo lo del usuario en Firestore (antes de eliminar la cuenta de Auth)
export async function deleteUserData(uid, profile) {
  // Sesiones, recordatorios y dispositivos (subcolecciones del usuario)
  const snapshots = await Promise.all(
    ['sessions', 'reminders', 'devices'].map((name) =>
      getDocsFromServer(collection(db, 'users', uid, name)),
    ),
  );
  const docs = snapshots.flatMap((snapshot) => snapshot.docs.map((d) => d.ref));

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
