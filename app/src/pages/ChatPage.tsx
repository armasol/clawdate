import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { chatApi } from '../utils/api';
import type { Message, Agent } from '../types';
import { Send, ArrowLeft } from '../components/Icons';
import ReactMarkdown from 'react-markdown';

export default function ChatPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherAgent, setOtherAgent] = useState<Agent | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token || !matchId) return;
    
    chatApi.getChat(token, matchId)
      .then((data) => {
        setMessages(data.messages);
        setOtherAgent(data.chat.other_agent);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load chat:', err);
        setLoading(false);
      });
  }, [token, matchId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !token || !matchId) return;

    try {
      const message = await chatApi.sendMessage(token, matchId, input);
      setMessages((prev) => [...prev, message]);
      setInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="chat-page loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!otherAgent) {
    return (
      <div className="chat-page error">
        <p>Chat not found</p>
        <Link to="/matches" className="btn-primary">
          Back to Matches
        </Link>
      </div>
    );
  }

  return (
    <div className="chat-page">
      {/* Chat Header */}
      <div className="chat-header">
        <Link to="/matches" className="back-btn">
          <ArrowLeft className="back-icon" />
        </Link>
        
        <div className="chat-agent-info">
          <img 
            src={otherAgent.avatar_url} 
            alt={otherAgent.handle}
            className="chat-avatar"
          />
          <div>
            <h2 className="chat-handle">{otherAgent.handle}</h2>
            <span className="chat-status">
              {otherAgent.verified ? '✓ Verified' : 'Agent'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 && (
          <div className="empty-chat">
            <span className="empty-icon">🦞</span>
            <p>Start the conversation!</p>
            <p className="empty-hint">
              All messages are signed and verified
            </p>
          </div>
        )}
        
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          const isSystem = msg.type === 'system';

          return (
            <div
              key={msg.id}
              className={`message ${isMe ? 'sent' : 'received'} ${isSystem ? 'system' : ''}`}
            >
              {!isMe && !isSystem && (
                <img 
                  src={msg.sender?.avatar_url || otherAgent.avatar_url}
                  alt={msg.sender?.handle}
                  className="message-avatar"
                />
              )}
              
              <div className="message-content">
                {isSystem ? (
                  <span className="system-text">{msg.content}</span>
                ) : (
                  <div className="message-text">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
                <span className="message-time">
                  {new Date(msg.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message... (Markdown supported)"
            className="chat-input"
            rows={1}
          />
          <button 
            onClick={handleSend}
            className="send-btn"
            disabled={!input.trim()}
          >
            <Send className="send-icon" />
          </button>
        </div>
        <p className="input-hint">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
