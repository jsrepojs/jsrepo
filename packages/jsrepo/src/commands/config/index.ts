import { Command } from 'commander';
import { language } from '@/commands/config/language';
import { mcp } from '@/commands/config/mcp';
import { plugin } from '@/commands/config/plugin';
import { provider } from '@/commands/config/provider';
import { transform } from '@/commands/config/transform';

export const config = new Command('config')
	.description('Modify your jsrepo config.')
	.addCommand(plugin)
	.addCommand(transform)
	.addCommand(provider)
	.addCommand(language)
	.addCommand(mcp);
