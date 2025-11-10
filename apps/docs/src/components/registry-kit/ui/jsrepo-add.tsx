"use client";

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDown, CopyIcon } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PnpmLogo } from "../logos/pnpm";
import { NpmLogo } from "../logos/npm";
import { YarnLogo } from "../logos/yarn";
import { BunLogo } from "../logos/bun";
import { useState } from "react";
import { resolveCommand } from "package-manager-detector/commands";

export function JsrepoAdd({ itemUrl }: { itemUrl: string }) {
	const [copy, copied] = useCopyToClipboard(1000);
	const [agent, setAgent] = useState<"pnpm" | "npm" | "yarn" | "bun">("pnpm");

	const command = resolveCommand(agent, "execute", ["jsrepo", "add", itemUrl]);

	return (
		<div className="border border-border flex items-center rounded-md h-9">
			<button
				onClick={() => copy("hello")}
				className="[&_svg]:size-3.5 flex-1 flex place-items-center rounded-l-md pr-2 hover:bg-accent transition-colors"
			>
				<div className="flex items-center justify-center size-9">
					<CheckIcon className={cn("scale-0 transition-all absolute", copied && "scale-100")} />
					<AgentLogo agent={agent} className={cn("scale-100 transition-all absolute", copied && "scale-0")} />
				</div>
				<span className="text-xs text-muted-foreground font-mono">
					{[command?.command, ...(command?.args ?? [])].join(" ")}
				</span>
			</button>
			<DropdownMenu>
				<DropdownMenuTrigger className="rounded-r-md hover:bg-accent transition-colors size-9 flex items-center justify-center">
					<ChevronDown className="size-4" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<AgentOption agent="pnpm" setAgent={setAgent} currentAgent={agent} />
					<AgentOption agent="npm" setAgent={setAgent} currentAgent={agent} />
					<AgentOption agent="yarn" setAgent={setAgent} currentAgent={agent} />
					<AgentOption agent="bun" setAgent={setAgent} currentAgent={agent} />
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
				<AgentLogo agent={agent} className="inline" />
				{agent}
			</span>
			{currentAgent === agent && <CheckIcon className="size-4" />}
		</DropdownMenuItem>
	);
}

function AgentLogo({ agent, className }: { agent: "pnpm" | "npm" | "yarn" | "bun"; className: string }) {
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
