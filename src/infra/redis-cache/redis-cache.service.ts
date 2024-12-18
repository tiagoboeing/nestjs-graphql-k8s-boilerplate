import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { Cache, ErrorEventHandler, Store } from 'cache-manager';
import environments from '../../@core/environments';
import { name as appName } from '../../../package.json';

@Injectable()
export class RedisCacheService implements Cache<Store> {
  private readonly cachePrefix: string;

  store: Store;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly config: ConfigService,
  ) {
    this.cachePrefix = this.config.get(environments.redis.prefix) || appName;
  }

  removeListener: <T>(event: 'error', handler: ErrorEventHandler<T>) => void;

  on: <T>(event: 'error', handler: ErrorEventHandler<T>) => void;

  private getKeyWithPrefix(key: string) {
    return `${this.cachePrefix}:cache:${key}`;
  }

  get<T>(key: string): Promise<T> {
    const keyWithPrefix = this.getKeyWithPrefix(key);
    return this.cacheManager.get(keyWithPrefix);
  }

  set(key: string, value: unknown, ttl?: number): Promise<void> {
    const keyWithPrefix = this.getKeyWithPrefix(key);

    /**
     * FIXME: TTL only works passing as object
     * https://github.com/dabroek/node-cache-manager-redis-store/issues/40#issuecomment-1382683850
     */
    return this.cacheManager.set(keyWithPrefix, value, ttl && ({ ttl } as any));
  }

  del(key: string): Promise<void> {
    const keyWithPrefix = this.getKeyWithPrefix(key);
    return this.cacheManager.del(keyWithPrefix);
  }

  reset(): Promise<void> {
    return this.cacheManager.reset();
  }

  wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    const keyWithPrefix = this.getKeyWithPrefix(key);
    return this.cacheManager.wrap(keyWithPrefix, fn, ttl);
  }
}
