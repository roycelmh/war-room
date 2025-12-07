'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Fingerprint, Command, Check } from 'lucide-react';

export default function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 800),  // Bios Check
      setTimeout(() => setStep(2), 2200), // Auth
      setTimeout(() => setStep(3), 3500), // Load Core
      setTimeout(() => onComplete(), 4200), // Done
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center font-mono text-white overflow-hidden"
      exit={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
      {/* Minimal Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg px-8">
        
        <AnimatePresence mode="wait">
          {/* STEP 0: KERNEL LOAD */}
          {step === 0 && (
            <motion.div 
              key="step0"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col gap-2"
            >
              <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-widest">
                <span>Kernel v5.0</span>
                <span>Secure Boot</span>
              </div>
              <div className="h-[1px] w-full bg-zinc-800 overflow-hidden">
                <motion.div 
                  className="h-full bg-white"
                  initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 0.8, ease: "circOut" }}
                />
              </div>
              <div className="text-[10px] text-emerald-500 mt-1">OK_</div>
            </motion.div>
          )}

          {/* STEP 1: AUTHENTICATION */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="relative">
                <div className="absolute inset-0 border border-emerald-500/30 rounded-full animate-ping" />
                <div className="p-4 border border-emerald-500 rounded-full bg-emerald-950/20">
                  <Fingerprint className="w-8 h-8 text-emerald-400" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-xs text-zinc-500 tracking-[0.3em] uppercase">Biometric Scan</div>
                <div className="text-xl font-light tracking-[0.2em] text-white">USER: ROYCE</div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: SYSTEM LOGO (Professional Style) */}
          {step >= 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center gap-2 text-emerald-500 mb-4">
                <Command className="w-5 h-5" />
                <span className="text-[10px] tracking-widest uppercase">System Online</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-thin tracking-[0.15em] text-white mix-blend-difference">
                OUROBOROS
              </h1>
              
              <div className="w-full flex justify-center mt-6">
                 {step === 2 ? (
                    <span className="flex gap-1">
                        <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}/>
                        <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}/>
                        <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}/>
                    </span>
                 ) : (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/20"
                    >
                        <Check className="w-3 h-3" /> INITIALIZED
                    </motion.div>
                 )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}