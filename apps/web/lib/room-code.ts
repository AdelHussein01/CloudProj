export function generateRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const cryptoApi = globalThis.crypto;

  if (cryptoApi?.getRandomValues) {
    const values = cryptoApi.getRandomValues(new Uint8Array(6));
    return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
  }

  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export function gameLabel(gameType: "xo" | "rps") {
  return gameType === "xo" ? "XO" : "Rock Paper Scissors";
}
