export interface RoomPlayerView {
  playerId: string;
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
  isHost: boolean;
  isReady: boolean;
  status: 'CONNECTED' | 'DISCONNECTED' | 'LEFT';
  teamKey: 'A' | 'B' | null;
}

export interface RoomView {
  id: string;
  code: string;
  status: 'LOBBY' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';
  mode: string;
  categoryIds: string[];
  difficulty: string | null;
  questionCount: number;
  timePerQuestionSeconds: number;
  teamsEnabled: boolean;
  maxPlayers: number;
  hostPlayerId: string;
  players: RoomPlayerView[];
  gameId: string | null;
}
