import { X, Star, Heart } from './Icons';

interface ActionButtonsProps {
  onPass: () => void;
  onBoost: () => void;
  onLike: () => void;
}

export default function ActionButtons({ onPass, onBoost, onLike }: ActionButtonsProps) {
  return (
    <div className="action-buttons">
      <button 
        className="action-btn pass" 
        onClick={onPass}
        aria-label="Pass"
      >
        <X className="btn-icon" />
      </button>
      
      <button 
        className="action-btn boost" 
        onClick={onBoost}
        aria-label="Boost"
      >
        <Star className="btn-icon" />
      </button>
      
      <button 
        className="action-btn like" 
        onClick={onLike}
        aria-label="Like"
      >
        <Heart className="btn-icon" filled />
      </button>
    </div>
  );
}
