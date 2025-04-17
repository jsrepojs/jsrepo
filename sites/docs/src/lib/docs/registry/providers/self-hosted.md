---
title: Self Hosted
description: How to self host your registry.
lastUpdated: 4-10-2025
---

You can host your registry on your own domain by serving it's assets statically.

This also allows you to customize where and how things are served in ways that aren't possible when serving from a git provider. Here's a few situations that self hosting makes sense:

- Serving multiple registries / registry variants
- Branding for your registry
- URL shortening

## Setup

To get started you need a way to serve your registry. This can be done with most web application frameworks by just serving the registry out of the corresponding static folder.

- SvelteKit - `/static`
- Next.js - `/public`
- Nuxt - `/public`
- Nitro - `/public`

Once you know where your static folder is you can use the `--output-dir` flag or the corresponding `outputDir` option in your `jsrepo-build-config.json` to build the registry and output it so it can be served from your static folder.

For this example let's host our registry on our site `example.com` at `/r`.

Build with flag:

```sh
jsrepo build --output-dir ./public/r
```

or with config option:

```jsonc showLineNumbers
{
	// ...
	"outputDir": "./public/r"
}
```

Once you have built your registry the manifest file and any assets that it needs should be copied into `/public/r`.

Now if you serve your site your registry should be accessible at `https://example.com/r`.

Users can now add blocks like so:

```sh
jsrepo add --repo https://example.com/r
```

## Multiple Registries

Since self hosting allows you to serve your registry from any path you can also serve multiple registries from the same domain.

For example say you had a JavaScript and TypeScript variant of your registry. You may want to serve them from `example.com/r/ts` and `example.com/r/js` respectively.

To do this you can adjust your build config to build each registry individually and pass a different path to the `--output-dir` flag for each registry.

```sh
jsrepo build --output-dir ./public/r/ts # ts

jsrepo build --output-dir ./public/r/js # js
```

Now users could access each registry like so:

```sh
jsrepo add --repo https://example.com/r/ts # ts

jsrepo add --repo https://example.com/r/js # js
```

## Private Registries

You can keep your self-hosted registries private only allowing authenticated users to access blocks.

Users can provide a token to the `auth` method or during initialization so that they can access the registry. This token will be passed using the Authorization header with the Bearer scheme.
