'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

// 1. Define Types (Teach TS what a "Node" and "Edge" look like)
type GraphNode = {
  id: string;
  name: string;
  group: string;
};

type GraphLink = {
  source: string;
  target: string;
  name: string;
};

type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
};

// 2. Dynamic Import (No SSR)
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { 
  ssr: false 
});

export default function SynapseGraph() {
  // 3. Fix State Type (Tell it to expect GraphData)
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  
  // Fix Ref Type
  const fgRef = useRef<any>(null);

  useEffect(() => {
    const fetchGraph = async () => {
      const { data: nodes } = await supabase
        .from('memory_nodes')
        .select('id, name, type')
        .limit(50); 

      const { data: edges } = await supabase
        .from('memory_edges')
        .select('source_id, target_id, relation')
        .limit(100);

      if (nodes && edges) {
        // Map to our defined Types
        const formattedNodes: GraphNode[] = nodes.map((n: any) => ({ 
          id: n.id, 
          name: n.name, 
          group: n.type 
        }));
        
        const formattedLinks: GraphLink[] = edges.map((e: any) => ({ 
          source: e.source_id, 
          target: e.target_id, 
          name: e.relation 
        }));
        
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
      
      {/* 4. Silence the Library Type Error (The @ts-ignore is the magic fix here) */}
      {/* @ts-ignore */}
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
        onEngineStop={() => {
            if (fgRef.current) {
                fgRef.current.zoomToFit(400);
            }
        }}
      />
    </div>
  );
}