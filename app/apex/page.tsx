'use client';

import { useEffect, useState } from 'react';
// 1. Change this import to use your shared library instance
import { supabase } from '@/lib/supabase'; 

export default function ApexWarRoom() {
  const [wallet, setWallet] = useState<any>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch Wallet
      const { data: walletData } = await supabase.from('apex_wallet').select('*').limit(1).single();
      setWallet(walletData);

      // 2. Fetch Game State
      const { data: stateData } = await supabase.from('apex_game_state').select('*').limit(1).single();
      setGameState(stateData);

      // 3. Fetch Roster
      const { data: rosterData } = await supabase
        .from('apex_roster')
        .select(`
          id, level, bond_xp, is_commander,
          apex_generals (name, rarity, image_url, affinity, role)
        `)
        .order('is_commander', { ascending: false })
        .order('level', { ascending: false });
      
      setRoster(rosterData || []);
      setLoading(false);
    }

    fetchData();
  }, []);

  // Helpers
  const getAffinityColor = (affinity: string) => {
    if (affinity === 'Body') return 'text-red-400 border-red-900';
    if (affinity === 'Mind') return 'text-blue-400 border-blue-900';
    if (affinity === 'Heart') return 'text-green-400 border-green-900';
    return 'text-neutral-400 border-neutral-800';
  };

  const getDefconColor = (level: number) => {
    if (level === 1) return 'bg-green-500';
    if (level === 2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) return <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center font-mono">INITIALIZING APEX PROTOCOLS...</div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-6 font-mono selection:bg-red-900 selection:text-white">
      {/* ... (Keep your Header and Main Grid JSX exactly the same) ... */}
      
      <header className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-white">
            APEX <span className="text-red-600">WAR ROOM</span>
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            CURRENT ERA: {gameState?.current_era_name || 'THE AWAKENING'}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <ResourcePill color="bg-red-500" label="BODY" value={wallet?.scrolls_body} />
          <ResourcePill color="bg-blue-500" label="MIND" value={wallet?.scrolls_mind} />
          <ResourcePill color="bg-green-500" label="HEART" value={wallet?.scrolls_heart} />
          
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-yellow-900/50 bg-yellow-900/10">
            <span className="text-xs text-yellow-600 font-bold">FATE</span>
            <span className="font-bold text-yellow-500">{wallet?.fate_points || 0}</span>
          </div>
        </div>
      </header>

      {/* MAIN GRID */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <h2 className="text-xs font-bold text-neutral-500 mb-4 tracking-widest">CURRENT COMMANDER</h2>
            {roster.find(r => r.is_commander) ? (
              <CommanderCard item={roster.find(r => r.is_commander)} />
            ) : (
              <div className="h-96 w-full bg-neutral-900/50 rounded border border-dashed border-neutral-800 flex items-center justify-center text-neutral-600 text-sm">
                NO COMMANDER EQUIPPED
              </div>
            )}
          </div>

          <div className="p-4 rounded border border-neutral-800 bg-neutral-900/30">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-neutral-400 font-bold">DEFCON LEVEL</span>
              <span className="font-bold text-white text-xl">{gameState?.defcon_level}</span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden mb-2">
              <div 
                className={`h-full transition-all duration-500 ${getDefconColor(gameState?.defcon_level)}`} 
                style={{ width: gameState?.defcon_level === 3 ? '33%' : gameState?.defcon_level === 2 ? '66%' : '100%' }}
              ></div>
            </div>
            <p className={`text-[10px] text-right font-bold ${gameState?.is_safe_mode_active ? 'text-red-500 animate-pulse' : 'text-neutral-500'}`}>
              {gameState?.is_safe_mode_active ? '⚠️ SAFE MODE ACTIVE' : 'SYSTEMS NOMINAL'}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-bold text-neutral-500 tracking-widest">ACTIVE ROSTER</h2>
            <div className="text-[10px] text-neutral-600 border border-neutral-800 px-2 py-1 rounded">SORT: LEVEL (DESC)</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {roster.filter(r => !r.is_commander).map((item) => (
               <RosterCard key={item.id} item={item} getAffinityColor={getAffinityColor} />
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}

// === KEEP YOUR SUB-COMPONENTS (ResourcePill, CommanderCard, RosterCard) BELOW ===
// (I omitted them here to save space, but you should keep them in your file)

function ResourcePill({ color, label, value }: { color: string, label: string, value: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-neutral-900 border border-neutral-800">
      <span className={`w-2 h-2 rounded-full ${color}`}></span>
      <span className="text-[10px] text-neutral-400 font-bold tracking-wide">{label}</span>
      <span className="font-bold text-white text-sm">{value || 0}</span>
    </div>
  );
}

function CommanderCard({ item }: { item: any }) {
  const gen = item.apex_generals;
  return (
    <div className={`relative bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 group hover:border-neutral-600 transition-colors shadow-2xl`}>
       {/* Image */}
       <div className="h-96 w-full relative">
          <img src={gen.image_url} alt={gen.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent"></div>
       </div>
       
       {/* Overlay Info */}
       <div className="absolute bottom-0 left-0 w-full p-4">
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">{gen.name}</h3>
          <p className="text-xs text-neutral-400 uppercase tracking-wide mt-1">{gen.rarity} // {gen.role}</p>
          
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] bg-neutral-950/80 border border-neutral-700 px-2 py-1 rounded text-white">LVL {item.level}</span>
            <span className={`text-[10px] bg-neutral-950/80 border px-2 py-1 rounded ${
              gen.affinity === 'Body' ? 'text-red-400 border-red-900' :
              gen.affinity === 'Mind' ? 'text-blue-400 border-blue-900' :
              gen.affinity === 'Heart' ? 'text-green-400 border-green-900' : 'text-gray-400 border-gray-700'
            }`}>
               {gen.affinity}
            </span>
          </div>
       </div>
    </div>
  );
}

function RosterCard({ item, getAffinityColor }: { item: any, getAffinityColor: (a:string) => string }) {
  const gen = item.apex_generals;
  const rarityBorder = gen.rarity === 'SSR' ? 'border-yellow-600/50' : gen.rarity === 'UR' ? 'border-purple-600/50' : 'border-neutral-800';
  
  return (
    <div className={`relative bg-neutral-900 rounded-lg overflow-hidden border ${rarityBorder} hover:-translate-y-1 transition-transform duration-200 group`}>
      <div className="h-48 relative bg-neutral-800">
         {gen.image_url ? (
           <img src={gen.image_url} className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity" />
         ) : (
           <div className="w-full h-full flex items-center justify-center text-neutral-700 text-xs">NO SIGNAL</div>
         )}
         <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent"></div>
      </div>

      <div className="p-3 relative -mt-8 z-10">
         <h4 className="text-sm font-bold text-white truncate">{gen.name}</h4>
         <div className="flex justify-between items-center mt-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded border bg-neutral-950/50 ${getAffinityColor(gen.affinity)}`}>
              {gen.affinity}
            </span>
            <span className="text-[10px] text-neutral-500">LVL {item.level}</span>
         </div>
         <div className="mt-3 w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
            <div className="bg-neutral-600 h-full" style={{ width: `${item.bond_xp % 100}%` }}></div>
         </div>
      </div>
    </div>
  );
}