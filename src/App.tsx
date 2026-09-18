/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RunnerEngine } from './game/RunnerEngine';
import { sound } from './game/SoundEngine';
import { GameStats, ActivePowerups, CameraViewMode, Upgrades, Mission } from './types';
import { GameHUD } from './components/GameHUD';
import { ControlsOverlay } from './components/ControlsOverlay';
import { GameOverModal } from './components/GameOverModal';
import { GarageModal } from './components/GarageModal';
import { ScreenshotModal } from './components/ScreenshotModal';
import { PauseModal } from './components/PauseModal';
import { Play, Sparkles, Trophy, ShoppingBag, Zap, Image as ImageIcon, Flame, Shield, Magnet } from 'lucide-react';

const INITIAL_MISSIONS: Mission[] = [
  { id: '1', title: 'Dodge 8 Auto-Rickshaws', target: 8, current: 0, rewardCoins: 50, completed: false },
  { id: '2', title: 'Collect 60 Gold Coins', target: 60, current: 0, rewardCoins: 100, completed: false },
  { id: '3', title: 'Travel 1,200 Meters', target: 1200, current: 0, rewardCoins: 150, completed: false },
  { id: '4', title: 'Ignite 2 Nitro Boosts', target: 2, current: 0, rewardCoins: 80, completed: false },
];

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<RunnerEngine | null>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('low-angle');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);

  // Modals
  const [showGarage, setShowGarage] = useState(false);
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [liveSnapshot, setLiveSnapshot] = useState<string | null>(null);

  // Near miss visual feedback
  const [nearMissActive, setNearMissActive] = useState(false);

  // Car custom livery
  const [carColor, setCarColor] = useState({
    bodyHex: '#facc15',
    accentHex: '#f97316',
  });

  // Upgrades
  const [upgrades, setUpgrades] = useState<Upgrades>({
    nitroDuration: 1,
    magnetDuration: 1,
    coinMultiplier: 1,
  });

  // Missions
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const activeMission = missions.find(m => !m.completed);

  // Game Stats
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    coins: 0,
    totalCoins: 250, // Starter coins to test upgrades!
    distance: 0,
    multiplier: 12,
    nearMisses: 0,
    rickshawsDodged: 0,
    busesDodged: 0,
    nitroUsed: 0,
  });

  const [powerups, setPowerups] = useState<ActivePowerups>({
    nitro: 0,
    magnet: 0,
    shield: false,
  });

  // Initialize Three.js 3D Game Engine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new RunnerEngine(containerRef.current);
    engineRef.current = engine;

    // Connect Engine Callbacks
    engine.onStatsUpdate = (newStats, newPowerups) => {
      setStats(prev => ({
        ...newStats,
        highScore: Math.max(prev.highScore, newStats.score),
        totalCoins: prev.totalCoins + (newStats.coins - prev.coins),
      }));
      setPowerups({ ...newPowerups });

      // Update Mission progress
      setMissions(prevMissions =>
        prevMissions.map(m => {
          if (m.completed) return m;
          let current = m.current;
          if (m.id === '1') current = newStats.rickshawsDodged;
          else if (m.id === '2') current = newStats.coins;
          else if (m.id === '3') current = newStats.distance;
          else if (m.id === '4') current = newStats.nitroUsed;

          const completed = current >= m.target;
          return { ...m, current: Math.min(current, m.target), completed };
        })
      );
    };

    engine.onGameOver = finalStats => {
      setIsGameOver(true);
      setStats(prev => ({
        ...finalStats,
        highScore: Math.max(prev.highScore, finalStats.score),
      }));
    };

    engine.onNearMiss = () => {
      setNearMissActive(true);
      setTimeout(() => setNearMissActive(false), 900);
    };

    // Load saved high score and coins from localStorage if present
    try {
      const savedHigh = localStorage.getItem('turborush_highScore');
      const savedCoins = localStorage.getItem('turborush_coins');
      if (savedHigh) {
        const val = parseInt(savedHigh, 10);
        if (!isNaN(val)) setStats(s => ({ ...s, highScore: val }));
      }
      if (savedCoins) {
        const val = parseInt(savedCoins, 10);
        if (!isNaN(val)) setStats(s => ({ ...s, totalCoins: Math.max(s.totalCoins, val) }));
      }
    } catch {
      // ignore
    }

    return () => {
      engine.destroy();
    };
  }, []);

  // Save High Score
  useEffect(() => {
    if (stats.highScore > 0) {
      try {
        localStorage.setItem('turborush_highScore', stats.highScore.toString());
      } catch {
        // ignore
      }
    }
  }, [stats.highScore]);

  // Save Coins
  useEffect(() => {
    if (stats.totalCoins > 0) {
      try {
        localStorage.setItem('turborush_coins', stats.totalCoins.toString());
      } catch {
        // ignore
      }
    }
  }, [stats.totalCoins]);

  // Player controls handlers
  const handleMoveLeft = useCallback(() => {
    engineRef.current?.moveLeft();
  }, []);

  const handleMoveRight = useCallback(() => {
    engineRef.current?.moveRight();
  }, []);

  const handleJump = useCallback(() => {
    engineRef.current?.jump();
  }, []);

  const handleSlide = useCallback(() => {
    engineRef.current?.slide();
  }, []);

  const handleNitro = useCallback(() => {
    engineRef.current?.activateNitroManual();
  }, []);

  const handleStartGame = () => {
    setHasStarted(true);
    setIsGameOver(false);
    setIsPaused(false);
    engineRef.current?.start();
  };

  const handleRestartGame = () => {
    setIsGameOver(false);
    setIsPaused(false);
    setShowPause(false);
    engineRef.current?.restart();
  };

  const handleReviveGame = () => {
    setIsGameOver(false);
    engineRef.current?.revive();
  };

  const handlePause = () => {
    if (!hasStarted || isGameOver) return;
    setIsPaused(true);
    setShowPause(true);
    engineRef.current?.pause();
  };

  const handleResume = () => {
    setIsPaused(false);
    setShowPause(false);
    engineRef.current?.resume();
  };

  const handleCycleCamera = () => {
    const modes: CameraViewMode[] = ['low-angle', 'chase', 'top-down', 'cinematic'];
    const nextIdx = (modes.indexOf(cameraMode) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    setCameraMode(nextMode);
    engineRef.current?.setCameraMode(nextMode);
  };

  const handleSelectCamera = (mode: CameraViewMode) => {
    setCameraMode(mode);
    engineRef.current?.setCameraMode(mode);
  };

  const handleToggleSound = () => {
    const next = sound.toggleSound();
    setSoundEnabled(next);
  };

  const handleToggleMusic = () => {
    const next = sound.toggleMusic();
    setMusicEnabled(next);
  };

  // Car Paint Livery selection
  const handleSelectCarColor = (bodyHex: string, accentHex: string) => {
    setCarColor({ bodyHex, accentHex });
    engineRef.current?.setCarColor(bodyHex, accentHex);
  };

  // Upgrades
  const handleUpgrade = (type: keyof Upgrades, cost: number) => {
    if (stats.totalCoins < cost) return;

    setStats(prev => ({ ...prev, totalCoins: prev.totalCoins - cost }));
    setUpgrades(prev => {
      const next = { ...prev, [type]: prev[type] + 1 };
      if (engineRef.current) {
        engineRef.current.upgrades = next;
      }
      return next;
    });
  };

  // Capture Live WebGL canvas screenshot
  const handleCaptureLiveSnapshot = () => {
    if (!engineRef.current) return;
    try {
      const dataUrl = engineRef.current.renderer.domElement.toDataURL('image/png');
      setLiveSnapshot(dataUrl);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none touch-none">
      {/* 3D WebGL Canvas Viewport */}
      <div
        id="runner-3d-viewport"
        ref={containerRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Speed Warp Screen Vignette when Nitro is Active */}
      {powerups.nitro > 0 && (
        <div className="absolute inset-0 pointer-events-none z-15 border-[12px] sm:border-[16px] border-cyan-400/30 shadow-[inset_0_0_100px_rgba(6,182,212,0.4)] animate-pulse" />
      )}

      {/* In-Game Subway Surfers HUD */}
      {hasStarted && !isGameOver && (
        <GameHUD
          stats={stats}
          powerups={powerups}
          cameraMode={cameraMode}
          soundEnabled={soundEnabled}
          activeMission={activeMission}
          nearMissActive={nearMissActive}
          onPause={handlePause}
          onToggleSound={handleToggleSound}
          onCycleCamera={handleCycleCamera}
          onOpenScreenshotMode={() => {
            handlePause();
            setShowScreenshot(true);
          }}
          onOpenGarage={() => {
            handlePause();
            setShowGarage(true);
          }}
        />
      )}

      {/* Touch and Keyboard Controls Overlay */}
      {hasStarted && !isGameOver && !isPaused && (
        <ControlsOverlay
          onMoveLeft={handleMoveLeft}
          onMoveRight={handleMoveRight}
          onJump={handleJump}
          onSlide={handleSlide}
          onNitro={handleNitro}
          isNitroAvailable={powerups.nitro === 0}
        />
      )}

      {/* Start Screen / Subway Surfers Arcade Splash */}
      {!hasStarted && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 sm:p-10 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/60 pointer-events-auto">
          {/* Top Bar on Start Screen */}
          <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-amber-400/40 text-amber-300 font-mono font-bold text-sm">
                <span>★</span>
                <span>{stats.totalCoins}</span>
              </div>

              {stats.highScore > 0 && (
                <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700/60 text-xs font-bold text-slate-300">
                  <Trophy className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-mono">{stats.highScore.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                id="start-sound-toggle-btn"
                onClick={handleToggleSound}
                className="w-10 h-10 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 flex items-center justify-center text-white hover:bg-slate-800 transition"
                title="Toggle Sound"
              >
                {soundEnabled ? <Zap className="w-5 h-5 text-amber-400 fill-current" /> : <Zap className="w-5 h-5 text-slate-500" />}
              </button>

              <button
                id="start-concept-art-btn"
                onClick={() => setShowScreenshot(true)}
                className="h-10 px-3.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 hover:border-cyan-400 text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5 transition"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Concept Art</span>
              </button>
            </div>
          </div>

          {/* Center: Vibrant Game Logo & Hero Callout */}
          <div className="flex flex-col items-center text-center my-auto">
            {/* Subway Surfers Style Title Badge */}
            <div className="relative inline-block mb-3">
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-300 rounded-3xl blur-md opacity-75 animate-pulse" />
              <div className="relative bg-slate-950 border-3 border-amber-400 px-6 sm:px-10 py-3 sm:py-4 rounded-3xl shadow-2xl">
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                  TURBO RUSH 3D
                </h1>
                <div className="text-[10px] sm:text-xs font-black tracking-widest text-cyan-300 uppercase mt-0.5">
                  SUBWAY SURFERS RACING EDITION • UNITY GAME CONCEPT
                </div>
              </div>
            </div>

            {/* Quick Feature Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-md my-3">
              <span className="bg-slate-900/80 border border-slate-700 px-3 py-1 rounded-full text-[11px] font-bold text-amber-300">
                🏎️ Yellow Sports Car
              </span>
              <span className="bg-slate-900/80 border border-slate-700 px-3 py-1 rounded-full text-[11px] font-bold text-emerald-300">
                🛺 Auto-Rickshaws
              </span>
              <span className="bg-slate-900/80 border border-slate-700 px-3 py-1 rounded-full text-[11px] font-bold text-rose-300">
                🚌 City Transit Buses
              </span>
              <span className="bg-slate-900/80 border border-slate-700 px-3 py-1 rounded-full text-[11px] font-bold text-cyan-300">
                ⚡ Nitro Boosters
              </span>
            </div>

            {/* Large Play Button */}
            <button
              id="start-game-btn"
              onClick={handleStartGame}
              className="group relative mt-4 px-10 sm:px-14 py-4 sm:py-5 rounded-3xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-lg sm:text-xl uppercase tracking-widest shadow-[0_10px_30px_rgba(245,158,11,0.5)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.7)] hover:scale-105 active:scale-95 transition border-2 border-white flex items-center gap-3"
            >
              <Play className="w-7 h-7 fill-current group-hover:translate-x-1 transition" />
              <span>TAP TO DRIVE!</span>
            </button>
          </div>

          {/* Bottom Bar: Garage & Controls Guide */}
          <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
            <button
              id="start-open-garage-btn"
              onClick={() => setShowGarage(true)}
              className="h-12 px-5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 hover:border-amber-400 text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2 shadow-lg transition"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>GARAGE & UPGRADES</span>
            </button>

            <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-400 bg-slate-900/70 px-4 py-2 rounded-2xl border border-slate-800">
              <span>Swipe or A/D to Dodge</span>
              <span>•</span>
              <span>Space to Jump</span>
              <span>•</span>
              <span>S to Duck</span>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <GameOverModal
          stats={stats}
          onRestart={handleRestartGame}
          onRevive={handleReviveGame}
          onOpenGarage={() => setShowGarage(true)}
          onOpenScreenshot={() => setShowScreenshot(true)}
        />
      )}

      {/* Garage / Upgrades Modal */}
      {showGarage && (
        <GarageModal
          totalCoins={stats.totalCoins}
          upgrades={upgrades}
          selectedColor={carColor.bodyHex}
          onSelectColor={handleSelectCarColor}
          onUpgrade={handleUpgrade}
          onClose={() => setShowGarage(false)}
        />
      )}

      {/* Concept Art & UI Screenshot Modal */}
      {showScreenshot && (
        <ScreenshotModal
          onClose={() => setShowScreenshot(false)}
          onCaptureLiveSnapshot={handleCaptureLiveSnapshot}
          lastLiveSnapshot={liveSnapshot}
        />
      )}

      {/* Pause Modal */}
      {showPause && (
        <PauseModal
          cameraMode={cameraMode}
          soundEnabled={soundEnabled}
          musicEnabled={musicEnabled}
          onResume={handleResume}
          onRestart={handleRestartGame}
          onSelectCamera={handleSelectCamera}
          onToggleSound={handleToggleSound}
          onToggleMusic={handleToggleMusic}
          onOpenGarage={() => {
            setShowPause(false);
            setShowGarage(true);
          }}
          onOpenScreenshot={() => {
            setShowPause(false);
            setShowScreenshot(true);
          }}
        />
      )}
    </div>
  );
}
