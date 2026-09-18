import React from 'react';
import { Upgrades } from '../types';
import { X, Flame, Magnet, Zap, Check, Lock } from 'lucide-react';

interface GarageModalProps {
  totalCoins: number;
  upgrades: Upgrades;
  selectedColor: string;
  onSelectColor: (bodyHex: string, accentHex: string) => void;
  onUpgrade: (type: keyof Upgrades, cost: number) => void;
  onClose: () => void;
}

const CAR_SKINS = [
  { id: 'yellow', name: 'Sunburst Yellow', bodyHex: '#facc15', accentHex: '#f97316', cost: 0, unlocked: true },
  { id: 'orange', name: 'Inferno Sunset', bodyHex: '#ea580c', accentHex: '#facc15', cost: 150, unlocked: true },
  { id: 'cyan', name: 'Cyber Neon', bodyHex: '#06b6d4', accentHex: '#a855f7', cost: 300, unlocked: true },
  { id: 'gold', name: 'Golden Champion', bodyHex: '#eab308', accentHex: '#ffffff', cost: 500, unlocked: true },
];

export const GarageModal: React.FC<GarageModalProps> = ({
  totalCoins,
  upgrades,
  selectedColor,
  onSelectColor,
  onUpgrade,
  onClose,
}) => {
  const getUpgradeCost = (level: number) => level * 75;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Garage & Upgrades</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-slate-400">Available:</span>
              <span className="text-sm font-black text-amber-300 font-mono">★ {totalCoins}</span>
            </div>
          </div>
          <button
            id="close-garage-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Sports Car Skins */}
        <div className="my-4">
          <div className="text-xs font-black text-amber-400 uppercase tracking-wider mb-2.5">
            Sports Car Paint Jobs
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {CAR_SKINS.map(skin => {
              const isSelected = selectedColor === skin.bodyHex;
              return (
                <button
                  key={skin.id}
                  id={`skin-${skin.id}`}
                  onClick={() => onSelectColor(skin.bodyHex, skin.accentHex)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col gap-2 relative ${
                    isSelected
                      ? 'bg-amber-400/10 border-amber-400 shadow-md shadow-amber-400/20'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg border-2 border-white/40 shadow-inner flex items-center justify-center"
                      style={{ backgroundColor: skin.bodyHex }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: skin.accentHex }} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white leading-tight">{skin.name}</div>
                      <div className="text-[10px] text-slate-400">Custom Livery</div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Power-Up Duration Upgrades */}
        <div className="my-2">
          <div className="text-xs font-black text-amber-400 uppercase tracking-wider mb-2.5">
            Power-up Enhancements
          </div>

          <div className="flex flex-col gap-3">
            {/* Nitro Duration */}
            <div className="bg-slate-800/60 border border-slate-700/80 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">Nitro Boost</div>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(lvl => (
                      <div
                        key={lvl}
                        className={`w-3.5 h-1.5 rounded-full ${
                          lvl <= upgrades.nitroDuration ? 'bg-cyan-400' : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {upgrades.nitroDuration < 5 ? (
                <button
                  id="upgrade-nitro-btn"
                  disabled={totalCoins < getUpgradeCost(upgrades.nitroDuration)}
                  onClick={() => onUpgrade('nitroDuration', getUpgradeCost(upgrades.nitroDuration))}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition"
                >
                  ★ {getUpgradeCost(upgrades.nitroDuration)}
                </button>
              ) : (
                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">MAX</span>
              )}
            </div>

            {/* Magnet Duration */}
            <div className="bg-slate-800/60 border border-slate-700/80 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400">
                  <Magnet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">Coin Magnet</div>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(lvl => (
                      <div
                        key={lvl}
                        className={`w-3.5 h-1.5 rounded-full ${
                          lvl <= upgrades.magnetDuration ? 'bg-emerald-400' : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {upgrades.magnetDuration < 5 ? (
                <button
                  id="upgrade-magnet-btn"
                  disabled={totalCoins < getUpgradeCost(upgrades.magnetDuration)}
                  onClick={() => onUpgrade('magnetDuration', getUpgradeCost(upgrades.magnetDuration))}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition"
                >
                  ★ {getUpgradeCost(upgrades.magnetDuration)}
                </button>
              ) : (
                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">MAX</span>
              )}
            </div>

            {/* Coin & Score Multiplier */}
            <div className="bg-slate-800/60 border border-slate-700/80 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">Score Multiplier</div>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(lvl => (
                      <div
                        key={lvl}
                        className={`w-3.5 h-1.5 rounded-full ${
                          lvl <= upgrades.coinMultiplier ? 'bg-amber-400' : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {upgrades.coinMultiplier < 5 ? (
                <button
                  id="upgrade-multiplier-btn"
                  disabled={totalCoins < getUpgradeCost(upgrades.coinMultiplier)}
                  onClick={() => onUpgrade('coinMultiplier', getUpgradeCost(upgrades.coinMultiplier))}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition"
                >
                  ★ {getUpgradeCost(upgrades.coinMultiplier)}
                </button>
              ) : (
                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">MAX</span>
              )}
            </div>
          </div>
        </div>

        {/* Done Button */}
        <button
          id="close-garage-action-btn"
          onClick={onClose}
          className="mt-4 w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm uppercase tracking-wider transition"
        >
          Close Garage
        </button>
      </div>
    </div>
  );
};
