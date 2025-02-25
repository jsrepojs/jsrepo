import { error } from '@sveltejs/kit';
import { makeBadge } from 'badge-maker';

export const GET = async ({ params }) => {
	let state = params.state;

	if (state.endsWith('.svg')) state = state.slice(0, state.length - 4);

	if (!['passing', 'failing'].includes(state)) throw error(404);

	const svg = makeBadge({
		label: 'jsrepo',
		labelColor: '#f7df1e',
		color: state === 'failing' ? '#ff0000' : '',
		message: `build ${state}`
	});

	return new Response(svg, {
		headers: {
			'Content-Type': 'image/svg+xml'
		}
	});
};
