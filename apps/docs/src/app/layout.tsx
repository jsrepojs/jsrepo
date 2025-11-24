import "@/app/global.css";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import { App } from "./app-client";

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
				<App>{children}</App>
			</body>
		</html>
	);
}
