import { RoomClient } from "../../../components/RoomClient";

export const dynamic = "force-dynamic";

export default async function RoomPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;
  return <RoomClient roomCode={roomCode} />;
}
