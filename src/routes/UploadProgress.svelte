<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Loader } from 'lucide-svelte';
	import Upload from '$lib/utils/uploadHandler';
	import { onDestroy, onMount } from 'svelte';
	import { getAppState } from '$lib/state.svelte';
	import CircularProgress from './CircularProgress.svelte';

	export let files: File[];
	const appState = getAppState();
	let timeout: ReturnType<typeof setTimeout>;
	let error: string;
	let upload: Upload;
	let progress = 0;
	let finalizing = false;

	function completeUpload(uploadId: string) {
		appState.set({ window: 'transferSummary', uploadId });
	}

	function gotoSelectFiles() {
		appState.update((currentState) => {
			return { ...currentState, window: 'selectFiles' };
		});
	}

	function cancelUpload() {
		if (upload) {
			upload.abortUpload();
		}
		gotoSelectFiles();
	}

	function initializeTransfer() {
		const options = {
			title: '',
			description: '',
			expires_in: 86400,
			files
		};
		upload = new Upload(options);
		upload.onProgress((newProgress) => {
			progress = newProgress.percentage;
		});
		upload.onFinalizing(() => {
			finalizing = true;
		});
		upload.onComplete((uploadId) => {
			files = [];
			completeUpload(uploadId);
		});
		upload.onError(() => {
			error = 'Something went wrong';
			timeout = setTimeout(() => {
				gotoSelectFiles();
			}, 1500);
		});
		upload.initializeUpload();
	}

	onMount(() => {
		if (files.length === 0) {
			error = 'No files provided';
			timeout = setTimeout(() => {
				gotoSelectFiles();
			}, 1500);
		} else if (files.length > 250) {
			error = `Maximum 250 files per transfer`;
			timeout = setTimeout(() => {
				gotoSelectFiles();
			}, 1500);
		} else {
			initializeTransfer();
		}
	});

	onDestroy(() => {
		clearTimeout(timeout);
	});
</script>

<Card.Root class="flex h-full flex-col">
	<Card.Content class="flex h-full flex-col items-center justify-center space-y-2">
		{#if error}
			<p>{error}</p>
		{:else if finalizing}
			<div class="flex animate-pulse items-center gap-2">
				<Loader class="h-6 w-6 animate-spin" />
				<p>Finalizing</p>
			</div>
			<p class="animate-pulse text-center italic">If this takes too long, please try again</p>
		{:else}
			<CircularProgress {progress} />
		{/if}
	</Card.Content>
	<Card.Footer class="flex justify-center">
		<Button class="font-bold uppercase" variant="ghost" on:click={cancelUpload}>Cancel</Button>
	</Card.Footer>
</Card.Root>
