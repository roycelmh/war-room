'use client';
// Ouroboros v5 Upgrade
import dynamic from 'next/dynamic';
import PulseMonitor from '@/components/PulseMonitor';
import MissionControl from '@/components/MissionControl';
import InsightsTicker from '@/components/InsightsTicker';
import PlayerStats from '@/components/PlayerStats';
import QuestLog from '@/components/QuestLog';

// Dynamic Imports
const WormholeChart = dynamic(() => import('@/components/WormholeChart'), { 
  ssr: false,
  loading: () => <div className="h-[350px] w-full bg-zinc-900/50 rounded-xl animate-pulse border border-zinc-800" />
});

const SynapseGraph = dynamic(() => import('@/components/SynapseGraph'), { 
  ssr: false,
  loading: () => <div className="h-[350px] w-full bg-zinc-900/50 rounded-xl animate-pulse border border-zinc-800" />
});

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-6 font-sans selection:bg-emerald-500/30 pb-20">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-white">
            WAR ROOM
          </h1>
          <p className="text-zinc-500 font-mono text-xs">OUROBOROS v11.0 // ONLINE</p>
        </div>
        <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
        </div>
      </header>

      {/* 1. MISSION CONTROL (Top Priority) */}
      <section className="mb-6">
        <MissionControl />
      </section>

      {/* 2. MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: PLAYER STATS (3 Cols) */}
        <div className="lg:col-span-3 space-y-6">
          <PlayerStats />
          <PulseMonitor />
        </div>

        {/* MIDDLE COLUMN: VISUALIZATIONS (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          <WormholeChart />
          <SynapseGraph />
        </div>

        {/* RIGHT COLUMN: QUESTS & INSIGHTS (3 Cols) */}
        <div className="lg:col-span-3 space-y-6">
          <QuestLog />
          <InsightsTicker />
        </div>
      </div>
    </main>
  );
}