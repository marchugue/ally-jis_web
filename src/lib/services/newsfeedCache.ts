// src/lib/services/newsfeedCache.ts
//
// Client-side cache for up to 20 newsfeed posts per filter tab.
// Enables instantaneous loading on page open/switch, and tracks
// the latest post id to determine if the backend has newer posts.

import type { FeedPost } from '@/types/feed';

const CACHE_PREFIX = 'ally_newsfeed_cache_v2';
const MAX_CACHED_POSTS = 20;

export interface NewsfeedCacheEntry {
  posts: FeedPost[];
  cachedAt: number;
  latestPostId: string | null;
  latestCreatedAt: string | null;
  filter: string;
}

function getCacheKey(userId: string | null | undefined, filter: string): string {
  const safeUser = userId || 'guest';
  return `${CACHE_PREFIX}_${safeUser}_${filter}`;
}

export const newsfeedCache = {
  /**
   * Reads cached posts (up to 20) for the given user and filter.
   */
  get(userId: string | null | undefined, filter: string): NewsfeedCacheEntry | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(getCacheKey(userId, filter));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as NewsfeedCacheEntry;
      if (!parsed || !Array.isArray(parsed.posts)) return null;
      return parsed;
    } catch {
      return null;
    }
  },

  /**
   * Saves up to 20 posts into the cache.
   */
  set(userId: string | null | undefined, filter: string, posts: FeedPost[]): void {
    if (typeof window === 'undefined') return;
    try {
      const sliced = posts.slice(0, MAX_CACHED_POSTS);
      const latest = sliced[0] ?? null;
      const entry: NewsfeedCacheEntry = {
        posts: sliced,
        cachedAt: Date.now(),
        latestPostId: latest ? latest.id : null,
        latestCreatedAt: latest ? latest.created_at : null,
        filter,
      };
      localStorage.setItem(getCacheKey(userId, filter), JSON.stringify(entry));
    } catch (e) {
      // Ignore quota errors
      console.warn('[newsfeedCache] Failed to write cache:', e);
    }
  },

  /**
   * Updates a single post in the cache (e.g. when like or comment count updates).
   */
  updatePost(userId: string | null | undefined, filter: string, updatedPost: FeedPost): void {
    const cached = this.get(userId, filter);
    if (!cached) return;
    const nextPosts = cached.posts.map((p) => (p.id === updatedPost.id ? updatedPost : p));
    this.set(userId, filter, nextPosts);
  },

  /**
   * Clears the cache for a specific filter or all newsfeed cache.
   */
  clear(userId?: string | null, filter?: string): void {
    if (typeof window === 'undefined') return;
    try {
      if (userId && filter) {
        localStorage.removeItem(getCacheKey(userId, filter));
      } else {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(CACHE_PREFIX)) {
            keysToRemove.push(key);
          }
        }
        for (const k of keysToRemove) {
          localStorage.removeItem(k);
        }
      }
    } catch {
      // Ignore
    }
  },
};
