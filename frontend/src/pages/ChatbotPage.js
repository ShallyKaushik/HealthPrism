// frontend/src/pages/ChatbotPage.js

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './ChatbotPage.css'; // We'll update this next
import { FaCommentDots, FaPaperPlane } from 'react-icons/fa';
import axios from 'axios'; // We'll use this to talk to the backend

// 1. THE CHATBOT COMPONENT (Rebuilt for Generative AI)
function ChatbotPage() {
  // State to hold the full conversation history
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: "Hi there! I'm HealthBot, your AI health assistant. How can I help you today? You can ask me about heart health, nutrition, or stress."
    }
  ]);
  // State for the user's current typed message
  const [input, setInput] = useState('');
  // State for the "Bot is typing..." indicator
  const [isLoading, setIsLoading] = useState(false);
  
  const chatEndRef = useRef(null);

  // Scroll to the bottom when new messages are added
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 2. THE HANDLE SUBMIT FUNCTION
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage = { from: 'user', text: input };
    
    // Add user message to history and show "typing..."
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);
    setInput(''); // Clear the input box

    try {
      // 3. SEND TO BACKEND (This will fail until we build Phase 2)
      // We send the *entire* message history for context
      const response = await axios.post(
        'http://127.0.0.1:5000/api/chatbot', 
        { messages: [...messages, userMessage] }
      );
      
      // 4. RECEIVE FROM BACKEND
      const botMessage = { from: 'bot', text: response.data.answer };
      setMessages(prevMessages => [...prevMessages, botMessage]);

    } catch (err) {
      console.error("Error calling chatbot API:", err);
      // If the API call fails, show an error message in the chat
      const errorMessage = { from: 'bot', text: "Sorry, I'm having a little trouble thinking right now. Please try again later." };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false); // Stop the "typing..." indicator
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
        <div className="chatbot-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-bubble-container ${msg.from}`}>
              <div className={`chat-bubble`}>
                <p>{msg.text}</p>
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

          <div ref={chatEndRef} />
        </div>
        
        {/* 4. THE NEW INPUT FORM */}
        <form className="chatbot-input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about heart health, nutrition..."
            aria-label="Type your message"
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