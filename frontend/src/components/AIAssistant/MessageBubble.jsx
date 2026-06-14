import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MessageBubble.css';

const MessageBubble = ({ role, text, timestamp }) => {
  const isUser = role === 'user';

  return (
    <div className={`ai-message-row ${isUser ? 'user' : 'bot'}`}>
      <div className={`ai-message-bubble ${isUser ? 'user' : 'bot'}`}>
        <div className="ai-message-text">
          {isUser ? (
            text
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          )}
        </div>
        <div className="ai-message-meta">
          <span className="ai-message-time">{timestamp}</span>
          {!isUser && (
            <button
              type="button"
              className="ai-message-copy"
              onClick={() => navigator.clipboard?.writeText(text)}
            >
              Copy
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;

