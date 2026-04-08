import { useState } from 'react';
import { HelpCircle, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';

function Guide() {
  const [openSections, setOpenSections] = useState({
    start: true,
    scoring: false,
    sync: false,
    admin: false,
  });

  const toggleSection = (section) => {
    setOpenSections({ ...openSections, [section]: !openSections[section] });
  };

  const Section = ({ id, title, children }) => (
    <div className="mb-4 bg-white bg-opacity-30 rounded-lg overflow-hidden">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white hover:bg-opacity-20"
      >
        <h3 className="text-lg font-bold text-osrs-brown flex items-center gap-2">
          {openSections[id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          {title}
        </h3>
      </button>
      {openSections[id] && <div className="p-4 pt-0 space-y-4">{children}</div>}
    </div>
  );

  return (
    <div className="osrs-border-dashed rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="text-osrs-gold" size={24} />
        <h2 className="text-2xl font-bold text-osrs-brown">Opsætningsguide</h2>
      </div>

      {/* 1. Kom i gang */}
      <Section id="start" title="1. Kom i gang som spiller">
        <div className="bg-osrs-gold bg-opacity-10 p-3 rounded">
          <p className="text-sm text-osrs-brown">
            <strong>Hvad er det her?</strong>
            <br />
            Et team-baseret OSRS bingo. Hjemmesiden tracker XP, boss kills og manuelle beviser fra
            det øjeblik bingoen starter, og lægger holdets spillere sammen.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-osrs-brown">Trin 1: PIN kode</h4>
          <p className="text-sm text-osrs-brown">
            Få PIN-koden af arrangøren og indtast den i welcome-popuppen første gang du åbner siden.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-osrs-brown">Trin 2: Vælg karakter og hold</h4>
          <p className="text-sm text-osrs-brown">
            Vælg din OSRS-karakter og dit hold i welcome-popuppen. Dette gemmes lokalt så du ikke
            skal gøre det igen.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-osrs-brown">Trin 3: Sørg for at WOM kender din karakter</h4>
          <p className="text-sm text-osrs-brown">
            Bingoen henter dine stats fra <strong>Wise Old Man</strong>. Den nemmeste vej:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-osrs-brown ml-2">
            <li>
              Download RuneLite hvis du ikke har det:{' '}
              <a
                href="https://runelite.net"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
              >
                runelite.net <ExternalLink size={12} />
              </a>
            </li>
            <li>
              Wise Old Man-plugin er <strong>allerede indbygget</strong> i RuneLite — ingen Plugin
              Hub install nødvendig.
            </li>
            <li>Log ind på din karakter én gang. Dine stats sendes automatisk til WOM.</li>
          </ol>
          <div className="bg-blue-100 p-3 rounded border border-blue-300">
            <p className="text-sm text-blue-800">
              ℹ️ <strong>Ingen RuneLite?</strong> WOM kan også skrabe det officielle OSRS Hiscores. Så
              længe din karakter står på hiscores virker det — RuneLite er bare hurtigere og mere
              præcist.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-osrs-brown">Trin 4: Tjek at du er på dit hold</h4>
          <p className="text-sm text-osrs-brown">
            Gå til <strong>Hold</strong>-fanen og find dit hold. Hvis dit navn ikke står på listen,
            spørg arrangøren om at tilføje dig.
          </p>
        </div>
      </Section>

      {/* 2. Scoring */}
      <Section id="scoring" title="2. Sådan virker bingo og scoring">
        <div className="bg-yellow-100 p-3 rounded border border-yellow-300">
          <p className="text-sm text-yellow-900">
            ⏱️ Når admin trykker <strong>Start Bingo</strong> gemmes alle spilleres stats som
            baseline. <strong>Kun XP og kills opnået EFTER dette tidspunkt tæller med.</strong>
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-osrs-brown">Holdet tæller sammen</h4>
          <p className="text-sm text-osrs-brown">
            Et holds total for et felt er <strong>summen af alle holdets spillere</strong>. Hvert
            hold konkurrerer kun for sig selv — der er ingen bleed mellem holdene.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-osrs-brown">To slags felter</h4>
          <ul className="list-disc list-inside text-sm text-osrs-brown space-y-1 ml-2">
            <li>
              <strong>Target:</strong> første hold der når målet (fx 1M Mining XP) vinder feltet.
            </li>
            <li>
              <strong>Competition:</strong> højeste samlede total ved event-slut vinder feltet.
            </li>
            <li>
              <strong>Manuelle felter</strong> (drops, achievements) kræver et bevis i{' '}
              <strong>Beviser</strong>-fanen som admin godkender.
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-osrs-brown">Se hvem på dit hold der har bidraget</h4>
          <p className="text-sm text-osrs-brown">
            Hold musen over et felt på boardet og klik på dit hold-navn for at folde det ud. Du ser
            hver spillers individuelle bidrag (fx +250.000 XP).
          </p>
        </div>
      </Section>

      {/* 3. Sync */}
      <Section id="sync" title="3. Sync og rate limits">
        <div className="bg-yellow-100 p-3 rounded border border-yellow-300">
          <p className="text-sm text-yellow-900">
            ⚠️ Wise Old Man tillader kun <strong>1 opdatering per spiller per time</strong>.
            Sync-knapperne respekterer det — du kan ikke spamme dem.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-osrs-brown">Tre måder data opdateres på</h4>
          <ol className="list-decimal list-inside text-sm text-osrs-brown space-y-1 ml-2">
            <li>
              <strong>Daglig auto-refresh:</strong> kører i baggrunden hver 24. time.
            </li>
            <li>
              <strong>Per-spiller sync:</strong> i <strong>Hold</strong>-fanen — klik refresh-ikonet
              ved siden af din karakter. Disabled hvis det er under en time siden sidste sync.
            </li>
            <li>
              <strong>Admin manuel sync:</strong> kun arrangøren har den knap i hovedmenuen.
            </li>
          </ol>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-osrs-brown">"Ingen baseline"-badge</h4>
          <p className="text-sm text-osrs-brown">
            Hvis din karakter står med en gul <em>Ingen baseline</em>-mærkat (fx fordi du blev
            tilføjet efter bingoen startede), klik <strong>Hent baseline</strong> ud for dit navn.
            Så bliver dine nuværende stats brugt som startpunkt.
          </p>
        </div>

        <div className="bg-blue-100 p-3 rounded border border-blue-300">
          <p className="text-sm text-blue-800">
            💡 WOM henter selv friske data næste gang du logger ind med RuneLite, eller når den
            skraber hiscores. Hvis dit nye XP ikke vises efter en sync, så log ind i spillet og prøv
            igen.
          </p>
        </div>
      </Section>

      {/* 4. Admin */}
      <Section id="admin" title="4. For admins (kun hvis du arrangerer)">
        <div className="space-y-2">
          <h4 className="font-semibold text-osrs-brown">Pre-flight Check</h4>
          <p className="text-sm text-osrs-brown">
            I <strong>Admin</strong>-panelet ligger der et Pre-flight Check der verificerer 7 ting
            (WOM oppe, alle spillere findes på WOM, PIN sat, admin password sat, event-tider sat,
            mindst ét hold med spillere, mindst ét felt på boardet). <strong>Kør den før du
            trykker Start Bingo</strong> — så fanger du fejl mens du stadig kan rette dem.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-osrs-brown">Boards-fanen</h4>
          <p className="text-sm text-osrs-brown">
            Du kan gemme hele tile-konfigurationer som genbrugelige boards. Når du indlæser et
            gemt board bliver dit nuværende board <strong>automatisk gemt som auto-backup
            først</strong>, så intet går tabt.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-osrs-brown">Backfill baselines</h4>
          <p className="text-sm text-osrs-brown">
            Hvis du har tilføjet spillere efter at have trykket Start Bingo, så brug{' '}
            <strong>Backfill manglende baselines</strong> i Admin-panelet til at hente baseline for
            alle på én gang.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-osrs-brown">PIN og adgang</h4>
          <p className="text-sm text-osrs-brown">
            Site-PIN sættes i Admin-panelet og kræves for at tilgå siden. Skift den når bingoen er
            slut hvis du vil lukke for adgang.
          </p>
        </div>
      </Section>

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
        </div>
      </div>
    </div>
  );
}

export default Guide;
