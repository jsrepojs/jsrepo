#!/usr/bin/env node

import { StdioTransport } from '@tmcp/transport-stdio';
import pc from 'picocolors';
import { server } from './server';

const transport = new StdioTransport(server);
transport.listen();

// Important: stdout must remain reserved for MCP JSON-RPC traffic.
// Log any human-readable messages to stderr so MCP clients (like Antigravity) don't see non-JSON text when parsing responses.
process.stderr.write(`Server running...\n`);
process.stderr.write(pc.dim(`Press ${pc.bold('Ctrl+C')} to exit\n`));
