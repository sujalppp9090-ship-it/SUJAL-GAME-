import React, { useEffect } from 'react';
import { GameStats } from '../types';
import { Trophy, RotateCcw, Heart, ShoppingBag, Image as ImageIcon, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameOverModalProps {
  stats: GameStats;
  onRestart: () => void;
  onRevive: () => void;
  onOpenGarage: () => void;
  onOpenScreenshot: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRestart,
  onRevive,
  onOpenGarage,
  onOpenScreenshot,
}) => {
  const isNewHighScore = stats.score >= stats.highScore && stats.score > 0;
  const canAffordRevive = stats.totalCoins >= 50;

  useEffect(() => {
    if (isNewHighScore) {
      try {
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
  }, [isNewHighScore]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-400/50 rounded-3xl p-6 shadow-2xl shadow-black/80 flex flex-col items-center text-center">
        {/* Top Header Badge */}
        <div className="absolute -top-6 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 px-6 py-2 rounded-2xl border-2 border-white shadow-xl shadow-red-500/30">
          <span className="text-xl font-black tracking-widest text-white uppercase italic">
            CRASHED!
          </span>
        </div>

        {/* High Score Celebration */}
        <div className="mt-4 mb-2">
          {isNewHighScore ? (
            <div className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/60 px-3 py-1 rounded-full text-xs font-black text-amber-300 tracking-wider uppercase animate-pulse">
              <Trophy className="w-4 h-4 text-amber-400" />
              NEW RECORD RUN!
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              BEST: {stats.highScore.toLocaleString()}
            </div>
          )}
        </div>

        {/* Final Score Display */}
        <div className="my-2">
          <div className="text-[11px] font-bold text-amber-300 uppercase tracking-widest">FINAL SCORE</div>
          <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight drop-shadow-md">
            {stats.score.toLocaleString()}
          </div>
        </div>

        {/* Run Breakdown Stats Grid */}
        <div className="w-full grid grid-cols-3 gap-2.5 my-4 bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Distance</span>
            <span className="text-base font-black text-cyan-400 font-mono mt-0.5">{stats.distance}m</span>
          </div>

          <div className="flex flex-col items-center border-x border-slate-800 px-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Coins</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs text-amber-400">★</span>
              <span className="text-base font-black text-amber-300 font-mono">+{stats.coins}</span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Near Miss</span>
            <span className="text-base font-black text-rose-400 font-mono mt-0.5">{stats.nearMisses}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5 mt-2">
          {/* Revive / Save Me Button */}
          <button
            id="revive-btn"
            onClick={onRevive}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition border border-emerald-400/50"
          >
            <Heart className="w-5 h-5 fill-current text-white animate-pulse" />
            <span>SAVE ME! (FREE SHIELD + BOOST)</span>
          </button>

          {/* Play Again Button */}
          <button
            id="restart-game-btn"
            onClick={onRestart}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:brightness-105 text-slate-950 font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-400/25 active:scale-[0.98] transition border-2 border-yellow-200"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>PLAY AGAIN</span>
          </button>

          {/* Secondary buttons: Garage & Concept UI Screenshot */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              id="gameover-garage-btn"
              onClick={onOpenGarage}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-slate-700 transition"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Garage / Shop</span>
            </button>

            <button
              id="gameover-screenshot-btn"
              onClick={onOpenScreenshot}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-slate-700 transition"
            >
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <span>Concept Art</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
