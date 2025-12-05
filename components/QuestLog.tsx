'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';

export default function QuestLog() {
  const [quests, setQuests] = useState<any[]>([]);

  useEffect(() => {
    const fetchQuests = async () => {
      const { data } = await supabase
        .from('quests')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (data) setQuests(data);
    };
    fetchQuests();
  }, []);

  const completeQuest = async (id: string) => {
    // 1. Optimistic UI Update
    setQuests(current => current.filter(q => q.id !== id));
    
    // 2. DB Update
    await supabase.from('quests').update({ status: 'completed' }).eq('id', id);
  };

  return (
    <div className="p-6 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl h-full">
      <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold text-zinc-600 tracking-[0.2em] uppercase">Active Quests</h3>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20">{quests.length} ACTIVE</span>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
            {quests.length === 0 ? (
                <p className="text-zinc-600 text-xs font-mono text-center py-4">NO ACTIVE DIRECTIVES</p>
            ) : quests.map((quest) => (
            <motion.div
                key={quest.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="group flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-emerald-500/50 transition-colors cursor-pointer"
                onClick={() => completeQuest(quest.id)}
            >
                <div>
                    <h4 className="text-sm font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors">{quest.title}</h4>
                    <p className="text-xs text-zinc-500 font-mono">Reward: {quest.xp_reward} XP</p>
                </div>
                <Circle className="w-5 h-5 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
            </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}