<script>
	import '../app.css';
	import { setAppState } from '$lib/state.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { env } from '$env/dynamic/public';
	setAppState({ window: 'selectFiles', uploadId: null });
</script>

<svelte:head>
	<title>SimpleTransfer - Effortlessly Send Large Files for Free - Up to 1GB, No cost</title>
	<meta
		content="Send large files effortlessly with SimpleTransfer. Enjoy up to 1GB file transfers for free, with no hidden costs. Preview photos and more!"
		name="description"
	/>
	<meta
		content="SimpleTransfer - Effortlessly Send Large Files for Free - Up to 1GB, No cost"
		property="og:title"
	/>
	<meta
		content="Send large files effortlessly with SimpleTransfer. Enjoy up to 1GB file transfers for free, with no hidden costs. Preview photos and more!"
		property="og:description"
	/>
	<meta content={env.PUBLIC_BASE_URL} property="og:url" />
	<meta
		content="SimpleTransfer - Effortlessly Send Large Files for Free - Up to 1GB, No cost"
		property="twitter:title"
	/>
	<meta
		content="Send large files effortlessly with SimpleTransfer. Enjoy up to 1GB file transfers for free, with no hidden costs. Preview photos and more!"
		property="twitter:description"
	/>
	<meta content="#000" name="theme-color" />
	<meta name="google-site-verification" content="bmCqEtO6mqJAoUB0xnVsSoxcEeiYCnV9V0HnfQ9agLc" />
</svelte:head>

<Toaster />
<slot />
