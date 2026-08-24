import React from 'react';
import { useTranslation } from 'react-i18next';
import { MetaData } from '../types';
import { BUYBACK_CARD_COST, SKIP_STAGE_COST, REROLL_DIE_COST } from './RunMapModal';
import { COLD_STORAGE_COST } from './CardSelectModal';
import { CHIPS_100K_AMOUNT } from '../iap/purchases';
import { Cpu, RotateCcw, FastForward, Coins, ShieldPlus, Sparkles, X, MapPin, Loader2 } from 'lucide-react';

interface MetaLabModalProps {
  meta: MetaData;
  onClose: () => void;
  onBuyChips: () => void;
  buyChipsLoading: boolean;
  buyChipsError: string | null;
  buyChipsJustSucceeded: boolean;
  /** Localized store price (e.g. "$0.99", "₺39,99"), or null while it's still unknown. */
  chipsPrice: string | null;
}

// The only 4 things Neon Chips actually buy in this game. Each is a pay-per-use action tied to a
// specific screen (not a standing purchase), so this modal is a reference list, not a shop — the
// action itself always happens where it's contextually valid (run map, mid-match, equip screen).
const CHIP_SINKS = [
  { key: 'buyBackCard', icon: Coins, cost: BUYBACK_CARD_COST, location: 'runMap' },
  { key: 'skipStage', icon: FastForward, cost: SKIP_STAGE_COST, location: 'runMap' },
  { key: 'rerollDie', icon: RotateCcw, cost: REROLL_DIE_COST, location: 'match' },
  { key: 'coldStorage', icon: ShieldPlus, cost: COLD_STORAGE_COST, location: 'equip' },
] as const;

export const MetaLabModal: React.FC<MetaLabModalProps> = ({
  meta,
  onClose,
  onBuyChips,
  buyChipsLoading,
  buyChipsError,
  buyChipsJustSucceeded,
  chipsPrice,
}) => {
  const { t } = useTranslation('ui');
  // Store-authoritative price only — see the same note in PaywallModal.
  const buyChipsLabel = chipsPrice
    ? t('cyberLab.buyChipsButtonPriced', { price: chipsPrice })
    : t('cyberLab.buyChipsButton');
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-900 border-2 border-cyan-500/60 rounded-2xl p-6 shadow-[0_0_60px_rgba(6,182,212,0.4)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_20px_#00f0ff]">
              <Cpu className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-widest uppercase">{t('cyberLab.title')}</h2>
              <p className="text-xs text-slate-400">{t('cyberLab.subtitleSpend')}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 border border-cyan-500/50 text-cyan-300 font-black text-sm shadow-md uppercase">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-spin" />
              <span>{t('cyberLab.neonChips', { n: meta.neonChips })}</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Real-money Chip Purchase — visually distinct (amber) from the cyan reference cards
            below, since this one actually charges money rather than just explaining a sink. */}
        <div className="mb-4 bg-gradient-to-r from-amber-950/60 via-amber-900/30 to-amber-950/60 border-2 border-amber-500/50 rounded-xl p-3.5 flex items-center gap-3 shadow-[0_0_25px_rgba(245,158,11,0.15)]">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border bg-amber-950 border-amber-500/60 text-amber-300">
            <Coins className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-black text-white tracking-wide uppercase">
              {t('cyberLab.buyChipsTitle', { amount: CHIPS_100K_AMOUNT.toLocaleString() })}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{t('cyberLab.buyChipsDescription')}</p>
            {buyChipsError && (
              <p className="text-[11px] text-rose-400 mt-1 font-bold">
                {buyChipsError === 'purchase_cancelled' ? t('cyberLab.buyChipsErrorCancelled') : t('cyberLab.buyChipsErrorGeneric')}
              </p>
            )}
            {buyChipsJustSucceeded && (
              <p className="text-[11px] text-emerald-400 mt-1 font-bold">{t('cyberLab.buyChipsSuccess')}</p>
            )}
          </div>
          <button
            onClick={onBuyChips}
            disabled={buyChipsLoading}
            className="shrink-0 px-3.5 py-2 rounded-lg bg-amber-500 text-black font-black text-xs uppercase tracking-wider hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-center gap-1.5 disabled:opacity-60"
          >
            {buyChipsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {buyChipsLabel}
          </button>
        </div>

        {/* Chip Sink Reference List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-4">
          {CHIP_SINKS.map(({ key, icon: IconComp, cost, location }) => (
            <div
              key={key}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border bg-cyan-950 border-cyan-500/50 text-cyan-300">
                <IconComp className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-black text-white tracking-wide uppercase">{t(`cyberLab.sinks.${key}.name`)}</h4>
                  <span className="shrink-0 flex items-center gap-1 font-mono text-[10px] font-bold text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    {cost.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-tight">{t(`cyberLab.sinks.${key}.description`)}</p>
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-cyan-400/80 font-mono uppercase tracking-wide">
                  <MapPin className="w-3 h-3" />
                  {t(`cyberLab.sinks.${key}.location`)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Stats Summary */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>{t('cyberLab.gamesPlayed', { n: meta.totalGamesPlayed })}</span>
          <span>{t('cyberLab.runWins', { n: meta.totalWins })}</span>
          <span>{t('cyberLab.highestStage', { n: meta.highestStage })}</span>
        </div>
      </div>
    </div>
  );
};
