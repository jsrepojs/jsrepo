"use client";

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDown, ExternalLink } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PnpmLogo } from "../logos/pnpm";
import { NpmLogo } from "../logos/npm";
import { YarnLogo } from "../logos/yarn";
import { BunLogo } from "../logos/bun";
import { useState } from "react";
import { resolveCommand } from "package-manager-detector/commands";

export function JsrepoAdd({ item, registry }: { item: string; registry: string }) {
	const [copyAdd, copiedAdd] = useCopyToClipboard(1000);
	const [copyInit, copiedInit] = useCopyToClipboard(1000);
	const [agent, setAgent] = useState<"pnpm" | "npm" | "yarn" | "bun">("pnpm");

	const addCommand = resolveCommand(agent, "execute", ["jsrepo", "add", `${registry}/${item}`]);
	const initCommand = resolveCommand(agent, "execute", ["jsrepo", "init", registry]);

	return (
		<div className="border overflow-hidden border-border flex items-center rounded-md h-9">
			<button
				onClick={() => copyAdd([addCommand?.command, ...(addCommand?.args ?? [])].join(" "))}
				className="[&_svg]:size-3.5 flex-1 flex place-items-center rounded-l-md pr-2 hover:bg-accent transition-colors"
			>
				<div className="flex items-center justify-center size-9">
					<CheckIcon className={cn("scale-0 transition-all absolute", copiedAdd && "scale-100")} />
					<AgentLogo
						agent={agent}
						className={cn("scale-100 transition-all absolute", copiedAdd && "scale-0")}
					/>
				</div>
				<span className="text-xs text-muted-foreground font-mono">
					{[addCommand?.command, ...(addCommand?.args ?? [])].join(" ")}
				</span>
			</button>
			<DropdownMenu>
				<DropdownMenuTrigger className="rounded-r-md hover:bg-accent transition-colors size-9 flex items-center justify-center">
					<ChevronDown className="size-4" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem
						className="flex flex-col gap-1 place-items-start!"
						onSelect={() => copyInit([initCommand?.command, ...(initCommand?.args ?? [])].join(" "))}
					>
						<span className="text-xs">
							{[initCommand?.command, ...(initCommand?.args ?? [])].join(" ")}
						</span>
						<div className="flex items-center gap-1 [&_svg]:size-3">
							<span className="text-xs text-muted-foreground text-start">Init registry</span>
							<CheckIcon className={cn("scale-0 transition-all", copiedInit && "scale-100")} />
						</div>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<AgentOption agent="pnpm" setAgent={setAgent} currentAgent={agent} />
					<AgentOption agent="npm" setAgent={setAgent} currentAgent={agent} />
					<AgentOption agent="yarn" setAgent={setAgent} currentAgent={agent} />
					<AgentOption agent="bun" setAgent={setAgent} currentAgent={agent} />
					<DropdownMenuSeparator />
					<DropdownMenuItem onSelect={() => window.open("https://v3.jsrepo.dev/docs/cli/add", "_blank")}>
						<ExternalLink className="size-4" />
						<span className="text-sm">View CLI Documentation</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

function AgentOption({
	agent,
	setAgent,
	currentAgent,
}: {
	agent: "pnpm" | "npm" | "yarn" | "bun";
	currentAgent: "pnpm" | "npm" | "yarn" | "bun";
	setAgent: (agent: "pnpm" | "npm" | "yarn" | "bun") => void;
}) {
	return (
		<DropdownMenuItem
			onSelect={() => setAgent(agent)}
			className="[&_svg]:size-3.5 flex items-center justify-between"
		>
			<span className="flex items-center gap-2">
				<AgentLogo agent={agent} />
				{agent}
			</span>
			{currentAgent === agent && <CheckIcon className="size-4" />}
		</DropdownMenuItem>
	);
}

function AgentLogo({ agent, className }: { agent: "pnpm" | "npm" | "yarn" | "bun"; className?: string }) {
	switch (agent) {
		case "pnpm":
			return <PnpmLogo className={className} />;
		case "npm":
			return <NpmLogo className={className} />;
		case "yarn":
			return <YarnLogo className={className} />;
		case "bun":
			return <BunLogo className={className} />;
	}
}
