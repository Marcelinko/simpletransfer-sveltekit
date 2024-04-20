<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { goto } from '$app/navigation';
	import { Loader } from 'lucide-svelte';
	let code = '';
	let loading = false;

	function viewTransfer() {
		loading = true;
		goto(`/transfer/${code}`);
	}
</script>

<Card.Root class="flex h-full flex-col">
	<Card.Content class="h-full space-y-2">
		<Label for="code">Enter your code</Label>
		<Input bind:value={code} id="code" placeholder="Code..." />
	</Card.Content>
	<Card.Footer class="flex justify-center">
		{#if loading}
			<Button disabled>
				<Loader class="mr-2 h-4 w-4 animate-spin" />
				Loading</Button
			>
		{:else}
			<Button on:click={viewTransfer}>Download</Button>
		{/if}
	</Card.Footer>
</Card.Root>
