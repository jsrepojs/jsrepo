# jsrepo x sveltekit

An example of how to serve your registry from a SvelteKit app.

## Building the registry

```bash
pnpm build:registry
```

This will build the registry to the static folder under `./static/r`.

To test the registry run:
```bash
pnpm dev

jsrepo add http://localhost:5173/r/ui/button
```

In production your registry could be initialized by running:
```bash
jsrepo init https://your-domain.com/r
```