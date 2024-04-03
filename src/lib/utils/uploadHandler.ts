import axios from 'axios';
import _ from 'lodash';

export default class Upload {
	constructor(options) {
		this.options = options;
		//TODO: Add title, description, expires
		this.token = null;
		this.parts = [];
		this.currentPart = 0;
		this.putUrls = [];
		this.maxParallelUploads = 4;
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
				files: this.options.files.map((file) => ({
					name: file.name,
					size: file.size,
					type: file.type
				})),
				expires_in: this.options.expires_in
			})
			.then(async (response) => {
				const { data } = response;
				this.token = data.token;
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
	async uploadPart(part, urlIndex) {
		this.activeUploads++;
		this.currentPart++;
		const url = this.putUrls.shift();
		this.nextPart();
		await axios
			.put(url.signed_put_url, part, {
				signal: this.abortController.signal,
				onUploadProgress: (progressEvent) => {
					console.log(progressEvent.loaded);
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
						partNumber: index + 1,
						uploadId: file.multipart.upload_id
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

	async getSignedUrls(files) {
		return await axios
			.post('/api/transfer/sign', { files }, { headers: { Authorization: `Bearer ${this.token}` } })
			.then((response) => response.data)
			.catch((e) => {
				console.error(e);
			});
	}

	async completeUpload() {
		await axios
			.post('/api/transfer/finalize', {}, { headers: { Authorization: `Bearer ${this.token}` } })
			.then((response) => {
				console.log('Upload complete');
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
