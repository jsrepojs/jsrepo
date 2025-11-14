import fs from 'node:fs';
import { err, ok, type Result } from 'nevereverthrow';
import { JsrepoError } from './errors';
import { dirname } from './path';
import type { AbsolutePath } from './types';

export function readFileSync(p: AbsolutePath): Result<string, JsrepoError> {
	try {
		return ok(fs.readFileSync(p, 'utf-8'));
	} catch (e) {
		return err(
			new JsrepoError(
				`Failed to read file ${p}: ${e instanceof Error ? e.message : String(e)}`,
				{
					suggestion: 'Please try again.',
				}
			)
		);
	}
}

/**
 * Write to a file. Automatically creates the directory recursively if it doesn't exist.
 *
 * @param p
 * @param data
 * @returns
 */
export function writeFileSync(p: AbsolutePath, data: string): Result<void, JsrepoError> {
	try {
		const res = mkdirSync(dirname(p) as AbsolutePath);
		if (res.isErr()) return err(res.error);
		fs.writeFileSync(p, data);
		return ok();
	} catch (e) {
		return err(
			new JsrepoError(
				`Failed to write file ${p}: ${e instanceof Error ? e.message : String(e)}`,
				{
					suggestion: 'Please try again.',
				}
			)
		);
	}
}

export function readdirSync(p: AbsolutePath): Result<string[], JsrepoError> {
	try {
		return ok(fs.readdirSync(p));
	} catch (e) {
		return err(
			new JsrepoError(
				`Failed to read directory ${p}: ${e instanceof Error ? e.message : String(e)}`,
				{
					suggestion: 'Please try again.',
				}
			)
		);
	}
}

export function mkdirSync(p: AbsolutePath): Result<void, JsrepoError> {
	try {
		fs.mkdirSync(p, { recursive: true });
		return ok();
	} catch (e) {
		return err(
			new JsrepoError(
				`Failed to create directory ${p}: ${e instanceof Error ? e.message : String(e)}`,
				{
					suggestion: 'Please try again.',
				}
			)
		);
	}
}

/**
 * Removes a file if it exists.
 *
 * @param p
 * @returns
 */
export function rmSync(p: AbsolutePath): Result<void, JsrepoError> {
	try {
		if (!existsSync(p)) return ok();
		fs.rmSync(p);
		return ok();
	} catch (e) {
		return err(
			new JsrepoError(
				`Failed to remove file ${p}: ${e instanceof Error ? e.message : String(e)}`,
				{
					suggestion: 'Please try again.',
				}
			)
		);
	}
}

export function existsSync(p: AbsolutePath): boolean {
	return fs.existsSync(p);
}

export function statSync(p: AbsolutePath): Result<fs.Stats, JsrepoError> {
	try {
		return ok(fs.statSync(p));
	} catch (e) {
		return err(
			new JsrepoError(
				`Failed to stat file ${p}: ${e instanceof Error ? e.message : String(e)}`,
				{
					suggestion: 'Please try again.',
				}
			)
		);
	}
}
