# UniStreak — Categoría, datos y consumo

## 1. Categorización de la aplicación

| Aspecto | Definición |
|---|---|
| **Categoría principal** | Educación |
| **Subcategoría** | Productividad / hábitos de estudio (gamificación) |
| **Público** | Estudiantes universitarios de Cali, Colombia |
| **Tipo de app** | Híbrida multiplataforma (Expo / React Native) — Android, iOS y web |
| **Modelo de datos** | *Local-first* con sincronización a la nube (Firebase) |

Funciones: temporizador Pomodoro, rachas de estudio diarias, historial de sesiones, perfil y ranking de estudiantes y universidades.

## 2. Tipos de datos: locales vs. remotos

### Datos locales (AsyncStorage — `src/utils/storage.js`)
Viven en el dispositivo, funcionan sin internet y son la fuente de verdad para el propio usuario.

| Clave | Tipo | Estructura |
|---|---|---|
| `onboardingCompleted` | `boolean` | `true` / `false` |
| `user` | `object` | `{ name: string, university: string }` |
| `sessions` | `array<object>` | `[{ id: string, date: "YYYY-MM-DD", duration: number (min), type: "pomodoro", time: "10:30 AM" }]` |

Datos locales estáticos (constantes en `src/data/mockData.js`):
- `UNIVERSITIES: string[]` — lista del selector de universidad.
- `users`, `universities` — datos de respaldo (*fallback*) del ranking cuando no hay conexión.

Datos **derivados** (se calculan, no se guardan): racha actual, mejor racha, indicador semanal (`src/utils/streak.js`), minutos de hoy / de la semana.

### Datos remotos (Firebase — proyecto `unistreak-ddd02`)

| Servicio | Uso |
|---|---|
| **Authentication** (anónima) | Identificar a cada dispositivo con un `uid` sin pedir correo/contraseña |
| **Cloud Firestore** | Perfil, sesiones sincronizadas y rankings compartidos |
| **Analytics** | Solo en web (`firebase/analytics` no funciona en iOS/Android con el SDK JS) |

Colecciones de Firestore:

```
users/{uid}
  name: string
  university: string
  totalMinutes: number      // acumulado con increment()
  sessions: number          // acumulado con increment()
  updatedAt: timestamp

users/{uid}/sessions/{sessionId}
  id, date, duration, type, time   // igual que la sesión local
  createdAt: timestamp

universities/{universityId}
  name: string
  students: number
  totalMinutes: number
  totalStreakDays: number
```

## 3. Cómo se consumen: `fetch` vs. `async/await`

No son alternativas excluyentes: `fetch` es una **API para hacer peticiones HTTP** y `async/await` es la **sintaxis para esperar promesas**. La decisión del proyecto es:

- **Toda operación asíncrona se escribe con `async/await` + `try/catch`** (no cadenas `.then()`), tanto para AsyncStorage como para Firebase. Es más legible y permite manejar errores de red con un solo `catch` que activa el modo sin conexión.
- **Firebase se consume con su SDK** (`getDocs`, `setDoc`, `signInAnonymously`…), **no con `fetch`**: el SDK ya maneja autenticación, caché, reintentos y tiempo real. Usar la API REST con `fetch` obligaría a gestionar tokens a mano.
- **`fetch` se reserva** para APIs REST de terceros que no tengan SDK (p. ej. un futuro servicio de frases motivacionales), siempre envuelto en `async/await`:
  ```js
  async function getJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  ```

| Fuente | Mecanismo | Patrón |
|---|---|---|
| AsyncStorage | `AsyncStorage.getItem/setItem` | `async/await` |
| Firestore / Auth | SDK `firebase` v12 | `async/await` |
| APIs REST externas | `fetch` | `async/await` |

### Estrategia *local-first*
1. Escribir primero en AsyncStorage (la UI responde al instante).
2. Sincronizar con Firestore en segundo plano (`syncSession`, `saveUserProfile`) sin bloquear la pantalla.
3. Al leer datos compartidos (ranking) se consulta Firestore; si falla o está vacío se usan los datos locales de respaldo.

## 4. Estructura de la integración con Firebase

```
src/config/firebaseConfig.js  → credenciales del proyecto web
src/config/firebase.js        → initializeApp, auth (persistencia en AsyncStorage), db, initAnalytics()
src/services/authService.js   → ensureSignedIn() (login anónimo), subscribeToAuth()
src/services/userService.js   → saveUserProfile()  (local + Firestore)
src/services/sessionService.js→ syncSession()      (Firestore users/{uid}/sessions)
src/services/rankingService.js→ getStudentRanking(), getUniversityRanking() (con fallback)
```

### Pasos pendientes en la consola de Firebase
1. **Authentication → Método de acceso → Anónimo → Habilitar.**
2. **Firestore Database → Crear base de datos** (región `southamerica-east1` o `us-central1`).
3. Publicar reglas mínimas:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       match /users/{uid} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == uid;
         match /sessions/{sessionId} {
           allow read, write: if request.auth != null && request.auth.uid == uid;
         }
       }
       match /universities/{id} {
         allow read: if request.auth != null;
         allow write: if false; // se administran desde la consola o Cloud Functions
       }
     }
   }
   ```
   El servicio de ranking hace login anónimo antes de leer, así cumple `request.auth != null`.
