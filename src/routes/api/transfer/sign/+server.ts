import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, UploadPartCommand } from '@aws-sdk/client-s3';
import s3 from '$lib/server/s3';
import { extractBearerToken, verifyUploadToken } from '$lib/server/auth';

//TODO: Check redis each time user request singing for part
const partSchema = z
	.object({
		size: z
			.number()
			.int()
			.min(0)
			.max(15 * 1024 * 1024, { message: 'Size exceeds 15.728.640 bytes' }),
		key: z.string(),
		upload_id: z.string().optional(),
		part_number: z.number().int().optional()
	})
	.strict()
	.refine(
		(part) =>
			(part.upload_id !== undefined && part.part_number !== undefined) ||
			(part.upload_id === undefined && part.part_number === undefined),
		{ message: 'Both upload_id and part_number must be provided for multipart upload' }
	);

const partsSchema = z
	.array(partSchema)
	.min(1, { message: 'No parts provided' })
	.max(5, { message: 'Maximum 5 urls per request' });

const schema = z.object({
	parts: partsSchema
});

type Part = {
	size: number;
	key: string;
	type?: string;
	upload_id?: string;
	part_number?: number;
};

export async function POST({ request }) {
	const data = await request.json();
	const { parts } = data;

	try {
		const uploadToken = extractBearerToken(request);
		if (!uploadToken) return error(401, 'No token provided');
		verifyUploadToken(uploadToken);
	} catch (e) {
		console.log(e);
		return error(401, 'Unauthorized');
	}

	const validated = schema.safeParse(data);
	if (!validated.success) {
		const errors = validated.error.errors.map((error) => error.message);
		return error(400, JSON.stringify(errors));
	}

	const signedUrlPromises = parts.map((part: Part) => {
		if (!part.upload_id) {
			const command = new PutObjectCommand({
				Bucket: 'simpletransfer',
				Key: part.key,
				ContentLength: part.size
			});
			return getSignedUrl(s3, command, { expiresIn: 60 * 15 });
		} else {
			const command = new UploadPartCommand({
				Bucket: 'simpletransfer',
				Key: part.key,
				ContentLength: part.size,
				PartNumber: part.part_number,
				UploadId: part.upload_id
			});
			return getSignedUrl(s3, command, { expiresIn: 60 * 15 });
		}
	});

	const signedPutUrls = await Promise.all(signedUrlPromises).then((urls) => {
		return urls.map((url) => {
			return {
				signed_put_url: url
			};
		});
	});

	return json(signedPutUrls);
}
