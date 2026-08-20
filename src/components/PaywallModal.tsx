import React from 'react';
import { useTranslation } from 'react-i18next';
import { Swords, Lock, RotateCcw, X, Loader2, Layers, Sparkles, Skull, Ban } from 'lucide-react';

interface PaywallModalProps {
  isLoading: boolean;
  error: string | null;
  onBuy: () => void;
  onRestore: () => void;
  onClose: () => void;
}

// One row per pitch point. Badge classes are written out in full (not built from a template
// string) because Tailwind's build-time scanner only picks up literal class names.
const FEATURES = [
  { key: 'campaign', icon: Layers, badgeClass: 'bg-player/15 border-player/50 text-player' },
  { key: 'cards', icon: Sparkles, badgeClass: 'bg-opponent/15 border-opponent/50 text-opponent' },
  { key: 'protocols', icon: Skull, badgeClass: 'bg-point-b/15 border-point-b/50 text-point-b' },
  { key: 'adFree', icon: Ban, badgeClass: 'bg-success/15 border-success/50 text-success' },
] as const;

export const PaywallModal: React.FC<PaywallModalProps> = ({ isLoading, error, onBuy, onRestore, onClose }) => {
  const { t } = useTranslation('ui');

  return (
    <div className="fixed inset-0 z-50 bg-ink/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="relative max-w-lg w-full bg-panel border-2 border-player/60 rounded-2xl shadow-[0_0_60px_var(--player)]/40 flex flex-col max-h-[92vh]">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-panel-2 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-6 sm:p-8 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-player/15 border-2 border-player flex items-center justify-center mb-3 shadow-[0_0_25px_var(--player)]/50">
            <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-player" />
          </div>

          <h2 className="font-display text-xl sm:text-2xl font-black text-text uppercase tracking-wider mb-1">
            {t('paywall.title')}
          </h2>
          <p className="text-xs sm:text-sm text-player font-bold uppercase tracking-wide mb-5">
            {t('paywall.tagline')}
          </p>

          <div className="space-y-2.5 text-left mb-5">
            {FEATURES.map(({ key, icon: Icon, badgeClass }) => (
              <div
                key={key}
                className="flex items-start gap-3 bg-panel-2/60 border border-line rounded-xl p-3"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${badgeClass}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-text uppercase tracking-wide">
                    {t(`paywall.features.${key}.title`)}
                  </h4>
                  <p className="text-[11px] text-text-muted mt-0.5 leading-snug">
                    {t(`paywall.features.${key}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-text-muted leading-relaxed mb-5">{t('paywall.description')}</p>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-danger/15 border border-danger/50 text-danger text-xs font-medium">
              {error === 'purchase_cancelled' ? t('paywall.errorCancelled') : t('paywall.errorGeneric')}
            </div>
          )}

          <button
            onClick={onBuy}
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-player to-success text-ink font-black text-sm uppercase tracking-wider shadow-[0_0_25px_var(--player)]/60 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:scale-100 mb-3"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Swords className="w-5 h-5" />}
            {t('paywall.buyButton')}
          </button>

          <button
            onClick={onRestore}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-transparent border border-line hover:border-player/50 text-text-muted hover:text-text font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t('paywall.restoreButton')}
          </button>
        </div>
      </div>
    </div>
  );
};
