import { loadGoogleFont } from "@/lib/og";
import { ImageResponse } from "next/og";

export const revalidate = false;

export async function GET() {
	const title = "jsrepo";
	const description = "The modern component registry toolchain.";

	return new ImageResponse(
		(
			<div tw="flex flex-col gap-2 items-center justify-center w-[1200px] h-[630px] bg-[#1b1c1e]">
				<div tw="flex rounded-full text-black bg-yellow-500 px-2 py-1">
					jsrepo.dev
				</div>
				<h1 tw="text-8xl font-bold text-white">
					$ <span tw="text-yellow-500 mx-6">{title}</span>
					<div tw="h-lh bg-white w-8 ml-1"></div>
				</h1>
				<p tw="text-3xl font-bold text-white/50">
					{description}
				</p>
			</div>
		),
		{
			width: 1200,
			height: 630,
			fonts: [
				{
					name: "IBM Plex Mono",
					data: await loadGoogleFont("IBM Plex Mono", "$ jsrepo.dev" + title + description),
					style: "normal",
				},
			],
		}
	);
}
