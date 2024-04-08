<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import type { PageData } from './$types';
	import { downloadZip } from 'client-zip';
	import streamSaver from 'streamsaver';
	export let data: PageData;
	streamSaver.mitm = 'https://simpletransfer.github.io/StreamSaver.js/mitm.html';

	//TODO: https://github.com/whatwg/fs, https://wicg.github.io/file-system-access/

	type File = {
		name: string;
		type: string;
		size: number;
		key: string;
		download_url: string;
	};

	//TODO: Get info if files are currently downloading, so we can handle on beforeUnload
	async function downloadFile(file: File) {
		const fileStream = streamSaver.createWriteStream(file.name, { size: file.size });
		fetch(file.download_url).then((res) => {
			const readableStream = res.body;
			if (window.WritableStream && readableStream && readableStream.pipeTo) {
				return readableStream.pipeTo(fileStream);
			}
			const writer = fileStream.getWriter();
			const reader = res.body!.getReader();
			const pump = () =>
				reader
					.read()
					.then((res): void | Promise<void> =>
						res.done ? writer.close() : writer.write(res.value).then(pump)
					);
			pump();
		});
	}

	async function downloadAllZip() {
		const files = data.files.map(async (file) => {
			return {
				name: file.name,
				input: await fetch(file.download_url)
			};
		});
		downloadZip(files).body!.pipeTo(
			streamSaver.createWriteStream(`transfer${data.upload.id}.zip`, {
				size: data.upload.upload_size
			})
		);
	}

	beforeNavigate(({ from, to, cancel }) => {
		if (!confirm('Leave without saving ?')) {
			cancel();
		}
	});
</script>

<div class="flex flex-col">
	{#each data.files as file}
		<div class="flex justify-between space-x-4">
			<p class="font-semibold">{file.name}</p>
			<p>{file.type}</p>
			<p>{file.size}</p>
			<button on:click={() => downloadFile(file)}>Download</button>
		</div>
	{/each}
	<button on:click={downloadAllZip}>Download all</button>
</div>
