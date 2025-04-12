import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DATABASE_URL } from '$env/static/private';
export * as functions from './functions';

const client = postgres(DATABASE_URL, { prepare: false });
export const db = drizzle(client);
