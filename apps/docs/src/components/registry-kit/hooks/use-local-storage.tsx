"use client";

import * as React from "react";

export const AGENTS = ["pnpm", "npm", "yarn", "bun"] as const;

export type Agent = (typeof AGENTS)[number];

const STORAGE_KEY = "jsrepo-agent-selection";

function getStoredAgent(fallback: Agent): Agent | null {
	if (typeof window === "undefined") return fallback;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored && AGENTS.includes(stored as Agent)) {
			return stored as Agent;
		}
	} catch {
		// localStorage might be disabled or unavailable
	}
	return fallback;
}

export function useAgentSelection(fallback: Agent = "pnpm"): [Agent, (agent: Agent) => void] {
	const [agent, setAgentState] = React.useState<Agent>(fallback);

	React.useEffect(() => {
		const stored = getStoredAgent(fallback);
		if (stored) {
			setAgentState(stored);
		}
	}, []);

	const setAgent = React.useCallback(
		(newAgent: Agent) => {
			setAgentState(newAgent);
			if (typeof window !== "undefined") {
				try {
					localStorage.setItem(STORAGE_KEY, newAgent);
				} catch {
					// localStorage might be disabled or unavailable
				}
			}
		},
		[]
	);

	return [agent, setAgent];
}

