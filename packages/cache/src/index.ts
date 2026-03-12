import Redis from "ioredis";

export interface CacheSetOptions {
  ttlSeconds?: number;
}

export interface KeyValueStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string, options?: CacheSetOptions): Promise<number>;
}

interface MemoryEntry {
  value: unknown;
  expiresAt?: number;
}

class InMemoryKeyValueStore implements KeyValueStore {
  private readonly entries = new Map<string, MemoryEntry>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.entries.get(key);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
    const expiresAt = options?.ttlSeconds ? Date.now() + options.ttlSeconds * 1000 : undefined;
    this.entries.set(key, {
      value,
      ...(typeof expiresAt === "number" ? { expiresAt } : {})
    });
  }

  async del(key: string): Promise<void> {
    this.entries.delete(key);
  }

  async incr(key: string, options?: CacheSetOptions): Promise<number> {
    const current = (await this.get<number>(key)) ?? 0;
    const next = current + 1;
    await this.set(key, next, options);
    return next;
  }
}

class RedisKeyValueStore implements KeyValueStore {
  constructor(private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
    const payload = JSON.stringify(value);

    if (options?.ttlSeconds) {
      await this.redis.set(key, payload, "EX", options.ttlSeconds);
      return;
    }

    await this.redis.set(key, payload);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async incr(key: string, options?: CacheSetOptions): Promise<number> {
    const next = await this.redis.incr(key);

    if (next === 1 && options?.ttlSeconds) {
      await this.redis.expire(key, options.ttlSeconds);
    }

    return next;
  }
}

export function createKeyValueStore(redisUrl?: string): KeyValueStore {
  if (!redisUrl) {
    return new InMemoryKeyValueStore();
  }

  return new RedisKeyValueStore(new Redis(redisUrl, { maxRetriesPerRequest: 1, lazyConnect: true }));
}
