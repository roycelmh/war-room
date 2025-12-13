'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { AtmosphericVoid } from '@/components/apex/AtmosphericVoid';
import { TechGauge } from '@/components/apex/TechGauge';
import { HoloCard } from '@/components/apex/HoloCard';
import { EntropyBeast } from '@/components/apex/EntropyBeast'; // <--- NEW IMPORT

export default function ApexWarRoom() {
  const [wallet, setWallet] = useState<any>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [activeThreat, setActiveThreat] = useState<any>(null); // <--- NEW STATE
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        // 1. Fetch Wallet
        const { data: walletData } = await supabase.from('apex_wallet').select('*').limit(1).single();
        setWallet(walletData);
        
        // 2. Fetch Game State
        const { data: stateData } = await supabase.from('apex_game_state').select('*').limit(1).single();
        setGameState(stateData);

        // 3. Fetch Active Threat (The Enemy)
        const { data: threatData } = await supabase
          .from('apex_active_threats')
          .select('*, apex_bestiary(*)')
          .eq('is_defeated', false)
          .maybeSingle();
        setActiveThreat(threatData);
        
        // 4. Fetch Roster
        const { data: rosterData } = await supabase
       .from('apex_roster')
       .select(`id, level, bond_xp, is_commander, apex_generals (name, rarity, image_url, affinity, role)`)
       .order('is_commander', { ascending: false })
       .order('level', { ascending: false });
       
        setRoster(rosterData || []);
        setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-green-500 font-mono text-xs tracking-[0.5em] animate-pulse">
      <div className="w-16 h-16 border-4 border-t-green-500 border-r-transparent border-b-green-500 border-l-transparent rounded-full animate-spin mb-4" />
      // INITIALIZING NEURAL LINK...
    </div>
  );

  const commander = roster.find(r => r.is_commander);
  const troops = roster.filter(r => !r.is_commander);
  
  // LOGIC: If a beast is active, OVERRIDE DEFCON to 5 (Critical)
  const defconLevel = activeThreat ? 5 : (gameState?.defcon_level || 1);
  const isDanger = defconLevel >= 3; 

  // Dynamic Theme: If Beast Active -> RED & GLITCHY
  const themeText = activeThreat ? 'text-red-600 animate-pulse' : (isDanger ? 'text-red-500' : 'text-cyan-400');
  const themeBorder = activeThreat ? 'border-red-600' : (isDanger ? 'border-red-500/50' : 'border-cyan-500/30');

  return (
    <div className={`relative min-h-screen font-sans overflow-x-hidden ${activeThreat ? 'text-red-50 crt-flicker selection:bg-red-900' : 'text-neutral-200 selection:bg-cyan-500/30'}`}>
      
      {/* 1. ATMOSPHERIC LAYER */}
      <AtmosphericVoid />
      {/* Red Alert Overlay if threat active */}
      {activeThreat && <div className="fixed inset-0 bg-red-900/10 pointer-events-none z-0 mix-blend-overlay" />}

      {/* 2. HUD LAYER */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${themeBorder} bg-[#050505]/80 px-4 py-3 transition-colors duration-1000`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${isDanger ? 'bg-red-500 animate-ping' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`} />
                    <div>
                        <h1 className="text-xl md:text-2xl font-black tracking-tighter text-white">
                            APEX <span className={themeText}>WAR ROOM</span>
                        </h1>
                        <div className="text-[9px] tracking-[0.3em] text-neutral-500 uppercase hidden md:block">
                           {activeThreat ? '⚠️ INTRUSION DETECTED' : `SYS.ONLINE // ERA: ${gameState?.current_era_name}`}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide no-scrollbar">
                <TechGauge label="BODY" value={wallet?.scrolls_body} max={20} color="red" />
                <TechGauge label="MIND" value={wallet?.scrolls_mind} max={20} color="blue" />
                <TechGauge label="HEART" value={wallet?.scrolls_heart} max={20} color="green" />
                <TechGauge label="FATE" value={wallet?.fate_points} max={5} color="gold" />
            </div>
        </div>
      </header>

      {/* 3. MAIN TACTICAL GRID */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        
        {/* LEFT COLUMN: THREAT OR COMMANDER */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* DEFCON WIDGET */}
            <div className={`relative overflow-hidden bg-neutral-900/40 border ${themeBorder} p-6 rounded-xl backdrop-blur-md transition-all`}>
                <h3 className="text-neutral-500 text-[10px] font-bold tracking-[0.2em] mb-1">THREAT LEVEL</h3>
                <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-black text-white tracking-tighter">DEFCON</span>
                    <span className={`text-6xl font-black ${themeText} animate-pulse`}>{defconLevel}</span>
                </div>
                {/* Visualizer Bar */}
                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: activeThreat ? '100%' : `${(100 / 3) * (4 - defconLevel)}%` }} 
                        className={`h-full ${activeThreat ? 'bg-red-600 shadow-[0_0_20px_red]' : (isDanger ? 'bg-red-500' : 'bg-cyan-500')}`}
                    />
                </div>
                <p className="text-right text-[9px] font-mono text-neutral-500 mt-2 uppercase">
                    {activeThreat ? '⚠️ CRITICAL: ENTROPY BEAST ACTIVE' : (isDanger ? '⚠️ ALERT: SYSTEM UNSTABLE' : '✓ SYSTEM NOMINAL')}
                </p>
            </div>

            {/* COMMANDER / BEAST SLOT */}
            <div className="space-y-2 relative">
                <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500 tracking-widest border-b border-white/5 pb-2">
                    <span>{activeThreat ? '⚠️ TARGET IDENTIFIED' : 'ACTIVE OPERATIVE'}</span>
                    <span className={activeThreat ? "text-red-500 animate-ping" : "text-green-500 animate-pulse"}>
                      {activeThreat ? '● ENGAGING' : '● CONNECTED'}
                    </span>
                </div>

                <div className="relative group perspective-1000">
                    <div className={`absolute -top-10 inset-x-10 h-32 blur-2xl pointer-events-none ${activeThreat ? 'bg-red-600/20' : 'bg-gradient-to-b from-cyan-500/10 to-transparent'}`} />
                    
                    {/* LOGIC SWITCH: SHOW BEAST OR COMMANDER */}
                    {activeThreat ? (
                         <EntropyBeast threat={activeThreat} />
                    ) : commander ? (
                         <div className="transform transition-transform duration-500 hover:rotate-x-2">
                            <HoloCard item={commander} isCommander={true} onClick={() => {}} />
                         </div>
                    ) : (
                        <div className="h-96 border-2 border-dashed border-neutral-800 rounded-xl flex items-center justify-center bg-neutral-900/20 backdrop-blur-sm">
                            <div className="text-center">
                                <p className="text-neutral-600 font-mono text-xs tracking-widest mb-2">NO SIGNAL</p>
                                <div className="px-4 py-2 bg-neutral-800/50 text-xs font-bold text-neutral-500 rounded border border-neutral-700">
                                    AWAITING ORDERS
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: ROSTER GRID */}
        <div className="lg:col-span-8">
            <div className={`flex items-center justify-between mb-6 sticky top-[80px] z-40 py-2 bg-[#050505]/90 backdrop-blur lg:static lg:bg-transparent`}>
                <h2 className="text-xs font-bold text-neutral-500 tracking-widest flex items-center gap-2">
                    <span className={`w-1 h-4 rounded-sm ${activeThreat ? 'bg-red-600' : 'bg-cyan-500'}`} />
                    UNIT ROSTER // <span className="text-white">{troops.length} READY</span>
                </h2>
            </div>

            <motion.div 
                className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 ${activeThreat ? 'opacity-50 grayscale' : ''}`}
                initial="hidden"
                animate="show"
                variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
                }}
            >
                {troops.map((unit) => (
                    <motion.div key={unit.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                        <HoloCard item={unit} onClick={() => {}} />
                    </motion.div>
                ))}
            </motion.div>
        </div>

      </main>
    </div>
  );
}