<script lang="ts">
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import _ from 'lodash';
	import Dropzone from './Dropzone.svelte';
	import { X, Trash, Plus } from 'lucide-svelte';
	import { getAppState } from '$lib/state.svelte';
	import SizeLimit from './UploadSize.svelte';
	const appState = getAppState();
	export let files;

	function gotoUploadSettings() {
		appState.update((currentState) => {
			return { ...currentState, window: 'uploadSettings' };
		});
	}

	$: size = files.reduce((acc, file) => acc + file.size, 0);

	function addFiles(newFiles) {
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
	<Card.Content class="h-full overflow-hidden">
		{#if files.length === 0}
			<Dropzone {addFiles} />
		{:else}
			<ScrollArea class="h-full">
				{#each files as file, index}
					<div class="m-2 mr-4 flex items-center justify-between gap-2 rounded-md bg-secondary p-2">
						<div>
							<p>{file.name}</p>
							<p>{formatBytes(file.size)}</p>
						</div>
						<Button variant="outline" size="icon" on:click={() => removeFile(index)}>
							<X class="h-4 w-4" />
						</Button>
					</div>
				{/each}
			</ScrollArea>
		{/if}
		<input
			id="file-input"
			type="file"
			class="hidden"
			multiple
			on:change={(e) => addFiles(e.target.files)}
		/>
	</Card.Content>
	<Card.Footer class="flex justify-between space-x-2">
		<Button class="gap-2" variant="outline" on:click={addMoreFiles}
			>Add files<Plus class="h-4 w-4" /></Button
		>
		<SizeLimit {size} />
		<div class="flex items-center gap-2">
			<Tooltip.Root>
				<Tooltip.Trigger asChild let:builder>
					<Button builders={[builder]} variant="outline" size="icon" on:click={removeAllFiles}>
						<Trash class="h-4 w-4" />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Remove all files</p>
				</Tooltip.Content>
			</Tooltip.Root>
			{#if files.length === 0}
				<Button disabled>Next</Button>
			{:else}
				<Button on:click={gotoUploadSettings}>Next</Button>
			{/if}
		</div>
	</Card.Footer>
</Card.Root>
