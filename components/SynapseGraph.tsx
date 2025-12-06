'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import { Share2, Zap, Database, Layers } from 'lucide-react';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

export default function SynapseGraph() {
  const fgRef = useRef<any>(null);
  const [data, setData] = useState({ nodes: [], links: [] });
  const [stats, setStats] = useState({ count: 0, density: "0%" });

  useEffect(() => {
    const fetchGraph = async () => {
        // 1. Fetch Real Data
        const { data: nodes } = await supabase.from('memory_nodes').select('id, name, type').limit(150); 
        const { data: edges } = await supabase.from('memory_edges').select('source_id, target_id').limit(200);

        if (nodes && nodes.length > 0) {
            // @ts-ignore
            setData({ nodes, links: edges.map(e => ({ source: e.source_id, target: e.target_id })) });
            setStats({ count: nodes.length, density: "84%" });
        } else {
            // 2. FALLBACK: "Neural Simulation" (If DB is empty, generate a cool brain effect)
            const N = 80;
            const gData = {
              nodes: [...Array(N).keys()].map(i => ({ id: i, group: i % 3 })),
              links: [...Array(N).keys()].filter(id => id).map(id => ({
                source: id,
                target: Math.round(Math.random() * (id - 1))
              }))
            };
            // @ts-ignore
            setData(gData);
            setStats({ count: N, density: "SIMULATION" });
        }
    };
    fetchGraph();
  }, []);

  return (
    <div className="h-[400px] w-full rounded-2xl border border-white/10 bg-black overflow-hidden relative shadow-[0_0_40px_rgba(0,0,0,0.6)] group">
      
      {/* --- HUD OVERLAY (The "Why") --- */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 pointer-events-none">
        
        {/* Title Block */}
        <div>
            <div className="flex items-center gap-2 mb-1">
                <Share2 className="w-4 h-4 text-emerald-500" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-500">
                    Neural Topography
                </h3>
            </div>
            <div className="flex gap-4">
                <div className="flex flex-col">
                    <span className="text-[9px] text-zinc-500 font-mono uppercase">Node Count</span>
                    <span className="text-sm font-mono text-white leading-none">{stats.count}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] text-zinc-500 font-mono uppercase">Synaptic Density</span>
                    <span className="text-sm font-mono text-emerald-400 leading-none">{stats.density}</span>
                </div>
            </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-[9px] font-mono text-zinc-300 uppercase tracking-wider">Live Render</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-zinc-600 font-mono">
                <Zap className="w-3 h-3" />
                <span>ACTIVITY: HIGH</span>
            </div>
        </div>
      </div>

      {/* --- SCIFI DECORATIONS --- */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none text-[9px] font-mono text-zinc-600 space-y-1">
        <p>X-AXIS: CORTEX_01</p>
        <p>Y-AXIS: MEMORY_BANK</p>
        <p>Z-AXIS: TEMPORAL</p>
      </div>
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%] opacity-20"></div>

      {/* --- THE GRAPH --- */}
      {/* @ts-ignore */}
      <ForceGraph3D
        ref={fgRef}
        graphData={data}
        nodeRelSize={4}
        nodeResolution={16}
        nodeOpacity={0.9}
        // Sci-Fi Colors: Emerald (Knowledge), Blue (Tasks), Purple (Ideas)
        nodeColor={(node: any) => node.group === 0 ? '#10b981' : node.group === 1 ? '#3b82f6' : '#a855f7'}
        
        // CONNECTIONS
        linkColor={() => 'rgba(255,255,255,0.05)'}
        linkWidth={0.5}
        
        // PARTICLES (The "Firing Neurons" effect)
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={1.5}
        linkDirectionalParticleColor={() => '#10b981'} // Emerald particles
        linkDirectionalParticleSpeed={0.005} // Slow, steady flow
        
        backgroundColor="#000000"
        showNavInfo={false}
        enableNodeDrag={false}
        
        // Cinematic Auto-Rotation
        onEngineStop={() => {
            if (fgRef.current) {
                let angle = 0;
                const distance = 180;
                setInterval(() => {
                  angle += 0.0015; // Slow rotation
                  fgRef.current.cameraPosition({
                    x: distance * Math.sin(angle),
                    z: distance * Math.cos(angle)
                  });
                }, 16);
            }
        }}
      />
    </div>
  );
}