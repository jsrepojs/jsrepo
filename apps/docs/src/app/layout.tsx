import "@/app/global.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";

const fontSans = Manrope({
	subsets: ["latin"],
	variable: "--font-sans",
});

const fontMono = IBM_Plex_Mono({
	subsets: ["latin"],
	variable: "--font-mono",
	weight: ["400", "500", "600", "700"],
});

export default function Layout({ children }: LayoutProps<"/">) {
	return (
		<html
			lang="en"
			className={`${fontSans.className} ${fontSans.variable} ${fontMono.variable}`}
			suppressHydrationWarning
		>
			<body className="flex flex-col min-h-screen">
				<Script
					defer
					src="https://cloud.umami.is/script.js"
					data-website-id="c8df5723-7064-489a-ae4b-723c8534340c"
				/>
				<RootProvider>{children}</RootProvider>
			</body>
		</html>
	);
}
