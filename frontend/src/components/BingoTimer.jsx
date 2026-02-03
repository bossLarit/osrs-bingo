import { useState, useEffect } from 'react';
import { Clock, Play, RotateCcw } from 'lucide-react';

function BingoTimer({ onBingoStart }) {
  const [status, setStatus] = useState({ started: false, event_start: null, event_end: null });
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [durationHours, setDurationHours] = useState(168);
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status.event_end) {
      const updateTimer = () => {
        const now = new Date();
        const end = new Date(status.event_end);
        const diff = end - now;

        if (diff <= 0) {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft({ days, hours, minutes, seconds, expired: false });
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [status.event_end]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/bingo/status');
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching bingo status:', error);
    }
  };

  const startBingo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bingo/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_password: password, duration_hours: durationHours })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Bingo startet! Baseline gemt for ${data.players.filter(p => p.success).length} spillere`);
        setShowStartModal(false);
        setPassword('');
        fetchStatus();
        onBingoStart?.();
      } else {
        alert(data.error || 'Kunne ikke starte bingo');
      }
    } catch (error) {
      console.error('Error starting bingo:', error);
      alert('Fejl ved start af bingo');
    } finally {
      setLoading(false);
    }
  };

  const resetBingo = async () => {
    if (!confirm('Er du sikker på at du vil nulstille bingoen? Alt progress slettes!')) return;
    
    const pwd = prompt('Indtast admin password:');
    if (!pwd) return;

    try {
      const res = await fetch('/api/bingo/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_password: pwd })
      });
      const data = await res.json();
      if (data.success) {
        alert('Bingo nulstillet!');
        fetchStatus();
      } else {
        alert(data.error || 'Kunne ikke nulstille');
      }
    } catch (error) {
      console.error('Error resetting bingo:', error);
    }
  };

  const formatTime = (num) => String(num).padStart(2, '0');

  if (!status.started) {
    return (
      <>
        <button
          onClick={() => setShowStartModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-colors"
        >
          <Play size={20} />
          Start Bingo
        </button>

        {showStartModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowStartModal(false)}>
            <div className="bg-osrs-light border-4 border-osrs-border rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-osrs-brown mb-4 flex items-center gap-2">
                <Play size={20} />
                Start Bingo Event
              </h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-osrs-brown text-sm font-semibold mb-2">
                    Varighed (timer)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={durationHours}
                      onChange={(e) => setDurationHours(parseInt(e.target.value) || 1)}
                      className="input-osrs flex-1 rounded"
                      min={1}
                      placeholder="Timer..."
                    />
                    <select
                      onChange={(e) => setDurationHours(parseInt(e.target.value))}
                      className="input-osrs rounded"
                      value=""
                    >
                      <option value="" disabled>Hurtigvalg</option>
                      <option value={24}>1 dag</option>
                      <option value={48}>2 dage</option>
                      <option value={72}>3 dage</option>
                      <option value={168}>1 uge</option>
                      <option value={336}>2 uger</option>
                    </select>
                  </div>
                  <p className="text-xs text-osrs-border mt-1">
                    = {Math.floor(durationHours / 24)} dage og {durationHours % 24} timer
                  </p>
                </div>
                
                <div>
                  <label className="block text-osrs-brown text-sm font-semibold mb-2">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-osrs w-full rounded"
                    placeholder="Indtast password..."
                  />
                </div>

                <div className="bg-yellow-100 p-3 rounded border border-yellow-300">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Dette vil gemme alle spilleres nuværende stats som baseline og starte timeren. Progress beregnes fra dette tidspunkt.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowStartModal(false)}
                  className="btn-osrs rounded"
                >
                  Annuller
                </button>
                <button
                  onClick={startBingo}
                  disabled={loading || !password}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold disabled:opacity-50"
                >
                  {loading ? 'Starter...' : 'Start Bingo'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 rounded-lg px-4 py-2 shadow-lg flex items-center gap-4">
      <Clock size={24} className="text-white" />
      
      {timeLeft && !timeLeft.expired ? (
        <div className="text-white">
          <div className="text-xs uppercase tracking-wide opacity-80">Tid tilbage</div>
          <div className="font-mono text-xl font-bold">
            {timeLeft.days > 0 && <span>{timeLeft.days}d </span>}
            {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
          </div>
        </div>
      ) : (
        <div className="text-white font-bold">
          {timeLeft?.expired ? '⏰ Bingo afsluttet!' : 'Loading...'}
        </div>
      )}

      <button
        onClick={resetBingo}
        className="ml-auto p-1.5 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
        title="Nulstil bingo"
      >
        <RotateCcw size={16} className="text-white" />
      </button>
    </div>
  );
}

export default BingoTimer;
