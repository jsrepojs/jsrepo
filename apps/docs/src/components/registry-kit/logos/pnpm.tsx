import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

const PnpmLogo = (props: SVGProps<SVGSVGElement>) => (
	<>
		{/* Dark mode */}
		<svg
			{...props}
			className={cn("hidden dark:inline", props.className)}
			viewBox="76.58987244897958 44 164.00775510204068 164"
			preserveAspectRatio="xMidYMid meet"
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<path d="M237.6 95L187.6 95L187.6 45L237.6 45L237.6 95Z" id="b45vdTD8hs" />
				<path d="M182.59 95L132.59 95L132.59 45L182.59 45L182.59 95Z" id="a40WtxIl8d" />
				<path d="M127.59 95L77.59 95L77.59 45L127.59 45L127.59 95Z" id="h2CN9AEEpe" />
				<path d="M237.6 150L187.6 150L187.6 100L237.6 100L237.6 150Z" id="dqv5133G8" />
				<path d="M182.59 150L132.59 150L132.59 100L182.59 100L182.59 150Z" id="b1Lv79ypvm" />
				<path d="M182.59 205L132.59 205L132.59 155L182.59 155L182.59 205Z" id="hy1IZWwLX" />
				<path d="M237.6 205L187.6 205L187.6 155L237.6 155L237.6 205Z" id="akQfjxQes" />
				<path d="M127.59 205L77.59 205L77.59 155L127.59 155L127.59 205Z" id="bdSrwE5pk" />
			</defs>
			<g>
				<use href="#b45vdTD8hs" opacity="1" fill="#f9ad00" fillOpacity="1" />
			</g>
			<g>
				<use href="#a40WtxIl8d" opacity="1" fill="#f9ad00" fillOpacity="1" />
			</g>
			<g>
				<use href="#h2CN9AEEpe" opacity="1" fill="#f9ad00" fillOpacity="1" />
			</g>
			<g>
				<use href="#dqv5133G8" opacity="1" fill="#f9ad00" fillOpacity="1" />
			</g>
			<g>
				<use href="#b1Lv79ypvm" opacity="1" fill="#ffffff" fillOpacity="1" />
			</g>
			<g>
				<use href="#hy1IZWwLX" opacity="1" fill="#ffffff" fillOpacity="1" />
			</g>
			<g>
				<use href="#akQfjxQes" opacity="1" fill="#ffffff" fillOpacity="1" />
			</g>
			<g>
				<use href="#bdSrwE5pk" opacity="1" fill="#ffffff" fillOpacity="1" />
			</g>
		</svg>
		{/* Light mode */}
		<svg
			{...props}
			className={cn("inline dark:hidden", props.className)}
			viewBox="76.58987244897958 44 164.00775510204068 164"
			preserveAspectRatio="xMidYMid meet"
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<path d="M237.6 95L187.6 95L187.6 45L237.6 45L237.6 95Z" id="arNRoK435" />
				<path d="M182.59 95L132.59 95L132.59 45L182.59 45L182.59 95Z" id="a3H2WU7Px" />
				<path d="M127.59 95L77.59 95L77.59 45L127.59 45L127.59 95Z" id="b1DInM56vl" />
				<path d="M237.6 150L187.6 150L187.6 100L237.6 100L237.6 150Z" id="a7LFlgQIwu" />
				<path d="M182.59 150L132.59 150L132.59 100L182.59 100L182.59 150Z" id="amwLiZcuo" />
				<path d="M182.59 205L132.59 205L132.59 155L182.59 155L182.59 205Z" id="f3Peu5RWan" />
				<path d="M237.6 205L187.6 205L187.6 155L237.6 155L237.6 205Z" id="a6DXBfqPa" />
				<path d="M127.59 205L77.59 205L77.59 155L127.59 155L127.59 205Z" id="c1GWSTH1z7" />
			</defs>
			<g>
				<use href="#arNRoK435" opacity="1" fill="#f9ad00" fillOpacity="1" />
			</g>
			<g>
				<use href="#a3H2WU7Px" opacity="1" fill="#f9ad00" fillOpacity="1" />
			</g>
			<g>
				<use href="#b1DInM56vl" opacity="1" fill="#f9ad00" fillOpacity="1" />
			</g>
			<g>
				<use href="#a7LFlgQIwu" opacity="1" fill="#f9ad00" fillOpacity="1" />
			</g>
			<g>
				<use href="#amwLiZcuo" opacity="1" fill="#4e4e4e" fillOpacity="1" />
			</g>
			<g>
				<use href="#f3Peu5RWan" opacity="1" fill="#4e4e4e" fillOpacity="1" />
			</g>
			<g>
				<use href="#a6DXBfqPa" opacity="1" fill="#4e4e4e" fillOpacity="1" />
			</g>
			<g>
				<use href="#c1GWSTH1z7" opacity="1" fill="#4e4e4e" fillOpacity="1" />
			</g>
		</svg>
	</>
);

export { PnpmLogo };
