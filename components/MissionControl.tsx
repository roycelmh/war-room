'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
// FIXED IMPORTS: Added 'AlertTriangle' explicitly
import { Target, Activity, ChevronRight, Eye, EyeOff, Crosshair, Cloud, CloudRain, Sun, Wind, MapPin, Navigation, Droplets, AlertTriangle, CheckCircle, Zap, Moon, Sword, Fingerprint, Power } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---
type MissionData = { title: string; endTime: string; status: 'Active' | 'Pending' };
type AnkiData = { backlog: number; reviews: number };
type HostileData = { count: number; max: number; status: string };
type WeatherData = { temp: number; place: string; iconIndex: number; humidity: number; tips: string[] };
type BioMetric = { label: string; value: string; type: 'sleep' | 'hrv' | 'risk' | 'verdict' | 'neutral' };

const STATIONS = [
  { name: 'Hong Kong Observatory', lat: 22.302, lon: 114.174 },
  { name: 'Tai Po', lat: 22.446, lon: 114.179 },
  { name: 'Sha Tin', lat: 22.403, lon: 114.210 },
];

export default function MissionControl() {
  const [mode, setMode] = useState<'NORMAL' | 'WAR TIME'>('NORMAL');
  const [ecoMode, setEcoMode] = useState(false); 
  const [locationLocked, setLocationLocked] = useState(false);
  
  const [mission, setMission] = useState<MissionData>({ title: "INITIALIZING...", endTime: "--:--", status: 'Pending' });
  const [anki, setAnki] = useState<AnkiData>({ backlog: 0, reviews: 0 });
  const [hostiles, setHostiles] = useState<HostileData>({ count: 0, max: 50, status: 'SCANNING' });
  const [bioMetrics, setBioMetrics] = useState<BioMetric[]>([]);
  const [weather, setWeather] = useState<WeatherData>({ temp: 0, place: 'SCANNING...', iconIndex: 50, humidity: 0, tips: [] });

  // --- PARSER ---
  const parseBioData = (rawText: string) => {
    let clean = rawText.replace(/[*#>•]/g, ' ').replace(/\s+/g, ' ').trim();
    const metrics: BioMetric[] = [];
    const findValue = (key: string, nextKey?: string) => {
        const regex = new RegExp(`${key}[:\\s]+`, 'i');
        const match = clean.match(regex);
        if (!match || match.index === undefined) return null;
        const start = match.index + match[0].length;
        let end = clean.length;
        if (nextKey) {
            const nextRegex = new RegExp(`${nextKey}[:\\s]+`, 'i');
            const nextMatch = clean.match(nextRegex);
            if (nextMatch && nextMatch.index) end = nextMatch.index;
        }
        let val = clean.substring(start, end).trim();
        if (val.endsWith('.') || val.endsWith(';')) val = val.slice(0, -1);
        if (val.length > 70) val = val.split('(')[0].trim(); 
        return val;
    };

    const sleepVal = findValue('Sleep', 'HRV');
    if (sleepVal) metrics.push({ label: 'SLEEP', value: sleepVal, type: 'sleep' });
    const hrvVal = findValue('HRV', 'Risks');
    if (hrvVal) metrics.push({ label: 'HRV', value: hrvVal, type: 'hrv' });
    const riskVal = findValue('Risks', 'Verdict');
    if (riskVal) metrics.push({ label: 'RISKS', value: riskVal, type: 'risk' });
    const verdictVal = findValue('Verdict');
    if (verdictVal) metrics.push({ label: 'VERDICT', value: verdictVal, type: 'verdict' });

    if (metrics.length === 0) metrics.push({ label: 'STATUS', value: "Data Unformatted", type: 'neutral' });
    return metrics;
  };

  // --- HELPERS ---
  const getNearestStation = (lat: number, lon: number) => {
    let minDistance = Infinity;
    let nearest = STATIONS[0].name;
    STATIONS.forEach(station => {
      const dist = Math.sqrt(Math.pow(station.lat - lat, 2) + Math.pow(station.lon - lon, 2));
      if (dist < minDistance) { minDistance = dist; nearest = station.name; }
    });
    return nearest;
  };

  const generateWeatherTips = (temp: number, icon: number, isCombat: boolean) => {
    let tips = [];
    if (icon >= 60) tips.push(isCombat ? "DEPLOY ION SHIELD" : "Bring Umbrella");
    if (temp < 15) tips.push(isCombat ? "THERMAL ARMOR REQ" : "Wear Coat");
    else if (temp < 20) tips.push(isCombat ? "LIGHT PLATING" : "Light Jacket");
    else if (temp > 30) tips.push(isCombat ? "COOLANT FLUSH REQ" : "Hydrate");
    if (icon === 51 || icon === 52) tips.push(isCombat ? "OCULAR SHIELDING" : "Sunglasses");
    if (tips.length === 0) tips.push(isCombat ? "CONDITIONS OPTIMAL" : "Weather Good");
    return tips;
  };

  // --- FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      const { data: cal } = await supabase.from('calendar_cache').select('*').limit(1).single();
      if (cal) {
        const now = new Date();
        const isHappening = now >= new Date(cal.start_time) && now < new Date(cal.end_time);
        setMission({ 
          title: cal.event_title, 
          endTime: new Date(cal.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: isHappening ? 'Active' : 'Pending' 
        });
      }
      const { data: deck } = await supabase.from('logs_performance').select('value').eq('metric_name', 'Anki_Backlog').order('timestamp', { ascending: false }).limit(1).single();
      if (deck) { setAnki(p => ({...p, backlog: deck.value})); setHostiles({count: Math.min(deck.value, 50), max: 50, status: 'ENGAGED'}); }

      const { data: physio } = await supabase.from('logs_physiology').select('raw_data').eq('metric_name', 'Health_Advice').order('timestamp', { ascending: false }).limit(1).single();
      if (physio?.raw_data) {
        setBioMetrics(parseBioData(physio.raw_data.analysis_summary || physio.raw_data.advice));
      } else {
        setBioMetrics(parseBioData("Sleep: 6.8h HRV: 58 Risks: Low attention Verdict: Stable"));
      }

      const fetchWeather = async (lat?: number, lon?: number) => {
          try {
            const res = await fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en');
            const data = await res.json();
            let targetPlace = 'Hong Kong Observatory';
            if (lat && lon) {
                targetPlace = getNearestStation(lat, lon);
                setLocationLocked(true);
            }
            const stationData = data.temperature.data.find((s: any) => s.place === targetPlace) || data.temperature.data[0];
            setWeather({ 
                temp: stationData.value, 
                place: targetPlace, 
                iconIndex: data.icon ? data.icon[0] : 50,
                humidity: data.humidity?.data?.[0]?.value || 75, 
                tips: generateWeatherTips(stationData.value, data.icon?.[0], mode === 'WAR TIME')
            });
          } catch (e) {
              setWeather(prev => ({ ...prev, temp: 25, place: 'Offline Mode', tips: ['Sensors Offline'] }));
          }
      };
      
      const locationTimeout = setTimeout(() => { if (weather.temp === 0) fetchWeather(); }, 4000);
      navigator.geolocation.getCurrentPosition((position) => {
          clearTimeout(locationTimeout);
          fetchWeather(position.coords.latitude, position.coords.longitude);
      }, (err) => {
          clearTimeout(locationTimeout);
          fetchWeather(); 
      });
    };
    fetchData();
  }, []); 

  useEffect(() => {
    if (weather.temp !== 0) setWeather(prev => ({ ...prev, tips: generateWeatherTips(prev.temp, prev.iconIndex, mode === 'WAR TIME') }));
  }, [mode]);

  const WeatherIcon = ({ className }: { className?: string }) => {
    if (weather.iconIndex >= 50 && weather.iconIndex <= 54) return <Sun className={className} />;
    if (weather.iconIndex >= 60 && weather.iconIndex <= 65) return <Cloud className={className} />;
    if (weather.iconIndex >= 80) return <CloudRain className={className} />;
    return <Wind className={className} />;
  };

  const BioIcon = ({ type, className }: { type: string, className?: string }) => {
    switch(type) {
        case 'sleep': return <Moon className={className} />;
        case 'hrv': return <Zap className={className} />;
        case 'risk': return <AlertTriangle className={className} />; // This was the missing variable
        case 'verdict': return <CheckCircle className={className} />;
        default: return <Activity className={className} />;
    }
  };

  return (
    <div className="relative w-full mb-12">
      <div className={`absolute -inset-1 rounded-3xl blur-3xl transition-all duration-1000 z-0 pointer-events-none ${
          mode === 'WAR TIME' ? 'bg-red-600/30' : (ecoMode ? 'bg-cyan-600/5' : 'bg-cyan-600/20')
      }`} />

      {/* --- GRID LAYOUT RESTORED: 3 DISTINCT PANELS --- */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        
        {/* === LEFT PANEL (Span 5): Mission & Weather === */}
        <div className={`lg:col-span-5 relative p-8 rounded-3xl border backdrop-blur-xl flex flex-col justify-between overflow-hidden group transition-all duration-500 ${
            mode === 'WAR TIME' 
            ? 'bg-black/90 border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.2)]' 
            : 'bg-black/80 border-white/10 shadow-[0_0_30px_rgba(6,182,212,0.1)]'
        }`}>
            {/* "Scanner" line effect */}
            <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent animate-scan ${ecoMode ? 'hidden' : 'block'}`} />

            {/* TOP: Identity & Objective */}
            <div>
                <div className="flex justify-between items-start mb-6">
                    {/* ROYCE LOGO */}
                    <div className="flex flex-col leading-none select-none opacity-80">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xl font-black tracking-[0.25em] text-white">ROYCE</span>
                            <div className={`h-1.5 w-1.5 rounded-full ${mode === 'WAR TIME' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_5px_#10b981]'}`} />
                        </div>
                        <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase ml-0.5">System Operator</span>
                    </div>
                    
                    {/* Status Badge */}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${mode === 'WAR TIME' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'}`}>
                        {mission.status.toUpperCase()}
                    </span>
                </div>

                <div className={`flex items-center gap-2 mb-3 font-bold tracking-[0.2em] text-xs ${mode === 'WAR TIME' ? 'text-red-500' : 'text-cyan-500'}`}>
                    <Target className="w-4 h-4" /> CURRENT OBJECTIVE
                </div>
                
                {/* MISSION TITLE */}
                <h1 className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tight mb-4 drop-shadow-lg">
                    {mission.title}
                </h1>
                
                <span className="text-zinc-400 font-mono text-xs flex items-center gap-2 mb-8">
                    <ChevronRight className="w-3 h-3" /> DEADLINE: {mission.endTime}
                </span>
            </div>

            {/* BOTTOM: Weather (Restored Layout) */}
            <div className="mt-auto pt-4 border-t border-white/5">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl border bg-white/5 ${mode === 'WAR TIME' ? 'border-red-500/30 text-red-400' : 'border-white/10 text-cyan-300'}`}>
                        <WeatherIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5">
                            {locationLocked ? <Navigation className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                            {mode === 'WAR TIME' ? weather.place.toUpperCase() : weather.place}
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-mono font-bold text-white">{weather.temp}°</span>
                            <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1"><Droplets className="w-3 h-3" /> {weather.humidity}%</span>
                        </div>
                    </div>
                </div>
                {/* Advice below weather */}
                <div className={`mt-3 flex flex-wrap gap-2 text-[10px] font-mono uppercase ${mode === 'WAR TIME' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {weather.tips.map((tip, i) => (
                        <span key={i} className="bg-white/5 px-2 py-1 rounded border border-white/5">{tip}</span>
                    ))}
                </div>
            </div>
        </div>

        {/* === MIDDLE PANEL (Span 3): Cortex Hub === */}
        <div className={`lg:col-span-3 relative p-6 rounded-3xl border backdrop-blur-xl flex flex-col items-center justify-center text-center transition-all duration-500 ${
            mode === 'WAR TIME' 
            ? 'bg-black/90 border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.2)]' 
            : 'bg-black/80 border-white/10 shadow-[0_0_30px_rgba(6,182,212,0.1)]'
        }`}>
            {/* Title */}
            <div className="absolute top-6 left-0 w-full text-center">
                <span className="text-[10px] font-bold text-zinc-600 tracking-[0.2em] uppercase">
                    OUROBOROS CORTEX HUB
                </span>
            </div>

            <AnimatePresence mode="wait">
                {mode === 'NORMAL' ? (
                    <motion.div key="norm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative mt-4">
                        {/* THE BIG CIRCLE */}
                        <div className="w-56 h-56 rounded-full border-4 border-cyan-500/10 flex items-center justify-center relative shadow-[0_0_50px_rgba(6,182,212,0.15)]">
                            {/* Spinning Rings - ALWAYS ON */}
                            <div className="absolute inset-0 rounded-full border-t-2 border-cyan-500 animate-spin" style={{ animationDuration: '8s' }}></div>
                            <div className="absolute inset-4 rounded-full border-b-2 border-cyan-500/30 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }}></div>
                            
                            <div className="flex flex-col items-center z-10 bg-black/50 backdrop-blur-sm p-4 rounded-full">
                                <div className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl">{anki.backlog}</div>
                                <div className="text-[10px] text-cyan-400 tracking-[0.3em] uppercase mt-2 font-bold">Cards</div>
                            </div>
                        </div>
                        <div className="mt-8 text-[10px] font-mono text-zinc-500 tracking-[0.4em] uppercase">Retention Load</div>
                    </motion.div>
                ) : (
                    <motion.div key="cbt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative w-full h-full flex flex-col justify-center items-center">
                        {/* War Time Hex Grid Background */}
                        <div className="absolute inset-0 grid grid-cols-5 gap-1 opacity-20 pointer-events-none content-center justify-center">
                             {Array.from({length: 25}).map((_, i) => <div key={i} className="w-full h-8 bg-red-900/40 rounded-sm" />)}
                        </div>
                        
                        <div className="relative z-10 scale-125">
                            <div className="flex justify-center gap-2 text-red-500 font-black tracking-[0.3em] text-[10px] mb-4 animate-pulse">
                                <Crosshair className="w-3 h-3" /> WAR TIME PROTOCOL
                            </div>
                            <div className="text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_25px_rgba(220,38,38,0.8)]">{hostiles.count}</div>
                            <div className="text-[9px] text-red-400 font-mono mt-2 tracking-widest animate-pulse font-bold">HOSTILES DETECTED</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* === RIGHT PANEL (Span 4): Bio-Metrics === */}
        <div className={`lg:col-span-4 relative p-6 rounded-3xl border backdrop-blur-xl flex flex-col overflow-hidden transition-all duration-500 ${
            mode === 'WAR TIME' 
            ? 'bg-black/90 border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.2)]' 
            : 'bg-black/80 border-white/10 shadow-[0_0_30px_rgba(6,182,212,0.1)]'
        }`}>
            {/* CONTROLS (Inside Right Panel Header) */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Activity className={`w-4 h-4 ${mode === 'WAR TIME' ? 'text-red-500' : 'text-purple-500'}`} />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">BIO-METRICS</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setEcoMode(!ecoMode)} className={`p-1.5 rounded hover:bg-white/10 ${ecoMode ? 'text-emerald-500' : 'text-zinc-600'}`}>
                        <Power className="w-3 h-3" />
                    </button>
                    <button onClick={() => setMode(m => m === 'NORMAL' ? 'WAR TIME' : 'NORMAL')} className={`p-1.5 rounded hover:bg-white/10 ${mode === 'WAR TIME' ? 'text-red-500' : 'text-zinc-600'}`}>
                        <Sword className="w-3 h-3" />
                    </button>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pr-1">
                {bioMetrics.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <BioIcon type={item.type} className={`w-4 h-4 ${
                                    item.type === 'sleep' ? 'text-blue-400' : 
                                    item.type === 'hrv' ? 'text-purple-400' : 
                                    item.type === 'risk' ? 'text-red-500' : 'text-emerald-400'
                                }`} />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{item.label}</span>
                            </div>
                        </div>
                        <p className={`text-sm font-mono leading-snug ${item.type === 'risk' ? 'text-red-300' : 'text-zinc-100'}`}>
                            {item.value}
                        </p>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}