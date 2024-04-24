<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import QrScanner from 'qr-scanner';
	import { afterUpdate, createEventDispatcher } from 'svelte';
	let open = false;
	let videoElem: HTMLVideoElement;
	let divElem: HTMLDivElement;
	let scanner: QrScanner;
	let error: string;

	const dispatch = createEventDispatcher();

	export function openScanner() {
		open = true;
	}

	function closeScanner() {
		scanner.destroy();
		open = false;
	}

	function initializeScanner() {
		if (open) {
			if (videoElem && divElem) {
				scanner = new QrScanner(
					videoElem,
					(result) => {
						dispatch('scanResult', result.data);
						closeScanner();
					},
					{
						highlightScanRegion: true
					}
				);
				QrScanner.hasCamera().then((camera) => {
					if (!camera) {
						error = 'No camera available';
					} else {
						scanner.start().catch(() => {
							error = 'Check your permissions';
						});
					}
				});
			}
		}
	}

	$: afterUpdate(initializeScanner);
</script>

<Dialog.Root {open} onOpenChange={() => closeScanner()}>
	<Dialog.Content
		class="flex h-full max-h-[400px] w-full max-w-[400px] flex-col items-center justify-center"
	>
		{#if error}
			<p>{error}</p>
		{:else}
			<video bind:this={videoElem} class="h-full w-full rotate-90"
				><track kind="captions" />
			</video>
			<div bind:this={divElem} class=" absolute rounded-md"></div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
