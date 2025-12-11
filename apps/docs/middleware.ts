import { NextRequest, NextResponse } from "next/server";
import { isMarkdownPreferred, rewritePath } from "fumadocs-core/negotiation";

const { rewrite: rewriteLLM } = rewritePath("/docs/*path", "/llms.mdx/*path");
const { rewrite: rewriteLLMMD } = rewritePath("/docs/*path", "/llms.md/*path");

export function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;
	
	// Skip middleware for explicit .mdx and .md URLs - let redirects/rewrites handle them
	if (pathname.endsWith('.mdx') || pathname.endsWith('.md')) {
		return NextResponse.next();
	}
	
	if (isMarkdownPreferred(request)) {
		const result = rewriteLLM(pathname);

		if (result) {
			return NextResponse.rewrite(new URL(result, request.nextUrl));
		}
	}

	return NextResponse.next();
}
