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
  }, []);

  const StatBar = ({ label, value, color, icon: Icon }: any) => (
    <div className="mb-4 group">
      <div className="flex justify-between items-center mb-1 text-[10px] font-bold tracking-widest uppercase text-zinc-500 group-hover:text-white transition-colors">
        <div className="flex items-center gap-2">
            <Icon className={`w-3 h-3 ${color.text}`} />
            {label}
        </div>
        <span className="font-mono">{Math.round(value)}/100</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} className={`h-full ${color.bg} relative shadow-[0_0_10px_currentColor]`} />
      </div>
    </div>
  );

  return (
    <div className="p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
      <h3 className="text-xs font-bold text-zinc-600 mb-6 tracking-[0.2em] uppercase">Status Check</h3>
      <StatBar label="VIT" value={stats.vit} color={{ bg: 'bg-red-500', text: 'text-red-500' }} icon={Shield} />
      <StatBar label="INT" value={stats.int_stat} color={{ bg: 'bg-blue-500', text: 'text-blue-500' }} icon={Zap} />
      <StatBar label="GLD" value={stats.gld} color={{ bg: 'bg-amber-400', text: 'text-amber-400' }} icon={Coins} />
    </div>
  );
}