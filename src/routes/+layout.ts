import posthog from 'posthog-js';
import { browser } from '$app/environment';

export const load = async () => {
	if (browser) {
		posthog.init('phc_rcuWNqsiAtPwa1pEtL7ofqBOYdo2XQQI6cMcxiBxXPq', {
			api_host: 'https://eu.i.posthog.com'
		});
	}
	return;
};
