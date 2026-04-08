import { useEffect, useState } from 'react';
import { Save, FolderOpen, Copy, Trash2, Edit3, LayoutGrid } from 'lucide-react';
import { apiUrl } from '../api';
import { useDialog } from './Dialog';

function BoardsManager({ onUpdate }) {
  const dialog = useDialog();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');

  const fetchBoards = async () => {
    try {
      const res = await fetch(apiUrl('/api/boards'));
      const data = await res.json();
      setBoards(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const saveCurrent = async () => {
    if (!newName.trim()) {
      await dialog.error('Giv boardet et navn først');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/boards'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      });
      if (!res.ok) throw new Error('Kunne ikke gemme');
      setNewName('');
      await dialog.success('Board gemt!');
      fetchBoards();
    } catch (e) {
      await dialog.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBoard = async (board) => {
    const ok = await dialog.confirm(
      `Indlæs "${board.name}"? Dit nuværende board gemmes automatisk som backup først.`,
      { title: 'Indlæs board', confirmText: 'Ja, indlæs' }
    );
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/boards/${board.id}/safe-load`), { method: 'POST' });
      if (!res.ok) throw new Error('Indlæsning fejlede');
      await dialog.success(`"${board.name}" indlæst. Et auto-backup blev gemt.`);
      fetchBoards();
      onUpdate?.();
    } catch (e) {
      await dialog.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const renameBoard = async (board) => {
    const name = await dialog.prompt('Nyt navn:', { title: 'Omdøb board', defaultValue: board.name });
    if (!name) return;
    try {
      await fetch(apiUrl(`/api/boards/${board.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      fetchBoards();
    } catch (e) {
      await dialog.error(e.message);
    }
  };

  const duplicateBoard = async (board) => {
    try {
      await fetch(apiUrl(`/api/boards/${board.id}/duplicate`), { method: 'POST' });
      fetchBoards();
    } catch (e) {
      await dialog.error(e.message);
    }
  };

  const deleteBoard = async (board) => {
    const ok = await dialog.confirm(`Slet "${board.name}"?`, {
      title: 'Slet board',
      confirmText: 'Ja, slet',
      variant: 'error'
    });
    if (!ok) return;
    try {
      await fetch(apiUrl(`/api/boards/${board.id}`), { method: 'DELETE' });
      fetchBoards();
    } catch (e) {
      await dialog.error(e.message);
    }
  };

  return (
    <div className="osrs-border-dashed rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <LayoutGrid className="text-osrs-gold" size={24} />
        <h2 className="text-2xl font-bold text-osrs-brown">Gemte Boards</h2>
      </div>
      <p className="text-osrs-border text-sm mb-4">
        Gem hele dit nuværende board som en skabelon, og indlæs det igen senere. Når du indlæser et board,
        bliver dit nuværende board automatisk gemt som <em>Auto-backup</em> så intet går tabt.
      </p>

      <div className="bg-white bg-opacity-30 rounded p-4 mb-6">
        <label className="block text-osrs-brown text-sm font-semibold mb-2">Gem nuværende board som...</label>
        <div className="flex gap-2 flex-wrap">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="F.eks. Friday Bingo Final"
            className="input-osrs flex-1 rounded min-w-[200px]"
            onKeyDown={(e) => e.key === 'Enter' && saveCurrent()}
          />
          <button
            onClick={saveCurrent}
            disabled={loading || !newName.trim()}
            className="btn-osrs rounded flex items-center gap-2"
          >
            <Save size={16} />
            Gem board
          </button>
        </div>
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-12 text-osrs-border">
          <LayoutGrid size={48} className="mx-auto mb-3 opacity-50" />
          <p>Du har ingen gemte boards endnu.</p>
          <p className="text-sm mt-1">Gem dit nuværende board ovenfor for at komme i gang.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {boards.map((board) => (
            <div key={board.id} className="bg-white bg-opacity-50 rounded-lg p-4 border-2 border-osrs-border">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-osrs-brown truncate">{board.name}</h3>
                  <p className="text-xs text-osrs-border">
                    {(board.tiles?.length || 0)} felter ·{' '}
                    {board.created_at ? new Date(board.created_at).toLocaleDateString('da-DK') : ''}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => loadBoard(board)}
                  disabled={loading}
                  className="btn-osrs rounded text-sm flex items-center gap-1"
                  title="Indlæs (gemmer auto-backup først)"
                >
                  <FolderOpen size={14} />
                  Indlæs
                </button>
                <button
                  onClick={() => renameBoard(board)}
                  className="btn-osrs rounded text-sm flex items-center gap-1"
                  title="Omdøb"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => duplicateBoard(board)}
                  className="btn-osrs rounded text-sm flex items-center gap-1"
                  title="Dupliker"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => deleteBoard(board)}
                  className="btn-osrs btn-osrs-danger rounded text-sm flex items-center gap-1"
                  title="Slet"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BoardsManager;
