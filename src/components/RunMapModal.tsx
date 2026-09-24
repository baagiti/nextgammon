import React from 'react';
import { useTranslation } from 'react-i18next';
import { RunState } from '../types';
import { CAMPAIGN_STAGES, BOSS_PROTOCOLS } from '../game/campaignData';
import { PLAYER_CARDS } from '../game/cardsData';
import { CardIcon } from './CardIcon';
import { getCardText, getCampaignStageText, getProtocolText } from '../hooks/useLocalizedText';
import { Swords, Lock, CheckCircle2, Trophy, AlertTriangle, Bot, Coins, FastForward } from 'lucide-react';
import { useIsPhoneViewport } from '../hooks/useIsPhoneViewport';

export const BUYBACK_CARD_COST = 10000;
export const SKIP_STAGE_COST = 100000;
export const REROLL_DIE_COST = 8000;

interface RunMapModalProps {
  run: RunState;
  onEnterMatch: () => void;
  neonChips: number;
  onBuyBackCard: (cardId: string) => void;
  onSkipStage: () => void;
}

const ACT_NAMES: Record<number, string> = {
  1: 'BOOT SECTOR',
  2: 'STREET LEVEL',
  3: 'THE GRID',
  4: 'DEEP NET',
  5: 'BLACK MARKET',
  6: 'CORE BREACH',
  7: 'SINGULARITY',
};

const RARITY_STYLE: Record<string, { border: string; bg: string; text: string }> = {
  common: { border: 'border-rarity-common/50', bg: 'bg-rarity-common/10', text: 'text-rarity-common' },
  rare: { border: 'border-rarity-rare/60', bg: 'bg-rarity-rare/10', text: 'text-rarity-rare' },
  epic: { border: 'border-rarity-epic/70', bg: 'bg-rarity-epic/10', text: 'text-rarity-epic' },
  legendary: { border: 'border-rarity-legendary/80', bg: 'bg-rarity-legendary/10', text: 'text-rarity-legendary' },
};

