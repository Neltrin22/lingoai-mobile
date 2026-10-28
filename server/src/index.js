import "dotenv/config";
import os from "node:os";
import cors from "cors";
import express from "express";
import multer from "multer";
import { chat, modelInfo, pronounce, transcribe } from "./tutor.js";

const PORT = Number(process.env.PORT || 3001);
const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

const LEVELS = ["beginner", "intermediate", "advanced"];
const MODES = ["free", "vocabulary", "grammar", "pronunciation", "exercise"];

/* ─── Salud del servicio ─── */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ...modelInfo(), uptime: Math.round(process.uptime()) });
});

app.get("/", (_req, res) => {
  res.json({
    name: "LingoAI backend",
    ...modelInfo(),
    endpoints: ["GET /api/health", "POST /api/chat", "POST /api/transcribe", "POST /api/pronounce"],
  });
});

/* ─── Chat con el tutor ─── */
app.post("/api/chat", async (req, res) => {
  const { message, level, mode, history, name } = req.body ?? {};

  if (typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "El campo 'message' es obligatorio." });
  }

  const safeLevel = LEVELS.includes(level) ? level : "intermediate";
  const safeMode = MODES.includes(mode) ? mode : "free";
  const safeHistory = Array.isArray(history) ? history : [];

  const result = await chat({
    message: message.trim(),
    level: safeLevel,
    mode: safeMode,
    history: safeHistory,
    name: typeof name === "string" ? name.slice(0, 40) : "estudiante",
  });

  res.json(result);
});

/* ─── Voz → texto ─── */
app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Falta el archivo 'audio'." });
  const text = await transcribe(req.file.buffer, req.file.mimetype);
  res.json({ text });
});

/* ─── Evaluación de pronunciación ─── */
app.post("/api/pronounce", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Falta el archivo 'audio'." });
  const target = typeof req.body?.target === "string" ? req.body.target : "";
  if (target.trim().length === 0) {
    return res.status(400).json({ error: "Falta la frase objetivo ('target')." });
  }
  const result = await pronounce(req.file.buffer, req.file.mimetype, target);
  res.json(result);
});

/* ─── 404 y errores ─── */
app.use((_req, res) => res.status(404).json({ error: "Ruta no encontrada." }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.statusCode || (err.code === "LIMIT_FILE_SIZE" ? 413 : 500);
  if (status >= 500) console.error("[server]", err);
  res.status(status).json({ error: err.message || "Error interno del servidor." });
});

function localAddresses() {
  const nets = os.networkInterfaces();
  const addresses = [];
  for (const list of Object.values(nets)) {
    for (const net of list ?? []) {
      if (net.family === "IPv4" && !net.internal) addresses.push(net.address);
    }
  }
  return addresses;
}

app.listen(PORT, "0.0.0.0", () => {
  const info = modelInfo();
  console.log(`\n🧠 LingoAI backend escuchando en el puerto ${PORT}`);
  console.log(`   Modo IA: ${info.ai === "live" ? `OpenAI (${info.model})` : "DEMO (sin OPENAI_API_KEY)"}`);
  for (const address of localAddresses()) {
    console.log(`   → http://${address}:${PORT}  (usa esta URL en el celular)`);
  }
  console.log("");
});
