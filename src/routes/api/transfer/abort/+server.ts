import jwt from 'jsonwebtoken';
import redis from '$lib/server/redis';
import s3 from '$lib/server/s3';
import { extractBearerToken, verifyUploadToken } from '$lib/server/auth';
import { error, json } from '@sveltejs/kit';

//Get upload from redis
//Delete multiparts from s3
//Delete upload from redis

export async function POST({ request }) {
	const uploadToken = extractBearerToken(request);
	if (!uploadToken) return error(401, 'Unauthorized');

	try {
		const decoded = verifyUploadToken(uploadToken);
		const data = await redis.get(decoded.redisId);
		if (!data) return error(404, 'Not found');
		//TODO: Create promises for each file stored in redis and delete them from s3
	} catch (e) {
		return error(401, 'Unauthorized');
	}

	//TODO: 204
	return json({ success: true }, { status: 200 });
}
