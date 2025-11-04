import dedent from 'dedent';
import { describe, expect, it } from 'vitest';
import { parseEnvVariables, updateEnvFile } from '@/utils/env';

describe('parseEnvVariables', () => {
	it('should parse all the environment variables', () => {
		const contents = dedent`
		TEST=test
		TEST2=test2
		TEST3=test3
		`;
		const envVars = parseEnvVariables(contents);
		expect(envVars).toEqual({ TEST: 'test', TEST2: 'test2', TEST3: 'test3' });
	});

	it('should parse all the environment variables', () => {
		const contents = dedent`
		TEST=test
		TEST2=test2

		TEST3=test3
		`;
		const envVars = parseEnvVariables(contents);
		expect(envVars).toEqual({ TEST: 'test', TEST2: 'test2', TEST3: 'test3' });
	});

	it('should parse all the environment variables with quotes', () => {
		const contents = dedent`
		TEST="test"
		TEST2="test2"
        
		TEST3="test3"
		`;
		const envVars = parseEnvVariables(contents);
		expect(envVars).toEqual({ TEST: '"test"', TEST2: '"test2"', TEST3: '"test3"' });
	});

	it('should parse environment variables with equals signs in values', () => {
		const contents = dedent`
		KEY=value=with=equals
		CONNECTION_STRING=postgresql://user:pass@host:5432/db?param=value&other=test
		SIMPLE=normal_value
		`;
		const envVars = parseEnvVariables(contents);
		expect(envVars).toEqual({
			KEY: 'value=with=equals',
			CONNECTION_STRING: 'postgresql://user:pass@host:5432/db?param=value&other=test',
			SIMPLE: 'normal_value',
		});
	});
});

describe('updateEnvFile', () => {
	it('should update the env file', () => {
		const contents = dedent`
		TEST=test
		TEST2=test2
		TEST3=test3
		`;
		const newContents = updateEnvFile(contents, {
			TEST: 'test4',
			TEST2: 'test5',
			TEST3: 'test6',
			TEST4: 'test7',
		});
		expect(newContents).toEqual(dedent`
		TEST=test4
		TEST2=test5
		TEST3=test6
		TEST4=test7
		`);
	});

	it('should add variables to a blank env file', () => {
		const newContents = updateEnvFile('', {
			TEST4: 'test7',
		});
		expect(newContents).toEqual(dedent`
		TEST4=test7
		`);
	});

	it('should not overwrite already present variables', () => {
		const contents = dedent`
		TEST=test
		`;
		const newContents = updateEnvFile(contents, {
			TEST: '',
		});
		expect(newContents).toEqual(dedent`
		TEST=test
		`);
	});
});
