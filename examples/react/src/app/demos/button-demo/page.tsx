import { Button } from '@/registry/ui/button';

export default function ButtonDemoPage() {
	return (
		<>
			<div className="flex place-items-center gap-2">
				<Button variant="default">Click me</Button>
				<Button variant="destructive">Click me</Button>
				<Button variant="outline">Click me</Button>
			</div>
			<div className="flex place-items-end gap-2">
				<Button variant="default" size="sm">
					Sm
				</Button>
				<Button variant="default" size="default">
					Md
				</Button>
			</div>
		</>
	);
}
