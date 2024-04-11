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
	slicedFiles: any[];
	isGeneratingUrls: boolean;

	onProgressFn: (progress: { percentage: number; loaded: number }) => void;
	onCompleteFn: () => void;
	onErrorFn: () => void;

	constructor(options: { files: File[]; expires_in: number }) {
		this.options = options;
		this.uploadToken = null;
		this.parts = [];
		this.slicedFiles = this.sliceFiles();
		this.putUrls = [];
		this.currentPart = 0;
		this.maxParallelUploads = 5;
		this.activeUploads = 0;
		this.progressCache = [];
		this.abortController = new AbortController();
		this.uploadSize = _.sumBy(this.options.files, 'size');
		this.chunkSize = 1024 * 1024 * 15;
		this.isGeneratingUrls = false;

		this.onProgressFn = () => {};
		this.onCompleteFn = () => {};
		this.onErrorFn = () => {};
	}

	//Get all the keys and multiparts
	async initializeUpload() {
		const res = await fetch('/api/transfer/initialize', {
			method: 'POST',
			body: JSON.stringify({
				title: this.options.title,
				description: this.options.description,
				expires_in: this.options.expires_in,
				files: this.options.files.map((file) => ({
					name: file.name,
					size: file.size,
					type: file.type
				}))
			})
		});
		const data = await res.json();
		this.uploadToken = data.upload_token;
		this.parts = this.getFileParts(data.files);
		console.table(this.parts);
		console.table(this.slicedFiles);
		await this.startUpload();
	}

	//Start upload by getting first batch of "10" presigned urls and process first part
	async startUpload() {
		await this.getUrlBatch();
		this.nextPart();
	}

	//Process part
	async nextPart() {
		//Check for limit of concurrent PUT requests
		if (this.activeUploads >= this.maxParallelUploads) {
			return;
		}
		if (this.putUrls.length <= 5 && this.parts.length !== 0 && !this.isGeneratingUrls) {
			//If all the parts were somehow uploaded before we get new batch, run nextPart again
			await this.getUrlBatch().then(() => this.nextPart());
		}
		const part = this.slicedFiles[this.currentPart];
		if (!part) {
			if (!this.activeUploads) {
				await this.completeUpload();
				//this.onCompleteFn();
			}
			return;
		}
		this.uploadPart(part, this.currentPart);
	}

	async uploadPart(part, partNumber) {
		this.currentPart++;
		this.activeUploads++;
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
			.then(() => {
				this.activeUploads--;
				this.nextPart();
			})
			.catch((e) => {
				console.error(e);
			});
	}

	async getUrlBatch() {
		this.isGeneratingUrls = true;
		const slicedParts = this.parts.splice(0, 10);
		if (!slicedParts) return;
		const putUrls = await this.getSignedUrls(slicedParts);
		this.putUrls.push(...putUrls);
	}

	async getSignedUrls(parts) {
		const res = await fetch('/api/transfer/sign', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.uploadToken}`
			},
			body: JSON.stringify({
				parts
			})
		});
		const uploadUrls = await res.json();
		return uploadUrls;
	}

	async completeUpload() {
		const res = await fetch('/api/transfer/finalize', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.uploadToken}`
			}
		});
		const data = await res.json();
		this.onCompleteFn(data.upload_id);
	}

	//TODO: also abort if error occurs
	async abortUpload() {
		this.abortController.abort();
		await fetch('/api/transfer/abort', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.uploadToken}`
			}
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

	sliceFiles() {
		let slicedFiles = [];
		for (let i = 0; i < this.options.files.length; i++) {
			if (this.options.files[i].size > this.chunkSize) {
				for (let j = 0; j < Math.ceil(this.options.files[i].size / this.chunkSize); j++) {
					slicedFiles.push(
						this.options.files[i].slice(j * this.chunkSize, (j + 1) * this.chunkSize)
					);
				}
			} else {
				slicedFiles.push(this.options.files[i]);
			}
		}
		return slicedFiles;
	}
	// getPart() {
	// 	for (let i = 0, parts = 0; i < this.options.files.length; i++) {
	// 		if (this.options.files[i].size > this.chunkSize) {
	// 			for (let j = 0; j < Math.ceil(this.options.files[i].size / this.chunkSize); j++) {
	// 				if (parts + j === this.currentPart) {
	// 					this.currentPart++;
	// 					return this.options.files[i].slice(j * this.chunkSize, (j + 1) * this.chunkSize);
	// 				}
	// 			}
	// 			parts += Math.ceil(this.options.files[i].size / this.chunkSize);
	// 		} else {
	// 			if (parts === this.currentPart) {
	// 				this.currentPart++;
	// 				return this.options.files[i];
	// 			}
	// 			parts++;
	// 		}
	// 	}
	// }

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
