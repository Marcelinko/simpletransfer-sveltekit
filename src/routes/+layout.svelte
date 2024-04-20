<script>
	import '../app.css';
	import { setAppState } from '$lib/state.svelte';
	setAppState({ window: 'selectFiles', uploadId: null });
</script>

<slot />
