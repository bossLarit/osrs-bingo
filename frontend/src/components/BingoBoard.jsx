import { useState, useMemo, useEffect } from 'react';
import BingoTile from './BingoTile';
import { apiUrl } from '../api';
import { useDialog } from './Dialog';

function BingoBoard({ tiles = [], teams = [], progress = [], onRefresh, selectedTeamId }) {
  // Ensure props are arrays
  const safeTiles = Array.isArray(tiles) ? tiles : [];
  const safeTeams = Array.isArray(teams) ? teams : [];
  const safeProgress = Array.isArray(progress) ? progress : [];
  
  const dialog = useDialog();
  const [hoveredTile, setHoveredTile] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [votes, setVotes] = useState({});

  useEffect(() => {
    fetchVotes();
  }, []);

  const fetchVotes = async () => {
    try {
      const res = await fetch(apiUrl('/api/votes'));
      const data = await res.json();
      setVotes(data);
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  const handleVote = async (tileId) => {
    if (!selectedTeamId) {
      await dialog.alert('Vælg dit hold i toppen af siden først!', {
        title: 'Vælg Hold',
        variant: 'warning'
      });
      return;
    }

    try {
      await fetch(apiUrl('/api/votes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tile_id: tileId,
          team_id: selectedTeamId
        })
      });
      fetchVotes();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  // Get vote count for a tile (only for selected team)
  const getVoteCount = (tileId) => {
    if (!votes[tileId] || !Array.isArray(votes[tileId])) return 0;
    return votes[tileId].filter(v => v.team_id === selectedTeamId).length;
  };

  // Get team's focus tile (tile with most votes from this team)
  const getTeamFocusTile = () => {
    if (!selectedTeamId) return null;
    let maxVotes = 0;
    let focusTileId = null;
    
    for (const [tileId, tileVotes] of Object.entries(votes)) {
      if (!Array.isArray(tileVotes)) continue;
      const teamVotes = tileVotes.filter(v => v.team_id === selectedTeamId).length;
      if (teamVotes > maxVotes) {
        maxVotes = teamVotes;
        focusTileId = parseInt(tileId);
      }
    }
    return focusTileId;
  };

  const teamFocusTileId = getTeamFocusTile();

  // Calculate grid size based on number of tiles
  const gridSize = Math.ceil(Math.sqrt(safeTiles.length)) || 7;

  // Detect bingo lines (rows, columns, diagonals)
  const bingoLines = useMemo(() => {
    const lines = {};
    
    safeTeams.forEach(team => {
      const teamProgress = safeProgress.filter(p => p.team_id === team.id && p.completed);
      const completedPositions = new Set(
        teamProgress.map(p => {
          const tile = safeTiles.find(t => t.id === p.tile_id);
          return tile?.position;
        }).filter(p => p !== undefined)
      );

      const teamLines = [];

      // Check rows
      for (let row = 0; row < gridSize; row++) {
        const rowPositions = [];
        for (let col = 0; col < gridSize; col++) {
          rowPositions.push(row * gridSize + col);
        }
        if (rowPositions.every(pos => completedPositions.has(pos))) {
          teamLines.push({ type: 'row', positions: rowPositions });
        }
      }

      // Check columns
      for (let col = 0; col < gridSize; col++) {
        const colPositions = [];
        for (let row = 0; row < gridSize; row++) {
          colPositions.push(row * gridSize + col);
        }
        if (colPositions.every(pos => completedPositions.has(pos))) {
          teamLines.push({ type: 'column', positions: colPositions });
        }
      }

      // Check diagonals
      const diag1 = [];
      const diag2 = [];
      for (let i = 0; i < gridSize; i++) {
        diag1.push(i * gridSize + i);
        diag2.push(i * gridSize + (gridSize - 1 - i));
      }
      if (diag1.every(pos => completedPositions.has(pos))) {
        teamLines.push({ type: 'diagonal', positions: diag1 });
      }
      if (diag2.every(pos => completedPositions.has(pos))) {
        teamLines.push({ type: 'diagonal', positions: diag2 });
      }

      if (teamLines.length > 0) {
        lines[team.id] = { team, lines: teamLines };
      }
    });

    return lines;
  }, [safeTeams, safeProgress, safeTiles, gridSize]);

  // Check if a tile position is part of a bingo line
  const isBingoTile = (position) => {
    for (const teamId of Object.keys(bingoLines)) {
      for (const line of bingoLines[teamId].lines) {
        if (line.positions.includes(position)) {
          return bingoLines[teamId].team.color;
        }
      }
    }
    return null;
  };

  const handleTileHover = (tile, event) => {
    if (tile) {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    }
    setHoveredTile(tile);
  };

  // Get progress for a specific tile
  const getTileProgress = (tileId) => {
    return safeProgress
      .filter(p => p.tile_id === tileId)
      .map(p => ({
        ...p,
        team: safeTeams.find(t => t.id === p.team_id)
      }))
      .sort((a, b) => b.current_value - a.current_value);
  };

  // Get the leading team for a tile
  const getLeadingTeam = (tileId) => {
    const tileProgress = getTileProgress(tileId);
    if (tileProgress.length === 0) return null;
    
    // First check if anyone completed it
    const completed = tileProgress.find(p => p.completed);
    if (completed) return completed.team;
    
    // Otherwise return the one with highest value
    return tileProgress[0]?.team;
  };

  if (safeTiles.length === 0) {
    return (
      <div className="osrs-border-dashed rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-osrs-brown mb-4">Battle Royale Bingo Card</h2>
        <p className="text-osrs-border mb-4">
          Ingen bingo-felter oprettet endnu. Gå til "Felter" for at oprette felter.
        </p>
      </div>
    );
  }

  return (
    <div className="osrs-border-dashed rounded-lg p-4 md:p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-osrs-brown mb-2">Battle Royale Bingo Card</h2>
        <p className="text-sm text-osrs-border max-w-2xl mx-auto">
          Hovering over each tile shows the current leader and level or best score of that tile alongside its points and additional information.
          <br />
          Conquer the tile by getting the best score or level to claim it for your team and take the tile's points.
          <br />
          <span className="text-osrs-gold">When another team conquers a tile you were leading, these points are lost for your team.</span>
        </p>
      </div>

      {/* Bingo Grid */}
      <div 
        className="grid gap-2 md:gap-3"
        style={{ 
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          maxWidth: '900px',
          margin: '0 auto'
        }}
      >
        {safeTiles.map(tile => {
          const leadingTeam = getLeadingTeam(tile.id);
          const tileProgress = getTileProgress(tile.id);
          const isCompleted = tileProgress.some(p => p.completed);
          const bingoColor = isBingoTile(tile.position);
          const voteCount = getVoteCount(tile.id);
          
          const isTeamFocus = teamFocusTileId === tile.id;
          
          return (
            <BingoTile
              key={tile.id}
              tile={tile}
              leadingTeam={leadingTeam}
              progress={tileProgress}
              isCompleted={isCompleted}
              bingoColor={bingoColor}
              voteCount={voteCount}
              isTeamFocus={isTeamFocus}
              hasTeamSelected={!!selectedTeamId}
              onVote={() => handleVote(tile.id)}
              onHover={(e) => handleTileHover(tile, e)}
              onLeave={() => setHoveredTile(null)}
            />
          );
        })}
      </div>

      {/* Tooltip */}
      {hoveredTile && (
        <TileTooltip 
          tile={hoveredTile}
          progress={getTileProgress(hoveredTile.id)}
          teams={safeTeams}
          position={tooltipPosition}
        />
      )}
    </div>
  );
}

function TileTooltip({ tile, progress = [], teams = [], position }) {
  // Ensure arrays
  const safeProgress = Array.isArray(progress) ? progress : [];
  const safeTeams = Array.isArray(teams) ? teams : [];
  
  // Combine all teams with their progress (show 0 for teams without progress)
  const allTeamsProgress = safeTeams.map(team => {
    const teamProgress = safeProgress.find(p => p.team_id === team.id);
    return {
      team,
      current_value: teamProgress?.current_value || 0,
      completed: teamProgress?.completed || false
    };
  }).sort((a, b) => {
    // Completed first, then by value
    if (a.completed && !b.completed) return -1;
    if (!a.completed && b.completed) return 1;
    return b.current_value - a.current_value;
  });

  const leader = allTeamsProgress[0];

  return (
    <div 
      className="tooltip"
      style={{
        position: 'fixed',
        left: Math.min(position.x - 140, window.innerWidth - 300),
        top: Math.max(position.y - 220, 10),
      }}
    >
      <h3 className="text-osrs-gold font-bold text-lg mb-2">{tile.name}</h3>
      {tile.description && (
        <p className="text-gray-300 text-sm mb-3">{tile.description}</p>
      )}
      
      <div className="flex justify-between text-sm mb-3 text-gray-400">
        <span>Type: {tile.type}</span>
        <span>Points: <span className="text-osrs-gold font-bold">{tile.points}</span></span>
      </div>

      {tile.target_value > 1 && (
        <div className="text-sm text-gray-400 mb-3">
          Mål: {tile.target_value}
        </div>
      )}

      <div className="border-t border-gray-600 pt-3">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">
          Alle Hold Progress:
        </h4>
        {safeTeams.length === 0 ? (
          <p className="text-gray-500 text-sm">Ingen hold oprettet endnu</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allTeamsProgress.map((item, idx) => {
              const isLeader = idx === 0 && item.current_value > 0;
              return (
                <div 
                  key={item.team.id}
                  className={`flex items-center justify-between text-sm p-1 rounded ${
                    isLeader ? 'bg-osrs-gold bg-opacity-20' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.team.logo_url ? (
                      <img 
                        src={item.team.logo_url} 
                        alt=""
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.team.color }}
                      />
                    )}
                    <span className={isLeader ? 'text-osrs-gold font-semibold' : 'text-gray-300'}>
                      {item.team.name}
                    </span>
                    {isLeader && <span className="text-osrs-gold text-xs">👑</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {tile.target_value > 1 ? (
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${item.completed ? 'bg-green-500' : 'bg-osrs-gold'}`}
                            style={{ width: `${Math.min((item.current_value / tile.target_value) * 100, 100)}%` }}
                          />
                        </div>
                        <span className={item.completed ? 'text-green-400' : 'text-gray-400'}>
                          {item.current_value}/{tile.target_value}
                        </span>
                      </div>
                    ) : (
                      <span className={item.completed ? 'text-green-400' : 'text-gray-400'}>
                        {item.current_value}
                      </span>
                    )}
                    {item.completed && (
                      <span className="text-green-400 text-xs">✓</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default BingoBoard;
