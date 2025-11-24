"use client";

import Link from "next/link";
import { Button } from "./button";
import { GitHub } from "../logos/github";
import { useQuery } from "@tanstack/react-query";

export type GithubButtonProps = {
	repo: { owner: string; name: string };
	fallback: number;
};

type UnGhStarResponse = {
	totalStars: number;
};

export function GitHubButton({ repo, fallback }: GithubButtonProps) {
	const { data } = useQuery({
		queryKey: ["github", repo.owner, repo.name],
		queryFn: () =>
			fetch(`https://ungh.cc/stars/${repo.owner}/${repo.name}`).then(
				(res) => res.json() as Promise<UnGhStarResponse>
			),
	});

	return (
		<Button variant="ghost" asChild className="bg-background!">
			<Link href={`https://github.com/${repo.owner}/${repo.name}`} target="_blank">
				<GitHub className="size-4" />
				<span className="font-mono font-normal">{data?.totalStars ?? fallback}</span>
			</Link>
		</Button>
	);
}
