'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ShieldCheck, Fingerprint, Cpu } from 'lucide-react';

export default function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Timeline of the boot sequence
    const timers = [
      setTimeout(() => setStep(1), 1000), // Show Bio-Auth
      setTimeout(() => setStep(2), 2500), // Show System Logo
      setTimeout(() => setStep(3), 4000), // Access Granted
      setTimeout(() => onComplete(), 4800), // Fade out
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center font-mono text-emerald-500 overflow-hidden"
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8 }}
    >
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md text-center">
        
        {/* STEP 0: INITIALIZING */}
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div 
              key="init"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <Cpu className="w-12 h-12 animate-pulse text-emerald-600" />
              <div className="text-xs tracking-[0.5em] animate-pulse">INITIALIZING KERNEL...</div>
              <div className="w-64 h-1 bg-zinc-900 rounded-full overflow-hidden mt-4">
                <motion.div 
                  className="h-full bg-emerald-500"
                  initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 0.8, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          )}

          {/* STEP 1: BIO-AUTH */}
          {step === 1 && (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <Fingerprint className="w-16 h-16 text-emerald-500 animate-pulse" />
                <motion.div 
                  className="absolute inset-0 border-t-2 border-emerald-400 opacity-50"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <div className="text-sm tracking-widest text-emerald-400">SCANNING BIOMETRICS...</div>
              <div className="font-bold text-xl text-white">IDENTITY: ROYCE</div>
            </motion.div>
          )}

          {/* STEP 2 & 3: SYSTEM LOGO */}
          {step >= 2 && (
            <motion.div 
              key="logo"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-emerald-600 drop-shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                OUROBOROS
              </h1>
              <motion.div 
                initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1 }}
                className="h-[1px] bg-emerald-500 w-full my-4"
              />
              <div className="flex items-center gap-2 text-emerald-400 tracking-[0.3em] text-sm">
                <ShieldCheck className="w-4 h-4" />
                SYSTEM {step === 3 ? "ONLINE" : "LOADING"}
              </div>
              
              {step === 3 && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mt-8 px-4 py-1 border border-emerald-500/50 rounded text-xs bg-emerald-500/10"
                >
                  ACCESS GRANTED
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}