import { Button } from "./button";

export function ButtonExample() {
	return (
		<>
			<Button variant="default">Click me</Button>
			<Button variant="destructive" size="sm">
				Delete
			</Button>
		</>
	);
}
