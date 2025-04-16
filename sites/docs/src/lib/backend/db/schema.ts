import { pgTable, integer, text, timestamp } from 'drizzle-orm/pg-core';

export const registries = pgTable('registries', {
	url: text().notNull(),
	views: integer().notNull(),
	created_at: timestamp()
});

export type Registry = typeof registries.$inferSelect;

export const featuredRegistries = pgTable('featured_registries', {
	url: text().notNull(),
	created_at: timestamp()
});
