import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useAnimationControls } from 'motion/react';
import { BoardState, PlayerId, Card, OpponentCard, GameSettings, BossProtocol } from '../types';
import { ValidMoveResult, isHomeBoardReady } from '../game/backgammonEngine';
import { soundFx } from '../game/soundEngine';
import { Dices, RotateCcw, RotateCw, AlertCircle, Sparkles, Shield, ChevronRight, ArrowUpRight, CheckCircle2, Snowflake, Anchor, Navigation, Eye, EyeOff, Zap, Trophy, ServerCrash, Coins } from 'lucide-react';
import { ViewStage } from './CyberSkyline';
import { CardIcon } from './CardIcon';
import { useTranslation } from 'react-i18next';
import { useCardText, useProtocolText } from '../hooks/useLocalizedText';

interface NeonBoardProps {
  board: BoardState;
  turn: PlayerId;
  dice: number[];
  validMoves: ValidMoveResult[];
  onSelectMove: (move: ValidMoveResult) => void;
  onRollDice: () => void;
  canRoll: boolean;
  canUndo?: boolean;
  onUndoMove?: () => void;
  onUndoTurn?: () => void;
  diceSkin?: string;
  boardDirection?: 'counter_clockwise' | 'clockwise';
  onUpdateSettings?: (newSettings: Partial<GameSettings>) => void;
  cardNotes: string[];
  isMatchOver: boolean;
  winner: PlayerId | null;
  onNextMatch?: () => void;
  onPassTurn?: () => void;
  canDiscardDie?: boolean;
  onDiscardDie?: () => void;
  playerActiveCard?: Card;
  cpuActiveCard?: Card;
  bossProtocol?: BossProtocol | null;
  onCardClick?: (card: Card, ownerLabel: string) => void;
  playerBlackIcePoint?: number | null;
  cpuBlackIcePoint?: number | null;
  playerDeadweightPoint?: number | null;
  cpuDeadweightPoint?: number | null;
  playerCourierPoint?: number | null;
  cpuCourierPoint?: number | null;
  pendingCardSelectionType?: 'black_ice' | 'deadweight' | 'courier' | null;
  onOpenMarkedModal?: () => void;
  onSelectMarkedPointDirectly?: (pointIndex: number) => void;
  canColdRebootReroll?: boolean;
  onColdRebootReroll?: () => void;
  shakeToken?: number;
  mutationFlashToken?: number;
  mutationFlashText?: string;
  mutationFlashVariant?: 'card' | 'protocol';
  viewStage?: ViewStage;
  onCycleViewStage?: () => void;
  isRunMatch?: boolean;
  matchHitCount?: number;
  canPaidReroll?: boolean;
  rerollDieCost?: number;
  onPaidDieReroll?: () => void;
}

