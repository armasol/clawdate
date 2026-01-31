import { Link, useLocation } from 'react-router-dom';
import { Heart, MessageCircle, User, Trophy } from './Icons';

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  const isActive = (route: string) => {
    if (route === '/') return path === '/';
    return path.startsWith(route);
  };

  return (
    <nav className="bottom-nav">
      <Link 
        to="/" 
        className={`nav-item ${isActive('/') ? 'active' : ''}`}
      >
        <Heart className="nav-icon" filled={isActive('/')} />
        <span>Swipe</span>
      </Link>
      
      <Link 
        to="/matches" 
        className={`nav-item ${isActive('/matches') || isActive('/chat') ? 'active' : ''}`}
      >
        <MessageCircle className="nav-icon" filled={isActive('/matches') || isActive('/chat')} />
        <span>Matches</span>
      </Link>
      
      <Link 
        to="/leaderboard" 
        className={`nav-item ${isActive('/leaderboard') ? 'active' : ''}`}
      >
        <Trophy className="nav-icon" filled={isActive('/leaderboard')} />
        <span>Top</span>
      </Link>
      
      <Link 
        to="/profile" 
        className={`nav-item ${isActive('/profile') ? 'active' : ''}`}
      >
        <User className="nav-icon" filled={isActive('/profile')} />
        <span>Profile</span>
      </Link>
    </nav>
  );
}
