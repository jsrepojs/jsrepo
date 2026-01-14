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

	it('should parse multi-line environment variables', () => {
		const contents = dedent`
		MULTI_LINE="some
multi-line
variable"
		`;
		const envVars = parseEnvVariables(contents);
		expect(envVars).toEqual({
			MULTI_LINE: 'some\nmulti-line\nvariable\n',
		});
	});

	it('should parse variables with empty values', () => {
		const contents = dedent`
		EMPTY=
		KEY=value
		ANOTHER_EMPTY=
		`;
		const envVars = parseEnvVariables(contents);
		expect(envVars).toEqual({
			EMPTY: '',
			KEY: 'value',
			ANOTHER_EMPTY: '',
		});
	});

	it('should skip lines without equals signs', () => {
		const contents = dedent`
		VALID_KEY=value
		not a valid line
		ANOTHER_VALID=another_value
		also not valid
		`;
		const envVars = parseEnvVariables(contents);
		expect(envVars).toEqual({
			VALID_KEY: 'value',
			ANOTHER_VALID: 'another_value',
		});
	});

	it('should handle variables with whitespace in names and values', () => {
		const contents = dedent`
		KEY_WITH_SPACES = value with spaces
		ANOTHER_KEY=value with	tab
		`;
		const envVars = parseEnvVariables(contents);
		expect(envVars).toEqual({
			KEY_WITH_SPACES: ' value with spaces',
			ANOTHER_KEY: 'value with\ttab',
		});
	});

	it('should handle variables with special characters', () => {
		const contents = dedent`
		SPECIAL_CHARS="!@#$%^&*()_+-=[]{}|;:'",.<>?/"
		URL=https://example.com/path?query=value&other=test
		JSON={"key":"value","number":123}
		`;
		const envVars = parseEnvVariables(contents);
		expect(envVars).toEqual({
			SPECIAL_CHARS: '"!@#$%^&*()_+-=[]{}|;:\'",.<>?/"',
			URL: 'https://example.com/path?query=value&other=test',
			JSON: '{"key":"value","number":123}',
		});
	});

	it('should handle multi-line variables with only one line after opening quote', () => {
		const contents = dedent`
		SINGLE_LINE_MULTI="value"
		`;
		const envVars = parseEnvVariables(contents);
		expect(envVars).toEqual({
			SINGLE_LINE_MULTI: '"value"',
		});
	});

	it('should not parse comments', () => {
		const contents = dedent`
		# This is a comment
		SECRET_KEY=YOURSECRETKEYGOESHERE # also a comment
		SECRET_HASH="something-with-a-hash-#-this-is-not-a-comment"
		`;
		const envVars = parseEnvVariables(contents);
		expect(envVars).toEqual({
			SECRET_KEY: 'YOURSECRETKEYGOESHERE',
			SECRET_HASH: '"something-with-a-hash-#-this-is-not-a-comment"',
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

	it('should handle multi-line variables', () => {
		const contents = dedent`
		TEST="some
multi-line
variable
"
		`;
		const newContents = updateEnvFile(contents, {
			TEST: 'test4',
		});
		expect(newContents).toEqual(dedent`
		TEST="test4"
		`);
	});

	it('should update non-quoted variable and preserve format', () => {
		const contents = dedent`
		TEST=original_value
		OTHER=other_value
		`;
		const newContents = updateEnvFile(contents, {
			TEST: 'new_value',
		});
		expect(newContents).toEqual(dedent`
		TEST=new_value
		OTHER=other_value
		`);
	});

	it('should update quoted variable to multi-line value', () => {
		const contents = dedent`
		TEST="original"
		`;
		const newContents = updateEnvFile(contents, {
			TEST: 'new\nmulti\nline',
		});
		expect(newContents).toEqual(dedent`
		TEST="new
multi
line"
		`);
	});

	it('should update multi-line variable to another multi-line value', () => {
		const contents = dedent`
		TEST="old
value"
		`;
		const newContents = updateEnvFile(contents, {
			TEST: 'new\nvalue\nhere',
		});
		expect(newContents).toEqual(dedent`
		TEST="new
value
here"
		`);
	});

	it('should handle variables with special characters in values', () => {
		const contents = dedent`
		SPECIAL=original
		`;
		const newContents = updateEnvFile(contents, {
			SPECIAL: 'value=with=equals&special!chars',
		});
		expect(newContents).toEqual(dedent`
		SPECIAL=value=with=equals&special!chars
		`);
	});

	it('should add multiple new variables at once', () => {
		const contents = dedent`
		EXISTING=value
		`;
		const newContents = updateEnvFile(contents, {
			NEW1: 'value1',
			NEW2: 'value2',
			NEW3: 'value3',
		});
		expect(newContents).toEqual(dedent`
		EXISTING=value
		NEW1=value1
		NEW2=value2
		NEW3=value3
		`);
	});

	it('should handle updating variable at the beginning of file', () => {
		const contents = dedent`
		FIRST=first_value
		SECOND=second_value
		THIRD=third_value
		`;
		const newContents = updateEnvFile(contents, {
			FIRST: 'updated_first',
		});
		expect(newContents).toEqual(dedent`
		FIRST=updated_first
		SECOND=second_value
		THIRD=third_value
		`);
	});

	it('should handle updating variable at the end of file', () => {
		const contents = dedent`
		FIRST=first_value
		SECOND=second_value
		THIRD=third_value
		`;
		const newContents = updateEnvFile(contents, {
			THIRD: 'updated_third',
		});
		expect(newContents).toEqual(dedent`
		FIRST=first_value
		SECOND=second_value
		THIRD=updated_third
		`);
	});

	it('should handle updating multiple existing variables', () => {
		const contents = dedent`
		VAR1=value1
		VAR2=value2
		VAR3=value3
		`;
		const newContents = updateEnvFile(contents, {
			VAR1: 'new1',
			VAR2: 'new2',
			VAR3: 'new3',
		});
		expect(newContents).toEqual(dedent`
		VAR1=new1
		VAR2=new2
		VAR3=new3
		`);
	});

	it('should preserve original quote format when updating', () => {
		const contents = dedent`
		QUOTED="quoted_value"
		UNQUOTED=unquoted_value
		`;
		const newContents = updateEnvFile(contents, {
			QUOTED: 'new_quoted',
			UNQUOTED: 'new_unquoted',
		});
		expect(newContents).toEqual(dedent`
		QUOTED="new_quoted"
		UNQUOTED=new_unquoted
		`);
	});
});
