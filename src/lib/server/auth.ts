import { env } from '$env/dynamic/private';
import jwt from 'jsonwebtoken';

export function extractBearerToken(request: Request) {
	const authHeader = request.headers.get('Authorization');
	let bearerToken = null;

	if (authHeader && authHeader.startsWith('Bearer ')) {
		bearerToken = authHeader.slice(7);
	}

	return bearerToken;
}

export function generateUploadToken(uploadKey: string) {
	return jwt.sign({ uploadKey }, env.SECRET_JWT_SECRET, { expiresIn: '24h' });
}

export function verifyUploadToken(uploadtoken: string) {
	return jwt.verify(uploadtoken, env.SECRET_JWT_SECRET) as { uploadKey: string };
}
