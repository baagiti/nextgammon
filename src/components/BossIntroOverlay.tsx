import React from 'react';
import { motion } from 'motion/react';
import { OpponentCard, BossProtocol } from '../types';
import { CardIcon } from './CardIcon';
import { useTranslation } from 'react-i18next';
import { useOpponentDisplayText, useProtocolText } from '../hooks/useLocalizedText';
import { Skull, Swords, Home } from 'lucide-react';

interface BossIntroOverlayProps {
  opponent: OpponentCard;
  protocol: BossProtocol | null;
  onEngage: () => void;
  // Portaled to document.body above PlatformFrame's own header — needs its own way out.
  onGoBack?: () => void;
}

export const BossIntroOverlay: React.FC<BossIntroOverlayProps> = ({ opponent, protocol, onEngage, onGoBack }) => {
  const { t } = useTranslation('ui');
  const { bossName, bossTitle } = useOpponentDisplayText(opponent);
  const { name: protocolName, description: protocolDescription, taunt: protocolTaunt } = useProtocolText(
    protocol ?? { id: '', name: '', description: '', taunt: '' }
  );
  return (
    <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
      {onGoBack && (
        <button
          onClick={onGoBack}
          className="fixed top-4 left-4 sm:top-6 sm:left-6 z-20 p-2 rounded-lg bg-panel border border-line hover:border-player text-text-muted hover:text-player transition-colors"
          title={t('common.returnToMenu')}
        >
          <Home className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}
      {/* Alarm scanline wash */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(255,32,32,0.15) 0px, rgba(255,32,32,0.15) 1px, transparent 1px, transparent 3px)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 max-w-2xl w-full flex flex-col items-center text-center"
      >
        {/* Glitching boss avatar */}
        <motion.div
          animate={{
            boxShadow: [
              '0 0 30px 4px rgba(255,32,32,0.5)',
              '0 0 55px 10px rgba(255,32,32,0.85)',
              '0 0 30px 4px rgba(255,32,32,0.5)',
            ],
          }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-2 border-danger bg-danger/10 flex items-center justify-center mb-4"
        >
          <Skull className="w-12 h-12 sm:w-16 sm:h-16 text-danger" />
        </motion.div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-danger/15 border border-danger/60 text-danger font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-3">
          <Swords className="w-3.5 h-3.5" />
          {t('bossIntro.encounter')}
        </div>

        <h1 className="font-display text-3xl sm:text-5xl font-black text-text uppercase tracking-wider mb-1">
          {bossName}
        </h1>
        <p className="text-danger/80 text-xs sm:text-sm font-mono uppercase tracking-widest mb-6">{bossTitle}</p>

        {/* Speech bubble with the boss's taunt */}
        {protocol && (
          <div className="relative max-w-lg mb-6">
            <div className="bg-ink-2/95 border-2 border-danger/60 rounded-2xl px-5 py-4 shadow-[0_0_30px_rgba(255,32,32,0.25)]">
              <p className="text-text text-sm sm:text-base italic leading-relaxed">"{protocolTaunt}"</p>
            </div>
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-0 h-0"
              style={{
                borderLeft: '14px solid transparent',
                borderRight: '14px solid transparent',
                borderTop: '14px solid var(--danger)',
                opacity: 0.6,
              }}
            />
          </div>
        )}

        {/* Protocol name + plain mechanical rule */}
        {protocol && (
          <div className="w-full bg-panel/80 border border-danger/40 rounded-2xl p-4 sm:p-5 mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CardIcon name={protocol.iconName} className="w-5 h-5 text-danger" />
              <span className="font-display font-black text-danger uppercase tracking-[0.15em] text-sm sm:text-base">
                {protocolName}
              </span>
            </div>
            <p className="text-text-muted text-xs sm:text-sm leading-relaxed">{protocolDescription}</p>
          </div>
        )}

        <button
          onClick={onEngage}
          className="w-full max-w-xs py-4 rounded-2xl bg-gradient-to-r from-danger via-red-600 to-danger text-white font-black text-base uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,32,32,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Swords className="w-5 h-5" />
          {t('bossIntro.engage')}
        </button>
      </motion.div>
    </div>
  );
};
