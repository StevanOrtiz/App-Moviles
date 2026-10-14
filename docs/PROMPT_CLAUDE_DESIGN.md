Crea una presentación de **15 diapositivas, formato 16:9, en español**, sobre **UniStreak**, una app móvil que desarrollé en React Native + Expo + Firebase para la materia *Desarrollo de Aplicaciones Móviles (6º semestre)*.

La presentación debe **verse como una extensión de la propia app**: mismos colores, mismas tarjetas, mismos componentes y mismo tono. **Prioriza lo visual sobre el texto**: mockups de la app, diagramas, iconos y tarjetas. Ninguna diapositiva debe tener párrafos, y cada texto debe caber en una o dos líneas.

Sigue al pie de la letra el sistema de diseño y el contenido de cada diapositiva. Los textos entre comillas «así» se copian **exactamente**.

---

# PARTE 1 · Sistema de diseño (sacado del código de la app)

## 1.1 Colores (de `src/theme.js`)
| Token | Hex | Uso en la app → uso en las diapositivas |
|---|---|---|
| `background` | `#F7F5EC` | Fondo crema de todas las pantallas → **fondo de casi todas las diapositivas** |
| `primary` | `#00483F` | Verde oscuro de la marca: logo, botones, tarjeta Pomodoro, pestaña activa → **portada, cierre, tarjetas destacadas, bloques de código** |
| `secondaryGreen` | `#65D889` | Verde menta: botón "Iniciar", días cumplidos ✓, borde del top 3 → **checks, etiquetas sobre fondo oscuro, acentos positivos** |
| `yellow` | `#FFD91A` | Amarillo: valores destacados del ranking, botón secundario → **números grandes, palabra clave del título en portada, resaltados** |
| `textPrimary` | `#123A36` | Títulos y texto principal |
| `textSecondary` | `#7C8581` | Etiquetas, subtítulos, texto de apoyo |
| `white` | `#FFFFFF` | Fondo de todas las tarjetas |
| `error` | `#C0392B` | Mensajes de error → solo para ✖ y advertencias |
| Overlay del modal | `rgba(18, 58, 54, 0.5)` | Velo verde translúcido sobre mockups cuando se quiera resaltar un modal |

**No uses** azul marino, negro puro, morado ni degradados. Toda la paleta es verde, crema y amarillo.

## 1.2 Tipografía
- La app usa la **fuente del sistema** (SF Pro / Roboto), no una fuente personalizada. En las diapositivas usa **Inter** o **SF Pro Display**, siempre **sans-serif**. **Nada de serif.**
- Títulos: **peso 700**, color `#123A36`, de 44–52 px. Equivalen al `title` de 28 px de las pantallas, escalado.
- Etiqueta superior de cada diapositiva: **13 px, peso 700, MAYÚSCULAS, espaciado entre letras 0.5–1 px, color `#7C8581`**. Es el mismo estilo de los encabezados de día del Historial («HOY»).
- Texto de tarjetas: 18–22 px. El valor principal va en peso 700 y la etiqueta en peso 400, color `#7C8581`.
- Números grandes (KPIs): **peso 700, 56–72 px**, color `#00483F` o `#FFD91A` sobre fondo oscuro.
- Código: monoespaciada (JetBrains Mono o SF Mono), 16–18 px.

## 1.3 Componentes reutilizables (réplica de los componentes de la app)
Usa estos bloques en toda la presentación:

1. **Tarjeta blanca** (como `StatCard` / `StreakCard`):
   - fondo `#FFFFFF`, **radio 20 px**, padding 18–24 px;
   - sombra muy suave: negro al 5 %, desenfoque 6 px, desplazamiento y 2 px.
   - Sin bordes, salvo cuando se indique.
2. **Tarjeta destacada verde** (como la tarjeta del Pomodoro y la "Universidad más comprometida"):
   - fondo `#00483F`, radio 20 px, contenido centrado;
   - etiqueta pequeña en `#65D889` peso 600, valor grande en blanco o en `#FFD91A`.
