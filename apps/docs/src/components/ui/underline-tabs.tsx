"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

function UnderlineTabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
	return (
		<TabsPrimitive.Root data-slot="underline-tabs" className={cn("flex flex-col gap-2", className)} {...props} />
	);
}

function UnderlineTabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
	return (
		<TabsPrimitive.List
			data-slot="underline-tabs-list"
			className={cn("flex items-end relative border-b h-9 w-fit", className)}
			{...props}
		/>
	);
}

function UnderlineTabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			data-slot="underline-tabs-trigger"
			className={cn(
				"inline-flex relative top-px h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 px-3 py-1 text-sm font-medium whitespace-nowrap transition-[color]",
				"dark:text-muted-foreground border-b-2 border-b-transparent border-transparent",
				"data-[state=active]:border-foreground dark:data-[state=active]:text-foreground",
				"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:outline-1",
				"disabled:pointer-events-none disabled:opacity-50",
				"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className
			)}
			{...props}
		/>
	);
}

function UnderlineTabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content
			data-slot="underline-tabs-content"
			className={cn("flex-1 outline-none", className)}
			{...props}
		/>
	);
}

export { UnderlineTabs, UnderlineTabsList, UnderlineTabsTrigger, UnderlineTabsContent };
