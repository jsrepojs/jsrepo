import { z } from 'zod';
import { DistributedOutputManifestSchema } from '@/outputs/distributed';
import { RepositoryOutputManifestSchema } from '@/outputs/repository';

export {
	type DistributedOutputManifest,
	type DistributedOutputOptions,
	distributed,
} from '@/outputs/distributed';

export {
	type RepositoryOutputManifest,
	type RepositoryOutputOptions,
	repository,
} from '@/outputs/repository';

export const ManifestSchema = z.discriminatedUnion('type', [
	DistributedOutputManifestSchema,
	RepositoryOutputManifestSchema,
]);

export type Manifest = z.infer<typeof ManifestSchema>;

export type { Output } from '@/outputs/types';
