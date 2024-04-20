import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';

type AppState = {
	window: string;
	uploadId: string | null;
};

export function setAppState(state: AppState) {
	const appState = writable(state);
	setContext('APP_CTX', appState);
}

export function getAppState() {
	return getContext<Writable<AppState>>('APP_CTX');
}
