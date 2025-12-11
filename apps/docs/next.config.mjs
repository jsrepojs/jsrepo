import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
	reactStrictMode: true,
	async redirects() {
		return [
			{
				source: "/docs/:path*.mdx",
				destination: "/docs/:path*.md",
				permanent: true,
			},
		];
	},
	async rewrites() {
		return [
			{
				source: "/docs/:path*.mdx",
				destination: "/llms.mdx/:path*",
			},
			{
				source: "/docs/:path*.md",
				destination: "/llms.md/:path*",
			},
		];
	},
};

export default withMDX(config);
