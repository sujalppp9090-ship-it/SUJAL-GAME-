import React from 'react';
import { CameraViewMode } from '../types';
import { Play, RotateCcw, Volume2, VolumeX, Camera, ShoppingBag, Image as ImageIcon, X } from 'lucide-react';

interface PauseModalProps {
  cameraMode: CameraViewMode;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onResume: () => void;
  onRestart: () => void;
  onSelectCamera: (mode: CameraViewMode) => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onOpenGarage: () => void;
  onOpenScreenshot: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  cameraMode,
  soundEnabled,
  musicEnabled,
  onResume,
  onRestart,
  onSelectCamera,
  onToggleSound,
  onToggleMusic,
  onOpenGarage,
  onOpenScreenshot,
}) => {
  const cameraModes: { id: CameraViewMode; label: string; desc: string }[] = [
    { id: 'low-angle', label: 'Dynamic Low-Angle', desc: 'Subway Surfers signature perspective' },
    { id: 'chase', label: 'Action Chase', desc: 'Higher rear sports car follow cam' },
    { id: 'top-down', label: 'Top-Down Arcade', desc: 'Retro 90s overhead highway view' },
    { id: 'cinematic', label: 'Cinema Close-up', desc: 'Low asphalt bumper camera' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-center">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="text-lg font-black text-white uppercase tracking-wider">GAME PAUSED</div>
          <button
            id="close-pause-btn"
            onClick={onResume}
            className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            id="resume-btn"
            onClick={onResume}
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-400/25 transition active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME</span>
          </button>

          <button
            id="restart-pause-btn"
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART RUN</span>
          </button>
        </div>

        {/* Camera Selector */}
        <div className="text-left mt-1">
          <div className="text-[11px] font-black text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Perspective</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {cameraModes.map(c => (
              <button
                key={c.id}
                id={`cam-select-${c.id}`}
                onClick={() => onSelectCamera(c.id)}
                className={`p-2 rounded-xl text-left border text-xs transition ${
                  cameraMode === c.id
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="font-black text-[11px] leading-tight">{c.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sound & Music Toggles */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            id="toggle-sfx-btn"
            onClick={onToggleSound}
            className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>SFX: {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            id="toggle-bgm-btn"
            onClick={onToggleMusic}
            className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
              musicEnabled
                ? 'bg-slate-800 border-slate-700 text-cyan-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <span>BGM: {musicEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Shop & Screenshot Links */}
        <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-3">
          <button
            id="pause-garage-btn"
            onClick={onOpenGarage}
            className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>Garage</span>
          </button>

          <button
            id="pause-screenshot-btn"
            onClick={onOpenScreenshot}
            className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Concept Art</span>
          </button>
        </div>
      </div>
    </div>
  );
};
