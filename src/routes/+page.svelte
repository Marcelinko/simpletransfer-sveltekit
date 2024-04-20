<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import _ from 'lodash';
	import SelectFiles from './SelectFiles.svelte';
	import UploadSettings from './UploadSettings.svelte';
	import UploadProgress from './UploadProgress.svelte';
	import Download from './Download.svelte';
	import TransferSummary from './TransferSummary.svelte';
	import { getAppState } from '$lib/state.svelte';
	import { fade, fly, scale } from 'svelte/transition';
	const appState = getAppState();

	let uploadSettings = { title: '', description: '' };
	let files = [];
	let unique = {};
</script>

<main class="flex h-dvh items-center justify-center">
	{#if $appState.window === 'selectFiles'}
		<div
			in:fade={{ duration: 300, delay: 300 }}
			out:fade={{ duration: 300 }}
			class="absolute flex h-full max-h-[500px] w-full max-w-[700px]"
		>
			<Tabs.Root class="flex w-full flex-col">
				<Tabs.List class="grid w-full grid-cols-2">
					<Tabs.Trigger value="upload">Upload</Tabs.Trigger>
					<Tabs.Trigger value="download">Download</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content class="h-full overflow-hidden" value="upload">
					<SelectFiles bind:files />
				</Tabs.Content>
				<Tabs.Content class="h-full" value="download">
					<Download />
				</Tabs.Content>
			</Tabs.Root>
		</div>
	{:else if $appState.window === 'uploadSettings'}
		<div
			in:fade={{ duration: 300, delay: 300 }}
			out:fade={{ duration: 300 }}
			class="absolute h-full max-h-[500px] w-full max-w-[700px]"
		>
			<UploadSettings bind:uploadSettings />
		</div>
	{:else if $appState.window === 'uploadProgress'}
		<div
			in:fade={{ duration: 300, delay: 300 }}
			out:fade={{ duration: 300 }}
			class="absolute h-full max-h-[500px] w-full max-w-[700px]"
		>
			<UploadProgress bind:files {uploadSettings} />
		</div>
	{:else if $appState.window === 'transferSummary'}
		<div
			in:fade={{ duration: 300, delay: 300 }}
			out:fade={{ duration: 300 }}
			class="absolute h-full max-h-[500px] w-full max-w-[700px]"
		>
			<TransferSummary />
		</div>
	{/if}
</main>
