import React from 'react';
import { Activity, Globe, MousePointer2, Hand, Database, Zap, Layers, MapPin, Thermometer, Users, Clock } from 'lucide-react';
import { InteractionMode, EarthFact, LocationInfo } from '../types';

interface HoloUIProps {
  interactionMode: InteractionMode;
  setInteractionMode: (mode: InteractionMode) => void;
  isLoadingFact: boolean;
  currentFact: EarthFact | null;
  onRequestFact: (topic: string) => void;
  gestureDetected: boolean;
  // New Props
  showQuakes: boolean;
  setShowQuakes: (v: boolean) => void;
  timelineYear: number;
  setTimelineYear: (y: number) => void;
  selectedLocationInfo: LocationInfo | null;
  isAnalyzingLocation: boolean;
}

const HoloUI: React.FC<HoloUIProps> = ({ 
  interactionMode, 
  setInteractionMode, 
  isLoadingFact,
  currentFact,
  onRequestFact,
  gestureDetected,
  showQuakes,
  setShowQuakes,
  timelineYear,
  setTimelineYear,
  selectedLocationInfo,
  isAnalyzingLocation
}) => {
  
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-20">
      
      {/* Header */}
      <header className="flex justify-between items-start pointer-events-auto">
        <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 p-4 rounded-tl-xl rounded-br-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
          <h1 className="text-3xl font-bold text-white tracking-widest uppercase font-['Rajdhani']">
            Holo<span className="text-cyan-400">Earth</span>
          </h1>
          <div className="flex items-center gap-2 text-xs text-cyan-500/70 mt-1">
            <Activity size={12} className="animate-pulse" />
            <span>SYSTEM ONLINE // V.3.1.0 // LIVE DATA</span>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex flex-col gap-4 items-end">
           {/* Layer Toggles */}
           <div className="flex gap-2 bg-black/60 p-2 rounded border border-gray-700">
              <button
                onClick={() => setShowQuakes(!showQuakes)}
                className={`p-2 rounded transition-colors ${showQuakes ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'text-gray-500 hover:text-white'}`}
                title="Toggle Seismic Data"
              >
                <Activity size={18} />
              </button>
           </div>

          {/* Mode Toggles */}
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setInteractionMode(InteractionMode.MOUSE)}
              className={`flex items-center gap-3 px-6 py-2 rounded border transition-all duration-300 ${interactionMode === InteractionMode.MOUSE ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.3)]' : 'bg-black/60 border-gray-700 text-gray-500 hover:border-gray-500'}`}
            >
              <MousePointer2 size={16} />
              <span className="text-sm font-bold tracking-widest">MOUSE NAV</span>
            </button>
            
            <button 
              onClick={() => setInteractionMode(InteractionMode.GESTURE)}
              className={`flex items-center gap-3 px-6 py-2 rounded border transition-all duration-300 ${interactionMode === InteractionMode.GESTURE ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.3)]' : 'bg-black/60 border-gray-700 text-gray-500 hover:border-gray-500'}`}
            >
              <Hand size={16} />
              <span className="text-sm font-bold tracking-widest">GESTURE LINK</span>
              {interactionMode === InteractionMode.GESTURE && gestureDetected && (
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-ping ml-auto"></span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area (Left) - Facts OR Location Info */}
      <div className="flex-1 flex items-center pointer-events-none">
        
        {/* Priority: Location Info > General Fact */}
        {selectedLocationInfo || isAnalyzingLocation ? (
           <div className="w-80 bg-black/80 backdrop-blur-md border border-yellow-500/30 p-6 rounded-r-2xl relative pointer-events-auto transform transition-all duration-500 animate-in slide-in-from-left-10">
              <div className="absolute -left-[1px] top-4 bottom-4 w-1 bg-yellow-500 shadow-[0_0_10px_orange]"></div>
              
              <div className="flex items-center justify-between mb-4 border-b border-yellow-500/20 pb-2">
                <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                  <MapPin size={12} />
                  TARGET ACQUIRED
                </span>
                {isAnalyzingLocation && <Activity size={12} className="animate-spin text-yellow-400"/>}
              </div>

              {isAnalyzingLocation ? (
                 <div className="h-20 flex items-center justify-center text-yellow-500/50 text-xs tracking-widest animate-pulse">
                   ESTABLISHING DATA LINK...
                 </div>
              ) : selectedLocationInfo ? (
                <>
                  <h2 className="text-2xl text-white font-bold mb-1 font-['Rajdhani'] uppercase">
                    {selectedLocationInfo.name}
                  </h2>
                  <div className="text-yellow-500/70 text-sm mb-4 font-mono">{selectedLocationInfo.country}</div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <Thermometer size={16} className="text-cyan-400" />
                      <span>{selectedLocationInfo.weather}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <Users size={16} className="text-purple-400" />
                      <span>{selectedLocationInfo.population}</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded border border-white/10 mt-2">
                      <div className="text-[10px] text-gray-500 uppercase mb-1">Landmarks</div>
                      <div className="text-xs text-cyan-300">{selectedLocationInfo.landmarks.join(', ')}</div>
                    </div>
                  </div>
                </>
              ) : null}
           </div>
        ) : (
          currentFact && (
            <div className="w-80 bg-black/70 backdrop-blur-md border border-cyan-500/30 p-6 rounded-r-2xl relative pointer-events-auto transform transition-all duration-500 animate-in slide-in-from-left-10">
              <div className="absolute -left-[1px] top-4 bottom-4 w-1 bg-cyan-500 shadow-[0_0_10px_#00f3ff]"></div>
              
              <div className="flex items-center justify-between mb-4 border-b border-cyan-500/20 pb-2">
                <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                  <Database size={12} />
                  ARCHIVE: {currentFact.category}
                </span>
              </div>

              <h2 className="text-xl text-white font-bold mb-3 font-['Rajdhani'] uppercase">
                {currentFact.title}
              </h2>
              <p className="text-cyan-100/80 text-sm leading-relaxed font-light">
                {currentFact.content}
              </p>
            </div>
          )
        )}
      </div>

      {/* Footer Controls */}
      <footer className="flex flex-col items-center gap-4 pb-8 pointer-events-auto w-full max-w-4xl mx-auto">
        
        {/* Timeline Slider */}
        <div className="w-full bg-black/60 backdrop-blur border border-cyan-900/50 p-4 rounded-lg flex items-center gap-4 group hover:border-cyan-500/50 transition-colors">
           <Clock size={20} className="text-cyan-500" />
           <div className="flex flex-col flex-1">
              <div className="flex justify-between text-xs text-cyan-400 font-mono mb-1">
                 <span>-250 MYA (Pangaea)</span>
                 <span className="text-white font-bold">{timelineYear < 0 ? `${Math.abs(timelineYear)} MYA` : `YEAR ${timelineYear}`}</span>
                 <span>+100 MY (Future)</span>
              </div>
              <input 
                type="range" 
                min="-250" 
                max="100" 
                value={timelineYear}
                onChange={(e) => setTimelineYear(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
              />
           </div>
        </div>

        {/* Fact Buttons */}
        <div className="flex gap-4">
          {['Atmosphere', 'Geology', 'Ocean'].map((topic) => (
            <button
              key={topic}
              onClick={() => onRequestFact(topic)}
              disabled={isLoadingFact}
              className="group relative px-6 py-2 bg-black/60 backdrop-blur border border-cyan-900 overflow-hidden hover:border-cyan-400 transition-colors rounded-sm"
            >
              <div className="absolute inset-0 bg-cyan-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <div className="flex flex-col items-center gap-1">
                {isLoadingFact ? <Activity className="animate-spin text-cyan-400" size={16}/> : <Globe className="text-cyan-600 group-hover:text-cyan-400 transition-colors" size={16} />}
                <span className="text-[10px] font-bold text-gray-300 group-hover:text-white uppercase tracking-wider">
                  {topic}
                </span>
              </div>
            </button>
          ))}
          
           <button
              onClick={() => onRequestFact("random")}
              disabled={isLoadingFact}
              className="group relative px-6 py-2 bg-cyan-900/20 backdrop-blur border border-cyan-500/50 hover:bg-cyan-500/20 transition-all rounded-sm"
            >
               <div className="flex flex-col items-center gap-1">
                 <Zap className="text-yellow-400 fill-yellow-400/20" size={16} />
                 <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-wider">
                   Scan
                 </span>
              </div>
            </button>
        </div>
      </footer>

    </div>
  );
};

export default HoloUI;