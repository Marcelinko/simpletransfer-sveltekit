<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Table from '$lib/components/ui/table/index.js';
	import { X } from 'lucide-svelte';
	import SizeLimit from './SizeLimit.svelte';
	import Upload from '$lib/utils/uploadHandler';
	import _ from 'lodash';

	let upload;
	//TODO: Move to types

	export let data: PageData;
	let files = [];
	$: size = files.reduce((acc, file) => acc + file.size, 0);

	function addFiles(newFiles) {
		files = _.unionBy(files, newFiles, 'name');
	}

	function removeFile(index: number) {
		files = files.filter((_, i) => i !== index);
	}

	function handleFileSelection(e) {
		addFiles(e.target.files);
	}

	function addMoreFiles(e) {
		addFiles(e.target.files);
	}

	function handleDrop(e) {
		e.preventDefault();
		addFiles(e.dataTransfer.files);
	}

	function preventDefaults(e) {
		e.preventDefault();
		e.stopPropagation();
	}

	function handleDragEnter(e) {
		preventDefaults(e);
	}

	function formatBytes(bytes: number, decimals = 2) {
		if (!+bytes) return '0 Bytes';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
	}

	function initializeTransfer() {
		const options = {
			files,
			expires_in: 60 * 60
		};
		upload = new Upload(options);
		upload.onProgress = (progress) => {
			console.log(progress);
		};
		upload.initializeUpload();
	}
</script>

<main class="flex items-center justify-center">
	<Tabs.Root class="h-full w-full max-w-[550px]" value="upload">
		<Tabs.List class="grid w-full grid-cols-2">
			<Tabs.Trigger value="upload">Upload</Tabs.Trigger>
			<Tabs.Trigger value="download">Download</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="upload">
			<Card.Root class="h-full">
				<Card.Content class="space-y-2">
					{#if files.length === 0}
						<div class="flex w-full items-center justify-center">
							<label
								on:drop={handleDrop}
								on:dragenter={handleDragEnter}
								for="dropzone-file"
								class="dark:hover:bg-bray-800 flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-all duration-300 ease-in-out hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600"
							>
								<input
									id="dropzone-file"
									type="file"
									class="hidden"
									multiple
									on:change={handleFileSelection}
								/>
							</label>
						</div>
					{:else}
						{#each files as file, index}
							<div class="flex items-center justify-between">
								<p>{file.name}</p>
								<p>{formatBytes(file.size)}</p>
								<Button variant="outline" on:click={() => removeFile(index)}>
									<X size="24" class="text-red-500" />
								</Button>
							</div>
						{/each}
					{/if}
				</Card.Content>
				<Card.Footer class="flex justify-between">
					<SizeLimit {size} />
					<Button on:click={initializeTransfer}>Upload</Button>
					<input multiple on:change={addMoreFiles} type="file" />
				</Card.Footer>
			</Card.Root>
		</Tabs.Content>
		<Tabs.Content value="download">
			<Card.Root>
				<Card.Content class="space-y-2">
					<Label for="code">Enter your code</Label>
					<Input id="code" placeholder="Code..." />
				</Card.Content>
				<Card.Footer class="flex justify-center">
					<Button>Download</Button>
				</Card.Footer>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</main>
