"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { useState } from "react";

export function Demo({ children }: { children: React.ReactNode }) {
	const [tab, setTab] = useState("preview");

	return (
		<Tabs value={tab} onValueChange={setTab}>
			{children}
		</Tabs>
	);
}

export function DemoActions({ children }: { children: React.ReactNode }) {
	return <div className="flex items-center gap-2">{children}</div>;
}

export function DemoTabs() {
	return (
		<TabsList>
			<TabsTrigger value="preview">Preview</TabsTrigger>
			<TabsTrigger value="code">Code</TabsTrigger>
		</TabsList>
	);
}

export function DemoPreview({ children }: { children: React.ReactNode }) {
	return (
		<TabsContent
			value="preview"
			className="flex justify-center min-h-[300px] border border-border rounded-md place-items-center"
		>
			{children}
		</TabsContent>
	);
}

export function DemoCode({ code }: { code: string }) {
	return (
		<TabsContent value="code" className="min-h-[300px] border border-border rounded-md">
			<DynamicCodeBlock lang="tsx" code={code}/>
		</TabsContent>
	);
}
