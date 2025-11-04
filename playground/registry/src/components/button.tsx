import React from 'react';
import { cn } from '../lib/utils';

export default function Button() {
	return (
		<button type="button" className={cn('bg-blue-500')}>
			Click me!
		</button>
	);
}
