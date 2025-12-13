import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your existing colors
        zinc: { 950: '#09090b', 900: '#18181b', 800: '#27272a' },
        emerald: { 400: '#34d399', 500: '#10b981', 950: '#022c22' },
        
        // NEW: Apex War Room Colors
        void: '#050505',
        'tech-red': '#ff0f0f',
        'tech-blue': '#00f0ff',
        'tech-gold': '#ffd700',
      },
      backgroundImage: {
        // NEW: Scanline effect for the War Room
        'scanlines': "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2))",
      },
      animation: {
        // Your existing animation
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        
        // NEW: War Room animations
        'hologram': 'holo-pan 3s ease infinite',
        'grid-flow': 'grid-flow 20s linear infinite',
      },
      // NEW: Keyframes for the War Room
      keyframes: {
        'holo-pan': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        'grid-flow': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 60px' },
        }
      }
    },
  },
  plugins: [],
};
export default config;