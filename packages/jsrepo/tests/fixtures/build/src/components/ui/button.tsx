import type React from 'react';

export function Button(props: React.ComponentProps<'button'>) {
	return <button {...props}>Click me</button>;
}
