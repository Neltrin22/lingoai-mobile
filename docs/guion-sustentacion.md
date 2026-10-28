# Guion de sustentación — LingoAI

> Duración objetivo: **10–12 minutos** (7 diapositivas + demo en vivo).
> Basado en `Presentación_Proyecto_Computación_Móvil_v3.pptx`, actualizado al stack real.

---

## Reparto sugerido

| Bloque | Quién | Tiempo |
| --- | --- | --- |
| 1–3 (problema, propuesta, onboarding) | Nelson | 4 min |
| Demo en vivo | Nelson (opera) / Jhon (narra) | 3 min |
| 4–7 (progreso, tecnología, cierre) | Jhon | 4 min |
| Preguntas | Ambos | — |

---

## Diapositiva 1 — Portada

**En pantalla**
- LingoAI · "Tu tutor personal de inglés, disponible 24/7"
- Computación Móvil · UdeA · Nelson Puerta · Jhon Rodas

**Qué decir**
> "Buenos días. Somos Nelson y Jhon, y construimos LingoAI: una app Android que funciona
> como un tutor de inglés con inteligencia artificial. La idea nace de un problema
> concreto: la mayoría de la gente entiende inglés, pero no se atreve a hablarlo."

---

## Diapositiva 2 — El problema: inglés sin miedo

**En pantalla**
- Practicar conversaciones reales en un entorno seguro
- Correcciones gramaticales al instante
- Mejorar fluidez en texto y voz

**Qué decir**
> "El obstáculo no es la gramática: es el miedo a equivocarse frente a otra persona y la
> falta de alguien con quien practicar fuera de clase. Las apps tradicionales son
> ejercicios estáticos que no se adaptan al nivel ni a los errores de cada estudiante.
> LingoAI ataca justamente eso: un espacio privado, disponible 24/7, que conversa, corrige
> y explica."

---

## Diapositiva 3 — Una experiencia personalizada

**En pantalla**
- Test de nivelación de 5 preguntas → A1–A2, B1–B2 o C1–C2
- Lecciones y metas adaptadas
- El tutor explica cada error

**Qué decir**
> "Al entrar, la app hace un diagnóstico corto y calcula el nivel. Ese nivel no es
> decorativo: cambia el vocabulario, la longitud de las frases, los ejercicios y hasta las
> frases de pronunciación. Y cuando el estudiante se equivoca, no solo recibe la
> corrección: ve la regla y un ejemplo nuevo."

---

## Demo en vivo (3 minutos)

> Ten la app **ya abierta** en el celular y el backend corriendo. Si falla la red, la app
> cae automáticamente a *modo local* y la demo sigue.

**Guion exacto**

1. **Onboarding (20 s)** — Responde el test acertando 4–5 → "Avanzado". Muestra el
   resultado y el ajuste manual.
2. **Chat (50 s)** — Elige *Conversación libre* y escribe:
   `I goed to the store yesterday`.
   - Se muestra la tarjeta **"Casi perfecto"** → expándela.
   - Señala: corrección + regla en español + ejemplo.
   - Toca el ícono de volumen: el tutor lee la respuesta (TTS).
3. **Pronunciación (50 s)** — Cambiar actividad → *Pronunciación*. Toca "escuchar modelo",
   graba la frase, detén y muestra **puntaje + palabras acertadas**.
4. **Quiz (30 s)** — Cambiar actividad → *Ejercicio rápido*, responde 3 preguntas, muestra
   "3/3" y "Ver resultados".
5. **Progreso (30 s)** — Pestaña *Progreso*: habilidades movidas, palabras guardadas,
   flashcards generadas del error. Cierra en *Perfil* mostrando la URL del backend.

**Frase de cierre de la demo**
> "Todo lo que vieron quedó guardado en el dispositivo: si cierro la app y la abro, el
> nivel, la racha, el chat y las flashcards siguen ahí."

**Plan B**
- Sin internet/key: el chat responde en modo local (banner ámbar) y la voz se desactiva con
  un mensaje claro; el resto de la app funciona igual.
- Sin celular: build web (`npm run web`) o video grabado de la demo.

---

## Diapositiva 4 — Progreso que se convierte en hábito

**En pantalla**
- Análisis de vocabulario, gramática, pronunciación y comprensión
- Rachas, meta diaria y flashcards de los errores
- 4 métricas acumuladas

**Qué decir**
> "El progreso no son datos inventados: cada corrección sube gramática, cada quiz sube
> gramática y comprensión, cada grabación ajusta pronunciación, y los minutos se cuentan
> con un temporizador real mientras el estudiante está en el chat. La racha se rompe si no
> practica, y eso es lo que sostiene el hábito."

