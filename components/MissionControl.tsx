'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Target, Activity, ChevronRight, Eye, EyeOff, Crosshair, Cloud, CloudRain, 
  Sun, Wind, MapPin, Navigation, Droplets, AlertTriangle, CheckCircle, Zap, 
  Moon, Sword, Fingerprint, Power, ArrowUpRight, ShieldAlert, Dumbbell, Utensils, RefreshCw,
  Cpu, Layers, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---
type MissionData = { title: string; endTime: string; status: 'Active' | 'Pending' };
type AnkiData = { backlog: number; reviews: number };
type HostileData = { count: number; max: number; status: string };
type WeatherData = { temp: number; place: string; iconIndex: number; humidity: number; tips: string[] };
type BioMetric = { label: string; value: string; type: 'sleep' | 'hrv' | 'risk' | 'verdict' | 'neutral' | 'training' | 'nutrition' };

// Governor Modes
type SystemMode = 'NORMAL' | 'WAR TIME' | 'WARNING' | 'RECOVERY';
type ViewState = 'AUTO' | 'CORTEX' | 'THREAT';

const STATIONS = [
  { name: 'HK Observatory', lat: 22.302, lon: 114.174 },
  { name: 'Tai Po', lat: 22.446, lon: 114.179 },
  { name: 'Sha Tin', lat: 22.403, lon: 114.210 },
];

