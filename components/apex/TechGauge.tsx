import React from 'react';
import { cn } from '@/lib/utils';

type GaugeProps = {
  label: string;
  value: number;
  max?: number;
  color: 'red' | 'blue' | 'green' | 'gold';
};

export function TechGauge({ label, value, max = 10, color }: GaugeProps) {
  const styles = {
    red: { active: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]', inactive: 'bg-red-900/20', text: 'text-red-400' },
    blue: { active: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]', inactive: 'bg-cyan-900/20', text: 'text-cyan-400' },
    green: { active: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]', inactive: 'bg-emerald-900/20', text: 'text-emerald-400' },
    gold: { active: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]', inactive: 'bg-amber-900/20', text: 'text-amber-400' },
  };

  const currentStyle = styles[color];
  const segments = Array.from({ length: max });

  return (
    <div className="flex flex-col gap-1 min-w-[100px]">
      <div className="flex justify-between items-end px-1">
        <span className="text-[9px] font-black tracking-[0.2em] text-neutral-500 uppercase">{label}</span>
        <span className={cn("text-xs font-mono font-bold", currentStyle.text)}>
          {value || 0}/{max}
        </span>
      </div>

      <div className="flex gap-1 bg-neutral-900/80 p-1 rounded-sm border border-white/5 backdrop-blur-sm">
        {segments.map((_, i) => (
          <div 
            key={i}
            className={cn(
              "h-1.5 w-full rounded-[1px] transform -skew-x-12 transition-all duration-300",
              i < (value || 0) ? currentStyle.active : currentStyle.inactive
            )}
          />
        ))}
      </div>
    </div>
  );
}