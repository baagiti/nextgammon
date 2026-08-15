import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Card } from '../types';
import { CardWidget } from './CardWidget';
import { Sparkles, Trophy, RotateCcw } from 'lucide-react';

interface DraftModalProps {
  choices: Card[];
  rerollsLeft: number;
  onSelectCard: (card: Card) => void;
  onReroll: () => void;
  onSkip: () => void;
}

export const DraftModal: React.FC<DraftModalProps> = ({
  choices,
  rerollsLeft,
  onSelectCard,
  onReroll,
  onSkip,
}) => {
  useEffect(() => {
    // Fire celebratory confetti on open
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#a855f7', '#ff007f', '#fbbf24'],
      });
    } catch (e) {
      // Ignore if web environment
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-slate-900 border-2 border-cyan-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.4)] flex flex-col items-center text-center">
        {/* Header Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-xs font-black uppercase tracking-wider mb-2">
          <Trophy className="w-4 h-4 text-cyan-400" />
          VICTORY REWARD DRAFT
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide mb-1">
          CHOOSE 1 CARD PERK
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6">
          Select a power card to augment your backgammon mechanics for the remainder of this run.
        </p>

        {/* 3 Card Draft Choice Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 w-full justify-items-center">
          {choices.map((card) => (
            <div key={card.id} className="scale-100 hover:scale-105 transition-transform">
              <CardWidget
                card={card}
                onSelect={() => onSelectCard(card)}
              />
            </div>
          ))}
        </div>

        {/* Footer Reroll / Skip Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onReroll}
            disabled={rerollsLeft <= 0}
            className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              rerollsLeft > 0
                ? 'bg-slate-800 border-slate-700 text-cyan-400 hover:bg-slate-700 shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            REROLL ({rerollsLeft} LEFT)
          </button>

          <button
            onClick={onSkip}
            className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition-all"
          >
            SKIP DRAFT
          </button>
        </div>
      </div>
    </div>
  );
};
