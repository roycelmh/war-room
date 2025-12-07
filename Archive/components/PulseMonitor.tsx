'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';

export default function PulseMonitor() {
  const [heartRate, setHeartRate] = useState(65);
  const [status, setStatus] = useState<'Normal' | 'Spike' | 'Critical'>('Normal');

  useEffect(() => {
    console.log("🔌 PulseMonitor: Connecting to Supabase Realtime...");

    const channel = supabase
      .channel('realtime-pulse-debug') // Unique channel name
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'logs_physiology' },
        (payload) => {
          console.log("⚡ REALTIME EVENT RECEIVED:", payload); // DEBUG LOG

          const row = payload.new as any;
          // Normalize keys (handle different capitalizations/aliases)
          const name = (row.metric_name || row.metric || "").toString().toLowerCase();
          const val = Number(row.value);

          if (name.includes('heart') || name.includes('rhr') || name.includes('pulse')) {
            console.log(`❤️ Heart Rate Update: ${val}`);
            setHeartRate(val);
            
            if (val > 110) setStatus('Critical');
            else if (val > 90) setStatus('Spike');
            else setStatus('Normal');
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 Subscription Status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ... (Render logic same as before) ...
  return (
    <div className="relative p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden">
      <AnimatePresence>
        {status === 'Critical' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-600 blur-3xl z-0"
            transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${status === 'Critical' ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Bio-Kernel Pulse</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white font-mono">{heartRate}</span>
              <span className="text-sm text-zinc-400">BPM</span>
            </div>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
          status === 'Normal' ? 'border-emerald-500/50 text-emerald-400' : 'border-red-500/50 text-red-400 animate-pulse'
        }`}>
          {status.toUpperCase()}
        </div>
      </div>
    </div>
  );
}