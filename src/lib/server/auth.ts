import { SECRET_JWT_SECRET } from '$env/static/private';
import jwt from 'jsonwebtoken';

export function extractBearerToken(request: Request) {
	const authHeader = request.headers.get('Authorization');
	let bearerToken = null;

	if (authHeader && authHeader.startsWith('Bearer ')) {
		bearerToken = authHeader.slice(7);
	}

	return bearerToken;
}

export function generateUploadToken(uploadId: string) {
	return jwt.sign({ redisId: uploadId }, SECRET_JWT_SECRET, { expiresIn: '24h' });
}

export function verifyUploadToken(token: string) {
	return jwt.verify(token, SECRET_JWT_SECRET);
}
