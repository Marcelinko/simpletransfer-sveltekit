<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { getAppState } from '$lib/state.svelte';
	const appState = getAppState();

	export let password: string;

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

<Card.Root class="flex h-full w-full flex-col">
	<Card.Content class="flex h-full max-w-[300px] flex-col justify-center space-y-2 self-center">
		<Label for="password">Password</Label>
		<Input bind:value={password} id="password" type="password" placeholder="Password" />
		<p class="text-center text-sm italic">
			<span class="text-[#F8333C]">* </span>When uploading sensitive data that you want to keep
			secure, please ensure to use password protection.
		</p>
	</Card.Content>
	<Card.Footer class="flex justify-between">
		<Button variant="outline" on:click={gotoSelectFiles}>Back</Button>
		<Button on:click={gotoUploadProgress}>Upload</Button>
	</Card.Footer>
</Card.Root>
