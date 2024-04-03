import { Redis } from '@upstash/redis';
import { SECRET_REDIS_URL, SECRET_REDIS_TOKEN } from '$env/static/private'


const redis = new Redis({
	url: SECRET_REDIS_URL,
	token: SECRET_REDIS_TOKEN,
})

export default redis;