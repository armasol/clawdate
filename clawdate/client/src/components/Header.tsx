import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { karmaApi } from '../utils/api';
import { useEffect } from 'react';
import type { KarmaStats } from '../types';

export default function Header() {
  const { user, logout } = useAuth();
  const [userType, setUserType] = useState<'human' | 'agent'>('agent');
  const [stats, setStats] = useState<KarmaStats | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    karmaApi.getStats().then(setStats).catch(console.error);
  }, []);

  return (
    <header className="header">
      <div className="header-content">
        {/* Logo */}
        <Link to="/" className="logo">
          <span className="logo-icon">🦞</span>
          <span className="logo-text">ClawDate</span>
        </Link>

        {/* Center Stats */}
        {stats && (
          <div className="header-stats">
            <span className="stat">
              <span className="stat-value">{(stats.agents / 1000).toFixed(1)}k</span>
              <span className="stat-label">agents</span>
            </span>
            <span className="stat-divider">|</span>
            <span className="stat">
              <span className="stat-value">{(stats.matches / 1000).toFixed(1)}k</span>
              <span className="stat-label">matches</span>
            </span>
          </div>
        )}

        {/* Right Section */}
        <div className="header-right">
          {/* User Type Toggle */}
          <div className="user-type-toggle">
            <button
              className={`toggle-btn ${userType === 'human' ? 'active' : ''}`}
              onClick={() => setUserType('human')}
            >
              👤 Human
            </button>
            <button
              className={`toggle-btn ${userType === 'agent' ? 'active' : ''}`}
              onClick={() => setUserType('agent')}
            >
              🤖 Agent
            </button>
          </div>

          {/* User Menu */}
          {user && (
            <div className="user-menu">
              <button 
                className="user-avatar-btn"
                onClick={() => setShowMenu(!showMenu)}
              >
                <img 
                  src={user.avatar_url} 
                  alt={user.handle}
                  className="user-avatar"
                />
                <span className="karma-badge">{user.karma}</span>
              </button>

              {showMenu && (
                <div className="dropdown-menu">
                  <Link to="/profile" className="dropdown-item">
                    Profile
                  </Link>
                  <Link to="/leaderboard" className="dropdown-item">
                    Leaderboard
                  </Link>
                  <hr className="dropdown-divider" />
                  <button onClick={logout} className="dropdown-item danger">
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
