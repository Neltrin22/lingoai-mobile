# LingoAI — Tutor de inglés con IA (Android)

Aplicación móvil de aprendizaje de inglés que conversa, corrige y mide el progreso del
estudiante. Nace del prototipo de Figma (`../prototipo lingoai`) y se reescribió como app
móvil real con **React Native + Expo**, con un **backend proxy** que guarda la API key de
OpenAI.

> Computación Móvil · Universidad de Antioquia · 2026-2
> Nelson Alcides Puerta García · Jhon Deivy Rodas Morales

---

## 1. Qué hace la app

| Módulo | Estado | Detalle |
| --- | --- | --- |
| Onboarding con test de nivel | ✅ | 5 preguntas, calcula A1–A2 / B1–B2 / C1–C2 y permite ajuste manual |
| Chat de texto con tutor IA | ✅ | OpenAI (`gpt-4o-mini`), prompt por nivel y por modo |
| Correcciones con explicación | ✅ | Tarjeta expandible con corrección, regla y ejemplo |
| Chat de voz | ✅ | Grabación (`expo-audio`) → transcripción Whisper en el backend |
| Pronunciación con puntaje | ✅ | Alineación palabra por palabra contra la frase objetivo + feedback |
| Texto a voz | ✅ | `expo-speech` (TTS del dispositivo, inglés US), se puede silenciar |
| Dashboard | ✅ | Racha, meta diaria, palabras nuevas, progreso semanal |
| Análisis de progreso | ✅ | Habilidades, estadísticas y actividad de 7 días calculadas con datos reales |
| Flashcards automáticas | ✅ | Se generan de las correcciones y del vocabulario; se guardan localmente |
| Gamificación (racha y meta) | ✅ | Racha por días consecutivos y meta diaria de 30 min |
| Logros / insignias | ⛔ | Fase 2 |
| Registro e inicio de sesión | ⛔ | Fase 2 (hoy el perfil es local: nombre + nivel) |
| Sincronización en la nube | ⛔ | Fase 2 (Firebase) |

Todo el progreso persiste en el dispositivo con `AsyncStorage`, así que sobrevive al
cierre de la app.

---

## 2. Stack y por qué

| Capa | Tecnología |
| --- | --- |
| App | React Native 0.88 + Expo SDK 58 + TypeScript |
| Navegación | Estado interno + barra inferior (4 pestañas) |
| Persistencia | `@react-native-async-storage/async-storage` |
| Voz | `expo-audio` (grabar), `expo-speech` (leer), Whisper (transcribir) |
| UI | `expo-linear-gradient`, `react-native-svg`, `@expo/vector-icons`, fuente Outfit |
| Backend | Node.js + Express 5 + SDK oficial de OpenAI |

**Por qué no Kotlin/Jetpack Compose** (como decía el anteproyecto): el prototipo ya era
React, el equipo ya domina ese stack y no había Android SDK instalado en los equipos.
Con Expo se prueba en un celular físico en minutos y se genera el APK en la nube, sin
depender de Android Studio. La funcionalidad del anteproyecto se conserva; el detalle de
la justificación está en [`docs/actualizacion-anteproyecto.md`](docs/actualizacion-anteproyecto.md).

---

## 3. Arquitectura

```
┌─────────────────────────────┐        HTTPS/HTTP        ┌──────────────────────────┐
│  App Android (Expo/RN)      │  ─────────────────────►  │  Backend proxy (Node)    │
│                             │                          │                          │
│  Pantallas                  │   POST /api/chat         │  Prompt engineering      │
│   · Onboarding              │   POST /api/transcribe   │  Validación de JSON      │
│   · Dashboard               │   POST /api/pronounce    │  Fallback a modo demo    │
│   · Chat (+ widgets)        │                          │  OPENAI_API_KEY (.env)   │
│   · Progreso                │  ◄─────────────────────  │                          │
│   · Perfil                  │   JSON normalizado       └───────────┬──────────────┘
│                             │                                      │
│  Estado global (Context)    │                                      ▼
│  AsyncStorage (persistencia)│                          ┌──────────────────────────┐
│  expo-audio / expo-speech   │                          │  OpenAI API              │
└─────────────────────────────┘                          │  chat + whisper          │
                                                          └──────────────────────────┘
```

Decisiones clave:

- **La API key nunca viaja al APK.** El cliente llama al proxy; el proxy firma la petición.
- **La IA no es obligatoria para la demo.** Si el backend o la key fallan, el cliente cae a
  un tutor local con reglas y la UI avisa con un banner ("modo local").
