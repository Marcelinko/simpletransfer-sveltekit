import { error, json } from '@sveltejs/kit';
import _ from 'lodash';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { CreateMultipartUploadCommand } from '@aws-sdk/client-s3';
import type { CreateMultipartUploadCommandOutput } from '@aws-sdk/client-s3';
import s3 from '$lib/server/s3';
import redis from '$lib/server/redis';
import { generateUploadToken } from '$lib/server/auth';

//TODO: In future limit each file to be 15GB max, because of 1000 parts limits (15MB * 1000 = 15GB)
const fileSchema = z
	.object({
		name: z.string().min(1, { message: 'One of the files is missing a name' }),
		size: z.number().int().min(0),
		type: z.string().optional()
	})
	.strict();

const filesSchema = z
	.array(fileSchema)
	.min(1, { message: 'No files provided' })
	.max(250, { message: 'Maximum of 250 files allowed' })
	.refine((files) => _.sumBy(files, 'size') <= 1000 * 1024 * 1024, {
		message: 'Transfer size exceeds 1GB limit'
	});

const schema = z
	.object({
		title: z.string().max(50, { message: 'Title too long' }).optional(),
		description: z.string().max(1000, { message: 'Description too long' }).optional(),
		expires_in: z.literal(86400),
		files: filesSchema
	})
	.strict();

type File = {
	name: string;
	size: number;
	key: string;
	type?: string;
	multipart?: {
		promise?: Promise<CreateMultipartUploadCommandOutput>;
		upload_id?: string;
		chunks: { size: number }[];
	};
};

export async function POST({ request }) {
	const data = await request.json();
	const validated = schema.safeParse(data);
	if (!validated.success) {
		const errors = validated.error.errors.map((error) => error.message);
		return error(400, JSON.stringify(errors));
	}

	const { title, description, expires_in } = data;
	let { files } = data;

	files = files.map((file: File) => {
		file.key = uuidv4();
		if (file.size > 15728640) {
			const chunks = [];
			const numChunks = Math.ceil(file.size / 15728640);
			const fileSize = file.size;

			for (let i = 0; i < numChunks; i++) {
				const start = i * 15728640;
				const end = Math.min(start + 15728640, fileSize);
				const chunkSize = end - start;
				chunks.push({ size: chunkSize });
			}

			const command = new CreateMultipartUploadCommand({
				Bucket: 'simpletransfer',
				Key: file.key,
				ContentType: file.type
			});

			const multipartPromise = s3.send(command);
			file.multipart = {
				promise: multipartPromise,
				chunks
			};
		}
		return file;
	});

	const filesWithMultipart = files.filter((file: File) => file.multipart);
	try {
		const multiparts = await Promise.all(
			filesWithMultipart.map((file: File) => file.multipart?.promise)
		);
		files.map((file: File) => {
			if (file.multipart) {
				delete file.multipart.promise;
				file.multipart.upload_id = multiparts.shift()?.UploadId;
			}
			return file;
		});
	} catch (e) {
		console.error(e);
		return error(500, 'Failed to create multipart upload');
	}

	const uploadKey = uuidv4();
	await redis.set(uploadKey, JSON.stringify({ title, description, expires_in, files }), {
		ex: expires_in
	});
	const uploadToken = generateUploadToken(uploadKey);

	return json({ title, description, expires_in, files, upload_token: uploadToken });
}
