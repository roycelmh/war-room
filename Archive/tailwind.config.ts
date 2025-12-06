import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // <--- This line is vital
  ],
  theme: {
    extend: {
      colors: {
        zinc: { 950: '#09090b', 900: '#18181b', 800: '#27272a' },
        emerald: { 400: '#34d399', 500: '#10b981', 950: '#022c22' },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;