import { collection, getDocsFromServer, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getCachedRanking, saveCachedRanking } from '../utils/storage';

const MAX_RESULTS = 50;

function daysBetween(fromISO, to) {
  const [y, m, d] = fromISO.split('-').map(Number);
  const from = new Date(y, m - 1, d);
  const today = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((today - from) / (24 * 60 * 60 * 1000));
}

// La racha guardada solo sigue viva si estudió hoy o ayer
function activeStreak(user, now) {
  if (!user.lastSessionDate) return 0;
  return daysBetween(user.lastSessionDate, now) <= 1 ? user.currentStreak || 0 : 0;
}

async function getTop(collectionName, field = 'totalMinutes') {
  const q = query(collection(db, collectionName), orderBy(field, 'desc'), limit(MAX_RESULTS));
  // FromServer: sin red falla en vez de devolver una caché vacía
  const snapshot = await getDocsFromServer(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Devuelve { students, universities, fromCache }. Sin conexión usa el último ranking guardado.
// Con `subjectId` los estudiantes se ordenan por los minutos de esa materia (las universidades
// siguen siendo globales).
export async function getRanking(subjectId = null) {
  try {
    const [users, universities] = await Promise.all([
      getTop('users', subjectId ? `subjectMinutes.${subjectId}` : 'totalMinutes'),
      getTop('universities'),
    ]);
    const now = new Date();
    const ranking = {
      students: users.map((u) => ({
        id: u.id,
        name: u.name,
        university: u.universityName,
        totalMinutes: subjectId ? u.subjectMinutes?.[subjectId] || 0 : u.totalMinutes || 0,
        currentStreak: activeStreak(u, now),
        premium: u.premium === true,
      })),
      universities: universities.map((u) => ({
        id: u.id,
        name: u.name,
        students: Math.max(u.students || 0, 0),
        totalMinutes: u.totalMinutes || 0,
      })),
    };
    saveCachedRanking(ranking, subjectId);
    return { ...ranking, fromCache: false };
  } catch (e) {
    console.warn('Ranking sin conexión:', e.message);
    const cached = await getCachedRanking(subjectId);
    return { students: [], universities: [], ...cached, fromCache: true };
  }
}
