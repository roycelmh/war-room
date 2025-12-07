'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

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
    <div className="relative w-full h-[350px] p-6 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 overflow-hidden group shadow-[0_0_40px_rgba(16,185,129,0.05)]">
       {/* Ambient Grid Background */}
       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
       <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
       
       {/* Scanning Line Animation */}
       <motion.div 
         className="absolute top-0 bottom-0 w-[2px] bg-emerald-500/50 z-0 shadow-[0_0_15px_#10b981]"
         animate={{ left: ['0%', '100%'], opacity: [0, 1, 0] }}
         transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
       />

       <div className="flex justify-between items-center mb-6 relative z-10">
         <h2 className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-[0.3em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span> 
            Flow State Topology
         </h2>
         <div className="flex gap-4 text-[9px] font-mono text-zinc-500 uppercase">
            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></div>Energy</div>
            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></div>Output</div>
         </div>
       </div>

       <div className="relative z-10 w-full h-[85%]">
         <ResponsiveContainer width="100%" height="100%">
           <AreaChart data={data}>
             <defs>
               <linearGradient id="gradEnergy" x1="0" y1="0" x2="0" y2="1">
                 <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                 <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
               </linearGradient>
               <linearGradient id="gradOutput" x1="0" y1="0" x2="0" y2="1">
                 <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
               </linearGradient>
             </defs>
             <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
             <XAxis 
                dataKey="timestamp" 
                stroke="#333" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(str) => str ? new Date(str).getHours() + 'h' : ''}
             />
             <YAxis hide />
             <Tooltip 
               contentStyle={{ backgroundColor: '#09090b', border: '1px solid #1f2937', borderRadius: '4px', fontSize: '11px', boxShadow: '0 0 20px rgba(0,0,0,0.8)' }}
               itemStyle={{ color: '#e5e7eb' }}
               cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
             />
             <Area 
                type="monotone" 
                dataKey="hrv" 
                stroke="#10b981" 
                strokeWidth={2} 
                fill="url(#gradEnergy)" 
                animationDuration={2000}
             />
             {/* Assuming a secondary metric exists or just overlaying for visual depth */}
             <Area 
                type="monotone" 
                dataKey="productivity_score" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                fill="url(#gradOutput)" 
                animationDuration={2500}
             />
           </AreaChart>
         </ResponsiveContainer>
       </div>
    </div>
  );
}