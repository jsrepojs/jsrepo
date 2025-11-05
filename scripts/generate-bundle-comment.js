#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function removeAnsiCodes(str) {
	const ESC = String.fromCharCode(27);
	const ansiRegex = new RegExp(`${ESC}\\[[0-9;]*m`, 'g');
	return str.replace(ansiRegex, '');
}

function parseSizeString(sizeStr) {
	// Remove ANSI color codes
	const clean = removeAnsiCodes(sizeStr).trim();
	
	// Parse size string like "1.23 MB", "500 KB", "123 B"
	const match = clean.match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
	if (!match) return 0;

	const value = Number.parseFloat(match[1]);
	const unit = match[2].toUpperCase();

	switch (unit) {
		case 'B':
			return value;
		case 'KB':
			return value * 1024;
		case 'MB':
			return value * 1024 * 1024;
		case 'GB':
			return value * 1024 * 1024 * 1024;
		default:
			return 0;
	}
}

function parseBundleOutput(outputPath) {
	const output = readFileSync(outputPath, 'utf-8');
	const lines = output.split('\n');
	const results = [];
	let currentPackage = '';

	for (const line of lines) {
		// Check if this is a package name line (ends with :)
		// pnpm outputs: "packages/jsrepo:" or "@jsrepo/jsrepo:" etc.
		if (line.endsWith(':') && (line.includes('packages/') || line.includes('@'))) {
			currentPackage = line.slice(0, -1).trim();
			continue;
		}

		// Check if this is the "Total unpacked size:" line
		if (line.includes('Total unpacked size:')) {
			const match = line.match(/Total unpacked size:\s*(.+)/);
			if (match && currentPackage) {
				const sizeStr = match[1].trim();
				const sizeBytes = parseSizeString(sizeStr);
				
				// Extract package name from package.json if available
				let packageName = currentPackage;
				try {
					const packageJsonPath = join(rootDir, currentPackage, 'package.json');
					const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
					packageName = packageJson.name || packageName.split('/').pop() || packageName;
				} catch {
					// Fallback to directory name
					packageName = currentPackage.includes('/')
						? currentPackage.split('/').pop() || currentPackage
						: currentPackage;
				}
				
				results.push({
					name: packageName,
					size: sizeBytes,
					sizeStr: removeAnsiCodes(sizeStr),
				});
				currentPackage = '';
			}
		}
	}

	return results;
}

try {
	const outputPath = process.argv[2] || join(rootDir, 'bundle-output.txt');
	const results = parseBundleOutput(outputPath);

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
		// Use the original size string from output (already formatted)
		markdown += `| \`${result.name}\` | ${result.sizeStr} |\n`;
	}

	console.log(markdown);
} catch (error) {
	console.error('## 📦 Bundle Size Analysis\n\n⚠️ Failed to generate bundle analysis comment.');
	console.error(error.message);
	process.exit(1);
}
