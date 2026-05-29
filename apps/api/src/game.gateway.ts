import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GameService } from "./game.service";
import { CreateRoomPayload, JoinRoomPayload, RpsMovePayload, XoMovePayload } from "./types";

const corsOrigin = process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim()) ?? true;

@WebSocketGateway({
  namespace: "/games",
  cors: {
    origin: corsOrigin,
    credentials: true
  }
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  handleConnection(client: Socket) {
    client.emit("connected", { socketId: client.id });
  }

  handleDisconnect(client: Socket) {
    for (const roomCode of this.gameService.disconnect(client.id)) {
      this.server.to(roomCode).emit("room:update", this.gameService.getSnapshot(roomCode));
    }
  }

  @SubscribeMessage("room:create")
  createRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: CreateRoomPayload) {
    return this.withErrors(client, () => {
      const snapshot = this.gameService.createRoom(client.id, payload);
      client.join(snapshot.code);
      this.server.to(snapshot.code).emit("room:update", snapshot);
      return snapshot;
    });
  }

  @SubscribeMessage("room:join")
  joinRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinRoomPayload) {
    return this.withErrors(client, () => {
      const snapshot = this.gameService.joinRoom(client.id, payload);
      client.join(snapshot.code);
      this.server.to(snapshot.code).emit("room:update", snapshot);
      return snapshot;
    });
  }

  @SubscribeMessage("xo:move")
  makeXoMove(@ConnectedSocket() client: Socket, @MessageBody() payload: XoMovePayload) {
    return this.withErrors(client, () => {
      const snapshot = this.gameService.makeXoMove(client.id, payload);
      this.server.to(snapshot.code).emit("room:update", snapshot);
      return snapshot;
    });
  }

  @SubscribeMessage("rps:move")
  makeRpsMove(@ConnectedSocket() client: Socket, @MessageBody() payload: RpsMovePayload) {
    return this.withErrors(client, () => {
      const snapshot = this.gameService.makeRpsMove(client.id, payload);
      this.server.to(snapshot.code).emit("room:update", snapshot);
      return snapshot;
    });
  }

  @SubscribeMessage("rps:next")
  nextRpsRound(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomCode: string }) {
    return this.withErrors(client, () => {
      const snapshot = this.gameService.nextRpsRound(client.id, payload.roomCode);
      this.server.to(snapshot.code).emit("room:update", snapshot);
      return snapshot;
    });
  }

  @SubscribeMessage("room:reset")
  resetRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomCode: string }) {
    return this.withErrors(client, () => {
      const snapshot = this.gameService.resetRoom(client.id, payload.roomCode);
      this.server.to(snapshot.code).emit("room:update", snapshot);
      return snapshot;
    });
  }

  private withErrors(client: Socket, callback: () => unknown) {
    try {
      return callback();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected game error.";
      client.emit("room:error", { message });
      return { error: message };
    }
  }
}
