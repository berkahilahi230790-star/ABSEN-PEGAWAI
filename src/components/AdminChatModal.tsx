import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  X,
  Sparkles,
  Paperclip,
  CheckCheck,
  Bot,
  User,
  ShieldAlert,
  HelpCircle,
  Clock,
  PhoneCall,
} from "lucide-react";
import { ChatMessage, EmployeeProfile } from "../types";
import { askAdminAi } from "../services/geminiService";
import { audioNotificationService } from "../services/audioNotification";

interface AdminChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeProfile;
  messages: ChatMessage[];
  onSendMessage: (msg: ChatMessage) => void;
}

export const AdminChatModal: React.FC<AdminChatModalProps> = ({
  isOpen,
  onClose,
  employee,
  messages,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickQuestions = [
    "Berapa sisa cuti tahunan saya?",
    "Bagaimana aturan toleransi terlambat?",
    "Prosedur izin sakit mendadak?",
    "Cara klaim surat tugas dinas luar?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 150);
    }
  }, [isOpen, messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "employee",
      senderName: employee.name,
      text,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
    };

    onSendMessage(userMsg);
    if (!textToSend) setInputText("");
    audioNotificationService.playChime("normal");

    // Admin HR / AI Assistant responds
    setIsTyping(true);
    try {
      const historyContext = messages.slice(-5).map((m) => ({
        sender: m.senderName,
        text: m.text,
      }));

      const res = await askAdminAi(text, employee.name, historyContext);

      const replyMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "admin",
        senderName: res.sender,
        text: res.reply,
        timestamp: res.timestamp,
        status: "delivered",
      };

      onSendMessage(replyMsg);
      audioNotificationService.playChime("success");
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden h-[90vh] max-h-[680px] flex flex-col">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-3.5 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/20 border border-white/30 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"
                  alt="Admin HR"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-blue-700 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-bold leading-tight">Bu Rina (HR Admin)</h2>
                <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded font-semibold text-white/90">
                  Konsultasi Resmi
                </span>
              </div>
              <p className="text-[10px] text-blue-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                Online & Siap Membantu Kepegawaian
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Help Chips Scroll */}
        <div className="bg-slate-50 px-3 py-2 border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-bold text-slate-500 shrink-0">Pilihan Cepat:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[10px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 text-slate-700 font-medium active:scale-95 transition-all shadow-2xs shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gradient-to-b from-slate-50/50 to-white text-xs">
          <div className="text-center my-1">
            <span className="text-[10px] text-slate-400 bg-slate-100/90 px-2.5 py-0.5 rounded-full font-medium">
              Percakapan Terenkripsi dengan Tim HRD
            </span>
          </div>

          {messages.map((msg) => {
            const isMe = msg.sender === "employee";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%] ${
                  isMe ? "ml-auto" : "mr-auto"
                }`}
              >
                {!isMe && (
                  <span className="text-[10px] font-semibold text-slate-500 mb-1 ml-1 flex items-center gap-1">
                    <Bot className="w-3 h-3 text-blue-600" />
                    {msg.senderName}
                  </span>
                )}
                <div
                  className={`p-3 rounded-2xl shadow-2xs leading-relaxed text-[11px] ${
                    isMe
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400 px-1">
                  <span>{msg.timestamp}</span>
                  {isMe && <CheckCheck className="w-3 h-3 text-blue-500" />}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 text-slate-500 text-[11px] bg-slate-100/80 px-3 py-1.5 rounded-xl w-fit">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>Bu Rina sedang mengetik jawaban administrasi...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ketik pertanyaan administrasi atau izin..."
              className="flex-1 px-3.5 py-2.5 bg-slate-100/90 rounded-xl text-xs border border-transparent focus:border-blue-400 focus:bg-white focus:outline-none placeholder:text-slate-400 transition-colors"
            />
            <button
              id="send-chat-msg-btn"
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isTyping}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              aria-label="Kirim Pesan"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
