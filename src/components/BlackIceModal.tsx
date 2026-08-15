import React from 'react';
import { Snowflake, Check, Sparkles } from 'lucide-react';

interface BlackIceModalProps {
  isOpen: boolean;
  onSelectPoint: (pointIndex: number) => void;
  onClose?: () => void;
  currentSelectedPoint?: number | null;
}

export const BlackIceModal: React.FC<BlackIceModalProps> = ({
  isOpen,
  onSelectPoint,
  currentSelectedPoint,
}) => {
  if (!isOpen) return null;

  // Board arrangement: 1 to 24
  // We can group them into Top Row (13..24) and Bottom Row (12..1) or 1..24 grid
  const points = Array.from({ length: 24 }, (_, i) => i); // 0..23

  const getQuadrantName = (index: number) => {
    if (index >= 0 && index <= 5) return 'Player Home Board';
    if (index >= 6 && index <= 11) return 'Player Outer Board';
    if (index >= 12 && index <= 17) return 'Opponent Outer Board';
    return 'Opponent Home Board';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-cyan-400 rounded-2xl shadow-[0_0_50px_rgba(0,255,255,0.3)] max-w-2xl w-full p-5 sm:p-6 text-white relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-400 to-cyan-500" />

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_#00ffff]">
            <Snowflake className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-wide text-cyan-300 uppercase flex items-center gap-2">
              BLACK ICE - ICY TRAP POINT SELECTION
            </h2>
            <p className="text-xs text-slate-300">
              Select a point (1-24) to cover with Black Ice. Any opponent checker landing here slips directly to the <span className="text-cyan-300 font-bold">BAR</span>!
            </p>
          </div>
        </div>

        {/* Board Representation 24-Point Grid */}
        <div className="my-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] uppercase font-mono font-semibold text-slate-400 mb-2 flex justify-between">
            <span>ALL BOARD POINTS (1 - 24)</span>
            <span>Click to Freeze</span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
            {points.map((p) => {
              const pointNumber = p + 1;
              const isSelected = currentSelectedPoint === p;
              const quad = getQuadrantName(p);

              return (
                <button
                  key={p}
                  onClick={() => onSelectPoint(p)}
                  title={`Point #${pointNumber} (${quad})`}
                  className={`h-14 rounded-lg border font-mono font-black text-xs flex flex-col items-center justify-between p-1 transition-all ${
                    isSelected
                      ? 'bg-cyan-900 border-cyan-300 text-white shadow-[0_0_15px_#00ffff] scale-105 z-10'
                      : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-cyan-400 hover:text-cyan-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-[9px] text-cyan-400">#{pointNumber}</span>
                  <Snowflake className={`w-3.5 h-3.5 ${isSelected ? 'text-white animate-pulse' : 'text-cyan-500/60'}`} />
                  {isSelected ? (
                    <Check className="w-3 h-3 text-emerald-300" />
                  ) : (
                    <span className="text-[7px] text-slate-500 truncate w-full text-center">P{pointNumber}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Presets / Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Tip: Frequently visited points like 6, 12, or 18 make great trap spots.</span>
          </div>

          <button
            onClick={() => {
              const randomPoint = Math.floor(Math.random() * 24);
              onSelectPoint(randomPoint);
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 hover:border-cyan-400 text-slate-200 hover:text-cyan-300 text-xs font-bold transition-all"
          >
            🎲 RANDOM SELECTION
          </button>
        </div>
      </div>
    </div>
  );
};
