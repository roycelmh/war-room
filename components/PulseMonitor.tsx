'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, HeartPulse } from 'lucide-react';

export default function PulseMonitor() {
  const [heartRate, setHeartRate] = useState(65);
  const [status, setStatus] = useState<'Normal' | 'Spike' | 'Critical'>('Normal');

  useEffect(() => {
    // ... (Your logic preserved exactly as requested)
    const channel = supabase.channel('realtime-pulse-v2')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs_physiology' }, (payload) => {
          const row = payload.new as any;
          const name = (row.metric_name || row.metric || "").toString().toLowerCase();
          const val = Number(row.value);
          if (name.includes('heart') || name.includes('pulse')) {
            setHeartRate(val);
            if (val > 110) setStatus('Critical');
            else if (val > 90) setStatus('Spike');
            else setStatus('Normal');
          }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className={`relative p-6 rounded-2xl border bg-black/60 backdrop-blur-xl overflow-hidden h-32 flex flex-col justify-between transition-colors duration-500 ${
        status === 'Critical' ? 'border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'border-white/10 shadow-[0_0_30px_rgba(16,185,129,0.05)]'
    }`}>
      
      {/* Dynamic Background Pulse */}
      <div className={`absolute inset-0 opacity-10 transition-colors duration-500 ${status === 'Critical' ? 'bg-red-500' : 'bg-emerald-500'}`} />
      
      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded bg-white/5 ${status === 'Critical' ? 'text-red-500' : 'text-emerald-500'}`}>
                <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-500">Bio-Kernel Pulse</h3>
        </div>
        <div className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border backdrop-blur-sm ${
            status === 'Critical' ? 'border-red-500/50 text-red-400 bg-red-950/30' : 'border-emerald-500/50 text-emerald-400 bg-emerald-950/30'
        }`}>
          {status.toUpperCase()}
        </div>
      </div>

      <div className="flex items-end justify-between relative z-10 mt-2">
        <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-lg">{heartRate}</span>
            <span className="text-[10px] text-zinc-500 font-mono mb-1.5">BPM</span>
        </div>
        
        {/* SVG EKG Animation */}
        <div className="w-32 h-12 relative overflow-hidden flex items-end">
            <svg viewBox="0 0 100 40" className="w-full h-full drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                <motion.path
                    d="M0 20 L15 20 L20 10 L25 30 L30 20 L40 20 L45 5 L50 35 L55 20 L100 20"
                    fill="none"
                    stroke={status === 'Critical' ? '#ef4444' : '#10b981'}
                    strokeWidth="2"
                    initial={{ pathLength: 0, opacity: 0, x: -50 }}
                    animate={{ pathLength: 1, opacity: [0, 1, 1, 0], x: 0 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
            </svg>
        </div>
      </div>
    </div>
  );
}