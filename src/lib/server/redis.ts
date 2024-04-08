import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';

const redis = new Redis({
	url: env.SECRET_REDIS_URL,
	token: env.SECRET_REDIS_TOKEN
});

export default redis;
