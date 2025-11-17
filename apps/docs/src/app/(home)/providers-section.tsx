"use client";

import { GitHubLogo, GitLabLogo, JsrepoLogo, RegistryKitLogo } from "@/components/logos";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { cn } from "@/lib/utils";
import { FolderGit2 } from "lucide-react";
import { useRef } from "react";

function Circle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"rounded-full relative bg-accent z-10 [&_svg]:size-5 size-12 flex items-center justify-center",
				className
			)}
			{...props}
		/>
	);
}

export function ProvidersSection() {
	const containerRef = useRef<HTMLDivElement>(null);

	const githubRef = useRef<HTMLDivElement>(null);
	const gitlabRef = useRef<HTMLDivElement>(null);
	const jsrepoRef = useRef<HTMLDivElement>(null);

	const cliRef = useRef<HTMLDivElement>(null);

	const projectRef = useRef<HTMLDivElement>(null);

	return (
		<div className="flex flex-col items-center justify-center border-b border-border px-6">
			<div className="max-w-6xl w-full border-x text-start p-6 flex-col gap-6 flex">
				<div className="flex flex-col gap-1 items-center justify-center">
					<h2 className="text-2xl font-bold text-center">Host your registry anywhere</h2>
					<p className="text-sm text-muted-foreground text-center">
						Host your registry publicly or privately wherever you want.
					</p>
				</div>
				<div ref={containerRef} className="flex items-center justify-between relative overflow-hidden">
					<div className="flex flex-col items-center justify-center gap-2">
						<div
							ref={githubRef}
							className="rounded-full z-10 bg-accent px-3 py-2 flex items-center justify-center gap-2"
						>
							<GitHubLogo className="size-4" />
							<span className="text-sm text-muted-foreground">github/jsrepojs/registry-kit</span>
						</div>
						<div
							ref={jsrepoRef}
							className="rounded-full z-10 bg-accent px-3 py-2 flex items-center justify-center gap-2"
						>
							<JsrepoLogo className="size-4" />
							<span className="text-sm text-muted-foreground">@jsrepo/registry-kit</span>
						</div>
						<div
							ref={jsrepoRef}
							className="rounded-full z-10 bg-accent px-3 py-2 flex items-center justify-center gap-2"
						>
							<RegistryKitLogo className="size-4" />
							<span className="text-sm text-muted-foreground">https://registry-kit.dev/r</span>
						</div>
					</div>

					<Circle ref={cliRef}>
						<JsrepoLogo />
					</Circle>

					<div>
						<Circle ref={projectRef}>
							<FolderGit2 className="text-muted-foreground" />
						</Circle>
					</div>

					<AnimatedBeam containerRef={containerRef} fromRef={githubRef} toRef={cliRef} />
					<AnimatedBeam containerRef={containerRef} fromRef={gitlabRef} toRef={cliRef} />
					<AnimatedBeam containerRef={containerRef} fromRef={jsrepoRef} toRef={cliRef} />
					<AnimatedBeam containerRef={containerRef} fromRef={projectRef} toRef={cliRef} />
				</div>
			</div>
		</div>
	);
}
