import type { BunRequest } from 'bun';

export type BunRouteHandler = (req: BunRequest) => Response | Promise<Response>;
