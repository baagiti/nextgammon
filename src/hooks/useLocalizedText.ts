import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Card, OpponentCard, BossProtocol, CampaignStage } from '../types';
import { Achievement } from '../game/achievements';

// Every getter/hook below reads from a locale file (see src/locales/<lang>/*.json) but always
// falls back to the English text already baked into the data file itself (card.name, boss.quote,
// etc.) via i18next's `defaultValue`. That means a language with no translation yet for a given
// id/field never renders blank or throws — it silently reads as English until that entry is
// translated.
//
// Two shapes are exported for each category:
//  - `useXText(item)` — a hook, for a single item rendered directly in a component body.
//  - `getXText(t, item)` — a plain function taking a `t` from one top-level `useTranslation()`
//    call — required inside `.map()` loops, since hooks can't be called per-iteration.

export function getCardText(t: TFunction, card: Pick<Card, 'id' | 'name' | 'tagline' | 'description'>) {
  return {
    name: t(`${card.id}.name`, { defaultValue: card.name }),
    tagline: t(`${card.id}.tagline`, { defaultValue: card.tagline }),
    description: t(`${card.id}.description`, { defaultValue: card.description }),
  };
}
export function useCardText(card: Pick<Card, 'id' | 'name' | 'tagline' | 'description'>) {
  const { t } = useTranslation('cards');
  return getCardText(t, card);
}

export function getAchievementText(t: TFunction, achievement: Pick<Achievement, 'id' | 'name' | 'description'>) {
  return {
    name: t(`${achievement.id}.name`, { defaultValue: achievement.name }),
    description: t(`${achievement.id}.description`, { defaultValue: achievement.description }),
  };
}
export function useAchievementText(achievement: Pick<Achievement, 'id' | 'name' | 'description'>) {
  const { t } = useTranslation('achievements');
  return getAchievementText(t, achievement);
}

// Quick-match opponents (src/game/cardsData.ts OPPONENT_BOSSES) — bosses:quickMatch.<id>
export function getOpponentBossText(t: TFunction, boss: Pick<OpponentCard, 'id' | 'bossName' | 'bossTitle' | 'quote'>) {
  return {
    bossName: t(`quickMatch.${boss.id}.bossName`, { defaultValue: boss.bossName }),
    bossTitle: t(`quickMatch.${boss.id}.bossTitle`, { defaultValue: boss.bossTitle }),
    quote: t(`quickMatch.${boss.id}.quote`, { defaultValue: boss.quote }),
  };
}
export function useOpponentBossText(boss: Pick<OpponentCard, 'id' | 'bossName' | 'bossTitle' | 'quote'>) {
  const { t } = useTranslation('bosses');
  return getOpponentBossText(t, boss);
}

// The `currentOpponent` state in App.tsx holds an OpponentCard-shaped object regardless of source:
// a real quick-match OPPONENT_BOSSES entry (bosses:quickMatch.<id>), OR — for campaign runs — a
// synthetic one App.tsx builds on the fly from a CampaignStage with id `stage_<n>` (bosses:campaign.<n>).
// Components that just render `currentOpponent` (OpponentHeader, BossIntroOverlay, the match-over
// overlay) don't know or care which source it came from, so this picks the right namespace for them.
export function getOpponentDisplayText(t: TFunction, opponent: Pick<OpponentCard, 'id' | 'bossName' | 'bossTitle' | 'quote'>) {
  const stageMatch = /^stage_(\d+)$/.exec(opponent.id);
  const key = stageMatch ? `campaign.${stageMatch[1]}` : `quickMatch.${opponent.id}`;
  return {
    bossName: t(`${key}.bossName`, { defaultValue: opponent.bossName }),
    bossTitle: t(`${key}.bossTitle`, { defaultValue: opponent.bossTitle }),
    quote: t(`${key}.quote`, { defaultValue: opponent.quote }),
  };
}
export function useOpponentDisplayText(opponent: Pick<OpponentCard, 'id' | 'bossName' | 'bossTitle' | 'quote'>) {
  const { t } = useTranslation('bosses');
  return getOpponentDisplayText(t, opponent);
}

// Campaign stage bosses (src/game/campaignData.ts CAMPAIGN_STAGES) — bosses:campaign.<stage>
export function getCampaignStageText(t: TFunction, stage: Pick<CampaignStage, 'stage' | 'bossName' | 'bossTitle' | 'quote'>) {
  return {
    bossName: t(`campaign.${stage.stage}.bossName`, { defaultValue: stage.bossName }),
    bossTitle: t(`campaign.${stage.stage}.bossTitle`, { defaultValue: stage.bossTitle }),
    quote: t(`campaign.${stage.stage}.quote`, { defaultValue: stage.quote }),
  };
}
export function useCampaignStageText(stage: Pick<CampaignStage, 'stage' | 'bossName' | 'bossTitle' | 'quote'>) {
  const { t } = useTranslation('bosses');
  return getCampaignStageText(t, stage);
}

// Boss protocols (src/game/campaignData.ts BOSS_PROTOCOLS) — bosses:protocols.<id>
export function getProtocolText(t: TFunction, protocol: Pick<BossProtocol, 'id' | 'name' | 'description' | 'taunt'>) {
  return {
    name: t(`protocols.${protocol.id}.name`, { defaultValue: protocol.name }),
    description: t(`protocols.${protocol.id}.description`, { defaultValue: protocol.description }),
    taunt: t(`protocols.${protocol.id}.taunt`, { defaultValue: protocol.taunt }),
  };
}
export function useProtocolText(protocol: Pick<BossProtocol, 'id' | 'name' | 'description' | 'taunt'>) {
  const { t } = useTranslation('bosses');
  return getProtocolText(t, protocol);
}
