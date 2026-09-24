import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, BossProtocol } from '../types';
import { CardIcon } from './CardIcon';
import { getCardText, useCardText, useProtocolText } from '../hooks/useLocalizedText';
import { Sparkles, Play, CheckCircle2, Bot, Lock, Skull, Swords, Home, ShieldPlus, Coins } from 'lucide-react';
import { useIsPhoneViewport } from '../hooks/useIsPhoneViewport';

export const COLD_STORAGE_COST = 5000;

interface CardSelectModalProps {
  mode: 'draft' | 'equip';
  // 'draft' mode (quick match): pick 1 of a random 3-card pool, CPU picks from the same pool.
  draftPool: Card[];
  cpuChoice: Card | null;
  // 'equip' mode (campaign): pick 1 card from your full collection.
  bossCard: Card | null; // the boss's own card (card bosses only)
  protocol: BossProtocol | null; // set for protocol bosses instead of a bossCard
  lastEquippedCardId: string | null;
  capturedCardIds: string[];
  bossName: string;
  onConfirmSelection: (selectedCard: Card) => void;
  // This modal is portaled straight to document.body (see App.tsx), so it sits above
  // PlatformFrame's own persistent header — including its "return to menu" button. Give it
  // one of its own so backing out mid-draft/equip doesn't strand the player here.
  onGoBack?: () => void;
  // Cold Storage: pay to protect the equipped card from mars-capture this stage only (equip
  // mode / run matches only). Charged and activated only once the player actually confirms.
  neonChips?: number;
  onActivateColdStorage?: () => void;
}

const RARITY_STYLE: Record<string, { border: string; bg: string; text: string; shadow: string }> = {
  common: { border: 'border-rarity-common/50', bg: 'bg-rarity-common/10', text: 'text-rarity-common', shadow: 'shadow-[0_0_15px_var(--rarity-common)]/30' },
  rare: { border: 'border-rarity-rare/60', bg: 'bg-rarity-rare/10', text: 'text-rarity-rare', shadow: 'shadow-[0_0_20px_var(--rarity-rare)]/40' },
  epic: { border: 'border-rarity-epic/70', bg: 'bg-rarity-epic/10', text: 'text-rarity-epic', shadow: 'shadow-[0_0_25px_var(--rarity-epic)]/50' },
  legendary: { border: 'border-rarity-legendary/80', bg: 'bg-rarity-legendary/10', text: 'text-rarity-legendary', shadow: 'shadow-[0_0_30px_var(--rarity-legendary)]/60' },
};

