import axios from 'axios';
import _ from 'lodash';
import { env } from '$env/dynamic/public';

type Options = {
	files: File[];
	title: string;
	description: string;
	expires_in: number;
};

type Part = {
	size: number;
	key: string;
	type?: string;
	part_number?: number;
	upload_id?: string;
};

type PreppedFile = File | Blob;
type ProgressCallback = (progress: { percentage: number; loaded: number }) => void;
type CompleteCallback = (upload_id: string) => void;
type ErrorCallback = () => void;

export default class Upload {
	options: Options; //Input files, title, description, expires_in
	uploadToken: string | null; //JWT holding uploadId
	uploadParts: Part[]; //File parts for getting presigned urls
	currentUploadPart: number; //Current part that needs to be uploaded
	uploadUrls: { signed_put_url: string }[]; //Presigned urls for uploading each part
	preppedFiles: PreppedFile[]; //Input files sliced to match parts
	maxParallelUploads: number; //Maximum number of parallel uploads
	activeUploads: number; //Number of PUT requests uploading parts
	uploadProgressCache: number[]; //Array of uploaded bytes for each part for tracking progress
	abortController: AbortController; //Controller for aborting upload
	uploadSize: number; //Sum of files
	chunkSize: number; //Size of each chunk
	isGeneratingUrls: boolean; //To check if we are already getting new batch

	onProgressFn: ProgressCallback; //Track progress in .svelte page
	onCompleteFn: CompleteCallback; //Get upload_id in .svelte page after all parts are uploaded
	onErrorFn: ErrorCallback; //Get error in .svelte page if something fails

	constructor(options: Options) {
		this.options = options;
		this.abortController = new AbortController();
		this.uploadToken = null;
		this.uploadParts = [];
		this.preppedFiles = [];
		this.uploadUrls = [];
		this.currentUploadPart = 0;
		this.maxParallelUploads = 5;
		this.activeUploads = 0;
		this.uploadProgressCache = [];
		this.uploadSize = _.sumBy(this.options.files, 'size');
		this.chunkSize = Number(env.PUBLIC_CHUNK_SIZE);
		this.isGeneratingUrls = false;

		this.onProgressFn = () => {};
		this.onCompleteFn = () => {};
		this.onErrorFn = () => {};
	}

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
		if (!res.ok) {
			this.onErrorFn();
			return;
		}
		const data = await res.json();
		this.uploadToken = data.upload_token;
		this.uploadParts = data.parts;
		this.preppedFiles = this.getPreppedFiles();
		await this.startUpload();
	}

	async startUpload() {
		await this.getUrlBatch();
		this.isGeneratingUrls = false;
		this.nextPart();
	}

	async nextPart() {
		if (this.activeUploads >= this.maxParallelUploads) {
			return;
		}
		if (this.uploadUrls.length <= 5 && this.uploadParts.length > 0 && !this.isGeneratingUrls) {
			await this.getUrlBatch();
			this.isGeneratingUrls = false;
			this.nextPart();
		}
		const part = this.preppedFiles[this.currentUploadPart];
		if (!part) {
			if (!this.activeUploads) {
				await this.completeUpload();
			}
			return;
		}
		const uploadUrl = this.uploadUrls.shift();
		if (!uploadUrl) {
			return;
		}
		this.uploadPart(uploadUrl, part, this.currentUploadPart);
	}

	async uploadPart(url: { signed_put_url: string }, part: PreppedFile, partIndex: number) {
		this.currentUploadPart++;
		this.activeUploads++;
		this.nextPart();
		await axios
			.put(url.signed_put_url, part, {
				signal: this.abortController.signal,
				onUploadProgress: (progressEvent) => {
					this.uploadProgressCache[partIndex] = progressEvent.loaded;
					const uploadedBytes = _.sum(this.uploadProgressCache);
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
				this.onErrorFn();
				console.error(e);
			});
	}

	async getUrlBatch() {
		this.isGeneratingUrls = true;
		const slicedParts = this.uploadParts.splice(0, 10);
		if (!slicedParts) return;
		const uploadUrls = await this.getSignedUrls(slicedParts);
		this.uploadUrls.push(...uploadUrls);
	}

	async getSignedUrls(parts: Part[]) {
		const res = await fetch('/api/transfer/sign', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.uploadToken}`
			},
			body: JSON.stringify({
				parts
			})
		});
		if (!res.ok) {
			this.onErrorFn();
			return;
		}
		return await res.json();
	}

	async completeUpload() {
		const res = await fetch('/api/transfer/finalize', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.uploadToken}`
			}
		});
		if (!res.ok) {
			this.onErrorFn();
			return;
		}
		const data = await res.json();
		this.onCompleteFn(data.upload_id);
	}

	async abortUpload() {
		this.abortController.abort();
		await fetch('/api/transfer/abort', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.uploadToken}`
			}
		});
	}

	getPreppedFiles() {
		const preppedFiles = [];
		for (let i = 0; i < this.options.files.length; i++) {
			const file = this.options.files[i];
			if (file.size > this.chunkSize) {
				for (let j = 0; j < Math.ceil(file.size / this.chunkSize); j++) {
					preppedFiles.push(file.slice(j * this.chunkSize, (j + 1) * this.chunkSize));
				}
			} else {
				preppedFiles.push(file);
			}
		}
		return preppedFiles;
	}

	onProgress(onProgress: ProgressCallback) {
		this.onProgressFn = onProgress;
		return this;
	}

	onComplete(onComplete: CompleteCallback) {
		this.onCompleteFn = onComplete;
		return this;
	}

	onError(onError: ErrorCallback) {
		this.onErrorFn = onError;
		return this;
	}
}
