import { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Upload, Download, RefreshCw } from 'lucide-react';
import { apiUrl } from '../api';
import { useDialog } from './Dialog';

const TILE_TYPES = [
  { value: 'kills', label: 'Boss Kills' },
  { value: 'kc', label: 'Kill Count' },
  { value: 'level', label: 'Skill Level' },
  { value: 'xp', label: 'Experience' },
  { value: 'collection', label: 'Collection (Konkurrence)' },
  { value: 'custom', label: 'Custom' }
];

const ALL_BOSSES = [
  { name: 'Zulrah', metric: 'zulrah', image: 'https://oldschool.runescape.wiki/images/Zulrah_%28serpentine%29.png', points: 2 },
  { name: 'Vorkath', metric: 'vorkath', image: 'https://oldschool.runescape.wiki/images/Vorkath.png', points: 2 },
  { name: 'Chambers of Xeric', metric: 'chambers_of_xeric', image: 'https://oldschool.runescape.wiki/images/Chambers_of_Xeric_logo.png', points: 3 },
  { name: 'Theatre of Blood', metric: 'theatre_of_blood', image: 'https://oldschool.runescape.wiki/images/Theatre_of_Blood_logo.png', points: 3 },
  { name: 'Tombs of Amascut', metric: 'tombs_of_amascut', image: 'https://oldschool.runescape.wiki/images/Tombs_of_Amascut_logo.png', points: 3 },
  { name: 'The Nightmare', metric: 'nightmare', image: 'https://oldschool.runescape.wiki/images/The_Nightmare.png', points: 2 },
  { name: 'Phosanis Nightmare', metric: 'phosanis_nightmare', image: 'https://oldschool.runescape.wiki/images/Phosani%27s_Nightmare.png', points: 3 },
  { name: 'Nex', metric: 'nex', image: 'https://oldschool.runescape.wiki/images/Nex.png', points: 3 },
  { name: 'Corporeal Beast', metric: 'corporeal_beast', image: 'https://oldschool.runescape.wiki/images/Corporeal_Beast.png', points: 2 },
  { name: 'Cerberus', metric: 'cerberus', image: 'https://oldschool.runescape.wiki/images/Cerberus.png', points: 2 },
  { name: 'Alchemical Hydra', metric: 'alchemical_hydra', image: 'https://oldschool.runescape.wiki/images/Alchemical_Hydra_%28serpentine%29.png', points: 2 },
  { name: 'Grotesque Guardians', metric: 'grotesque_guardians', image: 'https://oldschool.runescape.wiki/images/Dusk.png', points: 1 },
  { name: 'The Gauntlet', metric: 'the_gauntlet', image: 'https://oldschool.runescape.wiki/images/The_Gauntlet_logo.png', points: 2 },
  { name: 'Corrupted Gauntlet', metric: 'the_corrupted_gauntlet', image: 'https://oldschool.runescape.wiki/images/Corrupted_Hunllef.png', points: 3 },
  { name: 'Phantom Muspah', metric: 'phantom_muspah', image: 'https://oldschool.runescape.wiki/images/Phantom_Muspah_%28ranged%29.png', points: 2 },
  { name: 'Duke Sucellus', metric: 'duke_sucellus', image: 'https://oldschool.runescape.wiki/images/Duke_Sucellus.png', points: 2 },
  { name: 'The Leviathan', metric: 'the_leviathan', image: 'https://oldschool.runescape.wiki/images/The_Leviathan.png', points: 2 },
  { name: 'The Whisperer', metric: 'the_whisperer', image: 'https://oldschool.runescape.wiki/images/The_Whisperer.png', points: 2 },
  { name: 'Vardorvis', metric: 'vardorvis', image: 'https://oldschool.runescape.wiki/images/Vardorvis.png', points: 2 },
  { name: 'General Graardor', metric: 'general_graardor', image: 'https://oldschool.runescape.wiki/images/General_Graardor.png', points: 1 },
  { name: 'Commander Zilyana', metric: 'commander_zilyana', image: 'https://oldschool.runescape.wiki/images/Commander_Zilyana.png', points: 1 },
  { name: "Kree'arra", metric: 'kreearra', image: 'https://oldschool.runescape.wiki/images/Kree%27arra.png', points: 1 },
  { name: "K'ril Tsutsaroth", metric: 'kril_tsutsaroth', image: 'https://oldschool.runescape.wiki/images/K%27ril_Tsutsaroth.png', points: 1 },
  { name: 'Giant Mole', metric: 'giant_mole', image: 'https://oldschool.runescape.wiki/images/Giant_Mole.png', points: 1 },
  { name: 'Kalphite Queen', metric: 'kalphite_queen', image: 'https://oldschool.runescape.wiki/images/Kalphite_Queen_%28flying%29.png', points: 1 },
  { name: 'King Black Dragon', metric: 'king_black_dragon', image: 'https://oldschool.runescape.wiki/images/King_Black_Dragon.png', points: 1 },
  { name: 'Dagannoth Rex', metric: 'dagannoth_rex', image: 'https://oldschool.runescape.wiki/images/Dagannoth_Rex.png', points: 1 },
  { name: 'Dagannoth Prime', metric: 'dagannoth_prime', image: 'https://oldschool.runescape.wiki/images/Dagannoth_Prime.png', points: 1 },
  { name: 'Dagannoth Supreme', metric: 'dagannoth_supreme', image: 'https://oldschool.runescape.wiki/images/Dagannoth_Supreme.png', points: 1 },
  { name: 'Sarachnis', metric: 'sarachnis', image: 'https://oldschool.runescape.wiki/images/Sarachnis.png', points: 1 },
  { name: 'Zalcano', metric: 'zalcano', image: 'https://oldschool.runescape.wiki/images/Zalcano.png', points: 1 },
  { name: 'Tempoross', metric: 'tempoross', image: 'https://oldschool.runescape.wiki/images/Tempoross.png', points: 1 },
  { name: 'Wintertodt', metric: 'wintertodt', image: 'https://oldschool.runescape.wiki/images/Wintertodt.png', points: 1 },
  { name: 'Kraken', metric: 'kraken', image: 'https://oldschool.runescape.wiki/images/Kraken.png', points: 1 },
  { name: 'Thermonuclear Smoke Devil', metric: 'thermonuclear_smoke_devil', image: 'https://oldschool.runescape.wiki/images/Thermonuclear_smoke_devil.png', points: 1 },
  { name: 'Abyssal Sire', metric: 'abyssal_sire', image: 'https://oldschool.runescape.wiki/images/Abyssal_Sire.png', points: 2 },
  { name: 'Skotizo', metric: 'skotizo', image: 'https://oldschool.runescape.wiki/images/Skotizo.png', points: 1 },
  { name: 'Scorpia', metric: 'scorpia', image: 'https://oldschool.runescape.wiki/images/Scorpia.png', points: 1 },
  { name: 'Callisto', metric: 'callisto', image: 'https://oldschool.runescape.wiki/images/Callisto.png', points: 1 },
  { name: 'Artio', metric: 'artio', image: 'https://oldschool.runescape.wiki/images/Artio.png', points: 1 },
  { name: 'Venenatis', metric: 'venenatis', image: 'https://oldschool.runescape.wiki/images/Venenatis.png', points: 1 },
  { name: 'Spindel', metric: 'spindel', image: 'https://oldschool.runescape.wiki/images/Spindel.png', points: 1 },
  { name: "Vet'ion", metric: 'vetion', image: 'https://oldschool.runescape.wiki/images/Vet%27ion.png', points: 1 },
  { name: 'Calvarion', metric: 'calvarion', image: 'https://oldschool.runescape.wiki/images/Calvar%27ion.png', points: 1 },
  { name: 'Chaos Elemental', metric: 'chaos_elemental', image: 'https://oldschool.runescape.wiki/images/Chaos_Elemental.png', points: 1 },
  { name: 'Chaos Fanatic', metric: 'chaos_fanatic', image: 'https://oldschool.runescape.wiki/images/Chaos_Fanatic.png', points: 1 },
  { name: 'Crazy Archaeologist', metric: 'crazy_archaeologist', image: 'https://oldschool.runescape.wiki/images/Crazy_archaeologist.png', points: 1 },
  { name: 'Barrows', metric: 'barrows_chests', image: 'https://oldschool.runescape.wiki/images/Barrows_teleport_detail.png', points: 1 },
  { name: 'Hespori', metric: 'hespori', image: 'https://oldschool.runescape.wiki/images/Hespori.png', points: 1 },
  { name: 'Mimic', metric: 'mimic', image: 'https://oldschool.runescape.wiki/images/The_Mimic.png', points: 1 },
  { name: 'Obor', metric: 'obor', image: 'https://oldschool.runescape.wiki/images/Obor.png', points: 1 },
  { name: 'Bryophyta', metric: 'bryophyta', image: 'https://oldschool.runescape.wiki/images/Bryophyta.png', points: 1 },
  { name: 'The Hueycoatl', metric: 'the_hueycoatl', image: 'https://oldschool.runescape.wiki/images/The_Hueycoatl.png', points: 2 },
  { name: 'Amoxliatl', metric: 'amoxliatl', image: 'https://oldschool.runescape.wiki/images/Amoxliatl.png', points: 2 },
  { name: 'The Royal Titans', metric: 'the_royal_titans', image: 'https://oldschool.runescape.wiki/images/Clash_of_the_Titans_reward_icon.png', points: 2 },
  { name: 'Scurrius', metric: 'scurrius', image: 'https://oldschool.runescape.wiki/images/Scurrius.png', points: 1 },
  { name: 'Deranged Archaeologist', metric: 'deranged_archaeologist', image: 'https://oldschool.runescape.wiki/images/Deranged_archaeologist.png', points: 1 },
  { name: 'TzKal-Zuk', metric: 'tzkal_zuk', image: 'https://oldschool.runescape.wiki/images/TzKal-Zuk.png', points: 5 },
  { name: 'TzTok-Jad', metric: 'tztok_jad', image: 'https://oldschool.runescape.wiki/images/TzTok-Jad.png', points: 2 },
  { name: 'Sol Heredit', metric: 'sol_heredit', image: 'https://oldschool.runescape.wiki/images/Sol_Heredit.png', points: 5 },
];

