'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

export default function WormholeChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const { data: points } = await supabase
        .from('vw_wormhole_points')
        .select('*')
        .order('timestamp', { ascending: true }) // Ensure correct order
        .limit(50); // Last 50 hours/points
      if (points) setData(points);
    };
    loadData();
  }, []);

  return (
    <div 
  className="h-[300px] w-full p-4 ..." 
  style={{ width: '100%', height: '300px' }} // Explicit size
>
       <div className="flex justify-between items-center mb-4">
         <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Bio-Output Timeline</h2>
       </div>

       <ResponsiveContainer width="100%" height="100%">
         <AreaChart data={data}>
           <defs>
             <linearGradient id="colorHrv" x1="0" y1="0" x2="0" y2="1">
               <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
               <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
             </linearGradient>
           </defs>
           <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
           <XAxis 
             dataKey="timestamp" 
             tickFormatter={(str) => new Date(str).getHours() + 'h'}
             stroke="#555" 
             fontSize={10}
           />
           <YAxis hide />
           <Tooltip 
             contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
             labelFormatter={(label) => new Date(label).toLocaleString()}
           />
           
           {/* Energy Level (HRV) */}
           <Area 
             type="monotone" 
             dataKey="hrv" 
             stroke="#10b981" 
             fillOpacity={1} 
             fill="url(#colorHrv)" 
           />
           
           {/* Productivity Spikes (Overlay) */}
           <Area 
             type="step" 
             dataKey="productivity_score" 
             stroke="#3b82f6" 
             fill="none" 
             strokeDasharray="5 5"
           />
         </AreaChart>
       </ResponsiveContainer>
    </div>
  );
}