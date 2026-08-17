import { MetaData } from '../types';
import { PLAYER_CARDS } from './cardsData';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  category: 'combat' | 'currency' | 'quickmatch' | 'campaign' | 'collection' | 'resilience';
  check: (meta: MetaData) => boolean;
}

// Cards boss-exclusive to a specific run-mode fight never appear in a 1v1 quick-match draft pool
// (see handleStartQuickMatch), so "play every card in 1v1" only counts the ones actually reachable there.
const QUICK_MATCH_DRAFTABLE_COUNT = PLAYER_CARDS.filter((c) => !c.exclusiveToBoss).length;

// Platform-agnostic achievement definitions — this list and its unlock conditions are the single
// source of truth. Game Center (iOS) and Steamworks (future desktop build) each get a thin sync
// layer on top of `MetaData.unlockedAchievements`, not a second copy of this logic.
export const ACHIEVEMENTS: Achievement[] = [
  // ── Combat ──
  {
    id: 'ach_first_blood',
    name: 'FIRST BLOOD',
    description: 'Hit an opponent checker for the first time.',
    icon: 'Swords',
    category: 'combat',
    check: (m) => m.totalHits >= 1,
  },
  {
    id: 'ach_grid_breaker',
    name: 'GRID BREAKER',
    description: 'Land 50 hits on opponent checkers, lifetime.',
    icon: 'Swords',
    category: 'combat',
    check: (m) => m.totalHits >= 50,
  },
  {
    id: 'ach_demolition_expert',
    name: 'DEMOLITION EXPERT',
    description: 'Land 200 hits on opponent checkers, lifetime.',
    icon: 'Swords',
    category: 'combat',
    check: (m) => m.totalHits >= 200,
  },
  {
    id: 'ach_system_purge',
    name: 'SYSTEM PURGE',
    description: 'Mars the opponent — win a match with the CPU bearing off zero checkers.',
    icon: 'Skull',
    category: 'combat',
    check: (m) => m.totalGammonWins >= 1,
  },

  // ── Currency ──
  {
    id: 'ach_first_payday',
    name: 'FIRST PAYDAY',
    description: 'Earn your first Neon Chips.',
    icon: 'Coins',
    category: 'currency',
    check: (m) => m.totalLifetimeChips >= 1,
  },
  {
    id: 'ach_chip_stacker',
    name: 'CHIP STACKER',
    description: 'Earn 10,000 Neon Chips, lifetime.',
    icon: 'Coins',
    category: 'currency',
    check: (m) => m.totalLifetimeChips >= 10000,
  },
  {
    id: 'ach_data_baron',
    name: 'DATA BARON',
    description: 'Earn 100,000 Neon Chips, lifetime.',
    icon: 'Coins',
    category: 'currency',
    check: (m) => m.totalLifetimeChips >= 100000,
  },
  {
    id: 'ach_neon_tycoon',
    name: 'NEON TYCOON',
    description: 'Earn 1,000,000 Neon Chips, lifetime.',
    icon: 'Coins',
    category: 'currency',
    check: (m) => m.totalLifetimeChips >= 1000000,
  },

  // ── Quick match ──
  {
    id: 'ach_street_runner',
    name: 'STREET RUNNER',
    description: 'Win your first 1v1 quick match.',
    icon: 'Zap',
    category: 'quickmatch',
    check: (m) => m.totalQuickMatchWins >= 1,
  },
  {
    id: 'ach_glitch9_slayer',
    name: 'GLITCH-9 SLAYER',
    description: 'Win 10 1v1 quick matches.',
    icon: 'Zap',
    category: 'quickmatch',
    check: (m) => m.totalQuickMatchWins >= 10,
  },
  {
    id: 'ach_street_legend',
    name: 'STREET LEGEND',
    description: 'Win 100 1v1 quick matches.',
    icon: 'Zap',
    category: 'quickmatch',
    check: (m) => m.totalQuickMatchWins >= 100,
  },
  {
    id: 'ach_full_loadout',
    name: 'FULL LOADOUT',
    description: 'Equip every draftable card at least once in 1v1 quick matches.',
    icon: 'Layers',
    category: 'quickmatch',
    check: (m) => m.cardsPlayedQuickMatch.length >= QUICK_MATCH_DRAFTABLE_COUNT,
  },

  // ── Campaign ──
  {
    id: 'ach_ghost_in_shell',
    name: 'GHOST IN THE SHELL',
    description: 'Clear your first campaign stage.',
    icon: 'Cpu',
    category: 'campaign',
    check: (m) => m.highestStage >= 2,
  },
  {
    id: 'ach_act1_boot_sector',
    name: 'BOOT SECTOR CLEARED',
    description: 'Defeat BOLLARD and clear Act 1: Boot Sector.',
    icon: 'ShieldCheck',
    category: 'campaign',
    check: (m) => m.highestStage >= 6,
  },
  {
    id: 'ach_act2_street_level',
    name: 'STREET LEVEL CLEARED',
    description: 'Defeat GHOSTGATE and clear Act 2: Street Level.',
    icon: 'ShieldCheck',
    category: 'campaign',
    check: (m) => m.highestStage >= 13,
  },
  {
    id: 'ach_act3_the_grid',
    name: 'THE GRID CLEARED',
    description: 'Defeat SENTINEL WALL and clear Act 3: The Grid.',
    icon: 'ShieldCheck',
    category: 'campaign',
    check: (m) => m.highestStage >= 20,
  },
  {
    id: 'ach_act4_deep_net',
    name: 'DEEP NET CLEARED',
    description: 'Defeat MIRROR CORE and clear Act 4: Deep Net.',
    icon: 'ShieldCheck',
    category: 'campaign',
    check: (m) => m.highestStage >= 27,
  },
  {
    id: 'ach_act5_black_market',
    name: 'BLACK MARKET CLEARED',
    description: 'Defeat SIEGE ENGINE and clear Act 5: Black Market.',
    icon: 'ShieldCheck',
    category: 'campaign',
    check: (m) => m.highestStage >= 34,
  },
  {
    id: 'ach_act6_core_breach',
    name: 'CORE BREACH CLEARED',
    description: 'Defeat NULL SECTOR and clear Act 6: Core Breach.',
    icon: 'ShieldCheck',
    category: 'campaign',
    check: (m) => m.highestStage >= 40,
  },
  {
    id: 'ach_act7_singularity',
    name: 'SINGULARITY CLEARED',
    description: 'Defeat OMEGA CORE and clear Act 7: Singularity.',
    icon: 'Trophy',
    category: 'campaign',
    check: (m) => m.highestStage >= 44,
  },
  {
    id: 'ach_campaign_complete',
    name: 'RUN COMPLETE',
    description: 'Finish the entire 44-stage campaign.',
    icon: 'Trophy',
    category: 'campaign',
    check: (m) => m.totalRunsCompleted >= 1,
  },
  {
    id: 'ach_flawless_run',
    name: 'FLAWLESS EXECUTION',
    description: 'Finish the campaign without losing a single stage along the way.',
    icon: 'Sparkles',
    category: 'campaign',
    check: (m) => m.totalFlawlessRunCompletions >= 1,
  },

  // ── Collection ──
  {
    id: 'ach_collector',
    name: 'COLLECTOR',
    description: 'Unlock 25 of the 45 cards.',
    icon: 'Layers',
    category: 'collection',
    check: (m) => m.unlockedCards.length >= 25,
  },
  {
    id: 'ach_full_deck',
    name: 'FULL DECK',
    description: 'Unlock all 45 cards.',
    icon: 'Layers',
    category: 'collection',
    check: (m) => m.unlockedCards.length >= 45,
  },

  // ── Resilience ──
  {
    id: 'ach_no_surrender',
    name: 'NO SURRENDER',
    description: 'Retry the same stage 10 times in a row without abandoning the run.',
    icon: 'RotateCcw',
    category: 'resilience',
    check: (m) => m.maxConsecutiveLossesEver >= 10,
  },
  {
    id: 'ach_comeback_kid',
    name: 'COMEBACK KID',
    description: 'Win a run-mode stage after a boss has already captured one of your cards.',
    icon: 'HeartPulse',
    category: 'resilience',
    check: (m) => m.totalComebackWins >= 1,
  },
];

// Returns the ids of achievements that are newly satisfied by `meta` — i.e. their condition is
// true but they're not already in meta.unlockedAchievements. Call after any stat-changing update,
// pass the MERGED (already-updated) meta, and append the result to unlockedAchievements yourself.
export function evaluateAchievements(meta: MetaData): string[] {
  return ACHIEVEMENTS.filter((a) => a.check(meta) && !meta.unlockedAchievements.includes(a.id)).map((a) => a.id);
}
