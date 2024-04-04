import { error, json } from '@sveltejs/kit';
import redis from '$lib/server/redis';
import s3 from '$lib/server/s3';
import supabase from '$lib/server/supabase';
import {
	HeadObjectCommand,
	ListPartsCommand,
	CompleteMultipartUploadCommand
} from '@aws-sdk/client-s3';
import { extractBearerToken, verifyUploadToken } from '$lib/server/auth';

export async function POST({ request }) {
	const uploadToken = extractBearerToken(request);
	if (!uploadToken) return error(401, 'Unauthorized');

	const decoded = verifyUploadToken(uploadToken);

	let redisFiles = await redis.get(decoded.redisId);

	let filePromises = redisFiles.map((file) => {
		if (file.multipart) {
			return s3.send(
				new ListPartsCommand({
					Bucket: 'simpletransfer',
					Key: file.key,
					UploadId: file.multipart.upload_id
				})
			);
		} else {
			return s3.send(
				new HeadObjectCommand({
					Bucket: 'simpletransfer',
					Key: file.key
				})
			);
		}
	});

	const s3Files = await Promise.all(filePromises).catch(() => {
		return error(400, `Some files are missing`);
	});

	for (let i = 0; i < redisFiles.length; i++) {
		const redisFile = redisFiles[i];
		const s3File = s3Files[i];
		if (!redisFile || !s3File) {
			return error(400, `Some files are missing`);
		}
		if (redisFile.multipart) {
			if (s3File.Parts.length !== redisFile.multipart.chunks.length) {
				return error(400, `Number of parts mismatch`);
			}
		} else {
			if (s3File.ContentLength !== redisFile.size) {
				return error(400, `File size mismatch`);
			}
		}
	}

	const multipartPromises = s3Files
		.filter((file) => file.Parts)
		.map((file) => {
			return s3.send(
				new CompleteMultipartUploadCommand({
					Bucket: 'simpletransfer',
					Key: file.Key,
					UploadId: file.UploadId,
					MultipartUpload: {
						Parts: file.Parts.map((part) => {
							return {
								PartNumber: part.PartNumber,
								ETag: part.ETag
							};
						})
					}
				})
			);
		});

	await Promise.all(multipartPromises);
	//TODO: Delete from redis

	const { data } = await supabase
		.from('upload')
		.insert({
			title: 'Test',
			description: 'Test description',
			expires_in: new Date()
		})
		.select();
	await supabase.from('file').insert(
		redisFiles.map((file) => ({
			upload_id: data[0].id,
			name: file.name,
			type: file.type,
			size: file.size,
			key: file.key
		}))
	);

	//await redis.del(decoded.redisId);
	return json({ upload_id: data[0].id });
}