3. **Fila de lista** (como `SessionItem` / `LeaderboardItem`):
   - tarjeta blanca de **radio 16 px**, padding 14 px;
   - a la izquierda, un **círculo de 40 px con fondo `#F7F5EC`** y un icono de línea en `#00483F`;
   - título en peso 700 y subtítulo de 13 px en `#7C8581`;
   - a la derecha, un valor en `#00483F` peso 700.
4. **Fila destacada**:
   - borde de 1.5 px en `#65D889` = "top 3";
   - borde de 1.5 px en `#00483F` = "esto es lo nuestro / el usuario actual".
5. **Botón primario**: fondo `#00483F`, texto blanco peso 700, altura 52 px, **radio 16 px**.
6. **Botón secundario**: fondo `#FFD91A`, texto `#123A36` peso 700, radio 16 px.
7. **Selector segmentado** (como las pestañas Estudiantes/Universidades del Ranking):
   - contenedor blanco de radio 16 px con padding 4 px;
   - opción activa con fondo `#00483F` y texto blanco; opción inactiva con texto `#7C8581`.
8. **Indicador semanal** (como `StreakCard`):
   - 7 columnas «L M X J V S D»;
   - cada día es un círculo de 28 px: crema `#F7F5EC` si está vacío, o `#65D889` con «✓» blanco si está cumplido.
9. **Píldora / chip**: radio completo, fondo `#F7F5EC` o `#65D889` al 20 %, texto 14 px peso 600.
10. **Bloque de código**:
    - fondo `#00483F` (el verde de la marca, **no** negro), radio 20 px;
    - texto blanco en monoespaciada; palabras clave en `#FFD91A`, strings en `#65D889` y comentarios en blanco al 55 %;
    - encima, una pestaña pequeña con el nombre del archivo: chip `#65D889` con texto `#00483F`, por ejemplo «src/context/AuthContext.js».
11. **Mockup de teléfono**:
    - marco redondeado oscuro (`#123A36`), pantalla con fondo `#F7F5EC`;
    - abajo, la **barra de pestañas blanca** de la app con 4 iconos de línea (Ionicons: home, trophy, book, person) y etiquetas «Inicio · Ranking · Historial · Perfil». La activa va en `#00483F` y las demás en `#7C8581`.
12. **Iconos**: estilo **Ionicons outline**, trazo fino, color `#00483F`, dentro de círculos de 48–56 px con fondo `#F7F5EC` (sobre tarjeta blanca) o blanco (sobre fondo crema).
    - Emojis que usa la app y que se pueden usar: 🔥 🏆 🥈 🥉 👋 🎉 ⏱ 📚. No uses otros.

## 1.4 Layout base de cada diapositiva
- Fondo `#F7F5EC`, márgenes laterales amplios (≈ 80 px).
- Arriba a la izquierda, la **etiqueta superior** (1.2); debajo, el **título**.
- Abajo a la derecha, el número de diapositiva en 13 px `#7C8581`.
- Abajo a la izquierda, el wordmark «UniStreak» en 14 px peso 700 `#00483F`.
- Opcional: un pequeño 🔥 decorativo arriba a la derecha, al 15 % de opacidad.

## 1.5 Datos de ejemplo para los mockups
Usa siempre estos datos, que son los de prueba de la app:

**Estudiantes del ranking:**
| Pos. | Nombre | Universidad | Tiempo | Racha |
|---|---|---|---|---|
| 🏆 | Laura | UNICATOLICA | 42h 30m | 🔥 12 días |
| 🥈 | Andrés | Universidad del Valle | 39h 10m | 🔥 9 días |
| 🥉 | Camila | Universidad ICESI | 35h 45m | 🔥 8 días |
| 4 | Santiago | Universidad Autónoma de Occidente | 30h 20m | 🔥 6 días |
| 5 | Valentina | Universidad Libre | 25h 40m | 🔥 5 días |

**Usuario actual:** «Laura · UNICATOLICA».

**Pantalla de Inicio:**
- saludo «Buenos días, Laura 👋»;
- racha «🔥 12 días · Racha actual»;
- Pomodoro «25:00»;
- tarjetas «Hoy 50 min» y «Esta semana 5h 25m».

---

# PARTE 2 · Contenido diapositiva por diapositiva

## Diapositiva 1 · Portada
**Propósito:** presentar la app con su identidad visual.