export const NeonBoard: React.FC<NeonBoardProps> = ({
  board,
  turn,
  dice,
  validMoves,
  onSelectMove,
  onRollDice,
  canRoll,
  canUndo,
  onUndoMove,
  onUndoTurn,
  diceSkin = 'neon_cyan',
  boardDirection = 'counter_clockwise',
  onUpdateSettings,
  cardNotes,
  isMatchOver,
  winner,
  onNextMatch,
  onPassTurn,
  canDiscardDie,
  onDiscardDie,
  playerActiveCard,
  cpuActiveCard,
  bossProtocol,
  onCardClick,
  playerBlackIcePoint,
  cpuBlackIcePoint,
  playerDeadweightPoint,
  cpuDeadweightPoint,
  playerCourierPoint,
  cpuCourierPoint,
  pendingCardSelectionType,
  onOpenMarkedModal,
  onSelectMarkedPointDirectly,
  canColdRebootReroll,
  onColdRebootReroll,
  shakeToken,
  mutationFlashToken,
  mutationFlashText,
  mutationFlashVariant = 'card',
  viewStage = 'table',
  onCycleViewStage,
  isRunMatch = false,
  matchHitCount = 0,
  canPaidReroll = false,
  rerollDieCost = 8000,
  onPaidDieReroll,
}) => {
  const { t } = useTranslation('ui');
  const { name: playerActiveCardName, description: playerActiveCardDescription } = useCardText(
    playerActiveCard ?? { id: '', name: '', tagline: '', description: '' }
  );
  const { name: cpuActiveCardName, description: cpuActiveCardDescription } = useCardText(
    cpuActiveCard ?? { id: '', name: '', tagline: '', description: '' }
  );
  const { name: bossProtocolName, description: bossProtocolDescription } = useProtocolText(
    bossProtocol ?? { id: '', name: '', description: '', taunt: '' }
  );
  const [selectedPoint, setSelectedPoint] = useState<number | 'bar' | null>(null);
  const isLookingAround = viewStage !== 'table';
  const isPanorama = viewStage === 'panorama';
  const isPeek = viewStage === 'peek';


  const isClockwise = boardDirection === 'clockwise';
  const isPlayerHomeReady = isHomeBoardReady(board, 'player');

  // Neon Chips earned this match, for the post-match breakdown — hits pay out on win or loss,
  // the match-result bonus only pays out on a win (1v1: 100, run mode: 1000).
  const hitChipsEarned = matchHitCount * 10;
  const resultChipsEarned = winner === 'player' ? (isRunMatch ? 1000 : 100) : 0;
  const totalChipsEarned = hitChipsEarned + resultChipsEarned;

  // Bear-off GATING cards block bear-off entirely rather than firing on one move — a persistent
  // badge (instead of a one-off flash) so the player always knows why bear-off is locked.
  const gatingHomeSlice = (side: PlayerId) => (side === 'player' ? board.points.slice(0, 6) : board.points.slice(18, 24));
  const gatingTotalCheckers = (side: PlayerId) =>
    board.bar[side] + board.points.reduce((sum, pt) => sum + pt.filter((c) => c.color === side).length, 0);
  const getGatingLabel = (affectedSide: PlayerId, sabotageCard?: Card): string | null => {
    if (!sabotageCard) return null;
    if (sabotageCard.id === 'card_home_security') {
      const hasOpenBlot = gatingHomeSlice(affectedSide).some((pt) => pt.filter((c) => c.color === affectedSide).length === 1);
      return hasOpenBlot ? 'HOME SECURITY: open blot in home — bear-off locked' : null;
    }
    if (sabotageCard.id === 'card_termination_protocol') {
      const hasStacked = gatingHomeSlice(affectedSide).some((pt) => pt.filter((c) => c.color === affectedSide).length >= 2);
      return hasStacked ? 'TERMINATION PROTOCOL: stacked home point — bear-off locked' : null;
    }
    if (sabotageCard.id === 'card_exact_lock') {
      return isHomeBoardReady(board, affectedSide) ? 'EXACT LOCK: overshoot bear-off disabled' : null;
    }
    if (sabotageCard.id === 'card_final_check') {
      return gatingTotalCheckers(affectedSide) === 1 ? 'FINAL CHECK: last checker — special rules apply' : null;
    }
    return null;
  };
  const playerGatingLabel = getGatingLabel('player', cpuActiveCard);
  const cpuGatingLabel = getGatingLabel('cpu', playerActiveCard);

  // Dice tumble: replay the entrance animation every time the dice reference changes
  // (fresh roll, reroll, or a die getting consumed mid-turn).
  const [rollGen, setRollGen] = useState(0);
  useEffect(() => {
    setRollGen((g) => g + 1);
  }, [dice]);

  // Hit shake: parent bumps shakeToken whenever a checker gets hit; we translate
  // that into a short, sharp board rattle.
  const shakeControls = useAnimationControls();
  const isFirstShake = useRef(true);
  useEffect(() => {
    if (isFirstShake.current) {
      isFirstShake.current = false;
      return;
    }
    shakeControls.start({
      x: [0, -10, 9, -7, 6, -3, 0],
      transition: { duration: 0.45, ease: 'easeOut' },
    });
  }, [shakeToken, shakeControls]);

  // Mutation flash: parent bumps mutationFlashToken whenever a card actually altered dice/movement
  // this turn — show a loud, unmissable banner for a couple seconds so it never blends into "normal" backgammon.
  const [showMutationFlash, setShowMutationFlash] = useState(false);
  const isFirstMutationFlash = useRef(true);
  useEffect(() => {
    if (isFirstMutationFlash.current) {
      isFirstMutationFlash.current = false;
      return;
    }
    setShowMutationFlash(true);
    const t = setTimeout(() => setShowMutationFlash(false), 2200);
    return () => clearTimeout(t);
  }, [mutationFlashToken]);

  // Filter valid moves starting from currently selected point or bar
  const movesFromSelected = selectedPoint !== null
    ? validMoves.filter((m) => m.from === selectedPoint)
    : [];

  // Check if bear off is possible for selected point or in general
  const selectedHasBearOff = movesFromSelected.some((m) => m.to === 'off');
  const validBearOffMoves = validMoves.filter((m) => m.to === 'off');

  const handlePointClick = (pointIndex: number | 'bar') => {
    soundFx.playClick();

    // If card point selection is pending and player clicked a board point
    if (pendingCardSelectionType && typeof pointIndex === 'number' && onSelectMarkedPointDirectly) {
      onSelectMarkedPointDirectly(pointIndex);
      return;
    }

    // If a point was already selected, check if clicking a valid target point
    if (selectedPoint !== null) {
      const targetMove = movesFromSelected.find((m) => m.to === pointIndex);
      if (targetMove) {
        onSelectMove(targetMove);
        setSelectedPoint(null);
        return;
      }
    }

    // Otherwise, check if clicking on a valid source point
    const movesFromHere = validMoves.filter((m) => m.from === pointIndex);
    if (movesFromHere.length > 0) {
      setSelectedPoint(pointIndex);
    } else {
      setSelectedPoint(null);
    }
  };

  const handleBearOffClick = () => {
    soundFx.playClick();
    if (selectedPoint !== null && selectedHasBearOff) {
      const bearOffMove = movesFromSelected.find((m) => m.to === 'off');
      if (bearOffMove) {
        onSelectMove(bearOffMove);
        setSelectedPoint(null);
        return;
      }
    }

    // If no point is selected, auto-select or execute first bear off move
    if (validBearOffMoves.length > 0) {
      onSelectMove(validBearOffMoves[0]);
      setSelectedPoint(null);
    }
  };

  // Helper to render checkers stack on a point
  const renderCheckers = (pointIndex: number, isTopRow: boolean) => {
    const checkers = board.points[pointIndex];
    const displayCount = Math.min(checkers.length, 5);
    const hasMore = checkers.length > 5;
    const visible = checkers.slice(0, displayCount);

    return (
      <div
        className={`absolute inset-x-0 flex flex-col items-center pointer-events-none ${
          isTopRow ? 'top-0.5 sm:top-1 flex-col' : 'bottom-0.5 sm:bottom-1 flex-col-reverse'
        }`}
      >
        <AnimatePresence mode="popLayout">
          {visible.map((checker, idx) => {
            const isPlayer = checker.color === 'player';
            return (
              <motion.div
                key={checker.id}
                layoutId={viewStage === 'table' ? checker.id : undefined}
                layout={viewStage === 'table'}
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.15, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 520, damping: 34, mass: 0.6 }}
                className={`w-4 h-4 xs:w-5 xs:h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full border xs:border-2 flex items-center justify-center font-bold text-[8px] xs:text-[9px] sm:text-xs my-0.5 shadow-md relative ${
                  isPlayer
                    ? 'bg-player/15 border-player text-player shadow-[0_0_8px_var(--player)]'
                    : 'bg-opponent/15 border-opponent text-opponent shadow-[0_0_8px_var(--opponent)]'
                }`}
              >
                <div
                  className={`w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border ${
                    isPlayer ? 'border-player bg-player/20' : 'border-opponent bg-opponent/20'
                  }`}
                />
                {idx === displayCount - 1 && hasMore && (
                  <span className="absolute -top-1 -right-1 text-[7px] sm:text-[9px] font-black bg-black/90 px-1 rounded text-white border border-white/20">
                    +{checkers.length - 4}
                  </span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  };

  // Render point triangle
  const renderPoint = (pointIndex: number, isTopRow: boolean) => {
    const isEven = pointIndex % 2 === 0;
    const isSelected = selectedPoint === pointIndex;
    const isTarget = movesFromSelected.some((m) => m.to === pointIndex);
    const hasValidMoveFromHere = validMoves.some((m) => m.from === pointIndex);
    const hasBearOffFromHere = validMoves.some((m) => m.from === pointIndex && m.to === 'off');

    const isPlayerBlackIce = pointIndex === playerBlackIcePoint;
    const isCpuBlackIce = pointIndex === cpuBlackIcePoint;
    const isPlayerDeadweight = pointIndex === playerDeadweightPoint;
    const isCpuDeadweight = pointIndex === cpuDeadweightPoint;
    const isPlayerCourier = pointIndex === playerCourierPoint;
    const isCpuCourier = pointIndex === cpuCourierPoint;

    return (
      <div
        key={pointIndex}
        onClick={() => handlePointClick(pointIndex)}
        className={`relative flex-1 h-full cursor-pointer transition-colors duration-150 group overflow-hidden ${
          isSelected
            ? 'bg-player/20 ring-2 ring-player'
            : isTarget
            ? 'bg-success/30 animate-pulse ring-2 ring-success'
            : hasValidMoveFromHere
            ? 'hover:bg-white/10'
            : ''
        }`}
      >
        {/* Point Triangle background */}
        <svg
          className={`w-full h-full absolute inset-0 pointer-events-none ${
            isTopRow ? 'rotate-180' : ''
          }`}
          preserveAspectRatio="none"
          viewBox="0 0 100 300"
        >
          <polygon
            points="0,300 50,0 100,300"
            style={{
              fill: isEven ? 'var(--point-a)' : 'var(--point-b)',
              stroke: isEven ? 'var(--point-a)' : 'var(--point-b)',
            }}
            fillOpacity={0.16}
            strokeOpacity={0.5}
            strokeWidth="2"
          />
        </svg>

        {/* Point Label Number */}
        <span
          className={`absolute text-[9px] font-mono font-bold text-text-muted pointer-events-none px-1 ${
            isTopRow ? 'bottom-1 left-1/2 -translate-x-1/2' : 'top-1 left-1/2 -translate-x-1/2'
          }`}
        >
          {pointIndex + 1}
        </span>

        {/* Card Effect Badges */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-20 pointer-events-none">
          {/* Black Ice Badge */}
          {(isPlayerBlackIce || isCpuBlackIce) && (
            <div
              className={`px-1.5 py-0.5 rounded-full border text-[8px] font-black uppercase flex items-center gap-0.5 shadow-lg ${
                isPlayerBlackIce
                  ? 'bg-player/20 border-player text-player shadow-[0_0_12px_var(--player)] animate-pulse'
                  : 'bg-opponent/20 border-opponent text-opponent shadow-[0_0_12px_var(--opponent)] animate-pulse'
              }`}
            >
              <Snowflake className="w-2.5 h-2.5" />
              <span>{isPlayerBlackIce ? t('neonBoard.badgeIce') : t('neonBoard.badgeCpuIce')}</span>
            </div>
          )}

          {/* Deadweight Badge */}
          {(isPlayerDeadweight || isCpuDeadweight) && (
            <div
              className={`px-1.5 py-0.5 rounded-full border text-[8px] font-black uppercase flex items-center gap-0.5 shadow-lg ${
                isPlayerDeadweight
                  ? 'bg-danger/20 border-danger text-danger shadow-[0_0_12px_var(--danger)] animate-pulse'
                  : 'bg-warning/20 border-warning text-warning shadow-[0_0_12px_var(--warning)] animate-pulse'
              }`}
            >
              <Anchor className="w-2.5 h-2.5" />
              <span>{t('neonBoard.badgeSluggish')}</span>
            </div>
          )}

          {/* Courier Badge */}
          {(isPlayerCourier || isCpuCourier) && (
            <div
              className={`px-1.5 py-0.5 rounded-full border text-[8px] font-black uppercase flex items-center gap-0.5 shadow-lg ${
                isPlayerCourier
                  ? 'bg-success/20 border-success text-success shadow-[0_0_12px_var(--success)] animate-pulse'
                  : 'bg-point-b/20 border-point-b text-point-b shadow-[0_0_12px_var(--point-b)] animate-pulse'
              }`}
            >
              <Navigation className="w-2.5 h-2.5" />
              <span>{t('neonBoard.badgeCourier')}</span>
            </div>
          )}
        </div>

        {/* Target Indicator Ring */}
        {isTarget && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-8 h-8 rounded-full border-2 border-success bg-success/40 animate-ping" />
          </div>
        )}

        {/* Bear Off Badge for Point */}
        {hasBearOffFromHere && (
          <div className="absolute top-2 inset-x-0 flex justify-center z-20 pointer-events-none">
            <span className="bg-success/20 text-success border border-success text-[8px] font-black px-1 rounded flex items-center gap-0.5 animate-bounce shadow-[0_0_8px_var(--success)]">
              BEAR OFF <ArrowUpRight className="w-2.5 h-2.5" />
            </span>
          </div>
        )}

        {/* Checkers Stack */}
        {renderCheckers(pointIndex, isTopRow)}
      </div>
    );
  };

  // Helper to render Bear Off Tray
  const renderBearOffTray = (isLeft: boolean) => (
    <div
      onClick={handleBearOffClick}
      className={`w-10 xs:w-12 sm:w-16 md:w-20 bg-panel-2/90 ${
        isLeft ? 'border-r-2' : 'border-l-2'
      } border-line flex flex-col items-center justify-between p-1 z-20 transition-all ${
        validBearOffMoves.length > 0 && turn === 'player'
          ? 'cursor-pointer hover:bg-success/10 border-success shadow-[0_0_20px_var(--success)]/50'
          : ''
      }`}
    >
      <span className="text-[7px] sm:text-[8px] font-extrabold uppercase tracking-wider text-text-muted hidden xs:block">
        BEAR OFF
      </span>

      {/* CPU Off Count */}
      <div className="text-center">
        <span className="text-[8px] sm:text-[9px] text-opponent font-bold">CPU</span>
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-opponent/15 border border-opponent text-opponent font-black text-[10px] sm:text-xs flex items-center justify-center">
          {board.off.cpu}
        </div>
      </div>

      {/* Player Off Count & Interactive Bear Off Button */}
      <div className="text-center w-full flex flex-col items-center">
        <div
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border-2 font-black text-xs sm:text-sm flex flex-col items-center justify-center transition-transform ${
            selectedHasBearOff || (validBearOffMoves.length > 0 && turn === 'player')
              ? 'bg-success/20 border-success text-success shadow-[0_0_15px_var(--success)] animate-bounce'
              : 'bg-player/15 border-player text-player'
          }`}
        >
          <span>{board.off.player}</span>
          <span className="text-[7px] sm:text-[8px] text-success uppercase font-mono hidden sm:inline">
            {validBearOffMoves.length > 0 ? t('neonBoard.off') : t('neonBoard.borne')}
          </span>
        </div>
        <span className="text-[8px] sm:text-[9px] text-player font-black mt-0.5">{t('neonBoard.you')}</span>
      </div>

      <span className="text-[7px] sm:text-[8px] font-extrabold uppercase tracking-wider text-text-muted hidden xs:block">
        {t('neonBoard.tray')}
      </span>
    </div>
  );

  return (
    <motion.div
      animate={shakeControls}
      className="relative w-full max-w-[1300px] mx-auto select-none p-1.5 sm:p-3 flex-1 min-h-0 flex flex-col"
    >
      {/* MUTATION ACTIVATED: fires whenever an equipped card actually changed dice/movement this turn */}
      <AnimatePresence>
        {showMutationFlash && mutationFlashText && !isLookingAround && !isMatchOver && (
          <motion.div
            key={mutationFlashToken}
            initial={{ opacity: 0, scale: 0.85, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-[92%] max-w-md"
          >
            <div
              className={`rounded-xl border-2 bg-ink-2/95 backdrop-blur-md px-3 py-2 sm:px-4 sm:py-2.5 text-center ${
                mutationFlashVariant === 'protocol'
                  ? 'border-danger shadow-[0_0_40px_var(--danger)]'
                  : 'border-player shadow-[0_0_40px_var(--player)]'
              }`}
            >
              <div
                className={`flex items-center justify-center gap-1.5 font-display font-black text-[11px] sm:text-xs uppercase tracking-[0.15em] ${
                  mutationFlashVariant === 'protocol'
                    ? 'text-danger drop-shadow-[0_0_10px_var(--danger)]'
                    : 'text-player drop-shadow-[0_0_10px_var(--player)]'
                }`}
              >
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {mutationFlashVariant === 'protocol' ? t('neonBoard.protocolActivated') : t('neonBoard.mutationActivated')}
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="mt-1 text-[10px] sm:text-xs text-text font-mono leading-snug">
                {mutationFlashText}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bear-off gating badges: persistent (not a one-off flash) since these BLOCK bear-off rather
          than fire on a move — the player should always be able to see why it's locked. */}
      {!isLookingAround && !isMatchOver && (playerGatingLabel || cpuGatingLabel) && (
        <div className="relative z-20 mb-1 flex flex-wrap gap-1">
          {playerGatingLabel && (
            <div className="px-2 py-0.5 rounded-lg bg-opponent/15 border border-opponent text-opponent font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Shield className="w-3 h-3 shrink-0" />
              {t('neonBoard.youGating', { label: playerGatingLabel })}
            </div>
          )}
          {cpuGatingLabel && (
            <div className="px-2 py-0.5 rounded-lg bg-player/15 border border-player text-player font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Shield className="w-3 h-3 shrink-0" />
              {t('neonBoard.cpuGating', { label: cpuGatingLabel })}
            </div>
          )}
        </div>
      )}

      {/* Direction & Status Bar */}
      {!isMatchOver && (
      <div className="relative z-20 mb-1.5 flex flex-wrap items-center justify-between gap-1 text-xs">
        {onUpdateSettings && !isLookingAround && (
          <button
            onClick={() =>
              onUpdateSettings({
                boardDirection: isClockwise ? 'counter_clockwise' : 'clockwise',
              })
            }
            className="px-2 py-0.5 rounded-lg bg-panel border border-line hover:border-player text-text-muted hover:text-player font-mono text-[9px] uppercase font-bold flex items-center gap-1 transition-all shadow-sm"
            title={t('neonBoard.changeDirectionTitle')}
          >
            <RotateCw className={`w-3 h-3 text-player transition-transform ${isClockwise ? 'rotate-180' : ''}`} />
            <span>{isClockwise ? t('neonBoard.bearOffClockwise') : t('neonBoard.bearOffCounterCw')}</span>
          </button>
        )}
        {onCycleViewStage && (
          <button
            onClick={onCycleViewStage}
            className={`px-2 py-0.5 rounded-lg border font-mono text-[9px] uppercase font-bold flex items-center gap-1 transition-all shadow-sm ${
              isLookingAround
                ? 'bg-player text-ink border-player shadow-[0_0_10px_var(--player)]'
                : 'bg-panel border-line text-text-muted hover:border-player hover:text-player'
            }`}
            title={
              viewStage === 'table'
                ? t('neonBoard.lookAroundTitleTable')
                : viewStage === 'peek'
                ? t('neonBoard.lookAroundTitlePeek')
                : t('neonBoard.lookAroundTitlePanorama')
            }
          >
            {isLookingAround ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span>
              {viewStage === 'table' ? t('neonBoard.lookAround') : viewStage === 'peek' ? t('neonBoard.lookFurther') : t('neonBoard.backToTable')}
            </span>
          </button>
        )}
      </div>
      )}

      {/* Pending Selection Banner for Cards */}
      {pendingCardSelectionType && !isLookingAround && !isMatchOver && (
        <div className={`mb-2 bg-gradient-to-r border-2 rounded-xl p-2 flex items-center justify-between text-xs shadow-lg animate-pulse ${
          pendingCardSelectionType === 'deadweight'
            ? 'from-opponent/25 via-panel to-opponent/25 border-opponent text-opponent shadow-[0_0_20px_var(--opponent)]/40'
            : pendingCardSelectionType === 'courier'
            ? 'from-success/25 via-panel to-success/25 border-success text-success shadow-[0_0_20px_var(--success)]/40'
            : 'from-player/25 via-panel to-player/25 border-player text-player shadow-[0_0_20px_var(--player)]/40'
        }`}>
          <div className="flex items-center gap-2">
            {pendingCardSelectionType === 'deadweight' && <Anchor className="w-4 h-4 text-opponent animate-bounce shrink-0" />}
            {pendingCardSelectionType === 'courier' && <Navigation className="w-4 h-4 text-success animate-pulse shrink-0" />}
            {pendingCardSelectionType === 'black_ice' && <Snowflake className="w-4 h-4 text-player animate-spin-slow shrink-0" />}
            <div>
              <span className="font-extrabold uppercase tracking-wider text-[11px]">
                {pendingCardSelectionType === 'deadweight' && t('neonBoard.deadweightActive') + ' '}
                {pendingCardSelectionType === 'courier' && t('neonBoard.courierActive') + ' '}
                {pendingCardSelectionType === 'black_ice' && t('neonBoard.blackIceActive') + ' '}
              </span>
              <span className="text-[10px] opacity-90 hidden xs:inline">
                {t('neonBoard.clickPointOrMenu')}
              </span>
            </div>
          </div>
          {onOpenMarkedModal && (
            <button
              onClick={onOpenMarkedModal}
              className="px-2.5 py-1 bg-white text-slate-950 font-black rounded-lg text-[10px] hover:bg-slate-200 transition-all shadow-md shrink-0 ml-2"
            >
              {t('neonBoard.selectPoint')}
            </button>
          )}
        </div>
      )}

      {/* COLD REBOOT Optional Reroll Banner */}
      {canColdRebootReroll && turn === 'player' && !isMatchOver && !isLookingAround && (
        <div className="mb-2 bg-gradient-to-r from-player/25 via-panel-2 to-player/25 border-2 border-player rounded-xl p-2 flex items-center justify-between gap-2 text-xs text-player shadow-[0_0_20px_var(--player)]/40 animate-pulse">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-player animate-spin-slow shrink-0" />
            <div>
              <span className="font-extrabold uppercase tracking-wider text-player text-[11px] block">
                {t('neonBoard.coldRebootActive')}
              </span>
              <span className="text-[10px] opacity-90 hidden sm:inline">
                {t('neonBoard.lowRollHint', { dice: dice.join(' + ') })}
              </span>
            </div>
          </div>
          {onColdRebootReroll && (
            <button
              onClick={onColdRebootReroll}
              className="px-2.5 py-1 rounded-lg bg-player hover:brightness-110 text-ink font-black text-[10px] uppercase tracking-wider transition-all shadow-[0_0_12px_var(--player)] active:scale-95 flex items-center gap-1 shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t('neonBoard.reroll')}</span>
            </button>
          )}
        </div>
      )}

      {/* Bear Off Active Notification Banner */}
      {isPlayerHomeReady && turn === 'player' && !isMatchOver && !isLookingAround && (
        <div className="mb-2 bg-gradient-to-r from-success/25 via-panel to-success/25 border border-success rounded-xl p-1.5 flex items-center justify-between text-xs text-success shadow-[0_0_15px_var(--success)]/40 animate-pulse">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
            <span className="font-bold uppercase tracking-wider text-[10px]">
              {t('neonBoard.bearOffModeActive')}
            </span>
          </div>
        </div>
      )}

      {/* Three-stage camera:
          TABLE  — flat 2D, straight down, fills the space (default play view)
          PEEK   — leaned back: same flat 2D board, just small and tucked in the bottom-right corner
          PANORAMA — board is unmounted entirely, handled by the wrapping condition below.
          Match end also unmounts the board (same as panorama): the felt/points/checkers would
          otherwise still render solid underneath the victory/defeat HUD, defeating the point of
          making that overlay transparent — with the board gone, the raw street scene shows through. */}
      {viewStage !== 'panorama' && !isMatchOver && (
      <div
        className={`py-2 sm:py-4 flex-1 min-h-0 flex transition-all duration-700 ${
          isPeek ? 'items-end justify-end pr-2 pb-2 sm:pr-4 sm:pb-4' : 'items-center justify-center'
        }`}
      >
        <div
          className="relative pointer-events-none transition-[max-width] duration-700"
          style={{ width: '100%', maxWidth: isPeek ? '300px' : '1250px' }}
        >
          <div
            className="relative z-10 frame-accent grain flex flex-col border-2 sm:border-[3px] border-line-strong rounded-xl overflow-hidden mx-auto pointer-events-auto transition-[height] duration-700"
            style={{
              height: isPeek ? 'clamp(120px, 22vh, 190px)' : 'clamp(240px, calc(60vh - 40px), 480px)',
              boxShadow:
                'inset 0 2px 0 rgba(255,255,255,0.12), inset 0 -3px 8px rgba(0,0,0,0.5), 0 50px 80px -18px rgba(0,0,0,0.9), 0 0 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* Fill layer, separate from the content above it: in the flat TABLE view this fades
                to transparent at the top/bottom edges so the ground photo bleeds through instead
                of a hard-edged opaque card. PEEK keeps a solid fill (it's a tilted physical object).
                --board-veil is the AR-hologram translucency (the board is a projection, not an
                object) — near-opaque during a protocol boss fight, when the projection locks in. */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-700"
              style={{
                background: 'var(--panel-2)',
                opacity: 'var(--board-veil)',
                maskImage: !isPeek ? 'linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)' : 'none',
                WebkitMaskImage: !isPeek ? 'linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)' : 'none',
              }}
            />

            {/* Surface sheen — a soft top-lit highlight so the board reads as glossed material, not a flat decal */}
            <div
              className="absolute inset-0 pointer-events-none z-30"
              style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.08) 0%, transparent 35%, transparent 70%, rgba(0,0,0,0.18) 100%)' }}
            />
        {/* TOP ROW */}
        <div className="flex-1 flex border-b-2 border-line">
          {/* If Clockwise: Bear off tray on Left */}
          {isClockwise && renderBearOffTray(true)}

          {/* Left Quadrant */}
          <div className="flex-1 flex border-r-2 border-line">
            {(isClockwise
              ? [23, 22, 21, 20, 19, 18]
              : [12, 13, 14, 15, 16, 17]
            ).map((p) => renderPoint(p, true))}
          </div>

          {/* BAR SECTION (CENTER COLUMN) */}
          <div className="w-9 xs:w-11 sm:w-14 md:w-16 bg-panel-2 border-x-2 border-line flex flex-col items-center justify-between p-1 z-20">
            <span className="text-[8px] sm:text-[9px] font-black uppercase text-text-muted tracking-widest hidden xs:block">{t('neonBoard.bar')}</span>

            {/* Player Bar Checkers */}
            {board.bar.player > 0 && (
              <div
                onClick={() => handlePointClick('bar')}
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-player/20 border-2 border-player text-player font-black text-[9px] sm:text-xs flex items-center justify-center shadow-[0_0_15px_var(--player)] cursor-pointer animate-bounce ${
                  selectedPoint === 'bar' ? 'ring-2 ring-white' : ''
                }`}
              >
                P:{board.bar.player}
              </div>
            )}

            {/* CPU Bar Checkers */}
            {board.bar.cpu > 0 && (
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-opponent/20 border-2 border-opponent text-opponent font-black text-[9px] sm:text-xs flex items-center justify-center shadow-[0_0_15px_var(--opponent)]">
                C:{board.bar.cpu}
              </div>
            )}

            <span className="text-[8px] sm:text-[9px] font-black uppercase text-text-muted tracking-widest hidden xs:block">{t('neonBoard.bar')}</span>
          </div>

          {/* Right Quadrant */}
          <div className="flex-1 flex border-l-2 border-line">
            {(isClockwise
              ? [17, 16, 15, 14, 13, 12]
              : [18, 19, 20, 21, 22, 23]
            ).map((p) => renderPoint(p, true))}
          </div>

          {/* If Counter-Clockwise: Bear off tray on Right */}
          {!isClockwise && renderBearOffTray(false)}
        </div>

        {/* BOTTOM ROW */}
        <div className="flex-1 flex">
          {/* If Clockwise: Bear off spacer on Left */}
          {isClockwise && (
            <div className="w-10 xs:w-12 sm:w-16 md:w-20 bg-panel-2/90 border-r-2 border-line" />
          )}

          {/* Left Quadrant */}
          <div className="flex-1 flex border-r-2 border-line">
            {(isClockwise
              ? [0, 1, 2, 3, 4, 5]
              : [11, 10, 9, 8, 7, 6]
            ).map((p) => renderPoint(p, false))}
          </div>

          {/* Center Bar Spacer */}
          <div className="w-9 xs:w-11 sm:w-14 md:w-16 bg-panel-2 border-x-2 border-line" />

          {/* Right Quadrant */}
          <div className="flex-1 flex border-l-2 border-line">
            {(isClockwise
              ? [6, 7, 8, 9, 10, 11]
              : [5, 4, 3, 2, 1, 0]
            ).map((p) => renderPoint(p, false))}
          </div>

          {/* If Counter-Clockwise: Bear off spacer on Right */}
          {!isClockwise && (
            <div className="w-10 xs:w-12 sm:w-16 md:w-20 bg-panel-2/90 border-l-2 border-line" />
          )}
        </div>
          </div>
        </div>
      </div>
      )}

      {/* Active Match Mutations Display */}
      {(playerActiveCard || cpuActiveCard || bossProtocol) && !isLookingAround && !isMatchOver && (
        <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {playerActiveCard && (
            <div
              onClick={() => onCardClick && onCardClick(playerActiveCard, t('neonBoard.ownerLabelPlayer'))}
              className="bg-player/10 border border-player/40 hover:border-player hover:bg-player/15 rounded-lg p-1.5 px-2 flex items-center gap-1.5 text-[11px] cursor-pointer transition-all shadow-sm"
              title={t('neonBoard.clickToExpand')}
            >
              <Sparkles className="w-3.5 h-3.5 text-player shrink-0" />
              <div className="line-clamp-1">
                <span className="font-mono text-[9px] text-player uppercase font-bold mr-1">
                  {t('neonBoard.playerCard')}
                </span>
                <span className="font-black text-text">{playerActiveCardName}</span>
                <span className="text-text-muted ml-1 text-[10px] hidden md:inline">({playerActiveCardDescription})</span>
              </div>
            </div>
          )}
          {/* Protocol bosses carry no card — show the active rule-break instead. MIRROR CORE is the
              one protocol that also sets cpuActiveCard (it plays a copy of your own card). */}
          {bossProtocol && !cpuActiveCard ? (
            <div
              className="bg-danger/10 border border-danger/50 rounded-lg p-1.5 px-2 flex items-center gap-1.5 text-[11px] shadow-sm animate-pulse"
              title={bossProtocolDescription}
            >
              <CardIcon name={bossProtocol.iconName} className="w-3.5 h-3.5 text-danger shrink-0" />
              <div className="line-clamp-1">
                <span className="font-mono text-[9px] text-danger uppercase font-bold mr-1">
                  {t('neonBoard.protocol')}
                </span>
                <span className="font-black text-text">{bossProtocolName}</span>
                <span className="text-text-muted ml-1 text-[10px] hidden md:inline">({bossProtocolDescription})</span>
              </div>
            </div>
          ) : (
            cpuActiveCard && (
              <div
                onClick={() => onCardClick && onCardClick(cpuActiveCard, t('neonBoard.ownerLabelCpu'))}
                className={`rounded-lg p-1.5 px-2 flex items-center gap-1.5 text-[11px] cursor-pointer transition-all shadow-sm ${
                  bossProtocol
                    ? 'bg-danger/10 border border-danger/50 hover:border-danger hover:bg-danger/15'
                    : 'bg-opponent/10 border border-opponent/40 hover:border-opponent hover:bg-opponent/15'
                }`}
                title={t('neonBoard.clickToExpand')}
              >
                <Sparkles className={`w-3.5 h-3.5 shrink-0 ${bossProtocol ? 'text-danger' : 'text-opponent'}`} />
                <div className="line-clamp-1">
                  <span className={`font-mono text-[9px] uppercase font-bold mr-1 ${bossProtocol ? 'text-danger' : 'text-opponent'}`}>
                    {bossProtocol ? t('neonBoard.mirror', { name: bossProtocolName }) : t('neonBoard.cpuCard')}
                  </span>
                  <span className="font-black text-text">{cpuActiveCardName}</span>
                  <span className="text-text-muted ml-1 text-[10px] hidden md:inline">({cpuActiveCardDescription})</span>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Card Trigger & Event Notes Bar */}
      {cardNotes.length > 0 && !isLookingAround && !isMatchOver && (
        <div className="mt-1.5 bg-panel/90 border border-player/40 rounded-lg p-1.5 px-2 flex items-center gap-1.5 text-[10px] sm:text-xs text-player shadow-md animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-player shrink-0" />
          <div className="flex-1 overflow-hidden line-clamp-1 font-mono">
            {cardNotes[cardNotes.length - 1]}
          </div>
        </div>
      )}

      {/* Bottom Controls Bar: Roll Dice, Undo, Pass Turn, Turn Indicator */}
      {!isLookingAround && !isMatchOver && (
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 bg-panel/90 border border-line rounded-xl p-2 sm:p-2.5">
        {/* Turn Status */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2.5 h-2.5 rounded-full animate-ping ${
              turn === 'player' ? 'bg-player shadow-[0_0_10px_var(--player)]' : 'bg-opponent shadow-[0_0_10px_var(--opponent)]'
            }`}
          />
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-text">
            {turn === 'player' ? t('neonBoard.yourTurn') : t('neonBoard.cpuTurnEllipsis')}
          </span>
        </div>

        {/* Dice Visual Display */}
        <div className="flex items-center gap-1.5">
          {dice.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {dice.map((d, idx) => (
                <motion.div
                  key={`die-${idx}-${rollGen}`}
                  initial={{ scale: 0.2, rotate: -220, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.3, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 18, delay: idx * 0.05 }}
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-player/30 to-panel-2 border-2 border-player text-player font-black text-sm sm:text-lg flex items-center justify-center shadow-[0_0_15px_var(--player)]/40"
                >
                  {d}
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <span className="text-[10px] text-text-muted italic">{t('neonBoard.noDice')}</span>
          )}
          {canPaidReroll && (
            <button
              onClick={onPaidDieReroll}
              title={t('neonBoard.paidRerollTitle')}
              className="px-2 py-1.5 rounded-lg bg-panel border border-player/50 hover:bg-line text-player font-bold text-[9px] sm:text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 shadow-md active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              {t('neonBoard.rerollCost', { cost: rerollDieCost.toLocaleString() })}
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* UNDO BUTTONS */}
          {canUndo && turn === 'player' && !isMatchOver && (
            <div className="flex items-center gap-1">
              <button
                onClick={onUndoMove}
                className="px-2.5 py-1.5 rounded-lg bg-panel border border-player/50 hover:bg-line text-player font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1 shadow-md active:scale-95"
                title={t('neonBoard.undoTitle')}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t('neonBoard.undo')}</span>
              </button>

              <button
                onClick={onUndoTurn}
                className="px-2 py-1.5 rounded-lg bg-panel-2 border border-line hover:border-player text-text-muted hover:text-text font-bold text-[9px] uppercase tracking-wider transition-all"
                title={t('neonBoard.resetTitle')}
              >
                {t('neonBoard.reset')}
              </button>
            </div>
          )}

          {canRoll && turn === 'player' && (
            <button
              onClick={() => {
                soundFx.playDiceRoll();
                onRollDice();
              }}
              className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-gradient-to-r from-player to-success text-ink font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_20px_var(--player)]/60 hover:brightness-125 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Dices className="w-4 h-4" />
              {t('neonBoard.roll')}
            </button>
          )}

          {dice.length > 0 && validMoves.length === 0 && turn === 'player' && onPassTurn && (
            <button
              onClick={onPassTurn}
              className="px-3 py-1.5 rounded-xl bg-danger/15 border border-danger text-danger font-bold text-xs uppercase tracking-wider hover:bg-danger/25 transition-all flex items-center gap-1"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {t('neonBoard.pass')}
            </button>
          )}

          {canDiscardDie && onDiscardDie && (
            <button
              onClick={onDiscardDie}
              title={t('neonBoard.discardDieTitle')}
              className="px-3 py-1.5 rounded-xl bg-warning/15 border border-warning text-warning font-bold text-xs uppercase tracking-wider hover:bg-warning/25 transition-all flex items-center gap-1"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {t('neonBoard.discardDie')}
            </button>
          )}
        </div>
      </div>
      )}

      {/* Match Victory / Defeat Overlay — portaled straight to document.body (like every other
          full-screen modal in this app) rather than positioned within this component's own tree.
          The outer motion.div above carries a shake animation (animate={shakeControls}), and any
          transform on an ancestor makes it the containing block for descendant fixed/absolute
          elements too — so even `position: fixed` here could still end up pinned to that
          shrinking, animation-affected ancestor instead of the real viewport. Portaling out
          removes the ancestor relationship entirely, which is the only fully reliable fix. */}
      {isMatchOver && createPortal(
        <div className="fixed inset-0 z-50 bg-ink/70 flex flex-col items-center justify-center text-center p-4 sm:p-6 overflow-y-auto">
          {/* Outcome-tinted scanline wash, echoing the boss-intro alarm treatment */}
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              background: `repeating-linear-gradient(0deg, ${
                winner === 'player' ? 'rgba(0,229,255,0.18)' : 'rgba(255,45,120,0.18)'
              } 0px, transparent 1.5px, transparent 3.5px)`,
            }}
          />

          <div className="relative w-full max-w-sm px-6 py-4 sm:py-6 my-auto flex flex-col items-center">
            {/* HUD corner brackets */}
            <span className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 rounded-tl-lg ${winner === 'player' ? 'border-player' : 'border-opponent'}`} />
            <span className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 rounded-tr-lg ${winner === 'player' ? 'border-player' : 'border-opponent'}`} />
            <span className={`absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 rounded-bl-lg ${winner === 'player' ? 'border-player' : 'border-opponent'}`} />
            <span className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 rounded-br-lg ${winner === 'player' ? 'border-player' : 'border-opponent'}`} />

            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex items-center justify-center mb-2 ${
                winner === 'player'
                  ? 'bg-player/15 border-player shadow-[0_0_35px_5px_rgba(0,229,255,0.65)]'
                  : 'bg-opponent/15 border-opponent shadow-[0_0_35px_5px_rgba(255,45,120,0.65)]'
              }`}
            >
              {winner === 'player' ? <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-player" /> : <ServerCrash className="w-7 h-7 sm:w-8 sm:h-8 text-opponent" />}
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-black tracking-widest mb-1 uppercase">
              {winner === 'player' ? (
                <span className="text-player drop-shadow-[0_2px_12px_rgba(0,229,255,0.8)]">{t('neonBoard.matchVictory')}</span>
              ) : (
                <span className="text-opponent drop-shadow-[0_2px_12px_rgba(255,45,120,0.8)]">{t('neonBoard.systemDefeat')}</span>
              )}
            </h2>

            <p className="text-xs sm:text-sm text-text max-w-md mb-3 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              {winner === 'player'
                ? isRunMatch
                  ? t('neonBoard.victoryDescRun')
                  : t('neonBoard.victoryDescQuick')
                : isRunMatch
                ? t('neonBoard.defeatDescRun')
                : t('neonBoard.defeatDescQuick')}
            </p>

            {totalChipsEarned > 0 && (
              <div className="w-full max-w-[220px] mb-3 rounded-lg border border-line bg-panel/70 px-3 py-1.5 font-mono text-[10px] sm:text-[11px]">
                <div className="flex items-center gap-1.5 mb-1.5 text-text-muted uppercase tracking-wider text-[9px]">
                  <Coins className="w-3 h-3 text-player" />
                  {t('neonBoard.chipsEarned')}
                </div>
                {hitChipsEarned > 0 && (
                  <div className="flex items-center justify-between text-text-muted">
                    <span>{t('neonBoard.opponentHitTimes', { count: matchHitCount })}</span>
                    <span className="text-text">+{hitChipsEarned}</span>
                  </div>
                )}
                {resultChipsEarned > 0 && (
                  <div className="flex items-center justify-between text-text-muted">
                    <span>{t('neonBoard.matchWon')}</span>
                    <span className="text-text">+{resultChipsEarned}</span>
                  </div>
                )}
                <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-line font-bold">
                  <span className="text-text-muted">{t('neonBoard.total')}</span>
                  <span className="text-player">+{totalChipsEarned}</span>
                </div>
              </div>
            )}

            <button
              onClick={onNextMatch}
              className={`px-8 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 ${
                winner === 'player'
                  ? 'bg-gradient-to-r from-player to-success text-ink shadow-[0_0_30px_rgba(0,229,255,0.7)]'
                  : 'bg-gradient-to-r from-opponent to-danger text-ink shadow-[0_0_30px_rgba(255,45,120,0.7)]'
              }`}
            >
              {t('neonBoard.continue')}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>,
        document.body
      )}
    </motion.div>
  );
};

