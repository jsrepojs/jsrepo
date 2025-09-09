# jsrepo

> A CLI to add shared code from remote repositories.
 
Latest Version: 2.4.7

## Commands

### add
    
Add blocks to your project.

#### Usage
```bash
jsrepo add [options] [blocks...]
```

#### Options
- --formatter <choice>: The formatter to use when adding blocks. 
- --watermark <choice>: Include a watermark at the top of added files. 
- --tests <choice>: Include tests when adding blocks. 
- --docs <choice>: Include docs when adding blocks. 
- --paths <category=path,category=path>: The paths where categories should be added to your project. 
- -E, --expand: Expands the diff so you see the entire file. 
- --max-unchanged <number>: Maximum unchanged lines that will show without being collapsed. (default: 3)
- --repo <repo>: Repository to download the blocks from. 
- -A, --allow: Allow jsrepo to download code from the provided repo. 
- -y, --yes: Skip confirmation prompt. 
- --no-cache: Disable caching of resolved git urls. 
- --verbose: Include debug logs. 
- --cwd <path>: The current working directory. (default: ./)

### auth
    
Authenticate to jsrepo.com

#### Usage
```bash
jsrepo auth [options]
```

#### Options
- --logout: Execute the logout flow. 
- --token <token>: The token to use for authenticating to this service. 
- --cwd <path>: The current working directory. (default: ./)

### build
    
Builds the provided --dirs in the project root into a `jsrepo-manifest.json` file.

#### Usage
```bash
jsrepo build [options]
```

#### Options
- --dirs [dirs...]: The directories containing the blocks. 
- --output-dir <dir>: The directory to output the registry to. (Copies jsrepo-manifest.json + all required files) 
- --include-blocks [blockNames...]: Include only the blocks with these names. 
- --include-categories [categoryNames...]: Include only the categories with these names. 
- --exclude-blocks [blockNames...]: Do not include the blocks with these names. 
- --exclude-categories [categoryNames...]: Do not include the categories with these names. 
- --list-blocks [blockNames...]: List only the blocks with these names. 
- --list-categories [categoryNames...]: List only the categories with these names. 
- --do-not-list-blocks [blockNames...]: Do not list the blocks with these names. 
- --do-not-list-categories [categoryNames...]: Do not list the categories with these names. 
- --exclude-deps [deps...]: Dependencies that should not be added. 
- --allow-subdirectories: Allow subdirectories to be built. 
- --preview: Display a preview of the blocks list. 
- --include-docs: Include docs files (*.mdx, *.md) in the registry. 
- --no-output: Do not output a `jsrepo-manifest.json` file. 
- --verbose: Include debug logs. 
- --cwd <path>: The current working directory. (default: ./)

### exec
    
Execute a block as a script.

#### Usage
```bash
jsrepo exec [options] [script]
```

#### Options
- --repo <repo>: Repository to download and run the script from. 
- -A, --allow: Allow jsrepo to download code from the provided repo. 
- --no-cache: Disable caching of resolved git urls. 
- --verbose: Include debug logs. 
- --cwd <path>: The current working directory. (default: ./)

### info
    
Get info about a registry on jsrepo.com

#### Usage
```bash
jsrepo info [options] <registry>
```

#### Options
- --json: Output the response in formatted JSON. 

### init
    
Initializes your project with a configuration file.

#### Usage
```bash
jsrepo init [options] [registries...]
```

#### Options
- --repos [repos...]: Repository to install the blocks from. (DEPRECATED) 
- --no-watermark: Will not add a watermark to each file upon adding it to your project. 
- --tests: Will include tests with the blocks. 
- --docs: Will include docs with the blocks. 
- --formatter <formatter>: What formatter to use when adding or updating blocks. 
- --paths <category=path>,<category=path>: The paths to install the blocks to. (default: [object Object])
- --config-files <configFile=path>,<configFile=path>: The paths to install the config files to. (default: [object Object])
- -P, --project: Takes you through the steps to initialize a project. 
- -R, --registry: Takes you through the steps to initialize a registry. 
- --build-script <name>: The name of the build script. (For Registry setup) (default: build:registry)
- --publish-script <name>: The name of the publish script. (For Registry setup) (default: release:registry)
- -E, --expand: Expands the diff so you see the entire file. 
- --max-unchanged <number>: Maximum unchanged lines that will show without being collapsed. (default: 3)
- -y, --yes: Skip confirmation prompt. 
- --no-cache: Disable caching of resolved git urls. 
- --cwd <path>: The current working directory. (default: ./)

### mcp
    
Interact with jsrepo through an MCP server.

#### Usage
```bash
jsrepo mcp [options] [registry]
```

#### Options

### publish
    
Publish a registry to jsrepo.com.

#### Usage
```bash
jsrepo publish [options]
```

#### Options
- --private: When publishing the first version of the registry make it private. 
- --dry-run: Test the publish but don't list on jsrepo.com. 
- --name <name>: The name of the registry. i.e. @ieedan/std 
- --ver <version>: The version of the registry. i.e. 0.0.1 
- --dirs [dirs...]: The directories containing the blocks. 
- --include-blocks [blockNames...]: Include only the blocks with these names. 
- --include-categories [categoryNames...]: Include only the categories with these names. 
- --exclude-blocks [blockNames...]: Do not include the blocks with these names. 
- --exclude-categories [categoryNames...]: Do not include the categories with these names. 
- --list-blocks [blockNames...]: List only the blocks with these names. 
- --list-categories [categoryNames...]: List only the categories with these names. 
- --do-not-list-blocks [blockNames...]: Do not list the blocks with these names. 
- --do-not-list-categories [categoryNames...]: Do not list the categories with these names. 
- --exclude-deps [deps...]: Dependencies that should not be added. 
- --allow-subdirectories: Allow subdirectories to be built. 
- --include-docs: Include documentation files (*.md, *.mdx) in the registry. 
- --verbose: Include debug logs. 
- --cwd <path>: The current working directory. (default: ./)

### test
    
Tests local blocks against most recent remote tests.

#### Usage
```bash
jsrepo test [options] [blocks...]
```

#### Options
- --repo <repo>: Repository to download the blocks from. 
- -A, --allow: Allow jsrepo to download code from the provided repo. 
- --debug: Leaves the temp test file around for debugging upon failure. 
- --no-cache: Disable caching of resolved git urls. 
- --verbose: Include debug logs. 
- --cwd <path>: The current working directory. (default: ./)

### tokens
    
Provide a token for access to private repositories.

#### Usage
```bash
jsrepo tokens [options] [service]
```

#### Options
- --logout: Execute the logout flow. 
- --token <token>: The token to use for authenticating to this service. 
- --cwd <path>: The current working directory. (default: ./)

### update
    
Update blocks to the code in the remote repository.

#### Usage
```bash
jsrepo update [options] [blocks...]
```

#### Options
- --all: Update all installed components. 
- -E, --expand: Expands the diff so you see the entire file. 
- --max-unchanged <number>: Maximum unchanged lines that will show without being collapsed. (default: 3)
- -n, --no: Do update any blocks. 
- --repo <repo>: Repository to download the blocks from. 
- -A, --allow: Allow jsrepo to download code from the provided repo. 
- -y, --yes: Skip confirmation prompt. 
- --no-cache: Disable caching of resolved git urls. 
- --verbose: Include debug logs. 
- --cwd <path>: The current working directory. (default: ./)

