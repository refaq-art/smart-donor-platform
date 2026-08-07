import { z } from 'zod';
import { GAME_MODES, DIFFICULTIES } from './game';

export const createRoomSchema = z.object({
  mode: z.enum(GAME_MODES).default('CLASSIC'),
  categoryIds: z.array(z.string()).min(1, 'اختر تصنيفًا واحدًا على الأقل'),
  difficulty: z.enum(DIFFICULTIES).nullable().optional(),
  questionCount: z.number().int().min(3).max(50).optional(),
  teamsEnabled: z.boolean().optional(),
  maxPlayers: z.number().int().min(2).max(20).optional(),
});

export const joinRoomSchema = z.object({
  code: z.string().trim().length(6, 'رمز الغرفة يتكون من 6 أحرف'),
});
