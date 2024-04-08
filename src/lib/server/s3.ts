import { S3Client } from '@aws-sdk/client-s3';
import {
	SECRET_R2_URL,
	SECRET_ACCESS_KEY_ID,
	SECRET_ACCESS_KEY_SECRET
} from '$env/dynamic/private';

const s3 = new S3Client({
	region: 'auto',
	endpoint: SECRET_R2_URL,
	credentials: {
		accessKeyId: SECRET_ACCESS_KEY_ID,
		secretAccessKey: SECRET_ACCESS_KEY_SECRET
	}
});

export default s3;
