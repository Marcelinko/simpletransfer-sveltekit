import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, UploadPartCommand } from '@aws-sdk/client-s3';
import jwt from 'jsonwebtoken';
import s3 from '$lib/server/s3';
import { extractBearerToken, verifyUploadToken } from '$lib/server/auth';

const fileSchema = z.object({
	size: z.number().int().min(0).max(15728640, { message: 'Maximum 15MB per url' }),
	key: z.string(),
	uploadId: z.string().optional(),
	partNumber: z.number().int().optional()
});
const filesSchema = z
	.array(fileSchema)
	.min(1, { message: 'No files provided' })
	.max(4, { message: 'Maximum 4 urls per request' });
const schema = z.object({
	files: filesSchema
});

export async function POST({ request }) {
	const data = await request.json();
	const { files } = data;

	const uploadToken = extractBearerToken(request);
	if (!uploadToken) return error(401, 'Unauthorized');

	const decoded = verifyUploadToken(uploadToken);

	const validated = schema.safeParse(data);
	if (!validated.success) return error(400, validated.error.errors[0].message);

	const signedUrlPromises = files.map((file) => {
		if (!file.uploadId) {
			const command = new PutObjectCommand({
				Bucket: 'simpletransfer',
				Key: file.key
				//ContentLength: file.size
			});
			return getSignedUrl(s3, command, { expiresIn: 60 * 15 });
		} else {
			const command = new UploadPartCommand({
				Bucket: 'simpletransfer',
				Key: file.key,
				PartNumber: file.partNumber,
				UploadId: file.uploadId
			});
			return getSignedUrl(s3, command, { expiresIn: 60 * 15 });
		}
	});

	const signedUrls = await Promise.all(signedUrlPromises);
	const putUrls = files.map((file, index) => {
		return {
			signed_put_url: signedUrls[index],
			put_headers: {
				'Content-Length': file.size
			}
		};
	});

	return json(putUrls);
}
