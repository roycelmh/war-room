'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Target, BookOpen, Brain, AlertTriangle, CheckCircle } from 'lucide-react';

// Safety Types
type MissionData = { title: string; time: string; status: 'Active' | 'Pending' };
type AnkiData = { backlog: number; reviews: number };

export default function MissionControl() {
  const [mission, setMission] = useState<MissionData>({ title: "Scanning Schedule...", time: "--:--", status: 'Pending' });
  const [anki, setAnki] = useState<AnkiData>({ backlog: 0, reviews: 0 });
  const [advice, setAdvice] = useState<string>("Analyzing Bio-Metrics...");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Get Next Mission (Calendar Cache)
        const { data: cal } = await supabase
          .from('calendar_cache')
          .select('*')
          .limit(1)
          .single();

        if (cal) {
          const startTime = new Date(cal.start_time);
          const now = new Date();
          const isHappening = now >= startTime && now < new Date(cal.end_time);
          
          setMission({ 
            title: cal.event_title || "No Active Mission", 
            time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: isHappening ? 'Active' : 'Pending'
          });
        } else {
           setMission({ title: "Free Time / No Data", time: "--:--", status: 'Pending' });
        }

        // 2. Get Anki Debt (Backlog)
        const { data: deck } = await supabase
          .from('logs_performance')
          .select('value')
          .eq('metric_name', 'Anki_Backlog')
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (deck) setAnki(prev => ({ ...prev, backlog: deck.value ?? 0 }));

        // 3. Get Hua Tuo's Advice (Morning Ward Round)
        const { data: physio } = await supabase
          .from('logs_physiology')
          .select('raw_data')
          .eq('metric_name', 'Health_Advice') // Looks for the specific advice log
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (physio?.raw_data) {
          const raw = physio.raw_data as any;
          // Extract just the "Verdict" or full text? Let's try to be smart.
          const text = raw.advice || raw.analysis_summary || "No advice generated.";
          setAdvice(text);
        } else {
          setAdvice("No ward round data found for today.");
        }

      } catch (err) {
        console.error("Mission Control Sync Error:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      
      {/* CARD 1: CURRENT OBJECTIVE */}
      <div className={`p-5 rounded-xl border flex flex-col justify-between relative overflow-hidden ${
        mission.status === 'Active' 
          ? 'bg-emerald-950/30 border-emerald-500/50' 
          : 'bg-zinc-900/80 border-white/10'
      }`}>
        <div className={`absolute top-0 left-0 w-1 h-full ${mission.status === 'Active' ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
        
        <div className={`flex items-center gap-2 mb-2 ${mission.status === 'Active' ? 'text-emerald-400' : 'text-zinc-400'}`}>
          <Target className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">
            {mission.status === 'Active' ? 'Current Objective' : 'Next Objective'}
          </span>
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-white truncate leading-tight">{mission.title}</h2>
          <p className="text-zinc-400 font-mono text-sm mt-1 flex items-center gap-2">
            {mission.status === 'Active' && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>}
            {mission.time}
          </p>
        </div>
      </div>

      {/* CARD 2: MEMORY DEBT */}
      <div className="p-5 rounded-xl bg-zinc-900/80 border border-blue-500/30 flex flex-col justify-between relative overflow-hidden">
         {/* Progress Bar Background */}
         <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-1000" style={{ width: `${Math.min(anki.backlog / 500 * 100, 100)}%` }} />
         
        <div className="flex items-center gap-2 text-blue-400 mb-2">
          <BookOpen className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Memory Debt</span>
        </div>
        
        <div className="flex items-end gap-2">
          <span className="text-3xl font-black text-white tracking-tight">{anki.backlog}</span>
          <span className="text-xs text-zinc-500 mb-1">Cards Due</span>
        </div>

        {anki.backlog > 300 ? (
           <div className="mt-2 flex items-center gap-1 text-xs text-red-300 bg-red-900/30 px-2 py-1 rounded self-start border border-red-500/20">
             <AlertTriangle className="w-3 h-3" /> Critical Load
           </div>
        ) : (
           <div className="mt-2 flex items-center gap-1 text-xs text-emerald-300 bg-emerald-900/30 px-2 py-1 rounded self-start border border-emerald-500/20">
             <CheckCircle className="w-3 h-3" /> Sustainable
           </div>
        )}
      </div>

      {/* CARD 3: HUA TUO */}
      <div className="p-5 rounded-xl bg-zinc-900/80 border border-purple-500/30 flex flex-col justify-between">
        <div className="flex items-center gap-2 text-purple-400 mb-2">
          <Brain className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Hua Tuo</span>
        </div>
        <div className="overflow-y-auto max-h-[80px] pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono text-[13px]">
            {advice}
            </p>
        </div>
      </div>

    </div>
  );
}