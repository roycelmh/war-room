'use client';

import dynamic from 'next/dynamic';
import PulseMonitor from '@/components/PulseMonitor';
import InsightsTicker from '@/components/InsightsTicker';
import MissionControl from '@/components/MissionControl';

// Dynamic Imports for Heavy Charts
const WormholeChart = dynamic(() => import('@/components/WormholeChart'), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-zinc-900/50 rounded-2xl animate-pulse" />
});

const SynapseGraph = dynamic(() => import('@/components/SynapseGraph'), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-zinc-900/50 rounded-2xl animate-pulse" />
});

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 font-sans selection:bg-emerald-500/30">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            WAR ROOM
          </h1>
          <p className="text-zinc-500 font-mono text-sm mt-1">OUROBOROS v11.0 // SYSTEM ONLINE</p>
        </div>
        <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_20px_#10b981]" />
      </header>
      
      <section className="mb-6">
        <MissionControl />
      </section>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Biometrics & Status */}
        <div className="space-y-6">
          <PulseMonitor />
          <InsightsTicker />
        </div>

        {/* Right Column: Visualizations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Row: Wormhole */}
          <WormholeChart />
          
          {/* Bottom Row: Synapse Graph */}
          <SynapseGraph />
        </div>
      </div>

    </main>
  );
}