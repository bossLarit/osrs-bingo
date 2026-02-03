function BingoTile({ tile, leadingTeam, progress, isCompleted, bingoColor, voteCount, onVote, onHover, onLeave }) {
  const highestProgress = progress[0];
  
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

  const handleVoteClick = (e) => {
    e.stopPropagation();
    onVote?.();
  };

  return (
    <div 
      className={`bingo-tile rounded-lg overflow-hidden ${bingoColor ? 'bingo-line' : ''}`}
      style={{
        ...tileStyle,
        border: `3px solid ${tileStyle.borderColor}`,
        ...bingoStyle
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Tile Image */}
      <div className="w-full h-full flex items-center justify-center p-2">
        {tile.image_url ? (
          <img 
            src={tile.image_url} 
            alt={tile.name}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`text-center ${tile.image_url ? 'hidden' : 'flex'} flex-col items-center justify-center h-full`}
        >
          <span className="text-3xl mb-1">🎯</span>
          <span className="text-xs text-osrs-brown font-semibold line-clamp-2 px-1">
            {tile.name}
          </span>
        </div>
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

      {/* Vote button */}
      {!isCompleted && (
        <button
          onClick={handleVoteClick}
          className="absolute bottom-1 right-1 bg-purple-600 hover:bg-purple-700 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors"
          title="Stem på denne tile"
        >
          <span>👍</span>
          {voteCount > 0 && <span>{voteCount}</span>}
        </button>
      )}
    </div>
  );
}

export default BingoTile;
