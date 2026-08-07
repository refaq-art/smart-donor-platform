import type { GameMode, GameModeConfig } from './types';

export const GAME_MODE_CONFIGS: Record<GameMode, GameModeConfig> = {
  QUICK_PLAY: {
    mode: 'QUICK_PLAY',
    questionCount: 5,
    negativeScoring: false,
    adaptiveDifficulty: false,
    teamsEnabled: false,
    eliminationEnabled: false,
    timerMultiplier: 0.75,
  },
  CLASSIC: {
    mode: 'CLASSIC',
    questionCount: 10,
    negativeScoring: false,
    adaptiveDifficulty: false,
    teamsEnabled: false,
    eliminationEnabled: false,
    timerMultiplier: 1,
  },
  TIME_ATTACK: {
    mode: 'TIME_ATTACK',
    questionCount: 20,
    negativeScoring: false,
    adaptiveDifficulty: false,
    teamsEnabled: false,
    eliminationEnabled: false,
    timerMultiplier: 0.5,
  },
  ELIMINATION: {
    mode: 'ELIMINATION',
    questionCount: 12,
    negativeScoring: true,
    adaptiveDifficulty: false,
    teamsEnabled: false,
    eliminationEnabled: true,
    timerMultiplier: 0.85,
  },
  TEAM_BATTLE: {
    mode: 'TEAM_BATTLE',
    questionCount: 10,
    negativeScoring: false,
    adaptiveDifficulty: false,
    teamsEnabled: true,
    eliminationEnabled: false,
    timerMultiplier: 1,
  },
  CHALLENGE: {
    mode: 'CHALLENGE',
    questionCount: 12,
    negativeScoring: true,
    adaptiveDifficulty: true,
    teamsEnabled: false,
    eliminationEnabled: false,
    timerMultiplier: 0.9,
  },
  PARTY: {
    mode: 'PARTY',
    questionCount: 8,
    negativeScoring: false,
    adaptiveDifficulty: false,
    teamsEnabled: true,
    eliminationEnabled: false,
    timerMultiplier: 1.25,
  },
  ONLINE_ROOM: {
    mode: 'ONLINE_ROOM',
    questionCount: 10,
    negativeScoring: false,
    adaptiveDifficulty: false,
    teamsEnabled: false,
    eliminationEnabled: false,
    timerMultiplier: 1,
  },
  LOCAL_MULTIPLAYER: {
    mode: 'LOCAL_MULTIPLAYER',
    questionCount: 8,
    negativeScoring: false,
    adaptiveDifficulty: false,
    teamsEnabled: false,
    eliminationEnabled: false,
    timerMultiplier: 1.1,
  },
};

export function getModeConfig(mode: GameMode): GameModeConfig {
  return GAME_MODE_CONFIGS[mode];
}
