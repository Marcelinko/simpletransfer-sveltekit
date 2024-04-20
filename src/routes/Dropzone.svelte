<script lang="ts">
	import { File } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	export let addFiles;
	let hovering = false;

	function handleFileSelection(e) {
		addFiles(e.target.files);
	}

	function onDrop(e) {
		e.preventDefault();
		addFiles(e.dataTransfer.files);
	}

	function onDragOver(e) {
		e.preventDefault();
	}

	function onDragEnter(e) {
		e.preventDefault();
		hovering = true;
	}

	function onDragLeave(e) {
		e.preventDefault();
		hovering = false;
	}
</script>

<div
	class="mt-3 h-full rounded-lg border-2 border-dashed transition-all {hovering
		? 'border-green-400'
		: 'border-secondary'}"
>
	<label
		for="dropzone"
		class="gradient-overlay flex h-full w-full cursor-pointer flex-col items-center justify-center"
		on:drop={onDrop}
		on:dragover={onDragOver}
		on:dragenter={onDragEnter}
		on:dragleave={onDragLeave}
	>
		<div class="pattern h-full w-full">
			<div
				class="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4"
			>
				<File class="h-8 w-8" />
				<div class="flex items-center">
					<p>Drop your files or <span class="text-primary">click here</span></p>
				</div>
			</div>
		</div>
		<input id="dropzone" type="file" class="hidden" multiple on:change={handleFileSelection} />
	</label>
</div>
