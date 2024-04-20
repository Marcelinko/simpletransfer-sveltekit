import { error, json } from '@sveltejs/kit';
import redis from '$lib/server/redis';
import s3 from '$lib/server/s3';
import supabase from '$lib/server/supabase';
import _ from 'lodash';
import {
	HeadObjectCommand,
	ListPartsCommand,
	CompleteMultipartUploadCommand
} from '@aws-sdk/client-s3';
import type { HeadObjectCommandOutput, ListPartsCommandOutput } from '@aws-sdk/client-s3';
import { extractBearerToken, verifyUploadToken } from '$lib/server/auth';

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

	const filePromises = redisUpload.files.map((file: File) => {
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

	const s3Files: (ListPartsCommandOutput | HeadObjectCommandOutput)[] = await Promise.all(
		filePromises
	).catch(() => {
		return error(404, `Some files were not found in bucket`);
	});

	redisUpload.files.forEach((file: File, index: number) => {
		const s3File = s3Files[index];
		if (file.multipart && 'Parts' in s3File) {
			const s3ListPartsFile = s3File as ListPartsCommandOutput;
			if (s3ListPartsFile.Parts?.length !== file.multipart.chunks.length) {
				return error(400, `Number of parts mismatch`);
			}
		} else {
			const s3HeadObjectFile = s3File as HeadObjectCommandOutput;
			if (s3HeadObjectFile.ContentLength !== file.size) {
				return error(400, `File size mismatch`);
			}
		}
	});

	const multipartPromises = s3Files
		.filter((file) => 'Parts' in file && file.Parts)
		.map((file: ListPartsCommandOutput) => {
			return s3.send(
				new CompleteMultipartUploadCommand({
					Bucket: 'simpletransfer',
					Key: file.Key,
					UploadId: file.UploadId,
					MultipartUpload: {
						Parts: file.Parts?.map((part) => {
							return {
								PartNumber: part.PartNumber,
								ETag: part.ETag
							};
						})
					}
				})
			);
		});

	await Promise.all(multipartPromises).catch(() => {
		return error(500, `Error completing multipart upload`);
	});

	const { data: uploadData, error: uploadError } = await supabase
		.from('upload')
		.insert({
			title: redisUpload.title,
			description: redisUpload.description,
			expires: new Date(Date.now() + redisUpload.expires_in * 1000),
			upload_size: _.sumBy(redisUpload.files, 'size'),
			file_count: redisUpload.files.length,
			upload_key: decodedPayload.uploadKey
		})
		.select();

	if (!uploadData || uploadError) {
		return error(500, 'Error inserting upload');
	}

	const { error: fileError } = await supabase.from('file').insert(
		redisUpload.files.map((file) => ({
			upload_id: uploadData[0].id,
			name: file.name,
			type: file.type,
			size: file.size,
			key: file.key
		}))
	);

	if (fileError) {
		await supabase.from('upload').delete().eq('id', uploadData[0].id);
		await supabase.rpc('update_statistics', {
			upload_size: _.sumBy(redisUpload.files, 'size'),
			file_count: redisUpload.files.length
		});
		return error(500, 'Error inserting files');
	}

	await redis.del(decodedPayload.uploadKey);
	return json({ upload_id: uploadData[0].id });
}
