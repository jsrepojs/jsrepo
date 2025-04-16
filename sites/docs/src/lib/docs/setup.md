---
title: Setup
description: Setup jsrepo so you can install blocks.
lastUpdated: 4-10-2025
---

<script lang="ts">
    import { PMCommand } from "$lib/components/ui/pm-command"
    import { Snippet } from "$lib/components/ui/snippet"
</script>

## Installation

To get started with **jsrepo** we recommend installing it globally.

<PMCommand command="global" args={['jsrepo']}/>

## Initialization

> For this example we will be adding blocks from [github/ieedan/std](https://github.com/ieedan/std).

Now run:

```sh
jsrepo init github/ieedan/std
```

This will start the setup for `github/ieedan/std`.

```plaintext
┌   jsrepo  v1.47.0
│
◇  Please enter a default path to install the blocks
│  ./src/blocks
│
◇  Which formatter would you like to use?
│  Prettier
│
●  Initializing github/ieedan/std
│
◇  Fetched manifest from github/ieedan/std
│
◇  Which category paths would you like to configure?
│  ts
│
◇  Where should ts be added in your project?
│  ./src/blocks/ts
│
◇  Add another repo?
│  No
│
◇  Wrote config to `jsrepo.json`
│
└  All done!
```

Step through the prompts and configure:

- A default path to install blocks
- A formatter to use (optional)
- Where to install specific categories

Once complete **jsrepo** will generate a configured [jsrepo.json](/docs/jsrepo-json).

Now you can easily install blocks either by selecting them from a list or adding them by name:

```sh
jsrepo add ts/math # add by name

jsrepo add # add from list
```

## Maintaining Your Blocks

Once you have added blocks to your project you can easily modify the code to your own needs. But how should we handle keeping our code up to date with the source registry once the code has been modified?

Luckily for you **jsrepo** makes this process much less painful.

**jsrepo** provides a few different commands for managing differences between your code and the source registry:

- `update` - interactively update your blocks and see a file by file diff before accepting, rejecting, or allowing an LLM to make changes
- `test` - test your local code against the tests in the source registry

### Update

To update blocks you can run:

```sh
jsrepo update # choose from list

jsrepo update ts/math # update a specific block

jsrepo update --all # update all blocks
```

When a file has changed **jsrepo** will display a diff with the incoming change.

Below the diff you are given 3 options.

- Accept
- Reject
- ✨ Update with AI ✨

Hit `Accept` to immediately write the changes to the file, `Reject` to discard the changes and move on, or `✨ Update with AI ✨` to allow you to customize the way you want the file to be updated by prompting an LLM of your choice.

![The jsrepo update command diff tool](/docs/images/update-diff.png)

If a file is unchanged it will simply be skipped.

### Test

To test blocks you can run:

```sh
jsrepo test # test all blocks

jsrepo test ts/math # test a specific block
```

**jsrepo** will then pull the tests from the source registry and run them with [vitest](https://vitest.dev/) locally.