- **El puntaje de pronunciación es determinista** (alineación LCS contra la frase), no una
  opinión del modelo: sirve para mostrar métricas estables en la sustentación.

---

## 4. Requisitos

- Node.js 20+ (probado con 25.6)
- npm 10+
- Un celular Android con **Expo Go** (misma red Wi-Fi que el PC)
- (Para el APK) cuenta gratuita de Expo

---

## 5. Puesta en marcha

### 5.1 Backend

```powershell
cd server
Copy-Item .env.example .env
# Edita .env y pon tu OPENAI_API_KEY (si no la pones, arranca en modo demo)
npm install
npm start
```

Al arrancar imprime las IPs de tu PC:

```
🧠 LingoAI backend escuchando en el puerto 3001
   Modo IA: OpenAI (gpt-4o-mini)
   → http://192.168.0.10:3001  (usa esta URL en el celular)
```

Comprueba: `http://localhost:3001/api/health`

### 5.2 App

```powershell
cd lingoai-mobile      # raíz de este repo
npm install
npm start
```

Escanea el QR con Expo Go (Android). La app detecta automáticamente la IP de Metro, así
que en desarrollo **no** hace falta configurar la URL del backend… siempre que el backend
esté en el mismo PC y en el puerto 3001.

Si usas otra máquina/puerto, crea `.env`:

```
EXPO_PUBLIC_API_URL=http://192.168.0.10:3001
```

y reinicia con `npm start -- --clear`.

### 5.3 Verificar la conexión

En la app: **Perfil → Servidor del tutor → Guardar y probar**. Debe responder
"IA conectada (gpt-4o-mini)" o "Servidor activo · modo demo".

---

## 6. Generar el APK (EAS)

Requisitos: cuenta de Expo (gratis) y haber hecho `eas login`.

```powershell
npm install -g eas-cli
eas login
eas init          # crea el projectId y lo escribe en app.json

# APK de prueba (perfil "preview")
npm run build:apk
```

Al terminar, EAS da un enlace de descarga y un QR. Instálalo en el celular
(permitir "instalar apps de origen desconocido").

**Importante para el APK**: en una build de producción no existe Metro, así que la app no
puede adivinar la IP. Define la URL antes de compilar:

```powershell
$env:EXPO_PUBLIC_API_URL = "http://192.168.0.10:3001"
npm run build:apk
```

…o cambia la URL después de instalar, desde **Perfil → Servidor del tutor** (se guarda en
el dispositivo). El backend debe seguir accesible desde la red del celular.

`eas.json` ya incluye:

- `preview` → **APK** (para entregar/probar)
- `production` → **AAB** (para Play Store)
- `development` → dev client

> Nota: el backend escucha en `0.0.0.0`. Si el celular no conecta, revisa el Firewall de
> Windows (permitir Node en redes privadas) y que ambos equipos estén en la misma red.

### 6.1 Alternativa: compilar el APK localmente (sin cuenta Expo)

Requiere Android SDK + JDK 17+ y `ANDROID_HOME` configurado. En este equipo el SDK está en
`%LOCALAPPDATA%\Android\Sdk`.

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:EXPO_PUBLIC_API_URL = "http://192.168.0.10:3001"   # opcional