export const RunMapModal: React.FC<RunMapModalProps> = ({ run, onEnterMatch, neonChips, onBuyBackCard, onSkipStage }) => {
  const { t: tCards } = useTranslation('cards');
  const { t: tBosses } = useTranslation('bosses');
  const { t } = useTranslation('ui');
  // Landscape phones: a slimmer header/encounter row, and the 44-stage roadmap collapses to one
  // row of icon chips per act (two acts side by side) so the whole campaign fits on one screen.
  // The current stage's full details are already in the encounter row above it.
  const isPhone = useIsPhoneViewport();
  const totalCardsWon = Math.max(0, run.deck.length - 1); // exclude the free starter card
  const currentStage = CAMPAIGN_STAGES[run.stage - 1];
  const currentStageText = currentStage ? getCampaignStageText(tBosses, currentStage) : null;
  const acts = Array.from(new Set(CAMPAIGN_STAGES.map((s) => s.act)));
  const canSkipStage = !!currentStage && currentStage.kind === 'card';

  return (
    <div
      className={`w-full max-w-5xl mx-auto grain bg-panel border-2 border-line-strong rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] text-text ${
        isPhone ? 'p-2.5 h-full flex flex-col' : 'p-4 sm:p-6'
      }`}
    >
      {/* Run Status Header */}
      <div className={`relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-line ${isPhone ? 'pb-1.5 mb-1.5' : 'pb-4 mb-4'}`}>
        <div className={isPhone ? 'flex items-baseline gap-2' : ''}>
          <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-player">{t('runMap.campaignLabel')}</span>
          <h2 className={`font-display font-black text-text tracking-wide uppercase ${isPhone ? 'text-sm' : 'text-xl sm:text-2xl'}`}>
            {run.stage > CAMPAIGN_STAGES.length
              ? t('runMap.campaignComplete')
              : t('runMap.stageOf', { stage: run.stage, total: CAMPAIGN_STAGES.length })}
          </h2>
        </div>
        <div className={`flex items-center gap-2 rounded-xl bg-panel-2 border border-rarity-legendary/50 text-rarity-legendary font-mono font-bold shadow-[0_0_15px_var(--rarity-legendary)]/20 uppercase ${isPhone ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1.5 text-xs'}`}>
          <Trophy className={isPhone ? 'w-3 h-3' : 'w-4 h-4'} />
          {t('runMap.cardsWon', { won: totalCardsWon, total: CAMPAIGN_STAGES.length })}
        </div>
      </div>

      {/* Overall progress bar */}
      <div className={`relative z-10 w-full bg-panel-2 rounded-full overflow-hidden border border-line shrink-0 ${isPhone ? 'h-1.5 mb-2' : 'h-2 mb-5'}`}>
        <div
          className="h-full bg-player transition-all duration-500 shadow-[0_0_10px_var(--player)]"
          style={{ width: `${(totalCardsWon / CAMPAIGN_STAGES.length) * 100}%` }}
        />
      </div>

      {/* Captured cards warning + buyback option */}
      {run.capturedCardIds.length > 0 && (
        <div
          className={`relative z-10 bg-danger/10 border border-danger/50 rounded-xl flex ${
            isPhone ? 'mb-2 p-1.5 flex-row items-center gap-2' : 'mb-5 p-3 flex-col gap-2.5'
          }`}
        >
          <div className={`flex items-start min-w-0 ${isPhone ? 'gap-1.5 text-[10px] leading-snug flex-1' : 'gap-3 text-sm'}`}>
            <AlertTriangle className={`text-danger shrink-0 ${isPhone ? 'w-3.5 h-3.5' : 'w-5 h-5 mt-0.5'}`} />
            <div>
              <span className="font-black text-danger uppercase tracking-wider">
                {run.capturedCardIds.length > 1 ? t('runMap.bossHoldsCards') : t('runMap.bossHoldsCard')}{' '}
              </span>
              <span className="text-text">
                {run.capturedCardIds
                  .map((id) => {
                    const c = PLAYER_CARDS.find((c) => c.id === id);
                    return c ? getCardText(tCards, c).name : id;
                  })
                  .join(', ')}
              </span>
              <span className={`text-text-muted ${isPhone ? 'hidden' : ''}`}> {run.capturedCardIds.length > 1 ? t('runMap.recoverHintPlural') : t('runMap.recoverHint')}</span>
            </div>
          </div>
          <div className={`flex flex-wrap gap-2 ${isPhone ? 'shrink-0' : 'pl-8'}`}>
            {run.capturedCardIds.map((id) => {
              const card = PLAYER_CARDS.find((c) => c.id === id);
              const canAfford = neonChips >= BUYBACK_CARD_COST;
              return (
                <button
                  key={id}
                  onClick={() => onBuyBackCard(id)}
                  disabled={!canAfford}
                  className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    canAfford
                      ? 'bg-danger/20 border border-danger text-danger hover:bg-danger/30'
                      : 'bg-panel-2 border border-line text-text-muted cursor-not-allowed opacity-60'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  {t('runMap.buyBack', { name: card ? getCardText(tCards, card).name : id, cost: BUYBACK_CARD_COST.toLocaleString() })}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Next Encounter Action */}
      {currentStage && (
        <div
          className={`relative z-10 bg-panel-2 border rounded-xl flex justify-between gap-3 ${
            isPhone ? 'p-2 flex-row items-center mb-2 shrink-0' : 'p-4 flex-col sm:flex-row sm:items-center mb-6'
          }`}
          style={{ borderColor: `${currentStage.accentColor}60` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`rounded-xl border-2 flex items-center justify-center shrink-0 ${isPhone ? 'w-9 h-9' : 'w-12 h-12'}`}
              style={{ borderColor: currentStage.accentColor, backgroundColor: `${currentStage.accentColor}15` }}
            >
              <Bot className={isPhone ? 'w-5 h-5' : 'w-6 h-6'} style={{ color: currentStage.accentColor }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-player font-mono font-bold text-[10px] uppercase tracking-widest mb-0.5">
                <Swords className="w-3.5 h-3.5" />
                {t('runMap.act', { n: currentStage.act, name: ACT_NAMES[currentStage.act] })}
              </div>
              <h3 className={`font-display font-black text-text truncate ${isPhone ? 'text-sm' : 'text-lg'}`}>
                {currentStageText!.bossName} <span className="text-text-muted font-normal text-sm">— {currentStageText!.bossTitle}</span>
              </h3>
              <p className={`text-text-muted italic mt-0.5 truncate ${isPhone ? 'text-[10px]' : 'text-xs'}`}>"{currentStageText!.quote}"</p>
            </div>
          </div>
          <div className={`flex gap-2 shrink-0 ${isPhone ? 'flex-row items-center' : 'flex-col'}`}>
            <button
              onClick={onEnterMatch}
              className={`${isPhone ? 'py-2 px-4 text-xs' : 'py-3 px-6 text-sm'} rounded-xl bg-player text-ink font-display font-black uppercase tracking-wider shadow-[0_0_25px_var(--player)]/60 hover:scale-105 hover:brightness-110 transition-all flex items-center justify-center gap-2`}
            >
              {t('runMap.battleOpponent')}
              <Swords className="w-4 h-4" />
            </button>
            {canSkipStage && (
              <button
                onClick={onSkipStage}
                disabled={neonChips < SKIP_STAGE_COST}
                title={t('runMap.skipTitle')}
                className={`py-1.5 px-4 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  neonChips >= SKIP_STAGE_COST
                    ? 'bg-panel-2 border border-player/50 text-player hover:border-player'
                    : 'bg-panel-2 border border-line text-text-muted cursor-not-allowed opacity-60'
                }`}
              >
                <FastForward className="w-3 h-3" />
                {t('runMap.skip', { cost: SKIP_STAGE_COST.toLocaleString() })}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Act-grouped roadmap — phone: one row of icon chips per act, two acts side by side */}
      {isPhone && (
        <div className="relative z-10 flex-1 min-h-0 overflow-y-auto grid grid-cols-2 gap-x-4 gap-y-1.5 content-start">
          {acts.map((act) => (
            <div key={act} className="flex items-center gap-2 min-w-0">
              <div className="w-[72px] shrink-0 font-mono text-[8px] font-black uppercase leading-tight text-text-muted">
                {t('runMap.actShort', { n: act })}
                <span className="block text-player truncate">{ACT_NAMES[act]}</span>
              </div>
              <div className="flex gap-1">
                {CAMPAIGN_STAGES.filter((s) => s.act === act).map((stage) => {
                  const isCleared = stage.stage < run.stage;
                  const isCurrent = stage.stage === run.stage;
                  const protocol = stage.protocolId ? BOSS_PROTOCOLS.find((p) => p.id === stage.protocolId) : null;
                  const rewardCard = PLAYER_CARDS.find((c) => c.id === stage.rewardCardId);
                  const style = protocol
                    ? { border: 'border-danger/70', bg: 'bg-danger/10', text: 'text-danger' }
                    : RARITY_STYLE[rewardCard?.rarity || 'common'];
                  return (
                    <div
                      key={stage.stage}
                      className={`relative w-6 h-6 rounded-md border flex items-center justify-center ${style.border} ${
                        isCurrent
                          ? `${style.bg} ring-2 ring-player ring-offset-1 ring-offset-panel`
                          : isCleared
                          ? 'bg-panel-2/60 opacity-45'
                          : `${style.bg} opacity-80`
                      }`}
                    >
                      {isCleared ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <CardIcon
                          name={protocol ? protocol.iconName : rewardCard?.iconName || 'HelpCircle'}
                          className={`w-3 h-3 ${style.text}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Act-grouped roadmap */}
      <div className={`relative z-10 max-h-[45vh] overflow-y-auto pr-1 space-y-6 ${isPhone ? 'hidden' : ''}`}>
        {acts.map((act) => {
          const stagesInAct = CAMPAIGN_STAGES.filter((s) => s.act === act);
          return (
            <div key={act}>
              <div className="font-mono text-[10px] font-black uppercase tracking-[0.25em] text-text-muted mb-2 pb-1 border-b border-line/60">
                {t('runMap.actShort', { n: act })} <span className="text-player">— {ACT_NAMES[act]}</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {stagesInAct.map((stage) => {
                  const isCleared = stage.stage < run.stage;
                  const isCurrent = stage.stage === run.stage;
                  const isLocked = !isCleared && !isCurrent;
                  const protocol = stage.protocolId ? BOSS_PROTOCOLS.find((p) => p.id === stage.protocolId) : null;
                  const rewardCard = PLAYER_CARDS.find((c) => c.id === stage.rewardCardId);
                  const style = protocol
                    ? { border: 'border-danger/70', bg: 'bg-danger/10', text: 'text-danger' }
                    : RARITY_STYLE[rewardCard?.rarity || 'common'];
                  const stageText = getCampaignStageText(tBosses, stage);
                  const protocolName = protocol ? getProtocolText(tBosses, protocol).name : undefined;
                  const rewardCardName = rewardCard ? getCardText(tCards, rewardCard).name : undefined;

                  return (
                    <div
                      key={stage.stage}
                      className={`relative w-[104px] sm:w-[116px] rounded-xl border-2 p-2.5 flex flex-col items-center text-center transition-all ${
                        style.border
                      } ${
                        isCurrent
                          ? `${style.bg} scale-105 shadow-[0_0_20px_currentColor] ${style.text}`
                          : isCleared
                          ? 'bg-panel-2/60 opacity-55 grayscale-[0.3]'
                          : `${style.bg} opacity-90`
                      }`}
                      title={protocol ? `${stageText.bossName} — ${protocolName}` : `${stageText.bossName} plays ${rewardCardName}`}
                    >
                      {isCleared && (
                        <CheckCircle2 className="absolute -top-2 -right-2 w-5 h-5 text-success bg-ink rounded-full" />
                      )}
                      {isLocked && (
                        <Lock className="absolute -top-2 -right-2 w-4 h-4 text-text-muted bg-ink rounded-full p-0.5" />
                      )}
                      {isCurrent && (
                        <div
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-ink flex items-center justify-center"
                          style={{ boxShadow: `0 0 8px ${protocol ? 'var(--danger)' : 'var(--player)'}` }}
                        >
                          <span className={`w-2 h-2 rounded-full animate-pulse ${protocol ? 'bg-danger' : 'bg-player'}`} />
                        </div>
                      )}

                      <span className="font-mono text-[8px] text-text-muted font-bold mb-1">#{stage.stage}</span>

                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center mb-1.5 border ${style.border} ${style.bg}`}
                      >
                        <CardIcon
                          name={protocol ? protocol.iconName : rewardCard?.iconName || 'HelpCircle'}
                          className={`w-4 h-4 ${style.text}`}
                        />
                      </div>

                      <span className="font-display text-[10px] font-black text-text uppercase leading-tight truncate w-full">
                        {stageText.bossName}
                      </span>
                      <span className={`font-mono text-[8px] uppercase mt-0.5 truncate w-full ${style.text}`}>
                        {protocol ? protocolName : rewardCardName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {run.stage > CAMPAIGN_STAGES.length && (
        <div className={`relative z-10 bg-panel-2 border-2 border-rarity-legendary/60 rounded-xl text-center shadow-[0_0_30px_var(--rarity-legendary)]/30 ${isPhone ? 'mt-2 p-2' : 'mt-6 p-6'}`}>
          <Trophy className="w-8 h-8 text-rarity-legendary mx-auto mb-2" />
          <h3 className="font-display text-xl font-black text-rarity-legendary uppercase tracking-wider">{t('runMap.campaignComplete')}</h3>
          <p className="text-text-muted text-sm mt-1">{t('runMap.campaignCompleteHint')}</p>
        </div>
      )}
    </div>
  );
};
