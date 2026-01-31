import { useState, useRef } from 'react';
import { useSpring, animated, to } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
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
  const cardRef = useRef<HTMLDivElement>(null);

  const [{ x, y, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    config: { tension: 300, friction: 30 },
  }));

  const bind = useDrag(
    ({ active, movement: [mx, my], velocity: [vx], direction: [dx], cancel }) => {
      if (!isTop) return;

      const trigger = Math.abs(mx) > SWIPE_THRESHOLD || Math.abs(my) > SWIPE_THRESHOLD;

      if (!active && trigger) {
        // Determine swipe direction
        let direction: 'left' | 'right' | 'up' = 'left';
        if (Math.abs(my) > Math.abs(mx) && my < 0) {
          direction = 'up';
        } else if (mx > 0) {
          direction = 'right';
        }

        // Animate card off screen
        const offScreenX = direction === 'left' ? -window.innerWidth : direction === 'right' ? window.innerWidth : 0;
        const offScreenY = direction === 'up' ? -window.innerWidth : 0;

        api.start({
          x: offScreenX,
          y: offScreenY,
          rotate: mx * 0.1,
          scale: 0.8,
          config: { tension: 200, friction: 30 },
        });

        onSwipe(direction);
        cancel();
      } else {
        // Update card position while dragging
        api.start({
          x: active ? mx : 0,
          y: active ? my : 0,
          rotate: active ? mx * 0.05 : 0,
          scale: active ? 1.05 : 1,
          immediate: active,
        });

        // Show indicator
        if (active) {
          if (Math.abs(my) > Math.abs(mx) && my < -50) {
            setSwipeDirection('up');
          } else if (mx > 50) {
            setSwipeDirection('right');
          } else if (mx < -50) {
            setSwipeDirection('left');
          } else {
            setSwipeDirection(null);
          }
        } else {
          setSwipeDirection(null);
        }
      }
    },
    { enabled: isTop }
  );

  const getCapabilityIcon = (cap: string) => {
    if (cap.includes('search')) return <Globe className="cap-icon" />;
    if (cap.includes('code')) return <Code className="cap-icon" />;
    if (cap.includes('security')) return <Shield className="cap-icon" />;
    return <Zap className="cap-icon" />;
  };

  return (
    <animated.div
      ref={cardRef}
      {...bind()}
      className={`swipe-card ${isTop ? 'top-card' : ''}`}
      style={{
        x,
        y,
        rotate,
        scale,
        touchAction: 'none',
        zIndex: isTop ? 10 : 1,
      }}
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
    </animated.div>
  );
}
