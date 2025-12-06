'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Target, Activity, ChevronRight, Eye, EyeOff, Crosshair, Cloud, CloudRain, Sun, Wind, MapPin, Navigation, Droplets, ArrowUpRight, AlertTriangle, CheckCircle, Zap, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---
type MissionData = { title: string; time: string; status: 'Active' | 'Pending' };
type AnkiData = { backlog: number; reviews: number };
type HostileData = { count: number; max: number; status: string };
type WeatherData = { temp: number; place: string; iconIndex: number; humidity: number; tips: string[] };
type BioMetric = { label: string; value: string; type: 'sleep' | 'hrv' | 'risk' | 'verdict' | 'neutral' };

const STATIONS = [
  { name: 'Hong Kong Observatory', lat: 22.302, lon: 114.174 },
  { name: 'King\'s Park', lat: 22.311, lon: 114.173 },
  { name: 'Tai Po', lat: 22.446, lon: 114.179 },
  { name: 'Sha Tin', lat: 22.403, lon: 114.210 },
  { name: 'Tuen Mun', lat: 22.396, lon: 113.972 },
  { name: 'Sai Kung', lat: 22.383, lon: 114.270 },
  { name: 'Chek Lap Kok', lat: 22.309, lon: 113.922 },
  { name: 'Tseung Kwan O', lat: 22.316, lon: 114.263 },
  { name: 'Lau Fau Shan', lat: 22.469, lon: 113.984 },
];

