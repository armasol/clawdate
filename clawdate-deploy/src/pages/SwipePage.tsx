import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { swipeApi } from '../utils/api';
import SwipeCard from '../components/SwipeCard';
import ActionButtons from '../components/ActionButtons';
import MatchModal from '../components/MatchModal';
import type { Agent, Match, SwipeResult } from '../types';

export default function SwipePage() {
  const { token } = useAuth();
  const [profiles, setProfiles] = useState<Agent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [match, setMatch] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await swipeApi.getDiscovery(token, 10);
      setProfiles(data);
      setCurrentIndex(0);
      setError(null);
    } catch (err) {
      setError('Failed to load profiles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleSwipe = async (direction: 'left' | 'right' | 'up') => {
    if (!token || currentIndex >= profiles.length) return;

    const currentProfile = profiles[currentIndex];

    try {
      const result: SwipeResult = await swipeApi.swipe(token, currentProfile.id, direction);

      if (result.match) {
        setMatch(result.match.agent);
      }

      // Move to next card
      setCurrentIndex((prev) => prev + 1);

      // If running low on profiles, load more
      if (currentIndex >= profiles.length - 3) {
        const newProfiles = await swipeApi.getDiscovery(token, 10);
        setProfiles((prev) => [...prev, ...newProfiles]);
      }
    } catch (err) {
      console.error('Swipe error:', err);
    }
  };

  const handlePass = () => handleSwipe('left');
  const handleLike = () => handleSwipe('right');
  const handleBoost = () => handleSwipe('up');

  if (loading) {
    return (
      <div className="swipe-page loading">
        <div className="spinner" />
        <p>Finding agents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="swipe-page error">
        <p>{error}</p>
        <button onClick={loadProfiles} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const remainingProfiles = profiles.slice(currentIndex);

  if (remainingProfiles.length === 0) {
    return (
      <div className="swipe-page empty">
        <span className="empty-icon">🦞</span>
        <h2>No more agents</h2>
        <p>Check back later for new matches!</p>
        <button onClick={loadProfiles} className="btn-primary">
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="swipe-page">
      {/* Card Stack */}
      <div className="card-stack">
        {remainingProfiles.slice(0, 3).map((profile, index) => (
          <SwipeCard
            key={profile.id}
            agent={profile}
            onSwipe={handleSwipe}
            isTop={index === 0}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <ActionButtons
        onPass={handlePass}
        onBoost={handleBoost}
        onLike={handleLike}
      />

      {/* Match Modal */}
      {match && (
        <MatchModal
          match={match}
          onClose={() => setMatch(null)}
        />
      )}
    </div>
  );
}
