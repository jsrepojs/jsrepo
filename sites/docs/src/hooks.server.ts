import { redirect } from '@sveltejs/kit';

export const handle = async ({ event, resolve }) => {
	if (event.url.pathname === '/about') throw redirect(303, '/docs/about');

	const response = await resolve(event);

	return response;
};
