// frontend/src/pages/ChatbotPage.js

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './ChatbotPage.css';
import { FaCommentDots, FaPaperPlane } from 'react-icons/fa';
import axios from 'axios';

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
  
  // --- THIS IS THE FIX ---
  // 1. We create a ref for the *message container* itself
  const messagesContainerRef = useRef(null);
  // (We no longer need chatEndRef)
  // --- END OF FIX ---

  // Scroll to the bottom when new messages are added
  useEffect(() => {
    // --- THIS IS THE FIX ---
    // 2. We now *manually* set the scroll position of the
    //    message container to its full height.
    //    This ONLY scrolls the chat box, not the whole page.
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
    // --- END OF FIX ---
  }, [messages]);

  // 2. THE HANDLE SUBMIT FUNCTION (No changes, this is correct)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage = { from: 'user', text: input };
    
    // Create newMessages here to send to the API
    const newMessages = [...messages, userMessage];
    
    // Add user message to history and show "typing..."
    setMessages(newMessages); // Use newMessages
    setIsLoading(true);
    setInput(''); // Clear the input box

    try {
      // 3. SEND TO BACKEND
      const response = await axios.post(
        'http://127.0.0.1:5000/api/chatbot', 
        { messages: newMessages } // Send the newMessages array
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
        
        {/* --- THIS IS THE FIX --- */}
        {/* 3. Add the ref to the messages div */}
        <div className="chatbot-messages" ref={messagesContainerRef}>
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

          {/* 4. We no longer need the 'chatEndRef' div here */}
        </div>
        
        {/* 4. THE NEW INPUT FORM (No changes) */}
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