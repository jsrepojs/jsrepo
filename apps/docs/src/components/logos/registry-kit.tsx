import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

const RegistryKit = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
	<svg
		{...props}
		className={cn(className)}
		viewBox="0 0 96 96"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<g clip-path="url(#clip0_437_28)">
			<path
				d="M42.144 93V3.39999H59.68V41.16H60.32L76.32 3.39999H94.368L75.68 46.152L95.264 93H75.808L60.576 53.832H59.68V93H42.144Z"
				className="fill-black dark:fill-white"
			/>
			<path
				d="M6.144 3.39999H40.192C45.568 5.192 50.1333 8.52 53.888 13.384C57.728 18.1627 59.648 24.0507 59.648 31.048C59.648 42.4827 55.1253 50.888 46.08 56.264L59.008 93H41.088L30.208 60.36H23.424V93H6.144V3.39999ZM23.424 18.76V46.024H34.432C35.8827 45.6827 37.4613 44.232 39.168 41.672C40.96 39.0267 41.856 35.9547 41.856 32.456C41.856 28.9573 41.088 25.8853 39.552 23.24C38.1013 20.5947 36.6507 19.1013 35.2 18.76H23.424Z"
				fill="#F0DB4F"
			/>
		</g>
	</svg>
);

export { RegistryKit };
