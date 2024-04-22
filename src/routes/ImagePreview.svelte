<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	let imageLoaded = false;
	let open = false;
	let imageName = '';
	let imageUrl = '';

	export function loadImage(name: string, url: string) {
		open = true;
		imageName = name;
		imageUrl = url;
	}
</script>

<Dialog.Root
	{open}
	onOpenChange={() => {
		open = false;
		imageLoaded = false;
	}}
>
	<Dialog.Content class="flex h-full max-h-[600px] w-full max-w-[600px] flex-col">
		<Dialog.Header>
			<Dialog.Title class="text-md text-primary">{imageName}</Dialog.Title>
		</Dialog.Header>
		<div class="flex h-full items-center justify-center overflow-hidden">
			<img class=" h-full w-full object-contain" loading="lazy" src={imageUrl} alt="preview" />
		</div>
	</Dialog.Content>
</Dialog.Root>
