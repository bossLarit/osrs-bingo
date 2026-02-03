import { useState, useEffect } from 'react';
import { User, ChevronDown, Check, LogOut } from 'lucide-react';
import { apiUrl } from '../api';

function TeamSelector({ teams = [], selectedTeamId, onSelect, players, onPlayerSelect, selectedPlayer }) {
  // Ensure arrays
  const safeTeams = Array.isArray(teams) ? teams : [];
  
  const [isOpen, setIsOpen] = useState(false);
  const [allPlayers, setAllPlayers] = useState([]);
  
  // Find the team for the selected player
  const playerTeam = selectedPlayer 
    ? safeTeams.find(t => t.id === selectedPlayer.team_id)
    : null;

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await fetch(apiUrl('/api/players'));
      const data = await res.json();
      setAllPlayers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching players:', error);
      setAllPlayers([]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.player-selector')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handlePlayerClick = (player) => {
    onPlayerSelect(player);
    onSelect(player.team_id);
    setIsOpen(false);
  };

  const handleLogout = () => {
    onPlayerSelect(null);
    onSelect(null);
    setIsOpen(false);
  };

  // Group players by team
  const playersByTeam = {};
  allPlayers.forEach(player => {
    if (!playersByTeam[player.team_id]) {
      playersByTeam[player.team_id] = [];
    }
    playersByTeam[player.team_id].push(player);
  });

  return (
    <div className="player-selector relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-osrs-border bg-osrs-light hover:bg-osrs-gold hover:bg-opacity-20 transition-colors"
      >
        {selectedPlayer ? (
          <>
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: playerTeam?.color || '#888' }}
            />
            <div className="flex flex-col items-start">
              <span className="text-osrs-brown font-medium text-sm leading-tight">
                {selectedPlayer.username}
              </span>
              <span className="text-osrs-border text-xs leading-tight">
                {playerTeam?.name || 'Intet hold'}
              </span>
            </div>
          </>
        ) : (
          <>
            <User size={16} className="text-osrs-border" />
            <span className="text-osrs-border text-sm">Hvem er du?</span>
          </>
        )}
        <ChevronDown size={14} className={`text-osrs-border transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-[#f5e6c8] border-2 border-[#5c4a32] rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-osrs-border bg-osrs-dark bg-opacity-5">
            <span className="text-xs text-osrs-border font-semibold uppercase">Vælg din karakter</span>
          </div>
          
          {allPlayers.length === 0 ? (
            <div className="p-3 text-sm text-osrs-border text-center">
              Ingen spillere registreret endnu
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {safeTeams.map(team => {
                const teamPlayers = playersByTeam[team.id] || [];
                if (teamPlayers.length === 0) return null;
                
                return (
                  <div key={team.id}>
                    <div className="px-3 py-1.5 bg-osrs-dark bg-opacity-10 flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      <span className="text-xs font-semibold text-osrs-brown">{team.name}</span>
                    </div>
                    {teamPlayers.map(player => (
                      <button
                        key={player.id}
                        onClick={() => handlePlayerClick(player)}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-osrs-gold hover:bg-opacity-20 transition-colors"
                      >
                        <User size={14} className="text-osrs-border" />
                        <span className="text-osrs-brown text-sm flex-1 text-left">
                          {player.username}
                        </span>
                        {selectedPlayer?.id === player.id && (
                          <Check size={14} className="text-green-600" />
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
          
          {selectedPlayer && (
            <div className="p-2 border-t border-osrs-border">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-1 text-xs text-osrs-border hover:text-red-600 transition-colors"
              >
                <LogOut size={12} />
                Log ud
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TeamSelector;
