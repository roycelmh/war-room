'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

// Force Graph must be imported dynamically with no SSR
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

export default function SynapseGraph() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const fgRef = useRef<any>();

  useEffect(() => {
    const fetchGraph = async () => {
      // 1. Fetch Nodes (Entities)
      const { data: nodes } = await supabase
        .from('memory_nodes')
        .select('id, name, type')
        .limit(50); // Limit for performance

      // 2. Fetch Edges (Relationships)
      const { data: edges } = await supabase
        .from('memory_edges')
        .select('source_id, target_id, relation')
        .limit(100);

      if (nodes && edges) {
        // Format for ForceGraph
        const formattedNodes = nodes.map(n => ({ id: n.id, name: n.name, group: n.type }));
        const formattedLinks = edges.map(e => ({ source: e.source_id, target: e.target_id, name: e.relation }));
        setGraphData({ nodes: formattedNodes, links: formattedLinks });
      }
    };
    fetchGraph();
  }, []);

  return (
    <div className="h-[400px] w-full rounded-2xl border border-white/10 bg-black overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Cortex Topology</h3>
      </div>
      
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeLabel="name"
        nodeAutoColorBy="group"
        linkColor={() => 'rgba(255,255,255,0.2)'}
        backgroundColor="#000000"
        showNavInfo={false}
        nodeRelSize={6}
        cooldownTicks={100}
        onEngineStop={() => fgRef.current.zoomToFit(400)}
      />
    </div>
  );
}