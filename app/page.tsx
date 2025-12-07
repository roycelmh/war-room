'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence } from 'framer-motion';

// Components
import MissionControl from '@/components/MissionControl';
import PlayerStats from '@/components/PlayerStats';
import PulseMonitor from '@/components/PulseMonitor';
import InsightsTicker from '@/components/InsightsTicker';
import QuestLog from '@/components/QuestLog';
import BootSequence from '@/components/BootSequence';

// Dynamic Imports
const WormholeChart = dynamic(() => import('@/components/WormholeChart'), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-zinc-900/30 rounded-xl animate-pulse" /> 
});
const SynapseGraph = dynamic(() => import('@/components/SynapseGraph'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-zinc-900/30 rounded-xl animate-pulse" />
});

export default function Home() {
  const [showBoot, setShowBoot] = useState(true);

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30 pb-20 overflow-x-hidden">
      
      {/* Boot Sequence */}
      <AnimatePresence>
        {showBoot && <BootSequence onComplete={() => setShowBoot(false)} />}
      </AnimatePresence>

      {!showBoot && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 relative z-10 max-w-[1600px] mx-auto p-4 space-y-6">
          
          {/* Background Grid */}
          <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />

          {/* 1. HEADER (Minimal) */}
          <header className="flex justify-between items-end border-b border-white/10 pb-4">
            <div>
              <h1 className="text-xl font-light tracking-[0.2em] text-white">
                OUROBOROS <span className="text-emerald-500 font-bold">OS</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                <span className="text-[10px] font-mono text-zinc-500 tracking-widest">CONNECTED</span>
            </div>
          </header>

          {/* 2. PRIMARY: MISSION CONTROL */}
          <section>
             <MissionControl /> 
          </section>

          {/* 3. TACTICAL DATA BELT (The "Green Things") */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[280px]">
             
             {/* Left: Pulse & Ticker */}
             <div className="md:col-span-4 flex flex-col gap-6 h-full">
                <div className="flex-1">
                    <PulseMonitor />
                </div>
                <div className="h-auto">
                    <InsightsTicker />
                </div>
             </div>

             {/* Right: Flow State (Wormhole) */}
             <div className="md:col-span-8 h-[280px] md:h-full">
                <WormholeChart />
             </div>
          </section>

          {/* 4. SECONDARY: PLAYER STATS & LOGS */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
             <div className="md:col-span-4 space-y-6">
                <PlayerStats />
                <QuestLog />
             </div>
             <div className="md:col-span-8 h-[400px]">
                <SynapseGraph />
             </div>
          </section>

        </div>
      )}
    </main>
  );
}