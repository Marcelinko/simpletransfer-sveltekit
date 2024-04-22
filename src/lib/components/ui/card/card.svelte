<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js.js';

	type $$Props = HTMLAttributes<HTMLDivElement>;

	let className: $$Props['class'] = undefined;
	export { className as class };
</script>

<div
	class={cn(
		'rounded-lg border-secondary bg-card text-card-foreground shadow-sm md:border',
		className
	)}
	{...$$restProps}
>
	<slot />
</div>
