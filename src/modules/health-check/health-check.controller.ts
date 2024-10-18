import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';

@Controller('health')
export class HealthCheckController {
  constructor(private health: HealthCheckService) { }

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([]);
  }
}
