<script lang="ts">
	import type { PageData } from './$types';
	import { downloadZip } from 'client-zip';
	import streamSaver from 'streamsaver';
	import { DownloadStream } from 'dl-stream';
	import _ from 'lodash';
	export let data: PageData;
	let fileUrls = [];

	//TODO: Solution for files larger than 4GB
	//TODO: Prevent opening new tab if file is not found

	//If file is less than 1GB, download it with link, else download it with streamSaver
	async function getDownloadUrl(file) {
		const res = await fetch(`/api/transfer/download`, {
			method: 'POST',
			body: JSON.stringify({ name: file.name, type: file.type, key: file.key })
		});
		const data = await res.json();
		var a = document.createElement('a');
		a.href = data.signed_get_url;
		a.download;
		a.click();
		a.remove();
	}

	//TODO:
	async function downloadAll(file) {
		const res = await fetch(`/api/transfer/download`, {
			method: 'POST',
			body: JSON.stringify({ name: file.name, type: file.type, key: file.key })
		});
		const data = await res.json();
		let fileParams = {
			name: file.name,
			input: await fetch(data.signed_get_url),
			size: file.size
		};
		let idk = [fileParams];
		console.log(fileParams);
		let as = new Request(data.signed_get_url);
		downloadZip(new DownloadStream([as])).body.pipeTo(
			streamSaver.createWriteStream(`transfer.zip`, { size: 150 * 1024 * 1024 })
		);
	}
</script>

<div class="flex flex-col">
	{#each data.files as file}
		<div class="flex justify-between space-x-4">
			<p class="font-semibold">{file.name}</p>
			<p>{file.type}</p>
			<p>{file.size}</p>
			<button on:click={() => getDownloadUrl(file)}>Download</button>
		</div>
		<button on:click={() => downloadAll(data.files[0])}>Download all</button>
	{/each}
</div>