export default function MissionControl() {
  // --- STATE ---
  const [mode, setMode] = useState<SystemMode>('NORMAL'); 
  const [ecoMode, setEcoMode] = useState(true);
  const [viewOverride, setViewOverride] = useState<ViewState>('AUTO');
  
  const [mission, setMission] = useState<MissionData>({ title: "INITIALIZING...", endTime: "--:--", status: 'Pending' });
  const [anki, setAnki] = useState<AnkiData>({ backlog: 0, reviews: 0 });
  const [hostiles, setHostiles] = useState<HostileData>({ count: 0, max: 50, status: 'SCANNING' });
  const [bioMetrics, setBioMetrics] = useState<BioMetric[]>([]);
  const [weather, setWeather] = useState<WeatherData>({ temp: 0, place: 'SCANNING...', iconIndex: 50, humidity: 0, tips: [] });
  
  const [locationLocked, setLocationLocked] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // --- GOD-TIER THEME ENGINE (VISUALS ONLY, NO BOXES) ---
  const getTheme = () => {
    switch (mode) {
      case 'WAR TIME': return { 
        primary: 'text-red-500', 
        secondary: 'text-red-400',
        // Ambient: Dangerous red pulse from center
        ambient: 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/30 via-transparent to-transparent',
        indicator: 'bg-red-500 shadow-[0_0_15px_#ef4444]',
        cortexRing: 'border-red-500/30',
        glow: 'shadow-[0_0_40px_rgba(220,38,38,0.4)]',
        barColor: 'bg-red-500/50'
      };
      case 'WARNING': return { 
        primary: 'text-amber-400', 
        secondary: 'text-amber-300',
        ambient: 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent',
        indicator: 'bg-amber-400 shadow-[0_0_15px_#fbbf24]',
        cortexRing: 'border-amber-500/30',
        glow: 'shadow-[0_0_40px_rgba(245,158,11,0.3)]',
        barColor: 'bg-amber-500/50'
      };
      case 'RECOVERY': return { 
        primary: 'text-cyan-400', 
        secondary: 'text-cyan-300',
        ambient: 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent',
        indicator: 'bg-cyan-400 shadow-[0_0_15px_#22d3ee]',
        cortexRing: 'border-cyan-500/30',
        glow: 'shadow-[0_0_40px_rgba(34,211,238,0.3)]',
        barColor: 'bg-cyan-500/50'
      };
      default: return { 
        primary: 'text-emerald-500', 
        secondary: 'text-emerald-400',
        ambient: 'bg-transparent',
        indicator: 'bg-emerald-500 shadow-[0_0_15px_#10b981]',
        cortexRing: 'border-emerald-500/20',
        glow: 'shadow-[0_0_40px_rgba(16,185,129,0.15)]',
        barColor: 'bg-zinc-700'
      };
    }
  };
  const theme = getTheme();

  // --- GOVERNOR AUTHORITY ---
  const updateModeFromValue = (val: number, rawMode?: string) => {
    if (rawMode === 'RED') return setMode('WAR TIME');
    if (rawMode === 'YELLOW') return setMode('WARNING');
    if (rawMode === 'BLUE') return setMode('RECOVERY');
    if (rawMode === 'GREEN') return setMode('NORMAL');
    if (val === 1) setMode('WAR TIME');
    else if (val === 3) setMode('WARNING');
    else if (val === 4) setMode('RECOVERY');
    else setMode('NORMAL');
  };

  useEffect(() => {
    const savedView = localStorage.getItem('apex_view_override');
    if (savedView) setViewOverride(savedView as ViewState);
  }, []);

  const toggleView = () => {
    let nextView: ViewState = 'AUTO';
    if (viewOverride === 'AUTO') nextView = 'CORTEX';
    else if (viewOverride === 'CORTEX') nextView = 'THREAT';
    setViewOverride(nextView);
    localStorage.setItem('apex_view_override', nextView);
  };

  const showCortex = viewOverride === 'CORTEX' || (viewOverride === 'AUTO' && (mode === 'NORMAL' || mode === 'RECOVERY'));

  // --- DATA FETCHING ---
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

  const parseBioData = (raw: any) => {
    const metrics: BioMetric[] = [];
    if (typeof raw === 'object' && raw !== null) {
        if (raw.diagnosis?.tcm_state) metrics.push({ label: 'TCM STATE', value: raw.diagnosis.tcm_state, type: 'verdict' });
        if (raw.diagnosis?.summary) metrics.push({ label: 'ANALYSIS', value: raw.diagnosis.summary, type: 'neutral' });
        if (raw.directives?.training) metrics.push({ label: 'TRAINING', value: raw.directives.training, type: 'training' });
        if (raw.directives?.nutrition) metrics.push({ label: 'NUTRITION', value: raw.directives.nutrition, type: 'nutrition' });
        if (metrics.length > 0) return metrics;
    }
    if (typeof raw === 'string') {
        const clean = raw.replace(/[*#>•]/g, ' ').replace(/\s+/g, ' ').trim();
        const extract = (key: string, nextKey?: string) => {
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
            return clean.substring(start, end).trim().replace(/[.;]$/, '');
        };
        const sleepVal = extract('Sleep', 'HRV'); if (sleepVal) metrics.push({ label: 'SLEEP', value: sleepVal, type: 'sleep' });
        const hrvVal = extract('HRV', 'Risks'); if (hrvVal) metrics.push({ label: 'HRV', value: hrvVal, type: 'hrv' });
        const riskVal = extract('Risks', 'Verdict'); if (riskVal) metrics.push({ label: 'RISKS', value: riskVal, type: 'risk' });
        const verdictVal = extract('Verdict'); if (verdictVal) metrics.push({ label: 'VERDICT', value: verdictVal, type: 'verdict' });
    }
    if (metrics.length === 0) metrics.push({ label: 'STATUS', value: "No Data Available", type: 'neutral' });
    return metrics;
  };

  const updateAnkiState = (val: number) => {
    setAnki(p => ({...p, backlog: val})); 
    if (val > 200) setHostiles({ count: 50, max: 50, status: 'OVERRUN' });
    else setHostiles({ count: Math.min(val, 50), max: 50, status: 'ENGAGED' });
  };

  const handleScanWeather = async () => {
    setIsScanning(true);
    const fetchAPI = async (lat?: number, lon?: number) => {
        try {
            const res = await fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en');
            const data = await res.json();
            let targetPlace = 'HK Observatory';
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
        } finally { setIsScanning(false); }
    };

    if (typeof navigator !== 'undefined' && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchAPI(pos.coords.latitude, pos.coords.longitude),
            () => fetchAPI(),
            { timeout: 5000 }
        );
    } else { fetchAPI(); }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: cal } = await supabase.from('calendar_cache').select('*').limit(1).single();
      if (cal) setMission({ title: cal.event_title, endTime: new Date(cal.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'Active' });
      
      const { data: deck } = await supabase.from('logs_performance').select('value').eq('metric_name', 'Anki_Backlog').order('timestamp', { ascending: false }).limit(1).single();
      if (deck) updateAnkiState(deck.value);

      const { data: physio } = await supabase.from('logs_physiology').select('raw_data').eq('metric_name', 'Health_Advice').order('timestamp', { ascending: false }).limit(1).single();
      if (physio?.raw_data) setBioMetrics(parseBioData(physio.raw_data.analysis_summary || physio.raw_data.advice || physio.raw_data));
      else setBioMetrics(parseBioData("Sleep: 6.8h HRV: 58 Risks: Low attention Verdict: Stable"));

      const { data: sys } = await supabase.from('logs_performance').select('value, raw_data').eq('metric_name', 'System_Mode').order('timestamp', { ascending: false }).limit(1).maybeSingle();
      if (sys) updateModeFromValue(sys.value, sys.raw_data?.mode);

      handleScanWeather();
    };
    fetchData();

    const channel = supabase.channel('mission-control-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs_performance' }, (payload) => {
          const row = payload.new as any;
          if (row.metric_name === 'Anki_Backlog') updateAnkiState(row.value);
          if (row.metric_name === 'System_Mode') updateModeFromValue(row.value, row.raw_data?.mode);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (weather.temp !== 0) setWeather(prev => ({ ...prev, tips: generateWeatherTips(prev.temp, prev.iconIndex, mode === 'WAR TIME') }));
  }, [mode]);

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

  const RoyceLogo = () => (
    <div className="flex flex-col leading-none select-none opacity-80 mb-2">
        <div className="flex items-center gap-1.5">
            <span className="text-xl font-black tracking-[0.25em] text-white">ROYCE</span>
            <div className={`h-1.5 w-1.5 rounded-full ${theme.indicator} ${mode === 'WAR TIME' ? 'animate-ping' : 'animate-pulse'} transition-all duration-1000`} />
        </div>
        <span className="text-[8px] text-zinc-500 font-mono tracking-widest uppercase ml-0.5">System Operator</span>
    </div>
  );

  return (
    <div className="relative w-full h-[75vh] min-h-[500px] mb-8 flex flex-col justify-between overflow-hidden">
      
      {/* 1. AMBIENT BACKGROUND (The Void) */}
      <div className={`absolute top-0 left-0 w-full h-full transition-all duration-1000 ${theme.ambient}`} />
      
      {/* 2. HEADER CONTROLS (Single Line) */}
      <div className="relative z-50 flex justify-between items-center pt-2 px-2 pb-2">
        <div className="flex items-center gap-2">
            <div className={`h-1.5 w-1.5 rounded-full ${theme.indicator} animate-pulse`} />
            <span className="text-[10px] font-black tracking-[0.3em] text-white/90">OUROBOROS OS</span>
            <span className="text-[9px] text-zinc-600 font-mono tracking-widest hidden sm:inline-block pl-2">CONNECTED</span>
        </div>

        <div className="flex gap-4">
            <button onClick={() => setEcoMode(!ecoMode)} className={`flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest transition-colors ${ecoMode ? theme.primary : 'text-zinc-600 hover:text-white'}`}>
                <Power className="w-3 h-3" /> {ecoMode ? 'ECO' : 'PWR'}
            </button>
            <button onClick={() => setMode(m => m === 'NORMAL' ? 'WAR TIME' : 'NORMAL')} className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-colors ${mode === 'WAR TIME' ? 'text-red-500' : 'text-zinc-600 hover:text-white'}`}>
                {mode === 'WAR TIME' ? <><Sword className="w-3 h-3" /> WAR</> : <><EyeOff className="w-3 h-3" /> NORM</>}
            </button>
        </div>
      </div>

      {/* 3. MAIN CONTENT (OPEN AIR - NO BOXES) */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mt-0">
        
        {/* LEFT: MISSION (Floating) */}
        <div className="lg:col-span-5 flex flex-col justify-center relative pl-4 gap-6">
            <div className={`absolute left-0 top-6 bottom-6 w-[1px] bg-gradient-to-b from-transparent ${mode === 'WAR TIME' ? 'via-red-500/50' : 'via-emerald-500/50'} to-transparent`} />
            
            <motion.div 
                key={mission.title}
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.8 }}
            >
                <div className={`flex items-center gap-2 mb-2 text-xs font-bold tracking-[0.3em] uppercase ${theme.primary}`}>
                    <Target className="w-4 h-4" /> Current Directive
                </div>
                
                {/* FIXED: Tight Leading for Huge Text */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tighter mb-4 drop-shadow-2xl">
                    {mission.title}
                </h1>

                <div className="flex items-center gap-4 text-sm font-mono text-zinc-400">
                    <span className={`px-2 py-0.5 border ${theme.border} ${theme.secondary} text-[10px] font-bold`}>
                        {mission.status}
                    </span>
                    <span className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3" /> DEADLINE: <span className="text-white">{mission.endTime}</span>
                    </span>
                </div>
            </motion.div>

            {/* WEATHER (Floating) */}
            <div className="group cursor-pointer" onClick={handleScanWeather}>
                <div className="flex items-end gap-4">
                    <WeatherIcon className={`w-8 h-8 ${theme.primary}`} />
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest opacity-60 group-hover:text-white transition-colors">
                            {isScanning ? <span className="animate-pulse flex gap-1"><RefreshCw className="w-3 h-3 animate-spin"/> SCANNING...</span> : <>{locationLocked ? <Navigation className="w-3 h-3" /> : <MapPin className="w-3 h-3" />} {weather.place.toUpperCase()}</>}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                            <span className="text-3xl font-mono font-bold text-white leading-none">{weather.temp}°</span>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1"><Droplets className="w-3 h-3" /> {weather.humidity}%</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {weather.tips.map((tip, i) => (
                                        <span key={i} className={`text-[8px] font-bold uppercase tracking-wider ${theme.secondary}`}>{tip}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* MIDDLE: CORTEX (Floating Ring) */}
        <div className="lg:col-span-3 flex justify-center items-center relative h-full cursor-pointer group" onClick={toggleView}>
            {viewOverride !== 'AUTO' && (
                <div className="absolute top-0 right-0 text-[9px] font-mono text-zinc-500/50 flex items-center gap-1">
                    <Layers className="w-3 h-3" /> {viewOverride}
                </div>
            )}

            <AnimatePresence mode="wait">
                {showCortex ? (
                    <motion.div key="cortex" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="relative">
                        <div className="w-64 h-64 flex items-center justify-center relative">
                            {/* Void Ring */}
                            <div className={`absolute inset-0 rounded-full border ${theme.cortexRing} ${theme.glow} opacity-30`} />
                            <div className={`absolute inset-4 rounded-full border-t-2 ${theme.cortexRing} animate-spin`} style={{ animationDuration: '20s' }}></div>
                            <div className={`absolute inset-10 rounded-full border-b-2 ${theme.cortexRing} animate-spin`} style={{ animationDuration: '10s', animationDirection: 'reverse' }}></div>
                            
                            <div className="text-center z-10 flex flex-col items-center">
                                <div className="text-6xl font-black text-white tracking-tighter drop-shadow-lg">{anki.backlog}</div>
                                <div className={`text-[9px] ${theme.primary} tracking-[0.4em] uppercase mt-1 opacity-80`}>Cortex Load</div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="threat" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="relative">
                        <div className="w-64 h-64 flex items-center justify-center relative">
                            <div className={`absolute inset-0 rounded-full ${mode === 'WAR TIME' ? 'bg-red-500/10' : 'bg-transparent'} blur-xl animate-pulse`} />
                            <div className={`absolute inset-4 border ${theme.cortexRing} rounded-full opacity-60`} />
                            <div className="text-center z-10 flex flex-col items-center">
                                <ShieldAlert className={`w-8 h-8 ${theme.primary} mb-2 animate-bounce`} />
                                <div className={`text-6xl font-black ${theme.primary} tracking-tighter drop-shadow-[0_0_20px_currentColor]`}>{hostiles.count}</div>
                                <div className={`text-[9px] ${theme.secondary} tracking-[0.4em] uppercase mt-1`}>Threats Active</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* RIGHT: BIO-METRICS (Floating List) */}
        <div className="lg:col-span-4 flex flex-col justify-center pl-8 relative">
             <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-white/10" />
             <div className="mb-4 flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Activity className={`w-4 h-4 ${theme.primary}`} />
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">BIO-METRICS</span>
                </div>
             </div>
             
             <div className="space-y-4">
                {bioMetrics.map((item, idx) => (
                    <div key={idx} className="group relative pl-4">
                        {/* Dynamic Bar Indicator */}
                        <div className={`absolute left-0 top-1 bottom-1 w-[2px] transition-colors ${theme.barColor} group-hover:${theme.primary}`} />
                        
                        <div className="flex justify-between items-baseline mb-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{item.label}</span>
                            <BioIcon type={item.type} className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ${item.type === 'risk' ? 'text-red-500' : theme.primary}`} />
                        </div>
                        <p className={`text-sm font-mono leading-snug ${item.type === 'risk' ? 'text-red-300' : 'text-zinc-300 group-hover:text-white transition-colors'}`}>
                            {item.value}
                        </p>
                    </div>
                ))}
             </div>
        </div>
      </div>

      {/* 4. BOTTOM DECORATION */}
      <div className="hidden md:block absolute bottom-0 right-4 pb-2">
         <span className="text-[8px] text-zinc-700 font-mono tracking-widest">
            SYS.VER.5.5 // OROBOROS LINK: <span className={theme.primary}>ACTIVE</span>
         </span>
      </div>
    </div>
  );
}