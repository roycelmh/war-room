'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Target, BookOpen, Brain } from 'lucide-react';

// Define types to keep TypeScript happy
type MissionData = { title: string; time: string };
type AnkiData = { backlog: number; reviews: number };

export default function MissionControl() {
  // Initialize with safe defaults
  const [mission, setMission] = useState<MissionData>({ title: "Scanning...", time: "--:--" });
  const [anki, setAnki] = useState<AnkiData>({ backlog: 0, reviews: 0 });
  const [advice, setAdvice] = useState<string>("System Initializing...");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Get Next Mission (Calendar Cache)
        const { data: cal, error: calError } = await supabase
          .from('calendar_cache')
          .select('*')
          .limit(1)
          .single();

        if (!calError && cal) {
          const startTime = new Date(cal.start_time);
          setMission({ 
            title: cal.event_title || "No Active Mission", 
            time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          });
        } else {
            setMission({ title: "No Active Mission", time: "--:--" });
        }

        // 2. Get Anki Stats (Backlog)
        const { data: deck, error: ankiError } = await supabase
          .from('logs_performance')
          .select('value')
          .eq('metric_name', 'Anki_Backlog')
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (!ankiError && deck) {
          setAnki(prev => ({ ...prev, backlog: deck.value ?? 0 }));
        }

        // 3. Get Health Advice (Targeted Search)
        const { data: physio, error: physioError } = await supabase
          .from('logs_physiology')
          .select('raw_data')
          .eq('metric_name', 'Health_Advice') // <--- THE FIX: Filter for Advice only
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (!physioError && physio?.raw_data) {
          // Cast to 'any' to bypass TypeScript strictness on JSON columns
          const raw = physio.raw_data as any;
          if (raw.advice) {
            setAdvice(raw.advice);
          } else {
             setAdvice("No specific medical advice generated today.");
          }
        }

      } catch (err) {
        console.error("Mission Control Error:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Current Objective */}
      <div className="p-5 rounded-xl bg-zinc-900/80 border border-emerald-500/30 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
        <div className="flex items-center gap-2 text-emerald-400 mb-2">
          <Target className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Current Objective</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white truncate">{mission.title}</h2>
          <p className="text-zinc-400 font-mono text-sm">{mission.time}</p>
        </div>
      </div>

      {/* Anki Status */}
      <div className="p-5 rounded-xl bg-zinc-900/80 border border-blue-500/30 flex flex-col justify-between">
        <div className="flex items-center gap-2 text-blue-400 mb-2">
          <BookOpen className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Memory Debt</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">{anki.backlog}</span>
          <span className="text-xs text-zinc-500">Cards Due</span>
        </div>
        {anki.backlog > 100 && (
          <div className="mt-2 text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded self-start">
            Critical Load
          </div>
        )}
      </div>

      {/* Hua Tuo's Advice */}
      <div className="p-5 rounded-xl bg-zinc-900/80 border border-purple-500/30 flex flex-col justify-between">
        <div className="flex items-center gap-2 text-purple-400 mb-2">
          <Brain className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Hua Tuo</span>
        </div>
        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono">
  {advice}
</p>
      </div>
    </div>
  );
}