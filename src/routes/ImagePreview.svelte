<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Loader } from 'lucide-svelte';
	import { afterUpdate } from 'svelte';
	let open = false;
	let image = { name: '', url: '' };
	let imgLoaded = false;
	let imgElem: HTMLImageElement;

	export function openImage(name: string, url: string) {
		imgLoaded = false;
		open = true;
		image.name = name;
		image.url = url;
	}

	function loadImage() {
		if (open) {
			let img = new Image();
			img.onload = () => {
				imgLoaded = true;
				if (imgElem) {
					imgElem.src = img.src;
				}
			};
			img.src = image.url;
		}
	}

	$: afterUpdate(loadImage);
</script>

<Dialog.Root
	{open}
	onOpenChange={() => {
		open = false;
	}}
>
	<Dialog.Content class="flex h-full max-h-[600px] w-full max-w-[600px] flex-col">
		<Dialog.Header>
			<Dialog.Title class="text-md max-w-[95%] overflow-hidden text-ellipsis text-primary"
				>{image.name}</Dialog.Title
			>
		</Dialog.Header>
		<div class="flex h-full items-center justify-center overflow-hidden">
			{#if imgLoaded}
				<img bind:this={imgElem} class="h-full w-full object-contain" alt="preview" />
			{:else}
				<Loader class="h-6 w-6 animate-spin" />
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
