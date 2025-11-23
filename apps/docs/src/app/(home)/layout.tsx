import { HomeLayout } from "@/components/layout/home";
import { baseOptions } from "@/lib/layout.shared";

export default function Layout({ children }: LayoutProps<"/">) {
	return (
		<HomeLayout
			{...baseOptions()}
			links={[
				{
					text: <>Docs</>,
					url: "/docs",
				},
			]}
		>
			{children}
		</HomeLayout>
	);
}
