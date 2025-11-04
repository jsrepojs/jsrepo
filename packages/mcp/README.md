# @jsrepo/mcp

The MCP server for jsrepo.

## Usage

You can automatically configure the MCP server for your environment by running the following command:

```sh
npx jsrepo config mcp
```

### Manual Configuration

json config:

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

toml config:

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
