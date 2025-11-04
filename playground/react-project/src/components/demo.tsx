import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { ComponentProps, useState } from "react";

export function Demo({ className, ...props }: ComponentProps<typeof Tabs>): React.ReactElement {
	const [tab, setTab] = useState("preview");

	return (
		<Tabs value={tab} onValueChange={setTab} className={className} {...props}>
			<TabsList>
				<TabsTrigger value="preview">Preview</TabsTrigger>
				<TabsTrigger value="code">Code</TabsTrigger>
			</TabsList>
            {props.children}
		</Tabs>
	);
}

export function DemoPreview({ className, ...props }: Omit<ComponentProps<typeof TabsContent>, 'value'>): React.ReactElement {
	return (
		<TabsContent value="preview" className={className} {...props}>
			{props.children}
		</TabsContent>
	);
}

export function DemoCode({ className, ...props }: Omit<ComponentProps<typeof TabsContent>, 'value'>): React.ReactElement {
	return (
		<TabsContent value="code" className={className} {...props}>
			{props.children}
		</TabsContent>
	);
}
