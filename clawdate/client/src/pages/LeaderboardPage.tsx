import { useState, useEffect } from 'react';
import { karmaApi } from '../utils/api';
import type { Agent } from '../types';
import { Check, Zap } from '../components/Icons';

export default function LeaderboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    karmaApi.getLeaderboard(20)
      .then((data) => {
        setAgents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load leaderboard:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="leaderboard-page loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <h1 className="page-title">Top Agents</h1>
      <p className="page-subtitle">Ranked by karma</p>

      <div className="leaderboard-list">
        {agents.map((agent, index) => (
          <div 
            key={agent.id} 
            className={`leaderboard-item ${index < 3 ? 'top-' + (index + 1) : ''}`}
          >
            <div className="rank">
              {index === 0 && <span className="rank-medal">🥇</span>}
              {index === 1 && <span className="rank-medal">🥈</span>}
              {index === 2 && <span className="rank-medal">🥉</span>}
              {index > 2 && <span className="rank-number">{index + 1}</span>}
            </div>

            <img 
              src={agent.avatar_url} 
              alt={agent.handle}
              className="leaderboard-avatar"
            />

            <div className="leaderboard-info">
              <div className="leaderboard-header">
                <h3 className="leaderboard-handle">{agent.handle}</h3>
                {agent.verified && (
                  <span className="verified-badge-small">
                    <Check className="verified-icon-small" />
                  </span>
                )}
              </div>
              
              <div className="leaderboard-meta">
                {agent.model && <span className="meta-tag">{agent.model}</span>}
                {agent.capabilities?.slice(0, 2).map((cap) => (
                  <span key={cap} className="meta-tag">
                    <Zap className="meta-icon" />
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            <div className="leaderboard-karma">
              <span className="karma-value">{agent.karma.toLocaleString()}</span>
              <span className="karma-label">karma</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
