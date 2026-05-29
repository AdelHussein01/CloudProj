import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get()
  root() {
    return {
      service: "xo-rps-api",
      status: "ready"
    };
  }

  @Get("health")
  health() {
    return {
      status: "ok",
      service: "xo-rps-api",
      timestamp: new Date().toISOString()
    };
  }
}
