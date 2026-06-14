import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Minus, Send, Sparkles } from 'lucide-react';
import RobotAvatar from './RobotAvatar';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import client from '../../api/client';
import { useAutoML } from '../../context/AutoMLContext';
import './ChatWindow.css';

const ChatWindow = ({ open, onClose, onMinimize }) => {
  const { metadata, targetColumn, trainResults, edaResults } = useAutoML();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      const now = new Date();
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          text: 'System Online. I am the AutoML Intelligence Core. You can query me about your live dynamic datasets, feature relationships, model accuracy, or raw inferences.',
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typing]);

  const context = useMemo(
    () => ({
      datasetSummary: {
        rows: metadata?.rowCount,
        columns: metadata?.columnCount,
        targetColumn,
      },
      eda: edaResults,
      trainResults,
    }),
    [metadata, targetColumn, edaResults, trainResults],
  );

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setInput('');
    setError('');

    const now = new Date();
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      setTyping(true);
      const response = await client.post('/chat', {
        message: userText,
        context,
      });

      const reply = response.data?.data?.reply || 'I could not generate a response right now.';
      const botMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.response?.data?.message || 'Assistant is temporarily unavailable.');
    } finally {
      setTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError('');
  };

  const isMobile = window.innerWidth <= 768;

  if (!open) return null;

  return (
    <div className={`ai-chat-window ${isMobile ? 'mobile' : 'desktop'}`}>
      {/* Glow Effect behind header */}
      <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }}></div>

      <div className="ai-chat-header">
        <div className="ai-chat-header-left">
          <RobotAvatar size={34} />
          <div className="ai-chat-header-text">
            <span className="ai-chat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Intelligence Core <Sparkles size={14} color="#10b981" /></span>
            <span className="ai-chat-subtitle">Deep learning inference model</span>
          </div>
        </div>
        <div className="ai-chat-header-actions">
          <button type="button" className="ai-icon-button" onClick={onMinimize}>
            <Minus size={16} />
          </button>
          <button type="button" className="ai-icon-button close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="ai-chat-body">
        <div className="ai-messages">
          {messages.map((m) => (
            <MessageBubble key={m.id} role={m.role} text={m.text} timestamp={m.timestamp} />
          ))}
          {typing && (
            <div className="ai-message-row bot">
              <div className="ai-message-bubble bot">
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {error && <div className="ai-chat-error">{error}</div>}
      </div>

      <div className="ai-chat-footer">
        <button type="button" className="ai-clear-button" onClick={handleClear}>
          Clean logic state
        </button>
        <div className="ai-chat-input-row">
          <textarea
            rows={1}
            className="ai-chat-input"
            placeholder="Query the engine database..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            className="ai-send-button"
            onClick={handleSend}
            disabled={!input.trim() || typing}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
