import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, X, Send, User, Bot, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Chatbot = () => {
  const { token, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMsg = message;
    setMessage('');
    setHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/chat`,
        { message: userMsg },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setHistory(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
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
            className="mb-5 w-[380px] h-[580px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Native Header */}
            <div className="p-6 bg-white border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-gray-900 font-black text-sm tracking-tight">HealthPrism AI</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">Active Assistant</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Canvas */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#FCFDFF]"
            >
              {history.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-4">
                  <div className="w-20 h-20 bg-blue-50 rounded-[2.5rem] flex items-center justify-center text-blue-500 shadow-inner">
                    <MessageSquare size={40} />
                  </div>
                  <div>
                    <h4 className="text-gray-900 font-black text-base">Hi, {user?.fullname?.split(' ')[0]}!</h4>
                    <p className="text-gray-500 text-xs mt-2 font-medium max-w-[200px] mx-auto leading-relaxed">
                      How can I help you today? I have access to your health guidelines and stress data.
                    </p>
                  </div>
                </div>
              )}

              {history.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-400 border-gray-100 shadow-sm'}`}>
                    {msg.role === 'user' ? <User size={18} /> : <Bot size={18} /> }
                  </div>
                  <div className={`max-w-[78%] p-4 rounded-2xl text-[13px] font-semibold leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-100/50'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 shadow-sm">
                    <Bot size={18} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none border border-gray-100/50">
                      <div className="flex gap-1.5 py-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-duration:0.8s]" />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]" />
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">AI is thinking...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl text-[11px] font-black border border-orange-100 flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
            </div>

            {/* Input Footer */}
            <div className="p-5 bg-white border-t border-gray-50">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-gray-50 p-2 pl-5 rounded-2xl border border-gray-100 focus-within:bg-white focus-within:border-blue-300 transition-all shadow-inner">
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
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-all active:scale-90 shadow-md shadow-blue-100"
                >
                  <Send size={20} />
                </button>
              </form>
              <div className="flex items-center justify-center gap-1.5 mt-4">
                <Sparkles size={10} className="text-blue-400" />
                <p className="text-center text-[9px] text-gray-400 font-black uppercase tracking-widest">Medical Insights Engine v4.2</p>
                <Sparkles size={10} className="text-blue-400" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Messenger Button */}
      <motion.button
        whileHover={{ scale: 1.05, shadow: "0 10px 25px -5px rgba(37, 99, 235, 0.4)" }}
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
