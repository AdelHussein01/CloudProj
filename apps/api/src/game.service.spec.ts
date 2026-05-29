import { GameService } from "./game.service";

describe("GameService", () => {
  it("creates an XO room and lets the second player join", () => {
    const service = new GameService();
    const created = service.createRoom("host-socket", {
      roomCode: "abc123",
      gameType: "xo",
      playerName: "Alice"
    });

    expect(created.code).toBe("ABC123");
    expect(created.status).toBe("waiting");

    const joined = service.joinRoom("guest-socket", {
      roomCode: "ABC123",
      playerName: "Bob"
    });

    expect(joined.status).toBe("playing");
    expect(joined.players).toHaveLength(2);
  });

  it("detects an XO win", () => {
    const service = new GameService();
    service.createRoom("x", { roomCode: "WIN", gameType: "xo", playerName: "X" });
    service.joinRoom("o", { roomCode: "WIN", playerName: "O" });

    service.makeXoMove("x", { roomCode: "WIN", cell: 0 });
    service.makeXoMove("o", { roomCode: "WIN", cell: 3 });
    service.makeXoMove("x", { roomCode: "WIN", cell: 1 });
    service.makeXoMove("o", { roomCode: "WIN", cell: 4 });
    const finished = service.makeXoMove("x", { roomCode: "WIN", cell: 2 });

    expect(finished.status).toBe("finished");
    expect(finished.xo?.winner).toBe("X");
    expect(finished.xo?.winningLine).toEqual([0, 1, 2]);
  });

  it("scores a rock-paper-scissors round without exposing moves until reveal", () => {
    const service = new GameService();
    service.createRoom("alice", { roomCode: "RPS", gameType: "rps", playerName: "Alice" });
    service.joinRoom("bob", { roomCode: "RPS", playerName: "Bob" });

    const firstMove = service.makeRpsMove("alice", { roomCode: "RPS", move: "rock" });
    expect(firstMove.rps?.reveal).toBeNull();

    const reveal = service.makeRpsMove("bob", { roomCode: "RPS", move: "scissors" });
    expect(reveal.rps?.reveal?.winnerId).toBe("alice");
    expect(reveal.rps?.scores.alice).toBe(1);
  });
});
