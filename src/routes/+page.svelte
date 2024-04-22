<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import _ from 'lodash';
	import SelectFiles from './SelectFiles.svelte';
	import UploadProgress from './UploadProgress.svelte';
	import Download from './Download.svelte';
	import TransferSummary from './TransferSummary.svelte';
	import { getAppState } from '$lib/state.svelte';
	import { fade } from 'svelte/transition';
	import { env } from '$env/dynamic/public';
	const appState = getAppState();

	let files: File[] = [];
</script>

<svelte:head>
	<title>Effortless File Uploads & Instant Shareable URLs</title>
	<meta
		content="Easily send files hassle-free! Say goodbye to slow uploads and hello to speedy transfers."
		name="description"
	/>
	<meta content="Effortless File Uploads & Instant Shareable URLs" property="og:title" />
	<meta
		content="Easily send files hassle-free! Say goodbye to slow uploads and hello to speedy transfers."
		property="og:description"
	/>
	<meta content={env.PUBLIC_BASE_URL} property="og:url" />
	<meta content="Effortless File Uploads & Instant Shareable URLs" property="twitter:title" />
	<meta
		content="Easily send files hassle-free! Say goodbye to slow uploads and hello to speedy transfers."
		property="twitter:description"
	/>
	<meta content="#000" name="theme-color" />
	<meta name="google-site-verification" content="bmCqEtO6mqJAoUB0xnVsSoxcEeiYCnV9V0HnfQ9agLc" />
</svelte:head>

<main class="flex h-dvh items-center justify-center">
	{#if $appState.window === 'selectFiles'}
		<div
			in:fade={{ duration: 300, delay: 300 }}
			out:fade={{ duration: 300 }}
			class="absolute flex h-full w-full max-w-[700px] md:max-h-[500px]"
		>
			<Tabs.Root class="flex w-full flex-col">
				<Tabs.List class="grid w-full grid-cols-2">
					<Tabs.Trigger value="upload">Upload</Tabs.Trigger>
					<Tabs.Trigger value="download">Download</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content class="h-full w-full overflow-y-hidden" value="upload">
					<SelectFiles bind:files />
				</Tabs.Content>
				<Tabs.Content class="h-full" value="download">
					<Download />
				</Tabs.Content>
			</Tabs.Root>
		</div>
	{:else if $appState.window === 'uploadProgress'}
		<div
			in:fade={{ duration: 300, delay: 300 }}
			out:fade={{ duration: 300 }}
			class="absolute h-full w-full max-w-[700px] md:max-h-[500px]"
		>
			<UploadProgress bind:files />
		</div>
	{:else if $appState.window === 'transferSummary'}
		<div
			in:fade={{ duration: 300, delay: 300 }}
			out:fade={{ duration: 300 }}
			class="absolute h-full w-full max-w-[700px] md:max-h-[500px]"
		>
			<TransferSummary />
		</div>
	{/if}
</main>
