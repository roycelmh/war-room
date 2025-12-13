import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BeastProps {
  threat: any; // The active threat row from DB
}

export function EntropyBeast({ threat }: BeastProps) {
  const beast = threat.apex_bestiary;
  const hp = threat.current_hp;
  const maxHp = beast.hp_max;
  const percentage = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  return (
    <div className="relative z-40 w-full flex flex-col items-center justify-center">
       
       {/* 1. THE CARD CONTAINER */}
       <motion.div 
         initial={{ scale: 0.9, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         className="relative w-full bg-black border-4 border-red-600 shadow-[0_0_80px_rgba(220,38,38,0.6)] rounded-xl overflow-hidden group animate-glitch"
       >
          {/* Scanline Overlay */}
          <div className="scan-line-overlay" />
          
          {/* 2. GLITCH IMAGE LAYER */}
          <div className="h-96 w-full relative overflow-hidden bg-red-950">
             {/* Red Noise Background */}
             <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
             
             {beast.image_url ? (
               <Image 
                 src={beast.image_url} 
                 alt={beast.name}
                 fill
                 className="object-cover opacity-90 mix-blend-luminosity contrast-150"
               />
             ) : (
               <div className="flex items-center justify-center h-full text-red-500 font-mono text-2xl animate-pulse">NO_SIGNAL</div>
             )}
             
             {/* Vignette */}
             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>

          {/* 3. INFO & HP LAYER */}
          <div className="p-6 bg-red-950 text-red-100 relative overflow-hidden border-t-2 border-red-600">
             
             {/* Scrolling Error Code Background */}
             <div className="absolute inset-0 opacity-10 text-[8px] font-mono leading-3 break-all pointer-events-none select-none text-red-500">
                {Array(60).fill("FATAL_ERROR_ENTROPY_DETECTED_SYSTEM_CORRUPTION_").join(" ")}
             </div>

             <div className="relative z-10">
               <div className="flex justify-between items-start mb-2">
                 <div>
                   <h2 className="text-2xl font-black uppercase tracking-tighter text-white drop-shadow-[2px_2px_0px_rgba(255,0,0,1)]">
                      {beast.title}
                   </h2>
                   <p className="text-[10px] font-mono text-red-400 uppercase tracking-widest">
                     CODE: {beast.name}
                   </p>
                 </div>
                 <div className="bg-red-600 text-black font-bold text-xs px-2 py-1 rounded animate-pulse">
                   ACTIVE THREAT
                 </div>
               </div>

               {/* HEALTH BAR */}
               <div className="w-full h-6 bg-black/80 rounded border border-red-500/50 overflow-hidden relative mt-4">
                  {/* Stripes Pattern */}
                  <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,0,0,0.5)_25%,rgba(255,0,0,0.5)_50%,transparent_50%,transparent_75%,rgba(255,0,0,0.5)_75%,rgba(255,0,0,0.5)_100%)] bg-[length:10px_10px]" />
                  
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-gradient-to-r from-red-800 to-red-500 shadow-[0_0_20px_red]"
                  />
               </div>
               
               <div className="flex justify-between mt-2 text-xs font-bold font-mono text-red-300">
                  <span>INTEGRITY</span>
                  <span className="animate-pulse">{hp} / {maxHp}</span>
               </div>
             </div>
          </div>
       </motion.div>
    </div>
  );
}