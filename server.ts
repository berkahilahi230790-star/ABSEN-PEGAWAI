import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const PORT = 3000;
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  // API Health
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI HR Admin Consultation Chat Endpoint
  app.post("/api/admin-chat", async (req, res) => {
    try {
      const { message, employeeName, history = [] } = req.body;
      const ai = getAiClient();

      if (!ai) {
        // Fallback intelligent response if API key is not configured
        const fallbackAnswers = [
          `Halo ${employeeName || "Rekan"}, terkait pertanyaan "${message}", ketentuan HR mengatur bahwa pengajuan izin/cuti wajib disubmit minimal H-1 melalui menu Izin di aplikasi dengan melampirkan bukti yang relevan. Jika ada kendala medis mendesak, silakan hubungi nomor darurat HRD.`,
          `Terima kasih sudah berkonsultasi, ${employeeName || "Rekan"}. Mengenai "${message}", kebijakan absensi fleksibel kantor memperbolehkan batas toleransi 15 menit. Untuk verifikasi wajah dan GPS, pastikan Anda berada dalam radius 150 meter dari kantor.`,
          `Baik, ${employeeName || "Rekan"}. Terkait permohonan administrasi tersebut, data Anda sudah tercatat di sistem kami dan akan ditinjau oleh Manajer Divisi pada hari kerja berikutnya.`
        ];
        const randomAnswer = fallbackAnswers[Math.floor(Math.random() * fallbackAnswers.length)];
        return res.json({
          reply: randomAnswer,
          sender: "HRD Admin PresensiGo",
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          source: "fallback",
        });
      }

      const prompt = `Anda adalah 'Bu Rina' - Senior HRD & Administrasi Kepegawaian di sistem aplikasi absensi mobile PresensiGo.
Nama pegawai yang bertanya: ${employeeName || "Pegawai"}.
Pertanyaan pegawai: "${message}"

Riwayat pesan sebelumnya:
${history.map((h: any) => `${h.sender}: ${h.text}`).slice(-4).join("\n")}

Tugas Anda:
1. Berikan jawaban yang ramah, profesional, solutif, dan empati dalam Bahasa Indonesia santun.
2. Jelaskan prosedur administrasi seperti pengajuan cuti, sakit, izin dinas, aturan jam masuk/pulang kantor, toleransi keterlambatan, dan verifikasi absensi GPS/Wajah jika relevan.
3. Jawaban ringkas, jelas (maksimal 3-4 kalimat padat) agar nyaman dibaca di layar smartphone mobile e-commerce style.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      res.json({
        reply: response.text || "Terima kasih telah menghubungi Admin HRD. Pertanyaan Anda sudah kami catat.",
        sender: "Bu Rina (HR Admin)",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        source: "gemini-ai",
      });
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      res.json({
        reply: "Halo, pesan Anda telah diterima oleh Admin HRD PresensiGo. Kami akan segera menindaklanjuti permohonan administrasi Anda secepatnya.",
        sender: "HR Admin PresensiGo",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        source: "offline-fallback",
      });
    }
  });

  // AI Push Voice Reminder Generator Endpoint
  app.post("/api/ai-reminder", async (req, res) => {
    try {
      const { type, employeeName, lateThresholdTime, checkInDeadline } = req.body;
      const ai = getAiClient();

      if (!ai) {
        let reminderText = "";
        if (type === "warning_5min") {
          reminderText = `Peringatan Penting! Halo ${employeeName || "Rekan Pegawai"}, waktu tersisa 5 menit lagi sebelum batas toleransi terlambat pukul ${lateThresholdTime || "08:15"}. Segera lakukan absen foto wajah dan GPS sekarang!`;
        } else if (type === "daily_checkin") {
          reminderText = `Selamat pagi ${employeeName || "Rekan"}! Jam kantor dimulai pukul ${checkInDeadline || "08:00"}. Jangan lupa lakukan absensi masuk hari ini untuk menjaga rekor kehadiran Anda.`;
        } else {
          reminderText = `Waktu kerja hari ini telah selesai! Jangan lupa lakukan check-out presensi pulang dan beristirahatlah dengan baik.`;
        }
        return res.json({ text: reminderText, title: type === "warning_5min" ? "⚠️ Pengingat 5 Menit Terlambat" : "⏰ Pengingat Absensi Harian" });
      }

      const prompt = `Buatkan 1 kalimat notifikasi push suara AI berbahasa Indonesia yang ramah, jelas, dan bersemangat untuk aplikasi absensi pegawai mobile.
Tipe: ${type === "warning_5min" ? "Pengingat darurat 5 menit sebelum batas terlambat" : "Pengingat jadwal absen harian masuk kantor"}
Nama Pegawai: ${employeeName || "Karyawan"}
Waktu Batas: ${lateThresholdTime || "08:15 WIB"}
Pastikan kalimat mudah diucapkan oleh Text-to-Speech (panjang 15-25 kata).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      res.json({
        text: response.text?.trim() || `Halo ${employeeName || "Rekan"}, segera lakukan absensi presensi wajah sebelum waktu batas berakhir!`,
        title: type === "warning_5min" ? "⚠️ Pengingat 5 Menit Terlambat" : "⏰ Jadwal Absensi Harian",
      });
    } catch (err: any) {
      res.json({
        text: `Halo ${req.body.employeeName || "Rekan"}, jangan lupa lakukan absensi masuk sekarang untuk menghindari status terlambat.`,
        title: "⏰ Pengingat Presensi",
      });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PresensiGo Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
