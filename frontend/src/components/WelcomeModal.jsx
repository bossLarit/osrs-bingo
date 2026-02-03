import { useState, useEffect } from 'react';
import { User, UserPlus, ChevronRight, Loader2 } from 'lucide-react';
import { apiUrl } from '../api';

function WelcomeModal({ teams, onPlayerSelect, onClose }) {
  const [mode, setMode] = useState('select'); // 'select' or 'register'
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  
  // Registration form
  const [newUsername, setNewUsername] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await fetch(apiUrl('/api/players'));
      const data = await res.json();
      setAllPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group players by team
  const playersByTeam = {};
  allPlayers.forEach(player => {
    if (!playersByTeam[player.team_id]) {
      playersByTeam[player.team_id] = [];
    }
    playersByTeam[player.team_id].push(player);
  });

  const handleSelectPlayer = (player) => {
    const team = teams.find(t => t.id === player.team_id);
    onPlayerSelect(player, team?.id);
    onClose();
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!newUsername.trim()) {
      setError('Indtast dit OSRS navn');
      return;
    }
    if (!selectedTeamId) {
      setError('Vælg et hold');
      return;
    }

    setRegistering(true);
    try {
      const res = await fetch(apiUrl(`/api/teams/${selectedTeamId}/players`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername.trim() })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Kunne ikke oprette profil');
        return;
      }
      
      // Select the newly created player
      onPlayerSelect(data, parseInt(selectedTeamId));
      onClose();
    } catch (error) {
      setError('Netværksfejl - prøv igen');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[300] p-4">
      <div className="bg-[#f5e6c8] border-4 border-[#5c4a32] rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-amber-600 p-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-1">🎲 Velkommen til OSRS Bingo!</h2>
          <p className="text-amber-100 text-sm">Vælg din karakter for at fortsætte</p>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Mode tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('select')}
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                mode === 'select' 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-osrs-dark bg-opacity-10 text-osrs-brown hover:bg-opacity-20'
              }`}
            >
              <User size={16} className="inline mr-1" />
              Jeg er registreret
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                mode === 'register' 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-osrs-dark bg-opacity-10 text-osrs-brown hover:bg-opacity-20'
              }`}
            >
              <UserPlus size={16} className="inline mr-1" />
              Ny spiller
            </button>
          </div>

          {mode === 'select' ? (
            /* Player selection */
            <div>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 size={24} className="animate-spin mx-auto text-osrs-border" />
                  <p className="text-osrs-border mt-2">Henter spillere...</p>
                </div>
              ) : allPlayers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-osrs-border mb-4">Ingen spillere registreret endnu</p>
                  <button
                    onClick={() => setMode('register')}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Opret din profil
                  </button>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {teams.map(team => {
                    const teamPlayers = playersByTeam[team.id] || [];
                    if (teamPlayers.length === 0) return null;
                    
                    return (
                      <div key={team.id} className="border border-osrs-border rounded-lg overflow-hidden">
                        <div className="px-3 py-2 bg-osrs-dark bg-opacity-10 flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: team.color }}
                          />
                          <span className="font-semibold text-osrs-brown">{team.name}</span>
                        </div>
                        <div className="divide-y divide-osrs-border divide-opacity-30">
                          {teamPlayers.map(player => (
                            <button
                              key={player.id}
                              onClick={() => handleSelectPlayer(player)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-osrs-gold hover:bg-opacity-20 transition-colors"
                            >
                              <User size={18} className="text-osrs-border" />
                              <span className="text-osrs-brown font-medium flex-1 text-left">
                                {player.username}
                              </span>
                              <ChevronRight size={16} className="text-osrs-border" />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Registration form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-osrs-brown font-medium mb-1 text-sm">
                  Dit OSRS navn
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="F.eks. Plaqx"
                  className="w-full px-3 py-2 border-2 border-osrs-border rounded-lg bg-white focus:outline-none focus:border-amber-600"
                  autoFocus
                />
                <p className="text-xs text-osrs-border mt-1">
                  Skal matche dit navn på wiseoldman.net for XP tracking
                </p>
              </div>

              <div>
                <label className="block text-osrs-brown font-medium mb-1 text-sm">
                  Vælg dit hold
                </label>
                <div className="space-y-2">
                  {teams.map(team => (
                    <label
                      key={team.id}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedTeamId === team.id.toString()
                          ? 'border-amber-600 bg-amber-50'
                          : 'border-osrs-border hover:border-amber-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="team"
                        value={team.id}
                        checked={selectedTeamId === team.id.toString()}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="sr-only"
                      />
                      <div 
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      <span className="font-medium text-osrs-brown">{team.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={registering}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {registering ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Opretter...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Opret profil
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-osrs-dark bg-opacity-5 border-t border-osrs-border text-center">
          <p className="text-xs text-osrs-border">
            Din profil gemmes i browseren. Du kan skifte karakter senere.
          </p>
        </div>
      </div>
    </div>
  );
}

export default WelcomeModal;
