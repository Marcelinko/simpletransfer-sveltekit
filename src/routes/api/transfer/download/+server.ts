import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import s3 from '$lib/server/s3';

const fileSchema = z.object({
	name: z.string(),
	type: z.string(),
	key: z.string()
});
// const filesSchema = z
// 	.array(fileSchema)
// 	.min(1, { message: 'No files provided' })
// 	.max(250, { message: 'Maximum 250 files' });
// const schema = z.object({
// 	files: filesSchema
// });

//TODO: Calculate expiry time and specify it when generating the signed url
export async function POST({ request }) {
	const data = await request.json();
	const { name, type, key } = data;

	const validated = fileSchema.safeParse(data);
	if (!validated.success) return error(400, validated.error.errors[0].message);

	// const signedUrlPromises = files.map((file) => {
	// 	const command = new GetObjectCommand({
	// 		Bucket: 'simpletransfer',
	// 		Key: file.key
	// 	});
	// 	return getSignedUrl(s3, command, { expiresIn: 60 * 15 });
	// });

	// const signedUrls = await Promise.all(signedUrlPromises);
	// const getUrls = files.map((file, index) => {
	// 	return {
	// 		key: file.key,
	// 		signed_get_url: signedUrls[index]
	// 	};
	// });
	const command = new GetObjectCommand({
		Bucket: 'simpletransfer',
		Key: key,
		ResponseContentDisposition: `attachment; filename="${name}"`,
		ResponseContentType: `${type}`
	});

	const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 15 });

	return json({ signed_get_url: signedUrl });
}
