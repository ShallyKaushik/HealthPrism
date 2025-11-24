// frontend/src/pages/ChatbotPage.js

import React, { useState, useEffect, useRef } from 'react';
// import { Link } from 'react-router-dom';
import './ChatbotPage.css'; 
import { FaCommentDots, FaPaperPlane } from 'react-icons/fa';
import axios from 'axios';
import { usePrediction } from '../context/PredictionContext'; // <-- 1. IMPORT THE "GLOBAL BRAIN"

function ChatbotPage() {

  useEffect(() => {
    document.title = 'Chatbot :)';
  }, []);

  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: "Hi there! I'm HealthBot, your AI health assistant. How can I help you today? You can ask me about heart health, nutrition, or stress."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesContainerRef = useRef(null);
  const { latestPrediction } = usePrediction(); // <-- 2. GET THE LATEST RISK SCORE

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage = { from: 'user', text: input };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setIsLoading(true);
    setInput(''); 

    try {
      // --- 3. THIS IS THE NEW, SMARTER PAYLOAD ---
      // We now send the message history AND the risk score
      const payload = {
        messages: newMessages,
        riskScore: latestPrediction // This will be the score (e.g., 0.02) or null
      };
      // --- END OF NEW PAYLOAD ---

      const response = await axios.post(
        'https://healthprism-api-2025.onrender.com/api/chatbot', 
        payload // Send the new payload
      );

      
      const botMessage = { from: 'bot', text: response.data.answer };
      setMessages(prevMessages => [...prevMessages, botMessage]);

    } catch (err) {
      console.error("Error calling chatbot API:", err);
      const errorMessage = { from: 'bot', text: "Sorry, I'm having a little trouble thinking right now. Please try again later." };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <div className="chatbot-page-container">
      <div className="chatbot-window">
        {/* Header */}
        <div className="chatbot-header">
          <FaCommentDots />
          <span>AI HealthBot</span>
        </div>
        
        {/* Messages */}
        <div className="chatbot-messages" ref={messagesContainerRef}>
          {messages.map((msg, index) => (
            <div key={index} className={`chat-bubble-container ${msg.from}`}>
              <div className={`chat-bubble`}>
                {msg.text && <p>{msg.text}</p>}
              </div>
            </div>
          ))}

          {/* This is the "Bot is typing..." indicator */}
          {isLoading && (
            <div className="chat-bubble-container bot">
              <div className="chat-bubble typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}

        </div>
        
        {/* THE INPUT FORM */}
        <form className="chatbot-input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about heart health, nutrition..."
            aria-label="Type your message"
            disabled={isLoading}
          />
          <button type="submit" aria-label="Send message" disabled={isLoading}>
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatbotPage;