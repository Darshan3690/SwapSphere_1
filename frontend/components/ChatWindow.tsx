"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Send, RefreshCw, MessageCircle } from "lucide-react";

interface Profile {
  username: string;
  avatar_url: string | null;
}

interface Message {
  id: string;
  swap_request_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

interface ChatWindowProps {
  swapRequestId: string;
}

export default function ChatWindow({ swapRequestId }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?swapRequestId=${swapRequestId}`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      
      const data = await response.json();
      setMessages(data || []);
    } catch (err) {
      console.error("Error loading chat messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Polling interval to simulate real-time chat
    const interval = setInterval(fetchMessages, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [swapRequestId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          swapRequestId,
          content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      await fetchMessages();
    } catch (err: any) {
      console.error("Error sending message:", err);
      alert("Failed to send message: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px] border border-slate-200/90 rounded-2xl bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 bg-slate-50 px-4 py-3">
        <MessageCircle className="h-4 w-4 text-indigo-600" />
        <span className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Negotiation Chat</span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
            <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
            <span className="text-xs font-medium">Loading negotiation history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6">
            <MessageCircle className="h-8 w-8 stroke-[1.5] text-indigo-300 mb-2" />
            <p className="text-xs font-medium">No messages yet. Send a message to coordinate terms or meetups.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex items-start gap-2.5 ${isMe ? "justify-end" : "justify-start"}`}>
                {!isMe && (
                  msg.profiles?.avatar_url ? (
                    <img
                      src={msg.profiles.avatar_url}
                      alt={msg.profiles.username}
                      className="h-7 w-7 rounded-full object-cover mt-0.5 ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-600 mt-0.5">
                      {(msg.profiles?.username ?? "U")[0].toUpperCase()}
                    </div>
                  )
                )}

                <div className="flex flex-col max-w-[75%]">
                  {!isMe && (
                    <span className="text-[10px] text-slate-400 font-semibold ml-1 mb-0.5">
                      @{msg.profiles?.username || "user"}
                    </span>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      isMe
                        ? "bg-indigo-600 text-white rounded-tr-xs shadow-xs"
                        : "bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200/80 shadow-2xs"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className={`text-[9px] text-slate-400 mt-1 ${isMe ? "text-right mr-1" : "ml-1"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="border-t border-slate-200/80 bg-white p-3 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer self-center"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
