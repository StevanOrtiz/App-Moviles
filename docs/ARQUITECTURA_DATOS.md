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

Funciones: cuentas de usuario, temporizador Pomodoro, rachas diarias, historial, perfil, ranking de estudiantes y universidades, y recordatorios de estudio con notificaciones.

## 2. Flujo de la app

```
Onboarding (una vez por dispositivo)
  → Iniciar sesión / Crear cuenta / Recuperar contraseña
    → Crear perfil (nombre + universidad), solo la primera vez
      → Tabs: Inicio · Ranking · Historial · Recordatorios · Perfil
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
  subjectMinutes { [subjectId]: minutos }   ← ranking por materia (sube con cada sesión con materia)
  premium (bool), premiumSince               ← suscripción (DEMO: se activa con un botón)

users/{uid}/sessions/{sessionId}  ← historial privado
  id, date (YYYY-MM-DD), duration (min), type ("pomodoro"), time ("10:30 AM"), subjectId (opcional), createdAt

users/{uid}/reminders/{id}        ← recordatorios de estudio (privados)
  title, hour (0-23), minute (0-59), days ([1..7], 1 = domingo), enabled, createdAt, updatedAt

users/{uid}/devices/{deviceId}    ← token de push de cada dispositivo del usuario (privado)
  token ("ExponentPushToken[...]"), platform ("android" | "ios"), updatedAt

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
| `reminders:{uid}` | copia de los recordatorios, para mostrarlos sin red |
| `pushToken:{uid}` | token de push de este dispositivo (para quitarlo al cerrar sesión) |
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
   **Cada vez que cambie `firestore.rules` hay que volver a publicarlas.** Si no, lo nuevo falla con `permission-denied`. Las rutas que cubren hoy son `users/{uid}`, `users/{uid}/sessions`, `users/{uid}/reminders`, `users/{uid}/devices` y `universities/{id}`.
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

## 6. Notificaciones y recordatorios (`expo-notifications`)

| Pieza | Archivo | Qué hace |
|---|---|---|
| Servicio | `src/services/notificationService.js` | Permisos, canal de Android, notificaciones locales, token de push |
| Recordatorios | `src/services/reminderService.js` | CRUD en `users/{uid}/reminders` y escucha en tiempo real (`onSnapshot`) |
| Dispositivos | `src/services/deviceService.js` | Guarda/borra el token en `users/{uid}/devices` |
| Estado | `src/context/RemindersContext.js` | Une Firestore + permiso + notificaciones programadas |
| Pantalla | `src/screens/RemindersScreen.js` | Tab **Recordatorios**: permiso, lista, crear/editar/borrar, probar aviso |
| Navegación | `src/hooks/useNotificationNavigation.js` | Al tocar una notificación abre la pantalla de `data.screen` |

**Flujo de un recordatorio**
1. El usuario crea un recordatorio (mensaje, hora y días) → se guarda en Firestore.
2. `RemindersContext` escucha la colección y, cuando hay permiso, deja programadas exactamente las notificaciones de los recordatorios activos (`DAILY` si son los 7 días, `WEEKLY` por cada día si no). Son locales: funcionan sin internet y con la app cerrada.
3. Cambiar, apagar o borrar un recordatorio reprograma todo; en otro dispositivo con la misma cuenta se programan solos al abrir la app.
4. Al cerrar sesión se cancelan las notificaciones y se borra el token de ese dispositivo.

**Permisos** (3 estados: `undetermined`, `granted`, `denied`): se piden desde un botón con una explicación previa, nunca al abrir la app. Si el usuario los bloquea (`canAskAgain === false`) la pantalla ofrece **Abrir ajustes** y la app sigue funcionando.

**Alarma del Pomodoro**: al iniciar el temporizador se programa una notificación para la hora de fin; se cancela al pausar, reiniciar o terminar. El tiempo restante se calcula contra la hora de fin, así que sigue correcto si la app estuvo en segundo plano. Con la app abierta no se muestra el aviso (ya sale la ventana "Sesión completada").

**Push remotas (opcional)**: con permiso concedido, en un celular físico y con `extra.eas.projectId` configurado, se obtiene el Expo Push Token y se guarda en `users/{uid}/devices` (también se muestra en la pantalla para probarlo en https://expo.dev/notifications). Requiere un *development build* (no Expo Go) y, en Android, `google-services.json` + la llave FCM v1 subida con `eas credentials`. Un backend (p. ej. Cloud Functions) sería quien envíe los avisos; nunca se envían desde la app de otro usuario.

**Dónde funciona cada cosa**

| | Expo Go | Development build | Web |
|---|---|---|---|
| Notificaciones locales (recordatorios, alarma) | Sí | Sí | No |
| Push remotas | No | Sí (celular físico) | No |


## 9. Materias, estadísticas y Premium

- Las materias están en `src/data/subjects.js` (el `id` se guarda en Firestore; no lo cambies).
- El ranking por materia es opcional: `getRanking(subjectId)` ordena por `subjectMinutes.{id}`. Las sesiones anteriores quedan "Sin materia".
- `src/utils/stats.js` calcula las estadísticas (con pruebas en `tests/stats.test.mjs`).
- Premium es **modo demo**: `users/{uid}.premium` lo cambia el propio usuario (regla `isPremiumToggle`). Antes de cobrar hay que cerrar esa regla y activarlo desde un backend tras validar el pago.
