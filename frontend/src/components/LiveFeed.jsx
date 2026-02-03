import { useState, useEffect } from 'react';
import { Image, RefreshCw } from 'lucide-react';
import { apiUrl } from '../api';

function LiveFeed() {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchApprovedProofs();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchApprovedProofs, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchApprovedProofs = async () => {
    try {
      const res = await fetch(apiUrl('/api/proofs/approved'));
      const data = await res.json();
      setProofs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching approved proofs:', error);
      setProofs([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="osrs-border-dashed rounded-lg p-4 mt-6">
        <div className="text-center text-osrs-border">Indlæser billeder...</div>
      </div>
    );
  }

  if (proofs.length === 0) {
    return null; // Don't show if no approved proofs
  }

  return (
    <div className="osrs-border-dashed rounded-lg p-4 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-osrs-brown flex items-center gap-2">
          <Image size={20} className="text-osrs-gold" />
          Live Beviser
        </h3>
        <button 
          onClick={fetchApprovedProofs}
          className="text-osrs-border hover:text-osrs-brown transition-colors"
          title="Opdater"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {proofs.map(proof => (
          <div 
            key={proof.id}
            className="relative group cursor-pointer"
            onClick={() => setSelectedImage(proof)}
          >
            {proof.image_url ? (
              <div className="aspect-square bg-osrs-brown bg-opacity-20 rounded overflow-hidden">
                <img 
                  src={proof.image_url} 
                  alt={proof.tile_name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  onError={(e) => {
                    e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-osrs-border text-xs">Billede fejl</div>`;
                  }}
                />
              </div>
            ) : (
              <div className="aspect-square bg-osrs-brown bg-opacity-20 rounded flex items-center justify-center">
                <span className="text-2xl">{proof.count > 1 ? `+${proof.count}` : '✓'}</span>
              </div>
            )}
            
            {/* Overlay with team color */}
            <div 
              className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-xs text-white truncate opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: proof.team_color || '#333' }}
            >
              {proof.team_name}
            </div>

            {/* Count badge */}
            {proof.count > 1 && (
              <div className="absolute top-1 right-1 bg-osrs-gold text-osrs-brown text-xs font-bold px-1.5 py-0.5 rounded">
                +{proof.count}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="max-w-4xl max-h-[90vh] bg-osrs-light rounded-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {selectedImage.image_url && (
              <img 
                src={selectedImage.image_url}
                alt={selectedImage.tile_name}
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-2">
                {selectedImage.team_logo ? (
                  <img 
                    src={selectedImage.team_logo} 
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: selectedImage.team_color }}
                  />
                )}
                <div>
                  <span className="font-bold text-osrs-brown">{selectedImage.player_name}</span>
                  <span className="text-osrs-border mx-2">fra</span>
                  <span 
                    className="font-semibold px-2 py-0.5 rounded"
                    style={{ backgroundColor: selectedImage.team_color + '33', color: selectedImage.team_color }}
                  >
                    {selectedImage.team_name}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm mb-2">
                {selectedImage.tile_image && (
                  <img src={selectedImage.tile_image} alt="" className="w-6 h-6 object-contain" />
                )}
                <span className="text-osrs-brown font-medium">{selectedImage.tile_name}</span>
                {selectedImage.count > 1 && (
                  <span className="bg-osrs-gold text-osrs-brown px-2 py-0.5 rounded text-xs font-bold">
                    +{selectedImage.count}
                  </span>
                )}
              </div>

              {selectedImage.message && (
                <p className="text-osrs-brown bg-white bg-opacity-50 p-2 rounded text-sm">
                  {selectedImage.message}
                </p>
              )}

              <p className="text-xs text-osrs-border mt-2">
                {new Date(selectedImage.created_at).toLocaleString('da-DK')}
              </p>
            </div>
            
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveFeed;
