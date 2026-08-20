import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ACHIEVEMENTS } from '../game/achievements';
import { useAchievementText } from '../hooks/useLocalizedText';
import { Swords, Skull, Coins, Zap, Layers, Cpu, ShieldCheck, Trophy, Sparkles, RotateCcw, HeartPulse, Award } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Swords,
  Skull,
  Coins,
  Zap,
  Layers,
  Cpu,
  ShieldCheck,
  Trophy,
  Sparkles,
  RotateCcw,
  HeartPulse,
};

interface AchievementToastProps {
  achievementId: string | null;
}

// Portaled to document.body from App.tsx, one corner popup at a time — App.tsx owns the queue
// (multiple achievements can unlock in the same instant, e.g. clearing the whole campaign) and
// just hands this component whichever id is currently showing.
export const AchievementToast: React.FC<AchievementToastProps> = ({ achievementId }) => {
  const { t } = useTranslation('ui');
  const achievement = achievementId ? ACHIEVEMENTS.find((a) => a.id === achievementId) : null;
  const { name: achievementName } = useAchievementText(achievement ?? { id: '', name: '', description: '' });
  const IconComp = (achievement && ICON_MAP[achievement.icon]) || Award;

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-[70] pointer-events-none">
      <AnimatePresence>
        {achievement && (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            className="w-[230px] sm:w-[280px] rounded-xl border-2 border-player bg-ink-2/95 backdrop-blur-md shadow-[0_0_35px_rgba(0,229,255,0.5)] p-3 flex items-center gap-3"
          >
            <motion.div
              animate={{ boxShadow: ['0 0 10px 1px rgba(0,229,255,0.4)', '0 0 20px 4px rgba(0,229,255,0.75)', '0 0 10px 1px rgba(0,229,255,0.4)'] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-player/15 border border-player flex items-center justify-center shrink-0"
            >
              <IconComp className="w-5 h-5 sm:w-6 sm:h-6 text-player" />
            </motion.div>
            <div className="min-w-0">
              <div className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.15em] text-player/80 font-bold">
                {t('toasts.achievementUnlocked')}
              </div>
              <div className="font-display text-[11px] sm:text-xs font-black text-text uppercase tracking-wide truncate">
                {achievementName}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
