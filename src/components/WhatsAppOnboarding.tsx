import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Send, User, Shield, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const WhatsAppOnboarding = ({ onBack }: { onBack: () => void }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('kekelink_onboarding_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved history", e);
      }
    }
    return [
      {
        id: '1',
        role: 'model',
        text: 'Sannu! Welcome to KekeLink. I am your onboarding assistant. Are you a passenger or a driver?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('kekelink_onboarding_history', JSON.stringify(messages));
  }, [messages]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const aiResponse = await geminiService.onboardingAssistant(inputText, history);
      
      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: aiResponse || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Onboarding error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#e5ddd5] flex flex-col">
      {/* WhatsApp Header */}
      <div className="bg-[#075e54] text-white p-4 flex items-center gap-4 shadow-md">
        <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <MessageCircle size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold">KekeLink Onboarding</h3>
          <p className="text-xs text-white/70">Online</p>
        </div>
        <button 
          onClick={() => {
            if (confirm("Clear chat history?")) {
              localStorage.removeItem('kekelink_onboarding_history');
              setMessages([
                {
                  id: '1',
                  role: 'model',
                  text: 'Sannu! Welcome to KekeLink. I am your onboarding assistant. Are you a passenger or a driver?',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ]);
            }
          }}
          className="text-[10px] bg-white/10 px-2 py-1 rounded hover:bg-white/20 transition-colors"
        >
          Clear History
        </button>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] p-3 rounded-xl shadow-sm relative ${
                  msg.role === 'user' 
                    ? 'bg-[#dcf8c6] rounded-tr-none' 
                    : 'bg-white rounded-tl-none'
                }`}
              >
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{msg.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                  {msg.role === 'user' && <CheckCheck size={14} className="text-blue-500" />}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-xl shadow-sm rounded-tl-none">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-2 bg-[#f0f0f0] flex items-center gap-2">
        <div className="flex-1 bg-white rounded-full px-4 py-2 flex items-center shadow-sm">
          <input 
            type="text" 
            placeholder="Type a message"
            className="flex-1 outline-none text-sm"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
        </div>
        <button 
          onClick={handleSend}
          disabled={isLoading || !inputText.trim()}
          className="w-12 h-12 bg-[#075e54] text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};