npx expo prebuild --platform android --clean
cd android
.\gradlew.bat assembleRelease
```

El APK queda en `android/app/build/outputs/apk/release/app-release.apk`. La firma usa el
keystore de debug (suficiente para instalar y probar; para publicar hay que crear uno
propio).

También puedes instalar directo en un dispositivo conectado por USB:

```powershell
npx expo run:android --variant release
```

La carpeta `android/` es generada y está ignorada por git; se recrea en cualquier momento
con `expo prebuild`.

---

## 7. Contrato de la API

### `GET /api/health`

```json
{ "ok": true, "ai": "live", "model": "gpt-4o-mini", "transcribeModel": "whisper-1" }
```

### `POST /api/chat`

```json
{
  "message": "I goed to the store yesterday",
  "level": "beginner",
  "mode": "free",
  "history": [{ "role": "assistant", "content": "Hi!" }],
  "name": "María"
}
```

Respuesta:

```json
{
  "reply": "¡Casi! Revisa la corrección 👇",
  "correction": {
    "status": "Casi perfecto 🟡",
    "fix": "I went to the store yesterday.",
    "explanation": "Go es irregular: go → went → gone.",
    "example": "I went to the store yesterday.",
    "word": "went",
    "definition": "pasado simple de go"
  },
  "vocabulary": [],
  "provider": "openai"
}
```

`correction` puede ser `null`. `provider` es `demo` cuando no hay backend/key.

### `POST /api/transcribe`

`multipart/form-data` con `audio` → `{ "text": "..." }`

### `POST /api/pronounce`

`multipart/form-data` con `audio` y `target` (frase esperada) →

```json
{
  "score": 82,
  "transcript": "notwithstanding the setbacks the team delivered an outstanding result",
  "feedback": "Buen trabajo. Refuerza: notwithstanding.",
  "words": [{ "word": "notwithstanding", "ok": true }],
  "provider": "openai"
}
```

---

## 8. Estructura del proyecto

```
lingoai-mobile/
├─ App.tsx                     # raíz: fuentes, providers, tabs, botón atrás
├─ app.json                    # nombre, package Android, permisos, plugins
├─ eas.json                    # perfiles de build (APK/AAB)
├─ src/
│  ├─ theme.ts                 # tokens de diseño (colores, tipografía, sombras)
│  ├─ types.ts                 # tipos compartidos
│  ├─ data/content.ts          # niveles, modos, test, ejercicios, vocabulario
│  ├─ state/store.tsx          # estado global + persistencia + métricas
│  ├─ services/
│  │  ├─ api.ts                # chat/voz + fallback local
│  │  ├─ config.ts             # resolución de la URL del backend
│  │  └─ speech.ts             # TTS
│  ├─ hooks/
│  │  ├─ useRecorder.ts        # grabación con permisos
│  │  └─ useStudyTimer.ts      # minutos de estudio reales
│  ├─ components/              # UI reutilizable (cards, nav, gráficos, widgets)
│  ├─ screens/                 # Onboarding, Dashboard, Chat, Progreso, Perfil
│  └─ utils/                   # fechas e ids
├─ server/
│  ├─ src/index.js             # Express: rutas y validación
│  ├─ src/tutor.js             # prompts, OpenAI, alineación LCS, modo demo
│  └─ .env.example
└─ docs/                       # anteproyecto actualizado y guion de sustentación
```

La alineación del puntaje de pronunciación usa subsecuencia común más larga (LCS).

---

## 9. Flujo de voz

1. El usuario toca el micrófono → se piden permisos y se graba en `.m4a` (`expo-audio`).
2. Al detener, el archivo se envía a `POST /api/transcribe` (multipart).
3. El backend transcribe con Whisper y devuelve el texto.
4. En el chat, el texto se envía como mensaje normal al tutor.
5. En el widget de pronunciación se compara contra la frase objetivo y se devuelve
   puntaje + palabras acertadas + feedback.
6. El TTS (`expo-speech`) lee las respuestas del tutor si está activado.

> La voz requiere el backend activo (Whisper corre allí). Si no hay conexión, la app lo
> avisa explícitamente en lugar de inventar un puntaje.

---

## 10. Verificación realizada

- `npx tsc --noEmit` → sin errores.
- `npx expo export --platform android` → bundle generado (2.3 MB).
- Flujo completo probado en build web: onboarding (5/5 → avanzado), chat con corrección
  real desde el backend, widgets de vocabulario/quiz/pronunciación, dashboard, progreso y
  perfil.
- Backend probado en modo demo y con contrato JSON validado.

---

## 11. Problemas comunes

| Síntoma | Causa / solución |
| --- | --- |
| El chat responde "modo local" | Backend apagado, IP incorrecta o firewall. Prueba `/api/health` desde el navegador del celular. |
| "Falta OPENAI_API_KEY" | No hay `.env` en `server/` o la key no empieza por `sk-`. Sin key el chat funciona en demo, la voz no. |
| La app no conecta tras reiniciar el PC | Cambió la IP LAN: actualízala en Perfil o en `.env` y reinicia Metro con `--clear`. |
| El micrófono no graba | Permiso denegado: Ajustes de Android → Apps → LingoAI → Permisos → Micrófono. |
| El APK no conecta al backend | Falta `EXPO_PUBLIC_API_URL` en la build y/o `usesCleartextTraffic` (ya está configurado en `app.json`). |
| Error 429 | Cuota de OpenAI agotada. |

---

## 12. Seguridad

- La API key **solo** vive en `server/.env` (ignorado por git).
- No se registran conversaciones completas en el servidor; solo errores técnicos.
- `server/` debe desplegarse en un entorno controlado; no se expone públicamente en la demo.
- Para producción: añadir autenticación al backend, rate limiting y HTTPS.

---

## 13. Documentos de entrega

- [`docs/actualizacion-anteproyecto.md`](docs/actualizacion-anteproyecto.md): secciones 5–8
  actualizadas al stack real.
- [`docs/guion-sustentacion.md`](docs/guion-sustentacion.md): guion diapositiva por
  diapositiva + demo + preguntas probables.
