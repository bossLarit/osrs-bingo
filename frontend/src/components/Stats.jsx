import { useState, useEffect } from 'react';
import { BarChart3, Trophy, Award, Star, TrendingUp, Download, Clock } from 'lucide-react';
import { apiUrl } from '../api';

function Stats({ teams = [], tiles = [], progress = [] }) {
  const [history, setHistory] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [mvps, setMvps] = useState([]);
  const [config, setConfig] = useState({});
  
  // Ensure props are arrays
  const safeTeams = Array.isArray(teams) ? teams : [];
  const safeTiles = Array.isArray(tiles) ? tiles : [];
  const safeProgress = Array.isArray(progress) ? progress : [];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [historyRes, achievementsRes, mvpRes, configRes] = await Promise.all([
        fetch(apiUrl('/api/history')),
        fetch(apiUrl('/api/achievements')),
        fetch(apiUrl('/api/mvp')),
        fetch(apiUrl('/api/config'))
      ]);
      
      const historyData = await historyRes.json();
      const achievementsData = await achievementsRes.json();
      const mvpData = await mvpRes.json();
      const configData = await configRes.json();
      
      setHistory(Array.isArray(historyData) ? historyData : []);
      setAchievements(Array.isArray(achievementsData) ? achievementsData : []);
      setMvps(Array.isArray(mvpData) ? mvpData : []);
      setConfig(configData || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const exportData = async () => {
    try {
      const res = await fetch(apiUrl('/api/export'));
      const data = await res.json();
      
      // Download as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bingo-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const exportCSV = async () => {
    try {
      const res = await fetch(apiUrl('/api/export'));
      const data = await res.json();
      
      // Convert to CSV
      let csv = 'Hold,Spillere,Fuldførte Felter,Total Points\n';
      data.teams.forEach(t => {
        csv += `"${t.name}","${t.players.join(', ')}",${t.completed_tiles},${t.total_points}\n`;
      });
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bingo-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  // Calculate current scores
  const teamScores = safeTeams.map(team => {
    const teamProgress = safeProgress.filter(p => p.team_id === team.id && p.completed);
    const points = teamProgress.reduce((sum, p) => {
      const tile = safeTiles.find(t => t.id === p.tile_id);
      return sum + (tile?.points || 0);
    }, 0);
    return { ...team, points, completed: teamProgress.length };
  }).sort((a, b) => b.points - a.points);

  // Simple line chart using SVG
  const renderHistoryChart = () => {
    if (history.length < 2) {
      return (
        <div className="text-center text-osrs-border py-8">
          Ikke nok data til at vise graf endnu
        </div>
      );
    }

    const width = 600;
    const height = 300;
    const padding = 40;
    
    const allPoints = history.flatMap(h => (h.scores || []).map(s => s.points));
    const maxPoints = Math.max(...allPoints, 1);
    
    const xScale = (i) => padding + (i / (history.length - 1)) * (width - 2 * padding);
    const yScale = (val) => height - padding - (val / maxPoints) * (height - 2 * padding);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-2xl mx-auto">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
          <g key={ratio}>
            <line
              x1={padding}
              y1={yScale(maxPoints * ratio)}
              x2={width - padding}
              y2={yScale(maxPoints * ratio)}
              stroke="#ddd"
              strokeDasharray="4"
            />
            <text
              x={padding - 5}
              y={yScale(maxPoints * ratio)}
              textAnchor="end"
              fontSize="10"
              fill="#666"
            >
              {Math.round(maxPoints * ratio)}
            </text>
          </g>
        ))}

        {/* Lines for each team */}
        {safeTeams.map(team => {
          const points = history.map((h, i) => {
            const score = (h.scores || []).find(s => s.team_id === team.id);
            return { x: xScale(i), y: yScale(score?.points || 0) };
          });
          
          const pathData = points.map((p, i) => 
            `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
          ).join(' ');

          return (
            <g key={team.id}>
              <path
                d={pathData}
                fill="none"
                stroke={team.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* End point dot */}
              {points.length > 0 && (
                <circle
                  cx={points[points.length - 1].x}
                  cy={points[points.length - 1].y}
                  r="5"
                  fill={team.color}
                />
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="osrs-border-dashed rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-osrs-gold" size={24} />
          <h2 className="text-2xl font-bold text-osrs-brown">Statistik</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-osrs flex items-center gap-2 rounded text-sm">
            <Download size={16} />
            Export CSV
          </button>
          <button onClick={exportData} className="btn-osrs flex items-center gap-2 rounded text-sm">
            <Download size={16} />
            Export JSON
          </button>
        </div>
      </div>

      {/* Event Timer */}
      {(config.event_start || config.event_end) && (
        <div className="bg-osrs-gold bg-opacity-10 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-osrs-gold" />
            <h3 className="font-bold text-osrs-brown">Event Timer</h3>
          </div>
          <EventTimer start={config.event_start} end={config.event_end} />
        </div>
      )}

      {/* Achievements/Badges */}
      <div className="bg-white bg-opacity-30 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Award size={18} className="text-osrs-gold" />
          <h3 className="font-bold text-osrs-brown">Achievements</h3>
        </div>
        
        {achievements.length === 0 ? (
          <p className="text-osrs-border text-sm">Ingen achievements endnu</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {achievements.map(a => (
              <div 
                key={a.id}
                className="p-3 rounded-lg text-center"
                style={{ backgroundColor: a.team_color + '22', borderColor: a.team_color, borderWidth: 2 }}
              >
                <div className="text-3xl mb-1">{a.icon}</div>
                <div className="font-bold text-osrs-brown text-sm">{a.name}</div>
                <div className="text-xs text-osrs-border">{a.description}</div>
                <div className="text-xs mt-1 font-semibold" style={{ color: a.team_color }}>
                  {a.team_name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MVP per Team */}
      <div className="bg-white bg-opacity-30 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Star size={18} className="text-osrs-gold" />
          <h3 className="font-bold text-osrs-brown">Team MVPs</h3>
        </div>
        
        {mvps.length === 0 ? (
          <p className="text-osrs-border text-sm">Ingen MVPs endnu - indsend beviser for at optjene MVP!</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {mvps.map(mvp => (
              <div 
                key={mvp.team_id}
                className="p-3 rounded-lg flex items-center gap-3"
                style={{ backgroundColor: mvp.team_color + '22' }}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: mvp.team_color }}
                >
                  ⭐
                </div>
                <div>
                  <div className="font-bold text-osrs-brown">{mvp.player_name}</div>
                  <div className="text-xs text-osrs-border">
                    {mvp.team_name} • {mvp.contributions} bidrag
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Score History Graph */}
      <div className="bg-white bg-opacity-30 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-osrs-gold" />
          <h3 className="font-bold text-osrs-brown">Point Historie</h3>
        </div>
        
        {renderHistoryChart()}
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {safeTeams.map(team => (
            <div key={team.id} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: team.color }}
              />
              <span className="text-sm text-osrs-brown">{team.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Standings */}
      <div className="bg-white bg-opacity-30 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-osrs-gold" />
          <h3 className="font-bold text-osrs-brown">Nuværende Stilling</h3>
        </div>
        
        <div className="space-y-2">
          {teamScores.map((team, index) => (
            <div 
              key={team.id}
              className="flex items-center gap-3 p-3 rounded"
              style={{ backgroundColor: team.color + '22' }}
            >
              <div className="text-2xl font-bold text-osrs-brown w-8">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </div>
              <div 
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: team.color }}
              />
              <div className="flex-1">
                <div className="font-bold text-osrs-brown">{team.name}</div>
                <div className="text-xs text-osrs-border">{team.completed} felter</div>
              </div>
              <div className="text-2xl font-bold text-osrs-brown">
                {team.points} pts
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Event Timer Component
function EventTimer({ start, end }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const startDate = start ? new Date(start) : null;
      const endDate = end ? new Date(end) : null;

      if (startDate && now < startDate) {
        // Event hasn't started
        setStatus('Starter om');
        setTimeLeft(formatTimeLeft(startDate - now));
      } else if (endDate && now < endDate) {
        // Event is active
        setStatus('Slutter om');
        setTimeLeft(formatTimeLeft(endDate - now));
      } else if (endDate && now >= endDate) {
        // Event has ended
        setStatus('Event afsluttet');
        setTimeLeft('');
      } else {
        setStatus('Event aktiv');
        setTimeLeft('');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [start, end]);

  const formatTimeLeft = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}t ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}t ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="text-center">
      <div className="text-osrs-brown font-semibold">{status}</div>
      {timeLeft && (
        <div className="text-3xl font-bold text-osrs-gold">{timeLeft}</div>
      )}
    </div>
  );
}

export default Stats;
