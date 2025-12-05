'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Target, Zap, Brain, Activity, ChevronRight } from 'lucide-react';

type MissionData = { title: string; time: string; status: 'Active' | 'Pending' };
type AnkiData = { backlog: number; reviews: number };

export default function MissionControl() {
  const [mission, setMission] = useState<MissionData>({ title: "INITIALIZING...", time: "--:--", status: 'Pending' });
  const [anki, setAnki] = useState<AnkiData>({ backlog: 0, reviews: 0 });
  const [advice, setAdvice] = useState<string>("Waiting for Bio-Link...");

  useEffect(() => {
    const fetchData = async () => {
      // 1. Calendar
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

      // 2. Anki
      const { data: deck } = await supabase.from('logs_performance').select('value').eq('metric_name', 'Anki_Backlog').order('timestamp', { ascending: false }).limit(1).single();
      if (deck) setAnki(prev => ({ ...prev, backlog: deck.value ?? 0 }));

      // 3. Hua Tuo
      const { data: physio } = await supabase.from('logs_physiology').select('raw_data').eq('metric_name', 'Health_Advice').order('timestamp', { ascending: false }).limit(1).single();
      if (physio?.raw_data) {
        const raw = physio.raw_data as any;
        setAdvice(raw.analysis_summary || raw.advice || "System Stable.");
      }
    };
    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
      
      {/* LEFT: CURRENT OBJECTIVE (Span 5) */}
      <div className="lg:col-span-5 relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <div className="relative h-full p-6 rounded-2xl bg-black border border-white/10 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 text-emerald-400">
              <Target className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Mission Protocol</span>
            </div>
            {mission.status === 'Active' && (
               <span className="flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
               </span>
            )}
          </div>
          
          <div className="mt-4">
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
              {mission.title}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-zinc-500 font-mono text-sm">
              <ChevronRight className="w-4 h-4 text-emerald-600" />
              <span>T-MINUS: {mission.time}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE: ANKI CORE (Span 3) */}
      <div className="lg:col-span-3 relative group">
         <div className="absolute -inset-0.5 bg-blue-500 rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
         <div className="relative h-full p-6 rounded-2xl bg-black border border-white/10 flex flex-col items-center justify-center text-center">
            <div className="mb-2 text-blue-400 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Cortex Load</span>
            </div>
            <div className="text-5xl font-black text-white tracking-tighter">
              {anki.backlog}
            </div>
            <div className="text-xs text-zinc-600 font-mono mt-1 uppercase">Cards Pending</div>
            
            {/* Mini Progress Bar */}
            <div className="w-full bg-zinc-800 h-1 mt-4 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${Math.min(anki.backlog / 500 * 100, 100)}%` }}></div>
            </div>
         </div>
      </div>

      {/* RIGHT: HUA TUO TERMINAL (Span 4) */}
      <div className="lg:col-span-4 relative">
        <div className="h-full p-6 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col">
          <div className="flex items-center gap-2 text-purple-400 mb-4">
            <Activity className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Bio-Scan</span>
          </div>
          
          {/* Terminal Window */}
          <div className="flex-1 bg-black/50 rounded-lg p-4 border border-white/5 font-mono text-xs md:text-sm text-emerald-100/80 overflow-y-auto max-h-[150px] scrollbar-thin">
            <p className="leading-relaxed whitespace-pre-wrap">
              <span className="text-emerald-600 mr-2">{">"}</span>
              {advice}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}