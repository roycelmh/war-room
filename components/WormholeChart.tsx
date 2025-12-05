'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid } from 'recharts';

export default function WormholeChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // 1. Load History
    const loadData = async () => {
      const { data: points } = await supabase
        .from('vw_wormhole_points')
        .select('*')
        .limit(100);
      if (points) setData(points);
    };
    loadData();

    // 2. Listen for Live Productivity
    const channel = supabase
      .channel('wormhole-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'logs_performance' },
        (payload) => {
          const newPoint = {
            timestamp: payload.new.timestamp,
            hrv: 50, 
            productivity_score: payload.new.productivity_score || 50,
            energy_score: 0.8
          };
          setData(prev => [...prev.slice(1), newPoint]); 
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="h-[400px] w-full p-4 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md">
       <div className="flex justify-between items-center mb-6">
         <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">The Wormhole (Flow State)</h2>
         <div className="flex gap-2 text-xs">
            <span className="text-emerald-400">● High Energy</span>
            <span className="text-blue-400">● Low Energy</span>
         </div>
       </div>

       <ResponsiveContainer width="100%" height="100%">
         <ScatterChart>
           <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
           <XAxis dataKey="timestamp" tick={false} axisLine={{ stroke: '#333' }} />
           <YAxis dataKey="hrv" domain={[0, 100]} hide />
           <ZAxis dataKey="productivity_score" range={[50, 400]} />
           <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }} />
           <Scatter name="Session" data={data} fill="#10b981" shape="circle" />
         </ScatterChart>
       </ResponsiveContainer>
    </div>
  );
}