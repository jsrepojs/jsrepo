import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { FeatureTabs, FeatureTabsList, FeatureTabsTrigger, FeatureTabsContent } from "@/components/feature-tabs";
import { AnimatedSpan, Terminal, TypingAnimation } from "@/components/ui/terminal";

export const metadata: Metadata = {
	title: "jsrepo.dev - The modern component registry toolchain",
	description: "jsrepo - The modern component registry toolchain",
	openGraph: {
		title: "jsrepo.dev",
		description: "jsrepo - The modern component registry toolchain",
		type: "website",
		siteName: "jsrepo.dev",
		images: [
			{
				url: "/og",
				width: 1200,
				height: 630,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "jsrepo.dev",
		description: "jsrepo - The modern component registry toolchain",
		images: [
			{
				url: "/og",
				width: 1200,
				height: 630,
			},
		],
	},
};

export default function HomePage() {
	return (
		<main className="flex flex-1 flex-col gap-12 justify-center text-center">
			<HeroSection />
			<FeatureAccordionSection />
		</main>
	);
}

function HeroSection() {
	return (
		<div className="flex flex-col items-center justify-center">
			<div className="flex flex-col gap-6 items-center justify-center max-w-3/4">
				<h1 className="text-balance text-4xl font-medium sm:text-5xl md:text-6xl">
					The modern component registry toolchain
				</h1>
				<p className="mx-auto max-w-3xl text-pretty text-lg">
					Whatever project you're working on you need only remember one command:{" "}
					<span className="font-mono font-medium">jsrepo</span>.
				</p>
				<div className="flex items-center justify-center">
					<Button variant="default" asChild>
						<Link href="/docs">Get Started</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}

function FeatureAccordionSection() {
	return (
		<div className="px-6 md:px-0">
			<FeatureTabs defaultValue="config" subClassName="h-[368px]">
				<FeatureTabsList>
					<FeatureTabsTrigger
						value="config"
						duration={2150}
						description="Configure your registry in seconds."
					>
						Configure
					</FeatureTabsTrigger>
					<FeatureTabsTrigger
						value="build"
						duration={2650}
						description="Build your registry instantly and watch for changes."
					>
						Build
					</FeatureTabsTrigger>
					<FeatureTabsTrigger
						value="add"
						duration={2750}
						description="Add components to your project with a single command."
					>
						Add
					</FeatureTabsTrigger>
					<FeatureTabsTrigger
						value="update"
						duration={3150}
						description="Update components in your project with interactive diffs."
					>
						Update
					</FeatureTabsTrigger>
				</FeatureTabsList>
				<FeatureTabsContent value="config">
					<Terminal className="border-none text-start h-[368px] [&>pre]:w-full *:data-[slot='terminal-header']:hidden w-full">
						<TypingAnimation>&gt; jsrepo init</TypingAnimation>

						<AnimatedSpan className="text-green-500">✔ Wrote config to jsrepo.config.ts</AnimatedSpan>

						<AnimatedSpan className="text-green-500">✔ Installed dependencies.</AnimatedSpan>

						<AnimatedSpan className="text-green-500">✔ Initialization complete.</AnimatedSpan>
					</Terminal>
				</FeatureTabsContent>
				<FeatureTabsContent value="build">
					<Terminal className="border-none h-[368px] max-w-none text-start [&>pre]:w-full *:data-[slot='terminal-header']:hidden w-full">
						<TypingAnimation>&gt; jsrepo build --watch</TypingAnimation>

						<AnimatedSpan className="text-green-500" delay={10}>
							<span>✔ Finished in 10.49ms</span>
							<span className="pl-2">
								@ieedan/std: Created 1 output in 10.12ms with 3 items and 4 files.
							</span>
						</AnimatedSpan>

						<AnimatedSpan className="text-muted-foreground">Watching for changes...</AnimatedSpan>
					</Terminal>
				</FeatureTabsContent>
				<FeatureTabsContent value="add">
					<Terminal className="border-none text-start h-[368px] [&>pre]:w-full *:data-[slot='terminal-header']:hidden w-full">
						<TypingAnimation>&gt; jsrepo add button</TypingAnimation>

						<AnimatedSpan className="text-green-500">
							✔ Fetched manifest from @ieedan/shadcn-svelte-extras
						</AnimatedSpan>

						<AnimatedSpan className="text-green-500">✔ Fetched button.</AnimatedSpan>

						<AnimatedSpan className="text-green-500">
							<span>Added button, utils to your project.</span>
							<span className="pl-2">Updated 2 files.</span>
						</AnimatedSpan>
					</Terminal>
				</FeatureTabsContent>
				<FeatureTabsContent value="update">
					<Terminal className="border-none h-[368px] max-w-none text-start [&>pre]:w-full *:data-[slot='terminal-header']:hidden w-full">
						<TypingAnimation>&gt; jsrepo update button</TypingAnimation>

						<AnimatedSpan className="text-green-500">
							✔ Fetched manifest from @ieedan/shadcn-svelte-extras
						</AnimatedSpan>

						<AnimatedSpan className="text-green-500">✔ Fetched button.</AnimatedSpan>

						<AnimatedSpan>
							<div className="space-y-1 text-sm font-mono">
								<div className="text-muted-foreground">
									@ieedan/shadcn-svelte-extras/button {"->"} src/components/ui/button.tsx
								</div>
								<div className="space-y-0.5 pl-4">
									<div className="text-muted-foreground">+ 20 more unchanged (-E to expand)</div>
									<div className="flex items-center gap-2">
										<span className="text-muted-foreground">21</span>
										<span className="text-foreground">
											{"    "}link: &apos;text-primary underline-offset
										</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-muted-foreground">22</span>
										<span className="text-foreground">
											{"  "}
											{"},"}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-muted-foreground">23</span>
										<span className="text-foreground">
											{"  "}size: {"{"}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-muted-foreground">24</span>
										<span className="text-foreground">
											{"    default: 'h-10 px-"}
											<span className=" bg-red-500 text-white">3</span>
											<span className="bg-green-500 text-white">4</span>
											{" py-2',"}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-muted-foreground">25</span>
										<span className="text-foreground">
											{"    "}sm: &apos;h-9 rounded-md px-3&apos;,
										</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-muted-foreground">26</span>
										<span className="text-foreground">
											{"    "}lg: &apos;h-11 rounded-md px-8&apos;,
										</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-muted-foreground">27</span>
										<span className="text-foreground">{"    "}icon: &apos;h-10 w-10&apos;</span>
									</div>
									<div className="text-muted-foreground">+ 60 more unchanged (-E to expand)</div>
								</div>
							</div>
						</AnimatedSpan>

						<AnimatedSpan className="text-green-500">
							<span>Updated button, utils in your project.</span>
							<span className="pl-2">Updated 2 files.</span>
						</AnimatedSpan>
					</Terminal>
				</FeatureTabsContent>
			</FeatureTabs>
		</div>
	);
}
