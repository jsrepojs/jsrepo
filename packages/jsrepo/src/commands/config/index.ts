import { Command } from 'commander';
import { language } from '@/commands/config/language';
import { mcp } from '@/commands/config/mcp';
import { provider } from '@/commands/config/provider';
import { transform } from '@/commands/config/transform';

export const config = new Command('config')
	.description('Modify your jsrepo config.')
	.addCommand(transform)
	.addCommand(provider)
	.addCommand(language)
	.addCommand(mcp);
