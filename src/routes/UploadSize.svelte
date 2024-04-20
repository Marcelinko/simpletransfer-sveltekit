<script lang="ts">
	import { Progress } from '$lib/components/ui/progress/index.js';
	import { env } from '$env/dynamic/public';
	export let size: number;

	function formatBytes(bytes: number, decimals = 2, suffix = false) {
		const megabytes = bytes / (1024 * 1024);
		if (megabytes < 1) {
			return 0;
		} else {
			return megabytes.toFixed(megabytes % 1 === 0 ? 0 : decimals) + (suffix ? ' MB' : '');
		}
	}
</script>

<div class="relative w-full max-w-[200px] rounded-md text-center">
	<span class="absolute -top-3 left-1/2 z-10 m-0 w-full -translate-x-1/2 p-0 text-sm font-bold">
		{formatBytes(size)}/{formatBytes(Number(env.PUBLIC_MAX_UPLOAD_SIZE), 2, true)}
	</span>
	<Progress
		indicatorColor={size < Number(env.PUBLIC_MAX_UPLOAD_SIZE) ? 'bg-green-600' : 'bg-red-600'}
		class="h-3"
		value={size}
		max={Number(env.PUBLIC_MAX_UPLOAD_SIZE)}
	/>
</div>
