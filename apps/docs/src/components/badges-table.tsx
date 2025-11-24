"use client";

import React from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckIcon, CopyIcon, EllipsisIcon } from "lucide-react";
import { Button, buttonVariants } from "./ui/button";
import { Input } from "./ui/input";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { Label } from "@/components/ui/label";

type Props = {
	badges: { alt: string; hrefTemplate: string }[];
	defaultRegistry: string;
};

function buildBadgeUrl(template: string, registry: string) {
	return template.replace("{{registry}}", registry);
}

type RegistryContextType = {
    registry: string;
    setRegistry: (registry: string) => void;
}
export const RegistryContext = React.createContext<RegistryContextType>({
    registry: "",
    setRegistry: () => {},
});

export function useRegistry() {
    const ctx = React.useContext(RegistryContext);
    if (!ctx) throw new Error("RegistryContext not found");
    return ctx;
}

export function BadgesTable({ badges, defaultRegistry }: Props) {
    const [registry, setRegistry] = React.useState<string>(defaultRegistry);
    const ctx = React.useMemo(() => ({ registry, setRegistry }), [registry, setRegistry]);
	return (
		<RegistryContext value={ctx}>
            <Table>
			<TableHeader>
				<TableRow>
					<TableHead>Badge</TableHead>
					<TableHead></TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{badges.map((badge) => (
					<TableRow key={badge.alt}>
						<TableCell>
							<img
								src={buildBadgeUrl(badge.hrefTemplate, defaultRegistry)}
								alt={badge.alt}
								height={20}
								className="not-prose"
							/>
						</TableCell>
						<TableCell>
							<BadgeActions badge={badge} />
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
        </RegistryContext>
	);
}

export function BadgeActions({ badge }: { badge: { alt: string; hrefTemplate: string } }) {
	const [copy, isCopied] = useCopyToClipboard();
	const [copyUrl, isUrlCopied] = useCopyToClipboard();
    const { registry, setRegistry } = useRegistry();

	return (
		<Popover>
			<PopoverTrigger className={buttonVariants({ variant: "ghost" })}>
				<EllipsisIcon />
			</PopoverTrigger>
			<PopoverContent align="end">
				<div className="flex flex-col gap-2">
					<div className="flex flex-col gap-2">
						<Label>Registry</Label>
						<Input
							placeholder="@<scope>/<registry>"
							value={registry}
							onChange={(e) => setRegistry(e.target.value)}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label>Preview</Label>
						<div className="p-2 border rounded-md h-9">
							{registry === "" ? (
								<></>
							) : (
								<img
									src={buildBadgeUrl(badge.hrefTemplate, registry)}
									alt={badge.alt}
									height={20}
									className="not-prose"
								/>
							)}
						</div>
					</div>
					<Button
						variant="outline"
						className="w-full"
                        disabled={registry === ""}
						onClick={() => copyUrl(buildBadgeUrl(badge.hrefTemplate, registry))}
					>
						{isUrlCopied ? (
							<>
								<CheckIcon /> <span>Copied</span>
							</>
						) : (
							<>
								<CopyIcon /> <span>Copy URL</span>
							</>
						)}
					</Button>
					<Button
						variant="outline"
						className="w-full"
						disabled={registry === ""}
						onClick={() => copy(buildBadgeUrl(badge.hrefTemplate, registry))}
					>
						{isCopied ? (
							<>
								<CheckIcon /> <span>Copied</span>
							</>
						) : (
							<>
								<CopyIcon /> <span>Copy Markdown</span>
							</>
						)}
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
