import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';

import { CacheService } from './cache.service';
import { config } from 'src/config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const redisStore = require('cache-manager-redis-store').redisStore;

@Global()
@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      url: config.redisUrl,
      ttl: 60 * 5,
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class RedisCacheModule {}
