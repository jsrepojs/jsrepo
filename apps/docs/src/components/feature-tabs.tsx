"use client";

import { cn } from "@/lib/utils";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type FeatureTabsContext = {
	activeTab: string;
	setActiveTab: (tab: string, fromUser?: boolean) => void;
	tabs: { value: string; duration: number }[];
	registerTab: (tab: { value: string; duration: number }) => void;
	mode: "auto" | "manual";
};

const FeatureTabsContext = createContext<FeatureTabsContext>({
	activeTab: "",
	setActiveTab: () => {},
	tabs: [],
	registerTab: () => {},
	mode: "auto",
});

function useFeatureTabs() {
	const ctx = useContext(FeatureTabsContext);
	if (!ctx) throw new Error("FeatureTabsContext not found");
	return ctx;
}

function FeatureTabs({
	defaultValue,
	className,
	children,
	subClassName,
	...props
}: React.HTMLAttributes<HTMLDivElement> & { defaultValue: string; subClassName?: string }) {
	const [activeTab, setActiveTab] = useState(defaultValue);
	const [mode, setMode] = useState<"auto" | "manual">("auto");
	const [tabs, setTabs] = useState<{ value: string; duration: number }[]>([]);
	function registerTab(tab: { value: string; duration: number }) {
		setTabs((prev) => [...prev, tab]);
	}
	function _setActiveTab(tab: string, fromUser: boolean = false) {
		if (fromUser) {
			setMode("manual");
		}
		setActiveTab(tab);
	}
	const ctx = useMemo(
		() => ({ activeTab, setActiveTab: _setActiveTab, tabs, registerTab, mode }),
		[activeTab, tabs, mode]
	);
	useEffect(() => {
		if (mode === "manual" || tabs.length === 0) return;

		const t = tabs.map((tab, i) => ({ tab, index: i })).find(({ tab }) => tab.value === activeTab);
		if (!t) return;

		const { index, tab } = t;
		const timeoutId = setTimeout(() => {
			if (index + 1 === tabs.length) {
				_setActiveTab(tabs[0].value, false);
			} else {
				_setActiveTab(tabs[index + 1].value, false);
			}
		}, tab.duration);

		return () => clearTimeout(timeoutId);
	}, [activeTab, mode, tabs]);
	return (
		<FeatureTabsContext value={ctx}>
			<div
				className={cn("flex items-center justify-center w-full border-y border-border px-6", className)}
				{...props}
			>
				<div className={cn("max-w-6xl flex flex-col md:grid md:grid-cols-2 w-full", subClassName)}>
					{children}
				</div>
			</div>
		</FeatureTabsContext>
	);
}

function FeatureTabsList({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"flex flex-col md:h-[368px] border-l border-r border-border md:border-r-none w-full",
				className
			)}
			{...props}
		>
			{children}
		</div>
	);
}

function FeatureTabsTrigger({
	value,
	duration,
	description,
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLButtonElement> & { value: string; duration: number; description: string }) {
	const { registerTab, setActiveTab, activeTab } = useFeatureTabs();

	// we don't want to re-register the tab if the value changes
	useEffect(() => {
		registerTab({ value, duration });
	}, []);

	return (
		<>
			<button
				type="button"
				data-value={value}
				data-state={activeTab === value ? "active" : "inactive"}
				className={cn(
					"py-4 px-6 first:border-t-0 transition-all duration-700 border-b md:border-b-transparent border-border md:data-[state=active]:border-b-border md:border-t group w-full flex items-center gap-4",
					className
				)}
				onClick={() => setActiveTab(value, true)}
				{...props}
			>
				<div className="size-6 border p-1">
					<div className="size-full group-hover:bg-primary/50 group-data-[state=active]:bg-primary transition-colors duration-300"></div>
				</div>
				{children}
			</button>
			<div
				data-state={activeTab === value ? "active" : "inactive"}
				className={cn(
					"hidden md:block border-border group bg-fd-card px-6 [--radix-accordion-content-height:137px] duration-300",
					"h-0 data-[state=inactive]:py-0 data-[state=active]:py-4 data-[state=inactive]:h-0 data-[state=active]:h-[137px] data-[state=inactive]:animate-accordion-up data-[state=active]:animate-accordion-down"
				)}
			>
				<p className="text-start text-muted-foreground group-data-[state=inactive]:hidden">{description}</p>
			</div>
		</>
	);
}

function FeatureTabsContent({
	value,
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
	const { activeTab } = useFeatureTabs();
	return activeTab !== value ? (
		<></>
	) : (
		<div
			className={cn(
				"border border-border border-t-0 md:border-l-0 md:border-y-0 w-full bg-card",
				className
			)}
			{...props}
		>
			{children}
		</div>
	);
}

export { FeatureTabs, FeatureTabsList, FeatureTabsTrigger, FeatureTabsContent };