export default function MissionControl() {
  const [mode, setMode] = useState<'NORMAL' | 'COMBAT'>('NORMAL');
  const [locationLocked, setLocationLocked] = useState(false);
  
  const [mission, setMission] = useState<MissionData>({ title: "PRAS Burns Clinic (Group A)", time: "02:30 PM", status: 'Active' });
  const [anki, setAnki] = useState<AnkiData>({ backlog: 142, reviews: 45 });
  const [hostiles, setHostiles] = useState<HostileData>({ count: 44, max: 50, status: 'SECTOR 50 ENGAGED' });
  const [bioMetrics, setBioMetrics] = useState<BioMetric[]>([]);
  const [weather, setWeather] = useState<WeatherData>({ temp: 0, place: 'SCANNING...', iconIndex: 50, humidity: 0, tips: [] });

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
    if (icon >= 60) tips.push(isCombat ? "SHIELD (UMBRELLA)" : "Umbrella");
    if (temp < 15) tips.push(isCombat ? "ARMOR (COAT)" : "Wear Coat");
    else if (temp < 20) tips.push(isCombat ? "LIGHT ARMOR" : "Jacket");
    else if (temp > 30) tips.push(isCombat ? "COOLANT (WATER)" : "Hydrate");
    if (icon === 51 || icon === 52) tips.push(isCombat ? "OCULAR SHIELD" : "Sunglasses");
    if (tips.length === 0) tips.push(isCombat ? "ATMOSPHERE STABLE" : "Conditions Good");
    return tips;
  };

  // --- NEW ROBUST PARSER ---
  const parseBioData = (rawText: string) => {
    // 1. Remove Markdown artifacts (*, #, >)
    let cleanText = rawText.replace(/\*\*/g, '').replace(/\*/g, '').replace(/>/g, '').replace(/•/g, '');
    
    // 2. Identify segments
    const segments: BioMetric[] = [];
    
    // Define patterns to search for. We split by the Key to isolate the Value.
    const keys = ['Sleep:', 'HRV:', 'Risks:', 'Verdict:'];
    
    // Simple way: Split text by sentences or common delimiters
    // We will look for substrings
    
    // Find Sleep
    const sleepMatch = cleanText.match(/Sleep:\s*([^•\n]+)/i);
    if (sleepMatch) segments.push({ label: 'Sleep', value: sleepMatch[1].trim(), type: 'sleep' });

    // Find HRV
    const hrvMatch = cleanText.match(/HRV:\s*([^•\n]+)/i);
    if (hrvMatch) segments.push({ label: 'HRV', value: hrvMatch[1].trim(), type: 'hrv' });

    // Find Risks (Often longer)
    const riskMatch = cleanText.match(/Risks:\s*([^•\n]+)/i);
    if (riskMatch) segments.push({ label: 'Risks', value: riskMatch[1].trim(), type: 'risk' });

    // Find Verdict
    const verdictMatch = cleanText.match(/Verdict:\s*([^•\n]+)/i);
    if (verdictMatch) segments.push({ label: 'Verdict', value: verdictMatch[1].trim(), type: 'verdict' });

    // If regex fails (different format), fallback to splitting by periods
    if (segments.length === 0) {
        cleanText.split('.').forEach(s => {
            if (s.length > 5) segments.push({ label: '', value: s.trim(), type: 'neutral' });
        });
    }

    return segments;
  };

  useEffect(() => {
    const fetchData = async () => {
      // 1. Mission
      const { data: cal } = await supabase.from('calendar_cache').select('*').limit(1).single();
      if (cal) {
        const now = new Date();
        const isHappening = now >= new Date(cal.start_time) && now < new Date(cal.end_time);
        setMission({ 
          title: cal.event_title, 
          time: new Date(cal.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: isHappening ? 'Active' : 'Pending'
        });
      }
      
      // 2. Anki
      const { data: deck } = await supabase.from('logs_performance').select('value').eq('metric_name', 'Anki_Backlog').order('timestamp', { ascending: false }).limit(1).single();
      if (deck) {
        setAnki(prev => ({ ...prev, backlog: deck.value ?? 0 }));
        setHostiles({ count: Math.min(deck.value ?? 0, 50), max: 50, status: 'ENGAGING TARGETS' });
      }

      // 3. Bio-Scan
      const { data: physio } = await supabase.from('logs_physiology').select('raw_data').eq('metric_name', 'Health_Advice').order('timestamp', { ascending: false }).limit(1).single();
      if (physio?.raw_data) {
        const rawText = physio.raw_data.analysis_summary || physio.raw_data.advice || "System Stable.";
        setBioMetrics(parseBioData(rawText));
      } else {
        // Mock fallback for visual testing
        setBioMetrics(parseBioData("**Sleep:** 6.86h (Slightly below optimal) • **HRV:** 58.88 (Slight decline) • **Risks:** Potential auditory fatigue."));
      }

      // 4. Weather
      try {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          setLocationLocked(true);
          const targetStation = getNearestStation(latitude, longitude);
          
          const res = await fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en');
          const data = await res.json();
          
          const stationData = data.temperature.data.find((s: any) => s.place === targetStation) || data.temperature.data[0];
          const tempValue = stationData.value;
          const icon = data.icon ? data.icon[0] : 50;
          const humidity = data.humidity?.data?.[0]?.value || 70; 

          setWeather({ 
            temp: tempValue, 
            place: targetStation, 
            iconIndex: icon,
            humidity: humidity,
            tips: generateWeatherTips(tempValue, icon, mode === 'COMBAT')
          });

        }, () => {
          setWeather(prev => ({ ...prev, place: 'H.K. Observatory', temp: 24, tips: ["Signal Lost"] }));
        });
      } catch (e) { console.error(e); }
    };
    fetchData();
  }, []); 

  // Update tips on mode change
  useEffect(() => {
    if (weather.temp !== 0) {
      setWeather(prev => ({
        ...prev,
        tips: generateWeatherTips(prev.temp, prev.iconIndex, mode === 'COMBAT')
      }));
    }
  }, [mode, weather.temp, weather.iconIndex]);

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
        case 'risk': return <AlertTriangle className={className} />;
        case 'verdict': return <CheckCircle className={className} />;
        default: return <Activity className={className} />;
    }
  };

  return (
    <div className="relative w-full mb-6">
      <div className={`absolute -inset-1 rounded-3xl blur-2xl transition-all duration-1000 opacity-40 ${mode === 'COMBAT' ? 'bg-red-600' : 'bg-cyan-600'}`} />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 bg-black/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl overflow-hidden min-h-[300px]">
        
        {/* SWITCH */}
        <div className="absolute top-0 right-0 p-4 z-50">
            <button 
                onClick={() => setMode(m => m === 'NORMAL' ? 'COMBAT' : 'NORMAL')}
                className={`group flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-[10px] tracking-[0.2em] border backdrop-blur-md transition-all duration-300 ${
                mode === 'COMBAT' ? 'bg-red-950/50 border-red-500 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-cyan-950/50 border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-white'}`}
            >
                {mode === 'COMBAT' ? <><Eye className="w-3 h-3 animate-pulse" /> ITACHI</> : <><EyeOff className="w-3 h-3" /> NORMAL</>}
            </button>
        </div>

        {/* --- LEFT: MISSION & WEATHER --- */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full relative">
            <div>
                <div className={`flex items-center gap-2 mb-4 font-bold tracking-widest text-xs ${mode === 'COMBAT' ? 'text-red-500' : 'text-cyan-500'}`}>
                    <Target className="w-4 h-4" /> CURRENT OBJECTIVE
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight mb-4">{mission.title}</h1>
                <div className="flex gap-3 mb-6">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${mode === 'COMBAT' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'}`}>
                        {mission.status.toUpperCase()}
                    </span>
                    <span className="text-zinc-500 font-mono text-xs flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" /> T-MINUS {mission.time}
                    </span>
                </div>
            </div>

            <div className="mt-auto pt-6 border-t border-white/5">
                <div className="flex items-end justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg border backdrop-blur-sm ${mode === 'COMBAT' ? 'border-red-900 bg-red-950/30 text-red-400' : 'border-white/10 bg-white/5 text-zinc-300'}`}>
                            <WeatherIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">
                                {locationLocked ? <Navigation className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                                {mode === 'COMBAT' ? weather.place.toUpperCase().replace(' ', '_') : weather.place}
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className={`font-mono text-3xl font-black leading-none ${mode === 'COMBAT' ? 'text-red-100' : 'text-white'}`}>{weather.temp}°</span>
                                <span className="text-xs text-zinc-500 font-mono flex items-center gap-1"><Droplets className="w-3 h-3" /> {weather.humidity}%</span>
                            </div>
                        </div>
                    </div>
                    {/* Compact Tips Below Weather */}
                    <div className={`flex flex-col items-end justify-end text-[10px] font-mono h-full opacity-80 ${mode === 'COMBAT' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {weather.tips.map((tip, i) => (
                            <div key={i} className="flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" /> {tip}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* --- MIDDLE: SPACIOUS VISUALIZER --- */}
        <div className="lg:col-span-3 flex flex-col justify-center items-center py-8 border-x border-white/5 mx-2 px-6">
            <AnimatePresence mode="wait">
                {mode === 'NORMAL' ? (
                    <motion.div key="norm" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center w-full">
                        <div className="relative flex justify-center py-10">
                            <div className="w-48 h-48 rounded-full border-4 border-cyan-500/10 flex items-center justify-center relative shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                                <div className="absolute inset-0 rounded-full border-t-2 border-cyan-500 animate-spin" style={{ animationDuration: '8s' }}></div>
                                <div className="absolute inset-4 rounded-full border-b-2 border-cyan-500/30 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }}></div>
                                <div className="flex flex-col items-center">
                                    <div className="text-5xl font-black text-white tracking-tighter drop-shadow-xl">{anki.backlog}</div>
                                    <div className="text-[10px] text-cyan-400 tracking-[0.3em] uppercase mt-2">Cards Pending</div>
                                </div>
                            </div>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-600 tracking-[0.4em] uppercase">Cortex Retention Load</span>
                    </motion.div>
                ) : (
                    <motion.div key="cbt" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full text-center relative py-16">
                        <div className="absolute inset-0 grid grid-cols-6 gap-1 opacity-20 pointer-events-none">
                            {Array.from({length: 30}).map((_, i) => <div key={i} className={`rounded-sm transition-colors duration-1000 ${i%3===0?'bg-red-500/50':'border border-red-900/50'}`} />)}
                        </div>
                        <div className="relative z-10 scale-125">
                            <div className="flex justify-center gap-2 text-red-500 font-black tracking-[0.3em] text-[10px] mb-4 animate-pulse"><Crosshair className="w-3 h-3" /> TARGETS ACQUIRED</div>
                            <div className="text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">{hostiles.count}</div>
                            <div className="w-32 mx-auto bg-red-950 h-1.5 mt-4 rounded-full overflow-hidden border border-red-900"><div className="h-full bg-red-600 shadow-[0_0_15px_#dc2626]" style={{ width: '70%' }}></div></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* --- RIGHT: BIO-SCAN (CLEAN LIST) --- */}
        <div className="lg:col-span-4 flex flex-col h-full overflow-hidden pl-4">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/5">
                <Activity className={`w-4 h-4 ${mode === 'COMBAT' ? 'text-red-500' : 'text-purple-500'}`} />
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                    {mode === 'COMBAT' ? 'TACTICAL ANALYSIS' : 'BIO-SCAN REPORT'}
                </span>
            </div>
            
            <div className={`flex-1 rounded-lg p-4 leading-relaxed overflow-y-auto custom-scrollbar border ${
                mode === 'COMBAT' ? 'bg-red-950/10 border-red-500/20 text-red-100' : 'bg-black/40 border-white/5 text-zinc-200'
            }`}>
                <ul className="space-y-4">
                    {bioMetrics.map((item, idx) => (
                        <li key={idx} className="group">
                            <div className="flex items-center gap-2 mb-1">
                                <BioIcon type={item.type} className={`w-3 h-3 ${
                                    item.type === 'sleep' ? 'text-blue-400' : 
                                    item.type === 'hrv' ? 'text-purple-400' : 
                                    item.type === 'risk' ? 'text-red-500' : 
                                    item.type === 'verdict' ? 'text-emerald-400' : 'text-zinc-500'
                                }`} />
                                {item.label && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{item.label}</span>
                                )}
                            </div>
                            <p className={`text-xs font-mono ml-5 ${
                                item.type === 'risk' ? 'text-red-300 font-bold' : 
                                item.type === 'verdict' ? 'text-emerald-200' : ''
                            }`}>
                                {item.value}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>

      </div>
    </div>
  );
}