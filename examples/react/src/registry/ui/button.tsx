import type React from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "@/registry/lib/utils";

export const buttonVariants = tv({
	base: "flex items-center rounded-md active:scale-98 transition-all",
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground",
			destructive: "bg-destructive text-destructive-foreground",
			outline: "border border-border hover:bg-accent",
		},
		size: {
			default: "h-8 px-2.5",
			sm: "h-7 px-2",
		},
	},
});

export type Variant = VariantProps<typeof buttonVariants>["variant"];
export type Size = VariantProps<typeof buttonVariants>["size"];

export function Button({
	variant = "default",
	size = "default",
    className,  
	...props
}: React.ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
	return <button {...props} className={cn(buttonVariants({ variant, size }), className)} />;
}