export const CardSelectModal: React.FC<CardSelectModalProps> = ({
  mode,
  draftPool,
  cpuChoice,
  bossCard,
  protocol,
  lastEquippedCardId,
  capturedCardIds,
  bossName,
  onConfirmSelection,
  onGoBack,
  neonChips = 0,
  onActivateColdStorage,
}) => {
  const { t } = useTranslation('ui');
  const { t: tCards } = useTranslation('cards');
  // Landscape phones: the three draft cards sit side by side (not stacked), every card drops its
  // decorative chrome, and the header/confirm button shrink so the whole screen fits without
  // scrolling. Equip mode can hold an open-ended collection, so only its grid scrolls — the
  // header and the confirm button stay pinned on screen.
  const isPhone = useIsPhoneViewport();
  const { name: protocolName, description: protocolDescription } = useProtocolText(
    protocol ?? { id: '', name: '', description: '', taunt: '' }
  );
  const { name: bossCardName } = useCardText(bossCard ?? { id: '', name: '', tagline: '', description: '' });
  const [coldStorageChecked, setColdStorageChecked] = useState(false);
  const canAffordColdStorage = neonChips >= COLD_STORAGE_COST;
  // In equip mode, a card is unselectable if it was captured by the boss OR it's the card you
  // equipped last stage. If that leaves nothing pickable (e.g. your only card was just captured),
  // relax the "not last stage" rule first, then relax "not captured" — never leave the player stuck.
  const selectablePool = useMemo(() => {
    if (mode === 'draft') return draftPool;
    const notCapturedNotRepeated = draftPool.filter((c) => !capturedCardIds.includes(c.id) && c.id !== lastEquippedCardId);
    if (notCapturedNotRepeated.length > 0) return notCapturedNotRepeated;
    const notCaptured = draftPool.filter((c) => !capturedCardIds.includes(c.id));
    if (notCaptured.length > 0) return notCaptured;
    return draftPool;
  }, [mode, draftPool, capturedCardIds, lastEquippedCardId]);

  const [selectedCardId, setSelectedCardId] = useState<string>(selectablePool[0]?.id || '');

  const selectedCard = draftPool.find((c) => c.id === selectedCardId) || selectablePool[0];

  const handleStart = () => {
    if (selectedCard) {
      if (mode === 'equip' && coldStorageChecked && canAffordColdStorage) {
        onActivateColdStorage?.();
      }
      onConfirmSelection(selectedCard);
    }
  };

  const isLocked = (card: Card) =>
    mode === 'equip' && (capturedCardIds.includes(card.id) || card.id === lastEquippedCardId) && !selectablePool.some((c) => c.id === card.id);

  return (
    <div
      className={`fixed inset-0 z-50 grain bg-ink/95 backdrop-blur-xl flex flex-col text-text ${
        isPhone ? 'h-[100dvh] p-2 gap-1.5 overflow-hidden' : 'justify-between p-4 sm:p-8 overflow-y-auto min-h-screen'
      }`}
    >
      {/* Return to Main Menu — this modal is portaled above PlatformFrame's own header,
          so it needs its own way out rather than stranding the player mid-selection. */}
      {onGoBack && (
        <button
          onClick={onGoBack}
          className={`fixed z-20 rounded-lg bg-panel border border-line hover:border-player text-text-muted hover:text-player transition-colors ${
            isPhone ? 'top-2 left-2 p-1.5' : 'top-4 left-4 sm:top-6 sm:left-6 p-2'
          }`}
          title={t('common.returnToMenu')}
        >
          <Home className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}

      {/* Top Bar Header */}
      <div className={`relative z-10 max-w-6xl w-full mx-auto text-center ${isPhone ? 'shrink-0 px-10' : 'pt-2'}`}>
        {!isPhone && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-panel border border-player/50 text-player font-mono text-xs uppercase tracking-widest mb-3 shadow-[0_0_15px_var(--player)]/30">
            <Sparkles className="w-4 h-4 text-player animate-pulse" />
            {mode === 'equip' ? t('cardSelect.campaignLoadout') : t('cardSelect.draftBadge')}
          </div>
        )}
        <h1 className={`font-display font-black text-text uppercase tracking-wider ${isPhone ? 'text-base leading-tight' : 'text-3xl sm:text-5xl'}`}>
          {mode === 'equip' ? t('cardSelect.equipTitle') : t('cardSelect.draftTitle')}
        </h1>

        {mode === 'equip' ? (
          protocol ? (
            <div className={`mx-auto max-w-xl bg-danger/10 border border-danger/50 rounded-2xl flex items-center gap-3 text-left ${isPhone ? 'mt-1 p-1.5' : 'mt-3 p-3'}`}>
              <div className={`${isPhone ? 'w-7 h-7' : 'w-10 h-10'} rounded-xl bg-danger/10 border border-danger/60 flex items-center justify-center shrink-0`}>
                <CardIcon name={protocol.iconName} className="w-5 h-5 text-danger" />
              </div>
              <div className="min-w-0">
                <div className="text-danger font-black text-xs uppercase tracking-wider">{protocolName}</div>
                <div className={`text-text-muted leading-snug ${isPhone ? 'text-[10px] line-clamp-4' : 'text-[11px]'}`}>{protocolDescription}</div>
              </div>
            </div>
          ) : bossCard ? (
            <p className={`text-text-muted max-w-2xl mx-auto font-medium ${isPhone ? 'text-[10px] leading-snug line-clamp-1' : 'text-sm sm:text-base mt-2'}`}>
              {t('cardSelect.equipIntro', { bossName, cardName: bossCardName })}
            </p>
          ) : null
        ) : (
          <p className={`text-text-muted max-w-2xl mx-auto font-medium ${isPhone ? 'text-[10px] leading-snug line-clamp-1' : 'text-sm sm:text-base mt-2'}`}>
            {t('cardSelect.draftIntro', { bossName })}
          </p>
        )}
      </div>

      {/* Card Grid — 3-up for draft mode, a wrapping collection grid for equip mode */}
      <div
        className={`relative z-10 max-w-6xl w-full mx-auto grid ${
          isPhone
            ? `flex-1 min-h-0 gap-2 ${mode === 'equip' ? 'grid-cols-4 auto-rows-min overflow-y-auto p-1' : 'grid-cols-3'}`
            : `my-auto gap-4 sm:gap-6 py-6 ${mode === 'equip' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3 gap-6'}`
        }`}
      >
        {draftPool.map((card, idx) => {
          const isSelectedByPlayer = card.id === selectedCardId;
          const isSelectedByCpu = mode === 'draft' && card.id === cpuChoice?.id;
          const isAugment = card.category === 'self';
          const locked = isLocked(card);
          const captured = mode === 'equip' && capturedCardIds.includes(card.id);
          const usedLastStage = mode === 'equip' && card.id === lastEquippedCardId && !captured;
          const rarityStyle = RARITY_STYLE[card.rarity] || RARITY_STYLE.common;
          const metalVar = `var(--metal-${['common', 'rare', 'epic', 'legendary'].includes(card.rarity) ? card.rarity : 'common'})`;
          const { name: itemName, tagline: itemTagline, description: itemDescription } = getCardText(tCards, card);

          return (
            <div
              key={card.id || idx}
              onClick={() => !locked && setSelectedCardId(card.id)}
              className={`relative border-2 transition-all transform flex flex-col overflow-hidden group ${
                isPhone ? 'rounded-xl p-2 justify-start min-h-0' : 'rounded-2xl p-4 sm:p-6 justify-between'
              } ${
                locked
                  ? 'bg-panel-2/60 border-line opacity-50 cursor-not-allowed grayscale'
                  : isSelectedByPlayer
                  ? `cursor-pointer bg-panel border-player shadow-[0_0_35px_var(--player)]/40 ${isPhone ? '' : 'scale-[1.03] -translate-y-1'}`
                  : `cursor-pointer bg-panel/70 ${rarityStyle.border} hover:brightness-125 hover:scale-[1.01]`
              }`}
            >
              {/* Rarity as material — a metal strip, not just a hue */}
              {!locked && <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: metalVar }} />}

              {/* Background Glow when Selected */}
              {isSelectedByPlayer && !locked && (
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-player/20 rounded-full blur-3xl pointer-events-none" />
              )}

              {/* Locked banners */}
              {captured && (
                <div className={`rounded-xl bg-danger/10 border border-danger/50 flex items-center gap-1.5 font-mono text-danger font-bold uppercase tracking-wider ${isPhone ? 'mb-1 px-1.5 py-0.5 text-[9px]' : 'mb-3 px-3 py-1.5 text-xs'}`}>
                  <Skull className="w-4 h-4 text-danger shrink-0" />
                  {t('cardSelect.capturedByBoss')}
                </div>
              )}
              {usedLastStage && (
                <div className={`rounded-xl bg-panel-2 border border-line-strong flex items-center gap-1.5 font-mono text-text-muted font-bold uppercase tracking-wider ${isPhone ? 'mb-1 px-1.5 py-0.5 text-[9px]' : 'mb-3 px-3 py-1.5 text-xs'}`}>
                  <Lock className="w-4 h-4 text-text-muted shrink-0" />
                  {t('cardSelect.usedLastStage')}
                </div>
              )}

              {/* CPU Selection Badge Banner (draft mode only) */}
              {isSelectedByCpu && (
                <div className={`rounded-xl bg-opponent/10 border border-opponent/50 flex items-center justify-between font-mono text-opponent shadow-[0_0_15px_var(--opponent)]/30 ${
                  isPhone ? 'mb-1 px-1.5 py-0.5 text-[9px]' : 'mb-3 px-3 py-1.5 text-xs'
                }`}>
                  <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    <Bot className={`text-opponent shrink-0 ${isPhone ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    {t('cardSelect.cpuChoseThisCard')}
                  </span>
                  {!isPhone && <span className="text-[10px] text-opponent/70 font-sans italic">({bossName})</span>}
                </div>
              )}

              {/* Selection Badge */}
              <div className={`relative flex items-center justify-between ${isPhone ? 'mb-1' : 'mb-4'}`}>
                <span
                  className={`font-mono font-extrabold rounded-full uppercase tracking-wider border ${isPhone ? 'text-[9px] px-2 py-0.5' : 'text-xs px-3 py-1'} ${
                    isAugment
                      ? 'bg-player/10 text-player border-player/50'
                      : 'bg-opponent/10 text-opponent border-opponent/50'
                  }`}
                >
                  {isAugment ? t('cardSelect.augment') : t('cardSelect.sabotage')}
                </span>

                <div
                  className={`${isPhone ? 'w-4 h-4' : 'w-6 h-6'} rounded-full flex items-center justify-center border transition-all ${
                    isSelectedByPlayer
                      ? 'bg-player border-player text-ink shadow-[0_0_10px_var(--player)]/80'
                      : 'border-line-strong bg-panel-2'
                  }`}
                >
                  {isSelectedByPlayer && <CheckCircle2 className={`${isPhone ? 'w-3 h-3' : 'w-4 h-4'} stroke-[3]`} />}
                </div>
              </div>

              {/* Card Icon & Title */}
              <div className={`relative ${isPhone ? 'flex-1 min-h-0 flex flex-col' : 'my-2'}`}>
                <div className={isPhone ? 'flex items-center gap-2 mb-1' : 'contents'}>
                <div
                  className={`${isPhone ? 'w-8 h-8 rounded-lg shrink-0' : 'w-16 h-16 rounded-2xl mb-4'} flex items-center justify-center border ${
                    isSelectedByPlayer
                      ? 'bg-player/10 border-player/80 shadow-[0_0_20px_var(--player)]/30'
                      : `${rarityStyle.bg} ${rarityStyle.border}`
                  }`}
                >
                  <CardIcon
                    name={card.iconName}
                    className={`${isPhone ? 'w-4 h-4' : 'w-8 h-8'} ${isSelectedByPlayer ? 'text-player' : rarityStyle.text}`}
                  />
                </div>

                <div className={isPhone ? 'min-w-0' : 'contents'}>
                  <div className={`font-mono uppercase tracking-widest text-text-muted font-bold ${isPhone ? 'text-[8px] leading-tight line-clamp-2' : 'text-xs mb-1'}`}>
                    {itemTagline || t('cardSelect.mutationCardFallback')}
                  </div>
                  <h3 className={`font-display font-black text-text uppercase tracking-wider ${isPhone ? 'text-xs leading-tight truncate' : 'text-2xl mb-3'}`}>
                    {itemName}
                  </h3>
                </div>
                </div>

                <p
                  className={`text-text font-medium bg-ink/50 rounded-xl border border-line ${
                    isPhone
                      ? `text-[10px] leading-snug p-1.5 ${mode === 'equip' ? 'line-clamp-4' : 'flex-1 min-h-0 overflow-y-auto'}`
                      : 'text-sm leading-relaxed p-4'
                  }`}
                >
                  {itemDescription}
                </p>
              </div>

              {/* Select Footer Indicator */}
              <div className={`relative border-t border-line flex items-center justify-between font-mono ${isPhone ? 'hidden' : 'mt-6 pt-4 text-xs'}`}>
                <span className={locked ? 'text-text-muted/60' : isSelectedByPlayer ? 'text-player font-bold' : 'text-text-muted'}>
                  {locked ? t('cardSelect.unavailable') : isSelectedByPlayer ? t('cardSelect.yourSelection') : t('cardSelect.clickToSelect')}
                </span>
                <span className={`uppercase font-bold ${rarityStyle.text}`}>{card.rarity}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Start Action Button */}
      <div
        className={`relative z-10 w-full mx-auto text-center ${
          isPhone ? `shrink-0 flex items-stretch gap-2 ${mode === 'equip' ? 'max-w-3xl' : 'max-w-md'}` : 'max-w-xl pb-4 pt-2'
        }`}
      >
        {mode === 'equip' && (
          <label
            className={`flex items-center rounded-xl border text-left transition-all ${isPhone ? 'flex-1 min-w-0 gap-2 p-1.5' : 'mb-3 gap-3 p-3'} ${
              canAffordColdStorage
                ? 'border-line-strong bg-panel-2 cursor-pointer hover:border-player/60'
                : 'border-line bg-panel-2/60 opacity-60 cursor-not-allowed'
            }`}
          >
            <input
              type="checkbox"
              checked={coldStorageChecked}
              disabled={!canAffordColdStorage}
              onChange={(e) => setColdStorageChecked(e.target.checked)}
              className="w-4 h-4 accent-player shrink-0"
            />
            <ShieldPlus className={`text-player shrink-0 ${isPhone ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-text uppercase tracking-wide">{t('cardSelect.coldStorage')}</div>
              <div className={`text-text-muted leading-snug ${isPhone ? 'text-[9px] line-clamp-2' : 'text-[11px]'}`}>
                {t('cardSelect.coldStorageHint')}
              </div>
            </div>
            <span className="shrink-0 flex items-center gap-1 font-mono text-[10px] font-bold text-player">
              <Coins className="w-3.5 h-3.5" />
              {COLD_STORAGE_COST.toLocaleString()}
            </span>
          </label>
        )}
        <button
          onClick={handleStart}
          disabled={!selectedCard}
          className={`rounded-2xl bg-player text-ink font-display font-black uppercase tracking-wider shadow-[0_0_30px_var(--player)]/60 hover:scale-105 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 ${
            isPhone ? `py-2 px-4 text-xs gap-2 ${mode === 'equip' ? 'shrink-0' : 'w-full'}` : 'w-full py-4 px-8 text-lg gap-3'
          }`}
        >
          {mode === 'equip' ? <Swords className={isPhone ? 'w-4 h-4' : 'w-6 h-6'} /> : <Play className={`fill-current ${isPhone ? 'w-4 h-4' : 'w-6 h-6'}`} />}
          {mode === 'equip' ? t('cardSelect.equipAndEngage') : t('cardSelect.startMatch')}
        </button>
      </div>
    </div>
  );
};
