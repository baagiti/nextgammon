import React from 'react';
import { RunState, Card } from '../types';
import { PLAYER_CARDS } from '../game/cardsData';
import { CardWidget } from './CardWidget';
import { ShoppingBag, Coins, Layers, RotateCcw, ChevronRight, Sparkles } from 'lucide-react';

interface ShopModalProps {
  run: RunState;
  onBuyCard: (card: Card) => void;
  onBuySlot: () => void;
  onBuyReroll: () => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  run,
  onBuyCard,
  onBuySlot,
  onBuyReroll,
  onClose,
}) => {
  // Offer 3 cards for purchase in shop
  const shopCards = PLAYER_CARDS.slice(2, 6);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-slate-900 border-2 border-emerald-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(16,185,129,0.3)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wider">CYBER SHOP</h2>
              <p className="text-xs text-slate-400">Enhance your deck and perk slots with Neon Chips.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 border border-amber-500/50 text-amber-300 font-black text-sm">
            <Coins className="w-5 h-5 text-amber-400" />
            <span>{run.chips} CHIPS</span>
          </div>
        </div>

        {/* Shop Items Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {shopCards.map((card) => {
            const cost = card.cost || 50;
            const canAfford = run.chips >= cost;
            const alreadyOwned = run.deck.some((c) => c.id === card.id);

            return (
              <div
                key={card.id}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-between text-center"
              >
                <div className="scale-90">
                  <CardWidget card={card} />
                </div>

                <button
                  onClick={() => onBuyCard(card)}
                  disabled={!canAfford || alreadyOwned}
                  className={`mt-3 w-full py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                    alreadyOwned
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : canAfford
                      ? 'bg-emerald-500 text-black font-black hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  {alreadyOwned ? 'OWNED' : `BUY (${cost} CHIPS)`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Perks & Service Upgrades */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {/* Equip Slot Upgrade */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center">
                <Layers className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-white">EXPAND CARD SLOT</h4>
                <p className="text-[10px] text-slate-400">Equip 1 additional active card simultaneously.</p>
              </div>
            </div>

            <button
              onClick={onBuySlot}
              disabled={run.chips < 120 || run.maxEquipSlots >= 3}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                run.maxEquipSlots >= 3
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : run.chips >= 120
                  ? 'bg-cyan-500 text-black hover:bg-cyan-400'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {run.maxEquipSlots >= 3 ? 'MAX' : '120 CHIPS'}
            </button>
          </div>

          {/* Reroll Token Upgrade */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-purple-950 border border-purple-500/50 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-white">REROLL TOKEN</h4>
                <p className="text-[10px] text-slate-400">+1 Reroll for future card drafts.</p>
              </div>
            </div>

            <button
              onClick={onBuyReroll}
              disabled={run.chips < 40}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                run.chips >= 40
                  ? 'bg-purple-500 text-black hover:bg-purple-400'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              40 CHIPS
            </button>
          </div>
        </div>

        {/* Leave Shop */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
        >
          NEXT MATCH
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
