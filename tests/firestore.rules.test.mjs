// Pruebas de las reglas de Firestore contra el emulador.
// Ejecutar con: npm run test:rules
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-unistreak',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

after(() => env.cleanup());
beforeEach(() => env.clearFirestore());

const dbFor = (uid) => env.authenticatedContext(uid).firestore();

// Réplicas de las escrituras que hace la app (src/services/userService.js y sessionService.js)
function changeStudents(batch, db, universityId, name, delta) {
  batch.set(
    doc(db, 'universities', universityId),
    { name, students: increment(delta), totalMinutes: increment(0), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

function createProfile(db, uid, universityId = 'icesi', name = 'Universidad ICESI') {
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', uid), {
    name: 'Laura',
    universityId,
    universityName: name,
    totalMinutes: 0,
    sessions: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastSessionDate: null,
    lastSessionId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  changeStudents(batch, db, universityId, name, 1);
  return batch.commit();
}

function addSession(
  db,
  uid,
  { id = '1700000000000', duration = 25, userMinutes, uniMinutes } = {},
) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', uid, 'sessions', id), {
    id,
    date: '2026-10-01',
    duration,
    type: 'pomodoro',
    time: '10:30 AM',
    createdAt: serverTimestamp(),
  });
  batch.update(doc(db, 'users', uid), {
    totalMinutes: increment(userMinutes ?? duration),
    sessions: increment(1),
    currentStreak: 1,
    bestStreak: 1,
    lastSessionDate: '2026-10-01',
    lastSessionId: id,
    updatedAt: serverTimestamp(),
  });
  batch.set(
    doc(db, 'universities', 'icesi'),
    {
      totalMinutes: increment(uniMinutes ?? duration),
      students: increment(0),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return batch.commit();
}

describe('perfil', () => {
  test('crear perfil propio con totales en 0', async () => {
    const db = dbFor('alice');
    await assertSucceeds(createProfile(db, 'alice'));
    const uni = await getDoc(doc(db, 'universities', 'icesi'));
    assert.equal(uni.data().students, 1);
  });

  test('no se puede crear un perfil con minutos', async () => {
    const db = dbFor('alice');
    await assertFails(
      setDoc(doc(db, 'users', 'alice'), {
        name: 'Laura',
        universityId: 'icesi',
        universityName: 'ICESI',
        totalMinutes: 9999,
        sessions: 0,
        currentStreak: 0,
        bestStreak: 0,
        lastSessionDate: null,
        lastSessionId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  test('no se puede escribir el perfil de otro usuario', async () => {
    await assertFails(createProfile(dbFor('mallory'), 'alice'));
  });

  test('sin sesión no se puede leer nada', async () => {
    await createProfile(dbFor('alice'), 'alice');
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anon, 'users', 'alice')));
  });

  test('cambiar de universidad mueve un estudiante', async () => {
    const db = dbFor('alice');
    await createProfile(db, 'alice');
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', 'alice'), {
      name: 'Laura',
      universityId: 'univalle',
      universityName: 'Universidad del Valle',
      updatedAt: serverTimestamp(),
    });
    changeStudents(batch, db, 'icesi', 'Universidad ICESI', -1);
    changeStudents(batch, db, 'univalle', 'Universidad del Valle', 1);
    await assertSucceeds(batch.commit());
    assert.equal((await getDoc(doc(db, 'universities', 'icesi'))).data().students, 0);
    assert.equal((await getDoc(doc(db, 'universities', 'univalle'))).data().students, 1);
  });

  test('no se puede sumar estudiantes sin cambiar de universidad', async () => {
    const db = dbFor('alice');
    await createProfile(db, 'alice');
    await assertFails(
      updateDoc(doc(db, 'universities', 'icesi'), {
        students: increment(5),
        updatedAt: serverTimestamp(),
      }),
    );
  });
});

describe('sesiones', () => {
  test('registrar una sesión suma minutos al usuario y a la universidad', async () => {
    const db = dbFor('alice');
    await createProfile(db, 'alice');
    await assertSucceeds(addSession(db, 'alice'));
    const user = (await getDoc(doc(db, 'users', 'alice'))).data();
    assert.equal(user.totalMinutes, 25);
    assert.equal(user.sessions, 1);
    assert.equal((await getDoc(doc(db, 'universities', 'icesi'))).data().totalMinutes, 25);
  });

  test('reenviar la misma sesión no cuenta dos veces', async () => {
    const db = dbFor('alice');
    await createProfile(db, 'alice');
    await addSession(db, 'alice');
    await assertFails(addSession(db, 'alice'));
    assert.equal((await getDoc(doc(db, 'users', 'alice'))).data().totalMinutes, 25);
  });

  test('no se pueden inflar minutos más allá de la duración de la sesión', async () => {
    const db = dbFor('alice');
    await createProfile(db, 'alice');
    await assertFails(addSession(db, 'alice', { userMinutes: 600 }));
    await assertFails(addSession(db, 'alice', { id: '2', uniMinutes: 600 }));
  });

  test('no se pueden subir minutos sin crear una sesión', async () => {
    const db = dbFor('alice');
    await createProfile(db, 'alice');
    await assertFails(
      updateDoc(doc(db, 'users', 'alice'), {
        totalMinutes: increment(25),
        sessions: increment(1),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  test('una sesión de más de 60 minutos se rechaza', async () => {
    const db = dbFor('alice');
    await createProfile(db, 'alice');
    await assertFails(addSession(db, 'alice', { duration: 120 }));
  });

  test('otro usuario no puede leer mis sesiones, pero sí mi perfil', async () => {
    const db = dbFor('alice');
    await createProfile(db, 'alice');
    await addSession(db, 'alice');
    const bob = dbFor('bob');
    await assertSucceeds(getDoc(doc(bob, 'users', 'alice')));
    await assertFails(getDoc(doc(bob, 'users', 'alice', 'sessions', '1700000000000')));
  });
});

describe('eliminar cuenta', () => {
  test('borra sesiones y perfil y resta el estudiante', async () => {
    const db = dbFor('alice');
    await createProfile(db, 'alice');
    await addSession(db, 'alice');

    await assertSucceeds(
      (async () => {
        const sessions = writeBatch(db);
        sessions.delete(doc(db, 'users', 'alice', 'sessions', '1700000000000'));
        await sessions.commit();
        const batch = writeBatch(db);
        batch.delete(doc(db, 'users', 'alice'));
        changeStudents(batch, db, 'icesi', 'Universidad ICESI', -1);
        await batch.commit();
      })(),
    );
    assert.equal((await getDoc(doc(db, 'universities', 'icesi'))).data().students, 0);
  });
});

describe('ranking', () => {
  test('un usuario con sesión puede consultar el top de usuarios y universidades', async () => {
    await createProfile(dbFor('alice'), 'alice');
    const db = dbFor('bob');
    for (const name of ['users', 'universities']) {
      await assertSucceeds(
        getDocs(query(collection(db, name), orderBy('totalMinutes', 'desc'), limit(50))),
      );
    }
  });
});
