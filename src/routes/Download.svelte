<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { goto } from '$app/navigation';
	import { Loader, ScanEye } from 'lucide-svelte';
	import QRScanner from './QRScanner.svelte';

	let code = '';
	let loading = false;
	let scanner: any;

	function viewTransfer() {
		loading = true;
		goto(`/transfer/${code}`);
	}

	function scan(e: CustomEvent<string>) {
		const url = e.detail;
		code = url.split('/').pop() || '';
		if (code) {
			viewTransfer();
		}
	}
</script>

<Card.Root class="flex h-full flex-col items-center">
	<QRScanner on:scanResult={scan} bind:this={scanner} />
	<Card.Content class="flex h-full max-w-[300px]  flex-col justify-center space-y-2">
		<Label for="code">Enter your code</Label>
		<div class="flex justify-between">
			<Input class="w-9/12" bind:value={code} id="code" placeholder="Code..." />
			<Tooltip.Root>
				<Tooltip.Trigger asChild let:builder>
					<Button
						on:click={() => scanner.openScanner()}
						builders={[builder]}
						variant="outline"
						size="icon"
					>
						<ScanEye class="h-5 w-5" />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Scan code</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</div>
	</Card.Content>
	<Card.Footer class="flex justify-center">
		{#if loading}
			<Button disabled>
				Loading <Loader class="ml-2 h-4 w-4 animate-spin" /></Button
			>
		{:else}
			<Button on:click={viewTransfer}>Download</Button>
		{/if}
	</Card.Footer>
</Card.Root>
