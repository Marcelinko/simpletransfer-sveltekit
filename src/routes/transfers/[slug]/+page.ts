import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	return {
			title: `Title for ${params.slug} goes here`,
	};
};