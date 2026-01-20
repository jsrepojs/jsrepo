import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { FeatureTabs, FeatureTabsList, FeatureTabsTrigger, FeatureTabsContent } from "@/components/feature-tabs";
import { AnimatedSpan, Terminal, TypingAnimation } from "@/components/ui/terminal";
import { CodeBlock } from "./code-block";
import { ProvidersSection } from "./providers-section";
import { cn } from "@/lib/utils";
import PrismaticBurst from "@/components/PrismaticBurst";
import { ExternalLinkIcon } from "lucide-react";

export const metadata: Metadata = {
	title: "jsrepo.dev - The modern registry toolchain",
	description: "jsrepo - The modern registry toolchain",
	openGraph: {
		title: "jsrepo.dev",
		description: "jsrepo - The modern registry toolchain",
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
		description: "jsrepo - The modern registry toolchain",
		images: [
			{
				url: "/og",
				width: 1200,
				height: 630,
			},
		],
	},
	metadataBase: new URL("https://jsrepo.dev"),
};

export default function HomePage() {
	return (
		<>
			<main className="flex flex-1 flex-col gap-12 justify-center text-center">
				<HeroSection />
				<div className="flex flex-col w-full">
					<FeatureAccordionSection />
					<div className="flex flex-col items-center justify-center border-b border-border px-6">
						<div className="max-w-6xl w-full border-x text-start p-6"></div>
					</div>
					<ProvidersSection />
					<div className="flex flex-col items-center justify-center border-b border-border px-6">
						<div className="max-w-6xl w-full border-x text-start p-6"></div>
					</div>
					<PluginsSection />
					<div className="flex flex-col items-center justify-center border-b border-border px-6">
						<div className="max-w-6xl w-full border-x text-start p-6"></div>
					</div>
					<ShadcnCompatibilitySection />
					<div className="flex flex-col items-center justify-center border-b border-border px-6">
						<div className="max-w-6xl w-full border-x text-start p-6"></div>
					</div>
					<LLMsSection />
					<div className="flex flex-col items-center justify-center border-b border-border px-6">
						<div className="max-w-6xl w-full border-x text-start p-6"></div>
					</div>
					<RestEasySection />
					<div className="flex flex-col items-center justify-center border-b border-border px-6">
						<div className="max-w-6xl w-full border-x text-start p-6"></div>
					</div>
					<div className="flex flex-col items-center justify-center border-b border-border px-6">
						<div className="max-w-6xl relative w-full border-x text-start p-10 flex items-center justify-center flex-col gap-3">
							<div className="relative z-10 flex items-center justify-center flex-col gap-3">
								<h2 className="text-2xl font-bold text-center">Ready to level up your registry?</h2>
								<Button asChild>
									<Link href="/docs/create-a-registry">Start Building</Link>
								</Button>
							</div>
							<div className="size-full absolute">
								<PrismaticBurst
									animationType="rotate3d"
									intensity={2}
									speed={0.5}
									distort={1.0}
									paused={false}
									offset={{ x: 0, y: 0 }}
									hoverDampness={0.25}
									rayCount={24}
									mixBlendMode="lighten"
									colors={["#ff007a", "#4d3dff", "#ffffff"]}
								/>
							</div>
						</div>
					</div>
				</div>
			</main>
			<div className="flex flex-col items-center px-6">
				<footer className="flex items-center justify-between py-8 w-full max-w-6xl px-6 gap-6">
					<span className="text-sm text-muted-foreground">
						© {new Date().getFullYear()} jsrepo, All rights reserved.
					</span>
					<div
						className={cn(
							"flex items-center gap-4 flex-wrap",
							"[&_a]:text-sm [&_a]:text-muted-foreground [&_a]:hover:text-primary [&_a]:hover:transition-colors"
						)}
					>
						<Link href="https://github.com/jsrepojs/jsrepo" target="_blank">
							GitHub
						</Link>
						<Link href="https://jsrepo.com">jsrepo.com</Link>
					</div>
				</footer>
			</div>
		</>
	);
}

