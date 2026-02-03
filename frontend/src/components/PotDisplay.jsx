import { useState, useEffect } from 'react';
import { Coins, Gift } from 'lucide-react';
import { apiUrl } from '../api';

function PotDisplay() {
  const [pot, setPot] = useState({ value: 0, donor: 'Anonym' });
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    fetchPot();
  }, []);

  const fetchPot = async () => {
    try {
      const res = await fetch(apiUrl('/api/pot'));
      const data = await res.json();
      setPot(data);
    } catch (error) {
      console.error('Error fetching pot:', error);
    }
  };

  const formatGP = (value) => {
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(1) + 'B';
    }
    if (value >= 1000000) {
      return (value / 1000000).toFixed(0) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'K';
    }
    return value.toString();
  };

  if (!pot.value) return null;

  return (
    <div 
      className={`bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 rounded-lg p-4 shadow-lg border-2 border-yellow-700 ${isAnimating ? 'animate-pulse' : ''}`}
      onMouseEnter={() => setIsAnimating(true)}
      onMouseLeave={() => setIsAnimating(false)}
    >
      <div className="flex items-center justify-center gap-3">
        <Coins className="text-yellow-900" size={28} />
        <div className="text-center">
          <div className="text-xs text-yellow-900 font-medium uppercase tracking-wide">
            Præmiepulje
          </div>
          <div className="text-2xl font-bold text-yellow-900 flex items-center gap-1">
            <span className="text-3xl">{formatGP(pot.value)}</span>
            <span className="text-lg">GP</span>
          </div>
        </div>
        <Coins className="text-yellow-900" size={28} />
      </div>
      {pot.donor && pot.donor !== 'Anonym' && (
        <div className="text-center mt-2 text-xs text-yellow-800 flex items-center justify-center gap-1">
          <Gift size={12} />
          <span>Doneret af: <strong>{pot.donor}</strong></span>
        </div>
      )}
    </div>
  );
}

export default PotDisplay;
