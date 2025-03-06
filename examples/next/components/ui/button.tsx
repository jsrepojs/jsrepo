import * as React from "react";
import { cn } from "@/lib/utils";

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
	({ className, ...props }, ref) => {
		return (
			<button
				ref={ref}
				className={cn("bg-red-500 text-white font-bold size-20 rounded-full", className)}
				{...props}
			/>
		);
	}
);
Button.displayName = "Button";

export { Button };
