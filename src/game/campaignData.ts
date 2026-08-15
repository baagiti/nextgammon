import { BossProtocol, CampaignStage } from '../types';

// The card granted for free at the start of every campaign run — the simplest card in the game.
export const STARTER_CARD_ID = 'card_overclock';

// Seven bosses carry no card at all — they rewrite a rule instead. They cap each act and guard
// the strongest cards in the game (5 legendaries + the 2 strongest epics).
export const BOSS_PROTOCOLS: BossProtocol[] = [
  {
    id: 'fortified',
    name: 'FORTIFIED',
    description: "This boss's blots cannot be hit — every checker is treated as if guarded by a second one.",
    taunt: 'Strike all you like. My weakest checker is a wall.',
    iconName: 'ShieldCheck',
  },
  {
    id: 'phase_walk',
    name: 'PHASE WALK',
    description: 'This boss re-enters from the Bar ignoring your blocked points entirely.',
    taunt: "Your points mean nothing. I don't walk through doors.",
    iconName: 'Ghost',
  },
  {
    id: 'firewall',
    name: 'FIREWALL',
    description:
      "You cannot land normally on the boss's home board (points 19-24) — a checker there must clear the zone in a single leap. Bar re-entry is exempt.",
    taunt: "This is my perimeter. Cross it and you don't get to stay.",
    iconName: 'Flame',
  },
  {
    id: 'mirror_core',
    name: 'MIRROR CORE',
    description: 'The boss plays a live copy of your own equipped card against you.',
    taunt: 'Whatever you brought — I brought it too.',
    iconName: 'Copy',
  },
  {
    id: 'siege',
    name: 'SIEGE',
    description: 'The boss ignores Bar priority — it can move on-board checkers even while its own sit on the Bar.',
    taunt: "The Bar doesn't stop a siege.",
    iconName: 'Swords',
  },
  {
    id: 'null_sector',
    name: 'NULL SECTOR',
    description: 'Your equipped card is disabled for the entire match.',
    taunt: "Whatever you brought, it's already deleted.",
    iconName: 'Ban',
  },
  {
    id: 'omega_protocol',
    name: 'OMEGA PROTOCOL',
    description:
      "FORTIFIED and NULL SECTOR active at once — the boss's blots can't be hit, and your card does nothing.",
    taunt: 'I AM NEXTGAMMON. YOUR CARD IS ALREADY GONE. ALL PATHS TERMINATE HERE.',
    iconName: 'Skull',
  },
];

const ACT_COLORS = ['#00f0ff', '#22d3ee', '#a855f7', '#22c55e', '#eab308', '#f97316', '#ef4444'];

function cardBoss(
  stage: number,
  act: number,
  cardId: string,
  bossName: string,
  bossTitle: string,
  quote: string,
  avatarSeed: string
): CampaignStage {
  return {
    stage,
    act,
    kind: 'card',
    bossName,
    bossTitle,
    quote,
    accentColor: ACT_COLORS[act - 1],
    avatarSeed,
    rewardCardId: cardId,
    cardId,
  };
}

function protocolBoss(
  stage: number,
  act: number,
  protocolId: string,
  rewardCardId: string,
  bossName: string,
  bossTitle: string,
  quote: string,
  avatarSeed: string
): CampaignStage {
  return {
    stage,
    act,
    kind: 'protocol',
    bossName,
    bossTitle,
    quote,
    accentColor: '#ef4444',
    avatarSeed,
    rewardCardId,
    protocolId,
  };
}

