import { getPageImage, source } from "@/lib/source";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og";

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<"/og/docs/[...slug]">) {
	const { slug } = await params;
	const page = source.getPage(slug.slice(0, -1));
	if (!page) notFound();

	return new ImageResponse(
    (
      <div tw="flex flex-col gap-2 items-center justify-center w-[1200px] h-[630px] bg-[#1b1c1e]">
        <div tw="flex rounded-full text-black bg-yellow-500 px-2 py-1">
					jsrepo.dev
				</div>
				<h1 tw="text-8xl font-bold text-white">
					$ <span tw="text-yellow-500 mx-6">{page.data.title}</span>
					<div tw="h-lh bg-white w-8 ml-1"></div>
				</h1>
				<p tw="text-3xl font-bold text-white/50">
					{page.data.description}
				</p>
			</div>
    ),
		{
			width: 1200,
			height: 630,
			fonts: [
				{
					name: "IBM Plex Mono",
					data: await loadGoogleFont("IBM Plex Mono", "$ jsrepo.dev" + page.data.title + page.data.description),
					style: "normal",
				},
			],
		}
	);
}

export function generateStaticParams() {
	return source.getPages().map((page) => ({
		lang: page.locale,
		slug: getPageImage(page).segments,
	}));
}
