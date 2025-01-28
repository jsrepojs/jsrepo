import { markdownIt } from '$lib/ts/markdown';
import { redirect, type ServerInit } from '@sveltejs/kit';

export const init: ServerInit = async () => {
	await markdownIt(); // creates the new instance
};

export const handle = async ({ event, resolve }) => {
	if (event.url.pathname === '/about') throw redirect(303, '/docs/about');

	const response = await resolve(event);

	return response;
};