function HeroSection() {
	return (
		<div className="flex flex-col items-center justify-center mt-[15svh]">
			<div className="flex flex-col gap-6 items-center justify-center max-w-3/4">
				<h1 className="text-balance text-4xl font-medium sm:text-5xl md:text-6xl">
					The modern registry toolchain
				</h1>
				<p className="mx-auto max-w-3xl text-pretty text-lg text-muted-foreground">
					jsrepo handles the hard parts of registries so you can focus on building.
				</p>
				<div className="flex items-center justify-center gap-2">
					<Button variant="default" asChild>
						<Link href="/docs">Get Started</Link>
					</Button>
					<Button variant="outline" asChild>
						<Link href="https://jsrepo.com/" target="_blank">
							Publish your Registry
							<ExternalLinkIcon/>
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}

function PluginsSection() {
	return (
		<div className="flex flex-col items-center justify-center border-b border-border px-6">
			<div className="max-w-6xl w-full border-x flex flex-col text-start p-6 gap-6">
				<div className="flex flex-col items-center justify-center gap-1">
					<h2 className="text-2xl font-bold text-center">Customize your experience with plugins</h2>
					<p className="text-sm text-muted-foreground text-center">
						With a js based config the sky is the limit.
					</p>
				</div>
				<CodeBlock
					lang="ts"
					code={`import { defineConfig } from "jsrepo";
import javascript from "@jsrepo/transform-javascript";
import prettier from "@jsrepo/transform-prettier";

export default defineConfig({
	transforms: [javascript(), prettier()], // [!code highlight]
});`}
				/>
			</div>
		</div>
	);
}

function RestEasySection() {
	return (
		<div className="flex flex-col items-center justify-center border-b border-border px-6">
			<div className="max-w-6xl w-full border-x flex flex-col text-start p-6 gap-6">
				<div className="flex flex-col items-center justify-center gap-1">
					<h2 className="text-2xl font-bold text-center">Rest easy</h2>
					<p className="text-sm text-muted-foreground text-center">
						If your registry builds with jsrepo, it will work for your users.
					</p>
				</div>
				<div className="grid grid-cols-2 gap-6">
					<CodeBlock
						className="h-full"
						lang="ts"
						code={`import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { customLang } from './langs/custom.ts';

export const highlighter = await createHighlighterCore({
  themes: [
    import('@shikijs/themes/nord'),
    import('@shikijs/themes/dark-plus'),
  ],
  langs: [
    import('@shikijs/langs/typescript'),
    import('@shikijs/langs/javascript'),
	customLang(),
  ],
  engine: createJavaScriptRegexEngine()
});`}
					/>
					<CodeBlock
						className="h-full"
						lang="jsonc"
						code={`{
	name: "shiki",
	files: [
		{
			path: "shiki.ts",
			content: //...,
		}
	],
	// auto detect dependencies within your registry
	registryDependencies: ['custom'],
	// automatically detect remote dependencies
	dependencies: [
		'shiki', 
		// including dynamic imports
		'@shikijs/themes', 
		'@shikijs/langs'
	]
}`}
					/>
				</div>
			</div>
		</div>
	);
}

function LLMsSection() {
	return (
		<div className="flex flex-col items-center justify-center border-b border-border px-6">
			<div className="max-w-6xl w-full border-x text-start p-6 flex flex-col gap-6">
				<div className="flex flex-col items-center justify-center gap-1">
					<h2 className="text-2xl font-bold text-center">Built for LLMs</h2>
					<p className="text-sm text-muted-foreground text-center">
						jsrepo is optimized for LLMs by giving them demos and documentation alongside registry items.
					</p>
				</div>
				<CodeBlock
					lang="ts"
					code={`import { defineConfig } from "jsrepo";

export default defineConfig({
	registry: {
		name: '@registry/kit',
		description: 'Components for your registry.',
		items: [
			{
				name: 'button',
				type: 'component',
				files: [
					{
						path: 'src/components/button.tsx',
					},
					{ // [!code highlight]
						path: 'src/demos/button.tsx', // [!code highlight]
						role: 'example', // [!code highlight]
					}, // [!code highlight]
				]
			}
		]
	}
});`}
				/>
			</div>
		</div>
	);
}

function ShadcnCompatibilitySection() {
	return (
		<div className="flex flex-col items-center justify-center border-b border-border px-6">
			<div className="max-w-6xl w-full border-x place-items-center text-start p-6 flex flex-col gap-6">
				<div className="flex flex-col items-center justify-center gap-1">
					<h2 className="text-2xl font-bold text-center">Shadcn compatible</h2>
					<p className="text-sm text-muted-foreground text-center">
						Add and update items seamlessly from shadcn registries.
					</p>
				</div>
				<Terminal startOnView={true} className="w-full max-w-2xl">
					<TypingAnimation>&gt; jsrepo add shadcn:@react-bits/AnimatedContent-TS-TW</TypingAnimation>

					<AnimatedSpan className="text-green-500">
						✔ Fetched manifest from shadcn:@react-bits/AnimatedContent-TS-TW
					</AnimatedSpan>

					<AnimatedSpan className="text-green-500">✔ Fetched AnimatedContent-TS-TW.</AnimatedSpan>

					<AnimatedSpan className="text-green-500">
						<span>Added AnimatedContent-TS-TW to your project.</span>
						<span className="pl-2">Updated 1 file.</span>
					</AnimatedSpan>
				</Terminal>
			</div>
		</div>
	);
}

function FeatureAccordionSection() {
	return (
		<div className="md:h-[368px]">
			<FeatureTabs defaultValue="config">
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
					<Terminal className="border-none rounded-none w-full text-start h-[368px] [&>pre]:w-full *:data-[slot='terminal-header']:hidden">
						<TypingAnimation>&gt; jsrepo init</TypingAnimation>

						<AnimatedSpan className="text-green-500">✔ Wrote config to jsrepo.config.ts</AnimatedSpan>

						<AnimatedSpan className="text-green-500">✔ Installed dependencies.</AnimatedSpan>

						<AnimatedSpan className="text-green-500">✔ Initialization complete.</AnimatedSpan>
					</Terminal>
				</FeatureTabsContent>
				<FeatureTabsContent value="build">
					<Terminal className="border-none rounded-none h-[368px] max-w-none text-start [&>pre]:w-full *:data-[slot='terminal-header']:hidden w-full">
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
					<Terminal className="border-none rounded-none text-start h-[368px] [&>pre]:w-full *:data-[slot='terminal-header']:hidden w-full">
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
					<Terminal className="border-none rounded-none h-[368px] max-w-none text-start [&>pre]:w-full *:data-[slot='terminal-header']:hidden w-full">
						<TypingAnimation>&gt; jsrepo update button</TypingAnimation>

						<AnimatedSpan className="text-green-500">
							✔ Fetched manifest from @ieedan/shadcn-svelte-extras
						</AnimatedSpan>

						<AnimatedSpan className="text-green-500">✔ Fetched button.</AnimatedSpan>

						<AnimatedSpan>
							<div className="space-y-1 text-sm font-mono">
								<div className="text-muted-foreground">
									@ieedan/shadcn-svelte-extras/button {"->"} src/components/button.svelte
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
