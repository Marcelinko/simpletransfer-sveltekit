<script lang="ts">
	import { onMount } from 'svelte';

	export let progress: number;

	const radius = 110;
	let circumference: number;

	onMount(() => {
		circumference = radius * 2 * Math.PI;
	});

	$: offset = circumference - (progress / 100) * circumference;
</script>

<div class="relative h-40 w-40">
	<svg class="animate-spin-slow absolute h-full w-full" viewBox="0 0 240 240">
		<circle
			stroke-width={11}
			fill="transparent"
			class="stroke-current text-secondary"
			cx="120"
			cy="120"
			r={radius}
		/>
		<circle
			stroke-width={13}
			fill="transparent"
			class="bg-transparent stroke-current text-primary transition-all"
			cx="120"
			cy="120"
			r={radius}
			stroke-dashoffset={offset}
			stroke-dasharray={circumference}
			stroke-linecap="round"
		/>
	</svg>
	<span
		class="absolute inset-0 flex items-center justify-center text-xl
	 font-bold"
	>
		{progress}%
	</span>
</div>
