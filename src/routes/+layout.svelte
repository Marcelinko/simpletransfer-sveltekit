<script>
	import '../app.css';
	import { setAppState } from '$lib/state.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	setAppState({ window: 'selectFiles', uploadId: null });
</script>

<Toaster />
<slot />
