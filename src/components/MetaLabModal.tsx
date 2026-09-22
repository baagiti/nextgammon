import React from 'react';
import { useTranslation } from 'react-i18next';
import { MetaData } from '../types';
import { BUYBACK_CARD_COST, SKIP_STAGE_COST, REROLL_DIE_COST } from './RunMapModal';
import { COLD_STORAGE_COST } from './CardSelectModal';
import { CHIPS_100K_AMOUNT } from '../iap/purchases';
import { Cpu, RotateCcw, FastForward, Coins, ShieldPlus, Sparkles, X, MapPin, Loader2 } from 'lucide-react';
import { useIsPhoneViewport } from '../hooks/useIsPhoneViewport';

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
  // Landscape phones: slimmer header/purchase row and the four chip sinks in a 2x2 grid instead of
  // a vertical list, so the whole lab fits without scrolling.
  const isPhone = useIsPhoneViewport();
  // Store-authoritative price only — see the same note in PaywallModal.
  const buyChipsLabel = chipsPrice
    ? t('cyberLab.buyChipsButtonPriced', { price: chipsPrice })
    : t('cyberLab.buyChipsButton');
  return (
    <div className={`fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center ${isPhone ? 'p-2' : 'p-4'}`}>
      <div
        className={`w-full bg-slate-900 border-2 border-cyan-500/60 rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.4)] flex flex-col overflow-hidden ${
          isPhone ? 'max-w-3xl p-2.5 max-h-full' : 'max-w-2xl p-6 max-h-[90vh]'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b border-slate-800 ${isPhone ? 'pb-1.5 mb-1.5' : 'pb-4 mb-4'}`}>
          <div className={`flex items-center min-w-0 ${isPhone ? 'gap-2' : 'gap-3'}`}>
            <div className={`rounded-xl bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_20px_#00f0ff] shrink-0 ${isPhone ? 'w-8 h-8' : 'w-12 h-12'}`}>
              <Cpu className={isPhone ? 'w-4 h-4 text-cyan-300' : 'w-6 h-6 text-cyan-300'} />
            </div>
            <div className="min-w-0">
              <h2 className={`font-black text-white tracking-widest uppercase ${isPhone ? 'text-base leading-tight' : 'text-2xl'}`}>{t('cyberLab.title')}</h2>
              <p className={`text-slate-400 ${isPhone ? 'text-[10px] truncate' : 'text-xs'}`}>{t('cyberLab.subtitleSpend')}</p>
            </div>
          </div>

          <div className={`flex items-center shrink-0 ${isPhone ? 'gap-2' : 'gap-4'}`}>
            <div className={`flex items-center gap-2 rounded-xl bg-slate-950 border border-cyan-500/50 text-cyan-300 font-black shadow-md uppercase ${isPhone ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm'}`}>
              <Sparkles className={`text-cyan-400 animate-spin ${isPhone ? 'w-4 h-4' : 'w-5 h-5'}`} />
              <span>{t('cyberLab.neonChips', { n: meta.neonChips })}</span>
            </div>

            <button
              onClick={onClose}
              className={`rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors ${isPhone ? 'p-1.5' : 'p-2'}`}
            >
              <X className={isPhone ? 'w-5 h-5' : 'w-6 h-6'} />
            </button>
          </div>
        </div>

        {/* Real-money Chip Purchase — visually distinct (amber) from the cyan reference cards
            below, since this one actually charges money rather than just explaining a sink. */}
        <div className={`bg-gradient-to-r from-amber-950/60 via-amber-900/30 to-amber-950/60 border-2 border-amber-500/50 rounded-xl flex items-center gap-3 shadow-[0_0_25px_rgba(245,158,11,0.15)] ${isPhone ? 'mb-1.5 p-2' : 'mb-4 p-3.5'}`}>
          <div className={`${isPhone ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg flex items-center justify-center shrink-0 border bg-amber-950 border-amber-500/60 text-amber-300`}>
            <Coins className={isPhone ? 'w-4 h-4' : 'w-5 h-5'} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-black text-white tracking-wide uppercase">
              {t('cyberLab.buyChipsTitle', { amount: CHIPS_100K_AMOUNT.toLocaleString() })}
            </h4>
            <p className={`text-slate-400 mt-0.5 leading-tight ${isPhone ? 'text-[10px] line-clamp-1' : 'text-[11px]'}`}>{t('cyberLab.buyChipsDescription')}</p>
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
        <div className={`flex-1 overflow-y-auto pr-1 ${isPhone ? 'grid grid-cols-2 gap-1.5 mb-1.5' : 'space-y-3 mb-4'}`}>
          {CHIP_SINKS.map(({ key, icon: IconComp, cost, location }) => (
            <div
              key={key}
              className={`bg-slate-950/80 border border-slate-800 rounded-xl flex items-start ${isPhone ? 'p-2 gap-2' : 'p-3.5 gap-3'}`}
            >
              <div className={`rounded-lg flex items-center justify-center shrink-0 border bg-cyan-950 border-cyan-500/50 text-cyan-300 ${isPhone ? 'w-7 h-7' : 'w-10 h-10'}`}>
                <IconComp className={isPhone ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-black text-white tracking-wide uppercase">{t(`cyberLab.sinks.${key}.name`)}</h4>
                  <span className="shrink-0 flex items-center gap-1 font-mono text-[10px] font-bold text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    {cost.toLocaleString()}
                  </span>
                </div>
                <p className={`text-slate-400 leading-tight ${isPhone ? 'text-[10px] mt-0.5' : 'text-[11px] mt-1'}`}>{t(`cyberLab.sinks.${key}.description`)}</p>
                <div className={`${isPhone ? 'mt-1' : 'mt-1.5'} flex items-center gap-1 text-[10px] text-cyan-400/80 font-mono uppercase tracking-wide`}>
                  <MapPin className="w-3 h-3" />
                  {t(`cyberLab.sinks.${key}.location`)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Stats Summary */}
        <div className={`border-t border-slate-800 flex items-center justify-between text-slate-400 font-mono ${isPhone ? 'pt-1.5 text-[10px]' : 'pt-3 text-xs'}`}>
          <span>{t('cyberLab.gamesPlayed', { n: meta.totalGamesPlayed })}</span>
          <span>{t('cyberLab.runWins', { n: meta.totalWins })}</span>
          <span>{t('cyberLab.highestStage', { n: meta.highestStage })}</span>
        </div>
      </div>
    </div>
  );
};
