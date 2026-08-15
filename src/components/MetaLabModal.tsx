import React from 'react';
import { MetaData, MetaUpgrade } from '../types';
import { INITIAL_META_UPGRADES } from '../game/cardsData';
import { Cpu, Zap, Layers, Search, RotateCcw, Palette, Binary, Coins, Sparkles, Check, Lock, X } from 'lucide-react';

interface MetaLabModalProps {
  meta: MetaData;
  onPurchase: (upgradeId: string) => void;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Coins,
  Layers,
  Search,
  RotateCcw,
  Zap,
  Palette,
  Binary,
};

export const MetaLabModal: React.FC<MetaLabModalProps> = ({ meta, onPurchase, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-slate-900 border-2 border-cyan-500/60 rounded-2xl p-6 shadow-[0_0_60px_rgba(6,182,212,0.4)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_20px_#00f0ff]">
              <Cpu className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-widest uppercase">THE CYBER LAB</h2>
              <p className="text-xs text-slate-400">Permanent meta-progression matrix and rule hack transformations.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 border border-cyan-500/50 text-cyan-300 font-black text-sm shadow-md">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-spin" />
              <span>{meta.cyberData} CYBER-DATA</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Upgrades List Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {INITIAL_META_UPGRADES.map((upgrade) => {
            const currentLevel = meta.unlockedUpgrades[upgrade.id] || 0;
            const isMaxed = currentLevel >= upgrade.maxLevel;
            const nextCost = upgrade.cost * (currentLevel + 1);
            const canAfford = meta.cyberData >= nextCost && !isMaxed;
            const IconComp = ICON_MAP[upgrade.icon] || Zap;

            return (
              <div
                key={upgrade.id}
                className={`bg-slate-950/80 border rounded-xl p-3.5 flex items-start justify-between gap-3 transition-all ${
                  isMaxed
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : canAfford
                    ? 'border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                      isMaxed
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                        : 'bg-cyan-950 border-cyan-500/50 text-cyan-300'
                    }`}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-white tracking-wide">{upgrade.name}</h4>
                      <span className="text-[10px] text-cyan-400 font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800">
                        LV {currentLevel}/{upgrade.maxLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-tight">{upgrade.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => onPurchase(upgrade.id)}
                  disabled={!canAfford || isMaxed}
                  className={`px-3 py-2 rounded-lg font-black text-xs uppercase tracking-wider shrink-0 transition-all flex items-center gap-1 ${
                    isMaxed
                      ? 'bg-emerald-950 border border-emerald-500 text-emerald-400 cursor-default'
                      : canAfford
                      ? 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  {isMaxed ? (
                    <>
                      <Check className="w-4 h-4" /> MAXED
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      {nextCost} DATA
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Stats Summary */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>GAMES PLAYED: {meta.totalGamesPlayed}</span>
          <span>RUN WINS: {meta.totalWins}</span>
          <span>HIGHEST STAGE: {meta.highestStage}</span>
        </div>
      </div>
    </div>
  );
};
