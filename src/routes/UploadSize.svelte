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

<div
	class="flex h-full w-full max-w-[200px] flex-col items-center justify-between rounded-md md:order-1"
>
	<span>
		{formatBytes(size)}/{formatBytes(Number(env.PUBLIC_MAX_UPLOAD_SIZE), 2, true)}
	</span>
	<Progress
		indicatorColor={size < Number(env.PUBLIC_MAX_UPLOAD_SIZE) ? 'bg-[#C3F73A]' : 'bg-[#F8333C]'}
		class="h-3"
		value={size}
		max={Number(env.PUBLIC_MAX_UPLOAD_SIZE)}
	/>
</div>
