<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { PageData } from './$types';
	import { Download, RotateCw, Eye } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import ImagePreview from '../../ImagePreview.svelte';
	import { getAppState } from '$lib/state.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	export let data: PageData;
	const appState = getAppState();

	//TODO: https://github.com/whatwg/fs, https://wicg.github.io/file-system-access/

	let downloadZip: any;
	let streamSaver: any;
	let files: File[] = data.files;
	let zipDownloaded = false;
	let imagePreview: any;

	type File = {
		name: string;
		type: string;
		size: number;
		key: string;
		download_url: string;
		downloaded?: boolean;
	};

	onMount(async () => {
		downloadZip = (await import('client-zip')).downloadZip;
		streamSaver = await import('streamsaver');
		streamSaver.mitm = 'https://simpletransfer.github.io/StreamSaver.js/mitm.html';
	});

	function newTransfer() {
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

	function isImage(file: File) {
		return file.type.startsWith('image/');
	}

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
				reader
					.read()
					.then((res): void | Promise<void> =>
						res.done ? writer.close() : writer.write(res.value).then(pump)
					);
			pump();
		});
		const index = files.findIndex((f) => f === file);
		files[index].downloaded = true;
	}

	async function downloadAllZip() {
		const preppedFiles: any = files.map(async (file: File) => {
			return {
				name: file.name,
				input: await fetch(file.download_url)
			};
		});
		downloadZip(preppedFiles).body!.pipeTo(
			streamSaver.createWriteStream(`transfer${data.upload.id}.zip`, {
				size: data.upload.upload_size
			})
		);
		zipDownloaded = true;
	}
</script>

<main class="flex h-dvh items-center justify-center">
	<ImagePreview bind:this={imagePreview} />
	<div in:fade={{ duration: 300 }} class="absolute h-full w-full max-w-[700px] md:max-h-[500px]">
		<Card.Root class="flex h-full flex-col">
			<Card.Content class="h-full overflow-x-hidden p-0 md:p-2">
				<div class="px-2">
					{#each files as file}
						<div
							class="my-2 flex w-full items-center justify-between rounded-md border border-secondary px-4 py-2"
						>
							<div class="overflow-hidden">
								<p class="truncate font-semibold">
									{file.name}
								</p>
								<p class="truncate">{formatBytes(file.size)}</p>
							</div>
							<div class="flex">
								{#if isImage(file)}
									<Button
										on:click={() => imagePreview.loadImage(file.name, file.download_url)}
										class="h-8 w-8 p-1"
										size="icon"
										variant="ghost"
									>
										<Eye class="h-4 w-4" />
									</Button>
								{/if}
								<Button
									on:click={() => downloadFile(file)}
									class="h-8 w-8 p-1"
									size="icon"
									variant="ghost"
								>
									{#if file.downloaded}
										<div in:fade={{ duration: 100 }}>
											<RotateCw class="animate-spin-once h-4 w-4" />
										</div>
									{:else}
										<Download class="h-4 w-4" />
									{/if}
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</Card.Content>
			<Card.Footer class="flex justify-between pt-2">
				<Button class=" invisible" variant="outline">New transfer</Button>
				{#if data.files.length > 1}
					<Button on:click={downloadAllZip}
						>Download all
						{#if zipDownloaded}
							<div in:fade={{ duration: 100 }}>
								<RotateCw class="animate-spin-once ml-2 h-4 w-4" />
							</div>
						{:else}
							<Download class="ml-2 h-4 w-4" />
						{/if}
					</Button>
				{/if}
				<Button on:click={newTransfer} variant="outline">New transfer</Button>
			</Card.Footer>
		</Card.Root>
	</div>
</main>
