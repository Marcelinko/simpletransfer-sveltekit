<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { goto } from '$app/navigation';
	import { getAppState } from '$lib/state.svelte';
	import { Loader } from 'lucide-svelte';
	import QRCode from 'qrcode';
	const appState = getAppState();
	let loading = false;
	let QRImg = '';

	function gotoSelectFiles() {
		appState.update((currentState) => {
			return { ...currentState, window: 'selectFiles' };
		});
	}

	QRCode.toDataURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
		.then((url) => {
			QRImg = url;
		})
		.catch((err) => console.log(err));

	function viewTransfer() {
		loading = true;
		goto(`/transfer/${$appState.uploadId}`);
	}
</script>

<Card.Root class="flex h-full flex-col">
	<Card.Content class="flex h-full flex-col items-center justify-center space-y-2">
		<h2 class="text-lg font-semibold text-primary">Your code</h2>
		<p class="text-lg font-semibold">{$appState.uploadId}</p>
		<img class="h-full max-h-[200px] w-full max-w-[200px]" src={QRImg} alt="QR Code" />
		{#if loading}
			<Button disabled variant="link"
				>Loading files<Loader class="ml-2 h-4 w-4 animate-spin" /></Button
			>
		{:else}
			<Button on:click={viewTransfer} variant="link">View transfer</Button>
		{/if}
	</Card.Content>
	<Card.Footer class="flex justify-center">
		<Button variant="outline" on:click={gotoSelectFiles}>New transfer</Button>
	</Card.Footer>
</Card.Root>
