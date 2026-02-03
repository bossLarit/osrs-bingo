import { useState } from 'react';
import { Plus, Trash2, UserPlus, X, Shuffle, Users, Scale } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { apiUrl } from '../api';
import { useDialog } from './Dialog';

function TeamManager({ teams, onUpdate }) {
  const dialog = useDialog();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRandomModal, setShowRandomModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#3b82f6');
  const [newTeamLogo, setNewTeamLogo] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Random assignment state
  const [memberPool, setMemberPool] = useState([]);
  const [poolInput, setPoolInput] = useState('');
  
  // Pending logo state for explicit save
  const [pendingLogo, setPendingLogo] = useState(null);
  
  // Balanced team distribution state
  const [showBalancedModal, setShowBalancedModal] = useState(false);
  const [balancedPlayers, setBalancedPlayers] = useState([]);
  const [balancedInput, setBalancedInput] = useState('');
  const [balanceBy, setBalanceBy] = useState('all');

  const predefinedColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  const createTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    
    setLoading(true);
    try {
      await fetch(apiUrl('/api/teams'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName, color: newTeamColor, logo_url: newTeamLogo })
      });
      setNewTeamName('');
      setNewTeamColor('#3b82f6');
      setNewTeamLogo('');
      setShowCreateModal(false);
      onUpdate();
    } catch (error) {
      console.error('Error creating team:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = async (teamId) => {
    const confirmed = await dialog.confirm('Er du sikker på at du vil slette dette hold?', {
      title: 'Slet hold',
      confirmText: 'Ja, slet',
      variant: 'error'
    });
    if (!confirmed) return;
    
    try {
      await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
      setSelectedTeam(null);
      onUpdate();
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const addPlayer = async (e) => {
    e.preventDefault();
    if (!newPlayerName.trim() || !selectedTeam) return;
    
    setLoading(true);
    try {
      await fetch(`/api/teams/${selectedTeam.id}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newPlayerName })
      });
      setNewPlayerName('');
      
      // Refresh team data
      const res = await fetch(`/api/teams/${selectedTeam.id}`);
      const updatedTeam = await res.json();
      setSelectedTeam(updatedTeam);
      onUpdate();
    } catch (error) {
      console.error('Error adding player:', error);
    } finally {
      setLoading(false);
    }
  };

  const removePlayer = async (playerId) => {
    try {
      await fetch(`/api/players/${playerId}`, { method: 'DELETE' });
      
      // Refresh team data
      const res = await fetch(`/api/teams/${selectedTeam.id}`);
      const updatedTeam = await res.json();
      setSelectedTeam(updatedTeam);
      onUpdate();
    } catch (error) {
      console.error('Error removing player:', error);
    }
  };

  const updateTeamLogo = async (logoUrl) => {
    if (!selectedTeam) return;
    
    try {
      await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_url: logoUrl })
      });
      
      // Refresh team data
      const res = await fetch(`/api/teams/${selectedTeam.id}`);
      const updatedTeam = await res.json();
      setSelectedTeam(updatedTeam);
      onUpdate();
    } catch (error) {
      console.error('Error updating team logo:', error);
    }
  };

  const selectTeam = async (team) => {
    try {
      const res = await fetch(`/api/teams/${team.id}`);
      const fullTeam = await res.json();
      setSelectedTeam(fullTeam);
    } catch (error) {
      console.error('Error fetching team:', error);
    }
  };

  // Random assignment functions
  const addToPool = () => {
    if (!poolInput.trim()) return;
    const names = poolInput.split(/[,\n]/).map(n => n.trim()).filter(n => n);
    setMemberPool([...memberPool, ...names]);
    setPoolInput('');
  };

  const removeFromPool = (index) => {
    setMemberPool(memberPool.filter((_, i) => i !== index));
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const distributeRandomly = async () => {
    if (memberPool.length === 0 || teams.length === 0) {
      await dialog.alert('Du skal have både medlemmer i puljen og hold oprettet');
      return;
    }

    const confirmed = await dialog.confirm(`Fordel ${memberPool.length} medlemmer tilfældigt på ${teams.length} hold?`, {
      title: 'Tilfældig fordeling',
      confirmText: 'Ja, fordel'
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      const shuffledMembers = shuffleArray(memberPool);
      
      for (let i = 0; i < shuffledMembers.length; i++) {
        const teamIndex = i % teams.length;
        const team = teams[teamIndex];
        
        await fetch(`/api/teams/${team.id}/players`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: shuffledMembers[i] })
        });
      }
      
      setMemberPool([]);
      setShowRandomModal(false);
      onUpdate();
      await dialog.success('Medlemmer fordelt tilfældigt!');
    } catch (error) {
      console.error('Error distributing members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Balanced team distribution functions
  const parseBalancedInput = () => {
    if (!balancedInput.trim()) return;
    
    // Parse tab-separated or comma-separated data
    // Format: Name, Combat, Total, EHB (or tab-separated)
    const lines = balancedInput.trim().split('\n');
    const players = [];
    
    for (const line of lines) {
      // Try tab-separated first, then comma
      let parts = line.split('\t');
      if (parts.length < 2) {
        parts = line.split(',').map(p => p.trim());
      }
      
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const combat = parseInt(parts[1]) || 0;
        const total = parseInt(parts[2]) || 0;
        const ehb = parseFloat(parts[3]) || 0;
        
        if (name) {
          players.push({ name, combat, total, ehb });
        }
      }
    }
    
    setBalancedPlayers([...balancedPlayers, ...players]);
    setBalancedInput('');
  };

  const removeBalancedPlayer = (index) => {
    setBalancedPlayers(balancedPlayers.filter((_, i) => i !== index));
  };

  const getBalanceValue = (player) => {
    switch (balanceBy) {
      case 'all': 
        // Normalize and combine all stats (EHB weighted more as it's more meaningful)
        return (player.ehb * 10) + (player.total / 100) + (player.combat / 10);
      case 'ehb': return player.ehb;
      case 'total': return player.total;
      case 'combat': return player.combat;
      default: return (player.ehb * 10) + (player.total / 100) + (player.combat / 10);
    }
  };

  const getBalanceLabel = () => {
    switch (balanceBy) {
      case 'all': return 'Score';
      case 'ehb': return 'EHB';
      case 'total': return 'Total';
      case 'combat': return 'Combat';
      default: return 'Score';
    }
  };

  const distributeBalanced = async () => {
    if (balancedPlayers.length === 0 || teams.length === 0) {
      await dialog.alert('Du skal have både spillere og hold');
      return;
    }

    const balanceConfirmed = await dialog.confirm(`Fordel ${balancedPlayers.length} spillere balanceret på ${teams.length} hold baseret på ${getBalanceLabel()}?`, {
      title: 'Balanceret fordeling',
      confirmText: 'Ja, fordel'
    });
    if (!balanceConfirmed) return;

    setLoading(true);
    try {
      // Sort players by balance value (highest first)
      const sortedPlayers = [...balancedPlayers].sort((a, b) => getBalanceValue(b) - getBalanceValue(a));
      
      // Initialize team scores
      const teamScores = teams.map(t => ({ team: t, score: 0, players: [] }));
      
      // Snake draft - assign each player to the team with lowest current score
      for (const player of sortedPlayers) {
        // Find team with lowest score
        teamScores.sort((a, b) => a.score - b.score);
        const targetTeam = teamScores[0];
        
        targetTeam.players.push(player);
        targetTeam.score += getBalanceValue(player);
      }
      
      // Add players to teams via API
      for (const ts of teamScores) {
        for (const player of ts.players) {
          await fetch(`/api/teams/${ts.team.id}/players`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: player.name })
          });
        }
      }
      
      // Show results
      const results = teamScores.map(ts => 
        `${ts.team.name}: ${ts.players.length} spillere (${balanceBy}: ${ts.score.toFixed(1)})`
      ).join('\n');
      
      await dialog.success(`Spillere fordelt balanceret!\n\n${results}`);
      
      setBalancedPlayers([]);
      setShowBalancedModal(false);
      onUpdate();
    } catch (error) {
      console.error('Error distributing balanced:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="osrs-border-dashed rounded-lg p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-osrs-brown">Hold Administration</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowBalancedModal(true)}
            className="btn-osrs flex items-center gap-2 rounded"
          >
            <Scale size={18} />
            Balanceret Fordeling
          </button>
          <button
            onClick={() => setShowRandomModal(true)}
            className="btn-osrs flex items-center gap-2 rounded"
          >
            <Shuffle size={18} />
            Tilfældig Fordeling
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-osrs flex items-center gap-2 rounded"
          >
            <Plus size={18} />
            Opret Hold
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Teams List */}
        <div>
          <h3 className="font-semibold text-osrs-brown mb-3">Hold ({teams.length})</h3>
          <div className="space-y-2">
            {teams.length === 0 ? (
              <p className="text-osrs-border text-sm">Ingen hold oprettet endnu</p>
            ) : (
              teams.map(team => (
                <div
                  key={team.id}
                  onClick={() => selectTeam(team)}
                  className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors ${
                    selectedTeam?.id === team.id 
                      ? 'bg-osrs-brown bg-opacity-20 border-2 border-osrs-gold' 
                      : 'bg-white bg-opacity-50 hover:bg-opacity-70 border-2 border-transparent'
                  }`}
                >
                  {team.logo_url ? (
                    <img 
                      src={team.logo_url} 
                      alt={team.name}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-8 h-8 rounded-full flex-shrink-0"
                    style={{ 
                      backgroundColor: team.color,
                      display: team.logo_url ? 'none' : 'block'
                    }}
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-osrs-brown">{team.name}</h4>
                    <p className="text-xs text-osrs-border">
                      {team.player_count || 0} spillere
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Team Details */}
        <div>
          {selectedTeam ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {selectedTeam.logo_url ? (
                    <img 
                      src={selectedTeam.logo_url} 
                      alt={selectedTeam.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-10 h-10 rounded-full"
                      style={{ backgroundColor: selectedTeam.color }}
                    />
                  )}
                  <h3 className="font-semibold text-osrs-brown text-xl">
                    {selectedTeam.name}
                  </h3>
                </div>
                <button
                  onClick={() => deleteTeam(selectedTeam.id)}
                  className="btn-osrs btn-osrs-danger rounded p-2"
                  title="Slet hold"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Add Player Form */}
              <form onSubmit={addPlayer} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="OSRS brugernavn"
                  className="input-osrs flex-1 rounded"
                />
                <button
                  type="submit"
                  disabled={loading || !newPlayerName.trim()}
                  className="btn-osrs flex items-center gap-2 rounded"
                >
                  <UserPlus size={18} />
                  Tilføj
                </button>
              </form>

              {/* Update Team Logo */}
              <div className="mb-4 p-3 bg-white bg-opacity-30 rounded">
                <h4 className="font-semibold text-osrs-brown text-sm mb-2">Hold Logo</h4>
                <ImageUpload 
                  currentUrl={pendingLogo !== null ? pendingLogo : (selectedTeam.logo_url || '')}
                  onImageUrl={(url) => setPendingLogo(url)}
                />
                {pendingLogo !== null && pendingLogo !== selectedTeam.logo_url && (
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        updateTeamLogo(pendingLogo);
                        setPendingLogo(null);
                      }}
                      className="btn-osrs rounded text-sm flex-1"
                    >
                      Gem Logo
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingLogo(null)}
                      className="btn-osrs rounded text-sm"
                    >
                      Annuller
                    </button>
                  </div>
                )}
              </div>

              {/* Players List */}
              <div className="space-y-2">
                <h4 className="font-semibold text-osrs-brown text-sm">
                  Spillere ({selectedTeam.players?.length || 0})
                </h4>
                {!selectedTeam.players?.length ? (
                  <p className="text-osrs-border text-sm">Ingen spillere endnu</p>
                ) : (
                  selectedTeam.players.map(player => (
                    <div 
                      key={player.id}
                      className="flex items-center justify-between p-2 bg-white bg-opacity-50 rounded"
                    >
                      <span className="text-osrs-brown">{player.username}</span>
                      <button
                        onClick={() => removePlayer(player.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Fjern spiller"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-osrs-border">
              <p>Vælg et hold for at se detaljer</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-osrs-brown mb-4">Opret Nyt Hold</h3>
            <form onSubmit={createTeam}>
              <div className="mb-4">
                <label className="block text-osrs-brown mb-2">Hold Navn</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Indtast hold navn"
                  className="input-osrs w-full rounded"
                  autoFocus
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-osrs-brown mb-2">Hold Farve</label>
                <div className="flex gap-2 flex-wrap">
                  {predefinedColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTeamColor(color)}
                      className={`w-10 h-10 rounded-full transition-transform ${
                        newTeamColor === color ? 'ring-4 ring-osrs-gold scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={newTeamColor}
                    onChange={(e) => setNewTeamColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="mb-6">
                <ImageUpload 
                  currentUrl={newTeamLogo}
                  onImageUrl={(url) => setNewTeamLogo(url)}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-osrs rounded"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  disabled={loading || !newTeamName.trim()}
                  className="btn-osrs rounded"
                >
                  {loading ? 'Opretter...' : 'Opret Hold'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Random Assignment Modal */}
      {showRandomModal && (
        <div className="modal-overlay" onClick={() => setShowRandomModal(false)}>
          <div className="modal-content p-6 max-w-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-osrs-brown mb-4 flex items-center gap-2">
              <Shuffle size={20} />
              Tilfældig Hold Fordeling
            </h3>
            
            <p className="text-sm text-osrs-border mb-4">
              Tilføj medlemmer til puljen og fordel dem tilfældigt på de eksisterende hold.
              Medlemmerne fordeles jævnt - f.eks. 9 medlemmer på 3 hold = 3 per hold.
            </p>

            {/* Teams preview */}
            <div className="mb-4">
              <h4 className="font-semibold text-osrs-brown text-sm mb-2">
                Hold ({teams.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {teams.map(team => (
                  <div 
                    key={team.id}
                    className="flex items-center gap-2 px-3 py-1 rounded-full text-sm"
                    style={{ backgroundColor: team.color + '33', color: team.color }}
                  >
                    {team.logo_url && (
                      <img src={team.logo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                    )}
                    {team.name}
                  </div>
                ))}
              </div>
              {teams.length === 0 && (
                <p className="text-red-500 text-sm">Opret hold først!</p>
              )}
            </div>

            {/* Add to pool */}
            <div className="mb-4">
              <h4 className="font-semibold text-osrs-brown text-sm mb-2">
                Tilføj Medlemmer til Pulje
              </h4>
              <div className="flex gap-2 mb-2">
                <textarea
                  value={poolInput}
                  onChange={(e) => setPoolInput(e.target.value)}
                  placeholder="Indtast navne (komma- eller linjeskift-separeret)&#10;F.eks: Spiller1, Spiller2, Spiller3"
                  className="input-osrs flex-1 rounded"
                  rows={3}
                />
              </div>
              <button
                type="button"
                onClick={addToPool}
                disabled={!poolInput.trim()}
                className="btn-osrs rounded text-sm"
              >
                <UserPlus size={16} className="inline mr-1" />
                Tilføj til Pulje
              </button>
            </div>

            {/* Current pool */}
            <div className="mb-6">
              <h4 className="font-semibold text-osrs-brown text-sm mb-2">
                Pulje ({memberPool.length} medlemmer)
              </h4>
              {memberPool.length === 0 ? (
                <p className="text-osrs-border text-sm">Ingen medlemmer i puljen endnu</p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-white bg-opacity-30 rounded">
                  {memberPool.map((name, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-1 bg-osrs-light px-2 py-1 rounded text-sm"
                    >
                      <span>{name}</span>
                      <button
                        type="button"
                        onClick={() => removeFromPool(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {memberPool.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMemberPool([])}
                  className="text-red-500 text-xs mt-2 hover:underline"
                >
                  Ryd pulje
                </button>
              )}
            </div>

            {/* Distribution preview */}
            {memberPool.length > 0 && teams.length > 0 && (
              <div className="mb-4 p-3 bg-osrs-gold bg-opacity-10 rounded">
                <p className="text-sm text-osrs-brown">
                  <strong>Fordeling:</strong> {memberPool.length} medlemmer → {teams.length} hold 
                  = ca. {Math.ceil(memberPool.length / teams.length)} per hold
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowRandomModal(false)}
                className="btn-osrs rounded"
              >
                Annuller
              </button>
              <button
                type="button"
                onClick={distributeRandomly}
                disabled={loading || memberPool.length === 0 || teams.length === 0}
                className="btn-osrs rounded flex items-center gap-2"
              >
                <Shuffle size={18} />
                {loading ? 'Fordeler...' : 'Fordel Tilfældigt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Balanced Distribution Modal */}
      {showBalancedModal && (
        <div className="modal-overlay" onClick={() => setShowBalancedModal(false)}>
          <div className="modal-content p-6 max-w-3xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-osrs-brown mb-4 flex items-center gap-2">
              <Scale size={20} />
              Balanceret Hold Fordeling
            </h3>
            
            <p className="text-sm text-osrs-border mb-4">
              Indsæt spiller data fra WOM (kopier tabellen direkte). 
              Spillerne fordeles så holdene får så ens total som muligt.
            </p>

            {/* Balance by selector */}
            <div className="mb-4">
              <label className="block text-osrs-brown text-sm font-semibold mb-2">
                Balancer efter:
              </label>
              <div className="flex gap-3 flex-wrap">
                {[
                  { id: 'all', label: 'Alle (Kombineret)' },
                  { id: 'ehb', label: 'EHB' },
                  { id: 'total', label: 'Total Level' },
                  { id: 'combat', label: 'Combat Level' }
                ].map(opt => (
                  <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="balanceBy"
                      value={opt.id}
                      checked={balanceBy === opt.id}
                      onChange={(e) => setBalanceBy(e.target.value)}
                      className="accent-osrs-gold"
                    />
                    <span className="text-sm text-osrs-brown">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Teams preview */}
            <div className="mb-4">
              <h4 className="font-semibold text-osrs-brown text-sm mb-2">
                Hold ({teams.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {teams.map(team => (
                  <div 
                    key={team.id}
                    className="flex items-center gap-2 px-3 py-1 rounded-full text-sm"
                    style={{ backgroundColor: team.color + '33', color: team.color }}
                  >
                    {team.name}
                  </div>
                ))}
              </div>
              {teams.length === 0 && (
                <p className="text-red-500 text-sm">Opret hold først!</p>
              )}
            </div>

            {/* Input area */}
            <div className="mb-4">
              <h4 className="font-semibold text-osrs-brown text-sm mb-2">
                Indsæt Spiller Data
              </h4>
              <p className="text-xs text-osrs-border mb-2">
                Format: Navn, Combat, Total, EHB (tab- eller komma-separeret)
              </p>
              <textarea
                value={balancedInput}
                onChange={(e) => setBalancedInput(e.target.value)}
                placeholder="NoClueOnGlue	126	2342	771
GIM Megl	109	1829	47
Plaqx	114	1928	37"
                className="input-osrs w-full rounded font-mono text-sm"
                rows={5}
              />
              <button
                type="button"
                onClick={parseBalancedInput}
                disabled={!balancedInput.trim()}
                className="btn-osrs rounded text-sm mt-2"
              >
                <UserPlus size={16} className="inline mr-1" />
                Tilføj Spillere
              </button>
            </div>

            {/* Current players */}
            <div className="mb-4">
              <h4 className="font-semibold text-osrs-brown text-sm mb-2">
                Spillere ({balancedPlayers.length})
              </h4>
              {balancedPlayers.length === 0 ? (
                <p className="text-osrs-border text-sm">Ingen spillere tilføjet endnu</p>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-osrs-brown bg-opacity-20">
                      <tr>
                        <th className="text-left p-2 text-osrs-brown">Navn</th>
                        <th className="text-right p-2 text-osrs-brown">Combat</th>
                        <th className="text-right p-2 text-osrs-brown">Total</th>
                        <th className="text-right p-2 text-osrs-brown">EHB</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {balancedPlayers.map((player, index) => (
                        <tr key={index} className="border-b border-osrs-border border-opacity-20">
                          <td className="p-2 text-osrs-brown">{player.name}</td>
                          <td className="p-2 text-right text-osrs-brown">{player.combat}</td>
                          <td className="p-2 text-right text-osrs-brown">{player.total}</td>
                          <td className="p-2 text-right text-osrs-brown font-semibold">{player.ehb}</td>
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeBalancedPlayer(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {balancedPlayers.length > 0 && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-osrs-border">
                    Total {getBalanceLabel()}: {balancedPlayers.reduce((sum, p) => sum + getBalanceValue(p), 0).toFixed(1)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBalancedPlayers([])}
                    className="text-red-500 text-xs hover:underline"
                  >
                    Ryd liste
                  </button>
                </div>
              )}
            </div>

            {/* Distribution preview */}
            {balancedPlayers.length > 0 && teams.length > 0 && (
              <div className="mb-4 p-3 bg-osrs-gold bg-opacity-10 rounded">
                <p className="text-sm text-osrs-brown">
                  <strong>Estimeret fordeling:</strong> {balancedPlayers.length} spillere → {teams.length} hold 
                  = ca. {(balancedPlayers.reduce((sum, p) => sum + getBalanceValue(p), 0) / teams.length).toFixed(1)} {getBalanceLabel()} per hold
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowBalancedModal(false)}
                className="btn-osrs rounded"
              >
                Annuller
              </button>
              <button
                type="button"
                onClick={distributeBalanced}
                disabled={loading || balancedPlayers.length === 0 || teams.length === 0}
                className="btn-osrs rounded flex items-center gap-2"
              >
                <Scale size={18} />
                {loading ? 'Fordeler...' : 'Fordel Balanceret'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamManager;
