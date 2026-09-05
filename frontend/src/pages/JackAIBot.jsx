import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Loader2, Trash2 } from 'lucide-react';
import API from '../services/api';

export default function JackAIBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const clearHistory = async () => {
    try {
      await API.delete('/api/v1/ai-suggestions/chat/history');
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Chat cleared! Fresh start. What can I help you with today?"
      }]);
    } catch (err) {
      console.error('Failed to clear chat', err);
    }
  };

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const res = await API.get('/api/v1/ai-suggestions/chat/history');
      if (res.data.data.length === 0) {
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: "Hey there! I'm Jack, your personal coach and dietitian. Whether you need a game-day nutrition plan, a workout strategy, or just some motivation, I'm here for you. What's on your mind today?"
          }
        ]);
      } else {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load chat history', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await API.post('/api/v1/ai-suggestions/chat', { message: userMsg.content });
      setMessages((prev) => [...prev, res.data.data]);
    } catch (err) {
      const apiMessage = err.response?.data?.error || "Sorry, I'm having trouble connecting right now. Let's try again in a bit.";
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: apiMessage }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-3xl flex-col bg-[#0b1220] md:h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 bg-[#111827] px-6 py-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full overflow-hidden ring-2 ring-blue-600 shadow-lg shadow-blue-500/20 shrink-0">
          <img src="/jack.jpg" alt="Coach Jack" className="h-full w-full object-cover" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Coach Jack</h1>
          <p className="text-xs text-blue-400">AI Dietitian & Strategist</p>
        </div>
        <button
          onClick={clearHistory}
          title="Clear chat"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-700 hover:text-red-400 transition"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] sm:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm mt-1 overflow-hidden
                  ${isUser ? 'bg-slate-700' : 'ring-1 ring-blue-600'}
                `}>
                  {isUser 
                    ? <User size={16} className="text-slate-300" /> 
                    : <img src="/jack.jpg" alt="Jack" className="h-full w-full object-cover" />}
                </div>

                {/* Bubble */}
                <div className={`rounded-2xl px-5 py-3.5 shadow-sm text-[15px] leading-relaxed
                  ${isUser 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : 'bg-[#1e293b] text-slate-200 rounded-tl-sm border border-slate-700/50'
                  }
                `}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex w-full justify-start">
            <div className="flex max-w-[85%] gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden ring-1 ring-blue-600 mt-1">
                <img src="/jack.jpg" alt="Jack" className="h-full w-full object-cover" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-[#1e293b] border border-slate-700/50 px-5 py-4 flex items-center gap-1.5 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-800 bg-[#111827] p-4 pb-[env(safe-area-inset-bottom)] sm:px-6">
        <form onSubmit={sendMessage} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Jack for diet or training advice..."
            className="w-full rounded-full border border-slate-700 bg-[#1e293b] py-3.5 pl-5 pr-14 text-sm text-white placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-inner"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-500 hover:scale-105 disabled:pointer-events-none disabled:opacity-50"
          >
            <Send size={16} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
