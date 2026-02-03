import { useState, useEffect } from 'react';
import { BookOpen, Edit3, Save, X } from 'lucide-react';

function Rules() {
  const [rules, setRules] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedRules, setEditedRules] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRules();
    checkAdmin();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/rules');
      const data = await res.json();
      setRules(data.rules || '');
      setEditedRules(data.rules || '');
    } catch (error) {
      console.error('Error fetching rules:', error);
    }
  };

  const checkAdmin = () => {
    const adminPassword = localStorage.getItem('adminPassword');
    setIsAdmin(!!adminPassword);
  };

  const saveRules = async () => {
    const adminPassword = localStorage.getItem('adminPassword');
    if (!adminPassword) {
      setError('Du skal være logget ind som admin for at ændre regler');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch('/api/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: editedRules, admin_password: adminPassword })
      });
      
      if (res.ok) {
        setRules(editedRules);
        setIsEditing(false);
        setSuccess('Regler gemt!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Kunne ikke gemme regler');
      }
    } catch (error) {
      setError('Fejl ved gemning af regler');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditedRules(rules);
    setIsEditing(false);
    setError('');
  };

  // Parse rules text to support basic formatting
  const renderRules = (text) => {
    if (!text) {
      return (
        <p className="text-osrs-border italic">
          Ingen regler tilføjet endnu. {isAdmin && 'Klik "Rediger" for at tilføje regler.'}
        </p>
      );
    }

    // Split by double newlines for paragraphs
    const paragraphs = text.split(/\n\n+/);
    
    return paragraphs.map((paragraph, pIdx) => {
      // Check if it's a header (starts with #)
      if (paragraph.startsWith('# ')) {
        return (
          <h2 key={pIdx} className="text-xl font-bold text-osrs-brown mt-4 mb-2">
            {paragraph.substring(2)}
          </h2>
        );
      }
      if (paragraph.startsWith('## ')) {
        return (
          <h3 key={pIdx} className="text-lg font-bold text-osrs-brown mt-3 mb-2">
            {paragraph.substring(3)}
          </h3>
        );
      }

      // Check if it's a list (lines starting with - or *)
      const lines = paragraph.split('\n');
      const isList = lines.every(line => line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim() === '');
      
      if (isList && lines.some(line => line.trim())) {
        return (
          <ul key={pIdx} className="list-disc list-inside space-y-1 mb-3 text-osrs-brown">
            {lines.filter(line => line.trim()).map((line, lIdx) => (
              <li key={lIdx}>{line.replace(/^[-*]\s*/, '')}</li>
            ))}
          </ul>
        );
      }

      // Check if it's a numbered list
      const isNumberedList = lines.every(line => /^\d+\./.test(line.trim()) || line.trim() === '');
      
      if (isNumberedList && lines.some(line => line.trim())) {
        return (
          <ol key={pIdx} className="list-decimal list-inside space-y-1 mb-3 text-osrs-brown">
            {lines.filter(line => line.trim()).map((line, lIdx) => (
              <li key={lIdx}>{line.replace(/^\d+\.\s*/, '')}</li>
            ))}
          </ol>
        );
      }

      // Regular paragraph
      return (
        <p key={pIdx} className="mb-3 text-osrs-brown">
          {paragraph.split('\n').map((line, lIdx) => (
            <span key={lIdx}>
              {line}
              {lIdx < paragraph.split('\n').length - 1 && <br />}
            </span>
          ))}
        </p>
      );
    });
  };

  return (
    <div className="osrs-border-dashed rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookOpen className="text-osrs-gold" size={24} />
          <h2 className="text-2xl font-bold text-osrs-brown">Regler</h2>
        </div>
        
        {isAdmin && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-osrs flex items-center gap-2 rounded"
          >
            <Edit3 size={18} />
            Rediger
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded text-red-700 text-sm flex items-center gap-2">
          <X size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 rounded text-green-700 text-sm">
          {success}
        </div>
      )}

      {isEditing ? (
        <div>
          <div className="mb-3">
            <p className="text-sm text-osrs-border mb-2">
              Tip: Brug # for overskrifter, - for punktlister, og tomme linjer for afsnit
            </p>
            <textarea
              value={editedRules}
              onChange={(e) => setEditedRules(e.target.value)}
              className="input-osrs w-full rounded min-h-[400px] font-mono text-sm"
              placeholder="# Velkommen til OSRS Bingo!

## Generelle Regler
- Alle skal have det sjovt
- Fair play er vigtigt

## Pointsystem
1. Første hold der får bingo vinder
2. Hver tile giver point

## Beviser
- Upload screenshot som bevis
- Admin godkender beviser"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={saveRules}
              disabled={loading}
              className="btn-osrs flex items-center gap-2 rounded"
            >
              <Save size={18} />
              {loading ? 'Gemmer...' : 'Gem Regler'}
            </button>
            <button
              onClick={cancelEdit}
              className="btn-osrs rounded"
            >
              Annuller
            </button>
          </div>
        </div>
      ) : (
        <div className="prose max-w-none">
          {renderRules(rules)}
        </div>
      )}
    </div>
  );
}

export default Rules;
