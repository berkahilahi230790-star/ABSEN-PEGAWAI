// Audio notification & Speech Synthesis Service

class AudioNotificationService {
  private audioCtx: AudioContext | null = null;
  private isSpeaking: boolean = false;

  private initAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Play pleasant modern chime (high-tech two-tone ding)
  public playChime(type: "normal" | "warning" | "success" = "normal") {
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";

      if (type === "warning") {
        // Two urgent warning beeps
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.12); // A5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === "success") {
        // Melodic triple chime
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
        frequencies.forEach((freq, idx) => {
          const o = this.audioCtx!.createOscillator();
          const g = this.audioCtx!.createGain();
          o.type = "sine";
          o.frequency.value = freq;
          const startTime = now + idx * 0.09;
          g.gain.setValueAtTime(0.12, startTime);
          g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
          o.connect(g);
          g.connect(this.audioCtx!.destination);
          o.start(startTime);
          o.stop(startTime + 0.35);
        });
      } else {
        // Standard gentle notification chime (E5 -> A5)
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch (e) {
      console.warn("Audio chime error:", e);
    }
  }

  // Indonesian Text-to-Speech (TTS) using Web Speech API
  public speakIndonesian(text: string, onEnd?: () => void): Promise<void> {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) {
        console.warn("Web Speech API not supported");
        resolve();
        return;
      }

      // Play chime first
      this.playChime("warning");

      // Cancel ongoing speech
      window.speechSynthesis.cancel();

      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = "id-ID";
          utterance.rate = 1.0;
          utterance.pitch = 1.05;

          // Attempt to find Indonesian voice
          const voices = window.speechSynthesis.getVoices();
          const idVoice = voices.find(
            (v) => v.lang.includes("id") || v.lang.includes("ID") || v.name.toLowerCase().includes("indonesia")
          );
          if (idVoice) {
            utterance.voice = idVoice;
          }

          utterance.onend = () => {
            this.isSpeaking = false;
            if (onEnd) onEnd();
            resolve();
          };

          utterance.onerror = (e) => {
            console.warn("Speech error:", e);
            this.isSpeaking = false;
            resolve();
          };

          this.isSpeaking = true;
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.error("Speech synthesis invocation failed:", err);
          resolve();
        }
      }, 300);
    });
  }

  public stopSpeaking() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }

  // Push notification permission & prompt
  public async requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission !== "denied") {
      const perm = await Notification.requestPermission();
      return perm === "granted";
    }
    return false;
  }

  public sendPushNotification(title: string, options?: NotificationOptions) {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          ...options,
        });
      } catch (e) {
        console.warn("Push notification display failed:", e);
      }
    }
  }
}

export const audioNotificationService = new AudioNotificationService();
