#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function formatSize(bytes) {
	if (bytes >= 1024 * 1024) {
		const mb = bytes / (1024 * 1024);
		return `${mb.toFixed(2)} MB`;
	}
	if (bytes >= 1024) {
		const kb = bytes / 1024;
		return `${kb.toFixed(2)} KB`;
	}
	return `${bytes} B`;
}

function analyzePackages() {
	const packagesDir = join(rootDir, 'packages');
	const results = [];

	try {
		const entries = readdirSync(packagesDir, { withFileTypes: true });

		for (const entry of entries) {
			if (!entry.isDirectory()) continue;

			const packagePath = join(packagesDir, entry.name);
			const packageJsonPath = join(packagePath, 'package.json');

			try {
				if (!statSync(packageJsonPath).isFile()) continue;

				const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
				const packageName = packageJson.name || entry.name;

				// Run bundle analyzer
				try {
					const output = execSync(
						`node bundle-analyzer/dist/index.js analyze "${packagePath}" --json`,
						{ encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
					);
					const sizeData = JSON.parse(output.trim());
					if (sizeData.size !== undefined) {
						results.push({
							name: packageName,
							size: sizeData.size,
						});
					}
				} catch (error) {
					// Skip packages that fail to analyze
					console.error(`Failed to analyze ${packageName}: ${error.message}`);
				}
			} catch {
                // do nothing
            }
		}
	} catch (error) {
		throw new Error(`Failed to read packages directory: ${error.message}`);
	}

	return results;
}

try {
	const results = analyzePackages();

	if (results.length === 0) {
		console.log('## 📦 Bundle Size Analysis\n\n⚠️ No bundle analysis results found.');
		process.exit(0);
	}

	// Sort by size descending
	results.sort((a, b) => b.size - a.size);

	let markdown = '## 📦 Bundle Size Analysis\n\n';
	markdown += '| Package | Unpacked Size |\n';
	markdown += '|---------|---------------|\n';

	for (const result of results) {
		const sizeStr = formatSize(result.size);
		markdown += `| \`${result.name}\` | ${sizeStr} |\n`;
	}

	console.log(markdown);
} catch (error) {
	console.error('## 📦 Bundle Size Analysis\n\n⚠️ Failed to generate bundle analysis comment.');
	console.error(error.message);
	process.exit(1);
}
