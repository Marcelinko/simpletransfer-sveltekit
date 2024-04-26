import { error, json } from '@sveltejs/kit';
import _ from 'lodash';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { CreateMultipartUploadCommand } from '@aws-sdk/client-s3';
import s3 from '$lib/server/s3';
import redis from '$lib/server/redis';
import { generateUploadToken } from '$lib/server/auth';
import { env } from '$env/dynamic/public';
import bcrypt from 'bcrypt';

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
		password: z.string().max(1000, { message: 'Password too long' }).optional(),
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
		chunks: { size: number }[];
		upload_id?: string;
	};
};

const chunkSize = Number(env.PUBLIC_CHUNK_SIZE);

export async function POST({ request }) {
	const data = await request.json();
	const validated = schema.safeParse(data);
	if (!validated.success) {
		const errors = validated.error.errors.map((error) => error.message);
		return error(400, JSON.stringify(errors));
	}

	const { title, description, password, expires_in } = data;
	let { files } = data;
	const uploadKey = uuidv4();

	files = files.map((file: File) => {
		file.key = `1d/${uploadKey}/${file.name}`;
		if (file.size > chunkSize) {
			const chunks = [];
			const numChunks = Math.ceil(file.size / chunkSize);
			const fileSize = file.size;

			for (let i = 0; i < numChunks; i++) {
				const start = i * chunkSize;
				const end = Math.min(start + chunkSize, fileSize);
				const actualChunkSize = end - start;
				chunks.push({ size: actualChunkSize });
			}

			file.multipart = {
				chunks
			};
		}
		return file;
	});

	const filesWithMultipart = files.filter((file: File) => file.multipart);

	const commands = filesWithMultipart.map((file: File) => {
		return new CreateMultipartUploadCommand({
			Bucket: 'simpletransfer',
			Key: `1d/${uploadKey}/${file.name}`
		});
	});

	const uploadPromises = commands.map((command: CreateMultipartUploadCommand) => s3.send(command));

	try {
		const uploadResults = await Promise.all(uploadPromises);
		uploadResults.forEach((result, index) => {
			filesWithMultipart[index].multipart.upload_id = result.UploadId;
		});
	} catch (e) {
		return error(500, 'Failed to create multipart upload');
	}

	let hashedPassword: string | undefined;
	if (password) {
		try {
			hashedPassword = await bcrypt.hash(password, 10);
		} catch (err) {
			return error(500, 'Failed to hash the password');
		}
	}

	await redis.set(
		uploadKey,
		JSON.stringify({ title, description, password: hashedPassword, expires_in, files }),
		{
			ex: expires_in
		}
	);

	const parts = files.flatMap((file: File) => {
		if (file.multipart) {
			const { chunks, upload_id } = file.multipart;
			return chunks.map((chunk, index) => ({
				size: chunk.size,
				key: file.key,
				part_number: index + 1,
				upload_id
			}));
		} else {
			return { size: file.size, key: file.key };
		}
	});

	const uploadToken = generateUploadToken(uploadKey);

	return json({ title, description, expires_in, parts, upload_token: uploadToken });
}