const BOSS_METRICS = ALL_BOSSES.map(b => b.metric);

const ALL_SKILLS = [
  { name: 'Attack', metric: 'attack', image: 'https://oldschool.runescape.wiki/images/Attack_icon.png' },
  { name: 'Defence', metric: 'defence', image: 'https://oldschool.runescape.wiki/images/Defence_icon.png' },
  { name: 'Strength', metric: 'strength', image: 'https://oldschool.runescape.wiki/images/Strength_icon.png' },
  { name: 'Hitpoints', metric: 'hitpoints', image: 'https://oldschool.runescape.wiki/images/Hitpoints_icon.png' },
  { name: 'Ranged', metric: 'ranged', image: 'https://oldschool.runescape.wiki/images/Ranged_icon.png' },
  { name: 'Prayer', metric: 'prayer', image: 'https://oldschool.runescape.wiki/images/Prayer_icon.png' },
  { name: 'Magic', metric: 'magic', image: 'https://oldschool.runescape.wiki/images/Magic_icon.png' },
  { name: 'Cooking', metric: 'cooking', image: 'https://oldschool.runescape.wiki/images/Cooking_icon.png' },
  { name: 'Woodcutting', metric: 'woodcutting', image: 'https://oldschool.runescape.wiki/images/Woodcutting_icon.png' },
  { name: 'Fletching', metric: 'fletching', image: 'https://oldschool.runescape.wiki/images/Fletching_icon.png' },
  { name: 'Fishing', metric: 'fishing', image: 'https://oldschool.runescape.wiki/images/Fishing_icon.png' },
  { name: 'Firemaking', metric: 'firemaking', image: 'https://oldschool.runescape.wiki/images/Firemaking_icon.png' },
  { name: 'Crafting', metric: 'crafting', image: 'https://oldschool.runescape.wiki/images/Crafting_icon.png' },
  { name: 'Smithing', metric: 'smithing', image: 'https://oldschool.runescape.wiki/images/Smithing_icon.png' },
  { name: 'Mining', metric: 'mining', image: 'https://oldschool.runescape.wiki/images/Mining_icon.png' },
  { name: 'Herblore', metric: 'herblore', image: 'https://oldschool.runescape.wiki/images/Herblore_icon.png' },
  { name: 'Agility', metric: 'agility', image: 'https://oldschool.runescape.wiki/images/Agility_icon.png' },
  { name: 'Thieving', metric: 'thieving', image: 'https://oldschool.runescape.wiki/images/Thieving_icon.png' },
  { name: 'Slayer', metric: 'slayer', image: 'https://oldschool.runescape.wiki/images/Slayer_icon.png' },
  { name: 'Farming', metric: 'farming', image: 'https://oldschool.runescape.wiki/images/Farming_icon.png' },
  { name: 'Runecrafting', metric: 'runecrafting', image: 'https://oldschool.runescape.wiki/images/Runecraft_icon.png' },
  { name: 'Hunter', metric: 'hunter', image: 'https://oldschool.runescape.wiki/images/Hunter_icon.png' },
  { name: 'Construction', metric: 'construction', image: 'https://oldschool.runescape.wiki/images/Construction_icon.png' },
];

