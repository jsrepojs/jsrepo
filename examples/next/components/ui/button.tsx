import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	className?: string;
	children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ className, children, ...props }) => {
	return (
		<button className={cn("bg-red-500 text-white font-bold size-20 rounded-full", className)} {...props}>
			{children}
		</button>
	);
};

export default Button;
