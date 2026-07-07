import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, X, Send, User, Bot, Sparkles, AlertCircle, ShieldCheck, Database, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Chatbot = () => {
  const { token, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ragStatus, setRagStatus] = useState(null);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Fetch RAG status on mount
  useEffect(() => {
    const fetchRagStatus = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/rag-status`
        );
        setRagStatus(res.data);
      } catch {
        setRagStatus(null);
      }
    };
    if (isOpen) fetchRagStatus();
  }, [isOpen]);

  // Quick health suggestion chips
  const healthChips = [
    "How to lower blood pressure?",
    "Tips for better sleep",
    "Stress relief techniques",
    "Heart-healthy foods",
  ];

  const handleSendMessage = async (e, chipMessage) => {
    if (e) e.preventDefault();
    const msgToSend = chipMessage || message;
    if (!msgToSend.trim() || isLoading) return;

    setMessage('');
    setHistory(prev => [...prev, { role: 'user', content: msgToSend }]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/chat`,
        { message: msgToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setHistory(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.reply,
        ragPowered: response.data.rag_powered,
        healthDomain: response.data.health_domain,
      }]);
    } catch (err) {
      console.error('Chat error:', err);
      setError('Connection interrupted. Please check your network.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end print:hidden">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="mb-5 w-[400px] h-[620px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Header with RAG status */}
            <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <Heart size={22} fill="white" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-black text-sm tracking-tight">HealthPrism AI</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-emerald-600 text-[9px] font-black uppercase tracking-widest">RAG Active</span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center gap-1">
                      <ShieldCheck size={10} className="text-blue-500" />
                      <span className="text-blue-500 text-[9px] font-black uppercase tracking-widest">Health Only</span>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* RAG Info Bar */}
            {ragStatus && (
              <div className="px-5 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database size={12} className="text-emerald-600" />
                  <span className="text-[10px] font-bold text-emerald-700">
                    {ragStatus.chunks_loaded} knowledge chunks indexed
                  </span>
                </div>
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">
                  {ragStatus.version}
                </span>
              </div>
            )}

            {/* Chat Canvas */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FCFDFF]"
            >
              {history.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-[2.5rem] flex items-center justify-center text-blue-500 shadow-inner">
                    <Heart size={36} />
                  </div>
                  <div>
                    <h4 className="text-gray-900 font-black text-base">Hi, {user?.fullname?.split(' ')[0]}!</h4>
                    <p className="text-gray-500 text-xs mt-2 font-medium max-w-[240px] mx-auto leading-relaxed">
                      I'm your AI health assistant powered by <strong>RAG</strong>. 
                      Ask me about nutrition, heart health, stress, fitness, or any health topic.
                    </p>
                  </div>
                  
                  {/* Health suggestion chips */}
                  <div className="flex flex-wrap gap-2 justify-center mt-1 max-w-[320px]">
                    {healthChips.map((chip, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(null, chip)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold rounded-full border border-blue-100 transition-all hover:scale-[1.02] active:scale-95"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {history.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-gradient-to-br from-white to-gray-50 text-gray-400 border-gray-100 shadow-sm'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} /> }
                  </div>
                  <div className={`max-w-[80%] flex flex-col gap-1`}>
                    <div className={`p-3.5 rounded-2xl text-[13px] font-semibold leading-relaxed shadow-sm whitespace-pre-line ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100/80'}`}>
                      {msg.content}
                    </div>
                    {/* RAG/Guardrail badges for assistant messages */}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 px-1">
                        {msg.ragPowered && (
                          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-0.5">
                            <Database size={8} /> RAG
                          </span>
                        )}
                        {msg.healthDomain === false && (
                          <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-0.5">
                            <ShieldCheck size={8} /> Guardrail
                          </span>
                        )}
                        {msg.healthDomain === true && (
                          <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-0.5">
                            <Heart size={8} /> Health
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white to-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shadow-sm">
                    <Bot size={16} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="bg-gray-50 p-3.5 rounded-2xl rounded-tl-none border border-gray-100/80">
                      <div className="flex gap-1.5 py-1">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-duration:0.8s]" />
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]" />
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                      <Database size={9} className="text-emerald-400" /> Retrieving & generating...
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3.5 bg-orange-50 text-orange-600 rounded-2xl text-[11px] font-black border border-orange-100 flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
            </div>

            {/* Input Footer */}
            <div className="p-4 bg-white border-t border-gray-50">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-gray-50 p-2 pl-4 rounded-2xl border border-gray-100 focus-within:bg-white focus-within:border-blue-300 transition-all shadow-inner">
                <input 
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about your health, diet, or stress..."
                  className="bg-transparent flex-1 text-[13px] outline-none text-gray-800 font-bold placeholder:text-gray-400 placeholder:font-medium"
                  disabled={isLoading}
                />
                <button 
                  type="submit"
                  disabled={isLoading || !message.trim()}
                  className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-all active:scale-90 shadow-md shadow-blue-100"
                >
                  <Send size={18} />
                </button>
              </form>
              <div className="flex items-center justify-center gap-2 mt-3">
                <ShieldCheck size={10} className="text-emerald-500" />
                <p className="text-center text-[9px] text-gray-400 font-black uppercase tracking-widest">RAG-Powered Health Engine v5.0</p>
                <Sparkles size={10} className="text-blue-400" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Messenger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-xl flex items-center justify-center text-white relative group border-2 border-white/20"
      >
        {isOpen ? <X size={26} /> : <MessageSquare size={26} /> }
        
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] font-black shadow-sm">
             !
          </span>
        )}
      </motion.button>
    </div>
  );
};

export default Chatbot;
