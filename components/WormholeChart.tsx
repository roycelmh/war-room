'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function WormholeChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const { data: points } = await supabase
        .from('vw_wormhole_points')
        .select('*')
        .order('timestamp', { ascending: true })
        .limit(100);
      if (points) setData(points);
    };
    loadData();
  }, []);

  return (
    <div className="bg-black/40 backdrop-blur-xl border-white/10 shadow-[0_0_15px_rgba(16,185,129,0.1)] relative w-full h-[350px] p-6 rounded-2xl bg-black border border-white/10 overflow-hidden">
       {/* Glow Effect */}
       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-emerald-500 blur-[50px] opacity-20"></div>

       <div className="flex justify-between items-center mb-6 relative z-10">
         <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Flow State Topology</h2>
         <div className="flex gap-4 text-[10px] font-mono text-zinc-500 uppercase">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>Energy</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500/50"></div>Output</div>
         </div>
       </div>

       <ResponsiveContainer width="100%" height="85%">
         <AreaChart data={data}>
           <defs>
             <linearGradient id="gradEnergy" x1="0" y1="0" x2="0" y2="1">
               <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
               <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
             </linearGradient>
             <linearGradient id="gradOutput" x1="0" y1="0" x2="0" y2="1">
               <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
               <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
             </linearGradient>
           </defs>
           
           <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
           
           <XAxis 
             dataKey="timestamp" 
             tickFormatter={(str) => new Date(str).getHours() + 'h'}
             stroke="#444" 
             fontSize={10} 
             tickLine={false}
             axisLine={false}
           />
           <YAxis hide />
           
           <Tooltip 
             contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
           />
           
           <Area 
             type="monotone" 
             dataKey="hrv" 
             stroke="#10b981" 
             strokeWidth={2}
             fill="url(#gradEnergy)" 
           />
           <Area 
             type="monotone" 
             dataKey="productivity_score" 
             stroke="#3b82f6" 
             strokeWidth={2}
             fill="url(#gradOutput)" 
           />
         </AreaChart>
       </ResponsiveContainer>
    </div>
  );
}