import { useState, useEffect } from 'react';
import { Send, MessageSquare, Clock, Check, X } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { apiUrl } from '../api';
import { useDialog } from './Dialog';

function ProofSubmit({ tiles = [], teams = [], onUpdate }) {
  // Ensure arrays
  const safeTiles = Array.isArray(tiles) ? tiles : [];
  const safeTeams = Array.isArray(teams) ? teams : [];
  
  const dialog = useDialog();
  const [proofs, setProofs] = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [formData, setFormData] = useState({
    tile_id: '',
    team_id: '',
    image_url: '',
    message: '',
    player_name: '',
    count: 1
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProofs();
  }, []);

  const fetchProofs = async () => {
    try {
      const res = await fetch(apiUrl('/api/proofs'));
      const data = await res.json();
      setProofs(data);
    } catch (error) {
      console.error('Error fetching proofs:', error);
    }
  };

  const submitProof = async (e) => {
    e.preventDefault();
    if (!formData.tile_id || !formData.team_id) {
      await dialog.alert('Vælg venligst et felt og et hold', { title: 'Manglende information' });
      return;
    }
    
    setLoading(true);
    try {
      await fetch(apiUrl('/api/proofs'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tile_id: parseInt(formData.tile_id),
          team_id: parseInt(formData.team_id),
          image_url: formData.image_url,
          message: formData.message,
          player_name: formData.player_name || 'Anonym',
          count: formData.count || 1
        })
      });
      
      setFormData({
        tile_id: '',
        team_id: '',
        image_url: '',
        message: '',
        player_name: '',
        count: 1
      });
      setShowSubmitModal(false);
      fetchProofs();
      await dialog.success('Bevis indsendt! Admin vil gennemgå det.');
    } catch (error) {
      console.error('Error submitting proof:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="flex items-center gap-1 text-yellow-600"><Clock size={14} /> Afventer</span>;
      case 'approved':
        return <span className="flex items-center gap-1 text-green-600"><Check size={14} /> Godkendt</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 text-red-600"><X size={14} /> Afvist</span>;
      default:
        return null;
    }
  };

  return (
    <div className="osrs-border-dashed rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-osrs-gold" size={24} />
          <h2 className="text-2xl font-bold text-osrs-brown">Beviser & Chat</h2>
        </div>
        <button
          onClick={() => setShowSubmitModal(true)}
          className="btn-osrs flex items-center gap-2 rounded"
        >
          <Send size={18} />
          Indsend Bevis
        </button>
      </div>

      <p className="text-sm text-osrs-border mb-6">
        Del screenshots og beviser for at claime felter. F.eks. longest drystreak, drops, etc.
        <br />
        Admin vil gennemgå og godkende beviser.
      </p>

      {/* Proofs Feed */}
      <div className="space-y-4">
        {proofs.length === 0 ? (
          <p className="text-center text-osrs-border py-8">
            Ingen beviser indsendt endnu. Vær den første!
          </p>
        ) : (
          proofs.map(proof => (
            <div key={proof.id} className="bg-white bg-opacity-50 rounded-lg p-4">
              <div className="flex items-start gap-4">
                {/* Team indicator */}
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ backgroundColor: proof.team_color || '#666' }}
                >
                  {proof.team_name?.charAt(0) || '?'}
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-semibold text-osrs-brown">{proof.player_name}</span>
                    <span className="text-osrs-border text-sm">fra</span>
                    <span 
                      className="font-semibold px-2 py-0.5 rounded text-sm"
                      style={{ backgroundColor: proof.team_color + '33', color: proof.team_color }}
                    >
                      {proof.team_name}
                    </span>
                    <span className="text-osrs-border text-sm">→</span>
                    <span className="text-osrs-brown font-medium">{proof.tile_name}</span>
                    <span className="ml-auto">{getStatusBadge(proof.status)}</span>
                  </div>
                  
                  {/* Message */}
                  {proof.message && (
                    <p className="text-osrs-brown mb-3">{proof.message}</p>
                  )}
                  
                  {/* Image */}
                  {proof.image_url && (
                    <a 
                      href={proof.image_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img 
                        src={proof.image_url} 
                        alt="Proof" 
                        className="max-w-full max-h-64 rounded border-2 border-osrs-border hover:border-osrs-gold transition-colors"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </a>
                  )}
                  
                  {/* Timestamp */}
                  <p className="text-xs text-osrs-border mt-2">
                    {new Date(proof.created_at).toLocaleString('da-DK')}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-osrs-brown mb-4">
              Indsend Bevis
            </h3>
            <form onSubmit={submitProof}>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-osrs-brown mb-1 text-sm">Vælg Felt *</label>
                  <select
                    value={formData.tile_id}
                    onChange={(e) => setFormData({ ...formData, tile_id: e.target.value })}
                    className="input-osrs w-full rounded"
                    required
                  >
                    <option value="">Vælg felt...</option>
                    {safeTiles.map(tile => (
                      <option key={tile.id} value={tile.id}>{tile.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-osrs-brown mb-1 text-sm">Vælg Hold *</label>
                  <select
                    value={formData.team_id}
                    onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                    className="input-osrs w-full rounded"
                    required
                  >
                    <option value="">Vælg hold...</option>
                    {safeTeams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-osrs-brown mb-1 text-sm">Dit Navn</label>
                  <input
                    type="text"
                    value={formData.player_name}
                    onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
                    className="input-osrs w-full rounded"
                    placeholder="Dit OSRS navn"
                  />
                </div>
                <div>
                  <label className="block text-osrs-brown mb-1 text-sm">Antal (for collection felter)</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, count: Math.max(1, formData.count - 1) })}
                      className="btn-osrs rounded px-3 py-1"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={formData.count}
                      onChange={(e) => setFormData({ ...formData, count: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="input-osrs w-16 rounded text-center"
                      min={1}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, count: formData.count + 1 })}
                      className="btn-osrs rounded px-3 py-1"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-osrs-border mt-1">
                    F.eks. 2 Barrows pieces i ét drop
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <ImageUpload 
                  currentUrl={formData.image_url}
                  onImageUrl={(url) => setFormData({ ...formData, image_url: url })}
                />
              </div>

              <div className="mb-6">
                <label className="block text-osrs-brown mb-1 text-sm">Besked</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="input-osrs w-full rounded"
                  rows={3}
                  placeholder="F.eks. '500 KC dry på pet!' eller 'Første ToA completion'"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="btn-osrs rounded"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-osrs rounded"
                >
                  {loading ? 'Indsender...' : 'Indsend Bevis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProofSubmit;
