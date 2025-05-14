import { BullModule } from '@nestjs/bull';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import environments from '../../@core/environments';
import { name as appName } from '../../../package.json';

@Module({
  imports: [
    BullModule.registerQueue(
      // TODO: you need to register each queue here
      { name: 'notifications-queue' },
      { name: 'your-second-queue-name-here' },
    ),
    ConfigModule,
  ],
  exports: [BullModule],
})
export class RedisQueueModule {
  static forRoot(): DynamicModule {
    return {
      module: BullModule,
      imports: [
        BullModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (config: ConfigService) => ({
            redis: {
              host: config.get(environments.redis.host),
              port: +config.get(environments.redis.port) || 6379,
              username: config.get(environments.redis.username),
              password: config.get(environments.redis.password),
              keyPrefix: config.get(environments.redis.prefix) || appName,
              tls: config.get(environments.redis.tls) === 'true' ? {} : undefined,
            },
          }),
        }),
      ],
      exports: [BullModule],
    };
  }
}
