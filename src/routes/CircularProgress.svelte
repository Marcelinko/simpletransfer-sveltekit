<script lang="ts">
	import { onMount } from 'svelte';

	export let progress;

	const radius = 80;
	let circumference;

	onMount(() => {
		circumference = radius * 2 * Math.PI;
	});

	$: offset = circumference - (progress / 100) * circumference;
</script>

<div class="relative h-32 w-32">
	<svg class="animate-spin-slow absolute h-full w-full" viewBox="0 0 180 180">
		<circle
			stroke-width={9}
			fill="transparent"
			class="stroke-current text-gray-300"
			cx="90"
			cy="90"
			r={radius}
		/>
		<circle
			stroke-width={11}
			fill="transparent"
			class="bg-transparent stroke-current text-primary transition-all"
			cx="90"
			cy="90"
			r={radius}
			stroke-dashoffset={offset}
			stroke-dasharray={circumference}
			stroke-linecap="round"
		/>
	</svg>
	<span class="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-800">
		{progress}%
	</span>
</div>
