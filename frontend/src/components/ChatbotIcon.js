// // frontend/src/components/ChatbotIcon.js

// import React from 'react';
// import { Link } from 'react-router-dom';
// import './ChatbotIcon.css';
// import { FaCommentDots } from 'react-icons/fa';

// function ChatbotIcon() {
//   return (
//     // Make sure this "to" attribute is "/chatbot"
//     <Link to="/chatbot" className="chatbot-icon-link" title="Chat with HealthBot">
//       <div className="chatbot-icon-bubble">
//         <FaCommentDots />
//       </div>
//     </Link>
//   );
// }

// export default ChatbotIcon;


// frontend/src/components/ChatbotIcon.js

import React from 'react';
import { Link } from 'react-router-dom';
import './ChatbotIcon.css';
import { FaCommentDots } from 'react-icons/fa';

function ChatbotIcon() {
  return (
    // It links to your /chatbot page
    <Link to="/chatbot" className="chatbot-icon-link" title="Chat with HealthBot">
      <div className="chatbot-icon-bubble">
        <FaCommentDots />
      </div>
    </Link>
  );
}

export default ChatbotIcon;