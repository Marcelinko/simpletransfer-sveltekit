<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { getAppState } from '$lib/state.svelte';
	export let uploadSettings;
	const appState = getAppState();

	function gotoSelectFiles() {
		appState.update((currentState) => {
			return { ...currentState, window: 'selectFiles' };
		});
	}

	function gotoUploadProgress() {
		appState.update((currentState) => {
			return { ...currentState, window: 'uploadProgress' };
		});
	}
</script>

<Card.Root class="flex h-full flex-col">
	<Card.Content class="items flex h-full flex-col justify-center space-y-2">
		<Label for="title">Title</Label>
		<Input id="title" bind:value={uploadSettings.title} placeholder="title" class="max-w-xs" />
		<Label for="description">Description</Label>
		<Input
			id="description"
			bind:value={uploadSettings.description}
			placeholder="description"
			class="max-w-xs"
		/>
	</Card.Content>
	<Card.Footer class="flex justify-between">
		<Button variant="outline" on:click={gotoSelectFiles}>Back</Button>
		<Button on:click={gotoUploadProgress}>Upload</Button>
	</Card.Footer>
</Card.Root>
