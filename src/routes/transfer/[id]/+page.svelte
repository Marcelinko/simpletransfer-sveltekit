<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import type { PageData } from './$types';
	import { Download, RotateCw, Eye, KeyRound, Loader, LockKeyhole, X } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import ImagePreview from '../../ImagePreview.svelte';
	import { getAppState } from '$lib/state.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	export let data: PageData;
	const appState = getAppState();

	//TODO: https://github.com/whatwg/fs, https://wicg.github.io/file-system-access/

	let loading = false;
	let locked = data.protected;
	let password: string;
	let error: string;
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
		streamSaver = (await import('streamsaver')).default;
		if (streamSaver) {
			streamSaver.mitm = 'https://simpletransfer.github.io/StreamSaver.js/mitm.html';
		}
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

	async function unlockTransfer() {
		loading = true;
		const res = await fetch('/api/transfer/files', {
			method: 'POST',
			body: JSON.stringify({
				upload_id: data.upload.id,
				password
			})
		});
		loading = false;
		if (!res.ok) {
			if (res.status === 400) {
				error = 'Password is required';
			}
			if (res.status === 401) {
				error = 'Incorrect password';
			}
			if (res.status === 404) {
				await res.json().then((err) => (error = err.message));
			}
			return;
		}

		await res.json().then((data) => (files = data.files));
		locked = false;
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
	{#if locked}
		<div in:fade={{ duration: 300 }} class="absolute h-full w-full max-w-[700px] md:max-h-[500px]">
			<Card.Root class="flex h-full flex-col">
				<Card.Header>
					<Card.Title>
						<Button on:click={() => goto('/')} class="h-6 w-6 p-1" variant="outline" size="icon">
							<X class="h-4 w-4" />
						</Button>
					</Card.Title>
				</Card.Header>
				<Card.Content
					class="flex h-full max-w-[300px] flex-col justify-center space-y-3 self-center"
				>
					<div class="w-min self-center rounded-md bg-primary p-2">
						<LockKeyhole class="h-6 w-6 text-secondary" />
					</div>
					<p style="margin-bottom: 20px;" class="text-center font-semibold">Upload locked</p>
					<div>
						<Input bind:value={password} id="password" type="password" placeholder="Password" />
						{#if error}
							<p transition:fade={{ duration: 300 }} class="text-sm text-[#F8333C]">{error}</p>
						{/if}
					</div>
				</Card.Content>
				<Card.Footer class="flex justify-center pt-2">
					{#if loading}
						<Button disabled>Loading<Loader class="ml-2 h-4 w-4 animate-spin" /></Button>
					{:else}
						<Button on:click={unlockTransfer}>Unlock<KeyRound class="ml-2 h-4 w-4" /></Button>
					{/if}
				</Card.Footer>
			</Card.Root>
		</div>
	{:else}
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
											on:click={() => imagePreview.openImage(file.name, file.download_url)}
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
												<RotateCw class="h-4 w-4 animate-spin-once" />
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
				{#if files.length > 1}
					<Card.Footer class="flex justify-between pt-2">
						<Button class="hidden md:invisible md:block" variant="outline">New transfer</Button>
						<Button on:click={downloadAllZip}
							>Download all
							{#if zipDownloaded}
								<div in:fade={{ duration: 100 }}>
									<RotateCw class="ml-2 h-4 w-4 animate-spin-once" />
								</div>
							{:else}
								<Download class="ml-2 h-4 w-4" />
							{/if}
						</Button>
						<Button on:click={newTransfer} variant="outline">New transfer</Button>
					</Card.Footer>
				{:else}
					<Card.Footer class="flex justify-center pt-2">
						<Button on:click={newTransfer} variant="outline">New transfer</Button>
					</Card.Footer>
				{/if}
			</Card.Root>
		</div>
	{/if}
</main>
