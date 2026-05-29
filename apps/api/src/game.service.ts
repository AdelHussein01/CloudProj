import { Injectable } from "@nestjs/common";
import {
  CreateRoomPayload,
  GameRoom,
  GameType,
  JoinRoomPayload,
  Mark,
  RoomSnapshot,
  RpsMove,
  XoMovePayload,
  RpsMovePayload
} from "./types";

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

@Injectable()
export class GameService {
  private readonly rooms = new Map<string, GameRoom>();

  createRoom(socketId: string, payload: CreateRoomPayload): RoomSnapshot {
    const gameType = this.assertGameType(payload.gameType);
    const code = this.normalizeRoomCode(payload.roomCode) ?? this.generateRoomCode();
    const hostName = this.normalizeName(payload.playerName, "Host");

    const existingRoom = this.rooms.get(code);
    const reconnectingHost = existingRoom?.players.find((player) => !player.connected && player.name === hostName);
    if (existingRoom && reconnectingHost) {
      this.replacePlayerSocket(existingRoom, reconnectingHost.id, socketId);
      reconnectingHost.connected = true;
      return this.touchAndSnapshot(existingRoom);
    }

    if (existingRoom) {
      throw new Error("Room already exists. Create a new link and try again.");
    }

    const now = new Date().toISOString();
    const room: GameRoom = {
      code,
      gameType,
      status: "waiting",
      players: [
        {
          id: socketId,
          name: hostName,
          mark: "X",
          connected: true
        }
      ],
      createdAt: now,
      updatedAt: now,
      xo:
        gameType === "xo"
          ? {
              board: Array.from({ length: 9 }, () => null),
              turn: "X",
              winner: null,
              winningLine: null
            }
          : undefined,
      rps:
        gameType === "rps"
          ? {
              round: 1,
              moves: {},
              scores: {},
              reveal: null
            }
          : undefined
    };

    if (room.rps) {
      room.rps.scores[socketId] = 0;
    }

    this.rooms.set(code, room);
    return this.snapshot(room);
  }

  joinRoom(socketId: string, payload: JoinRoomPayload): RoomSnapshot {
    const room = this.getExistingRoom(payload.roomCode);
    const existingPlayer = room.players.find((player) => player.id === socketId);
    const playerName = this.normalizeName(payload.playerName, "Player 2");
    const reconnectingPlayer = room.players.find((player) => !player.connected && player.name === playerName);

    if (existingPlayer) {
      existingPlayer.connected = true;
      return this.touchAndSnapshot(room);
    }

    if (reconnectingPlayer) {
      this.replacePlayerSocket(room, reconnectingPlayer.id, socketId);
      reconnectingPlayer.connected = true;
      return this.touchAndSnapshot(room);
    }

    if (room.players.length >= 2) {
      throw new Error("This room already has two players.");
    }

    room.players.push({
      id: socketId,
      name: playerName,
      mark: "O",
      connected: true
    });

    room.status = "playing";
    if (room.rps) {
      room.rps.scores[socketId] = 0;
    }

    return this.touchAndSnapshot(room);
  }

  getSnapshot(roomCode: string): RoomSnapshot {
    return this.snapshot(this.getExistingRoom(roomCode));
  }

  makeXoMove(socketId: string, payload: XoMovePayload): RoomSnapshot {
    const room = this.getExistingRoom(payload.roomCode);
    if (room.gameType !== "xo" || !room.xo) {
      throw new Error("This room is not an XO game.");
    }

    const player = this.getPlayer(room, socketId);
    if (room.status !== "playing") {
      throw new Error("Wait for the second player before making a move.");
    }
    if (room.xo.winner) {
      throw new Error("This XO round is already finished.");
    }
    if (player.mark !== room.xo.turn) {
      throw new Error("It is not your turn.");
    }
    if (!Number.isInteger(payload.cell) || payload.cell < 0 || payload.cell > 8) {
      throw new Error("Choose a valid XO cell.");
    }
    if (room.xo.board[payload.cell]) {
      throw new Error("That cell is already taken.");
    }

    room.xo.board[payload.cell] = player.mark;
    const result = this.calculateXoWinner(room.xo.board);
    room.xo.winner = result.winner;
    room.xo.winningLine = result.winningLine;
    room.xo.turn = player.mark === "X" ? "O" : "X";

    if (room.xo.winner) {
      room.status = "finished";
    }

    return this.touchAndSnapshot(room);
  }

  makeRpsMove(socketId: string, payload: RpsMovePayload): RoomSnapshot {
    const room = this.getExistingRoom(payload.roomCode);
    if (room.gameType !== "rps" || !room.rps) {
      throw new Error("This room is not a rock-paper-scissors game.");
    }
    if (room.status !== "playing") {
      throw new Error("Wait for the second player before choosing.");
    }

    this.getPlayer(room, socketId);
    const move = this.assertRpsMove(payload.move);
    room.rps.moves[socketId] = move;

    if (room.players.every((player) => room.rps?.moves[player.id])) {
      const [first, second] = room.players;
      const firstMove = room.rps.moves[first.id];
      const secondMove = room.rps.moves[second.id];
      const winnerId = this.resolveRpsWinner(first.id, firstMove, second.id, secondMove);

      if (winnerId !== "draw") {
        room.rps.scores[winnerId] = (room.rps.scores[winnerId] ?? 0) + 1;
      }

      room.rps.reveal = {
        round: room.rps.round,
        winnerId,
        moves: {
          [first.id]: firstMove,
          [second.id]: secondMove
        }
      };
    }

    return this.touchAndSnapshot(room);
  }

