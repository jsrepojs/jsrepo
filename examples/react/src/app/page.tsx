import { Button } from '@/registry/ui/button';

export default function Home() {
	return (
		<main className="min-h-screen flex flex-col gap-4 items-center justify-center bg-background">
			<h1 className="text-4xl font-bold">@example/react</h1>
			<Button>Click me</Button>
		</main>
	);
}
