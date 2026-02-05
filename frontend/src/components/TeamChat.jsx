import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { apiUrl } from '../api';

function TeamChat({ teams }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('chatPlayerName') || '');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (selectedTeam && isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedTeam, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    if (!selectedTeam) return;
    try {
      const res = await fetch(apiUrl(`/api/chat/${selectedTeam.id}`));
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !playerName.trim() || !selectedTeam) return;

    setLoading(true);
    try {
      localStorage.setItem('chatPlayerName', playerName);
      await fetch(apiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: selectedTeam.id,
          player_name: playerName,
          message: newMessage
        })
      });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('da-DK', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 btn-osrs p-4 rounded-full shadow-lg z-40"
        title="Team Chat"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-osrs-light border-4 border-osrs-border rounded-lg shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b-2 border-osrs-border bg-osrs-dark bg-opacity-20">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-osrs-gold" />
          <span className="font-bold text-osrs-brown">Team Chat</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-osrs-brown hover:text-red-500">
          <X size={18} />
        </button>
      </div>

      {!selectedTeam ? (
        <div className="flex-1 p-4 overflow-y-auto">
          <p className="text-sm text-osrs-border mb-3">Vælg dit hold:</p>
          <div className="space-y-2">
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className="w-full p-3 rounded flex items-center gap-3 hover:bg-osrs-dark hover:bg-opacity-10 transition-colors"
                style={{ borderLeft: `4px solid ${team.color}` }}
              >
                {team.logo_url && (
                  <img src={team.logo_url} alt="" className="w-8 h-8 rounded object-cover" />
                )}
                <span className="font-medium text-osrs-brown">{team.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Team Header */}
          <div 
            className="p-2 flex items-center gap-2 cursor-pointer hover:bg-osrs-dark hover:bg-opacity-10"
            onClick={() => setSelectedTeam(null)}
            style={{ borderLeft: `4px solid ${selectedTeam.color}` }}
          >
            <span className="text-sm text-osrs-brown">← {selectedTeam.name}</span>
          </div>

          {/* Player Name Input */}
          {!playerName && (
            <div className="p-2 border-b border-osrs-border">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Dit spillernavn..."
                className="input-osrs w-full text-sm rounded"
              />
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 ? (
              <p className="text-center text-osrs-border text-sm">Ingen beskeder endnu</p>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="text-sm">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-osrs-brown">{msg.player_name}</span>
                    <span className="text-xs text-osrs-border">{formatTime(msg.timestamp)}</span>
                  </div>
                  <p className="text-osrs-dark dark:text-osrs-light break-words">{msg.message}</p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-2 border-t-2 border-osrs-border flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Skriv besked..."
              className="input-osrs flex-1 text-sm rounded"
              disabled={!playerName || loading}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !playerName || loading}
              className="btn-osrs p-2 rounded disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default TeamChat;
