"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { CheckIcon, CopyIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import fuzzysort from "fuzzysort";
import { Item, ItemActions, ItemContent } from "./ui/item";
import { Button } from "./ui";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

const RegistryIndexEntrySchema = z.object({
	name: z.string(),
	homepage: z.string(),
	url: z.string(),
	description: z.string(),
	logo: z.string(),
});

type RegistryIndexEntry = z.infer<typeof RegistryIndexEntrySchema>;

export function RegistryDirectory() {
	const [search, setSearch] = useState("");
	const query = useQuery({
		queryKey: ["registry-index"],
		queryFn: async () => {
			try {
				const response = await fetch(
					"https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/directory.json"
				);

				if (!response.ok) {
					return [];
				}

				return (await response.json()) as RegistryIndexEntry[];
			} catch {
				return [];
			}
		},
		staleTime: 1000 * 60 * 60 * 6, // 6 hours
		refetchOnMount: false,
		refetchOnWindowFocus: false,
	});

	const filteredItems =
		search.trim().length > 0
			? fuzzysort
					.go(search, query.data ?? [], {
						keys: ["name", "description"],
					})
					.map((res) => res.obj)
			: query.data ?? [];

	return (
		<div className="flex flex-col gap-2">
			<InputGroup>
				<InputGroupAddon>
					<SearchIcon />
				</InputGroupAddon>
				<InputGroupInput placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
				{search.trim().length > 0 && (
					<InputGroupAddon align="inline-end">
						<span>
							{filteredItems.length} {filteredItems.length === 1 ? "result" : "results"}
						</span>
					</InputGroupAddon>
				)}
			</InputGroup>
			<div className="flex flex-col gap-2 not-prose">
				{filteredItems.map((registry) => (
					<Registry registry={registry} />
				))}
			</div>
		</div>
	);
}

function Registry({ registry }: { registry: RegistryIndexEntry }) {
	const [copyInit, initCopied] = useCopyToClipboard(1500);
	return (
		<Item className="bg-card border border-border">
			<ItemContent>
				<div className="flex place-items-center gap-3">
					<div className="size-8 overflow-hidden rounded-md">
						{registry.logo && (
							<span
								className="[&_svg]:size-8 fill-current"
								dangerouslySetInnerHTML={{ __html: registry.logo }}
							/>
						)}
					</div>
					<h3 className="text-2xl font-medium">{registry.name}</h3>
				</div>
				<p className="text-muted-foreground">{registry.description}</p>
			</ItemContent>
			<ItemActions>
				<Button variant="outline" size="sm" onClick={() => copyInit(`jsrepo init shadcn:${registry.name}`)}>
					{initCopied ? <CheckIcon /> : <CopyIcon />}
					Copy Init
				</Button>
			</ItemActions>
		</Item>
	);
}
