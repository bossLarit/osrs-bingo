import { useState, useEffect } from 'react';
import { Users, ChevronDown, Check } from 'lucide-react';

function TeamSelector({ teams, selectedTeamId, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.team-selector')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="team-selector relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-osrs-border bg-osrs-light hover:bg-osrs-gold hover:bg-opacity-20 transition-colors"
      >
        {selectedTeam ? (
          <>
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: selectedTeam.color }}
            />
            <span className="text-osrs-brown font-medium text-sm max-w-[100px] truncate">
              {selectedTeam.name}
            </span>
          </>
        ) : (
          <>
            <Users size={16} className="text-osrs-border" />
            <span className="text-osrs-border text-sm">Vælg hold</span>
          </>
        )}
        <ChevronDown size={14} className={`text-osrs-border transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-[#f5e6c8] border-2 border-[#5c4a32] rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-osrs-border bg-osrs-dark bg-opacity-5">
            <span className="text-xs text-osrs-border font-semibold uppercase">Dit hold</span>
          </div>
          {teams.length === 0 ? (
            <div className="p-3 text-sm text-osrs-border text-center">
              Ingen hold oprettet
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => {
                    onSelect(team.id);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-osrs-gold hover:bg-opacity-20 transition-colors"
                >
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="text-osrs-brown text-sm flex-1 text-left truncate">
                    {team.name}
                  </span>
                  {selectedTeamId === team.id && (
                    <Check size={14} className="text-green-600" />
                  )}
                </button>
              ))}
            </div>
          )}
          {selectedTeamId && (
            <div className="p-2 border-t border-osrs-border">
              <button
                onClick={() => {
                  onSelect(null);
                  setIsOpen(false);
                }}
                className="w-full text-xs text-osrs-border hover:text-red-600 transition-colors"
              >
                Fjern valg
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TeamSelector;
