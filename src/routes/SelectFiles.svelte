<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import _ from 'lodash';
	import Dropzone from './Dropzone.svelte';
	import { X, Trash, Plus } from 'lucide-svelte';
	import { env } from '$env/dynamic/public';
	import { getAppState } from '$lib/state.svelte';
	import SizeLimit from './UploadSize.svelte';
	const appState = getAppState();
	export let files: File[];

	function gotoUploadProgress() {
		appState.update((currentState) => {
			return { ...currentState, window: 'uploadProgress' };
		});
	}

	$: size = files.reduce((acc, file) => acc + file.size, 0);

	function addFiles(newFiles: File[]) {
		files = _.unionBy(files, newFiles, 'name');
	}

	function removeFile(index: number) {
		files = files.filter((_, i) => i !== index);
	}

	function addMoreFiles() {
		const fileInput = document.getElementById('file-input');
		if (fileInput) {
			fileInput.click();
		}
	}

	function removeAllFiles() {
		files = [];
	}

	function onFilesChange(e: any) {
		addFiles(e.target.files);
	}

	function formatBytes(bytes: number, decimals = 2) {
		if (!+bytes) return '0 Bytes';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
	}

	let progress = 0;
	setInterval(() => {
		progress += Math.floor(Math.random() * 2 + 1);
	}, 100);
</script>

<Card.Root class="flex h-full flex-col">
	<Card.Content class=" h-full overflow-x-hidden p-0 md:p-2">
		{#if files.length === 0}
			<Dropzone {addFiles} />
		{:else}
			<div class="px-2">
				{#each files as file, index}
					<div
						class="my-2 flex w-full items-center justify-between rounded-md border border-secondary px-4 py-2"
					>
						<div class="overflow-hidden">
							<p class="truncate font-semibold">{file.name}</p>
							<p class="truncate">{formatBytes(file.size)}</p>
						</div>
						<Button
							class="h-6 w-6 p-1"
							variant="ghost"
							size="icon"
							on:click={() => removeFile(index)}
						>
							<X class="h-4 w-4" />
						</Button>
					</div>
				{/each}
			</div>
		{/if}

		<input id="file-input" type="file" class="hidden" multiple on:change={onFilesChange} />
	</Card.Content>
	<Card.Footer class="space flex flex-col items-center justify-between gap-4 pt-2 md:flex-row">
		<Button class="order-1 gap-2" variant="outline" on:click={addMoreFiles}
			>Add files<Plus class="h-4 w-4" /></Button
		>
		<SizeLimit {size} />
		<div class="order-2 flex items-center gap-2">
			<Tooltip.Root>
				<Tooltip.Trigger asChild let:builder>
					<Button
						class="order-0"
						builders={[builder]}
						variant="outline"
						size="icon"
						on:click={removeAllFiles}
					>
						<Trash class="h-4 w-4" />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Remove all files</p>
				</Tooltip.Content>
			</Tooltip.Root>
			{#if files.length === 0 || _.sumBy(files, 'size') > Number(env.PUBLIC_MAX_UPLOAD_SIZE)}
				<Button disabled>Next</Button>
			{:else}
				<Button on:click={gotoUploadProgress}>Next</Button>
			{/if}
		</div>
	</Card.Footer>
</Card.Root>
