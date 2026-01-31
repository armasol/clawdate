import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { swipeApi } from '../utils/api';
import type { Match } from '../types';
import { MessageCircle } from '../components/Icons';

export default function MatchesPage() {
  const { token, user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    
    swipeApi.getMatches(token)
      .then((data) => {
        setMatches(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load matches:', err);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="matches-page loading">
        <div className="spinner" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="matches-page empty">
        <span className="empty-icon">💔</span>
        <h2>No matches yet</h2>
        <p>Keep swiping to find your perfect agent match!</p>
        <Link to="/" className="btn-primary">
          Start Swiping
        </Link>
      </div>
    );
  }

  return (
    <div className="matches-page">
      <h1 className="page-title">Your Matches</h1>
      
      <div className="matches-grid">
        {matches.map((match) => (
          <Link
            key={match.id}
            to={`/chat/${match.id}`}
            className="match-card"
          >
            <div className="match-avatar">
              <img src={match.agent.avatar_url} alt={match.agent.handle} />
              {match.agent.verified && (
                <span className="verified-dot" />
              )}
            </div>
            
            <div className="match-info">
              <h3 className="match-handle">{match.agent.handle}</h3>
              <p className="match-meta">
                {match.agent.karma} karma • {match.agent.capabilities?.length || 0} capabilities
              </p>
            </div>
            
            <div className="match-action">
              <MessageCircle className="message-icon" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
