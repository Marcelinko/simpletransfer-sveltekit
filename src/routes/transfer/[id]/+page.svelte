<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { beforeNavigate, goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { downloadZip } from 'client-zip';
	import streamSaver from 'streamsaver';
	import { getAppState } from '$lib/state.svelte';
	import { X, Download } from 'lucide-svelte';
	export let data: PageData;
	const appState = getAppState();
	streamSaver.mitm = 'https://simpletransfer.github.io/StreamSaver.js/mitm.html';

	//TODO: https://github.com/whatwg/fs, https://wicg.github.io/file-system-access/

	type File = {
		name: string;
		type: string;
		size: number;
		key: string;
		download_url: string;
	};

	function gotoSelectFiles() {
		appState.update((currentState) => {
			return { ...currentState, window: 'selectFiles' };
		});
		goto('/');
	}

	function formatBytes(bytes: number, decimals = 2) {
		if (!+bytes) return '0 Bytes';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
	}

	//TODO: Get info if files are currently downloading, so we can handle on beforeUnload
	async function downloadFile(file: File) {
		const fileStream = streamSaver.createWriteStream(file.name, { size: file.size });
		fetch(file.download_url).then((res) => {
			const readableStream = res.body;
			if (window.WritableStream && readableStream && readableStream.pipeTo) {
				return readableStream.pipeTo(fileStream);
			}
			const writer = fileStream.getWriter();
			const reader = res.body!.getReader();
			const pump = () =>
				reader.read().then((res): void | Promise<void> =>
					//TODO: Check if file was downloaded
					res.done ? writer.close() : writer.write(res.value).then(pump)
				);
			pump();
		});
	}

	async function downloadAllZip() {
		const files = data.files.map(async (file) => {
			return {
				name: file.name,
				input: await fetch(file.download_url)
			};
		});
		downloadZip(files)
			.body!.pipeTo(
				streamSaver.createWriteStream(`transfer${data.upload.id}.zip`, {
					size: data.upload.upload_size
				})
			)
			//TODO: Warning if file is still downloading, also add onUnmount
			.then(() => console.log('Finished downloading zip'));
	}

	// beforeNavigate(({ from, to, cancel }) => {
	// 	if (!confirm('Leave without saving ?')) {
	// 		cancel();
	// 	}
	// });
</script>

<main class="flex h-dvh items-center justify-center">
	<Card.Root class="flex h-full max-h-[500px] w-full max-w-[700px] flex-col">
		<Card.Header class="flex items-end">
			<Card.Title>
				<Button variant="outline" size="icon" on:click={gotoSelectFiles}>
					<X class="h-4 w-4" />
				</Button>
			</Card.Title>
		</Card.Header>
		<Card.Content class="h-full overflow-hidden">
			<ScrollArea class="h-full">
				{#each data.files as file}
					<div class="m-2 mr-4 flex items-center justify-between gap-2 rounded-md bg-secondary p-2">
						<div>
							<p>{file.name}</p>
							<p>{formatBytes(file.size)}</p>
						</div>
						<Button variant="outline" size="icon" on:click={() => downloadFile(file)}>
							<Download class="h-4 w-4" />
						</Button>
					</div>
				{/each}
			</ScrollArea>

			<!-- {#each data.files as file}
				<div class="flex justify-between space-x-4">
					<p class="font-semibold">{file.name}</p>
					<p>{file.type}</p>
					<p>{file.size}</p>
					<button on:click={() => downloadFile(file)}>Download</button>
				</div>
			{/each} -->
		</Card.Content>
		<Card.Footer class="flex justify-center">
			{#if data.files.length > 1}
				<Button on:click={downloadAllZip}>Download all</Button>
			{:else}
				<Button on:click={() => downloadFile(data.files[0])}>Download</Button>
			{/if}
		</Card.Footer>
	</Card.Root>
</main>
