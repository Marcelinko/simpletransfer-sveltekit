import { error } from '@sveltejs/kit';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import supabase from '$lib/server/supabase';
import s3 from '$lib/server/s3';

export const load = async ({ params }) => {
	const { data: uploadData, error: uploadError } = await supabase
		.from('upload')
		.select('*')
		.eq('id', params.id);

	if (uploadError) {
		error(500, 'Error fetching data from database');
	}

	if (uploadData.length === 0) {
		error(404, 'Upload not found');
	}

	const uploadExpiry = new Date(uploadData[0].expires);
	if (uploadExpiry.getTime() < Date.now()) {
		error(404, 'Upload expired');
	}

	if (uploadData[0].password) {
		return {
			upload: uploadData[0],
			protected: true
		};
	}

	const { data: fileData, error: fileError } = await supabase
		.from('file')
		.select('name, type, size, key')
		.eq('upload_id', params.id);

	if (fileError) {
		error(500, 'Error fetching data from database');
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

	return {
		upload: uploadData[0],
		files: filesWithDownloadUrls,
		protected: false
	};
};
