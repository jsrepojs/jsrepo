import { Demo, DemoCode, DemoPreview } from "./demo";

export function DemoExample() {
	return (
		<Demo>
			<DemoPreview>
				<div>Hello</div>
			</DemoPreview>
			<DemoCode>
				<div>Hello</div>
			</DemoCode>
		</Demo>
	);
}