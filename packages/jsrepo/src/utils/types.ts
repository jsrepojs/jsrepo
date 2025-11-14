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
