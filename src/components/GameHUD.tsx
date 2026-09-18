import React from 'react';
import { GameStats, ActivePowerups, CameraViewMode, Mission } from '../types';
import { Pause, Volume2, VolumeX, Camera, Flame, Magnet, Shield, Trophy, Zap, Image as ImageIcon } from 'lucide-react';

interface GameHUDProps {
  stats: GameStats;
  powerups: ActivePowerups;
  cameraMode: CameraViewMode;
  soundEnabled: boolean;
  activeMission?: Mission;
  nearMissActive: boolean;
  onPause: () => void;
  onToggleSound: () => void;
  onCycleCamera: () => void;
  onOpenScreenshotMode: () => void;
  onOpenGarage: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  powerups,
  cameraMode,
  soundEnabled,
  activeMission,
  nearMissActive,
  onPause,
  onToggleSound,
  onCycleCamera,
  onOpenScreenshotMode,
  onOpenGarage,
}) => {
  const cameraLabels: Record<CameraViewMode, string> = {
    'low-angle': 'Low Angle',
    'chase': 'Chase Cam',
    'top-down': 'Top Down',
    'cinematic': 'Cinema',
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20 select-none">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Action controls & camera switcher */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            id="hud-pause-btn"
            onClick={onPause}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 flex items-center justify-center text-white hover:bg-slate-800 transition active:scale-95 shadow-lg shadow-black/20"
            title="Pause Game"
          >
            <Pause className="w-5 h-5 fill-current" />
          </button>

          <button
            id="hud-sound-btn"
            onClick={onToggleSound}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 flex items-center justify-center text-white hover:bg-slate-800 transition active:scale-95 shadow-lg shadow-black/20"
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-rose-400" />}
          </button>

          <button
            id="hud-camera-btn"
            onClick={onCycleCamera}
            className="h-10 sm:h-11 px-3 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase text-white hover:bg-slate-800 transition active:scale-95 shadow-lg shadow-black/20"
            title="Switch Camera View"
          >
            <Camera className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">{cameraLabels[cameraMode]}</span>
          </button>

          <button
            id="hud-screenshot-mode-btn"
            onClick={onOpenScreenshotMode}
            className="h-10 sm:h-11 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 hover:brightness-110 transition active:scale-95 shadow-lg shadow-amber-500/25"
            title="View Unity Concept Screenshot"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Concept Art UI</span>
          </button>
        </div>

        {/* Center/Right: Subway Surfers High-Impact Score & Coins HUD */}
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
          {/* Main Score Board */}
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border-2 border-amber-400/40 shadow-xl shadow-black/40">
            <div className="flex items-center gap-1 bg-amber-400 text-slate-950 px-2 py-0.5 rounded-lg text-xs font-black tracking-wider uppercase">
              <Zap className="w-3.5 h-3.5 fill-current text-slate-950" />
              <span>x{stats.multiplier}</span>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-amber-300 uppercase tracking-widest leading-none">SCORE</div>
              <div className="text-xl sm:text-2xl font-black text-white tracking-wider tabular-nums font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {stats.score.toLocaleString()}
              </div>
            </div>
          </div>

          {/* High Score & Coins Row */}
          <div className="flex items-center gap-2">
            {/* Coins Counter */}
            <div
              onClick={onOpenGarage}
              className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-xl border border-amber-400/30 cursor-pointer hover:border-amber-400 transition"
              title="Open Garage"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-yellow-100 flex items-center justify-center shadow-md shadow-amber-500/50 animate-pulse">
                <span className="text-[10px] font-black text-slate-900">★</span>
              </div>
              <span className="text-sm sm:text-base font-black text-amber-300 font-mono tabular-nums">
                {stats.coins.toLocaleString()}
              </span>
            </div>

            {/* High Score Badge */}
            {stats.highScore > 0 && (
              <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700/60 text-xs font-bold text-slate-300">
                <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="tabular-nums font-mono">{stats.highScore.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Near Miss Floating Popup */}
      {nearMissActive && (
        <div className="self-center animate-bounce">
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black px-4 py-1.5 rounded-full shadow-xl shadow-yellow-500/40 text-sm uppercase tracking-wider border-2 border-white">
            ⚡ NEAR MISS! +250 PTS
          </div>
        </div>
      )}

      {/* Middle-Left: Active Power-up Timers Stack */}
      <div className="self-start flex flex-col gap-2 mt-auto mb-16 pointer-events-none">
        {/* Nitro Boost Timer */}
        {powerups.nitro > 0 && (
          <div className="flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-md border border-cyan-400/60 px-3 py-1.5 rounded-xl shadow-lg shadow-cyan-500/20 animate-pulse">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="text-[10px] font-black text-cyan-300 uppercase tracking-wider">NITRO BOOST</div>
              <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5 border border-cyan-500/30">
                <div
                  className="h-full bg-cyan-400 transition-all duration-100"
                  style={{ width: `${Math.min(100, (powerups.nitro / 6) * 100)}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-black text-cyan-300 font-mono ml-1">
              {powerups.nitro.toFixed(1)}s
            </span>
          </div>
        )}

        {/* Magnet Timer */}
        {powerups.magnet > 0 && (
          <div className="flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-md border border-emerald-400/60 px-3 py-1.5 rounded-xl shadow-lg shadow-emerald-500/20">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
              <Magnet className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">COIN MAGNET</div>
              <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5 border border-emerald-500/30">
                <div
                  className="h-full bg-emerald-400 transition-all duration-100"
                  style={{ width: `${Math.min(100, (powerups.magnet / 8) * 100)}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-black text-emerald-300 font-mono ml-1">
              {powerups.magnet.toFixed(1)}s
            </span>
          </div>
        )}

        {/* Shield Indicator */}
        {powerups.shield && (
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-purple-400/60 px-3 py-1.5 rounded-xl shadow-lg shadow-purple-500/20">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400 flex items-center justify-center text-purple-400">
              <Shield className="w-4 h-4 fill-current" />
            </div>
            <div className="text-[10px] font-black text-purple-300 uppercase tracking-wider">SHIELD ACTIVE</div>
          </div>
        )}
      </div>

      {/* Bottom Bar: Distance & Missions */}
      <div className="flex items-end justify-between w-full pointer-events-auto">
        {/* Mission Objective */}
        {activeMission && (
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <span className="font-bold text-amber-400">MISSION:</span>
            <span>{activeMission.title}</span>
            <span className="font-mono text-white font-bold ml-1">
              {activeMission.current}/{activeMission.target}
            </span>
          </div>
        )}

        {/* Distance Traveled */}
        <div className="ml-auto bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-right">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">DISTANCE</div>
          <div className="text-sm sm:text-base font-black text-white font-mono tracking-tight">
            {stats.distance} <span className="text-xs text-cyan-400">m</span>
          </div>
        </div>
      </div>
    </div>
  );
};
