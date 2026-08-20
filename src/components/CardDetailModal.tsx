import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../types';
import { CardIcon } from './CardIcon';
import { useCardText } from '../hooks/useLocalizedText';
import { X, Sparkles, Shield, Zap, AlertTriangle } from 'lucide-react';

interface CardDetailModalProps {
  card: Card | null;
  ownerLabel?: string; // e.g. "PLAYER CARD" or "CPU CARD"
  onClose: () => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, ownerLabel, onClose }) => {
  const { t } = useTranslation('ui');
  const { name: cardName, tagline: cardTagline, description: cardDescription } = useCardText(
    card ?? { id: '', name: '', tagline: '', description: '' }
  );

  if (!card) return null;

  const isAugment = card.category === 'self';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className={`bg-slate-900 border-2 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden ${
          isAugment
            ? 'border-cyan-500/60 shadow-[0_0_50px_rgba(6,182,212,0.3)]'
            : 'border-rose-500/60 shadow-[0_0_50px_rgba(244,63,94,0.3)]'
        }`}
      >
        {/* Top Glow Accent */}
        <div
          className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isAugment ? 'bg-cyan-500/20' : 'bg-rose-500/20'
          }`}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Owner Badge */}
        {ownerLabel && (
          <div className="mb-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border ${
                isAugment
                  ? 'bg-cyan-950 text-cyan-400 border-cyan-800'
                  : 'bg-rose-950 text-rose-400 border-rose-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {ownerLabel}
            </span>
          </div>
        )}

        {/* Card Main Info */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border-2 ${
              isAugment
                ? 'bg-cyan-950/80 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                : 'bg-rose-950/80 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
            }`}
          >
            <CardIcon
              name={card.iconName}
              className={`w-8 h-8 ${isAugment ? 'text-cyan-400' : 'text-rose-400'}`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold px-2 py-0.5 rounded bg-slate-800">
                {cardTagline || t('cardDetail.mutationCardFallback')}
              </span>
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isAugment ? 'text-cyan-400' : 'text-rose-400'
                }`}
              >
                {isAugment ? t('cardDetail.augment') : t('cardDetail.sabotage')}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">{cardName}</h2>
          </div>
        </div>

        {/* Description Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 mb-6">
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2 font-bold">
            {t('cardDetail.effectAndMechanics')}
          </p>
          <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed">
            {cardDescription}
          </p>
        </div>

        {/* Close Action */}
        <button
          onClick={onClose}
          className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg ${
            isAugment
              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
              : 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
          }`}
        >
          {t('cardDetail.closeDetails')}
        </button>
      </div>
    </div>
  );
};
