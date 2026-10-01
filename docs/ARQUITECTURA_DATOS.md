# UniStreak — Categoría, datos y backend

## 1. Categorización de la aplicación

| Aspecto | Definición |
|---|---|
| **Categoría principal** | Educación |
| **Subcategoría** | Productividad / hábitos de estudio (gamificación) |
| **Público** | Estudiantes universitarios de Cali, Colombia |
| **Tipo de app** | Multiplataforma (Expo / React Native): Android, iOS y web |
| **Backend** | Firebase: Authentication (correo y contraseña) + Cloud Firestore |
| **Modelo de datos** | Firestore es la fuente de verdad; el teléfono guarda una caché y una cola offline |

Funciones: cuentas de usuario, temporizador Pomodoro, rachas diarias, historial, perfil y ranking de estudiantes y universidades.

## 2. Flujo de la app

```
Onboarding (una vez por dispositivo)
  → Iniciar sesión / Crear cuenta / Recuperar contraseña
    → Crear perfil (nombre + universidad), solo la primera vez
      → Tabs: Inicio · Ranking · Historial · Perfil
```

- `App.js` decide la pantalla con `useAuth()`: ¿hay usuario en Firebase Auth? ¿existe `users/{uid}`?
- Desde Perfil se puede **cerrar sesión** y **eliminar la cuenta** (pide la contraseña y borra todos los datos). Google Play y App Store exigen esto en apps que permiten crear cuentas.
- Al registrarse se envía un correo de verificación en español. No bloquea el uso de la app.

## 3. Datos remotos (Firestore)

```
users/{uid}                       ← perfil público (se usa en el ranking)
  name, universityId, universityName
  totalMinutes, sessions, currentStreak, bestStreak
  lastSessionDate, lastSessionId, createdAt, updatedAt

users/{uid}/sessions/{sessionId}  ← historial privado
  id, date (YYYY-MM-DD), duration (min), type ("pomodoro"), time ("10:30 AM"), createdAt

universities/{universityId}       ← totales por universidad
  name, students, totalMinutes, updatedAt
```

- El correo **no** se guarda en Firestore: queda solo en Firebase Auth, para que el ranking no exponga correos.
- La lista de universidades y sus ids está en `src/data/universities.js`. Para agregar una, añádela ahí; su documento se crea solo cuando alguien la elige.

### Cómo se escribe una sesión (`src/services/sessionService.js`)
Un único `writeBatch` atómico:
1. crea `users/{uid}/sessions/{id}`;
2. suma `totalMinutes`/`sessions` y actualiza la racha en `users/{uid}`;
3. suma `totalMinutes` en `universities/{universityId}`.

Las reglas solo aceptan los pasos 2 y 3 si en el mismo batch se crea una sesión **nueva** con esa duración. Por eso reenviar un batch nunca cuenta minutos dos veces.

## 4. Datos locales (AsyncStorage — `src/utils/storage.js`)

| Clave | Contenido |
|---|---|
| `onboardingCompleted` | `boolean`, por dispositivo |
| `profile:{uid}` | copia del perfil, para abrir la app sin red |
| `sessions:{uid}` | copia de las sesiones del usuario |
| `outbox:{uid}` | sesiones pendientes de subir |
| `ranking:cache` | último ranking descargado |

Las claves `user` y `sessions` de la versión anterior (sin cuentas) se migran solas: el formulario de perfil se rellena con el usuario viejo y las sesiones se suben a la cuenta del primer usuario que inicia sesión en ese dispositivo.

### Modo sin conexión
1. Al terminar un Pomodoro, la sesión se guarda en `outbox:{uid}` y en la caché. La pantalla se actualiza al instante.
2. `flushOutbox()` sube la cola. Se ejecuta al iniciar sesión, al volver la app a primer plano y después de cada sesión.
3. Si una sesión ya estaba en el servidor, la escritura se rechaza y la sesión sale de la cola.

## 5. ¿`fetch` o `async/await`?

Son cosas distintas: `fetch` hace peticiones HTTP y `async/await` es la sintaxis para esperar promesas.

- **Todo el código asíncrono usa `async/await` + `try/catch`.**
- **Firebase se usa con su SDK** (`firebase/auth`, `firebase/firestore`), **no con `fetch`**: el SDK maneja tokens, reintentos y tiempo real.
- Las lecturas que no deben aceptar caché vacía sin red usan `getDocsFromServer`; si fallan, la app muestra los datos locales.
- `fetch` queda solo para APIs REST de terceros sin SDK.

## 6. Archivos

```
src/config/firebase.js          initializeApp, auth (persistencia en AsyncStorage), db, initAnalytics()
src/context/AuthContext.js      usuario, perfil en vivo (onSnapshot), login/registro/logout/eliminar cuenta
src/context/SessionsContext.js  sesiones del usuario, addSession(), sincronización y cola offline
src/services/authService.js     llamadas a Firebase Auth
src/services/userService.js     crear/editar perfil, borrar datos del usuario
src/services/sessionService.js  batch de sesiones, cola offline, descarga del historial
src/services/rankingService.js  top 50 de usuarios y universidades, con caché
src/screens/auth/               Login, Registro, Recuperar contraseña
firestore.rules                 reglas de seguridad (con pruebas en tests/)
```

## 7. Configuración en Firebase Console (proyecto `unistreak-ddd02`)

1. **Authentication → Método de acceso**
   - Habilitar **Correo electrónico/contraseña**.
   - Deshabilitar **Anónimo**: la app ya no lo usa.
2. **Authentication → Plantillas**: idioma de las plantillas en **Español** (verificación y restablecimiento de contraseña).
3. **Firestore Database → Reglas**: reemplazar todo con el contenido de [`firestore.rules`](../firestore.rules) y **Publicar**. Otra opción, desde la terminal:
   ```
   npx firebase login
   npx firebase deploy --only firestore:rules
   ```
4. Si en Firestore quedaron documentos de pruebas anteriores (por ejemplo, `users` con usuarios anónimos o datos sin `universityId`), bórralos desde la consola. No cumplen el formato nuevo y las reglas no dejan actualizarlos.

## 8. Pruebas de las reglas

```
npm run test:rules
```

Levanta el emulador de Firestore (requiere Java) y comprueba, entre otras cosas, que:
- se puede crear un perfil y registrar sesiones;
- no se pueden inflar minutos, reenviar una sesión ni escribir en el perfil de otro usuario;
- sin sesión iniciada no se puede leer nada.

## 9. Límites conocidos y siguientes pasos
- **Trampas:** las reglas atan cada minuto a una sesión real de máximo 60 minutos. Aun así, alguien con acceso directo a la API podría crear muchas sesiones falsas. Para cerrarlo del todo:
  - **App Check**, que requiere `@react-native-firebase` y un development build;
  - y/o **Cloud Functions**, que requieren el plan Blaze.
- **Descarga del historial:** se descarga completo en cada sincronización. Con miles de sesiones convendría paginar o traer solo las nuevas.
- **Publicar en tiendas:** falta configurar `android.package` e `ios.bundleIdentifier` en `app.json` y compilar con EAS Build.