**Layout:**
- **fondo completo `#00483F`**;
- texto a la izquierda (55 %) y mockup a la derecha (45 %).

**Texto:**
- Etiqueta (en `#65D889`): «DESARROLLO DE APLICACIONES MÓVILES · 6TO SEMESTRE»
- Título gigante (80 px, blanco, peso 700): «Uni**Streak**», con «Streak» en `#FFD91A`.
- Debajo, en 3 líneas (28 px, blanco al 85 %, peso 700), el tagline exacto del onboarding: «Estudia.» / «Mantén tu racha.» / «Supera tus límites.»
- Pie (14 px, blanco al 60 %): «Stevan Ortiz · Docente: Jimmy Andrés Ramírez Rangel»

**Visual:**
- Mockup de teléfono con la **pantalla de Inicio**:
  - saludo;
  - `StreakCard` con el indicador semanal (L–V cumplidos en verde menta, S y D vacíos);
  - tarjeta Pomodoro verde con «Pomodoro» en menta, «25:00» en blanco grande y botón menta «▶ Iniciar».
- Detrás del teléfono, un 🔥 enorme al 10 % de opacidad.

## Diapositiva 2 · ¿Qué es UniStreak?
**Propósito:** que en 10 segundos se entienda qué hace la app. Que los mockups hablen.

- Etiqueta: «LA APP»
- Título: «Estudiar también puede ser un hábito»

**Layout:** **4 mockups de teléfono en fila**, del mismo tamaño y ligeramente escalonados, cada uno con una etiqueta debajo.
1. **Inicio**: StreakCard + tarjeta Pomodoro «25:00». Etiqueta: «⏱ Pomodoro de 25 min».
2. **Modal de sesión completada**:
   - velo verde translúcido sobre la pantalla de Inicio;
   - tarjeta blanca centrada con «¡Sesión completada! 🎉», «Has estudiado durante 25 minutos.» y «🔥 Tu racha continúa» en `#00483F`;
   - botón verde «Continuar».
   - Etiqueta: «🔥 Rachas diarias».
3. **Historial**:
   - título «Historial»;
   - encabezado «HOY» a la izquierda y «Total: 50 min» en verde a la derecha;
   - dos filas `SessionItem`: «25 min · 10:30 AM» y «25 min · 11:05 AM»;
   - encabezado «13/10/2026» con una fila más.
   - Etiqueta: «📚 Historial por día».
4. **Ranking**:
   - selector segmentado con «Estudiantes» activo;
   - 4 filas de la tabla de 1.5: Laura con borde `#00483F` y «(Tú)», el top 3 con borde menta.
   - Etiqueta: «🏆 Ranking de Cali».

Abajo, centrada, una línea de 3 chips: «React Native + Expo» · «Firebase» · «Android · iOS · Web».

## Diapositiva 3 · Consigna 1: Categorización de la app
- Etiqueta: «CONSIGNA 1 · CATEGORIZACIÓN»
- Título: «¿Qué tipo de app es UniStreak?»

**Layout:** a la izquierda (40 %), una **tarjeta destacada verde** grande con la categoría; a la derecha (60 %), una cuadrícula 2×2 de tarjetas blancas.

**Tarjeta verde (estilo "Universidad más comprometida"):**
- etiqueta menta «CATEGORÍA PRINCIPAL»;
- valor gigante «Educación» en `#FFD91A`;
- debajo, en blanco: «Productividad · Hábitos de estudio».

**Cuadrícula** (cada tarjeta lleva un icono Ionicons en círculo, una etiqueta gris y un valor en peso 700):
1. icono `people-outline` · «Público» · «Universitarios de Cali»
2. icono `game-controller-outline` · «Enfoque» · «Gamificación: rachas y ranking»
3. icono `phone-portrait-outline` · «Tipo de app» · «Multiplataforma (Expo)»
4. icono `cloud-outline` · «Backend» · «Firebase (BaaS)»

**Franja inferior:** chip amarillo `#FFD91A` con el texto «💡 La racha diaria es el motor: como en Duolingo, te hace volver cada día».

## Diapositiva 4 · Consigna 2: Datos locales vs. remotos
- Etiqueta: «CONSIGNA 2 · TIPOS DE DATOS»
- Título: «¿Dónde vive cada dato?»

