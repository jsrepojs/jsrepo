"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { BadgeCheckIcon, CodeIcon, Download, SettingsIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

const badgeVariants = cva(
	"inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
	{
		variants: {
			variant: {
				default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
				secondary: "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
				destructive:
					"border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
				outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
);

function Badge({
	className,
	variant,
	asChild = false,
	...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : "span";

	return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

function SourceBadge({
	path,
	className,
	...props
}: Omit<React.ComponentProps<typeof Badge>, "variant"> & {
	/**
	 * The path to the source file. Relative to the root of the project.
	 */
	path: string;
}) {
	return (
		<a
			href={new URL(path, "https://github.com/jsrepojs/jsrepo/blob/next/").toString()}
			className="flex place-items-center justify-center not-prose"
		>
			<Badge variant="secondary" className={cn("text-muted-foreground", className)} {...props}>
				<CodeIcon className="size-3" />
				<span>Source</span>
			</Badge>
		</a>
	);
}

function OfficialBadge({ className, ...props }: Omit<React.ComponentProps<typeof Badge>, "variant">) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Badge variant="secondary" className={cn("text-muted-foreground cursor-default", className)} {...props}>
					<BadgeCheckIcon className="size-3" />
					<span>Official</span>
				</Badge>
			</TooltipTrigger>
			<TooltipContent>
				<p>Officially supported by the jsrepo team.</p>
			</TooltipContent>
		</Tooltip>
	);
}

function DefaultBadge({ className, ...props }: Omit<React.ComponentProps<typeof Badge>, "variant">) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Badge variant="secondary" className={cn("text-muted-foreground cursor-default", className)} {...props}>
					<SettingsIcon className="size-3" />
					<span>Default</span>
				</Badge>
			</TooltipTrigger>
			<TooltipContent>
				<p>Works with zero config.</p>
			</TooltipContent>
		</Tooltip>
	);
}

type DownloadsResponse = {
	downloads: number;
	start: string;
	end: string;
	package: string;
};

function NpmBadge({
	packageName,
	className,
	...props
}: Omit<React.ComponentProps<typeof Badge>, "variant"> & { packageName: string }) {
	const query = useQuery({
		queryKey: ["npm", packageName],
		queryFn: async () => {
			try {
				const response = await fetch(`https://api.npmjs.org/downloads/point/last-month/${packageName}`);

				if (!response.ok) {
					return 0;
				}

				const data = (await response.json()) as DownloadsResponse;

				return data.downloads;
			} catch {
				return 0;
			}
		},
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
		refetchOnMount: false,
		refetchOnWindowFocus: false,
	});

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<a
					href={`https://npmjs.com/package/${packageName}`}
					className="flex place-items-center justify-center not-prose"
				>
					<Badge variant="secondary" className={cn("text-muted-foreground", className)} {...props}>
						<Download className="size-3" />
						<span>{query.data ?? 0}/month</span>
					</Badge>
				</a>
			</TooltipTrigger>
			<TooltipContent>
				<p>Available on npm.</p>
			</TooltipContent>
		</Tooltip>
	);
}

function BadgeGroup({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<TooltipProvider>
			<div {...props} className={cn("flex place-items-center gap-1 mb-8", className)} data-slot="badge-group" />
		</TooltipProvider>
	);
}

export { Badge, badgeVariants, SourceBadge, OfficialBadge, DefaultBadge, BadgeGroup, NpmBadge };
