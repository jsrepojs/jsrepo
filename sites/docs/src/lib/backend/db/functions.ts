import { selectProvider } from 'jsrepo';
import { db } from '.';
import { registries, type Registry } from './schema';
import { desc, eq, sql } from 'drizzle-orm';

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

/** Fetches a set of registries that are different for every day */
export async function getFeatured(limit: number = 5): Promise<Registry[]> {
	const today = new Date();
	const day = String(today.getDate()).padStart(2, '0');
	const month = String(today.getMonth() + 1).padStart(2, '0');
	const year = today.getFullYear();

	const seed = parseFloat(`0.${day}${month}${year}`);

	// Ensure the seed is within the valid range (-1 to 1)
	const normalizedSeed = (seed % 2) - 1;

	try {
		// use a transaction to make sure SETSEED works as expected
		return await db.transaction(async (tx) => {
			// Inside the transaction:
			await tx.execute(sql`SELECT SETSEED(${normalizedSeed})`);

			const randomRows = await tx.execute<Registry>(sql`
				SELECT *
				FROM registries
				ORDER BY RANDOM()
				LIMIT ${limit};
			`);

			return randomRows;
		});
	} catch (error) {
		// Handle transaction errors (e.g., log the error, re-throw, etc.)
		console.error('Transaction failed:', error);
		throw error; // Re-throw to propagate the error
	}
}

export async function getPopular(limit: number = 5): Promise<Registry[]> {
	return await db.select().from(registries).orderBy(desc(registries.views)).limit(limit);
}
