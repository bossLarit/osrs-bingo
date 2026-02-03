import { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, Users, Settings, RefreshCw, MessageSquare, Shield, BookOpen, HelpCircle, BarChart3, Moon, Sun, Volume2, VolumeX, Share2 } from 'lucide-react';
import Scoreboard from './components/Scoreboard';
import BingoBoard from './components/BingoBoard';
import TeamManager from './components/TeamManager';
import TileManager from './components/TileManager';
import ProofSubmit from './components/ProofSubmit';
import AdminPanel from './components/AdminPanel';
import LiveFeed from './components/LiveFeed';
import Rules from './components/Rules';
import Guide from './components/Guide';
import Fireworks, { useFireworks } from './components/Fireworks';
import Stats from './components/Stats';
import TeamChat from './components/TeamChat';
import PotDisplay from './components/PotDisplay';
import BingoTimer from './components/BingoTimer';
import TeamSelector from './components/TeamSelector';
import WelcomeModal from './components/WelcomeModal';
import { apiUrl } from './api';

function App() {
  const [activeTab, setActiveTab] = useState('bingo');
  const [teams, setTeams] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('soundEnabled') !== 'false');
  const [selectedTeamId, setSelectedTeamId] = useState(() => {
    const saved = localStorage.getItem('myTeamId');
    return saved ? parseInt(saved) : null;
  });
  const [selectedPlayer, setSelectedPlayer] = useState(() => {
    const saved = localStorage.getItem('myPlayer');
    return saved ? JSON.parse(saved) : null;
  });
  const [showWelcome, setShowWelcome] = useState(() => {
    const saved = localStorage.getItem('myPlayer');
    return !saved;
  });

  const handleTeamSelect = (teamId) => {
    setSelectedTeamId(teamId);
    if (teamId) {
      localStorage.setItem('myTeamId', teamId.toString());
    } else {
      localStorage.removeItem('myTeamId');
    }
  };

  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
    if (player) {
      localStorage.setItem('myPlayer', JSON.stringify(player));
      setShowWelcome(false);
    } else {
      localStorage.removeItem('myPlayer');
    }
  };

  const handleWelcomeSelect = (player, teamId) => {
    handlePlayerSelect(player);
    handleTeamSelect(teamId);
    setShowWelcome(false);
  };
  
  // Fireworks state
  const { fireworksState, celebrate } = useFireworks();
  const prevScoresRef = useRef({});
  const prevProgressRef = useRef([]);
  
  // Sound effects
  const playSound = useCallback((type) => {
    if (!soundEnabled) return;
    const sounds = {
      levelup: 'https://oldschool.runescape.wiki/images/Level_up_jingle.ogg',
      complete: 'https://oldschool.runescape.wiki/images/Quest_complete_jingle.ogg',
    };
    if (sounds[type]) {
      const audio = new Audio(sounds[type]);
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }
  }, [soundEnabled]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', (!darkMode).toString());
  };

  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    localStorage.setItem('soundEnabled', (!soundEnabled).toString());
  };

  const fetchData = async () => {
    try {
      const [teamsRes, tilesRes, progressRes] = await Promise.all([
        fetch(apiUrl('/api/teams')),
        fetch(apiUrl('/api/tiles')),
        fetch(apiUrl('/api/progress'))
      ]);
      
      const teamsData = await teamsRes.json();
      const tilesData = await tilesRes.json();
      const progressData = await progressRes.json();
      
      // Ensure arrays (API might return error objects)
      setTeams(Array.isArray(teamsData) ? teamsData : []);
      setTiles(Array.isArray(tilesData) ? tilesData : []);
      setProgress(Array.isArray(progressData) ? progressData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate team scores
  const calculateScores = useCallback((teamsData, progressData, tilesData) => {
    const scores = {};
    teamsData.forEach(team => {
      const teamProgress = progressData.filter(p => p.team_id === team.id && p.completed);
      const points = teamProgress.reduce((sum, p) => {
        const tile = tilesData.find(t => t.id === p.tile_id);
        return sum + (tile?.points || 0);
      }, 0);
      scores[team.id] = { points, name: team.name, color: team.color };
    });
    return scores;
  }, []);

  // Check for celebrations (overtakes and new completions)
  useEffect(() => {
    if (loading || teams.length === 0) return;

    const currentScores = calculateScores(teams, progress, tiles);
    const prevScores = prevScoresRef.current;

    // Check for rank changes (overtakes)
    const currentRanking = Object.entries(currentScores)
      .sort((a, b) => b[1].points - a[1].points)
      .map(([id]) => id);
    
    const prevRanking = Object.entries(prevScores)
      .sort((a, b) => b[1].points - a[1].points)
      .map(([id]) => id);

    if (prevRanking.length > 0 && currentRanking.length > 0) {
      // Check if #1 position changed
      if (currentRanking[0] !== prevRanking[0] && currentScores[currentRanking[0]]?.points > 0) {
        const leader = currentScores[currentRanking[0]];
        celebrate('NY FØRSTEPLADS!', leader.name, leader.color);
      }
    }

    // Check for new tile completions
    const prevProgress = prevProgressRef.current;
    const newCompletions = progress.filter(p => 
      p.completed && !prevProgress.find(pp => pp.tile_id === p.tile_id && pp.team_id === p.team_id && pp.completed)
    );

    if (newCompletions.length > 0 && prevProgress.length > 0) {
      const completion = newCompletions[0];
      const team = teams.find(t => t.id === completion.team_id);
      const tile = tiles.find(t => t.id === completion.tile_id);
      if (team && tile) {
        celebrate(`${tile.name} FULDFØRT!`, team.name, team.color);
        playSound('complete');
      }
    }

    // Store current state for next comparison
    prevScoresRef.current = currentScores;
    prevProgressRef.current = [...progress];
  }, [teams, progress, tiles, loading, calculateScores, celebrate, playSound]);

  const syncWithWOM = async () => {
    setSyncing(true);
    try {
      // Sync player data from WOM
      const syncRes = await fetch(apiUrl('/api/sync'), { method: 'POST' });
      
      if (syncRes.status === 429) {
        const data = await syncRes.json();
        alert(data.error || 'Sync er på cooldown. Prøv igen senere.');
        return;
      }
      
      // Calculate and update progress based on XP/KC gains
      await fetch(apiUrl('/api/sync/progress'), { method: 'POST' });
      await fetchData();
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setSyncing(false);
    }
  };

  const tabs = [
    { id: 'bingo', label: 'Bingo Board', icon: Trophy },
    { id: 'teams', label: 'Hold', icon: Users },
    { id: 'tiles', label: 'Felter', icon: Settings },
    { id: 'proofs', label: 'Beviser', icon: MessageSquare },
    { id: 'stats', label: 'Statistik', icon: BarChart3 },
    { id: 'rules', label: 'Regler', icon: BookOpen },
    { id: 'guide', label: 'Guide', icon: HelpCircle },
    { id: 'admin', label: 'Admin', icon: Shield },
  ];

  // Share board as image
  const shareBoard = async () => {
    try {
      const boardElement = document.querySelector('.bingo-board-container');
      if (!boardElement) {
        alert('Gå til Bingo Board fanen først');
        return;
      }
      // Use html2canvas if available, otherwise just copy URL
      await navigator.clipboard.writeText(window.location.href);
      alert('Link kopieret til udklipsholder!');
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-osrs-brown text-xl animate-pulse-slow">Indlæser...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 md:p-8 transition-colors ${darkMode ? 'dark-mode' : ''}`}>
      {/* Top Right Utility Buttons */}
      <div className="fixed top-4 right-4 flex items-center gap-1 z-50">
        <button
          onClick={toggleDarkMode}
          className="btn-osrs p-2 rounded"
          title={darkMode ? 'Lys tilstand' : 'Mørk tilstand'}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          onClick={toggleSound}
          className="btn-osrs p-2 rounded"
          title={soundEnabled ? 'Slå lyd fra' : 'Slå lyd til'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
        <button
          onClick={shareBoard}
          className="btn-osrs p-2 rounded"
          title="Del bingo board"
        >
          <Share2 size={16} />
        </button>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-osrs-brown mb-2 drop-shadow-lg">
            🎲 OSRS Bingo
          </h1>
          <p className="text-osrs-border text-lg mb-4">Battle Royale Bingo Card</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
            <BingoTimer onBingoStart={fetchData} />
            <TeamSelector 
              teams={teams} 
              selectedTeamId={selectedTeamId} 
              onSelect={handleTeamSelect}
              selectedPlayer={selectedPlayer}
              onPlayerSelect={handlePlayerSelect}
            />
            <PotDisplay />
          </div>
        </header>

        {/* Navigation */}
        <nav className="flex justify-center items-center gap-1 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn-osrs flex items-center gap-1 px-2 py-1.5 rounded text-sm ${
                activeTab === tab.id ? 'ring-2 ring-osrs-gold' : ''
              }`}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
          <button
            onClick={syncWithWOM}
            disabled={syncing}
            className="btn-osrs flex items-center gap-1 px-2 py-1.5 rounded text-sm"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            <span className="hidden md:inline">{syncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </nav>

        {/* Main Content */}
        <main className="flex flex-col lg:flex-row gap-6">
          {/* Scoreboard - always visible */}
          <aside className="lg:w-80 flex-shrink-0">
            <Scoreboard teams={teams} progress={progress} tiles={tiles} />
          </aside>

          {/* Content Area */}
          <div className="flex-1">
            {activeTab === 'bingo' && (
              <>
                <BingoBoard 
                  tiles={tiles} 
                  teams={teams} 
                  progress={progress}
                  onRefresh={fetchData}
                  selectedTeamId={selectedTeamId}
                />
                <LiveFeed />
              </>
            )}
            {activeTab === 'teams' && (
              <TeamManager 
                teams={teams} 
                onUpdate={fetchData}
              />
            )}
            {activeTab === 'tiles' && (
              <TileManager 
                tiles={tiles} 
                teams={teams}
                onUpdate={fetchData}
              />
            )}
            {activeTab === 'proofs' && (
              <ProofSubmit 
                tiles={tiles} 
                teams={teams}
                onUpdate={fetchData}
              />
            )}
            {activeTab === 'admin' && (
              <AdminPanel 
                tiles={tiles} 
                teams={teams}
                onUpdate={fetchData}
              />
            )}
            {activeTab === 'stats' && (
              <Stats 
                teams={teams}
                tiles={tiles}
                progress={progress}
              />
            )}
            {activeTab === 'rules' && (
              <Rules />
            )}
            {activeTab === 'guide' && (
              <Guide />
            )}
          </div>
        </main>
      </div>

      {/* Team Chat */}
      <TeamChat teams={teams} />

      {/* Fireworks celebration */}
      <Fireworks
        trigger={fireworksState.trigger}
        teamColor={fireworksState.teamColor}
        teamName={fireworksState.teamName}
        message={fireworksState.message}
      />

      {/* Welcome Modal */}
      {showWelcome && !loading && (
        <WelcomeModal
          teams={teams}
          onPlayerSelect={handleWelcomeSelect}
          onClose={() => setShowWelcome(false)}
        />
      )}
    </div>
  );
}

export default App;
