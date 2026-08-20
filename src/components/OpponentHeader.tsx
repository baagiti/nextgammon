import React from 'react';
import { OpponentCard, Card, BossProtocol } from '../types';
import { Bot, Sparkles, Skull } from 'lucide-react';
import { CardIcon } from './CardIcon';
import { useTranslation } from 'react-i18next';
import { useOpponentDisplayText, useProtocolText, useCardText } from '../hooks/useLocalizedText';

interface OpponentHeaderProps {
  opponent: OpponentCard;
  cpuPipCount: number;
  playerPipCount: number;
  stage: number;
  maxStages: number;
  cpuCard?: Card;
  protocol?: BossProtocol | null;
  onCardClick?: (card: Card) => void;
}

export const OpponentHeader: React.FC<OpponentHeaderProps> = ({
  opponent,
  cpuPipCount,
  playerPipCount,
  stage,
  maxStages,
  cpuCard,
  protocol,
  onCardClick,
}) => {
  const { t } = useTranslation('ui');
  const pipDiff = playerPipCount - cpuPipCount; // Positive means CPU is leading (fewer pips needed)
  const { bossName, bossTitle, quote } = useOpponentDisplayText(opponent);
  const { name: protocolName, taunt: protocolTaunt } = useProtocolText(
    protocol ?? { id: '', name: '', description: '', taunt: '' }
  );
  const { name: cpuCardName } = useCardText(cpuCard ?? { id: '', name: '', tagline: '', description: '' });

  return (
    <div className="w-full bg-panel/95 border-b-2 border-line p-2 sm:p-2.5 flex items-center justify-between gap-2 text-text backdrop-blur-md shadow-lg select-none rounded-xl">
      {/* Left: CPU Boss Avatar & Meta Info */}
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="relative w-8 h-8 sm:w-11 sm:h-11 rounded-lg border-2 flex items-center justify-center p-0.5 overflow-hidden shadow-md shrink-0"
          style={{ borderColor: opponent.accentColor, backgroundColor: `${opponent.accentColor}15` }}
        >
          <Bot className="w-5 h-5 sm:w-7 sm:h-7" style={{ color: opponent.accentColor }} />
          <div
            className="absolute bottom-0 inset-x-0 h-1"
            style={{ backgroundColor: opponent.accentColor }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-danger/15 text-danger border border-danger/40 tracking-wider shrink-0">
              {t('opponentHeader.cyberCpu')}
            </span>
            <span className="text-[9px] text-text-muted font-mono hidden xs:inline">
              {t('opponentHeader.level')}
            </span>
          </div>
          <h2 className="font-display text-xs sm:text-sm font-black tracking-wider text-text truncate flex items-center gap-1">
            {bossName}
            <span className="text-[10px] font-normal text-text-muted hidden md:inline truncate">— {bossTitle}</span>
          </h2>
          <p className="text-[10px] text-text-muted italic truncate hidden lg:block max-w-xs">
            "{quote}"
          </p>
        </div>
      </div>

      {/* Middle: Live Pip Differential Meter */}
      <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1 bg-panel-2/90 rounded-lg border border-line text-center shrink-0">
        <div className="flex flex-col items-center">
          <span className="text-[8px] sm:text-[9px] text-player font-mono font-bold uppercase">{t('opponentHeader.you')}</span>
          <span className="text-xs sm:text-sm font-black text-player font-mono">{playerPipCount}</span>
        </div>

        <div className="flex flex-col items-center min-w-[50px] sm:min-w-[80px]">
          <span className="text-[8px] text-text-muted font-bold uppercase tracking-wider">
            {pipDiff > 0 ? (
              <span className="text-success">{t('opponentHeader.lead', { n: pipDiff })}</span>
            ) : pipDiff < 0 ? (
              <span className="text-danger">{t('opponentHeader.trailing', { n: Math.abs(pipDiff) })}</span>
            ) : (
              <span className="text-warning">{t('opponentHeader.even')}</span>
            )}
          </span>
          <div className="w-full h-1.5 bg-line rounded-full overflow-hidden flex my-0.5">
            <div
              className="bg-player h-full transition-all duration-300"
              style={{
                width: `${Math.max(10, Math.min(90, (cpuPipCount / (playerPipCount + cpuPipCount || 1)) * 100))}%`,
              }}
            />
            <div
              className="h-full transition-all duration-300"
              style={{
                backgroundColor: opponent.accentColor,
                width: `${Math.max(10, Math.min(90, (playerPipCount / (playerPipCount + cpuPipCount || 1)) * 100))}%`,
              }}
            />
          </div>
          <span className="text-[7px] text-text-muted font-mono uppercase hidden sm:block">{t('opponentHeader.pipRace')}</span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[8px] sm:text-[9px] font-mono font-bold uppercase" style={{ color: opponent.accentColor }}>
            {t('opponentHeader.cpu')}
          </span>
          <span className="text-xs sm:text-sm font-black font-mono" style={{ color: opponent.accentColor }}>
            {cpuPipCount}
          </span>
        </div>
      </div>

      {/* Right: protocol badge (persistent speech bubble) for protocol bosses, or the CPU's card */}
      {protocol ? (
        <div className="relative flex items-center gap-1.5 bg-danger/15 border border-danger/70 rounded-lg px-2 sm:px-2.5 py-1 shadow-[0_0_14px_var(--danger)]/40 shrink-0 max-w-[160px] sm:max-w-[220px]" title={protocolTaunt}>
          <CardIcon name={protocol.iconName} className="w-3.5 h-3.5 text-danger shrink-0 animate-pulse" />
          <div className="text-right min-w-0">
            <span className="text-[8px] font-mono font-black text-danger block uppercase tracking-wider truncate">
              {t('opponentHeader.protocolActive')}
            </span>
            <span className="text-[10px] sm:text-xs font-black text-text block truncate">
              {protocolName}
            </span>
          </div>
          {/* Small always-visible speech bubble with the boss's taunt, shown on wider screens */}
          <div className="hidden lg:block absolute top-full right-2 mt-1.5 w-40 bg-ink-2 border border-danger/60 rounded-lg px-2 py-1.5 shadow-lg z-10">
            <p className="text-[9px] text-text-muted italic leading-snug">"{protocolTaunt}"</p>
            <div
              className="absolute -top-1.5 right-3 w-0 h-0"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderBottom: '6px solid var(--danger)',
                opacity: 0.6,
              }}
            />
          </div>
        </div>
      ) : (
        cpuCard && (
          <div
            onClick={() => onCardClick && onCardClick(cpuCard)}
            className="flex items-center gap-1.5 bg-panel-2/90 border border-opponent/50 rounded-lg px-2 sm:px-2.5 py-1 shadow-[0_0_12px_var(--opponent)]/20 hover:border-opponent hover:scale-105 cursor-pointer transition-all shrink-0 max-w-[120px] sm:max-w-none"
            title={t('opponentHeader.clickToExpand')}
          >
            <Sparkles className="w-3.5 h-3.5 text-opponent shrink-0 animate-pulse" />
            <div className="text-right min-w-0">
              <span className="text-[8px] font-mono font-bold text-opponent block uppercase tracking-wider truncate">
                {t('opponentHeader.cpuCard')}
              </span>
              <span className="text-[10px] sm:text-xs font-black text-text block truncate">
                {cpuCardName}
              </span>
            </div>
          </div>
        )
      )}
    </div>
  );
};

