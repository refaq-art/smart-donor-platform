import { z } from 'zod';

export const GAME_MODES = [
  'QUICK_PLAY',
  'CLASSIC',
  'TIME_ATTACK',
  'ELIMINATION',
  'TEAM_BATTLE',
  'CHALLENGE',
  'PARTY',
  'ONLINE_ROOM',
  'LOCAL_MULTIPLAYER',
] as const;

export const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'] as const;

export const localPlayerSchema = z.object({
  displayName: z.string().trim().min(1).max(30),
  avatarEmoji: z.string().optional(),
  avatarColor: z.string().optional(),
  teamKey: z.enum(['A', 'B']).optional(),
});

export const startSoloGameSchema = z.object({
  mode: z.enum(GAME_MODES),
  format: z.enum(['SOLO', 'LOCAL']),
  categoryIds: z.array(z.string()).min(1, 'اختر تصنيفًا واحدًا على الأقل'),
  difficulty: z.enum(DIFFICULTIES).nullable().optional(),
  questionCount: z.number().int().min(3).max(50).optional(),
  localPlayers: z.array(localPlayerSchema).max(8).optional(),
});

export const submitAnswerSchema = z.object({
  sessionId: z.string(),
  roundNumber: z.number().int().positive(),
  selectedAnswerIds: z.array(z.string()).optional(),
  orderedAnswerIds: z.array(z.string()).optional(),
  textAnswer: z.string().max(200).optional(),
});
