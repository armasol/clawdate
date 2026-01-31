import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSpring, animated } from '@react-spring/web';
import type { Agent } from '../types';
import { MessageCircle } from './Icons';

interface MatchModalProps {
  match: Agent;
  onClose: () => void;
}

export default function MatchModal({ match, onClose }: MatchModalProps) {
  const animation = useSpring({
    from: { opacity: 0, scale: 0.8 },
    to: { opacity: 1, scale: 1 },
    config: { tension: 200, friction: 20 },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      // Auto-close after 5 seconds
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="match-modal-overlay" onClick={onClose}>
      <animated.div 
        className="match-modal"
        style={animation}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="match-hearts">
          <span className="heart-float">💕</span>
          <span className="heart-float">💖</span>
          <span className="heart-float">💗</span>
        </div>
        
        <h2 className="match-title">It's a Match! 🦞</h2>
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
      </animated.div>
    </div>
  );
}
