import type { WithElementRef } from 'bits-ui';
import { type ClassValue, clsx } from 'clsx';
import type {
	HTMLAnchorAttributes,
	HTMLAttributes,
	HTMLButtonAttributes,
	HTMLImgAttributes,
	HTMLInputAttributes,
	HTMLLabelAttributes,
	HTMLLiAttributes,
	HTMLOlAttributes,
	HTMLTableAttributes,
	HTMLTdAttributes,
	HTMLTextareaAttributes,
	HTMLThAttributes
} from 'svelte/elements';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type PrimitiveDivAttributes = WithElementRef<HTMLAttributes<HTMLDivElement>>;
export type PrimitiveElementAttributes = WithElementRef<HTMLAttributes<HTMLElement>>;
export type PrimitiveAnchorAttributes = WithElementRef<HTMLAnchorAttributes>;
export type PrimitiveButtonAttributes = WithElementRef<HTMLButtonAttributes>;
export type PrimitiveInputAttributes = WithElementRef<HTMLInputAttributes>;
export type PrimitiveSpanAttributes = WithElementRef<HTMLAttributes<HTMLSpanElement>>;
export type PrimitiveTextareaAttributes = WithElementRef<HTMLTextareaAttributes>;
export type PrimitiveHeadingAttributes = WithElementRef<HTMLAttributes<HTMLHeadingElement>>;
export type PrimitiveLiAttributes = WithElementRef<HTMLLiAttributes>;
export type PrimitiveOlAttributes = WithElementRef<HTMLOlAttributes>;
export type PrimitiveLabelAttributes = WithElementRef<HTMLLabelAttributes>;
export type PrimitiveUlAttributes = WithElementRef<HTMLAttributes<HTMLUListElement>>;
export type PrimitiveTableAttributes = WithElementRef<HTMLTableAttributes>;
export type PrimitiveTdAttributes = WithElementRef<HTMLTdAttributes>;
export type PrimitiveTrAttributes = WithElementRef<HTMLAttributes<HTMLTableRowElement>>;
export type PrimitiveThAttributes = WithElementRef<HTMLThAttributes>;
export type PrimitiveTableSectionAttributes = WithElementRef<
	HTMLAttributes<HTMLTableSectionElement>
>;
export type PrimitiveImgAttributes = WithElementRef<HTMLImgAttributes>;