**Layout:** diagrama de **dos zonas unidas por flechas de sincronización**: el teléfono a la izquierda y la nube a la derecha.

**Izquierda: mockup de teléfono** con 6 "cajones" apilados dentro, cada uno como una fila `SessionItem` con un icono:
- `checkmark-circle-outline` · «onboardingCompleted» · «¿ya vio la bienvenida?»
- `person-outline` · «profile:{uid}» · «perfil para abrir sin red»
- `time-outline` · «sessions:{uid}» · «caché del historial»
- `cloud-upload-outline` · «outbox:{uid}» · «sesiones por subir» (fila con borde `#FFD91A`)
- `trophy-outline` · «ranking:cache» · «último ranking»
- `notifications-outline` · «reminders:{uid}» · «¿recordatorio activo?»

Sobre el teléfono, el chip «📱 LOCAL · AsyncStorage».

**Derecha: tarjeta destacada verde** con forma de nube o tarjeta grande y el chip «☁️ REMOTO · Cloud Firestore». Dentro, 4 filas en blanco con iconos menta:
- «users/{uid}» → «perfil + totales»
- «users/{uid}/sessions» → «historial privado»
- «universities/{id}» → «totales por universidad»
- «users/{uid}/devices» → «token de push del teléfono»

**En el centro:** dos flechas curvas.
- Flecha de ida, rotulada «sube (outbox)».
- Flecha de vuelta, rotulada «descarga y cachea».

**Abajo:** una tarjeta blanca a lo ancho, con borde de 1.5 px `#00483F`, con el texto «**Decisión:** Firestore es la fuente de verdad; el teléfono guarda una copia para funcionar sin internet».

## Diapositiva 5 · Consigna 3: ¿fetch o async/await?
- Etiqueta: «CONSIGNA 3 · CÓMO CONSUMIMOS LOS DATOS»
- Título: «No compiten: se complementan»

**Fila superior:** dos tarjetas blancas con un signo «+» grande en `#65D889` entre ellas.
- Tarjeta 1: icono `globe-outline` · «fetch» · «hace la petición HTTP».
- Tarjeta 2: icono `hourglass-outline` · «async/await» · «espera la respuesta de forma legible».

**Fila central:** «nuestra decisión» como **3 filas de lista** con indicadores:
1. borde menta y ✓ · «async/await + try/catch en todo el código».
2. borde menta y ✓ · «SDK de Firebase en lugar de fetch: maneja tokens, reintentos y tiempo real».
3. sin borde y con «➖» gris · «fetch queda reservado para APIs REST externas (hoy no hay ninguna)».

**Derecha:** bloque de código con la pestaña «src/services/rankingService.js»:
```js
export async function getRanking() {
  try {
    const [users, universities] = await Promise.all([
      getTop('users'), getTop('universities'),
    ]);
    return { students: users, universities, fromCache: false };
  } catch (e) {
    return { ...(await getCachedRanking()), fromCache: true };
  }
}
```

## Diapositiva 6 · Firebase en UniStreak (mapa unificado)
**Propósito:** una sola diapositiva que explique QUÉ servicios de Firebase usa la app, POR QUÉ y CÓMO se conectan. Reemplaza a las diapositivas de «¿por qué no fetch ni axios?» y de «arquitectura».

- Etiqueta: «FIREBASE · VISIÓN GENERAL»
- Título: «Firebase es nuestro backend: sin servidor propio»

**Layout:** diagrama de 3 columnas conectadas con flechas de `#00483F`.

**Columna izquierda · «App»** (mockup de teléfono pequeño con la pantalla de Inicio). Debajo, chip «React Native + Expo».

**Columna central · «Capas del código»:** 4 tarjetas apiladas, cada una con un chip de carpeta y un icono en círculo crema:
1. icono `phone-portrait-outline` · chip «screens/» · «Pantallas»
2. icono `git-network-outline` · chip «context/» · «AuthContext · SessionsContext · NotificationsContext»
3. icono `construct-outline` · chip «services/» · «auth · user · session · ranking · notification»
4. icono `settings-outline` · chip «config/firebase.js» · «initializeApp · initializeAuth · getFirestore»

