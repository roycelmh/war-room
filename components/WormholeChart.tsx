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
        .limit(100); // Last 100 data points (~3-4 days)
      if (points) setData(points);
    };
    loadData();

    // Subscribe for live updates
    const channel = supabase
      .channel('wormhole-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs_performance' }, 
        (payload) => {
            // Add new point (simplified for demo)
            loadData(); // Reload to get correct view logic
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="h-[350px] w-full p-5 rounded-xl border border-zinc-800 bg-black/60 backdrop-blur-md flex flex-col">
       <div className="flex justify-between items-center mb-4">
         <div>
             <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Bio-Output Timeline</h2>
             <p className="text-xs text-zinc-500">Energy Capacity (Green) vs. Work Load (Blue)</p>
         </div>
         <div className="flex gap-4 text-xs font-mono">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Capacity</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Load</div>
         </div>
       </div>

       <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
                <linearGradient id="colorHrv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis 
                dataKey="timestamp" 
                tickFormatter={(str) => new Date(str).getDate() + '/' + (new Date(str).getMonth()+1)}
                stroke="#444" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
            />
            <YAxis hide />
            <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ padding: 0 }}
                labelFormatter={(label) => new Date(label).toLocaleString([], {weekday:'short', hour:'2-digit', minute:'2-digit'})}
            />
            
            {/* HRV (Capacity) - Background Area */}
            <Area 
                type="monotone" 
                dataKey="hrv" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorHrv)" 
                activeDot={{ r: 4, strokeWidth: 0 }}
            />
            
            {/* Productivity (Load) - Overlay Line */}
            <Area 
                type="step" 
                dataKey="productivity_score" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fill="url(#colorProd)"
                strokeDasharray="4 4"
            />
            </AreaChart>
        </ResponsiveContainer>
       </div>
    </div>
  );
}