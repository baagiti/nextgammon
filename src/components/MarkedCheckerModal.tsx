import React from 'react';
import { Snowflake, Anchor, Navigation, Check, Sparkles } from 'lucide-react';
import { BoardState } from '../types';

export type SelectionType = 'black_ice' | 'deadweight' | 'courier';

interface MarkedCheckerModalProps {
  isOpen: boolean;
  type: SelectionType;
  board: BoardState;
  onSelectPoint: (pointIndex: number) => void;
  currentSelectedPoint?: number | null;
}

export const MarkedCheckerModal: React.FC<MarkedCheckerModalProps> = ({
  isOpen,
  type,
  board,
  onSelectPoint,
  currentSelectedPoint,
}) => {
  if (!isOpen) return null;

  const points = Array.from({ length: 24 }, (_, i) => i); // 0..23

  const getConfig = () => {
    switch (type) {
      case 'deadweight':
        return {
          title: 'DEADWEIGHT - SELECT OPPONENT HEAVY CHECKER',
          subtitle: 'Select an opponent checker to penalize with −1 move distance! The penalty persists as this checker moves.',
          icon: Anchor,
          colorClass: 'pink',
          borderColor: 'border-pink-500',
          textColor: 'text-pink-400',
          bgColor: 'bg-pink-950',
          shadowColor: 'shadow-[0_0_20px_#ff007f]',
          validPoints: points.filter((p) => board.points[p].some((c) => c.color === 'cpu')),
          filterLabel: 'Opponent (CPU) Checkers',
        };
      case 'courier':
        return {
          title: 'COURIER - SELECT YOUR BOOSTED CHECKER',
          subtitle: 'Select one of your checkers to gain +1 move distance speed boost every time it moves!',
          icon: Navigation,
          colorClass: 'emerald',
          borderColor: 'border-emerald-400',
          textColor: 'text-emerald-300',
          bgColor: 'bg-emerald-950',
          shadowColor: 'shadow-[0_0_20px_#00ff66]',
          validPoints: points.filter((p) => board.points[p].some((c) => c.color === 'player')),
          filterLabel: 'Your Checkers',
        };
      case 'black_ice':
      default:
        return {
          title: 'BLACK ICE - SELECT ICY TRAP POINT',
          subtitle: 'Select a board point (1-24) to cover with Black Ice. Any opponent checker landing here slips directly to the Bar!',
          icon: Snowflake,
          colorClass: 'cyan',
          borderColor: 'border-cyan-400',
          textColor: 'text-cyan-300',
          bgColor: 'bg-cyan-950',
          shadowColor: 'shadow-[0_0_20px_#00ffff]',
          validPoints: points,
          filterLabel: 'All Board Points',
        };
    }
  };

  const config = getConfig();
  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`bg-slate-900 border-2 ${config.borderColor} rounded-2xl ${config.shadowColor} max-w-2xl w-full p-5 sm:p-6 text-white relative overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        {/* Glow Header Accent */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-${config.colorClass}-500 via-white to-${config.colorClass}-500`} />

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl ${config.bgColor} border ${config.borderColor} flex items-center justify-center ${config.textColor}`}>
            <IconComponent className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className={`text-lg font-black tracking-wide ${config.textColor} uppercase flex items-center gap-2`}>
              {config.title}
            </h2>
            <p className="text-xs text-slate-300">
              {config.subtitle}
            </p>
          </div>
        </div>

        {/* Board Representation Grid */}
        <div className="my-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] uppercase font-mono font-semibold text-slate-400 mb-2 flex justify-between">
            <span>{config.filterLabel} (Point 1 - 24)</span>
            <span>Click to Designate</span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
            {points.map((p) => {
              const pointNumber = p + 1;
              const isSelected = currentSelectedPoint === p;
              const isValid = config.validPoints.length === 0 || config.validPoints.includes(p);
              const checkerCount = board.points[p].length;
              const checkerOwner = board.points[p][0]?.color;

              return (
                <button
                  key={p}
                  disabled={!isValid}
                  onClick={() => onSelectPoint(p)}
                  title={`Point #${pointNumber} (${checkerCount} Checkers)`}
                  className={`h-14 rounded-lg border font-mono font-black text-xs flex flex-col items-center justify-between p-1 transition-all ${
                    isSelected
                      ? `${config.bgColor} ${config.borderColor} text-white ${config.shadowColor} scale-105 z-10`
                      : isValid
                      ? 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-cyan-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer'
                      : 'bg-slate-950/40 border-slate-900 text-slate-700 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <span className="text-[9px] text-slate-400">#{pointNumber}</span>
                  <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-white animate-bounce' : isValid ? config.textColor : 'text-slate-700'}`} />
                  {isSelected ? (
                    <Check className="w-3 h-3 text-emerald-300" />
                  ) : checkerCount > 0 ? (
                    <span className={`text-[8px] font-bold ${checkerOwner === 'player' ? 'text-cyan-400' : 'text-pink-400'}`}>
                      {checkerCount} {checkerOwner === 'player' ? 'YOU' : 'CPU'}
                    </span>
                  ) : (
                    <span className="text-[7px] text-slate-600">EMPTY</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>You can also select points directly on the board field.</span>
          </div>

          <button
            onClick={() => {
              const available = config.validPoints.length > 0 ? config.validPoints : points;
              const randomPoint = available[Math.floor(Math.random() * available.length)];
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
