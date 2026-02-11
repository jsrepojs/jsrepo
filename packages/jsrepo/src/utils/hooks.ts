import { confirm, intro, isCancel, log, outro } from '@clack/prompts';
import { err, ok, type Result } from 'nevereverthrow';
import { x } from 'tinyexec';
import type { AddCommandResult, AddOptions } from '@/commands/add';
import type { AuthCommandResult, AuthOptions } from '@/commands/auth';
import type { BuildCommandResult, BuildOptions } from '@/commands/build';
import type {
	ConfigAddLanguageCommandResult,
	ConfigAddLanguageOptions,
} from '@/commands/config/language';
import type { ConfigMcpCommandResult, ConfigMcpOptions } from '@/commands/config/mcp';
import type {
	ConfigAddProviderCommandResult,
	ConfigAddProviderOptions,
} from '@/commands/config/provider';
import type {
	ConfigAddTransformCommandResult,
	ConfigAddTransformOptions,
} from '@/commands/config/transform';
import type { InitCommandResult, InitOptions } from '@/commands/init';
import type { PublishCommandResult, PublishOptions } from '@/commands/publish';
import type { UpdateCommandResult, UpdateOptions } from '@/commands/update';
import type { Config } from '@/utils/config';

export type BeforeArgs =
	| { command: 'config.language'; options: ConfigAddLanguageOptions }
	| { command: 'config.mcp'; options: ConfigMcpOptions }
	| { command: 'config.provider'; options: ConfigAddProviderOptions }
	| { command: 'config.transform'; options: ConfigAddTransformOptions }
	| { command: 'add'; options: AddOptions }
	| { command: 'auth'; options: AuthOptions }
	| { command: 'build'; options: BuildOptions }
	| { command: 'init'; options: InitOptions }
	| { command: 'publish'; options: PublishOptions }
	| { command: 'update'; options: UpdateOptions };

export type AfterArgs =
	| { command: 'config.language'; result: ConfigAddLanguageCommandResult }
	| { command: 'config.mcp'; result: ConfigMcpCommandResult }
	| { command: 'config.provider'; result: ConfigAddProviderCommandResult }
	| { command: 'config.transform'; result: ConfigAddTransformCommandResult }
	| { command: 'add'; result: AddCommandResult }
	| { command: 'auth'; result: AuthCommandResult }
	| { command: 'build'; result: BuildCommandResult }
	| { command: 'init'; result: InitCommandResult }
	| { command: 'publish'; result: PublishCommandResult }
	| { command: 'update'; result: UpdateCommandResult };

export type HookFn<Args> = (args: Args) => Promise<void>;
export type Hook<Args> = HookFn<Args> | string;

export type InferHookArgs<H> =
	H extends HookFn<infer Args> ? Args : H extends HookFn<infer Args>[] ? Args : never;

export type BeforeHook = Hook<BeforeArgs>;
export type AfterHook = Hook<AfterArgs>;

async function runCommand(
	command: string,
	cwd: string = process.cwd()
): Promise<Result<void, Error>> {
	try {
		const isWindows = process.platform === 'win32';
		const [shell, shellArgs] = isWindows
			? (['cmd', ['/c', command]] as [string, string[]])
			: (['sh', ['-c', command]] as [string, string[]]);

		const proc = x(shell, [...shellArgs], {
			nodeOptions: { stdio: 'inherit', cwd },
		});
		await proc;
		if (proc.exitCode !== 0) {
			return err(new Error(`Command "${command}" failed with exit code ${proc.exitCode}`));
		}
		return ok(undefined);
	} catch (e) {
		return err(e instanceof Error ? e : new Error(String(e)));
	}
}

export async function runHooks<HookKey extends keyof NonNullable<Config['hooks']>>(
	config: Config,
	key: HookKey,
	args: InferHookArgs<NonNullable<NonNullable<Config['hooks']>[HookKey]>>,
	cwd?: string
): Promise<Result<void, Error>> {
	const hooks = config.hooks?.[key] ?? [];
	const hooksArr = (Array.isArray(hooks) ? hooks : [hooks]) as (
		| HookFn<BeforeArgs | AfterArgs>
		| string
	)[];

	const runCwd = cwd ?? process.cwd();

	for (const hook of hooksArr) {
		if (typeof hook === 'function') {
			try {
				await (hook as HookFn<unknown>)(args);
			} catch (e) {
				return err(e instanceof Error ? e : new Error(String(e)));
			}
		} else if (typeof hook === 'string') {
			const result = await runCommand(hook, runCwd);
			if (result.isErr()) return result;
		}
	}

	return ok(undefined);
}

export async function runBeforeHooks(
	config: Config,
	args: BeforeArgs,
	opts: { cwd?: string; yes?: boolean }
): Promise<void> {
	const hooks = config.hooks?.before ?? [];
	const hooksArr = Array.isArray(hooks) ? hooks : [hooks];
	if (hooksArr.length === 0) return;

	console.clear();
	intro('Running before hooks');
	const result = await runHooks(config, 'before', args, opts.cwd);
	if (result.isErr()) {
		if (opts.yes) {
			outro('');
			return;
		}
		const shouldContinue = await confirm({
			message: 'Before hooks failed. Would you like to continue?',
			initialValue: false,
		});
		if (isCancel(shouldContinue) || !shouldContinue) {
			process.exit(1);
		}
	}
	outro('');
}

export async function runAfterHooks(
	config: Config,
	args: AfterArgs,
	opts?: { cwd?: string }
): Promise<void> {
	const hooks = config.hooks?.after ?? [];
	const hooksArr = Array.isArray(hooks) ? hooks : [hooks];
	if (hooksArr.length === 0) return;

	intro('Running after hooks');
	const result = await runHooks(config, 'after', args, opts?.cwd);
	if (result.isErr()) {
		log.warn(`After hooks failed: ${result.error.message}`);
	}
	outro('');
}