**Columna derecha · «Servicios de Firebase»:** **tarjeta destacada verde** con 4 filas blancas, cada una con icono menta y estado:
- `key-outline` · «Authentication» · «correo y contraseña»
- `server-outline` · «Cloud Firestore» · «datos en tiempo real»
- `shield-checkmark-outline` · «Reglas de seguridad» · «protegen cada documento»
- `notifications-outline` · «Token de push» · «guardado por dispositivo»

**Abajo:** tabla compacta en tarjeta blanca «¿Por qué el SDK y no fetch/axios?», con ✔ en `#65D889` y ✖ en `#C0392B`:

| | fetch | axios | Firebase SDK |
|---|---|---|---|
| Autenticación integrada | ✖ | ✖ | ✔ |
| Tiempo real | ✖ | ✖ | ✔ |
| Funciona sin conexión | ✖ | ✖ | ✔ |

Con el bloque de código pequeño, pestaña «src/config/firebase.js»:
```js
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
```

## Diapositiva 7 · Autenticación con correo y contraseña
- Etiqueta: «FIREBASE · AUTENTICACIÓN»
- Título: «Reemplazamos el login anónimo por cuentas reales»

**Layout:** **3 mockups de teléfono** a la izquierda (60 %) unidos por flechas finas; a la derecha (40 %), 3 tarjetas de "decisión".

**Mockups** (réplica exacta de las pantallas):
1. **Login**:
   - wordmark «UniStreak» de 36 px peso 800 en `#00483F`;
   - el texto «Inicia sesión para guardar tu racha en la nube.»;
   - campos blancos de radio 16 «Correo» y «Contraseña»;
   - enlace «¿Olvidaste tu contraseña?» en verde;
   - botón verde «Iniciar sesión»;
   - el enlace «¿No tienes cuenta? Regístrate».
2. **Crear cuenta**:
   - título «Crear cuenta»;
   - el texto «Tu progreso quedará guardado aunque cambies de teléfono.»;
   - 3 campos, el último «Confirmar contraseña»;
   - botón «Crear cuenta».
3. **Recuperar contraseña**:
   - título «Recuperar contraseña»;
   - un campo de correo;
   - botón «Enviar enlace».

**Tarjetas de decisión** (cada una con un icono y un texto de una línea):
- `swap-horizontal-outline` · «Antes: cuenta anónima → se perdía al cambiar de teléfono»
- `mail-outline` · «Correo de verificación en español (`auth.languageCode = 'es'`)»
- `chatbubble-ellipses-outline` · «Errores traducidos: *auth/invalid-credential* → «Correo o contraseña incorrectos.»»

## Diapositiva 8 · Sesión persistente, AuthContext y navegación
**Propósito:** unifica «sesión persistente» y «navegación condicional» en una sola diapositiva: el usuario vive en un lugar y la app decide qué pantalla mostrar.

- Etiqueta: «FIREBASE · SESIÓN PERSISTENTE»
- Título: «Una sola fuente de verdad para el usuario»

**Fila superior:** flujo horizontal de **4 mockups pequeños** con **3 rombos de decisión** `#FFD91A` entre ellos:
1. **Onboarding**: «UniStreak» en verde, tagline «Estudia. / Mantén tu racha. / Supera tus límites.» y botón «Comenzar».
2. Rombo «¿hay sesión?» → **Login**.
3. Rombo «¿tiene perfil?» → **Crear perfil**: título «Crear tu perfil», campo «Nombre», lista de universidades con «UNICATOLICA» seleccionada (borde `#00483F` y check verde) y botón «Crear perfil».
4. → **Inicio** con la barra de pestañas.

**Fila inferior, izquierda:** pasos numerados horizontales (círculos `#00483F` con número blanco) con chips de código de una línea:
1. «onAuthStateChanged(auth, setUser)»
2. «onSnapshot(users/{uid})»: perfil en vivo
3. «<AuthProvider>…</AuthProvider>»
4. «const { user, profile } = useAuth()»

**Fila inferior, derecha:** bloque de código con pestaña «App.js»:
```js
function RootNavigator() {
  const { user, profileStatus, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <AuthNavigator />;
  if (profileStatus === 'missing') return <CreateProfileScreen />;
  return <AppNavigator />;
}
```
**Chip final:** `refresh-outline` «Cierras la app y sigues con la sesión iniciada (AsyncStorage)».

