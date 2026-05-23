import { useState, useEffect, useRef } from "react";
import { X, Send, UserRound, Truck } from "lucide-react";
import api from "../services/api";

const ChatWindow = ({ orderCode, role, userName, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chat/${orderCode}`);
      setMessages(res.data);
      scrollToBottom();
    } catch (err) {
      console.error("Gagal mengambil pesan:", err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Polling every 3s
    return () => clearInterval(interval);
  }, [orderCode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      const newMsg = {
        order_code: orderCode,
        sender_role: role,
        sender_name: userName,
        message: input.trim(),
      };
      
      // Optimistic UI update
      setMessages((prev) => [...prev, { ...newMsg, created_at: new Date().toISOString() }]);
      setInput("");
      scrollToBottom();

      await api.post("/chat/", newMsg);
      fetchMessages();
    } catch (err) {
      console.error("Gagal mengirim pesan:", err);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[350px] max-w-[calc(100vw-2rem)] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between text-white shadow-sm">
        <div>
          <h3 className="font-bold">Chat Pesanan</h3>
          <p className="text-xs text-emerald-100 opacity-90 font-mono">{orderCode}</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-emerald-700 rounded-lg transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 h-[350px] overflow-y-auto bg-slate-50 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400 font-semibold text-center px-4">
            Belum ada pesan. Mulai sapa {role === "customer" ? "kurir" : "pelanggan"} Anda!
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_role === role;
            return (
              <div key={i} className={`flex flex-col max-w-[85%] ${isMe ? "self-end items-end" : "self-start items-start"}`}>
                <div className={`flex items-center gap-1.5 mb-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`p-1 rounded-full ${msg.sender_role === "courier" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                    {msg.sender_role === "courier" ? <Truck size={12} /> : <UserRound size={12} />}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">{msg.sender_name}</span>
                </div>
                <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? "bg-emerald-500 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"}`}>
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tulis pesan..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-emerald-600 text-white p-2.5 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
