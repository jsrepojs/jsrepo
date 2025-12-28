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

	it('should parse multiline environment variables with backslash continuation', () => {
		const contents = 'MULTILINE=line1\\\nline2\\\nline3\nSIMPLE=single_line\n';
		const envVars = parseEnvVariables(contents);
		expect(envVars).toEqual({
			MULTILINE: 'line1\nline2\nline3',
			SIMPLE: 'single_line',
		});
	});

	it('should parse multiline environment variables with multiple continuation lines', () => {
		const contents = 'CERTIFICATE=-----BEGIN CERTIFICATE-----\\\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA\\\n-----END CERTIFICATE-----\nOTHER=value\n';
		const envVars = parseEnvVariables(contents);
		expect(envVars).toEqual({
			CERTIFICATE: '-----BEGIN CERTIFICATE-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA\n-----END CERTIFICATE-----',
			OTHER: 'value',
		});
	});

	it('should parse multiline environment variables with indentation', () => {
		const contents = 'MULTILINE=first line\\\n    second line with indent\\\nthird line\n';
		const envVars = parseEnvVariables(contents);
		expect(envVars).toEqual({
			MULTILINE: 'first line\nsecond line with indent\nthird line',
		});
	});

	it('should parse multiline environment variables at end of file', () => {
		const contents = 'MULTILINE=line1\\\nline2\\\nline3';
		const envVars = parseEnvVariables(contents);
		expect(envVars).toEqual({
			MULTILINE: 'line1\nline2\nline3',
		});
	});

	it('should handle multiline values with empty continuation lines', () => {
		const contents = 'MULTILINE=line1\\\n\nline3\n';
		const envVars = parseEnvVariables(contents);
		expect(envVars).toEqual({
			MULTILINE: 'line1\n\nline3',
		});
	});

	it('should parse multiline environment variables with quotes preserved', () => {
		const contents = 'QUOTED="value with quotes"\\\ncontinued\nREGULAR=normal\n';
		const envVars = parseEnvVariables(contents);
		expect(envVars).toEqual({
			QUOTED: '"value with quotes"\ncontinued',
			REGULAR: 'normal',
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
