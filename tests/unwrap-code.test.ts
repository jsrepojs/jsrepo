import { describe, expect, it } from 'vitest';
import { unwrapCodeFromQuotes } from '../src/utils/ai';

describe('unwrapCodeFromQuotes', () => {
	it('unwraps quoted code', () => {
		const code = `\`\`\`        
const thing = () => "hi";
\`\`\``;

		expect(unwrapCodeFromQuotes(code)).toBe('const thing = () => "hi";');
	});

	it('unwraps quoted code with language', () => {
		const code = `\`\`\`typescript        
const thing = () => "hi";
\`\`\``;

		expect(unwrapCodeFromQuotes(code)).toBe('const thing = () => "hi";');
	});

	it('unwraps only pre-quoted code', () => {
		const code = `\`\`\`       
const thing = () => "hi";`;

		expect(unwrapCodeFromQuotes(code)).toBe('const thing = () => "hi";');
	});
});
