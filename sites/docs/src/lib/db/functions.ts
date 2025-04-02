import { selectProvider } from 'jsrepo';
import { db } from '.';
import { registries } from './schema';
import { eq, sql } from 'drizzle-orm';

export async function tryIncrementViews(registryUrl: string): Promise<number | undefined> {
	const url = await tryInsert(registryUrl);

	if (url === undefined) return undefined;

	const result = await db
		.update(registries)
		.set({ views: sql`${registries.views} + 1` })
		.where(eq(registries.url, url))
		.returning({ views: registries.views });

	return result[0].views ?? undefined;
}

export async function tryInsert(registryUrl: string): Promise<string | undefined> {
	const provider = selectProvider(registryUrl);

	if (!provider) return;

	const normalizedUrl = provider.parse(registryUrl, { fullyQualified: false }).url;

	const existing = await db.select().from(registries).where(eq(registries.url, normalizedUrl));

	if (existing.length === 0) {
		await db.insert(registries).values({ url: normalizedUrl, views: 0 });
	}

	return normalizedUrl;
}
