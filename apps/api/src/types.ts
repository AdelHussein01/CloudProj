export type GameType = "xo" | "rps";
export type Mark = "X" | "O";
export type RpsMove = "rock" | "paper" | "scissors";
export type RoomStatus = "waiting" | "playing" | "finished";

export interface Player {
  id: string;
  name: string;
  mark: Mark;
  connected: boolean;
}

export interface XoState {
  board: Array<Mark | null>;
  turn: Mark;
  winner: Mark | "draw" | null;
  winningLine: number[] | null;
}

export interface RpsReveal {
  round: number;
  winnerId: string | "draw";
  moves: Record<string, RpsMove>;
}

export interface RpsState {
  round: number;
  moves: Record<string, RpsMove>;
  scores: Record<string, number>;
  reveal: RpsReveal | null;
}

export interface GameRoom {
  code: string;
  gameType: GameType;
  status: RoomStatus;
  players: Player[];
  createdAt: string;
  updatedAt: string;
  xo?: XoState;
  rps?: RpsState;
}

export interface RoomSnapshot {
  code: string;
  gameType: GameType;
  status: RoomStatus;
  players: Player[];
  createdAt: string;
  updatedAt: string;
  xo?: XoState;
  rps?: {
    round: number;
    scores: Record<string, number>;
    locked: Record<string, boolean>;
    reveal: RpsReveal | null;
  };
}

export interface CreateRoomPayload {
  roomCode?: string;
  gameType: GameType;
  playerName: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
}

export interface XoMovePayload {
  roomCode: string;
  cell: number;
}

export interface RpsMovePayload {
  roomCode: string;
  move: RpsMove;
}
