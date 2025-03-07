# jsrepo x next

An example of how to serve your registry from a Next.js app.

## Building the registry

```bash
pnpm build:registry
```

This will build the registry to the static folder under `./public/r`.

To test the registry run:
```bash
pnpm dev

jsrepo add http://localhost:3000/r/ui/button
```

In production your registry could be initialized by running:
```bash
jsrepo init https://your-domain.com/r
```