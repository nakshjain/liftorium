package com.liftorium.config;

import java.util.concurrent.TimeUnit;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Spring Cache configuration.
 *
 * <p>Uses a TTL-aware {@link ConcurrentMapCacheManager} since Caffeine is not on the classpath.
 * The {@code catalogVersion} cache is refreshed every 60 seconds to keep the version
 * endpoint sub-millisecond for concurrent requests while staying reasonably fresh.
 */
@Configuration
@EnableCaching
public class CacheConfig {

  private static final long TTL_SECONDS = 60;

  @Bean
  public CacheManager cacheManager() {
    return new TtlConcurrentMapCacheManager(TTL_SECONDS, TimeUnit.SECONDS, "catalogVersion");
  }

  // ---------------------------------------------------------------------------
  // TTL wrapper — evicts entries older than ttl on each access (lazy eviction)
  // ---------------------------------------------------------------------------

  private static final class TtlConcurrentMapCacheManager extends ConcurrentMapCacheManager {

    private final long ttlMillis;

    TtlConcurrentMapCacheManager(long ttl, TimeUnit unit, String... cacheNames) {
      super(cacheNames);
      this.ttlMillis = unit.toMillis(ttl);
    }

    @Override
    protected Cache createConcurrentMapCache(String name) {
      return new TtlConcurrentMapCache(name, ttlMillis);
    }
  }

  /**
   * A {@link org.springframework.cache.concurrent.ConcurrentMapCache} that
   * wraps each stored value in a timestamped envelope and treats entries as
   * expired after {@code ttlMillis} milliseconds (lazy, on next read).
   */
  private static final class TtlConcurrentMapCache
      extends org.springframework.cache.concurrent.ConcurrentMapCache {

    private final long ttlMillis;
    // Stores the timestamp (System.currentTimeMillis) at which each key was written.
    private final java.util.concurrent.ConcurrentHashMap<Object, Long> timestamps =
        new java.util.concurrent.ConcurrentHashMap<>();

    TtlConcurrentMapCache(String name, long ttlMillis) {
      super(name);
      this.ttlMillis = ttlMillis;
    }

    @Override
    public ValueWrapper get(Object key) {
      Long ts = timestamps.get(key);
      if (ts != null && (System.currentTimeMillis() - ts) > ttlMillis) {
        evict(key);
        return null;
      }
      return super.get(key);
    }

    @Override
    public <T> T get(Object key, Class<T> type) {
      // Reuse the TTL check in get(key) — evicts stale entries before delegating
      if (get(key) == null) {
        return null;
      }
      return super.get(key, type);
    }

    @Override
    public void put(Object key, Object value) {
      super.put(key, value);
      timestamps.put(key, System.currentTimeMillis());
    }

    @Override
    public ValueWrapper putIfAbsent(Object key, Object value) {
      ValueWrapper existing = get(key);
      if (existing != null) {
        return existing;
      }
      put(key, value);
      return null;
    }

    @Override
    public void evict(Object key) {
      super.evict(key);
      timestamps.remove(key);
    }

    @Override
    public void clear() {
      super.clear();
      timestamps.clear();
    }
  }
}
