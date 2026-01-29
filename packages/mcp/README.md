# @jsrepo/mcp

[![npm version](https://flat.badgen.net/npm/v/@jsrepo/mcp)](https://npmjs.com/package/@jsrepo/mcp)
[![npm downloads](https://flat.badgen.net/npm/dm/@jsrepo/mcp)](https://npmjs.com/package/@jsrepo/mcp)

The MCP server for **jsrepo**.

## Usage

You can automatically configure the MCP server for your environment by running the following command:

```sh
npx jsrepo config mcp
```

### Manual Configuration

JSON config (for Cursor, Claude Code, Antigravity):

```json
{
	"mcpServers": {
		"jsrepo": {
			"command": "npx",
			"args": ["@jsrepo/mcp"]
		}
	}
}
```

JSON config (for VS Code):

```json
{
	"servers": {
		"jsrepo": {
			"command": "npx",
			"args": ["@jsrepo/mcp"]
		}
	}
}
```

TOML config (for Codex):

```toml
[mcp_servers.jsrepo]
command = "npx"
args = ["@jsrepo/mcp"]
```

## Available Tools

| Tool   | Description                                       |
| ------ | ------------------------------------------------- |
| `add`  | Add a registry item or items to the users project |
| `view` | View a registry item                              |
