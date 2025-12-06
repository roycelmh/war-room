'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Target, Zap, Brain, Activity, ChevronRight, ShieldAlert, Eye, EyeOff, Crosshair, Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type MissionData = { title: string; time: string; status: 'Active' | 'Pending' };
type AnkiData = { backlog: number; reviews: number };
type HostileData = { count: number; max: number; status: string };

export default function MissionControl() {
  // 1. STATE
  const [mode, setMode] = useState<'NORMAL' | 'COMBAT'>('NORMAL');
  
  // 2. DATA STATES (Matches your logic)
  const [mission, setMission] = useState<MissionData>({ title: "PRAS Burns Clinic (Group A)", time: "02:30 PM", status: 'Active' });
  const [anki, setAnki] = useState<AnkiData>({ backlog: 142, reviews: 45 });
  const [hostiles, setHostiles] = useState<HostileData>({ count: 44, max: 50, status: 'SECTOR 50 ENGAGED' });
  const [advice, setAdvice] = useState("Bio-Rhythm synchronized. Ready for deep work.");

  // 3. EFFECT: Supabase Logic (UNCHANGED)
  useEffect(() => {
    const fetchData = async () => {
      const { data: cal } = await supabase.from('calendar_cache').select('*').limit(1).single();
      if (cal) {
        const startTime = new Date(cal.start_time);
        const now = new Date();
        const isHappening = now >= startTime && now < new Date(cal.end_time);
        setMission({ 
          title: cal.event_title, 
          time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: isHappening ? 'Active' : 'Pending'
        });
      }
      const { data: deck } = await supabase.from('logs_performance').select('value').eq('metric_name', 'Anki_Backlog').order('timestamp', { ascending: false }).limit(1).single();
      if (deck) setAnki(prev => ({ ...prev, backlog: deck.value ?? 0 }));
      
      // Update Hostiles based on Anki backlog for Combat Mode visual
      if (deck) setHostiles({ count: Math.min(deck.value ?? 0, 50), max: 50, status: 'ENGAGING TARGETS' });

      const { data: physio } = await supabase.from('logs_physiology').select('raw_data').eq('metric_name', 'Health_Advice').order('timestamp', { ascending: false }).limit(1).single();
      if (physio?.raw_data) {
        const raw = physio.raw_data as any;
        setAdvice(raw.analysis_summary || raw.advice || "System Stable.");
      }
    };
    fetchData();
  }, []);

  return (
    <div className="relative w-full mb-6">
      {/* BACKGROUND GLOW EFFECT */}
      <div className={`absolute -inset-1 rounded-3xl blur-2xl transition-all duration-1000 opacity-40 ${
        mode === 'COMBAT' ? 'bg-red-600' : 'bg-cyan-600'
      }`} />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 bg-black/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* --- TOGGLE SWITCH (Top Right) --- */}
        <div className="absolute top-0 right-0 p-4 z-50">
            <button 
                onClick={() => setMode(m => m === 'NORMAL' ? 'COMBAT' : 'NORMAL')}
                className={`group flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-[10px] tracking-[0.2em] transition-all duration-300 border backdrop-blur-md ${
                mode === 'COMBAT' 
                    ? 'bg-red-950/50 border-red-500 text-red-500 hover:bg-red-500 hover:text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]' 
                    : 'bg-cyan-950/50 border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-white shadow-[0_0_20px_rgba(8,145,178,0.5)]'
                }`}
            >
                {mode === 'COMBAT' ? (
                    <> <Eye className="w-3 h-3 animate-pulse" /> ITACHI PROTOCOL </>
                ) : (
                    <> <EyeOff className="w-3 h-3" /> SYSTEM NORMAL </>
                )}
            </button>
        </div>

        {/* --- LEFT: MISSION PROTOCOL --- */}
        <div className="lg:col-span-5 flex flex-col justify-between min-h-[200px]">
            <div>
                <div className={`flex items-center gap-2 mb-4 font-bold tracking-widest text-xs ${mode === 'COMBAT' ? 'text-red-500' : 'text-cyan-500'}`}>
                    <Target className="w-4 h-4" />
                    CURRENT OBJECTIVE
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white leading-none tracking-tight mb-2">
                    {mission.title}
                </h1>
                <div className="flex items-center gap-3 mt-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        mode === 'COMBAT' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    }`}>
                        {mission.status.toUpperCase()}
                    </span>
                    <span className="text-zinc-500 font-mono text-xs flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" /> T-MINUS {mission.time}
                    </span>
                </div>
            </div>
            
            {/* Motivational Quote based on Mode */}
            <div className="mt-6 pt-4 border-t border-white/5">
                <p className={`font-mono text-xs ${mode === 'COMBAT' ? 'text-red-400/80' : 'text-cyan-400/80'}`}>
                    {mode === 'COMBAT' 
                        ? ">> PAIN IS TEMPORARY. GLORY IS FOREVER. CLEAR THE QUEUE." 
                        : ">> FLOW STATE OPTIMIZED. MAINTAIN FOCUS."}
                </p>
            </div>
        </div>

        {/* --- MIDDLE: DYNAMIC DASHBOARD --- */}
        <div className="lg:col-span-3 relative flex flex-col justify-center min-h-[200px]">
            <AnimatePresence mode="wait">
                {mode === 'NORMAL' ? (
                    <motion.div 
                        key="normal"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="text-center"
                    >
                        <div className="w-32 h-32 mx-auto rounded-full border-4 border-cyan-500/20 flex items-center justify-center relative">
                            <div className="absolute inset-0 rounded-full border-t-4 border-cyan-500 animate-spin" style={{ animationDuration: '3s' }}></div>
                            <div>
                                <div className="text-3xl font-black text-white">{anki.backlog}</div>
                                <div className="text-[9px] text-cyan-500 tracking-widest uppercase">Cards</div>
                            </div>
                        </div>
                        <div className="mt-4 text-xs font-mono text-zinc-500">CORTEX RETENTION LOAD</div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="combat"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative h-full flex flex-col justify-between"
                    >
                        {/* THE RED HEX GRID VISUAL */}
                        <div className="absolute inset-0 grid grid-cols-6 gap-1 opacity-20 pointer-events-none">
                            {Array.from({length: 24}).map((_, i) => (
                                <div key={i} className={`rounded-sm transition-colors duration-500 ${i % 2 === 0 ? 'bg-red-500' : 'bg-transparent border border-red-900'}`} />
                            ))}
                        </div>

                        <div className="relative z-10 text-center pt-8">
                            <div className="flex items-center justify-center gap-2 text-red-500 font-black tracking-[0.3em] text-xs mb-2 animate-pulse">
                                <Crosshair className="w-4 h-4" /> HOSTILES DETECTED
                            </div>
                            <div className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">
                                {hostiles.count}
                            </div>
                            <div className="w-full bg-red-950 h-2 mt-4 rounded-full overflow-hidden border border-red-900">
                                <div className="h-full bg-red-600 shadow-[0_0_15px_#dc2626]" style={{ width: '70%' }}></div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* --- RIGHT: HUA TUO (TERMINAL) --- */}
        <div className="lg:col-span-4 flex flex-col h-full min-h-[200px] border-l border-white/5 pl-6">
            <div className="flex items-center gap-2 mb-4">
                <Activity className={`w-4 h-4 ${mode === 'COMBAT' ? 'text-red-500' : 'text-purple-500'}`} />
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Bio-Scan Analysis</span>
            </div>
            
            <div className={`flex-1 rounded-lg p-4 font-mono text-xs leading-relaxed overflow-y-auto border border-white/5 ${
                mode === 'COMBAT' 
                    ? 'bg-red-950/10 text-red-200/80 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]' 
                    : 'bg-black/40 text-emerald-200/80'
            }`}>
                <p className="mb-2 opacity-50"> // LATEST READINGS:</p>
                <p>
                    <span className={mode === 'COMBAT' ? 'text-red-500' : 'text-emerald-500'}>{">"}</span> {advice}
                </p>
                {mode === 'COMBAT' && (
                    <p className="mt-4 text-red-500 font-bold animate-pulse">
                        {">"} WARNING: CORTISOL LEVELS RISING. MAINTAIN BREATHWORK.
                    </p>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}