/**
 * Type declarations for @vercel/og ImageResponse.
 * The `tw` prop allows Tailwind-style class names for OG image generation.
 * @see https://vercel.com/docs/og-image-generation
 */
export {};

declare module "react" {
	interface HTMLAttributes<T> {
		tw?: string;
	}
}
