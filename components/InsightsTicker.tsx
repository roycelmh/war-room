'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Terminal } from 'lucide-react';

export default function InsightsTicker() {
  const [insight, setInsight] = useState<string>("INITIALIZING STRATEGIST CORE...");

  useEffect(() => {
    const fetchInsight = async () => {
      const { data } = await supabase.from('synapse_insights').select('message').order('created_at', { ascending: false }).limit(1).single();
      if (data) setInsight(data.message);
    };
    fetchInsight();
    const channel = supabase.channel('realtime-insights').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'synapse_insights' }, 
        (payload) => setInsight(payload.new.message)
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="relative overflow-hidden p-[1px] rounded-xl bg-gradient-to-r from-emerald-500/20 via-transparent to-transparent">
        <div className="p-4 rounded-xl bg-black/80 backdrop-blur-md relative overflow-hidden group border border-white/5">
            {/* Scanline Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%] opacity-20"></div>

            <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                <div className="flex items-center gap-2 text-emerald-500/80">
                    <Terminal className="w-3 h-3" />
                    <h3 className="text-[9px] font-bold uppercase tracking-[0.2em]">Strategist Uplink</h3>
                </div>
            </div>

            <div className="h-10 overflow-hidden relative z-10 flex items-center">
                <AnimatePresence mode='wait'>
                    <motion.p 
                    key={insight}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                    className="text-emerald-100 font-mono text-sm truncate flex items-center gap-2"
                    >
                    <span className="text-emerald-600 font-bold">{">"}</span> {insight}
                    </motion.p>
                </AnimatePresence>
            </div>
        </div>
    </div>
  );
}