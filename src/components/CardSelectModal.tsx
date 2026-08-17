import React, { useState, useMemo } from 'react';
import { Card, BossProtocol } from '../types';
import { CardIcon } from './CardIcon';
import { Sparkles, Play, CheckCircle2, Bot, Lock, Skull, Swords, Home, ShieldPlus, Coins } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 grain bg-ink/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-8 overflow-y-auto min-h-screen text-text">
      {/* Return to Main Menu — this modal is portaled above PlatformFrame's own header,
          so it needs its own way out rather than stranding the player mid-selection. */}
      {onGoBack && (
        <button
          onClick={onGoBack}
          className="fixed top-4 left-4 sm:top-6 sm:left-6 z-20 p-2 rounded-lg bg-panel border border-line hover:border-player text-text-muted hover:text-player transition-colors"
          title="Return to Main Menu"
        >
          <Home className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}

      {/* Top Bar Header */}
      <div className="relative z-10 max-w-6xl w-full mx-auto text-center pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-panel border border-player/50 text-player font-mono text-xs uppercase tracking-widest mb-3 shadow-[0_0_15px_var(--player)]/30">
          <Sparkles className="w-4 h-4 text-player animate-pulse" />
          {mode === 'equip' ? 'CAMPAIGN LOADOUT' : '1v1 MATCH MUTATION DRAFT'}
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-black text-text uppercase tracking-wider">
          {mode === 'equip' ? 'EQUIP 1 CARD' : 'CHOOSE 1 CARD FROM 3'}
        </h1>

        {mode === 'equip' ? (
          protocol ? (
            <div className="mt-3 mx-auto max-w-xl bg-danger/10 border border-danger/50 rounded-2xl p-3 flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-danger/10 border border-danger/60 flex items-center justify-center shrink-0">
                <CardIcon name={protocol.iconName} className="w-5 h-5 text-danger" />
              </div>
              <div className="min-w-0">
                <div className="text-danger font-black text-xs uppercase tracking-wider">{protocol.name}</div>
                <div className="text-text-muted text-[11px] leading-snug">{protocol.description}</div>
              </div>
            </div>
          ) : bossCard ? (
            <p className="text-text-muted text-sm sm:text-base mt-2 max-w-2xl mx-auto font-medium">
              <span className="text-opponent font-extrabold">{bossName}</span> is playing{' '}
              <span className="text-opponent font-extrabold">{bossCard.name}</span>. Choose your own card from your
              collection to fight back.
            </p>
          ) : null
        ) : (
          <p className="text-text-muted text-sm sm:text-base mt-2 max-w-2xl mx-auto font-medium">
            From this random <span className="text-player font-extrabold">3-card draft pool</span>, both you and
            opponent <span className="text-opponent font-extrabold">{bossName}</span> pick one card. Selected
            mutations remain active for the entire match!
          </p>
        )}
      </div>

      {/* Card Grid — 3-up for draft mode, a wrapping collection grid for equip mode */}
      <div
        className={`relative z-10 max-w-6xl w-full mx-auto my-auto grid gap-4 sm:gap-6 py-6 ${
          mode === 'equip' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3 gap-6'
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

          return (
            <div
              key={card.id || idx}
              onClick={() => !locked && setSelectedCardId(card.id)}
              className={`relative rounded-2xl p-4 sm:p-6 border-2 transition-all transform flex flex-col justify-between overflow-hidden group ${
                locked
                  ? 'bg-panel-2/60 border-line opacity-50 cursor-not-allowed grayscale'
                  : isSelectedByPlayer
                  ? `cursor-pointer bg-panel border-player shadow-[0_0_35px_var(--player)]/40 scale-[1.03] -translate-y-1`
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
                <div className="mb-3 px-3 py-1.5 rounded-xl bg-danger/10 border border-danger/50 flex items-center gap-1.5 text-xs font-mono text-danger font-bold uppercase tracking-wider">
                  <Skull className="w-4 h-4 text-danger" />
                  CAPTURED BY BOSS
                </div>
              )}
              {usedLastStage && (
                <div className="mb-3 px-3 py-1.5 rounded-xl bg-panel-2 border border-line-strong flex items-center gap-1.5 text-xs font-mono text-text-muted font-bold uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-text-muted" />
                  USED LAST STAGE
                </div>
              )}

              {/* CPU Selection Badge Banner (draft mode only) */}
              {isSelectedByCpu && (
                <div className="mb-3 px-3 py-1.5 rounded-xl bg-opponent/10 border border-opponent/50 flex items-center justify-between text-xs font-mono text-opponent shadow-[0_0_15px_var(--opponent)]/30">
                  <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    <Bot className="w-4 h-4 text-opponent" />
                    CPU CHOSE THIS CARD
                  </span>
                  <span className="text-[10px] text-opponent/70 font-sans italic">({bossName})</span>
                </div>
              )}

              {/* Selection Badge */}
              <div className="relative flex items-center justify-between mb-4">
                <span
                  className={`text-xs font-mono font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border ${
                    isAugment
                      ? 'bg-player/10 text-player border-player/50'
                      : 'bg-opponent/10 text-opponent border-opponent/50'
                  }`}
                >
                  {isAugment ? 'AUGMENT (+ SELF)' : 'SABOTAGE (- OPPONENT)'}
                </span>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                    isSelectedByPlayer
                      ? 'bg-player border-player text-ink shadow-[0_0_10px_var(--player)]/80'
                      : 'border-line-strong bg-panel-2'
                  }`}
                >
                  {isSelectedByPlayer && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>

              {/* Card Icon & Title */}
              <div className="relative my-2">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border ${
                    isSelectedByPlayer
                      ? 'bg-player/10 border-player/80 shadow-[0_0_20px_var(--player)]/30'
                      : `${rarityStyle.bg} ${rarityStyle.border}`
                  }`}
                >
                  <CardIcon
                    name={card.iconName}
                    className={`w-8 h-8 ${isSelectedByPlayer ? 'text-player' : rarityStyle.text}`}
                  />
                </div>

                <div className="text-xs font-mono uppercase tracking-widest text-text-muted font-bold mb-1">
                  {card.tagline || 'MUTATION CARD'}
                </div>
                <h3 className="font-display text-2xl font-black text-text uppercase tracking-wider mb-3">
                  {card.name}
                </h3>

                <p className="text-sm text-text leading-relaxed font-medium bg-ink/50 p-4 rounded-xl border border-line">
                  {card.description}
                </p>
              </div>

              {/* Select Footer Indicator */}
              <div className="relative mt-6 pt-4 border-t border-line flex items-center justify-between text-xs font-mono">
                <span className={locked ? 'text-text-muted/60' : isSelectedByPlayer ? 'text-player font-bold' : 'text-text-muted'}>
                  {locked ? 'UNAVAILABLE' : isSelectedByPlayer ? '✓ YOUR SELECTION' : 'CLICK TO SELECT'}
                </span>
                <span className={`uppercase font-bold ${rarityStyle.text}`}>{card.rarity}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Start Action Button */}
      <div className="relative z-10 max-w-xl w-full mx-auto text-center pb-4 pt-2">
        {mode === 'equip' && (
          <label
            className={`mb-3 flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
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
            <ShieldPlus className="w-5 h-5 text-player shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-text uppercase tracking-wide">Cold Storage</div>
              <div className="text-[11px] text-text-muted leading-snug">
                Protect this card from mars-capture this stage only.
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
          className="w-full py-4 px-8 rounded-2xl bg-player text-ink font-display font-black text-lg uppercase tracking-wider shadow-[0_0_30px_var(--player)]/60 hover:scale-105 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {mode === 'equip' ? <Swords className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
          {mode === 'equip' ? 'EQUIP & ENGAGE' : 'START MATCH WITH CHOSEN CARD'}
        </button>
      </div>
    </div>
  );
};