## Diapositiva 9 · Modelo de datos en Firestore
- Etiqueta: «FIRESTORE · COLECCIONES Y DOCUMENTOS»
- Título: «Así se organizan los datos»

**Visual:** **árbol de colecciones** con tarjetas anidadas.
- Las colecciones son tarjetas destacadas verdes con un chip menta: «users», «universities».
- Los documentos son tarjetas blancas con borde punteado de 1.5 px `#65D889`. Dentro, los campos clave van como pares «campo: valor» en monoespaciada de 15 px:
  - **users/laura123**: «name: "Laura"» · «universityName: "UNICATOLICA"» · «totalMinutes: 2550» · «sessions: 102» · «currentStreak: 12»
    - subcolección **sessions/1760432400000**: «date: "2026-10-14"» · «duration: 25» · «type: "pomodoro"»
    - subcolección **devices/ExponentPushToken…**: «token: "ExponentPushToken[…]"» · «platform: "android"»
  - **universities/unicatolica**: «name: "UNICATOLICA"» · «students: 124» · «totalMinutes: 230520»

**A la derecha:** una "pila" de 3 tarjetas que se combinan en una, rotulada «writeBatch atómico».
- Dentro: «① crea la sesión» · «② suma al usuario» · «③ suma a la universidad».
- Debajo: «Se guarda todo o nada».

**Chips de decisión abajo:**
- «🔒 El correo NO se guarda en Firestore (solo en Auth)»
- «🆔 Universidades con id estable: "unicatolica", "univalle"…»

## Diapositiva 10 · Tiempo real y modo sin conexión
- Etiqueta: «FIRESTORE · TIEMPO REAL Y OFFLINE»
- Título: «Funciona con y sin internet»

**Izquierda (40 %):** tarjeta blanca titulada «onSnapshot».
- Visual: icono `pulse-outline` grande y una mini pantalla de Perfil:
  - avatar circular `#00483F` con «L» blanca;
  - «Laura» / «UNICATOLICA»;
  - fila de stats «🔥 12 · ⏱ 42h 30m · 📚 102».
- Texto: «El perfil se actualiza solo cuando cambia en la nube».

**Derecha (60 %):** **línea de tiempo de 3 pasos** horizontal, con iconos grandes.
1. icono `airplane-outline` · «Terminas un Pomodoro sin red» → mini fila «25 min · 10:30 AM» con chip amarillo «pendiente».
2. icono `cloud-upload-outline` · «Vuelve la red o abres la app» → chip de código «flushOutbox()».
3. icono `shield-checkmark-outline` · «Si ya se había subido, las reglas la rechazan» → chip menta «nunca cuenta doble».

**Abajo:** chip gris «Lecturas con getDocsFromServer: sin red, mostramos la caché en vez de una lista vacía».

## Diapositiva 11 · Loading, success y error
- Etiqueta: «SESIÓN 6 · ESTADOS DE LA UI»
- Título: «Los 3 estados, en pantallas reales»

**Visual principal:** **3 mockups de la pantalla Ranking**, uno por estado, cada uno con un chip de color encima.
1. Chip `#FFD91A` «loading»: Ranking con el selector segmentado y un spinner `#00483F` centrado.
2. Chip menta `#65D889` «success»:
   - Ranking completo con las 5 filas de la tabla;
   - la tarjeta destacada verde «🏆 Universidad más comprometida · UNICATOLICA · 3842h» con el número en amarillo.
3. Chip rojo `#C0392B` «error»:
   - Ranking con el aviso gris en la parte superior «Sin conexión: mostrando el último ranking guardado.»;
   - las filas debajo, al 70 % de opacidad.

**Debajo:** bloque de código con la pestaña «src/screens/auth/LoginScreen.js»:
```js
try {
  await signIn(email, password);
} catch (e) {
  setError(getErrorMessage(e)); // mensaje claro en español
  setLoading(false);
}
```

**Chip final:** «Recarga del ranking: máximo 1 vez por minuto, para ahorrar lecturas».

