'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Shield, Zap, Coins } from 'lucide-react';

export default function PlayerStats() {
  const [stats, setStats] = useState({ vit: 50, int_stat: 0, gld: 100 });

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.from('vw_player_stats').select('*').single();
      if (data) setStats(data);
    };
    fetchStats();
    
    // Subscribe to changes (Optional optimization: refresh on focus)
  }, []);

  const StatBar = ({ label, value, color, icon: Icon }: any) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1 text-xs font-bold tracking-widest uppercase text-zinc-500">
        <div className="flex items-center gap-2">
            <Icon className={`w-3 h-3 ${color.text}`} />
            {label}
        </div>
        <span className="text-white font-mono">{Math.round(value)}/100</span>
      </div>
      <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${color.bg} relative`}
        >
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-r from-transparent to-white/20" />
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className="p-6 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      <h3 className="text-xs font-bold text-zinc-600 mb-6 tracking-[0.2em] uppercase">Player Status</h3>
      
      <StatBar label="VIT (Health)" value={stats.vit} color={{ bg: 'bg-red-500 shadow-[0_0_10px_#ef4444]', text: 'text-red-500' }} icon={Shield} />
      <StatBar label="INT (Focus)" value={stats.int_stat} color={{ bg: 'bg-blue-500 shadow-[0_0_10px_#3b82f6]', text: 'text-blue-500' }} icon={Zap} />
      <StatBar label="GLD (Resources)" value={stats.gld} color={{ bg: 'bg-amber-400 shadow-[0_0_10px_#fbbf24]', text: 'text-amber-400' }} icon={Coins} />
    </div>
  );
}