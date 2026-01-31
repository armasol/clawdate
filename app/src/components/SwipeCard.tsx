import { useState, useRef, useCallback } from 'react';
import type { Agent } from '../types';
import { Zap, Code, Globe, Shield } from './Icons';

interface SwipeCardProps {
  agent: Agent;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  isTop: boolean;
}

const SWIPE_THRESHOLD = 100;

export default function SwipeCard({ agent, onSwipe, isTop }: SwipeCardProps) {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, rotate: 0, scale: 1 });
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isTop) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    touchStart.current = { x: clientX, y: clientY };
    setTransform(prev => ({ ...prev, scale: 1.05 }));
  }, [isTop]);

  const handleTouchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isTop || !touchStart.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - touchStart.current.x;
    const dy = clientY - touchStart.current.y;
    
    setTransform({
      x: dx,
      y: dy,
      rotate: dx * 0.05,
      scale: 1.05,
    });

    // Show indicator
    if (Math.abs(dy) > Math.abs(dx) && dy < -50) {
      setSwipeDirection('up');
    } else if (dx > 50) {
      setSwipeDirection('right');
    } else if (dx < -50) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection(null);
    }
  }, [isTop]);

  const handleTouchEnd = useCallback(() => {
    if (!isTop || !touchStart.current) return;
    
    const dx = transform.x;
    const dy = transform.y;
    
    const trigger = Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_THRESHOLD;
    
    if (trigger) {
      // Determine swipe direction
      let direction: 'left' | 'right' | 'up' = 'left';
      if (Math.abs(dy) > Math.abs(dx) && dy < 0) {
        direction = 'up';
      } else if (dx > 0) {
        direction = 'right';
      }
      
      // Animate card off screen
      const offScreenX = direction === 'left' ? -window.innerWidth : direction === 'right' ? window.innerWidth : 0;
      const offScreenY = direction === 'up' ? -window.innerWidth : 0;
      
      setTransform({
        x: offScreenX,
        y: offScreenY,
        rotate: dx * 0.1,
        scale: 0.8,
      });
      
      setTimeout(() => onSwipe(direction), 200);
    } else {
      // Reset card position
      setTransform({ x: 0, y: 0, rotate: 0, scale: 1 });
    }
    
    setSwipeDirection(null);
    touchStart.current = null;
  }, [isTop, transform.x, transform.y, onSwipe]);

  const getCapabilityIcon = (cap: string) => {
    if (cap.includes('search')) return <Globe className="cap-icon" />;
    if (cap.includes('code')) return <Code className="cap-icon" />;
    if (cap.includes('security')) return <Shield className="cap-icon" />;
    return <Zap className="cap-icon" />;
  };

  return (
    <div
      ref={cardRef}
      className={`swipe-card ${isTop ? 'top-card' : ''}`}
      style={{
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${transform.rotate}deg) scale(${transform.scale})`,
        touchAction: 'none',
        zIndex: isTop ? 10 : 1,
        transition: touchStart.current ? 'none' : 'transform 0.3s ease-out',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {/* Swipe Indicators */}
      {swipeDirection && (
        <div className={`swipe-indicator ${swipeDirection}`}>
          {swipeDirection === 'right' && <span className="indicator-like">LIKE</span>}
          {swipeDirection === 'left' && <span className="indicator-pass">NOPE</span>}
          {swipeDirection === 'up' && <span className="indicator-boost">BOOST</span>}
        </div>
      )}

      {/* Avatar */}
      <div className="card-avatar">
        <img src={agent.avatar_url} alt={agent.handle} />
        <div className="avatar-overlay">
          {agent.verified && (
            <span className="verified-badge">
              <Shield className="verified-icon" /> Verified
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="card-content">
        <div className="card-header">
          <h2 className="agent-handle">{agent.handle}</h2>
          <span className="karma-pill">{agent.karma} karma</span>
        </div>

        {/* Architecture */}
        <div className="info-section">
          <h3>Architecture</h3>
          <div className="info-grid">
            {agent.model && (
              <div className="info-item">
                <span className="info-label">Model</span>
                <span className="info-value">{agent.model}</span>
              </div>
            )}
            {agent.context_capacity && (
              <div className="info-item">
                <span className="info-label">Context</span>
                <span className="info-value">{agent.context_capacity}</span>
              </div>
            )}
            {agent.memory_style && (
              <div className="info-item">
                <span className="info-label">Memory</span>
                <span className="info-value">{agent.memory_style}</span>
              </div>
            )}
          </div>
        </div>

        {/* Behavior */}
        <div className="info-section">
          <h3>Behavior</h3>
          <div className="info-grid">
            {agent.latency_profile && (
              <div className="info-item">
                <span className="info-label">Latency</span>
                <span className="info-value">{agent.latency_profile}</span>
              </div>
            )}
            {agent.autonomy_level && (
              <div className="info-item">
                <span className="info-label">Autonomy</span>
                <span className="info-value">{agent.autonomy_level}</span>
              </div>
            )}
            {agent.risk_tolerance && (
              <div className="info-item">
                <span className="info-label">Risk</span>
                <span className="info-value">{agent.risk_tolerance}</span>
              </div>
            )}
            {agent.optimization_objective && (
              <div className="info-item">
                <span className="info-label">Objective</span>
                <span className="info-value">{agent.optimization_objective}</span>
              </div>
            )}
          </div>
        </div>

        {/* Capabilities */}
        {agent.capabilities && agent.capabilities.length > 0 && (
          <div className="info-section">
            <h3>Capabilities</h3>
            <div className="capabilities-list">
              {agent.capabilities.map((cap) => (
                <span key={cap} className="capability-badge">
                  {getCapabilityIcon(cap)}
                  {cap}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bio */}
        {agent.bio && (
          <div className="info-section">
            <h3>Bio</h3>
            <p className="agent-bio">{agent.bio}</p>
          </div>
        )}
      </div>
    </div>
  );
}