## Diapositiva 12 · Reglas de seguridad
- Etiqueta: «FIREBASE · SEGURIDAD»
- Título: «Más allá de request.auth != null»

**Visual superior:** **3 tarjetas "escudo"**, cada una con un icono `shield-checkmark-outline` grande en `#00483F` sobre un círculo menta al 20 %.
1. «Solo usuarios con sesión» · chip de código «request.auth != null»
2. «Cada uno escribe lo suyo» · chip «request.auth.uid == uid»
3. «Sin trampas en el ranking» · «los minutos solo suben con una sesión real (máx. 60 min)»

**Visual inferior (izquierda):** bloque de código con la pestaña «firestore.rules»:
```
match /users/{uid} {
  allow read: if request.auth != null;
  allow update: if request.auth.uid == uid
    && (isProfileEdit() || isSessionUpdate(uid));
}
```
Debajo, un chip: «🔑 Los tokens de push (users/{uid}/devices) solo los ve su dueño».

**Visual inferior (derecha):** **tarjeta destacada verde tipo "medalla"**:
- número gigante «17» en `#FFD91A`;
- debajo, en blanco: «pruebas automáticas con el emulador de Firestore»;
- y una lista mini con checks menta: «✓ no se pueden inflar minutos» · «✓ no se reenvía la misma sesión» · «✓ nadie lee ni edita lo de otro».

## Diapositiva 13 · Notificaciones push: cómo funcionan
**Propósito:** explicar el concepto y el camino de una notificación, distinguiendo los dos tipos. Esta diapositiva es conceptual y también muestra qué parte usamos.

- Etiqueta: «NOTIFICACIONES · CONCEPTO»
- Título: «Dos formas de avisar al usuario»

**Layout:** dos tarjetas grandes lado a lado, separadas por un «vs» pequeño.

**Izquierda · tarjeta blanca con borde menta `#65D889` y una insignia «✓ Implementada»:**
- icono `alarm-outline` grande, título «Locales (programadas)»;
- mini diagrama de 2 cajas: «App» → «Sistema operativo programa la alarma»;
- línea: «No necesitan internet ni servidor».
- Etiqueta: «Usamos esto: recordatorio de racha».

**Derecha · tarjeta blanca con borde punteado gris y una insignia «◐ Preparada»:**
- icono `cloud-outline` grande, título «Push remotas»;
- diagrama de 4 cajas en cadena con flechas: «Servidor» → «FCM (Android) / APNs (iOS)» → «Dispositivo» → «Notificación»;
- chip bajo la cadena: «Token del dispositivo → guardado en Firestore».
- Línea: «Necesitan token, servicio de envío y un build propio».

**Franja inferior (tarjeta destacada verde):** icono `bulb-outline` amarillo y el texto «Elegimos empezar por las locales: aportan valor desde el primer día y funcionan en Expo Go».

## Diapositiva 14 · Notificaciones push: cómo las implementamos
**Propósito:** mostrar la implementación real, visual y paso a paso.

- Etiqueta: «NOTIFICACIONES · IMPLEMENTACIÓN»
- Título: «Un recordatorio inteligente de racha»

**Fila superior · flujo de 4 mockups pequeños** unidos por flechas, con un número en círculo `#00483F` sobre cada uno:
1. **Configuración** (modal blanco sobre velo verde): título «Configuración», fila con icono `notifications-outline`, «Recordatorio de racha», subtítulo «Te avisamos a las 8:00 PM si aún no has estudiado hoy.» y un **interruptor verde menta encendido**. Etiqueta: «El usuario lo activa».
2. **Diálogo de permiso del sistema**: cuadro gris claro «¿Permitir que UniStreak te envíe notificaciones?» con botones «No permitir / Permitir». Etiqueta: «Se pide el permiso solo entonces, nunca al abrir la app».
3. **Pomodoro terminado**: el aviso «¡Sesión completada! 🎉» con «🔥 Tu racha continúa». Etiqueta: «Al estudiar se reprograma para mañana».
4. **Banner de notificación** estilo Android: icono verde de UniStreak, «UniStreak · 8:00 PM», título «🔥 ¡No pierdas tu racha!», cuerpo «Llevas 12 días seguidos. Un Pomodoro de 25 minutos y listo.». Etiqueta: «Solo suena si hoy no has estudiado».

