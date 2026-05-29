"use client";

import { Copy, Gamepad2, RefreshCcw, Scissors, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { gameLabel } from "../lib/room-code";
import type { GameType, Mark, RoomSnapshot, RpsMove } from "../lib/types";

interface RoomClientProps {
  roomCode: string;
}

type ServerEvents = {
  connected: (payload: { socketId: string }) => void;
  "room:update": (payload: RoomSnapshot) => void;
  "room:error": (payload: { message: string }) => void;
};

type ClientEvents = {
  "room:create": (payload: { roomCode: string; gameType: GameType; playerName: string }) => void;
  "room:join": (payload: { roomCode: string; playerName: string }) => void;
  "room:reset": (payload: { roomCode: string }) => void;
  "xo:move": (payload: { roomCode: string; cell: number }) => void;
  "rps:move": (payload: { roomCode: string; move: RpsMove }) => void;
  "rps:next": (payload: { roomCode: string }) => void;
};

export function RoomClient({ roomCode }: RoomClientProps) {
  const searchParams = useSearchParams();
  const isHost = searchParams.get("host") === "1";
  const selectedGame = searchParams.get("game") as GameType | null;
  const initialName = searchParams.get("name") ?? (isHost ? "Player 1" : "");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  const [socketId, setSocketId] = useState("");
  const [playerName, setPlayerName] = useState(initialName);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);
  const socketRef = useRef<Socket<ServerEvents, ClientEvents> | null>(null);
  const startedRef = useRef(false);

  const cleanRoomCode = useMemo(() => roomCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8), [roomCode]);
  const publicLink = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return `${window.location.origin}/room/${cleanRoomCode}`;
  }, [cleanRoomCode]);

  const me = snapshot?.players.find((player) => player.id === socketId);
  const opponent = snapshot?.players.find((player) => player.id !== socketId);
  const myTurn = snapshot?.gameType === "xo" && snapshot.xo?.turn === me?.mark && snapshot.status === "playing";

  useEffect(() => {
    const socket: Socket<ServerEvents, ClientEvents> = apiUrl
      ? io(`${apiUrl}/games`, { withCredentials: true })
      : io("/games", { withCredentials: true });

    socketRef.current = socket;
    socket.on("connected", ({ socketId: connectedSocketId }) => {
      setSocketId(connectedSocketId);

      if (startedRef.current) {
        return;
      }
      startedRef.current = true;

      if (isHost && selectedGame) {
        socket.emit("room:create", {
          roomCode: cleanRoomCode,
          gameType: selectedGame,
          playerName: initialName || "Player 1"
        });
      } else if (initialName) {
        socket.emit("room:join", {
          roomCode: cleanRoomCode,
          playerName: initialName
        });
      }
    });
    socket.on("room:update", (room) => {
      setError("");
      setSnapshot(room);
      setJoining(false);
    });
    socket.on("room:error", ({ message }) => {
      setError(message);
      setJoining(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [apiUrl, cleanRoomCode, initialName, isHost, selectedGame]);

  function joinRoom() {
    if (!playerName.trim() || !socketRef.current) {
      return;
    }
    setJoining(true);
    socketRef.current.emit("room:join", {
      roomCode: cleanRoomCode,
      playerName
    });
  }

  async function copyLink() {
    if (!publicLink) {
      return;
    }
    await navigator.clipboard.writeText(publicLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function playXo(cell: number) {
    socketRef.current?.emit("xo:move", { roomCode: cleanRoomCode, cell });
  }

  function playRps(move: RpsMove) {
    socketRef.current?.emit("rps:move", { roomCode: cleanRoomCode, move });
  }

  function resetRoom() {
    socketRef.current?.emit("room:reset", { roomCode: cleanRoomCode });
  }

  function nextRpsRound() {
    socketRef.current?.emit("rps:next", { roomCode: cleanRoomCode });
  }

  if (!snapshot && !isHost) {
    return (
      <main className="shell compact">
        <section className="room-card join-card">
          <p className="eyebrow">Room {cleanRoomCode}</p>
          <h1>Join the match</h1>
          <div className="field">
            <label htmlFor="joinName">Your name</label>
            <input
              id="joinName"
              maxLength={32}
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  joinRoom();
                }
              }}
            />
          </div>
          {error ? <p className="error">{error}</p> : null}
          <button className="primary-button" type="button" onClick={joinRoom} disabled={joining || !playerName.trim()}>
            <Users size={18} aria-hidden="true" />
            {joining ? "Joining..." : "Join room"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="shell compact">
      <section className="game-layout">
        <aside className="status-panel">
          <p className="eyebrow">Room {cleanRoomCode}</p>
          <h1>{snapshot ? gameLabel(snapshot.gameType) : "Starting room"}</h1>
          <div className="status-list">
            <StatusItem label="You" value={me ? `${me.name} (${me.mark})` : "Connecting"} />
            <StatusItem label="Opponent" value={opponent ? opponent.name : "Waiting"} />
            <StatusItem label="Status" value={snapshot?.status ?? "Connecting"} />
          </div>
          <div className="share-row">
            <input readOnly value={publicLink} aria-label="Share link" />
            <button type="button" className="icon-button" onClick={copyLink} title="Copy link" aria-label="Copy link">
              <Copy size={18} aria-hidden="true" />
            </button>
          </div>
          <p className="hint">{copied ? "Copied." : "Send this link to one player."}</p>
          {error ? <p className="error">{error}</p> : null}
          <button className="secondary-button" type="button" onClick={resetRoom} disabled={!snapshot || !me}>
            <RefreshCcw size={18} aria-hidden="true" />
            Reset
          </button>
        </aside>

        <section className="play-surface">
          {!snapshot ? <LoadingState /> : null}
          {snapshot?.gameType === "xo" ? (
            <XoBoard
              board={snapshot.xo?.board ?? []}
              meMark={me?.mark}
              myTurn={Boolean(myTurn)}
              winner={snapshot.xo?.winner ?? null}
              winningLine={snapshot.xo?.winningLine ?? null}
              onMove={playXo}
            />
          ) : null}
          {snapshot?.gameType === "rps" ? (
            <RpsBoard
              snapshot={snapshot}
              socketId={socketId}
              onMove={playRps}
              onNext={nextRpsRound}
            />
          ) : null}
        </section>
      </section>
    </main>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="loading-state">
      <Gamepad2 size={36} aria-hidden="true" />
      <p>Connecting...</p>
    </div>
  );
}

function XoBoard({
  board,
  meMark,
  myTurn,
  winner,
  winningLine,
  onMove
}: {
  board: Array<Mark | null>;
  meMark?: Mark;
  myTurn: boolean;
  winner: Mark | "draw" | null;
  winningLine: number[] | null;
  onMove: (cell: number) => void;
}) {
  const resultText = winner === "draw" ? "Draw" : winner ? `${winner} wins` : myTurn ? "Your turn" : "Waiting for move";

  return (
    <div className="xo-wrap">
      <div className="game-heading">
        <Gamepad2 size={22} aria-hidden="true" />
        <div>
          <p className="eyebrow">XO</p>
          <h2>{resultText}</h2>
        </div>
      </div>
      <div className="xo-board" role="grid" aria-label="XO board">
        {board.map((mark, index) => {
          const isWinner = winningLine?.includes(index);
          return (
            <button
              key={index}
              type="button"
              role="gridcell"
              className={isWinner ? "winning-cell" : ""}
              disabled={!myTurn || Boolean(mark) || Boolean(winner) || !meMark}
              onClick={() => onMove(index)}
              aria-label={`Cell ${index + 1}`}
            >
              {mark}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RpsBoard({
  snapshot,
  socketId,
  onMove,
  onNext
}: {
  snapshot: RoomSnapshot;
  socketId: string;
  onMove: (move: RpsMove) => void;
  onNext: () => void;
}) {
  const rps = snapshot.rps;
  const me = snapshot.players.find((player) => player.id === socketId);
  const locked = Boolean(me && rps?.locked[me.id]);
  const canPlay = snapshot.status === "playing" && snapshot.players.length === 2 && !locked && !rps?.reveal;
  const reveal = rps?.reveal;
  const winnerName =
    reveal?.winnerId === "draw"
      ? "Draw"
      : snapshot.players.find((player) => player.id === reveal?.winnerId)?.name ?? "Winner";

  return (
    <div className="rps-wrap">
      <div className="game-heading">
        <Scissors size={22} aria-hidden="true" />
        <div>
          <p className="eyebrow">Round {rps?.round ?? 1}</p>
          <h2>{reveal ? winnerName : locked ? "Choice locked" : "Choose your move"}</h2>
        </div>
      </div>

      <div className="score-row">
        {snapshot.players.map((player) => (
          <div className="score-tile" key={player.id}>
            <span>{player.name}</span>
            <strong>{rps?.scores[player.id] ?? 0}</strong>
          </div>
        ))}
      </div>

      <div className="rps-actions">
        {(["rock", "paper", "scissors"] as RpsMove[]).map((move) => (
          <button key={move} type="button" disabled={!canPlay} onClick={() => onMove(move)}>
            {move}
          </button>
        ))}
      </div>

      {reveal ? (
        <div className="reveal-panel">
          {snapshot.players.map((player) => (
            <p key={player.id}>
              <strong>{player.name}</strong> chose {reveal.moves[player.id]}.
            </p>
          ))}
          <button className="secondary-button" type="button" onClick={onNext}>
            <RefreshCcw size={18} aria-hidden="true" />
            Next round
          </button>
        </div>
      ) : null}
    </div>
  );
}
