import { CreateRoomPanel } from "../components/CreateRoomPanel";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Private two-player rooms</p>
          <h1>Send one link. Play the game you picked.</h1>
          <p className="lede">
            Create a room for XO or rock-paper-scissors, share the link, and the first invited player joins your match.
          </p>
        </div>
        <CreateRoomPanel />
      </section>
    </main>
  );
}
