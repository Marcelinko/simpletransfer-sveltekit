import axios from 'axios';
import _ from 'lodash';

export default class Upload {
	options: { files: File[]; expires_in: number };
	uploadToken: string | null;
	parts: any;
	currentPart: number;
	putUrls: any[];
	maxParallelUploads: number;
	activeUploads: number;
	progressCache: any[];
	abortController: AbortController;
	uploadSize: number;
	chunkSize: number;

	onProgressFn: (progress: { percentage: number; loaded: number }) => void;
	onCompleteFn: () => void;
	onErrorFn: () => void;

	constructor(options: { files: File[]; expires_in: number }) {
		this.options = options;
		//TODO: Add title, description, expires
		this.uploadToken = null;
		this.parts = [];
		this.currentPart = 0;
		this.putUrls = [];
		this.maxParallelUploads = 5;
		this.activeUploads = 0;
		this.progressCache = [];
		this.abortController = new AbortController();
		this.uploadSize = _.sumBy(this.options.files, 'size');
		this.chunkSize = 1024 * 1024 * 15;

		this.onProgressFn = () => {};
		this.onCompleteFn = () => {};
		this.onErrorFn = () => {};
	}

	async initializeUpload() {
		await axios
			.post('/api/transfer/initialize', {
				expires_in: this.options.expires_in,
				files: this.options.files.map((file) => ({
					name: file.name,
					size: file.size,
					type: file.type
				}))
			})
			.then(async (response) => {
				const { data } = response;
				this.uploadToken = data.upload_token;
				this.parts = this.getFileParts(data.files);
				await this.getUrlBatch();
				await this.startUpload();
			})
			.catch((e) => {
				console.error(e);
			});
	}

	async startUpload() {
		if (this.parts.length > 0) {
			await this.getUrlBatch();
		}
		this.nextPart();
	}

	getPart() {
		for (let i = 0, parts = 0; i < this.options.files.length; i++) {
			if (this.options.files[i].size > this.chunkSize) {
				for (let j = 0; j < Math.ceil(this.options.files[i].size / this.chunkSize); j++) {
					if (parts + j === this.currentPart) {
						return this.options.files[i].slice(j * this.chunkSize, (j + 1) * this.chunkSize);
					}
				}
				parts += Math.ceil(this.options.files[i].size / this.chunkSize);
			} else {
				if (parts === this.currentPart) {
					return this.options.files[i];
				}
				parts++;
			}
		}
	}

	async nextPart() {
		if (this.activeUploads >= this.maxParallelUploads) {
			return;
		}
		if (this.putUrls.length <= 4 && this.parts.length !== 0) {
			await this.getUrlBatch();
		}
		const part = this.getPart();

		if (!part) {
			if (this.activeUploads === 0) {
				await this.completeUpload();
				//TODO: Call api for completion
				//this.onCompleteFn();
			}
			return;
		}
		this.uploadPart(part, this.currentPart).then(() => this.nextPart());
	}

	//TODO: Headers for Content-Length
	async uploadPart(part, partNumber) {
		this.activeUploads++;
		this.currentPart++;
		const url = this.putUrls.shift();
		this.nextPart();
		await axios
			.put(url.signed_put_url, part, {
				signal: this.abortController.signal,
				onUploadProgress: (progressEvent) => {
					this.progressCache[partNumber] = progressEvent.loaded;
					const uploadedBytes = _.sum(this.progressCache);
					const percentage = Math.round((uploadedBytes / this.uploadSize) * 100);
					this.onProgressFn({
						percentage,
						loaded: uploadedBytes
					});
				}
			})
			.then((response) => {
				this.activeUploads--;
			})
			.catch((e) => {
				console.error(e);
			});
	}

	getFileParts(files) {
		return files.flatMap((file) => {
			if (file.multipart) {
				return file.multipart.chunks.map((chunk, index) => {
					return {
						size: chunk.size,
						key: file.key,
						part_number: index + 1,
						upload_id: file.multipart.upload_id
					};
				});
			} else {
				return {
					size: file.size,
					key: file.key
				};
			}
		});
	}

	async getUrlBatch() {
		const slicedParts = this.parts.splice(0, 4);
		const putUrls = await this.getSignedUrls(slicedParts);
		this.putUrls = [...this.putUrls, ...putUrls];
	}

	async getSignedUrls(parts) {
		return await axios
			.post(
				'/api/transfer/sign',
				{ parts },
				{ headers: { Authorization: `Bearer ${this.uploadToken}` } }
			)
			.then((response) => response.data)
			.catch((e) => {
				console.error(e);
			});
	}

	async completeUpload() {
		await axios
			.post(
				'/api/transfer/finalize',
				{},
				{ headers: { Authorization: `Bearer ${this.uploadToken}` } }
			)
			.then((response) => {
				this.onCompleteFn(response.data.upload_id);
			})
			.catch((e) => {
				console.error(e);
			});
	}

	//TODO: also abort if error occurs
	async abortUpload() {
		//TODO: Call api for abortion
		this.abortController.abort();
	}

	onProgress(onProgress) {
		this.onProgressFn = onProgress;
		return this;
	}

	onComplete(onComplete) {
		this.onCompleteFn = onComplete;
		return this;
	}

	onError(onError) {
		this.onErrorFn = onError;
		return this;
	}
}
