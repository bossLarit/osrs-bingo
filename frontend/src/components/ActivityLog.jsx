import { useState, useEffect } from 'react';
import { Activity, RefreshCw, Trash2, User, Users, Trophy, CheckCircle, XCircle, Clock } from 'lucide-react';
import { apiUrl } from '../api';

const actionIcons = {
  TEAM_CREATED: Users,
  PLAYER_ADDED: User,
  PLAYER_ASSIGNED: User,
  PLAYER_REMOVED: User,
  PLAYER_DELETED: User,
  PROOF_APPROVED: CheckCircle,
  PROOF_REJECTED: XCircle,
  BINGO_STARTED: Trophy,
  BINGO_RESET: RefreshCw,
};

const actionColors = {
  TEAM_CREATED: 'text-blue-600',
  PLAYER_ADDED: 'text-green-600',
  PLAYER_ASSIGNED: 'text-green-600',
  PLAYER_REMOVED: 'text-orange-600',
  PLAYER_DELETED: 'text-red-600',
  PROOF_APPROVED: 'text-green-600',
  PROOF_REJECTED: 'text-red-600',
  BINGO_STARTED: 'text-purple-600',
  BINGO_RESET: 'text-orange-600',
};

function ActivityLog({ adminPassword }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/admin/logs?limit=100'));
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm('Er du sikker på at du vil slette alle logs?')) return;
    
    try {
      await fetch(apiUrl('/api/admin/logs'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_password: adminPassword })
      });
      setLogs([]);
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Nu';
    if (diffMins < 60) return `${diffMins} min siden`;
    if (diffHours < 24) return `${diffHours} timer siden`;
    if (diffDays < 7) return `${diffDays} dage siden`;
    
    return date.toLocaleDateString('da-DK', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white bg-opacity-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-osrs-brown flex items-center gap-2">
          <Activity size={18} />
          Aktivitetslog
        </h3>
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="btn-osrs p-2 rounded text-sm"
            title="Opdater"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={clearLogs}
            className="btn-osrs btn-osrs-danger p-2 rounded text-sm"
            title="Ryd logs"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-osrs-border">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
          Henter logs...
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-osrs-border">
          <Activity size={24} className="mx-auto mb-2 opacity-50" />
          Ingen aktivitet endnu
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-2">
          {logs.map((log) => {
            const Icon = actionIcons[log.action] || Activity;
            const colorClass = actionColors[log.action] || 'text-gray-600';
            
            return (
              <div 
                key={log.id}
                className="flex items-start gap-3 p-2 bg-white bg-opacity-70 rounded text-sm"
              >
                <div className={`mt-0.5 ${colorClass}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-osrs-brown">{log.details}</p>
                  <div className="flex items-center gap-2 text-xs text-osrs-border mt-0.5">
                    <Clock size={10} />
                    <span>{formatTime(log.timestamp)}</span>
                    {log.actor !== 'System' && (
                      <>
                        <span>•</span>
                        <span>{log.actor}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ActivityLog;