const ALL_PETS = [
  // Skilling pets
  { name: 'Heron', category: 'Skilling', image: 'https://oldschool.runescape.wiki/images/Heron.png' },
  { name: 'Rock Golem', category: 'Skilling', image: 'https://oldschool.runescape.wiki/images/Rock_golem.png' },
  { name: 'Beaver', category: 'Skilling', image: 'https://oldschool.runescape.wiki/images/Beaver.png' },
  { name: 'Baby Chinchompa', category: 'Skilling', image: 'https://oldschool.runescape.wiki/images/Baby_chinchompa_%28gold%29.png' },
  { name: 'Giant Squirrel', category: 'Skilling', image: 'https://oldschool.runescape.wiki/images/Giant_squirrel.png' },
  { name: 'Tangleroot', category: 'Skilling', image: 'https://oldschool.runescape.wiki/images/Tangleroot.png' },
  { name: 'Rocky', category: 'Skilling', image: 'https://oldschool.runescape.wiki/images/Rocky.png' },
  { name: 'Rift Guardian', category: 'Skilling', image: 'https://oldschool.runescape.wiki/images/Rift_guardian_%28fire%29.png' },
  { name: 'Phoenix', category: 'Skilling', image: 'https://oldschool.runescape.wiki/images/Phoenix.png' },
  { name: 'Tiny Tempor', category: 'Skilling', image: 'https://oldschool.runescape.wiki/images/Tiny_tempor.png' },
  // Boss pets
  { name: 'Pet Snakeling', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Pet_snakeling.png' },
  { name: 'Vorki', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Vorki.png' },
  { name: 'Olmlet', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Olmlet.png' },
  { name: 'Lil Zik', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Lil%27_zik.png' },
  { name: 'Tumekens Guardian', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Tumeken%27s_guardian.png' },
  { name: 'Little Nightmare', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Little_nightmare.png' },
  { name: 'Nexling', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Nexling.png' },
  { name: 'Pet Dark Core', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Pet_dark_core.png' },
  { name: 'Hellpuppy', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Hellpuppy.png' },
  { name: 'Ikkle Hydra', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Ikkle_hydra.png' },
  { name: 'Noon', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Noon.png' },
  { name: 'Youngllef', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Youngllef.png' },
  { name: 'Muphin', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Muphin.png' },
  { name: 'Baron', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Baron.png' },
  { name: 'Lil Wrath', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Lil%27_wrath.png' },
  { name: 'Wisp', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Wisp.png' },
  { name: 'Butch', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Butch.png' },
  { name: 'Pet General Graardor', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Pet_general_graardor.png' },
  { name: 'Pet Zilyana', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Pet_zilyana.png' },
  { name: 'Pet Kreearra', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Pet_kree%27arra.png' },
  { name: 'Pet Kril Tsutsaroth', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Pet_k%27ril_tsutsaroth.png' },
  { name: 'Baby Mole', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Baby_mole.png' },
  { name: 'Kalphite Princess', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Kalphite_princess.png' },
  { name: 'Prince Black Dragon', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Prince_black_dragon.png' },
  { name: 'Pet Dagannoth Rex', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Pet_dagannoth_rex.png' },
  { name: 'Pet Dagannoth Prime', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Pet_dagannoth_prime.png' },
  { name: 'Pet Dagannoth Supreme', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Pet_dagannoth_supreme.png' },
  { name: 'Sraracha', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Sraracha.png' },
  { name: 'Smolcano', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Smolcano.png' },
  { name: 'Pet Kraken', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Pet_kraken.png' },
  { name: 'Pet Smoke Devil', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Pet_smoke_devil.png' },
  { name: 'Abyssal Orphan', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Abyssal_orphan.png' },
  { name: 'Skotos', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Skotos.png' },
  { name: 'Scorpias Offspring', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Scorpia%27s_offspring.png' },
  { name: 'Callisto Cub', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Callisto_cub.png' },
  { name: 'Venenatis Spiderling', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Venenatis_spiderling.png' },
  { name: 'Vetion Jr', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Vet%27ion_jr.png' },
  { name: 'Pet Chaos Elemental', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Pet_chaos_elemental.png' },
  { name: 'Jal-nib-rek', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Jal-nib-rek.png' },
  { name: 'TzRek-Jad', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/TzRek-Jad.png' },
  { name: 'Smol Heredit', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Smol_heredit.png' },
  { name: 'Scurry', category: 'Boss', image: 'https://oldschool.runescape.wiki/images/Scurry.png' },
  // Other pets
  { name: 'Bloodhound', category: 'Other', image: 'https://oldschool.runescape.wiki/images/Bloodhound.png' },
  { name: 'Herbi', category: 'Other', image: 'https://oldschool.runescape.wiki/images/Herbi.png' },
  { name: 'Chompy Chick', category: 'Other', image: 'https://oldschool.runescape.wiki/images/Chompy_chick.png' },
  { name: 'Pet Penance Queen', category: 'Other', image: 'https://oldschool.runescape.wiki/images/Pet_penance_queen.png' },
  { name: 'Lil Creator', category: 'Other', image: 'https://oldschool.runescape.wiki/images/Lil%27_creator.png' },
];

const SKILL_METRICS = ALL_SKILLS.map(s => s.metric);

function TileManager({ tiles, teams, onUpdate }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTile, setEditingTile] = useState(null);
  const [loading, setLoading] = useState(false);
  const dialog = useDialog();
  const [showProgressModal, setShowProgressModal] = useState(null);
  const [showSkillSelector, setShowSkillSelector] = useState(false);
  const [showPetSelector, setShowPetSelector] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'kills',
    metric: '',
    target_value: 1,
    points: 1,
    image_url: '',
    position: tiles.length
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'kills',
      metric: '',
      target_value: 1,
      points: 1,
      image_url: '',
      position: tiles.length
    });
    setEditingTile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const url = editingTile 
        ? `/api/tiles/${editingTile.id}`
        : '/api/tiles';
      
      await fetch(url, {
        method: editingTile ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      resetForm();
      setShowCreateModal(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving tile:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTile = async (tileId) => {
    const confirmed = await dialog.confirm('Er du sikker på at du vil slette dette felt?', {
      title: 'Slet felt',
      confirmText: 'Ja, slet',
      variant: 'error'
    });
    if (!confirmed) return;
    
    try {
      await fetch(apiUrl(`/api/tiles/${tileId}`), { method: 'DELETE' });
      onUpdate();
    } catch (error) {
      console.error('Error deleting tile:', error);
    }
  };

  const editTile = (tile) => {
    setFormData({
      name: tile.name,
      description: tile.description || '',
      type: tile.type,
      metric: tile.metric || '',
      target_value: tile.target_value,
      points: tile.points,
      image_url: tile.image_url || '',
      position: tile.position
    });
    setEditingTile(tile);
    setShowCreateModal(true);
  };

  const updateProgress = async (tileId, teamId, value, completed) => {
    try {
      await fetch(apiUrl('/api/progress'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tile_id: tileId,
          team_id: teamId,
          current_value: parseInt(value),
          completed
        })
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const getMetricOptions = () => {
    switch (formData.type) {
      case 'kills':
      case 'kc':
        return BOSS_METRICS;
      case 'level':
      case 'xp':
        return SKILL_METRICS;
      default:
        return [];
    }
  };

  const selectSkill = (skill) => {
    setFormData({
      ...formData,
      name: skill.name,
      metric: skill.metric,
      image_url: skill.image,
      type: 'level'
    });
    setShowSkillSelector(false);
    setShowCreateModal(true);
  };

  const selectPet = (pet) => {
    setFormData({
      ...formData,
      name: `Get ${pet.name}`,
      image_url: pet.image,
      type: 'custom',
      target_value: 1,
      points: 3
    });
    setShowPetSelector(false);
    setShowCreateModal(true);
  };

  const generateAllBosses = async () => {
    const confirmed = await dialog.confirm('Dette vil tilføje ALLE OSRS bosser som bingo-felter. Fortsæt?', {
      title: 'Tilføj alle bosser',
      confirmText: 'Ja, tilføj'
    });
    if (!confirmed) return;
    
    setLoading(true);
    const bossTiles = ALL_BOSSES.map((boss, index) => ({
      name: boss.name,
      type: 'kills',
      metric: boss.metric,
      target_value: 1,
      points: boss.points,
      position: index,
      image_url: boss.image,
      description: `Kill count for ${boss.name}`
    }));
    
    try {
      await fetch(apiUrl('/api/tiles/bulk'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiles: bossTiles })
      });
      onUpdate();
    } catch (error) {
      console.error('Error creating boss tiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAllTiles = async () => {
    const firstConfirm = await dialog.confirm('Er du HELT sikker på at du vil slette ALLE felter? Dette kan ikke fortrydes!', {
      title: 'Slet alle felter',
      confirmText: 'Ja, slet alt',
      variant: 'error'
    });
    if (!firstConfirm) return;
    
    const secondConfirm = await dialog.confirm('Sidste advarsel: Alle felter og fremskridt vil blive slettet permanent!', {
      title: 'Bekræft sletning',
      confirmText: 'Ja, jeg er sikker',
      variant: 'error'
    });
    if (!secondConfirm) return;
    
    setLoading(true);
    try {
      await fetch(apiUrl('/api/tiles/all'), { method: 'DELETE' });
      onUpdate();
    } catch (error) {
      console.error('Error deleting all tiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveBoard = async () => {
    const name = await dialog.prompt('Giv dette board et navn:', {
      title: 'Gem board',
      placeholder: 'Board navn...'
    });
    if (!name) return;
    
    try {
      const res = await fetch(apiUrl('/api/boards'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        await dialog.success('Board gemt!');
      }
    } catch (error) {
      console.error('Error saving board:', error);
    }
  };

  const loadBoard = async () => {
    try {
      const res = await fetch(apiUrl('/api/boards'));
      const boards = await res.json();
      if (boards.length === 0) {
        await dialog.alert('Ingen gemte boards fundet');
        return;
      }
      const boardNames = boards.map((b, i) => `${i + 1}. ${b.name}`).join('\n');
      const choice = await dialog.prompt(`Vælg et board (indtast nummer):\n${boardNames}`, {
        title: 'Indlæs board'
      });
      if (!choice) return;
      
      const index = parseInt(choice) - 1;
      if (index >= 0 && index < boards.length) {
        await fetch(apiUrl(`/api/boards/${boards[index].id}/load`), { method: 'POST' });
        onUpdate();
        await dialog.success('Board indlæst!');
      }
    } catch (error) {
      console.error('Error loading board:', error);
    }
  };

  return (
    <div className="osrs-border-dashed rounded-lg p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-osrs-brown">Bingo Felter</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={generateAllBosses}
            disabled={loading}
            className="btn-osrs flex items-center gap-2 rounded"
          >
            <Upload size={18} />
            Bosser ({ALL_BOSSES.length})
          </button>
          <button
            onClick={() => setShowSkillSelector(true)}
            className="btn-osrs flex items-center gap-2 rounded"
          >
            <Upload size={18} />
            Skills ({ALL_SKILLS.length})
          </button>
          <button
            onClick={() => setShowPetSelector(true)}
            className="btn-osrs flex items-center gap-2 rounded"
          >
            <Upload size={18} />
            Pets ({ALL_PETS.length})
          </button>
          <button
            onClick={saveBoard}
            className="btn-osrs flex items-center gap-2 rounded"
          >
            <Save size={18} />
            Gem Board
          </button>
          <button
            onClick={loadBoard}
            className="btn-osrs flex items-center gap-2 rounded"
          >
            <Download size={18} />
            Indlæs Board
          </button>
          {tiles.length > 0 && (
            <button
              onClick={deleteAllTiles}
              disabled={loading}
              className="btn-osrs btn-osrs-danger flex items-center gap-2 rounded"
            >
              <Trash2 size={18} />
              Slet Alt
            </button>
          )}
          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="btn-osrs flex items-center gap-2 rounded"
          >
            <Plus size={18} />
            Tilføj Felt
          </button>
        </div>
      </div>

      {/* Tiles Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tiles.map(tile => (
          <div 
            key={tile.id}
            className="bg-white bg-opacity-50 rounded-lg p-3 relative group"
          >
            {tile.image_url && (
              <img 
                src={tile.image_url} 
                alt={tile.name}
                className="w-16 h-16 mx-auto mb-2 object-contain"
              />
            )}
            <h4 className="font-semibold text-osrs-brown text-center text-sm">
              {tile.name}
            </h4>
            <p className="text-xs text-osrs-border text-center">
              {tile.points} point{tile.points !== 1 ? 's' : ''}
            </p>
            
            {/* Action buttons */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setShowProgressModal(tile)}
                className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                title="Opdater fremskridt"
              >
                <Save size={14} />
              </button>
              <button
                onClick={() => editTile(tile)}
                className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                title="Rediger"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => deleteTile(tile.id)}
                className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                title="Slet"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {tiles.length === 0 && (
        <p className="text-center text-osrs-border py-8">
          Ingen bingo-felter oprettet endnu. Klik på "Tilføj Felt" eller "Generer Eksempler" for at starte.
        </p>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); resetForm(); }}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-osrs-brown mb-4">
              {editingTile ? 'Rediger Felt' : 'Opret Nyt Felt'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-osrs-brown mb-1 text-sm">Navn</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-osrs w-full rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-osrs-brown mb-1 text-sm">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value, metric: '' })}
                    className="input-osrs w-full rounded"
                  >
                    {TILE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-osrs-brown mb-1 text-sm">Beskrivelse</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-osrs w-full rounded"
                  rows={2}
                />
              </div>

              {getMetricOptions().length > 0 && (
                <div className="mb-4">
                  <label className="block text-osrs-brown mb-1 text-sm">Metric (WOM)</label>
                  <select
                    value={formData.metric}
                    onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                    className="input-osrs w-full rounded"
                  >
                    <option value="">Vælg metric...</option>
                    {getMetricOptions().map(metric => (
                      <option key={metric} value={metric}>
                        {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-osrs-brown mb-1 text-sm">Mål Værdi (0 = konkurrence)</label>
                  <input
                    type="number"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: parseInt(e.target.value) || 0 })}
                    className="input-osrs w-full rounded"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-osrs-brown mb-1 text-sm">Points</label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                    className="input-osrs w-full rounded"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-osrs-brown mb-1 text-sm">Position</label>
                  <input
                    type="number"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                    className="input-osrs w-full rounded"
                    min={0}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-osrs-brown mb-1 text-sm">Billede URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="input-osrs w-full rounded"
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="btn-osrs rounded"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-osrs rounded"
                >
                  {loading ? 'Gemmer...' : editingTile ? 'Gem Ændringer' : 'Opret Felt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Update Modal */}
      {showProgressModal && (
        <ProgressModal
          tile={showProgressModal}
          teams={teams}
          onClose={() => setShowProgressModal(null)}
          onUpdate={updateProgress}
        />
      )}

      {/* Skill Selector Modal */}
      <SkillSelectorModal
        isOpen={showSkillSelector}
        onClose={() => setShowSkillSelector(false)}
        onSelect={selectSkill}
      />

      {/* Pet Selector Modal */}
      <PetSelectorModal
        isOpen={showPetSelector}
        onClose={() => setShowPetSelector(false)}
        onSelect={selectPet}
      />
    </div>
  );
}

function ProgressModal({ tile, teams, onClose, onUpdate }) {
  const [progressValues, setProgressValues] = useState({});
  const [completedFlags, setCompletedFlags] = useState({});

  const handleSave = async () => {
    for (const teamId of Object.keys(progressValues)) {
      await onUpdate(
        tile.id, 
        parseInt(teamId), 
        progressValues[teamId] || 0,
        completedFlags[teamId] || false
      );
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-osrs-brown mb-4">
          Opdater Fremskridt: {tile.name}
        </h3>
        
        <div className="space-y-3 mb-6">
          {teams.map(team => (
            <div key={team.id} className="flex items-center gap-3">
              <div 
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: team.color }}
              />
              <span className="flex-1 text-osrs-brown">{team.name}</span>
              <input
                type="number"
                value={progressValues[team.id] || ''}
                onChange={(e) => setProgressValues({
                  ...progressValues,
                  [team.id]: e.target.value
                })}
                className="input-osrs w-24 rounded"
                placeholder="0"
                min={0}
              />
              <label className="flex items-center gap-1 text-sm text-osrs-brown">
                <input
                  type="checkbox"
                  checked={completedFlags[team.id] || false}
                  onChange={(e) => setCompletedFlags({
                    ...completedFlags,
                    [team.id]: e.target.checked
                  })}
                />
                Fuldført
              </label>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-osrs rounded">
            Annuller
          </button>
          <button onClick={handleSave} className="btn-osrs rounded">
            Gem
          </button>
        </div>
      </div>
    </div>
  );
}

// Skill Selector Modal Component
function SkillSelectorModal({ isOpen, onClose, onSelect }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6 max-w-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-osrs-brown mb-4">Vælg Skill</h3>
        <p className="text-sm text-osrs-border mb-4">
          Klik på en skill for at oprette et felt med det ikon
        </p>
        
        <div className="grid grid-cols-4 md:grid-cols-6 gap-3 max-h-96 overflow-y-auto">
          {ALL_SKILLS.map(skill => (
            <button
              key={skill.metric}
              onClick={() => onSelect(skill)}
              className="flex flex-col items-center p-3 bg-white bg-opacity-50 rounded hover:bg-opacity-70 transition-colors"
            >
              <img 
                src={skill.image} 
                alt={skill.name}
                className="w-8 h-8 object-contain mb-1"
              />
              <span className="text-xs text-osrs-brown text-center">{skill.name}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="btn-osrs rounded">
            Luk
          </button>
        </div>
      </div>
    </div>
  );
}

// Pet Selector Modal Component
function PetSelectorModal({ isOpen, onClose, onSelect }) {
  if (!isOpen) return null;

  const categories = ['Skilling', 'Boss', 'Other'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6 max-w-3xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-osrs-brown mb-4">Vælg Pet</h3>
        <p className="text-sm text-osrs-border mb-4">
          Klik på en pet for at oprette et "Få pet" felt
        </p>
        
        <div className="max-h-[500px] overflow-y-auto">
          {categories.map(category => (
            <div key={category} className="mb-4">
              <h4 className="font-semibold text-osrs-brown mb-2">{category} Pets</h4>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {ALL_PETS.filter(p => p.category === category).map(pet => (
                  <button
                    key={pet.name}
                    onClick={() => onSelect(pet)}
                    className="flex flex-col items-center p-2 bg-white bg-opacity-50 rounded hover:bg-opacity-70 transition-colors"
                    title={pet.name}
                  >
                    <img 
                      src={pet.image} 
                      alt={pet.name}
                      className="w-10 h-10 object-contain mb-1"
                    />
                    <span className="text-xs text-osrs-brown text-center truncate w-full">{pet.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="btn-osrs rounded">
            Luk
          </button>
        </div>
      </div>
    </div>
  );
}

export default TileManager;
