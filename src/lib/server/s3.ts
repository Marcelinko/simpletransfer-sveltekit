import { S3Client } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';

const s3 = new S3Client({
	region: 'auto',
	endpoint: env.SECRET_R2_URL,
	credentials: {
		accessKeyId: env.SECRET_ACCESS_KEY_ID,
		secretAccessKey: env.SECRET_ACCESS_KEY_SECRET
	}
});

export default s3;
