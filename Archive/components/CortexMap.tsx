'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface CortexMapProps {
  backlog: number;
}

export default function CortexMap({ backlog }: CortexMapProps) {
  // CONFIGURATION
  const SECTOR_SIZE = 50; // Cards per hex
  const GRID_COLS = 8;
  const GRID_ROWS = 4; // Total ~32 hexes visible at once
  const MAX_CAPACITY = GRID_COLS * GRID_ROWS * SECTOR_SIZE; // ~1600 cards visualized

  // LOGIC
  // 1. Calculate how many sectors are "Enemy Occupied"
  const occupiedSectors = Math.ceil(backlog / SECTOR_SIZE);
  // 2. The "Active" sector is the last occupied one (the frontline)
  const activeSectorIndex = occupiedSectors - 1;
  
  // 3. Current Sector Progress (Cards remaining in the active hex)
  const cardsInActiveSector = backlog % SECTOR_SIZE || SECTOR_SIZE;
  const progressPercent = ((SECTOR_SIZE - cardsInActiveSector) / SECTOR_SIZE) * 100;

  // Hexagon Generator (Pointy Top)
  const hexSize = 18;
  const hexWidth = Math.sqrt(3) * hexSize;
  const hexHeight = 2 * hexSize;
  const xSpacing = hexWidth;
  const ySpacing = hexHeight * 0.75;

  const hexes = useMemo(() => {
    return Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, i) => {
      const row = Math.floor(i / GRID_COLS);
      const col = i % GRID_COLS;
      const xOffset = row % 2 === 0 ? 0 : hexWidth / 2;
      
      const x = col * xSpacing + xOffset + hexWidth;
      const y = row * ySpacing + hexHeight;

      // Status Logic
      let status: 'cleared' | 'active' | 'hostile' = 'cleared';
      if (i < activeSectorIndex) status = 'hostile'; // Behind the lines (Fog of War)
      else if (i === activeSectorIndex) status = 'active'; // The Frontline
      else status = 'cleared'; // Empty territory

      return { id: i, x, y, status };
    });
  }, [activeSectorIndex]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* 1. THE GRID (Visual Map) */}
      <svg className="w-full h-[220px] overflow-visible pointer-events-none" viewBox="0 0 300 200">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {hexes.map((hex) => (
          <g key={hex.id} transform={`translate(${hex.x}, ${hex.y})`}>
            {/* Hex Polygon */}
            <motion.path
              d={`M 0 ${-hexSize} L ${hexWidth/2} ${-hexSize/2} L ${hexWidth/2} ${hexSize/2} L 0 ${hexSize} L ${-hexWidth/2} ${hexSize/2} L ${-hexWidth/2} ${-hexSize/2} Z`}
              className="transition-all duration-500"
              initial={false}
              animate={{
                fill: hex.status === 'active' ? '#3b82f6' : hex.status === 'hostile' ? '#ef4444' : '#10b981',
                fillOpacity: hex.status === 'active' ? 0.8 : hex.status === 'hostile' ? 0.05 : 0.05,
                stroke: hex.status === 'active' ? '#60a5fa' : hex.status === 'hostile' ? '#7f1d1d' : '#059669',
                strokeOpacity: hex.status === 'active' ? 1 : 0.2,
                scale: hex.status === 'active' ? 1.1 : 0.95,
              }}
              filter={hex.status === 'active' ? 'url(#glow)' : ''}
              strokeWidth={1.5}
            />
            
            {/* Active Sector Label */}
            {hex.status === 'active' && (
               <foreignObject x={-hexWidth/2} y={-hexSize} width={hexWidth} height={hexHeight}>
                  <div className="flex items-center justify-center w-full h-full">
                     <span className="text-[6px] font-black text-black">TGT</span>
                  </div>
               </foreignObject>
            )}
          </g>
        ))}
      </svg>

      {/* 2. THE HUD (Data Overlay) */}
      <div className="absolute bottom-4 left-0 w-full px-6 flex justify-between items-end">
        <div>
           <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
             Frontline Status
           </div>
           <div className="text-3xl font-black text-white flex items-baseline gap-2">
             {/* Instead of 2458, we show the ACTIVE BATCH count */}
             {cardsInActiveSector} <span className="text-sm font-mono text-zinc-600 font-normal">/ 50 Hostiles</span>
           </div>
        </div>
        
        <div className="text-right">
           <div className="text-[10px] text-blue-400 font-mono mb-1 animate-pulse">
              SECTOR {occupiedSectors} ENGAGED
           </div>
           {/* Mini Progress Bar for CURRENT SECTOR */}
           <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                 className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
                 initial={{ width: 0 }}
                 animate={{ width: `${progressPercent}%` }}
              />
           </div>
        </div>
      </div>
    </div>
  );
}