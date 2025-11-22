#!/usr/bin/env node

import { StdioTransport } from '@tmcp/transport-stdio';
import pc from 'picocolors';
import { server } from './server';

const transport = new StdioTransport(server);
transport.listen();

process.stdout.write(`Server running...\n`);
process.stdout.write(pc.dim(`Press ${pc.bold('Ctrl+C')} to exit\n`));
