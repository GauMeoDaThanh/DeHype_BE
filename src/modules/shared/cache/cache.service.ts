import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { CacheManagerStore } from 'cache-manager';

@Injectable()
export class CacheService {
    constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: CacheManagerStore) { }

    // Set a value in the cache with a specified key and TTL
    async set<T>(key: string, value: T, ttl: number): Promise<void> {
        await this.cacheManager.set(key, value, ttl);
    }

    // Get a value from the cache by key
    async get<T>(key: string): Promise<T | undefined> {
        return this.cacheManager.get(key);
    }

    // Delete a value from the cache by key
    async del(key: string): Promise<void> {
        await this.cacheManager.del(key);
    }

    // Clear all values from the cache
    async reset(): Promise<void> {
        await this.cacheManager.reset();
    }

    // Additional methods specific to CacheService can be added here
}