  nextRpsRound(socketId: string, roomCode: string): RoomSnapshot {
    const room = this.getExistingRoom(roomCode);
    if (room.gameType !== "rps" || !room.rps) {
      throw new Error("This room is not a rock-paper-scissors game.");
    }
    this.getPlayer(room, socketId);

    room.rps.round += 1;
    room.rps.moves = {};
    room.rps.reveal = null;
    room.status = "playing";

    return this.touchAndSnapshot(room);
  }

  resetRoom(socketId: string, roomCode: string): RoomSnapshot {
    const room = this.getExistingRoom(roomCode);
    this.getPlayer(room, socketId);

    room.status = room.players.length === 2 ? "playing" : "waiting";

    if (room.gameType === "xo") {
      room.xo = {
        board: Array.from({ length: 9 }, () => null),
        turn: "X",
        winner: null,
        winningLine: null
      };
    }

    if (room.gameType === "rps") {
      room.rps = {
        round: 1,
        moves: {},
        scores: Object.fromEntries(room.players.map((player) => [player.id, 0])),
        reveal: null
      };
    }

    return this.touchAndSnapshot(room);
  }

  disconnect(socketId: string): string[] {
    const affectedRooms: string[] = [];

    for (const room of this.rooms.values()) {
      const player = room.players.find((current) => current.id === socketId);
      if (!player) {
        continue;
      }

      player.connected = false;
      room.updatedAt = new Date().toISOString();
      affectedRooms.push(room.code);
    }

    return affectedRooms;
  }

  private snapshot(room: GameRoom): RoomSnapshot {
    return {
      code: room.code,
      gameType: room.gameType,
      status: room.status,
      players: room.players,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      xo: room.xo,
      rps: room.rps
        ? {
            round: room.rps.round,
            scores: room.rps.scores,
            locked: Object.fromEntries(room.players.map((player) => [player.id, Boolean(room.rps?.moves[player.id])])),
            reveal: room.rps.reveal
          }
        : undefined
    };
  }

  private touchAndSnapshot(room: GameRoom): RoomSnapshot {
    room.updatedAt = new Date().toISOString();
    return this.snapshot(room);
  }

  private getExistingRoom(roomCode: string): GameRoom {
    const code = this.normalizeRoomCode(roomCode);
    if (!code) {
      throw new Error("Room code is required.");
    }

    const room = this.rooms.get(code);
    if (!room) {
      throw new Error("Room not found. Ask the host to create the link again.");
    }

    return room;
  }

  private getPlayer(room: GameRoom, socketId: string) {
    const player = room.players.find((current) => current.id === socketId);
    if (!player) {
      throw new Error("You are not a player in this room.");
    }
    return player;
  }

  private calculateXoWinner(board: Array<Mark | null>): { winner: Mark | "draw" | null; winningLine: number[] | null } {
    for (const line of WINNING_LINES) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], winningLine: line };
      }
    }

    if (board.every(Boolean)) {
      return { winner: "draw", winningLine: null };
    }

    return { winner: null, winningLine: null };
  }

  private resolveRpsWinner(firstId: string, firstMove: RpsMove, secondId: string, secondMove: RpsMove): string | "draw" {
    if (firstMove === secondMove) {
      return "draw";
    }

    const firstWins =
      (firstMove === "rock" && secondMove === "scissors") ||
      (firstMove === "paper" && secondMove === "rock") ||
      (firstMove === "scissors" && secondMove === "paper");

    return firstWins ? firstId : secondId;
  }

  private assertGameType(gameType: string): GameType {
    if (gameType !== "xo" && gameType !== "rps") {
      throw new Error("Choose XO or rock-paper-scissors.");
    }
    return gameType;
  }

  private assertRpsMove(move: string): RpsMove {
    if (move !== "rock" && move !== "paper" && move !== "scissors") {
      throw new Error("Choose rock, paper, or scissors.");
    }
    return move;
  }

  private normalizeName(name: string | undefined, fallback: string): string {
    const cleanName = name?.trim().slice(0, 32);
    return cleanName || fallback;
  }

  private normalizeRoomCode(roomCode: string | undefined): string | undefined {
    const normalized = roomCode?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    return normalized || undefined;
  }

  private replacePlayerSocket(room: GameRoom, oldSocketId: string, newSocketId: string) {
    const player = room.players.find((current) => current.id === oldSocketId);
    if (!player) {
      return;
    }

    player.id = newSocketId;

    if (room.rps) {
      room.rps.scores[newSocketId] = room.rps.scores[oldSocketId] ?? 0;
      delete room.rps.scores[oldSocketId];

      if (room.rps.moves[oldSocketId]) {
        room.rps.moves[newSocketId] = room.rps.moves[oldSocketId];
        delete room.rps.moves[oldSocketId];
      }
    }
  }

  private generateRoomCode(): string {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    do {
      code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
    } while (this.rooms.has(code));
    return code;
  }
}
