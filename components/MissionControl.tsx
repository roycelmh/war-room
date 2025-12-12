'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Target, Activity, ChevronRight, Eye, EyeOff, Crosshair, Cloud, CloudRain, 
  Sun, Wind, MapPin, Navigation, Droplets, AlertTriangle, CheckCircle, Zap, 
  Moon, Sword, Fingerprint, Power, ArrowUpRight, ShieldAlert, Dumbbell, Utensils 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---
type MissionData = { title: string; endTime: string; status: 'Active' | 'Pending' };
type AnkiData = { backlog: number; reviews: number };
type HostileData = { count: number; max: number; status: string };
type WeatherData = { temp: number; place: string; iconIndex: number; humidity: number; tips: string[] };
type BioMetric = { label: string; value: string; type: 'sleep' | 'hrv' | 'risk' | 'verdict' | 'neutral' | 'training' | 'nutrition' };

const STATIONS = [
  { name: 'HK Observatory', lat: 22.302, lon: 114.174 },
  { name: 'Tai Po', lat: 22.446, lon: 114.179 },
  { name: 'Sha Tin', lat: 22.403, lon: 114.210 },
];

export default function MissionControl() {
  const [mode, setMode] = useState<'NORMAL' | 'WAR TIME'>('NORMAL');
  const [ecoMode, setEcoMode] = useState(true);
  const [locationLocked, setLocationLocked] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const [mission, setMission] = useState<MissionData>({ title: "INITIALIZING...", endTime: "--:--", status: 'Pending' });
  const [anki, setAnki] = useState<AnkiData>({ backlog: 0, reviews: 0 });
  const [hostiles, setHostiles] = useState<HostileData>({ count: 0, max: 50, status: 'SCANNING' });
  const [bioMetrics, setBioMetrics] = useState<BioMetric[]>([]);
  const [weather, setWeather] = useState<WeatherData>({ temp: 0, place: 'SCANNING...', iconIndex: 50, humidity: 0, tips: [] });

  // --- 1. GEOSPATIAL TRIANGULATION ---
  const getNearestStation = (lat: number, lon: number) => {
    let minDistance = Infinity;
    let nearest = STATIONS[0].name;
    STATIONS.forEach(station => {
      const dist = Math.sqrt(Math.pow(station.lat - lat, 2) + Math.pow(station.lon - lon, 2));
      if (dist < minDistance) { minDistance = dist; nearest = station.name; }
    });
    return nearest;
  };

  // --- 2. TACTICAL WEATHER TRANSLATOR ---
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

  // --- 3. HYBRID BIO PARSER ---
  const parseBioData = (raw: any) => {
    const metrics: BioMetric[] = [];
    // Strategy A: JSON Object (v2.0)
    if (typeof raw === 'object' && raw !== null) {
        if (raw.diagnosis?.tcm_state) metrics.push({ label: 'TCM STATE', value: raw.diagnosis.tcm_state, type: 'verdict' });
        if (raw.diagnosis?.summary) metrics.push({ label: 'ANALYSIS', value: raw.diagnosis.summary, type: 'neutral' });
        if (raw.directives?.training) metrics.push({ label: 'TRAINING', value: raw.directives.training, type: 'training' });
        if (raw.directives?.nutrition) metrics.push({ label: 'NUTRITION', value: raw.directives.nutrition, type: 'nutrition' });
        if (metrics.length > 0) return metrics;
    }
    // Strategy B: String Regex (v1.0 Fallback)
    if (typeof raw === 'string') {
        const clean = raw.replace(/[*#>•]/g, ' ').replace(/\s+/g, ' ').trim();
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
        const sleepVal = findValue('Sleep', 'HRV'); if (sleepVal) metrics.push({ label: 'SLEEP', value: sleepVal, type: 'sleep' });
        const hrvVal = findValue('HRV', 'Risks'); if (hrvVal) metrics.push({ label: 'HRV', value: hrvVal, type: 'hrv' });
        const riskVal = findValue('Risks', 'Verdict'); if (riskVal) metrics.push({ label: 'RISKS', value: riskVal, type: 'risk' });
        const verdictVal = findValue('Verdict'); if (verdictVal) metrics.push({ label: 'VERDICT', value: verdictVal, type: 'verdict' });
    }
    if (metrics.length === 0) metrics.push({ label: 'STATUS', value: "No Data Available", type: 'neutral' });
    return metrics;
  };

  // --- 4. STATE HELPERS (FOR REALTIME & FETCH) ---
  const updateAnkiState = (val: number) => {
    setAnki(p => ({...p, backlog: val})); 
    
    // Auto-War Mode if Backlog is Critical (> 200)
    if (val > 200) {
        setMode('WAR TIME');
        setHostiles({ count: 50, max: 50, status: 'OVERRUN' });
    } else {
        setHostiles({ count: Math.min(val, 50), max: 50, status: 'ENGAGED' });
    }
  };

  // --- 5. DATA FETCHING & REALTIME ---
  useEffect(() => {
    const fetchData = async () => {
      // A. Mission
      const { data: cal } = await supabase.from('calendar_cache').select('*').limit(1).single();
      if (cal) {
        setMission({ 
          title: cal.event_title, 
          endTime: new Date(cal.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
          status: 'Active' 
        });
      }
      
      // B. Anki (Initial Load)
      const { data: deck } = await supabase.from('logs_performance').select('value').eq('metric_name', 'Anki_Backlog').order('timestamp', { ascending: false }).limit(1).single();
      if (deck) { 
          updateAnkiState(deck.value); 
      }

      // C. Bio (Hybrid Parser)
      const { data: physio } = await supabase.from('logs_physiology').select('raw_data').eq('metric_name', 'Health_Advice').order('timestamp', { ascending: false }).limit(1).single();
      if (physio?.raw_data) {
        setBioMetrics(parseBioData(physio.raw_data.analysis_summary || physio.raw_data.advice || physio.raw_data));
      } else {
        setBioMetrics(parseBioData("Sleep: 6.8h HRV: 58 Risks: Low attention Verdict: Stable"));
      }

      // D. Weather (Using Geolocation)
      const fetchWeather = async (lat?: number, lon?: number) => {
          setIsScanning(true);
          try {
            const res = await fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en');
            const data = await res.json();
            
            let targetPlace = 'HK Observatory'; // Default
            if (lat && lon) {
                targetPlace = getNearestStation(lat, lon);
                setLocationLocked(true);
            }
            
            const stationData = data.temperature?.data?.find((s: any) => s.place === targetPlace) || data.temperature?.data?.[0] || { value: 25 };
            const icon = data.icon ? data.icon[0] : 50;
            
            setWeather({ 
                temp: stationData.value, 
                place: targetPlace, 
                iconIndex: icon, 
                humidity: data.humidity?.data?.[0]?.value || 75, 
                tips: generateWeatherTips(stationData.value, icon, mode === 'WAR TIME') 
            });
          } catch (e) {
              setWeather(prev => ({ ...prev, temp: 0, place: 'OFFLINE', tips: ['SIGNAL LOST'] }));
          } finally {
              setIsScanning(false);
          }
      };
      
      if (typeof navigator !== 'undefined' && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
            () => fetchWeather(),
            { timeout: 5000 }
        );
      } else { 
          fetchWeather(); 
      }
    };
    
    fetchData();

    // --- REAL-TIME SUBSCRIPTION ---
    const channel = supabase
      .channel('mission-control-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'logs_performance' },
        (payload) => {
          const row = payload.new as any;
          
          // Watch for Anki Updates
          if (row.metric_name === 'Anki_Backlog') {
            updateAnkiState(row.value);
          }
          // Watch for "Combat" signals (Optional Auto-War Mode)
          if (row.metric_name === 'Combat_Mode_Trigger') {
             setMode('WAR TIME');
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []); // End of useEffect

  // Re-run tips when mode changes
  useEffect(() => {
    if (weather.temp !== 0) setWeather(prev => ({ ...prev, tips: generateWeatherTips(prev.temp, prev.iconIndex, mode === 'WAR TIME') }));
  }, [mode]);

  // --- ICON RENDERERS ---
  const BioIcon = ({ type, className }: { type: string, className?: string }) => {
    switch(type) {
        case 'training': return <Dumbbell className={className} />;
        case 'nutrition': return <Utensils className={className} />;
        case 'sleep': return <Moon className={className} />;
        case 'hrv': return <Zap className={className} />;
        case 'risk': return <AlertTriangle className={className} />;
        case 'verdict': return <CheckCircle className={className} />;
        default: return <Activity className={className} />;
    }
  };

  const WeatherIcon = ({ className }: { className?: string }) => {
    const finalClass = `${className} ${!ecoMode ? 'animate-pulse' : ''}`;
    if (weather.iconIndex >= 50 && weather.iconIndex <= 54) return <Sun className={finalClass} />;
    if (weather.iconIndex >= 60 && weather.iconIndex <= 65) return <Cloud className={finalClass} />;
    if (weather.iconIndex >= 80) return <CloudRain className={finalClass} />;
    return <Wind className={finalClass} />;
  };

  return (
    // FULL HEIGHT CONTAINER
    <div className="relative w-full h-[85vh] min-h-[600px] mb-12 flex flex-col justify-between overflow-hidden">
      
      {/* 1. AMBIENT BACKGROUND */}
      <div className={`absolute top-0 left-0 w-full h-full transition-colors duration-1000 ${mode === 'WAR TIME' ? 'bg-red-950/20' : 'bg-transparent'}`} />
      
      {/* 2. TOP HUD LAYER */}
      <div className="relative z-50 flex justify-between items-start pt-2 px-2">
        <div className="flex flex-col">
            <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${mode === 'WAR TIME' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`} />
                <span className="text-sm font-black tracking-[0.4em] text-white/80">ROYCE</span>
            </div>
            <span className="text-[9px] font-mono text-zinc-600 tracking-widest pl-4">SYS.VER.5.3 // REALTIME</span>
        </div>

        <div className="flex gap-4">
            <button onClick={() => setEcoMode(!ecoMode)} className={`flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest transition-colors ${ecoMode ? 'text-emerald-500' : 'text-zinc-600 hover:text-white'}`}>
                <Power className="w-3 h-3" /> {ecoMode ? 'ECO_ON' : 'ECO_OFF'}
            </button>
            <button onClick={() => setMode(m => m === 'NORMAL' ? 'WAR TIME' : 'NORMAL')} className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-colors ${mode === 'WAR TIME' ? 'text-red-500' : 'text-zinc-600 hover:text-white'}`}>
                {mode === 'WAR TIME' ? <><Sword className="w-3 h-3" /> WAR_MODE</> : <><EyeOff className="w-3 h-3" /> NORMAL</>}
            </button>
        </div>
      </div>

      {/* 3. MAIN CONTENT LAYER */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-8">
        
        {/* === LEFT: MISSION OBJECTIVE === */}
        <div className="lg:col-span-5 flex flex-col justify-center relative pl-4">
            <div className={`absolute left-0 top-10 bottom-10 w-[2px] ${mode === 'WAR TIME' ? 'bg-red-500/50' : 'bg-emerald-500/50'}`} />
            
            <motion.div 
                key={mission.title}
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.8 }}
            >
                <div className={`flex items-center gap-2 mb-4 text-xs font-bold tracking-[0.3em] uppercase ${mode === 'WAR TIME' ? 'text-red-500' : 'text-emerald-500'}`}>
                    <Target className="w-4 h-4" /> Current Directive
                </div>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[0.9] tracking-tighter mb-6 drop-shadow-2xl">
                    {mission.title}
                </h1>

                <div className="flex items-center gap-6 text-sm font-mono text-zinc-400">
                    <span className={`px-2 py-0.5 border ${mode === 'WAR TIME' ? 'border-red-500 text-red-500' : 'border-emerald-500 text-emerald-500'} text-[10px] font-bold`}>
                        {mission.status}
                    </span>
                    <span className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3" /> DEADLINE: <span className="text-white">{mission.endTime}</span>
                    </span>
                </div>
            </motion.div>
        </div>

        {/* === MIDDLE: CORTEX VISUALIZER === */}
        <div className="lg:col-span-3 flex justify-center items-center relative h-full">
            <AnimatePresence mode="wait">
                {mode === 'NORMAL' ? (
                    <motion.div key="norm" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="relative">
                        <div className="w-64 h-64 rounded-full border border-white/5 flex items-center justify-center relative">
                            <div className="absolute inset-0 rounded-full border border-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.1)]" />
                            <div className="absolute inset-2 rounded-full border-t-2 border-cyan-400 animate-spin" style={{ animationDuration: '12s' }}></div>
                            <div className="absolute inset-6 rounded-full border-b-2 border-cyan-500/20 animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }}></div>

                            <div className="text-center z-10">
                                <div className="text-7xl font-black text-white tracking-tighter">{anki.backlog}</div>
                                <div className="text-[10px] text-cyan-500 tracking-[0.4em] uppercase mt-2">Cortex Load</div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="cbt" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="relative">
                        <div className="w-64 h-64 flex items-center justify-center relative">
                            <div className="absolute inset-0 rounded-full bg-red-500/5 animate-pulse" />
                            <div className="absolute inset-0 border border-red-500/30 rounded-full" />
                            
                            <div className="text-center z-10">
                                <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-2 animate-bounce" />
                                <div className="text-7xl font-black text-red-500 tracking-tighter drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">{hostiles.count}</div>
                                <div className="text-[10px] text-red-400 tracking-[0.4em] uppercase mt-2">Threats Active</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* === RIGHT: BIO-METRICS === */}
        <div className="lg:col-span-4 flex flex-col justify-center pl-8 relative">
             <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/10" />

             <div className="mb-6 flex items-center gap-3 border-b border-white/5 pb-2">
                <Activity className={`w-4 h-4 ${mode === 'WAR TIME' ? 'text-red-500' : 'text-purple-500'}`} />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Biological Status</span>
             </div>

             <div className="space-y-6">
                {bioMetrics.map((item, idx) => (
                    <div key={idx} className="group relative pl-4">
                        <div className={`absolute left-0 top-1 bottom-1 w-[2px] transition-colors ${mode === 'WAR TIME' ? 'bg-red-500/30 group-hover:bg-red-500' : 'bg-zinc-800 group-hover:bg-emerald-500'}`} />
                        
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{item.label}</span>
                            <BioIcon type={item.type} className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ${item.type === 'risk' ? 'text-red-500' : 'text-emerald-500'}`} />
                        </div>
                        <p className={`text-sm font-mono leading-relaxed ${item.type === 'risk' ? 'text-red-300' : 'text-zinc-300 group-hover:text-white transition-colors'}`}>
                            {item.value}
                        </p>
                    </div>
                ))}
             </div>
        </div>
      </div>

      {/* 4. BOTTOM HUD LAYER: Weather */}
      <div className="absolute bottom-0 left-0 w-full p-2 border-t border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between">
         <div className="flex items-center gap-6 px-4">
            <div className="flex items-center gap-3">
                <WeatherIcon className={`w-5 h-5 ${mode === 'WAR TIME' ? 'text-red-400' : 'text-cyan-300'}`} />
                <div className="flex items-baseline gap-2">
                    <span className="text-xl font-mono font-bold text-white">{weather.temp}°</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{locationLocked ? <Navigation className="w-3 h-3 inline mr-1" /> : ''} {weather.place}</span>
                </div>
            </div>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="flex gap-4">
                {weather.tips.map((tip, i) => (
                    <span key={i} className={`text-[10px] font-mono font-bold uppercase ${mode === 'WAR TIME' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {tip}
                    </span>
                ))}
            </div>
         </div>
         
         <div className="hidden md:block px-4">
            <span className="text-[9px] text-zinc-700 font-mono tracking-[0.3em]">OUROBOROS // END OF LINE</span>
         </div>
      </div>
    </div>
  );
}