---

## Diapositiva 5 — Tecnología y desafíos

**En pantalla**
- React Native + Expo (TypeScript) · backend Node/Express
- OpenAI `gpt-4o-mini` + Whisper · `expo-audio` / `expo-speech`
- Persistencia local con AsyncStorage
- Desafíos: prompt pedagógico, latencia, seguridad de la key

**Qué decir**
> "El anteproyecto decía Kotlin y Jetpack Compose. Lo cambiamos a React Native con Expo por
> una razón práctica: el prototipo ya era React y no teníamos Android SDK instalado, así
> que en vez de reescribir todo podíamos dedicar el tiempo a la funcionalidad. El resultado
> sigue siendo una app Android con APK instalable, y probamos en celular en segundos.
>
> Tres decisiones técnicas importantes:
> 1. La API key vive en un backend proxy, nunca en el APK.
> 2. Si el backend falla, la app sigue funcionando con un tutor local: la demo no se cae.
> 3. El puntaje de pronunciación es determinista: transcribimos con Whisper y comparamos
>    palabra por palabra contra la frase, en vez de pedirle una nota al modelo."

---

## Diapositiva 6 — Más que una app de ejercicios

**En pantalla**
- Practica · Corrige · Progresa
- Inglés sin miedo. Todos los días.

**Qué decir**
> "LingoAI no reemplaza al profesor: elimina la barrera de entrada. Un estudiante puede
> practicar cinco minutos en el bus, recibir una corrección y volver mañana. La IA hace
> posible que un tutor personalizado no sea un lujo."

---

## Diapositiva 7 — Cierre y equipo

**En pantalla**
- Gracias
- Nelson Alcides Puerta García · Jhon Deivy Rodas Morales

**Qué decir**
> "Muchas gracias. Quedamos atentos a sus preguntas."

---

## Preguntas probables (y respuestas cortas)

**¿Por qué no usaron Android nativo como decía el anteproyecto?**
> Porque el prototipo ya estaba en React y no teníamos SDK de Android instalado; migrar a
> Kotlin implicaba reescribir UI, estado y servicios. Con Expo entregamos la misma
> funcionalidad en el tiempo disponible y con menos riesgo. Está documentado en
> `docs/actualizacion-anteproyecto.md`.

**¿Dónde está la API key? ¿No es inseguro?**
> En el servidor (`server/.env`), nunca en el APK. El cliente solo habla con nuestro
> backend. Para producción faltaría autenticación y HTTPS.

**¿Cómo califican la pronunciación?**
> Whisper transcribe el audio y alineamos la transcripción con la frase objetivo usando
> subsecuencia común más larga. El puntaje es el porcentaje de palabras reconocidas y el
> feedback lista las que fallaron. Es reproducible y no depende del humor del modelo.

**¿Qué pasa si no hay internet?**
> El chat entra en modo local con reglas para errores frecuentes; la voz avisa que necesita
> el backend. El progreso y las flashcards se siguen guardando.

**¿Cómo evitan que el modelo responda cualquier cosa?**
> El prompt fija rol, nivel, idioma, longitud y formato JSON. El backend valida la
> respuesta y descarta correcciones incompletas.

**¿Cuánto cuesta?**
> `gpt-4o-mini` con respuestas cortas e historial de 10 turnos. Una sesión de práctica
> cuesta fracciones de centavo; Whisper solo se usa al grabar.

**¿Qué falta?**
> Login/sincronización con Firebase, logros, notificaciones de recordatorio y evaluación
> fonémica más fina.

**¿Qué parte es "de verdad" y qué es mock?**
> Todo el flujo es real: backend, OpenAI, grabación, transcripción y persistencia. El único
> respaldo simulado es el *fallback* que se activa si no hay backend, y la interfaz lo
> indica explícitamente.

---

## Checklist previo a la sustentación

- [ ] Backend corriendo (`npm start` en `server/`) y `/api/health` responde `"ai": "live"`.
- [ ] Créditos de OpenAI disponibles (probar un mensaje antes de entrar).
- [ ] Celular y PC en la misma red; URL verificada en **Perfil → Probar**.
- [ ] APK instalado y con permisos de micrófono concedidos.
- [ ] Volumen del celular alto (para el TTS).
- [ ] Batería y "no molestar" configurados.
- [ ] Video de respaldo de la demo (2 min) por si falla la red.
