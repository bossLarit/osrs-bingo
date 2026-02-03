import { useState } from 'react';
import { Trophy, ChevronDown, ChevronUp, Users } from 'lucide-react';

function Scoreboard({ teams = [], progress = [], tiles = [] }) {
  // Ensure arrays
  const safeTeams = Array.isArray(teams) ? teams : [];
  const safeProgress = Array.isArray(progress) ? progress : [];
  const safeTiles = Array.isArray(tiles) ? tiles : [];
  
  const [expandedTeam, setExpandedTeam] = useState(null);
  // Calculate scores for each team
  const teamScores = safeTeams.map(team => {
    const teamProgress = safeProgress.filter(p => p.team_id === team.id);
    const completedTiles = teamProgress.filter(p => p.completed);
    const totalPoints = completedTiles.reduce((sum, p) => {
      const tile = safeTiles.find(t => t.id === p.tile_id);
      return sum + (tile?.points || 1);
    }, 0);
    
    return {
      ...team,
      totalPoints,
      tilesCompleted: completedTiles.length
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints || b.tilesCompleted - a.tilesCompleted);

  return (
    <div className="osrs-border-dashed rounded-lg p-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Trophy className="text-osrs-gold" size={28} />
          <h2 className="text-2xl font-bold text-osrs-brown">Scoreboard</h2>
        </div>
        <p className="text-sm text-osrs-border">Current top based on total score</p>
      </div>

      <div className="space-y-4">
        {teamScores.length === 0 ? (
          <p className="text-center text-osrs-border py-4">
            Ingen hold oprettet endnu
          </p>
        ) : (
          teamScores.map((team, index) => (
            <div key={team.id}>
              <div 
                className="flex items-center gap-4 py-3 border-b border-dashed border-osrs-border cursor-pointer hover:bg-osrs-gold hover:bg-opacity-10 transition-colors rounded"
                onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
              >
                {/* Team color indicator */}
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
                  style={{ backgroundColor: team.color }}
                >
                  {index === 0 ? '🏆' : index + 1}
                </div>
                
                {/* Team name */}
                <div className="flex-1">
                  <h3 className="font-semibold text-osrs-brown text-lg">{team.name}</h3>
                  <p className="text-xs text-osrs-border flex items-center gap-1">
                    <Users size={12} />
                    {team.members?.length || 0} spillere · {team.tilesCompleted} felter fuldført
                  </p>
                </div>
                
                {/* Score */}
                <div className="text-2xl font-bold text-osrs-brown">
                  {team.totalPoints}
                </div>
                
                {/* Expand icon */}
                <div className="text-osrs-border">
                  {expandedTeam === team.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
              
              {/* Expanded team members */}
              {expandedTeam === team.id && (
                <div className="ml-16 py-3 px-4 bg-osrs-dark bg-opacity-5 rounded-lg mt-2 mb-2">
                  <h4 className="text-sm font-semibold text-osrs-brown mb-2">Holdmedlemmer:</h4>
                  {team.members && team.members.length > 0 ? (
                    <div className="space-y-1">
                      {team.members.map((member, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-osrs-dark">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: team.color }}
                          />
                          <span>{member}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-osrs-border italic">Ingen medlemmer tilføjet endnu</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {teamScores.length > 0 && (
        <div className="mt-6 pt-4 border-t border-dashed border-osrs-border">
          <p className="text-xs text-center text-osrs-border">
            Hovering over each tile shows the current leader and best score
          </p>
        </div>
      )}
    </div>
  );
}

export default Scoreboard;
