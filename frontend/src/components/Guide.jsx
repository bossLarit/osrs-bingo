import { useState } from 'react';
import { HelpCircle, ExternalLink, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

function Guide() {
  const [openSections, setOpenSections] = useState({ runelite: true, wom: false, sync: false });
  const [copied, setCopied] = useState('');

  const toggleSection = (section) => {
    setOpenSections({ ...openSections, [section]: !openSections[section] });
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="osrs-border-dashed rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="text-osrs-gold" size={24} />
        <h2 className="text-2xl font-bold text-osrs-brown">Opsætningsguide</h2>
      </div>

      {/* RuneLite Setup Section */}
      <div className="mb-4 bg-white bg-opacity-30 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('runelite')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-white hover:bg-opacity-20"
        >
          <h3 className="text-lg font-bold text-osrs-brown flex items-center gap-2">
            {openSections.runelite ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            1. RuneLite Opsætning
          </h3>
        </button>
        
        {openSections.runelite && (
          <div className="p-4 pt-0 space-y-4">
            <div className="bg-osrs-gold bg-opacity-10 p-3 rounded">
              <p className="text-sm text-osrs-brown">
                <strong>Hvad er Wise Old Man?</strong><br />
                Wise Old Man (WOM) er en gratis tracking service der holder styr på dine OSRS stats, 
                boss kills, achievements og meget mere. Den synkroniserer automatisk når du logger ind i spillet.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-osrs-brown">Trin 1: Download RuneLite</h4>
              <p className="text-sm text-osrs-brown">
                Hvis du ikke allerede har RuneLite, download det fra den officielle hjemmeside:
              </p>
              <a 
                href="https://runelite.net" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
              >
                https://runelite.net <ExternalLink size={14} />
              </a>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-osrs-brown">Trin 2: Installer Wise Old Man Plugin</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-osrs-brown">
                <li>Åbn RuneLite og log ind på din karakter</li>
                <li>Klik på <strong>wrench-ikonet</strong> (⚙️) i højre side for at åbne indstillinger</li>
                <li>Klik på <strong>"Plugin Hub"</strong> knappen i bunden</li>
                <li>Søg efter <strong>"Wise Old Man"</strong></li>
                <li>Klik <strong>"Install"</strong> ved siden af pluginet</li>
              </ol>
              
              <div className="bg-green-100 p-3 rounded border border-green-300">
                <p className="text-sm text-green-800">
                  ✅ Pluginet sender automatisk dine stats til WOM hver gang du logger ind!
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-osrs-brown">Trin 3: Konfigurer Plugin (Valgfrit)</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-osrs-brown">
                <li>Find <strong>"Wise Old Man"</strong> i plugin-listen</li>
                <li>Klik på tandhjulet for at åbne indstillinger</li>
                <li>Du kan tilføje en <strong>Group ID</strong> hvis du vil tracke en gruppe</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* WOM Account Section */}
      <div className="mb-4 bg-white bg-opacity-30 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('wom')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-white hover:bg-opacity-20"
        >
          <h3 className="text-lg font-bold text-osrs-brown flex items-center gap-2">
            {openSections.wom ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            2. Wise Old Man Profil
          </h3>
        </button>
        
        {openSections.wom && (
          <div className="p-4 pt-0 space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-osrs-brown">Find Din Profil</h4>
              <p className="text-sm text-osrs-brown">
                Når du har logget ind i OSRS med RuneLite og WOM-pluginet installeret, 
                vil din profil automatisk blive oprettet på Wise Old Man.
              </p>
              
              <div className="flex gap-2 items-center">
                <span className="text-sm text-osrs-brown">Søg efter din karakter:</span>
                <a 
                  href="https://wiseoldman.net" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                >
                  wiseoldman.net <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-osrs-brown">Find Dit Player ID</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-osrs-brown">
                <li>Gå til <a href="https://wiseoldman.net" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">wiseoldman.net</a></li>
                <li>Søg efter dit OSRS brugernavn</li>
                <li>Klik på din profil</li>
                <li>Dit <strong>Player ID</strong> er i URL'en: wiseoldman.net/players/<strong>123456</strong></li>
              </ol>
              
              <div className="bg-yellow-100 p-3 rounded border border-yellow-300">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Tip:</strong> Du kan også se dit Player ID i API-linket nederst på din profil.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-osrs-brown">Opret en Gruppe (Valgfrit)</h4>
              <p className="text-sm text-osrs-brown">
                Du kan oprette en WOM-gruppe for at tracke alle deltagere samlet:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-osrs-brown">
                <li>Gå til <a href="https://wiseoldman.net/groups" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">wiseoldman.net/groups</a></li>
                <li>Klik <strong>"Create Group"</strong></li>
                <li>Tilføj alle deltagernes OSRS-navne</li>
                <li>Gem gruppe-ID'et til senere brug</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Sync Section */}
      <div className="mb-4 bg-white bg-opacity-30 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('sync')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-white hover:bg-opacity-20"
        >
          <h3 className="text-lg font-bold text-osrs-brown flex items-center gap-2">
            {openSections.sync ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            3. Synkronisering med Bingo
          </h3>
        </button>
        
        {openSections.sync && (
          <div className="p-4 pt-0 space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-osrs-brown">Tilføj Spillere med WOM ID</h4>
              <p className="text-sm text-osrs-brown">
                Når du tilføjer spillere til et hold i bingo-systemet, kan du angive deres WOM Player ID.
                Dette gør det muligt at hente deres stats automatisk.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-osrs-brown">Synkroniser Data</h4>
              <p className="text-sm text-osrs-brown">
                Klik på <strong>"Sync WOM"</strong> knappen i hovedmenuen for at opdatere alle spilleres stats.
                Dette henter de nyeste data fra Wise Old Man API'et.
              </p>
              
              <div className="bg-blue-100 p-3 rounded border border-blue-300">
                <p className="text-sm text-blue-800">
                  ℹ️ <strong>Note:</strong> WOM opdaterer kun når spillere logger ind i spillet med RuneLite. 
                  Hvis data er forældet, bed spilleren om at logge ind.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-osrs-brown">API Endpoints</h4>
              <p className="text-sm text-osrs-brown">
                Hvis du vil hente data manuelt, kan du bruge disse endpoints:
              </p>
              
              <div className="space-y-2">
                <div className="bg-gray-100 p-2 rounded font-mono text-xs flex items-center justify-between">
                  <span>https://api.wiseoldman.net/v2/players/USERNAME</span>
                  <button 
                    onClick={() => copyToClipboard('https://api.wiseoldman.net/v2/players/USERNAME', 'api1')}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {copied === 'api1' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="bg-gray-100 p-2 rounded font-mono text-xs flex items-center justify-between">
                  <span>https://api.wiseoldman.net/v2/players/ID</span>
                  <button 
                    onClick={() => copyToClipboard('https://api.wiseoldman.net/v2/players/ID', 'api2')}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {copied === 'api2' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              
              <p className="text-xs text-osrs-border">
                Erstat USERNAME med spillerens OSRS-navn eller ID med deres WOM Player ID.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="mt-6 p-4 bg-osrs-gold bg-opacity-10 rounded-lg">
        <h4 className="font-semibold text-osrs-brown mb-3">Hurtige Links</h4>
        <div className="flex flex-wrap gap-3">
          <a 
            href="https://runelite.net" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-2 bg-white rounded text-sm text-osrs-brown hover:bg-opacity-80"
          >
            RuneLite <ExternalLink size={14} />
          </a>
          <a 
            href="https://wiseoldman.net" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-2 bg-white rounded text-sm text-osrs-brown hover:bg-opacity-80"
          >
            Wise Old Man <ExternalLink size={14} />
          </a>
          <a 
            href="https://wiseoldman.net/groups" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-2 bg-white rounded text-sm text-osrs-brown hover:bg-opacity-80"
          >
            WOM Groups <ExternalLink size={14} />
          </a>
          <a 
            href="https://docs.wiseoldman.net" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-2 bg-white rounded text-sm text-osrs-brown hover:bg-opacity-80"
          >
            WOM API Docs <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

export default Guide;
