'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// === CONFIGURATION: PASTE YOUR SIGIL URLS HERE ===
const SIGILS: Record<string, string> = {
  Body: 'https://facdqpgcuiiyimmrcsfk.supabase.co/storage/v1/object/public/apex_cards/sigil_iron.png',
  Mind: 'https://facdqpgcuiiyimmrcsfk.supabase.co/storage/v1/object/public/apex_cards/sigil_azure.png',
  Heart: 'https://facdqpgcuiiyimmrcsfk.supabase.co/storage/v1/object/public/apex_cards/sigil_pale.png',
};

interface HoloCardProps {
  item: any;
  isCommander?: boolean;
  onClick?: () => void;
}

export function HoloCard({ item, isCommander, onClick }: HoloCardProps) {
  const gen = item.apex_generals;
  const isSSR = gen.rarity === 'SSR';
  const isUR = gen.rarity === 'UR';
  const affinity = gen.affinity as keyof typeof SIGILS;

  // --- 3D TILT PHYSICS ---
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Physics settings: Stiffness/Damping controls the "weight" of the card
  const mouseX = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseY = useSpring(y, { stiffness: 300, damping: 30 });

  // Map mouse movement to rotation degrees
  // Commander rotates less (heavier), Cards rotate more (lighter)
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [isCommander ? 5 : 15, isCommander ? -5 : -15]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [isCommander ? -5 : -15, isCommander ? 5 : 15]);

  // Dynamic Sheen Position (Opposite to mouse)
  const sheenX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
  const sheenY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = e.clientX - rect.left;
    const mouseYPos = e.clientY - rect.top;
    
    // Calculate normalized position (-0.5 to 0.5)
    const xPct = (mouseXPos / width) - 0.5;
    const yPct = (mouseYPos / height) - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Base Styles
  const rarityStyles = isUR
   ? 'border-transparent ring-1 ring-purple-500/50 bg-[#0a0a0a]'
    : isSSR
   ? 'gold-pulse bg-[#0a0a0a]'
    : 'border border-neutral-800 bg-[#0a0a0a]/90 hover:border-neutral-600';

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      layoutId={isCommander ? `commander-${item.id}` : `card-${item.id}`}
      whileHover={{ scale: 1.05, z: 50 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative rounded-xl overflow-hidden cursor-pointer transition-shadow duration-300 shadow-xl perspective-1000",
        isCommander ? "h-[500px] w-full shadow-2xl z-20" : "h-72 w-full",
        rarityStyles
      )}
      onClick={onClick}
    >
      {/* 1. IMAGE LAYER */}
      <div 
        className="absolute inset-0 overflow-hidden bg-neutral-900"
        style={{ transform: "translateZ(0px)" }} // Fixes Safari flickering
      >
        {gen.image_url ? (
          <Image 
            src={gen.image_url} 
            alt={gen.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
            priority={isCommander}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-700 font-mono text-xs tracking-widest">
            // NO SIGNAL //
          </div>
        )}
        
        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent z-10" />
      </div>

      {/* 2. SIGIL WATERMARK (Parallax Effect) */}
      <div 
        className="absolute top-0 right-0 p-4 opacity-30 group-hover:opacity-100 transition-opacity duration-500 z-20 pointer-events-none"
        style={{ transform: "translateZ(20px)" }} // Pops out in 3D
      >
         <img 
           src={SIGILS[affinity]} 
           alt={affinity} 
           className="w-20 h-20 object-contain mix-blend-overlay filter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" 
         />
      </div>

      {/* 3. DYNAMIC HOLOGRAPHIC OVERLAY (UR Only) */}
      {isUR && (
        <motion.div 
          className="absolute inset-0 z-30 opacity-0 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none mix-blend-color-dodge"
          style={{
            background: "linear-gradient(105deg, transparent 20%, rgba(255, 215, 0, 0.3) 40%, rgba(255, 0, 128, 0.3) 60%, transparent 80%)",
            backgroundPositionX: sheenX,
            backgroundPositionY: sheenY,
            backgroundSize: "200% 200%",
          }}
        />
      )}
      
      {/* 4. STATIC FOIL (Always visible for UR) */}
      {isUR && <div className="holo-foil absolute inset-0 z-20 opacity-30 mix-blend-overlay pointer-events-none" />}

      {/* 5. INFO LAYER (Pop-out 3D) */}
      <div 
        className="absolute bottom-0 inset-x-0 p-5 z-40 flex flex-col gap-2"
        style={{ transform: "translateZ(30px)" }} // Floating text
      >
        <div className="flex justify-between items-end border-b border-white/10 pb-3 mb-1">
          <div className="flex flex-col">
            <span className="text-[9px] font-black tracking-[0.2em] text-neutral-500 uppercase mb-1 drop-shadow-md">
              {gen.role}
            </span>
            <h3 className={cn(
              "font-black tracking-tighter text-white uppercase italic transform -skew-x-6 drop-shadow-xl",
              isCommander ? "text-3xl" : "text-xl"
            )}>
              {gen.name}
            </h3>
          </div>
          <Badge rarity={gen.rarity} />
        </div>
        
        <div className="flex justify-between items-center text-[10px] font-mono tracking-widest uppercase">
           <div className="flex items-center gap-2">
             <div className={cn("w-2 h-2 rounded-full animate-pulse", getAffinityColor(gen.affinity).split(' ')[0].replace('text', 'bg'))} />
             <span className="text-neutral-300 drop-shadow-md">{gen.affinity}</span>
           </div>
           
           <div className="flex items-center gap-1 text-neutral-500">
             <span>SYNC</span>
             <span className="text-cyan-400 font-bold drop-shadow-md">{Math.min(100, item.level * 10)}%</span>
           </div>
        </div>

        <div className="w-full bg-black/50 h-1 rounded-full overflow-hidden mt-1 backdrop-blur-sm border border-white/5">
            <div 
              className={cn("h-full transition-all duration-1000", getAffinityColor(gen.affinity).split(' ')[0].replace('text', 'bg'))} 
              style={{ width: `${(item.bond_xp % 100)}%` }} 
            />
        </div>
      </div>
    </motion.div>
  );
}

// ... Keep your Badge and getAffinityColor functions exactly as they were ...
function Badge({ rarity }: { rarity: string }) {
  const styles = {
    R:  'bg-neutral-800 text-neutral-400 border-neutral-700',
    SR: 'bg-slate-800 text-slate-300 border-slate-500 shadow-[0_0_10px_rgba(148,163,184,0.3)]',
    SSR:'bg-amber-900/90 text-amber-100 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.4)]',
    UR: 'bg-purple-900/90 text-purple-100 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.5)]'
  };
  
  return (
    <span className={cn(
      "text-[10px] font-black px-2 py-1 rounded border backdrop-blur-md shadow-lg",
      styles[rarity as keyof typeof styles] || styles.R
    )}>
      {rarity}
    </span>
  );
}

function getAffinityColor(affinity: string) {
    if (affinity === 'Body') return 'text-red-500 border-red-900';
    if (affinity === 'Mind') return 'text-blue-500 border-blue-900';
    if (affinity === 'Heart') return 'text-emerald-500 border-green-900';
    return 'text-neutral-400 border-neutral-800';
}