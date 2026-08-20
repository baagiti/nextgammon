import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, OpponentCard } from '../types';
import { useCardText } from '../hooks/useLocalizedText';
import { Zap, Flame, ShieldAlert, ShieldCheck, RefreshCw, Sparkles, Coins, Sliders, FastForward, Target, Cpu, EyeOff, Binary, Radio, Skull } from 'lucide-react';

interface CardWidgetProps {
  card: Card | OpponentCard;
  isEquipped?: boolean;
  isHidden?: boolean;
  isOpponentCard?: boolean;
  onSelect?: () => void;
  onActivate?: () => void;
  canActivate?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  Flame,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Coins,
  Sliders,
  FastForward,
  Target,
  Cpu,
  EyeOff,
  Binary,
  Radio,
  Skull,
};

export const CardWidget: React.FC<CardWidgetProps> = ({
  card,
  isEquipped = false,
  isHidden = false,
  isOpponentCard = false,
  onSelect,
  onActivate,
  canActivate = false,
}) => {
  const { t } = useTranslation('ui');
  const { name: cardName, tagline: cardTagline, description: cardDescription } = useCardText(
    (card as Card) ?? { id: '', name: '', tagline: '', description: '' }
  );

  if (!card) return null;

  const IconComponent = ICON_MAP[card.iconName] || Zap;

  const rarityColors: Record<string, { border: string; bg: string; text: string; shadow: string }> = {
    common: { border: 'border-rarity-common/50', bg: 'bg-rarity-common/15', text: 'text-rarity-common', shadow: 'shadow-[0_0_15px_var(--rarity-common)]/30' },
    rare: { border: 'border-rarity-rare/70', bg: 'bg-rarity-rare/15', text: 'text-rarity-rare', shadow: 'shadow-[0_0_20px_var(--rarity-rare)]/40' },
    epic: { border: 'border-rarity-epic/80', bg: 'bg-rarity-epic/15', text: 'text-rarity-epic', shadow: 'shadow-[0_0_25px_var(--rarity-epic)]/50' },
    legendary: { border: 'border-rarity-legendary', bg: 'bg-rarity-legendary/15', text: 'text-rarity-legendary', shadow: 'shadow-[0_0_30px_var(--rarity-legendary)]/60' },
  };

  const style = rarityColors[card.rarity] || rarityColors.common;
  const metalVar = `var(--metal-${['common', 'rare', 'epic', 'legendary'].includes(card.rarity) ? card.rarity : 'common'})`;

  if (isHidden) {
    return (
      <div
        onClick={onSelect}
        className="relative w-36 h-52 rounded-xl bg-panel border-2 border-danger/60 p-3 flex flex-col items-center justify-center text-center shadow-[0_0_20px_var(--danger)]/40 cursor-pointer group hover:scale-105 transition-transform overflow-hidden"
      >
        {/* Holographic background grid */}
        <div className="absolute inset-0 bg-[radial-gradient(var(--danger)_1px,transparent_1px)] [background-size:12px_12px] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-danger/20 via-panel/90 to-panel-2" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-danger/15 border border-danger flex items-center justify-center mb-2 animate-pulse">
            <Skull className="w-6 h-6 text-danger" />
          </div>
          <p className="text-xs uppercase font-bold tracking-widest text-danger mb-1">{t('cardWidget.hiddenCard')}</p>
          <p className="text-[10px] text-danger/70 italic px-1">
            {t('cardWidget.hiddenCardHint')}
          </p>
        </div>

        {/* Holographic scanning bar */}
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-danger to-transparent top-0 animate-[ping_2s_infinite]" />
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`relative w-36 h-52 rounded-xl border-2 ${style.border} ${style.bg} ${style.shadow} p-2.5 flex flex-col justify-between overflow-hidden cursor-pointer group hover:scale-105 transition-all duration-200 select-none ${
        isEquipped ? 'ring-2 ring-success ring-offset-2 ring-offset-panel-2' : ''
      }`}
    >
      {/* Background synth patterns */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 blur-xl pointer-events-none" />

      {/* Rarity as material — a metal strip, not just a hue */}
      <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: metalVar }} />

      {/* Top Bar: Type & Rarity Badge */}
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
        <span className={`${style.text} px-1.5 py-0.5 rounded bg-black/40 border border-white/10`}>
          {card.rarity}
        </span>
        <span className="text-text-muted text-[9px]">{card.type}</span>
      </div>

      {/* Icon & Title */}
      <div className="flex flex-col items-center text-center my-auto py-1">
        <div className={`w-10 h-10 rounded-lg ${style.bg} border ${style.border} flex items-center justify-center mb-1.5 shadow-inner group-hover:rotate-6 transition-transform`}>
          <IconComponent className={`w-5 h-5 ${style.text}`} />
        </div>
        <h4 className="font-display text-xs font-black tracking-wide text-text line-clamp-1">{cardName}</h4>
        <p className="text-[9px] text-text-muted tracking-tight italic line-clamp-1">{cardTagline}</p>
      </div>

      {/* Description */}
      <p className="text-[9.5px] text-text-muted leading-tight text-center bg-black/50 p-1.5 rounded-md border border-white/5 line-clamp-3">
        {cardDescription}
      </p>

      {/* Footer / Active Trigger Button */}
      {card.trigger === 'ACTIVE_ABILITY' && onActivate ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (canActivate) onActivate();
          }}
          disabled={!canActivate}
          className={`mt-1.5 w-full py-1 text-[10px] font-black uppercase tracking-wider rounded border transition-all ${
            canActivate
              ? 'bg-success text-black border-success shadow-[0_0_10px_var(--success)]/50 hover:brightness-125'
              : 'bg-panel text-text-muted border-line cursor-not-allowed'
          }`}
        >
          {card.usesRemaining !== undefined && card.usesRemaining <= 0 ? t('cardWidget.depleted') : t('cardWidget.trigger')}
        </button>
      ) : (
        <div className="mt-1 flex items-center justify-between text-[8px] text-text-muted px-1 pt-1 border-t border-white/10">
          <span>{t('cardWidget.triggerLabel')}</span>
          <span className="text-player font-semibold">{card.trigger.replace('ON_', '')}</span>
        </div>
      )}

      {/* Equipped indicator */}
      {isEquipped && (
        <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_8px_var(--success)]" />
      )}
    </div>
  );
};
