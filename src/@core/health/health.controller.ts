import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import environments from '../environments';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private microservice: MicroserviceHealthIndicator,
    private configService: ConfigService,
  ) { }

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    const redisCheck = this.microservice.pingCheck('redis', {
      transport: 1,
      options: {
        host: this.configService.get(environments.redis.host),
        port: +this.configService.get(environments.redis.port) || 6379,
        username: this.configService.get(environments.redis.username),
        password: this.configService.get(environments.redis.password),
        tls: this.configService.get(environments.redis.tls) === 'true' ? {} : undefined,
      },
    })

    return this.health.check([
      async () => redisCheck,
    ])
  }
}
