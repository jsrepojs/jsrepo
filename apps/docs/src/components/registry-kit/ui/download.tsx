import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DownloadIcon } from "lucide-react";
import React from "react";

export function Download({
	item,
	registry,
	className,
	...props
}: React.ComponentProps<"a"> & { item: string; registry: string; className?: string }) {
	return (
		<a
			{...props}
			className={cn(
				buttonVariants({ variant: "outline" }),
				"not-prose border border-border! bg-background!",
				className
			)}
			download={`${item}.zip`}
			href={`https://jsrepo.com/api/scopes/${registry}/v/latest/items/${item}/download`}
		>
			<DownloadIcon />
			Download
		</a>
	);
}
