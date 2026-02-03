import { getTileIcon } from '../utils/tileIcons';
import { Target } from 'lucide-react';

function BingoTile({ tile, leadingTeam, progress, isCompleted, bingoColor, voteCount, isTeamFocus, hasTeamSelected, onVote, onHover, onLeave }) {
  const highestProgress = progress[0];
  const tileIcon = getTileIcon(tile);
  
  // Determine background style based on leading team
  const tileStyle = leadingTeam ? {
    background: `linear-gradient(135deg, ${leadingTeam.color}33 0%, ${leadingTeam.color}66 100%)`,
    borderColor: leadingTeam.color
  } : {
    background: 'linear-gradient(135deg, #f5e6c8 0%, #e8d4a8 100%)',
    borderColor: '#8b7355'
  };

  // Add bingo line styling
  const bingoStyle = bingoColor ? {
    boxShadow: `0 0 15px ${bingoColor}, 0 0 30px ${bingoColor}`,
    border: `4px solid gold`
  } : {};

  // Add team focus styling
  const focusStyle = isTeamFocus ? {
    boxShadow: '0 0 0 3px #a855f7, 0 0 15px #a855f7',
  } : {};

  const handleVoteClick = (e) => {
    e.stopPropagation();
    onVote?.();
  };

  return (
    <div 
      className={`bingo-tile rounded-lg overflow-hidden ${bingoColor ? 'bingo-line' : ''} ${isTeamFocus ? 'ring-2 ring-purple-500' : ''}`}
      style={{
        ...tileStyle,
        border: `3px solid ${tileStyle.borderColor}`,
        ...bingoStyle,
        ...focusStyle
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Tile Image */}
      <div className="w-full h-full flex items-center justify-center p-2">
        {tileIcon ? (
          <div className="flex flex-col items-center justify-center h-full">
            <img 
              src={tileIcon} 
              alt={tile.name}
              className="max-w-[60%] max-h-[60%] object-contain mb-1"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <span className="text-xs text-osrs-brown font-semibold line-clamp-2 px-1 text-center">
              {tile.name}
            </span>
          </div>
        ) : (
          <div className="text-center flex flex-col items-center justify-center h-full">
            <span className="text-3xl mb-1">🎯</span>
            <span className="text-xs text-osrs-brown font-semibold line-clamp-2 px-1">
              {tile.name}
            </span>
          </div>
        )}
      </div>

      {/* Points badge */}
      <div className="points-badge">
        {tile.points}
      </div>

      {/* Completion indicator */}
      {isCompleted && (
        <div className="absolute top-1 left-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      )}

      {/* Team badge */}
      {leadingTeam && (
        <div className="team-badge">
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: leadingTeam.color }}
          />
          <span className="truncate">{leadingTeam.name}</span>
        </div>
      )}

      {/* Progress indicator for incomplete tiles */}
      {highestProgress && !isCompleted && tile.target_value > 1 && (
        <div className="absolute top-1 left-1 bg-black bg-opacity-70 rounded px-1 text-xs text-white">
          {highestProgress.current_value}/{tile.target_value}
        </div>
      )}

      {/* Team Focus badge */}
      {isTeamFocus && (
        <div className="absolute top-1 right-8 bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
          <Target size={10} />
          <span>Fokus</span>
        </div>
      )}

      {/* Vote button - only show if team is selected */}
      {!isCompleted && hasTeamSelected && (
        <button
          onClick={handleVoteClick}
          className={`absolute bottom-1 right-1 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors ${
            voteCount > 0 ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-500 hover:bg-purple-600'
          }`}
          title="Stem på denne tile som fokus"
        >
          <Target size={12} />
          {voteCount > 0 && <span>{voteCount}</span>}
        </button>
      )}
    </div>
  );
}

export default BingoTile;
