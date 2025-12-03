"use client";

import { RootProvider } from "fumadocs-ui/provider/next";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useScrollToTop } from "@/hooks/use-scroll-to-top";

export function App({ children }: { children: React.ReactNode }) {
	useScrollToTop();
	const [queryClient] = useState(() => new QueryClient());

	return (
		<QueryClientProvider client={queryClient}>
			<RootProvider>{children}</RootProvider>
		</QueryClientProvider>
	);
}

