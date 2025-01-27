import { UPSTASH_REDIS_TOKEN, UPSTASH_REDIS_URL } from '$env/static/private';
import { Redis } from '@upstash/redis';

export const REGISTRY_CACHE_PREFIX = 'registry';
export const VIEW_PREFIX = 'view';

const redis = new Redis({
	url: UPSTASH_REDIS_URL,
	token: UPSTASH_REDIS_TOKEN
});

export { redis };
