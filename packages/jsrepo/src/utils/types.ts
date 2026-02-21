export type LooseAutocomplete<T> = T | (string & {});

export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

declare const brand: unique symbol;

type Brand<B extends string> = { [brand]: B };

/** Allows you to create a branded type.
 *
 * ## Usage
 * ```ts
 * type Milliseconds = Brand<number, 'milliseconds'>;
 * ```
 */
export type Branded<T, B extends string> = T & Brand<B>;

/**
 * An absolute path to a file. Can be used to immediately read the file.
 */
export type AbsolutePath = Branded<string, 'absolutePath'>;

/**
 * A path relative to the parent item.
 */
export type ItemRelativePath = Branded<string, 'itemRelativePath'>;

export type MaybePromise<T> = T | Promise<T> | PromiseLike<T>;