// 44 hand-authored stages: 37 card bosses (boss plays card X, you win card X) + 7 protocol bosses
// (no card — a rule-breaking protocol instead, guarding the 5 legendaries + 2 strongest epics).
export const CAMPAIGN_STAGES: CampaignStage[] = [
  // --- ACT 1: BOOT SECTOR (1-6) — 5 common card bosses + FORTIFIED ---
  cardBoss(1, 1, 'card_tailwind', 'SLIPSTREAM', 'Draft Runner', "Watch me pull ahead — gravity's just a suggestion.", 'slipstream'),
  cardBoss(2, 1, 'card_synchronize', 'TWINBIT', 'Parity Glitch', 'Two signals, one pulse. I never roll alone.', 'twinbit'),
  cardBoss(3, 1, 'card_six_tax', 'TAXMAN-6', 'Toll Daemon', 'Every six you roll, I collect the difference.', 'taxman6'),
  cardBoss(4, 1, 'card_open_circuit', 'SHORTCIRCUIT', 'Loose Wire', 'Leave a blot exposed and watch me surge.', 'shortcircuit'),
  cardBoss(5, 1, 'card_packet_drop', 'DROPOUT', 'Null Router', 'Why finish the roll when half of it is enough?', 'dropout'),
  protocolBoss(6, 1, 'fortified', 'card_bypass_protocol', 'BOLLARD', 'Street Barricade', 'Strike all you like. My weakest checker is a wall.', 'bollard'),

  // --- ACT 2: STREET LEVEL (7-13) — 4 common + 2 rare card bosses + PHASE WALK ---
  cardBoss(7, 2, 'card_cowards_tax', 'YELLOWBELT', 'Toll Collector', "Ducked the hit? That's a fine, not a favor.", 'yellowbelt'),
  cardBoss(8, 2, 'card_lost_packet', 'STATIC-LINE', 'Dead Signal', 'Miss your window and the connection charges you.', 'staticline'),
  cardBoss(9, 2, 'card_trailing_drag', 'ANCHOR-7', 'Drag Chain', 'Your slowest checker just got slower.', 'anchor7'),
  cardBoss(10, 2, 'card_failsafe', 'BACKUP-9', 'Redundant Node', 'Lock me out of the Bar and I come back stronger.', 'backup9'),
  cardBoss(11, 2, 'card_second_wind', 'REBOUND', 'Recoil Unit', "Hit me. I'll roll better for it.", 'rebound'),
  cardBoss(12, 2, 'card_counterstrike', 'RIPOSTE', 'Bar Sentinel', 'Enter and strike in the same breath.', 'riposte'),
  protocolBoss(13, 2, 'phase_walk', 'card_batch_upload', 'GHOSTGATE', 'Phase Runner', "Your points mean nothing. I don't walk through doors.", 'ghostgate'),

  // --- ACT 3: THE GRID (14-20) — 6 rare card bosses + FIREWALL ---
  cardBoss(14, 3, 'card_mirror_reflex', 'REFLECT-9', 'Glass Warden', 'Hit my blot and we both go down.', 'reflect9'),
  cardBoss(15, 3, 'card_shatter_blot', 'SHRAPNEL', 'Chain Breaker', 'One hit becomes two. Ask your neighbor.', 'shrapnel'),
  cardBoss(16, 3, 'card_blood_tax', 'LEECH.SYS', 'Toll Vampire', 'Every hit you land feeds my next roll.', 'leechsys'),
  cardBoss(17, 3, 'card_backlash', 'RECOIL-X', 'Kickback Node', 'Hit me and get pushed right back.', 'recoilx'),
  cardBoss(18, 3, 'card_blood_magnet', 'MAGNETRON', 'Iron Pull', 'Your exposed checker moves first. No exceptions.', 'magnetron'),
  cardBoss(19, 3, 'card_launchpad', 'IGNITION', 'Bar Booster', 'Every entry is a launch sequence.', 'ignition'),
  protocolBoss(20, 3, 'firewall', 'card_doubles_engine', 'SENTINEL WALL', 'Perimeter Guardian', "This is my perimeter. Cross it and you don't get to stay.", 'sentinelwall'),

  // --- ACT 4: DEEP NET (21-27) — 6 rare card bosses + MIRROR CORE ---
  cardBoss(21, 4, 'card_bar_static', 'JAMSIGNAL', 'Noise Floor', 'Two on the Bar? Enjoy the interference.', 'jamsignal'),
  cardBoss(22, 4, 'card_echo_jam', 'ECHOFORM', 'Loop Breaker', 'Play the same checker twice and hear it stutter.', 'echoform'),
  cardBoss(23, 4, 'card_forced_commit', 'LOCKSTEP', 'Commitment Daemon', 'Once you start a checker, you finish it.', 'lockstep'),
  cardBoss(24, 4, 'card_redundancy', 'FAILOVER', 'Backup Cycle', 'One good die, used twice. Efficiency.', 'failover'),
  cardBoss(25, 4, 'card_final_check', 'LASTLINE', 'Closer Protocol', "Your last checker doesn't get a shortcut.", 'lastline'),
  cardBoss(26, 4, 'card_courier', 'FASTLANE', 'Express Node', 'One checker, marked for delivery.', 'fastlane'),
  protocolBoss(27, 4, 'mirror_core', 'card_black_ice', 'MIRROR CORE', 'Reflection Engine', 'Whatever you brought — I brought it too.', 'mirrorcore'),

  // --- ACT 5: BLACK MARKET (28-34) — 4 rare + 2 epic card bosses + SIEGE ---
  cardBoss(28, 5, 'card_convergence', 'VORTEX-3', 'Gap Closer', 'Uneven dice offend me. I fix that.', 'vortex3'),
  cardBoss(29, 5, 'card_cold_reboot', 'CRYOCORE', 'Reset Daemon', 'Bad roll? I just start over.', 'cryocore'),
  cardBoss(30, 5, 'card_double_fault', 'FAULTLINE', 'Crack Runner', 'Your doubles just got cheaper.', 'faultline'),
  cardBoss(31, 5, 'card_deadweight', 'GRAVWELL', 'Ballast Unit', "I mark one of your own. It won't move the same again.", 'gravwell'),
  cardBoss(32, 5, 'card_magnetic_link', 'LINKCHAIN', 'Point Forger', 'Land behind my blot and watch it snap into place.', 'linkchain'),
  cardBoss(33, 5, 'card_repulsor', 'PUSHBACK', 'Field Emitter', "Try to build a point. I'll push it apart.", 'pushback'),
  protocolBoss(34, 5, 'siege', 'card_event_horizon', 'SIEGE ENGINE', 'Bar Breaker', "The Bar doesn't stop a siege.", 'siegeengine'),

  // --- ACT 6: CORE BREACH (35-40) — 5 epic card bosses + NULL SECTOR ---
  cardBoss(35, 6, 'card_double_tuner', 'RESONANCE', 'Frequency Smith', "A double isn't just one number. Let me tune it.", 'resonance'),
  cardBoss(36, 6, 'card_compression_field', 'GRAVITON', 'Field Compressor', "Extreme dice don't survive contact with me.", 'graviton'),
  cardBoss(37, 6, 'card_overvoltage_trip', 'SURGEBREAKER', 'Circuit Breaker', 'Roll too hot and the whole thing resets.', 'surgebreaker'),
  cardBoss(38, 6, 'card_double_tap', 'DOUBLETAP.EXE', 'Follow-Through', 'One hit invites another.', 'doubletapexe'),
  cardBoss(39, 6, 'card_deflection', 'RICOCHET', 'Angle Warden', 'Hit me and I simply step aside.', 'ricochet'),
  protocolBoss(40, 6, 'null_sector', 'card_compulsory_hit', 'NULL SECTOR', 'Deletion Node', "Whatever you brought, it's already deleted.", 'nullsector'),

  // --- ACT 7: SINGULARITY (41-44) — 3 epic card bosses + OMEGA PROTOCOL (final) ---
  cardBoss(41, 7, 'card_double_fracture', 'FRACTURE.SYS', 'Break Point', 'Hit me on doubles and lose a whole move.', 'fracturesys'),
  cardBoss(42, 7, 'card_home_security', 'GATEKEEPER', 'Home Warden', "Leave a blot in your own home. I'll lock the exit.", 'gatekeeper'),
  cardBoss(43, 7, 'card_exact_lock', 'PRECISION-0', 'The Exact Machine', 'No shortcuts home. Exact numbers only.', 'precision0'),
  protocolBoss(
    44,
    7,
    'omega_protocol',
    'card_termination_protocol',
    'OMEGA CORE',
    'Final Cyber God AI',
    'I AM NEXTGAMMON. YOUR CARD IS ALREADY GONE. ALL PATHS TERMINATE HERE.',
    'omegacore'
  ),
];
