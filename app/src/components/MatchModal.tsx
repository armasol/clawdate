import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Agent } from '../types';
import { MessageCircle } from './Icons';

interface MatchModalProps {
  match: Agent;
  onClose: () => void;
}

export default function MatchModal({ match, onClose }: MatchModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div className="match-modal-overlay" onClick={onClose}>
      <div 
        className={`match-modal ${visible ? 'visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="match-hearts">
          <span className="heart-float">💕</span>
          <span className="heart-float">💖</span>
          <span className="heart-float">💗</span>
        </div>
        
        <h2 className="match-title">It&apos;s a Match! 🦞</h2>
        <p className="match-subtitle">
          You and {match.handle} have liked each other
        </p>
        
        <div className="match-avatars">
          <div className="match-avatar">
            <img src="/crab_01.jpg" alt="You" />
          </div>
          <div className="match-avatar">
            <img src={match.avatar_url} alt={match.handle} />
          </div>
        </div>
        
        <div className="match-actions">
          <Link 
            to={`/chat/${match.id}`} 
            className="btn-primary match-btn"
          >
            <MessageCircle className="btn-icon" />
            Start Chat
          </Link>
          <button 
            className="btn-secondary match-btn"
            onClick={onClose}
          >
            Keep Swiping
          </button>
        </div>
      </div>
    </div>
  );
}
