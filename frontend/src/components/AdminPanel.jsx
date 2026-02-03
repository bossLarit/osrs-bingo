import { useState, useEffect } from 'react';
import { Shield, Check, X, Image, MessageSquare, Users, Crown, Undo2, Clock, Calendar } from 'lucide-react';

function AdminPanel({ teams, tiles, onUpdate }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [storedPassword, setStoredPassword] = useState('');
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [loginError, setLoginError] = useState('');
  const [config, setConfig] = useState({});
  const [showScheduler, setShowScheduler] = useState(false);
  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('adminPassword');
    if (saved) {
      verifyPassword(saved);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchProofs();
      fetchConfig();
    }
  }, [isAdmin]);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setConfig(data);
      setEventStart(data.event_start || '');
      setEventEnd(data.event_end || '');
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const handleUndo = async () => {
    if (!confirm('Fortryd sidste godkendelse?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_password: storedPassword })
      });
      const data = await res.json();
      if (data.success) {
        alert('Handling fortrudt!');
        fetchProofs();
        onUpdate();
      } else {
        alert(data.error || 'Kunne ikke fortryde');
      }
    } catch (error) {
      console.error('Error undoing:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSchedule = async () => {
    setLoading(true);
    try {
      await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_password: storedPassword,
          event_start: eventStart || null,
          event_end: eventEnd || null
        })
      });
      setShowScheduler(false);
      alert('Event tider gemt!');
    } catch (error) {
      console.error('Error saving schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyPassword = async (pwd) => {
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
      });
      const data = await res.json();
      if (data.valid) {
        setIsAdmin(true);
        setStoredPassword(pwd);
        localStorage.setItem('adminPassword', pwd);
      }
      return data.valid;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const valid = await verifyPassword(password);
    if (!valid) {
      setLoginError('Forkert adgangskode. Prøv igen.');
    }
    setPassword('');
  };

  const logout = () => {
    setIsAdmin(false);
    setStoredPassword('');
    localStorage.removeItem('adminPassword');
  };

  const fetchProofs = async () => {
    try {
      const res = await fetch('/api/proofs');
      const data = await res.json();
      setProofs(data);
    } catch (error) {
      console.error('Error fetching proofs:', error);
    }
  };

  const handleProof = async (proofId, status) => {
    setLoading(true);
    try {
      await fetch(`/api/proofs/${proofId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_password: storedPassword })
      });
      fetchProofs();
      onUpdate();
    } catch (error) {
      console.error('Error handling proof:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProof = async (proofId) => {
    if (!confirm('Slet dette bevis?')) return;
    try {
      await fetch(`/api/proofs/${proofId}`, { method: 'DELETE' });
      fetchProofs();
    } catch (error) {
      console.error('Error deleting proof:', error);
    }
  };

  const assignTile = async (tileId) => {
    if (!selectedTeam) return;
    setLoading(true);
    try {
      await fetch('/api/admin/assign-tile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tile_id: tileId,
          team_id: parseInt(selectedTeam),
          admin_password: storedPassword
        })
      });
      setShowAssignModal(null);
      setSelectedTeam('');
      onUpdate();
    } catch (error) {
      console.error('Error assigning tile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="osrs-border-dashed rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="text-osrs-gold" size={24} />
          <h2 className="text-2xl font-bold text-osrs-brown">Admin Panel</h2>
        </div>
        
        <form onSubmit={handleLogin} className="max-w-sm">
          <p className="text-osrs-border mb-4">
            Indtast admin adgangskode for at få adgang
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLoginError('');
              }}
              placeholder="Adgangskode"
              className={`input-osrs flex-1 rounded ${loginError ? 'border-red-500' : ''}`}
            />
            <button type="submit" className="btn-osrs rounded">
              Log ind
            </button>
          </div>
          {loginError && (
            <div className="mt-3 p-3 bg-red-100 border border-red-400 rounded text-red-700 text-sm flex items-center gap-2">
              <X size={16} />
              {loginError}
            </div>
          )}
        </form>
      </div>
    );
  }

  const pendingProofs = proofs.filter(p => p.status === 'pending');

  return (
    <div className="osrs-border-dashed rounded-lg p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Shield className="text-osrs-gold" size={24} />
          <h2 className="text-2xl font-bold text-osrs-brown">Admin Panel</h2>
          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">Logged in</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={handleUndo} 
            disabled={loading}
            className="btn-osrs rounded text-sm flex items-center gap-1"
          >
            <Undo2 size={16} />
            Fortryd
          </button>
          <button 
            onClick={() => setShowScheduler(true)}
            className="btn-osrs rounded text-sm flex items-center gap-1"
          >
            <Calendar size={16} />
            Event Timer
          </button>
          <button onClick={logout} className="btn-osrs rounded text-sm">
            Log ud
          </button>
        </div>
      </div>

      {/* Manual Tile Assignment */}
      <div className="mb-8">
        <h3 className="font-semibold text-osrs-brown mb-3 flex items-center gap-2">
          <Crown size={18} />
          Manuel Tildeling af Felter
        </h3>
        <p className="text-sm text-osrs-border mb-3">
          Klik på et felt for at tildele det til et hold manuelt
        </p>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-64 overflow-y-auto">
          {tiles.map(tile => (
            <button
              key={tile.id}
              onClick={() => setShowAssignModal(tile)}
              className="p-2 bg-white bg-opacity-50 rounded text-center hover:bg-opacity-70 transition-colors"
            >
              {tile.image_url && (
                <img src={tile.image_url} alt="" className="w-8 h-8 mx-auto mb-1 object-contain" />
              )}
              <span className="text-xs text-osrs-brown block truncate">{tile.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pending Proofs */}
      <div>
        <h3 className="font-semibold text-osrs-brown mb-3 flex items-center gap-2">
          <Image size={18} />
          Afventende Beviser ({pendingProofs.length})
        </h3>
        
        {pendingProofs.length === 0 ? (
          <p className="text-osrs-border text-sm">Ingen afventende beviser</p>
        ) : (
          <div className="space-y-4">
            {pendingProofs.map(proof => (
              <div key={proof.id} className="bg-white bg-opacity-50 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  {proof.image_url && (
                    <a href={proof.image_url} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={proof.image_url} 
                        alt="Proof" 
                        className="w-32 h-32 object-cover rounded border-2 border-osrs-border"
                      />
                    </a>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: proof.team_color }}
                      />
                      <span className="font-semibold text-osrs-brown">{proof.team_name}</span>
                      <span className="text-osrs-border">→</span>
                      <span className="text-osrs-brown">{proof.tile_name}</span>
                      {proof.count > 1 && (
                        <span className="bg-osrs-gold text-osrs-brown px-2 py-0.5 rounded text-xs font-bold">
                          +{proof.count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-osrs-brown mb-2">
                      Fra: {proof.player_name} {proof.count > 1 ? `(${proof.count} stk)` : ''}
                    </p>
                    {proof.message && (
                      <p className="text-sm text-osrs-border bg-white bg-opacity-50 p-2 rounded">
                        {proof.message}
                      </p>
                    )}
                    <p className="text-xs text-osrs-border mt-2">
                      {new Date(proof.created_at).toLocaleString('da-DK')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleProof(proof.id, 'approved')}
                      disabled={loading}
                      className="btn-osrs rounded p-2 bg-green-600 hover:bg-green-700"
                      title="Godkend"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => handleProof(proof.id, 'rejected')}
                      disabled={loading}
                      className="btn-osrs btn-osrs-danger rounded p-2"
                      title="Afvis"
                    >
                      <X size={18} />
                    </button>
                    <button
                      onClick={() => deleteProof(proof.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                      title="Slet"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Proofs History */}
      {proofs.filter(p => p.status !== 'pending').length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-osrs-brown mb-3">
            Bevis Historik
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {proofs.filter(p => p.status !== 'pending').map(proof => (
              <div 
                key={proof.id} 
                className={`flex items-center gap-3 p-2 rounded text-sm ${
                  proof.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                <span className={proof.status === 'approved' ? 'text-green-600' : 'text-red-600'}>
                  {proof.status === 'approved' ? '✓' : '✗'}
                </span>
                <span>{proof.team_name}</span>
                <span className="text-gray-500">→</span>
                <span>{proof.tile_name}</span>
                <span className="text-gray-500 ml-auto text-xs">
                  {new Date(proof.created_at).toLocaleDateString('da-DK')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(null)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-osrs-brown mb-4">
              Tildel "{showAssignModal.name}" til hold
            </h3>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="input-osrs w-full rounded mb-4"
            >
              <option value="">Vælg hold...</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowAssignModal(null)}
                className="btn-osrs rounded"
              >
                Annuller
              </button>
              <button
                onClick={() => assignTile(showAssignModal.id)}
                disabled={!selectedTeam || loading}
                className="btn-osrs rounded"
              >
                Tildel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scheduler Modal */}
      {showScheduler && (
        <div className="modal-overlay" onClick={() => setShowScheduler(false)}>
          <div className="modal-content p-6 max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-osrs-brown mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Event Timer
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-osrs-brown text-sm font-semibold mb-2">
                  <Clock size={14} className="inline mr-1" />
                  Event Start
                </label>
                <input
                  type="datetime-local"
                  value={eventStart}
                  onChange={(e) => setEventStart(e.target.value)}
                  className="input-osrs w-full rounded"
                />
              </div>
              
              <div>
                <label className="block text-osrs-brown text-sm font-semibold mb-2">
                  <Clock size={14} className="inline mr-1" />
                  Event Slut
                </label>
                <input
                  type="datetime-local"
                  value={eventEnd}
                  onChange={(e) => setEventEnd(e.target.value)}
                  className="input-osrs w-full rounded"
                />
              </div>

              <div className="text-xs text-osrs-border">
                Timeren vises på Statistik-siden og i headeren når sat.
              </div>
            </div>
            
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setEventStart('');
                  setEventEnd('');
                }}
                className="btn-osrs rounded text-sm"
              >
                Ryd
              </button>
              <button
                onClick={() => setShowScheduler(false)}
                className="btn-osrs rounded"
              >
                Annuller
              </button>
              <button
                onClick={saveSchedule}
                disabled={loading}
                className="btn-osrs rounded"
              >
                {loading ? 'Gemmer...' : 'Gem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
