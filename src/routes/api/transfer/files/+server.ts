import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import supabase from '$lib/server/supabase';
import s3 from '$lib/server/s3';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { error, json } from '@sveltejs/kit';

const schema = z
	.object({
		upload_id: z.string().min(3, { message: 'Upload id is required' }),
		password: z.string().max(1000, { message: 'Password too long' })
	})
	.strict();

export async function POST({ request }) {
	const data = await request.json();
	const validated = schema.safeParse(data);
	if (!validated.success) {
		const errors = validated.error.errors.map((error) => error.message);
		return error(400, JSON.stringify(errors));
	}

	const { upload_id, password } = data;

	const { data: uploadData, error: uploadError } = await supabase
		.from('upload')
		.select('*')
		.eq('id', upload_id);

	if (uploadError) {
		return error(500, 'Error fetching data from database');
	}

	if (uploadData.length === 0) {
		return error(404, 'Upload not found');
	}

	const uploadExpiry = new Date(uploadData[0].expires);
	if (uploadExpiry.getTime() < Date.now()) {
		return error(404, 'Upload expired');
	}

	let passwordMatch: boolean;
	if (uploadData[0].password) {
		try {
			passwordMatch = await bcrypt.compare(password, uploadData[0].password);
		} catch (err) {
			return error(500, 'Failed to compare passwords');
		}
		if (!passwordMatch) {
			return error(401, 'Incorrect password');
		}
	}

	const { data: fileData, error: fileError } = await supabase
		.from('file')
		.select('name, type, size, key')
		.eq('upload_id', upload_id);

	if (fileError) {
		return error(500, 'Error fetching data from database');
	}

	const downloadUrlPromises = fileData.map((file) => {
		const encodedFilename = encodeURIComponent(file.name);
		return getSignedUrl(
			s3,
			new GetObjectCommand({
				Bucket: 'simpletransfer',
				Key: file.key,
				ResponseContentDisposition: `attachment; filename=${encodedFilename}`
			}),
			{
				expiresIn: (uploadExpiry.getTime() - Date.now()) / 1000
			}
		);
	});

	const filesWithDownloadUrls = await Promise.all(downloadUrlPromises).then((urls) => {
		return fileData.map((file, index) => {
			return {
				...file,
				download_url: urls[index]
			};
		});
	});

	return json({ files: filesWithDownloadUrls });
}
