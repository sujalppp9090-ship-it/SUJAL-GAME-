import React, { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Zap } from 'lucide-react';

interface ControlsOverlayProps {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  onSlide: () => void;
  onNitro: () => void;
  isNitroAvailable: boolean;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  onMoveLeft,
  onMoveRight,
  onJump,
  onSlide,
  onNitro,
  isNitroAvailable,
}) => {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        onMoveLeft();
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        onMoveRight();
      } else if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        e.preventDefault();
        onJump();
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        onSlide();
      } else if (['ShiftLeft', 'ShiftRight', 'KeyN'].includes(e.code)) {
        e.preventDefault();
        onNitro();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onMoveLeft, onMoveRight, onJump, onSlide, onNitro]);

  // Touch Swipe Gesture handler
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;

    const minSwipeDist = 25;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (dt < 400) {
      if (absX > absY && absX > minSwipeDist) {
        if (dx > 0) onMoveRight();
        else onMoveLeft();
      } else if (absY > absX && absY > minSwipeDist) {
        if (dy < 0) onJump();
        else onSlide();
      }
    }
    touchStartRef.current = null;
  };

  return (
    <div
      id="controls-touch-surface"
      className="absolute inset-0 z-10 select-none touch-none flex flex-col justify-end p-4 sm:p-6"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* On-screen arcade touch buttons for quick tapping on mobile / tablet */}
      <div className="w-full flex items-center justify-between pointer-events-auto">
        {/* Left Side: Steering buttons */}
        <div className="flex items-center gap-3">
          <button
            id="ctrl-left-btn"
            onClick={onMoveLeft}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:bg-amber-400 active:text-slate-950 transition active:scale-95 shadow-xl shadow-black/40"
            title="Steer Left (A / Left Arrow)"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>

          <button
            id="ctrl-right-btn"
            onClick={onMoveRight}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:bg-amber-400 active:text-slate-950 transition active:scale-95 shadow-xl shadow-black/40"
            title="Steer Right (D / Right Arrow)"
          >
            <ArrowRight className="w-7 h-7" />
          </button>
        </div>

        {/* Center: Desktop keyboard hints (hidden on small touchscreens) */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/50 text-[11px] font-mono text-slate-300">
          <span className="px-1.5 py-0.5 bg-slate-800 rounded font-bold text-amber-400">A/D</span> Steer
          <span className="text-slate-600">|</span>
          <span className="px-1.5 py-0.5 bg-slate-800 rounded font-bold text-amber-400">SPACE</span> Jump
          <span className="text-slate-600">|</span>
          <span className="px-1.5 py-0.5 bg-slate-800 rounded font-bold text-amber-400">S</span> Duck
          <span className="text-slate-600">|</span>
          <span className="px-1.5 py-0.5 bg-slate-800 rounded font-bold text-amber-400">N</span> Nitro
        </div>

        {/* Right Side: Jump, Slide, and Nitro trigger */}
        <div className="flex items-center gap-3">
          <button
            id="ctrl-slide-btn"
            onClick={onSlide}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:bg-amber-400 active:text-slate-950 transition active:scale-95 shadow-xl shadow-black/40"
            title="Duck / Slide (S / Down Arrow)"
          >
            <ArrowDown className="w-6 h-6" />
          </button>

          <button
            id="ctrl-jump-btn"
            onClick={onJump}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-400/90 text-slate-950 border-2 border-amber-300 flex items-center justify-center font-black active:scale-95 transition shadow-xl shadow-amber-400/30"
            title="Jump / Stunt Ramp (W / Space / Up Arrow)"
          >
            <ArrowUp className="w-7 h-7 stroke-[3]" />
          </button>

          {isNitroAvailable && (
            <button
              id="ctrl-nitro-btn"
              onClick={onNitro}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-white border-2 border-cyan-300 flex items-center justify-center font-black active:scale-95 transition shadow-xl shadow-cyan-500/40 animate-pulse"
              title="Activate Nitro (Shift / N)"
            >
              <Zap className="w-7 h-7 fill-current" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
