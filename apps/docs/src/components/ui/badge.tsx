import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { BadgeCheckIcon, CodeIcon, SettingsIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

import { cn } from "@/lib/utils";

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
			href={new URL(path, "https://github.com/jsrepojs/jsrepo/blob/main/").toString()}
			className="flex place-items-center justify-center not-prose"
		>
			<Badge variant="secondary" className={cn("text-muted-foreground", className)} {...props}>
				<span>Source</span>
				<CodeIcon className="size-3" />
			</Badge>
		</a>
	);
}

function OfficialBadge({ className, ...props }: Omit<React.ComponentProps<typeof Badge>, "variant">) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Badge variant="secondary" className={cn("text-muted-foreground cursor-default", className)} {...props}>
					<span>Official</span>
					<BadgeCheckIcon className="size-3" />
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
					<span>Default</span>
					<SettingsIcon className="size-3" />
				</Badge>
			</TooltipTrigger>
			<TooltipContent>
				<p>Works with zero config.</p>
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

export { Badge, badgeVariants, SourceBadge, OfficialBadge, DefaultBadge, BadgeGroup };
