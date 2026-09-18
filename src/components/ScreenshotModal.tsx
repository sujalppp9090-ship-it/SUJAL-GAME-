import React, { useState } from 'react';
import { X, Download, Eye, Sparkles, Check, Share2, Maximize2 } from 'lucide-react';

interface ScreenshotModalProps {
  onClose: () => void;
  onCaptureLiveSnapshot: () => void;
  lastLiveSnapshot?: string | null;
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  onClose,
  onCaptureLiveSnapshot,
  lastLiveSnapshot,
}) => {
  const [activeTab, setActiveTab] = useState<'concept' | 'live'>('concept');
  const [copied, setCopied] = useState(false);

  // Concept art image generated matching the prompt
  const conceptArtUrl = '/src/assets/images/runner_concept_art_1789716400824.jpg';

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    link.click();
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-lg animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-4xl max-h-[95vh] bg-slate-900/95 border border-amber-400/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/60 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                Unity Concept Art & UI Screenshot
              </h2>
              <p className="text-xs text-slate-400">
                Subway Surfers Style 3D Mobile Endless Runner Concept
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="share-link-btn"
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition"
              title="Share Link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>

            <button
              id="close-screenshot-modal-btn"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-5 pt-3 pb-1 border-b border-slate-800/80 bg-slate-950/40">
          <button
            id="tab-concept-btn"
            onClick={() => setActiveTab('concept')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'concept'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Rendered Concept UI Screenshot
          </button>

          <button
            id="tab-live-btn"
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'live'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live 3D Gameplay Snapshot
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left / Center: Screenshot Display */}
          <div className="md:col-span-7 flex flex-col items-center justify-center">
            {activeTab === 'concept' ? (
              <div className="relative group max-w-[320px] sm:max-w-[340px] rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl bg-black">
                <img
                  src={conceptArtUrl}
                  alt="A 3D vibrant mobile endless runner game UI screenshot Subway Surfers style"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-cover transform group-hover:scale-102 transition duration-300"
                />
                <div className="absolute bottom-3 right-3">
                  <button
                    onClick={() => handleDownload(conceptArtUrl, 'turbo_rush_concept_screenshot.jpg')}
                    className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-white/20 text-white shadow-lg transition"
                    title="Download High-Res Screenshot"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center gap-3">
                {lastLiveSnapshot ? (
                  <div className="relative group max-w-[340px] rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl bg-black">
                    <img
                      src={lastLiveSnapshot}
                      alt="Live 3D Canvas Snapshot"
                      className="w-full h-auto object-cover"
                    />
                    <div className="absolute bottom-3 right-3">
                      <button
                        onClick={() => handleDownload(lastLiveSnapshot, 'turbo_rush_live_snapshot.png')}
                        className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-white/20 text-white shadow-lg transition"
                        title="Download Live Snapshot"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 rounded-3xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                    <p className="text-sm font-bold mb-2">No live snapshot captured yet.</p>
                    <p className="text-xs text-slate-500 mb-4">Click below to snap a frame from the live 3D engine!</p>
                  </div>
                )}

                <button
                  id="capture-snapshot-btn"
                  onClick={onCaptureLiveSnapshot}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  Capture New Live Snapshot
                </button>
              </div>
            )}
          </div>

          {/* Right: Technical Spec & Game Concept Breakdown */}
          <div className="md:col-span-5 flex flex-col gap-4 text-left">
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
              <div className="text-[11px] font-black text-amber-400 uppercase tracking-wider mb-2">
                Game Concept Specification
              </div>
              <ul className="text-xs text-slate-300 space-y-2 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">🏎️</span>
                  <span><strong>High-Speed Sports Car:</strong> Automatic forward drive, reactive lane steering roll, suspension physics.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">🛺</span>
                  <span><strong>Auto-Rickshaws & Buses:</strong> Dynamic oncoming traffic with animated suspension wobble and high-profile silhouettes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">🪙</span>
                  <span><strong>Subway Surfers Collectibles:</strong> Floating gold coin arches, electromagnetic coin pull, rocket nitro boosts.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">🎥</span>
                  <span><strong>Dynamic Low-Angle Cam:</strong> Low-to-ground camera angle looking up into the bright sunny cartoon city skyline.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <button
                id="modal-play-btn"
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 transition"
              >
                Back to Live Game
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
