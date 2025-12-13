import React from 'react';

export const AtmosphericVoid = () => {
  return (
    <div className="fixed inset-0 z-[-1] bg-[#030305] overflow-hidden pointer-events-none">
      
      {/* 1. The Perspective Grid */}
      <div 
        className="absolute inset-0 opacity-20 animate-grid-flow"
        style={{
          backgroundImage: `
            linear-gradient(rgba(50, 200, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(50, 200, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          transform: 'perspective(500px) rotateX(60deg) translateY(-100px) scale(3)',
          transformOrigin: 'top center',
        }}
      />
      
      {/* 2. The Horizon Glow */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-blue-900/10 via-transparent to-transparent opacity-50" />

      {/* 3. The Fog/Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(3,3,5,0.6)_60%,rgba(3,3,5,1)_100%)]" />
      
      {/* 4. Scanlines */}
      <div className="absolute inset-0 z-10 opacity-[0.03] pointer-events-none mix-blend-overlay"
           style={{
             backgroundImage: 'linear-gradient(to bottom, transparent 50%, black 50%)',
             backgroundSize: '100% 4px',
           }}
      />
    </div>
  );
};