import { Module } from "@nestjs/common";
import { GameGateway } from "./game.gateway";
import { GameService } from "./game.service";
import { HealthController } from "./health.controller";

@Module({
  controllers: [HealthController],
  providers: [GameGateway, GameService]
})
export class AppModule {}
