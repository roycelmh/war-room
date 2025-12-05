'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function InsightsTicker() {
  const [insight, setInsight] = useState<string>("INITIALIZING CORTEX...");

  useEffect(() => {
    const fetchInsight = async () => {
      const { data } = await supabase
        .from('synapse_insights')
        .select('message')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) setInsight(data.message);
    };
    fetchInsight();
    
    // Subscribe to new insights
    const channel = supabase
      .channel('realtime-insights')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'synapse_insights' }, 
        (payload) => setInsight(payload.new.message)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
      <h3 className="text-xs font-bold uppercase text-emerald-500 mb-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        Strategist Live Feed
      </h3>
      <AnimatePresence mode='wait'>
        <motion.p 
          key={insight}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="text-emerald-100 font-mono text-sm md:text-base"
        >
          {">"} {insight}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}