<script lang="ts">
	export let addFiles: (newFiles: File[]) => void;
	let hovering = false;

	function handleFileSelection(e: any) {
		addFiles(e.target.files);
	}

	function onDrop(e: any) {
		e.preventDefault();
		addFiles(e.dataTransfer.files);
	}

	function onDragOver(e: any) {
		e.preventDefault();
	}

	function onDragEnter(e: any) {
		e.preventDefault();
		hovering = true;
	}

	function onDragLeave(e: any) {
		e.preventDefault();
		hovering = false;
	}
</script>

<div
	class="h-full rounded-lg transition-all md:border-2 md:border-dashed {hovering
		? 'border-primary'
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
				<div class="flex items-center text-center">
					<p>Drop your files</p>
				</div>
			</div>
		</div>
		<input id="dropzone" type="file" class="hidden" multiple on:change={handleFileSelection} />
	</label>
</div>
