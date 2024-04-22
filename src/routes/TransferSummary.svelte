<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { goto } from '$app/navigation';
	import { getAppState } from '$lib/state.svelte';
	import { Loader, Copy } from 'lucide-svelte';
	import QRCode from 'qrcode';
	import { toast } from 'svelte-sonner';
	import { env } from '$env/dynamic/public';

	const appState = getAppState();
	let loading = false;
	let QRImg = '';

	function gotoSelectFiles() {
		appState.update((currentState) => {
			return { ...currentState, window: 'selectFiles' };
		});
	}

	function copyTransferUrl() {
		navigator.clipboard.writeText(env.PUBLIC_BASE_URL + $appState.uploadId);
		toast.success('Url copied to clipboard');
	}

	QRCode.toDataURL(env.PUBLIC_BASE_URL + $appState.uploadId)
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
		<p class="relative text-lg font-semibold" style="margin-bottom: 20px;">
			{$appState.uploadId}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button on:click={copyTransferUrl} class=" h-8 w-8 p-1" size="icon" variant="ghost">
						<Copy class="h-4 w-4" />
					</Button></Tooltip.Trigger
				>
				<Tooltip.Content>
					<p>Copy transfer url</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</p>
		<div class="overflow-hidden rounded-sm">
			<img class="h-full w-full" src={QRImg} alt="QR Code" />
		</div>
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
