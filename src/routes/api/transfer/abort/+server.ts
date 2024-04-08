import redis from '$lib/server/redis';
import s3 from '$lib/server/s3';
import { extractBearerToken, verifyUploadToken } from '$lib/server/auth';
import { error, json } from '@sveltejs/kit';
import { AbortMultipartUploadCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

type File = {
	name: string;
	size: number;
	key: string;
	type?: string;
	multipart?: {
		upload_id: string;
		chunks: { size: number }[];
	};
};

type RedisUpload = {
	title?: string;
	description?: string;
	expires_in: number;
	files: File[];
};

export async function POST({ request }) {
	let decodedPayload: { uploadKey: string };
	try {
		const uploadToken = extractBearerToken(request);
		if (!uploadToken) return error(401, 'No token provided');
		decodedPayload = verifyUploadToken(uploadToken);
	} catch (e) {
		console.log(e);
		return error(401, 'Unauthorized');
	}
	const redisUpload: RedisUpload | null = await redis.get(decodedPayload.uploadKey);
	if (!redisUpload) {
		return error(404, `Upload not found`);
	}

	const deletePromises = redisUpload.files.map((file) => {
		if (file.multipart) {
			return s3.send(
				new AbortMultipartUploadCommand({
					Bucket: 'simpletransfer',
					Key: file.key,
					UploadId: file.multipart.upload_id
				})
			);
		} else {
			return s3.send(
				new DeleteObjectCommand({
					Bucket: 'simpletransfer',
					Key: file.key
				})
			);
		}
	});

	await Promise.allSettled(deletePromises);
	await redis.del(decodedPayload.uploadKey);

	return json({ message: 'Upload aborted' });
}
