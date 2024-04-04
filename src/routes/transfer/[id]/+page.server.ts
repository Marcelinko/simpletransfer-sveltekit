import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import supabase from '$lib/server/supabase';

export const load: PageServerLoad = async ({ params }) => {
	const { data, error } = await supabase.from('file').select('*').eq('upload_id', params.id);

	if (data) {
		return {
			files: data
		};
	}

	error(404, 'Not found');
};
