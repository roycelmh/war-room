'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import { Maximize2 } from 'lucide-react';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

export default function SynapseGraph() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const fgRef = useRef<any>(null);

  useEffect(() => {
    const fetchGraph = async () => {
        // ... (Keep existing fetching logic)
        const { data: nodes } = await supabase.from('memory_nodes').select('id, name, type').limit(100); 
        const { data: edges } = await supabase.from('memory_edges').select('source_id, target_id').limit(150);
        if (nodes && nodes.length > 0) {
            // @ts-ignore
            setGraphData({ nodes: nodes.map(n => ({...n, group: n.type === 'core' ? 1 : 2})), links: edges.map(e => ({ source: e.source_id, target: e.target_id })) });
        } else {
            // Mock data fallback if empty (PRESERVED FOR VISUAL CHECK)
            const N = 50;
            const gData = {
              nodes: [...Array(N).keys()].map(i => ({ id: i, group: Math.floor(Math.random() * 3) })),
              links: [...Array(N).keys()].filter(id => id).map(id => ({ source: id, target: Math.round(Math.random() * (id - 1)) }))
            };
            // @ts-ignore
            setGraphData(gData);
        }
    };
    fetchGraph();
  }, []);

  return (
    <div className="h-[400px] w-full rounded-2xl border border-white/10 bg-black overflow-hidden relative shadow-2xl group">
      {/* Holographic Overlay Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="absolute inset-0 border-[0.5px] border-white/5 rounded-2xl pointer-events-none z-10"></div>
      
      {/* Header Label */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]"></span>
        <h3 className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-500">
            Cortex Topology
        </h3>
      </div>

      {/* Interactive Controls Overlay */}
      <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white/70">
              <Maximize2 className="w-3 h-3" />
          </button>
      </div>
      
      {/* The 3D Graph */}
      {/* @ts-ignore */}
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeRelSize={4}
        nodeResolution={16}
        nodeOpacity={0.9}
        // Custom coloring based on the Sci-Fi theme
        nodeColor={(node: any) => node.group === 1 ? '#10b981' : node.group === 2 ? '#3b82f6' : '#a855f7'}
        linkColor={() => 'rgba(255,255,255,0.15)'}
        linkWidth={0.5}
        backgroundColor="#000000"
        showNavInfo={false}
        enableNodeDrag={false}
        // Gentle Auto-Rotation Script
        onEngineStop={() => {
            if (fgRef.current) {
                let angle = 0;
                const distance = 200;
                setInterval(() => {
                  angle += 0.002;
                  fgRef.current.cameraPosition({
                    x: distance * Math.sin(angle),
                    z: distance * Math.cos(angle)
                  });
                }, 20);
            }
        }}
      />
    </div>
  );
}