"use client";

import { Gamepad2, Scissors, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { GameType } from "../lib/types";
import { generateRoomCode } from "../lib/room-code";

export function CreateRoomPanel() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("Player 1");
  const [gameType, setGameType] = useState<GameType>("xo");

  function createRoom() {
    const code = generateRoomCode();
    const query = new URLSearchParams({
      host: "1",
      game: gameType,
      name: playerName
    });

    router.push(`/room/${code}?${query.toString()}`);
  }

  return (
    <section className="room-card" aria-label="Create a room">
      <div className="field">
        <label htmlFor="playerName">Your name</label>
        <input
          id="playerName"
          maxLength={32}
          value={playerName}
          onChange={(event) => setPlayerName(event.target.value)}
        />
      </div>

      <div className="field">
        <span className="label">Game</span>
        <div className="segmented" role="group" aria-label="Game type">
          <button
            type="button"
            className={gameType === "xo" ? "active" : ""}
            onClick={() => setGameType("xo")}
            aria-pressed={gameType === "xo"}
          >
            <Gamepad2 size={18} aria-hidden="true" />
            XO
          </button>
          <button
            type="button"
            className={gameType === "rps" ? "active" : ""}
            onClick={() => setGameType("rps")}
            aria-pressed={gameType === "rps"}
          >
            <Scissors size={18} aria-hidden="true" />
            RPS
          </button>
        </div>
      </div>

      <button className="primary-button" type="button" onClick={createRoom}>
        <Send size={18} aria-hidden="true" />
        Create link
      </button>
    </section>
  );
}
