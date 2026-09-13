// Service connecting to backend Express Gemini endpoints

export async function askAdminAi(
  message: string,
  employeeName: string = "Ahmad Pratama",
  history: Array<{ sender: string; text: string }> = []
): Promise<{ reply: string; sender: string; timestamp: string }> {
  try {
    const res = await fetch("/api/admin-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, employeeName, history }),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return {
      reply: data.reply || "Pesan telah dicatat oleh HR Admin.",
      sender: data.sender || "Bu Rina (HR Admin)",
      timestamp: data.timestamp || new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };
  } catch (err) {
    console.warn("Using smart fallback response for HR consultation:", err);
    return {
      reply: `Halo ${employeeName}, mengenai pertanyaan Anda: untuk permohonan administrasi atau izin/cuti, silakan gunakan tombol 'Ajukan Izin' pada aplikasi dan pastikan dokumen pendukung sudah diunggah. Kami akan memproses verifikasi maksimal 1x24 jam kerja.`,
      sender: "Bu Rina (HR Admin)",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };
  }
}

export async function getAiReminderAnnouncement(
  type: "warning_5min" | "daily_checkin" | "checkout_reminder",
  employeeName: string = "Ahmad Pratama",
  lateThresholdTime: string = "08:15"
): Promise<{ text: string; title: string }> {
  try {
    const res = await fetch("/api/ai-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, employeeName, lateThresholdTime }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (type === "warning_5min") {
      return {
        title: "⚠️ Peringatan 5 Menit Terlambat",
        text: `Perhatian! Halo ${employeeName}, tersisa 5 menit sebelum batas toleransi terlambat pukul ${lateThresholdTime}. Segera lakukan absen verifikasi wajah sekarang!`,
      };
    }
    return {
      title: "⏰ Jadwal Absensi Harian",
      text: `Selamat pagi ${employeeName}! Jangan lupa lakukan presensi wajah dan lokasi GPS hari ini untuk mencatat kehadiran tepat waktu.`,
    };
  }
}