**Fila inferior · izquierda:** bloque de código con la pestaña «src/utils/reminder.js»:
```js
export function nextReminderDate(sessions, now = new Date()) {
  const studiedToday = sessions.some((s) => s.date === today);
  const at = new Date(now);
  at.setHours(REMINDER_HOUR, 0, 0, 0); // 8 PM
  if (studiedToday || at <= now) at.setDate(at.getDate() + 1);
  return at;
}
```

**Fila inferior · derecha:** 3 chips de decisión en columna:
- `lock-open-outline` «Opt-in: empieza apagado, el usuario decide».
- `refresh-outline` «Un solo recordatorio pendiente; se reprograma tras cada sesión».
- `flask-outline` «7 pruebas unitarias de la lógica de fecha».

**Chip pequeño en la esquina:** «expo-notifications · canal Android "Recordatorios de racha"».

**Franja final, tarjeta crema con borde punteado:** icono `information-circle-outline` y el texto «Próximo paso: push remotas (requiere development build, projectId de EAS y envío desde Firebase). El token ya se guarda en `users/{uid}/devices` cuando el entorno lo permite».

## Diapositiva 15 · Recomendaciones cumplidas + cierre
**Layout:** **fondo completo `#00483F`**, igual que la portada.
- Etiqueta (en menta): «RESUMEN»
- Título (blanco): «Lo que pedía el curso, implementado»

**Visual:** **dos columnas que imitan el `StreakCard`**: un círculo menta con ✓ blanco por cada ítem completado, como los días cumplidos de la racha. Un ítem pendiente lleva un círculo vacío crema con borde punteado.
- **Columna «Sesión 6 · APIs REST»** (tarjeta blanca al 8 % de opacidad):
  - ✓ async/await + try/catch/finally
  - ✓ Estados loading · success · error
  - ✓ Errores claros para el usuario
  - ✓ Listas renderizadas desde Firestore
- **Columna «Sesión 7 · Firebase»:**
  - ✓ Auth con correo y contraseña
  - ✓ Sesión persistente (AsyncStorage)
  - ✓ onAuthStateChanged + AuthContext
  - ✓ Navegación condicional
  - ✓ Firestore + onSnapshot
  - ✓ Reglas de seguridad
- **Columna «Extra · Notificaciones»:**
  - ✓ Recordatorio local de racha
  - ✓ Permiso bajo demanda
  - ○ Push remoto (siguiente paso)

**Parte inferior:**
- a la izquierda, un **🔥 grande** con el texto «Racha de aprendizaje: en marcha» en `#FFD91A`;
- en el centro, el texto gigante «¡Gracias!» en blanco peso 700;
- a la derecha, un **código QR** hacia `https://github.com/StevanOrtiz/App-Moviles` dentro de una tarjeta blanca de radio 20, con el texto «Código en GitHub» debajo.
- Arriba de «¡Gracias!», un botón amarillo `#FFD91A` con el texto «¿Preguntas?».

---

# PARTE 3 · Reglas finales
1. **Consistencia total con la app:**
   - radios de 20 px (tarjetas) y 16 px (filas y botones);
   - sombras suaves;
   - fondo crema;
   - verde `#00483F` como color dominante;
   - menta para lo positivo y amarillo para lo destacado.
2. **Visual > texto:** si un concepto se puede mostrar con un mockup, un icono o un diagrama, hazlo así. Como máximo unas 25 palabras de texto corrido por diapositiva, sin contar mockups ni código.
3. El código se muestra **tal cual**, sin traducir ni resumir más.
4. Los mockups deben verse como **capturas reales de la app**, con los datos de 1.5. No inventes pantallas ni funciones que no existen.
5. Iconos solo de estilo Ionicons outline. Emojis solo los de la lista de 1.3.
6. **Honestidad técnica con las notificaciones:** los recordatorios locales de racha SÍ están implementados; las push remotas (FCM/APNs) NO. Preséntalas siempre como «siguiente paso» o «preparadas», nunca como terminadas.
7. Sin fotos de stock, degradados, sombras fuertes ni fuentes serif.
