<script lang="ts">
	import { page } from '$app/stores';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
</script>

<main class="flex h-dvh items-center justify-center">
	<div in:fade={{ duration: 300 }} class="absolute h-full w-full max-w-[700px] md:max-h-[500px]">
		<Card.Root class="flex h-full flex-col">
			<Card.Content class="flex h-full w-full flex-col items-center justify-center">
				<h1 class=" text-2xl">{$page.status}</h1>
				<h1>{$page.error?.message}</h1>
			</Card.Content>
			<Card.Footer class="flex justify-center">
				<Button on:click={() => goto('/')} variant="outline">New upload</Button>
			</Card.Footer>
		</Card.Root>
	</div>
</main>
