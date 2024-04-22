<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button/index.js';
	import { goto } from '$app/navigation';
</script>

<main class="flex h-dvh flex-col items-center justify-center gap-8">
	<div class="text-center">
		<h1 class="text-2xl text-primary">{$page.status}</h1>
		<h1 class="text-primary">{$page.error?.message}</h1>
	</div>
	<Button class="text-primary" on:click={() => goto('/')} variant="outline">Back to homepage</Button
	>
</main>
