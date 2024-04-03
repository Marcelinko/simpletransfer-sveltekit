import { error, json } from '@sveltejs/kit';
import _ from 'lodash';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { CreateMultipartUploadCommand } from '@aws-sdk/client-s3';
import s3 from '$lib/server/s3';
import redis from '$lib/server/redis';
import { generateUploadToken } from '$lib/server/auth';

//TODO: Fix error messages
const fileSchema = z.object({
	name: z.string(),
	size: z.number().int().min(0),
	type: z.string()
});
const filesSchema = z
	.array(fileSchema)
	.min(1, { message: 'No files provided' })
	.max(250, { message: 'Maximum of 250 files allowed' })
	.refine((files) => _.sumBy(files, 'size') <= 52428800 * 20, {
		message: 'Transfer exceeds 50MB limit'
	});
const schema = z.object({
	title: z.string().max(100, { message: 'Title too long' }).optional(),
	description: z.string().max(500, { message: 'Description too long' }).optional(),
	expires_in: z
		.number()
		.int()
		.min(60 * 10)
		.max(60 * 60 * 24, { message: 'Expiry time must be less than 86400' }), //1 day for now
	//TODO: Maybe add password
	files: filesSchema
});

type File = {
	name: string;
	size: number;
};

export async function POST({ request }) {
	const data = await request.json();
	const { files } = data;
	const validated = schema.safeParse(data);
	if (!validated.success) return error(400, validated.error.errors[0].message);

	const newFiles = files.map((file: File) => {
		file.key = uuidv4();
		if (file.size > 15728640) {
			const chunks: { size: number }[] = [];
			const numChunks = Math.ceil(file.size / 15728640);
			let fileSize = file.size;

			//TODO: Remove part number
			for (let i = 0; i < numChunks; i++) {
				const start = i * 15728640;
				const end = Math.min(start + 15728640, fileSize);
				const chunkSize = end - start;
				chunks.push({ size: chunkSize });
			}

			const command = new CreateMultipartUploadCommand({
				Bucket: 'simpletransfer',
				Key: file.key
			});
			const multipartPromise = s3.send(command);
			file.multipart = {
				promise: multipartPromise,
				chunks
			};
		}
		return file;
	});
	const filesWithMultipart = newFiles.filter((file: File) => file.multipart);
	await Promise.all(filesWithMultipart.map((file: File) => file.multipart.promise)).then(
		(results) => {
			newFiles.forEach((file: File) => {
				if (file.multipart) {
					const { UploadId, Key } = results.shift();
					file.multipart.upload_id = UploadId;
					delete file.multipart.promise;
				}
			});
		}
	);
	//TODO: Insert in redis
	const redisId = uuidv4();
	await redis.set(redisId, JSON.stringify(newFiles), { ex: 86400 });
	const token = generateUploadToken(redisId);

	const responsePayload = {
		title: data.title,
		description: data.description,
		expires: data.expires,
		files: newFiles,
		token
	};
	return json(responsePayload);
}
